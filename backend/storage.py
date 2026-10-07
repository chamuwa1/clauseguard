"""
Supabase storage layer for ClauseGuard.
Stores analysis results (not raw files) for privacy.
"""
import logging
from typing import Optional

from config import get_settings
from models import AnalysisResult

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_client():
    """Lazy Supabase client init."""
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def save_analysis(result: AnalysisResult, user_id: Optional[str] = None) -> str:
    """
    Persist analysis result to Supabase.
    Returns the shareable URL slug.
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        logger.warning("Supabase not configured — skipping persistence")
        return f"/results/{result.analysis_id}"

    try:
        client = _get_client()
        payload = {
            "id": result.analysis_id,
            "user_id": user_id,
            "document_name": result.document_name,
            "jurisdiction": result.jurisdiction.value,
            "risk_score": result.summary.risk_score,
            "risk_label": result.summary.risk_label.value,
            "result_json": result.model_dump(),
        }
        client.table("analyses").insert(payload).execute()
        logger.info(f"Saved analysis {result.analysis_id} to Supabase")
        return f"/results/{result.analysis_id}"
    except Exception as e:
        logger.error(f"Supabase save failed: {e}")
        # Don't fail the whole request if DB is down
        return f"/results/{result.analysis_id}"


async def get_analysis(analysis_id: str) -> Optional[dict]:
    """Retrieve a stored analysis by ID."""
    if not settings.supabase_url:
        return None
    try:
        client = _get_client()
        resp = client.table("analyses").select("result_json").eq("id", analysis_id).single().execute()
        return resp.data.get("result_json") if resp.data else None
    except Exception as e:
        logger.error(f"Supabase fetch failed: {e}")
        return None
