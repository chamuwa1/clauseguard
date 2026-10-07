"""
ClauseGuard — FastAPI main application.
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings
from models import AnalysisResult, ErrorResponse, Jurisdiction
from analyzer import analyze_document
from storage import save_analysis, get_analysis

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── App lifecycle ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ClauseGuard backend starting up...")
    yield
    logger.info("ClauseGuard backend shutting down.")


# ── App init ───────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ClauseGuard API",
    description="AI-powered contract risk analyzer for freelancers",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Middleware: request timing ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.time() - start:.3f}s"
    return response


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "clauseguard-api", "version": "1.0.0"}


# ── Main: Analyze document ─────────────────────────────────────────────────────
@app.post(
    "/analyze",
    response_model=AnalysisResult,
    tags=["Analysis"],
    summary="Upload a contract and get clause-by-clause risk analysis",
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def analyze(
    request: Request,
    file: UploadFile = File(..., description="PDF or DOCX contract file"),
    jurisdiction: Jurisdiction = Form(Jurisdiction.GENERIC, description="Legal jurisdiction context"),
):
    # Validate file type
    allowed_types = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Upload a PDF or DOCX.",
        )

    # Validate file size
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed: {settings.max_file_size_mb}MB.",
        )

    logger.info(f"Received file: {file.filename} ({len(file_bytes)/1024:.1f}KB), jurisdiction={jurisdiction.value}")

    try:
        # Run full analysis pipeline
        result = await analyze_document(
            file_bytes=file_bytes,
            filename=file.filename or "contract",
            jurisdiction=jurisdiction,
        )

        # Persist to Supabase and attach share URL
        share_path = await save_analysis(result)
        result.share_url = f"{request.base_url.scheme}://{request.base_url.netloc}{share_path}"

        return result

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Analysis failed for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


# ── Get stored analysis by ID ──────────────────────────────────────────────────
@app.get(
    "/results/{analysis_id}",
    response_model=AnalysisResult,
    tags=["Analysis"],
    summary="Retrieve a previously stored analysis by ID",
)
async def get_result(analysis_id: str):
    # Validate UUID format to prevent abuse
    import re
    if not re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", analysis_id, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Invalid analysis ID format.")
    data = await get_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return data


# ── Global error handler ───────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Dev entrypoint ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
