"""
LLM client for ClauseGuard.
Handles two-pass analysis:
  Pass 1 — cheap clause extraction + classification (JSON output)
  Pass 2 — per-clause risk explanation + negotiation suggestion (JSON output)

Uses APMIX (DeepSeek-compatible OpenAI API format).
"""
import json
import logging
import asyncio
from typing import Any

import httpx

from config import get_settings
from models import ClauseType, ClauseExtraction, ClauseAnalysis, RiskLevel, Jurisdiction

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Few-shot examples loaded from data/clause_examples.json ───────────────────
import json as _json
from pathlib import Path

_EXAMPLES_PATH = Path(__file__).parent.parent / "data" / "clause_examples.json"

def _load_few_shot_examples(clause_type: str, jurisdiction: str, n: int = 2) -> list[dict]:
    """Load relevant few-shot examples for a given clause type."""
    try:
        examples = _json.loads(_EXAMPLES_PATH.read_text(encoding="utf-8"))
        # Filter by clause type, prefer matching jurisdiction, fallback to generic
        filtered = [
            e for e in examples
            if e.get("type") == clause_type
            and e.get("jurisdiction") in (jurisdiction, "generic")
        ]
        return filtered[:n]
    except Exception:
        return []


# ── HTTP client ────────────────────────────────────────────────────────────────

def _build_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=settings.apmix_base_url,
        headers={
            "Authorization": f"Bearer {settings.apmix_api_key}",
            "Content-Type": "application/json",
        },
        timeout=60.0,
    )


async def _llm_call(messages: list[dict], max_tokens: int = 1024) -> str:
    """
    Make a single LLM call. Returns raw string content.
    Retries once on failure.
    """
    payload = {
        "model": settings.apmix_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.1,  # Low temp for consistent structured output
        "response_format": {"type": "json_object"},
    }

    for attempt in range(2):  # 1 retry
        try:
            async with _build_client() as client:
                resp = await client.post("/chat/completions", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP error (attempt {attempt+1}): {e.response.status_code} — {e.response.text}")
            if attempt == 1:
                raise
            await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"LLM call error (attempt {attempt+1}): {e}")
            if attempt == 1:
                raise
            await asyncio.sleep(1)


def _parse_json_safe(raw: str, fallback: Any = None) -> Any:
    """Parse JSON from LLM output, with fallback."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON block if surrounded by markdown
        import re
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        logger.warning(f"Could not parse LLM JSON output: {raw[:200]}")
        return fallback


# ── Pass 1: Clause Extraction ──────────────────────────────────────────────────

CLAUSE_TYPES_LIST = ", ".join([ct.value for ct in ClauseType])

PASS1_SYSTEM = f"""You are a legal document analyzer helping freelancers understand contract risks.
Extract and classify legal clauses from the provided contract text.

Return ONLY valid JSON in this exact format:
{{
  "clauses": [
    {{
      "clause_type": "<one of: {CLAUSE_TYPES_LIST}>",
      "text": "<exact clause text, max 500 chars>",
      "risk_level": "<low|medium|high>"
    }}
  ]
}}

Rules:
- Only extract clauses from the taxonomy above (ignore boilerplate recitals, signature blocks)
- Mark high risk if clause is unusually one-sided or broad
- Mark medium risk if clause is present but standard
- Mark low risk if clause is balanced/fair
- If no relevant clauses found, return {{"clauses": []}}
- Do NOT include commentary outside the JSON"""


async def extract_clauses(chunk: str) -> list[ClauseExtraction]:
    """Pass 1: Extract + classify clauses from a text chunk."""
    messages = [
        {"role": "system", "content": PASS1_SYSTEM},
        {"role": "user", "content": f"Contract text:\n\n{chunk}"},
    ]

    raw = await _llm_call(messages, max_tokens=800)
    data = _parse_json_safe(raw, {"clauses": []})

    results: list[ClauseExtraction] = []
    for item in data.get("clauses", []):
        try:
            results.append(ClauseExtraction(
                clause_type=ClauseType(item.get("clause_type", "other")),
                text=item.get("text", "")[:600],
                risk_level=RiskLevel(item.get("risk_level", "medium")),
            ))
        except Exception as e:
            logger.warning(f"Skipping malformed clause extraction: {e}")

    return results


# ── Pass 2: Clause Explanation ─────────────────────────────────────────────────

def _build_pass2_prompt(
    clause_type: str,
    clause_text: str,
    jurisdiction: str,
    few_shot_examples: list[dict],
) -> list[dict]:
    """Build the Pass 2 prompt with few-shot examples injected."""

    few_shot_str = ""
    for ex in few_shot_examples:
        label = "⚠️ Predatory" if ex.get("predatory") else "✅ Standard"
        few_shot_str += f"""
Example ({label}):
Clause: "{ex['text']}"
Explanation: {ex.get('explanation', '')}
Negotiation: {ex.get('negotiation', '')}
"""

    system_msg = f"""You are a contract risk advisor explaining clauses to freelancers with no legal background.
Jurisdiction context: {jurisdiction.upper()}

{"Few-shot examples of this clause type:" + few_shot_str if few_shot_str else ""}

Return ONLY valid JSON:
{{
  "plain_english": "<explain what this clause means in 2-3 plain sentences>",
  "why_risky": "<explain specifically what risk this creates for the freelancer, or 'This is standard.' if low risk>",
  "negotiation_suggestion": "<suggest exact language change or 'No changes needed.' if low risk>",
  "risk_score": <integer 1-10, where 10 is most dangerous>
}}"""

    user_msg = f"Clause type: {clause_type}\nClause text: \"{clause_text}\""

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


async def explain_clause(
    extraction: ClauseExtraction,
    jurisdiction: Jurisdiction,
) -> ClauseAnalysis:
    """Pass 2: Get full explanation for a single flagged clause."""
    few_shot = _load_few_shot_examples(extraction.clause_type.value, jurisdiction.value)

    messages = _build_pass2_prompt(
        clause_type=extraction.clause_type.value,
        clause_text=extraction.text,
        jurisdiction=jurisdiction.value,
        few_shot_examples=few_shot,
    )

    raw = await _llm_call(messages, max_tokens=600)
    data = _parse_json_safe(raw, {})

    return ClauseAnalysis(
        clause_type=extraction.clause_type,
        original_text=extraction.text,
        risk_level=extraction.risk_level,
        risk_score=max(1, min(10, int(data.get("risk_score", 5)))),
        plain_english=data.get("plain_english", "Could not generate explanation."),
        why_risky=data.get("why_risky", "Unknown risk."),
        negotiation_suggestion=data.get("negotiation_suggestion", "Consult a lawyer."),
    )


async def explain_clauses_parallel(
    extractions: list[ClauseExtraction],
    jurisdiction: Jurisdiction,
) -> list[ClauseAnalysis]:
    """Run Pass 2 on all flagged clauses in parallel (bounded concurrency)."""
    sem = asyncio.Semaphore(3)  # Max 3 concurrent LLM calls

    async def _bounded(ext: ClauseExtraction) -> ClauseAnalysis:
        async with sem:
            return await explain_clause(ext, jurisdiction)

    tasks = [_bounded(ext) for ext in extractions]
    return await asyncio.gather(*tasks, return_exceptions=False)
