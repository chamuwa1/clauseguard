# ClauseGuard 🛡️

> AI-powered contract risk analyzer for freelancers — built with FastAPI + Next.js + DeepSeek

[![Demo](https://img.shields.io/badge/demo-live-violet)](https://clauseguard.app)
[![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20Next.js%20%7C%20DeepSeek-blueviolet)](.)

## What It Does

ClauseGuard ingests a PDF or DOCX freelance contract and returns:
- **Clause-by-clause risk analysis** (9 clause types: indemnity, IP assignment, non-compete, etc.)
- **Plain English explanations** of each risky clause
- **Specific negotiation suggestions** (not just "consult a lawyer")
- **Overall risk score** (1–10) + top 3 renegotiation priorities
- **Jurisdiction-aware analysis** (US / UK / Sri Lanka / Generic)

## Architecture

```
Frontend (Next.js 14)          Backend (FastAPI)
  ┌─────────────────┐             ┌────────────────────────────────────┐
  │ Drag-drop upload│──POST/file──▶ Parser (pdfplumber/python-docx)   │
  │ Jurisdiction    │             │ Boilerplate regex stripper          │
  │ selector        │             │ Chunker                             │
  │ Clause cards    │◀──JSON──────│ LLM Pass 1: Clause extraction       │
  │ Risk score dial │             │ LLM Pass 2: Risk explanation (async)│
  │ Share link      │             │ Supabase storage                    │
  └─────────────────┘             └────────────────────────────────────┘
```

## Token Budget Strategy

A typical 4,000-word contract uses **~2,500–3,000 tokens** per analysis:
1. **Regex pre-filter** removes boilerplate (signatures, recitals) before any LLM call (~40% token savings)
2. **Pass 1** (cheap): classify clause types — ~200 tokens per chunk
3. **Pass 2** (targeted): only run on flagged medium/high clauses, not low-risk boilerplate
4. **Few-shot grounding**: 2 examples per clause type injected as context (no fine-tuning needed)

## Few-Shot Dataset

`data/clause_examples.json` contains 19 labeled "predatory vs. standard" clause pairs across all 9 clause types. This dataset grounds the model's explanations and is used as few-shot context in Pass 2 prompts.

## Quick Start

### Backend

```bash
cd backend
py -3.13 -m venv venv
.\venv\Scripts\activate    # Windows
cp .env.example .env       # Fill in APMIX_API_KEY and SUPABASE keys
pip install -r requirements.txt
python main.py
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # Set NEXT_PUBLIC_API_URL
npm install
npm run dev
# App running at http://localhost:3000
```

### Supabase Setup

1. Create a new Supabase project
2. Run `backend/supabase_schema.sql` in the SQL editor
3. Copy your project URL + service key to `backend/.env`

## Project Structure

```
clauseguard/
├── backend/
│   ├── main.py              # FastAPI app, routes
│   ├── analyzer.py          # Orchestrator (parse → LLM → aggregate)
│   ├── llm_client.py        # Two-pass LLM pipeline
│   ├── parser.py            # PDF/DOCX extraction + boilerplate filter
│   ├── models.py            # Pydantic schemas
│   ├── storage.py           # Supabase persistence
│   ├── config.py            # Settings via .env
│   ├── supabase_schema.sql  # DB schema + RLS policies
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx     # Main page (upload → results state machine)
│       │   ├── layout.tsx   # Root layout + SEO
│       │   └── globals.css  # Design system
│       ├── components/
│       │   ├── UploadZone.tsx
│       │   ├── ClauseCard.tsx
│       │   └── ResultsView.tsx
│       ├── lib/
│       │   ├── api.ts       # API client
│       │   └── utils.ts     # Risk color helpers
│       └── types/index.ts   # Shared TypeScript types
└── data/
    └── clause_examples.json # Labeled few-shot dataset
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.13, Uvicorn |
| LLM | DeepSeek via APMIX (OpenAI-compatible API) |
| PDF Parsing | pdfplumber, python-docx |
| Database | Supabase (PostgreSQL + RLS) |
| Rate Limiting | slowapi |

## API Reference

```
POST /analyze
  Content-Type: multipart/form-data
  file: <PDF or DOCX>
  jurisdiction: generic | us | uk | sri_lanka

GET /results/{analysis_id}

GET /health
```

> ⚖️ **Not legal advice.** ClauseGuard is an educational tool that flags potential risks. Always consult a qualified lawyer before signing contracts.
