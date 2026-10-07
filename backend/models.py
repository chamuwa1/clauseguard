"""
Pydantic models for ClauseGuard API request/response schemas.
"""
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


# ── Enums ──────────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ClauseType(str, Enum):
    INDEMNITY = "indemnity"
    IP_ASSIGNMENT = "ip_assignment"
    NON_COMPETE = "non_compete"
    TERMINATION = "termination"
    PAYMENT_TERMS = "payment_terms"
    LIABILITY_CAP = "liability_cap"
    GOVERNING_LAW = "governing_law"
    DISPUTE_RESOLUTION = "dispute_resolution"
    CONFIDENTIALITY = "confidentiality"
    OTHER = "other"


class Jurisdiction(str, Enum):
    GENERIC = "generic"
    US = "us"
    UK = "uk"
    CA = "ca"
    AU = "au"
    EU = "eu"
    IN = "in"
    SRI_LANKA = "sri_lanka"


# ── Clause models ──────────────────────────────────────────────────────────────

class ClauseExtraction(BaseModel):
    """Result from LLM Pass 1 — raw extraction."""
    clause_type: ClauseType
    text: str
    risk_level: RiskLevel
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class ClauseAnalysis(BaseModel):
    """Result from LLM Pass 2 — full explanation per flagged clause."""
    clause_type: ClauseType
    original_text: str
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=1, le=10)
    plain_english: str
    why_risky: str
    negotiation_suggestion: str


# ── Analysis response ──────────────────────────────────────────────────────────

class OverallSummary(BaseModel):
    risk_score: int = Field(..., ge=1, le=10, description="Aggregate 1-10 risk score")
    risk_label: RiskLevel
    top_concerns: list[str] = Field(..., max_length=3, description="Top 3 things to renegotiate")
    one_liner: str = Field(..., description="Single sentence verdict")


class AnalysisResult(BaseModel):
    analysis_id: str
    document_name: str
    jurisdiction: Jurisdiction
    total_clauses_found: int
    flagged_clauses: int
    clauses: list[ClauseAnalysis]
    summary: OverallSummary
    share_url: Optional[str] = None


# ── API request/response ───────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    jurisdiction: Jurisdiction = Jurisdiction.GENERIC


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
