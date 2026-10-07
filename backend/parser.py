"""
Document parser: PDF and DOCX → plain text.
Also handles regex-based boilerplate stripping before hitting the LLM.
"""
import io
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Boilerplate patterns to strip BEFORE sending to LLM ───────────────────────
# These sections are almost always boilerplate and waste tokens.
BOILERPLATE_PATTERNS = [
    # Signature blocks
    r"(in witness whereof|signature page follows)[\s\S]{0,800}",
    # Recitals / whereas clauses (usually just background)
    r"^WHEREAS[,\s].{0,300}$",
    # "This Agreement is entered into" opener
    r"^this\s+(agreement|nda|contract).{0,200}(hereinafter|.agreement.).*$",
    # Definitions section markers
    r"^(article|section)\s+\d+[\.\s]+(definitions|interpretation)\s*$",
    # Pure numbering lines
    r"^\s*\d+\.\s*$",
]

BOILERPLATE_RE = re.compile("|".join(BOILERPLATE_PATTERNS), re.MULTILINE | re.IGNORECASE)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages)
    except Exception as e:
        logger.error(f"pdfplumber failed: {e}")
        raise ValueError(f"Could not parse PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        logger.error(f"python-docx failed: {e}")
        raise ValueError(f"Could not parse DOCX: {e}")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route to correct parser based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        text = extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Upload a PDF or DOCX.")

    if not text or len(text.strip()) < 100:
        raise ValueError("Document appears to be empty or unreadable (possibly a scanned image PDF).")

    return text


def strip_boilerplate(text: str) -> str:
    """
    Remove common boilerplate from contract text before sending to LLM.
    This saves tokens — a typical contract has 40-70% boilerplate.
    Returns cleaned text.
    """
    cleaned = BOILERPLATE_RE.sub("", text)
    # Collapse excessive whitespace
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def chunk_text(text: str, max_chunk_chars: int = 4000) -> list[str]:
    """
    Split document into chunks for LLM processing.
    Splits on double newlines (paragraph boundaries) to avoid cutting mid-clause.
    """
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_len = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if current_len + len(para) > max_chunk_chars and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [para]
            current_len = len(para)
        else:
            current_chunk.append(para)
            current_len += len(para)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks
