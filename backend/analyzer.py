"""
Core analysis orchestrator.
Ties together: parser → LLM Pass 1 → LLM Pass 2 → aggregate summary.
"""
import asyncio
import logging
import uuid
from collections import Counter

from models import (
    AnalysisResult,
    ClauseAnalysis,
    ClauseExtraction,
    Jurisdiction,
    OverallSummary,
    RiskLevel,
)
from parser import extract_text, strip_boilerplate, chunk_text
from llm_client import extract_clauses, explain_clauses_parallel

logger = logging.getLogger(__name__)


def _compute_overall_risk(clauses: list[ClauseAnalysis]) -> tuple[int, RiskLevel]:
    """
    Compute aggregate risk score from individual clause scores.
    Weights high-risk clauses more heavily.
    """
    if not clauses:
        return 1, RiskLevel.LOW

    scores = [c.risk_score for c in clauses]
    # Weighted: top clause gets double weight
    scores_sorted = sorted(scores, reverse=True)
    if len(scores_sorted) >= 2:
        weighted = (scores_sorted[0] * 2 + sum(scores_sorted[1:])) / (len(scores_sorted) + 1)
    else:
        weighted = scores_sorted[0]

    overall = round(weighted)
    if overall >= 7:
        label = RiskLevel.HIGH
    elif overall >= 4:
        label = RiskLevel.MEDIUM
    else:
        label = RiskLevel.LOW

    return overall, label


def _build_summary(clauses: list[ClauseAnalysis], risk_score: int, risk_label: RiskLevel) -> OverallSummary:
    """Build the top-level summary with top 3 renegotiation points."""
    # Sort by risk_score descending, take top 3
    top_clauses = sorted(clauses, key=lambda c: c.risk_score, reverse=True)[:3]
    top_concerns = [
        f"{c.clause_type.value.replace('_', ' ').title()}: {c.negotiation_suggestion[:100]}"
        for c in top_clauses
        if c.risk_level != RiskLevel.LOW
    ]

    # Fallback if all low risk
    if not top_concerns:
        top_concerns = ["No major concerns found. Standard contract terms detected."]

    risk_word = {RiskLevel.LOW: "low-risk", RiskLevel.MEDIUM: "moderate-risk", RiskLevel.HIGH: "high-risk"}[risk_label]
    one_liner = (
        f"This contract is {risk_word} (score {risk_score}/10). "
        f"{len([c for c in clauses if c.risk_level == RiskLevel.HIGH])} high-risk clause(s) need attention."
    )

    return OverallSummary(
        risk_score=risk_score,
        risk_label=risk_label,
        top_concerns=top_concerns[:3],
        one_liner=one_liner,
    )


def _deduplicate_extractions(extractions: list[ClauseExtraction]) -> list[ClauseExtraction]:
    """
    Remove duplicate clauses (same type + very similar text) across chunks.
    Keeps the higher-risk version.
    """
    seen: dict[str, ClauseExtraction] = {}
    for ext in extractions:
        key = ext.clause_type.value
        # Simple dedup: if we've seen this clause type, keep higher risk
        if key not in seen:
            seen[key] = ext
        else:
            risk_order = {RiskLevel.LOW: 0, RiskLevel.MEDIUM: 1, RiskLevel.HIGH: 2}
            if risk_order[ext.risk_level] > risk_order[seen[key].risk_level]:
                seen[key] = ext
    return list(seen.values())


async def analyze_document(
    file_bytes: bytes,
    filename: str,
    jurisdiction: Jurisdiction,
) -> AnalysisResult:
    """
    Full pipeline: file → text → chunks → Pass1 → Pass2 → result.
    """
    analysis_id = str(uuid.uuid4())
    logger.info(f"[{analysis_id}] Starting analysis: {filename}, jurisdiction={jurisdiction.value}")

    # Step 1: Parse document
    raw_text = extract_text(file_bytes, filename)
    logger.info(f"[{analysis_id}] Extracted {len(raw_text)} chars from {filename}")

    # Step 2: Strip boilerplate (saves tokens)
    cleaned_text = strip_boilerplate(raw_text)
    logger.info(f"[{analysis_id}] After boilerplate strip: {len(cleaned_text)} chars ({100 - round(len(cleaned_text)/len(raw_text)*100)}% removed)")

    # Step 3: Chunk for LLM
    chunks = chunk_text(cleaned_text, max_chunk_chars=4000)
    logger.info(f"[{analysis_id}] Split into {len(chunks)} chunks")

    # Step 4: Pass 1 — extract clauses from all chunks (parallel)
    pass1_tasks = [extract_clauses(chunk) for chunk in chunks]
    all_extractions_nested = await asyncio.gather(*pass1_tasks)
    all_extractions: list[ClauseExtraction] = []
    for batch in all_extractions_nested:
        all_extractions.extend(batch)

    # Deduplicate across chunks
    unique_extractions = _deduplicate_extractions(all_extractions)
    total_found = len(unique_extractions)
    logger.info(f"[{analysis_id}] Pass 1 found {total_found} unique clauses")

    # Step 5: Pass 2 — only explain medium/high risk clauses
    flagged = [e for e in unique_extractions if e.risk_level != RiskLevel.LOW]
    logger.info(f"[{analysis_id}] Pass 2: explaining {len(flagged)} flagged clauses")

    if flagged:
        analyses = await explain_clauses_parallel(flagged, jurisdiction)
    else:
        analyses = []

    # Also add low-risk clauses with minimal info (no LLM call needed)
    low_risk = [
        ClauseAnalysis(
            clause_type=e.clause_type,
            original_text=e.text,
            risk_level=RiskLevel.LOW,
            risk_score=2,
            plain_english="This is a standard clause with no unusual terms.",
            why_risky="No significant risk identified.",
            negotiation_suggestion="No changes needed.",
        )
        for e in unique_extractions
        if e.risk_level == RiskLevel.LOW
    ]
    all_clauses = analyses + low_risk

    # Step 6: Build summary
    risk_score, risk_label = _compute_overall_risk(all_clauses)
    summary = _build_summary(all_clauses, risk_score, risk_label)

    logger.info(f"[{analysis_id}] Analysis complete. Overall risk: {risk_score}/10 ({risk_label.value})")

    return AnalysisResult(
        analysis_id=analysis_id,
        document_name=filename,
        jurisdiction=jurisdiction,
        total_clauses_found=total_found,
        flagged_clauses=len(flagged),
        clauses=all_clauses,
        summary=summary,
        share_url=None,  # Set by API layer after Supabase storage
    )
