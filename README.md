**English** | [Français](README.fr.md)

# Doc2Struct

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Groq](https://img.shields.io/badge/LLM-Groq-orange)

AI-powered document intelligence — upload unstructured files, extract structured data, and export results in seconds.

**Live App:** [doc2-struct.vercel.app](https://doc2-struct.vercel.app)

<p align="center">
  <img src="docs/screenshots/Dashboard.png" alt="Doc2Struct Dashboard" width="800" />
</p>

<p align="center">
  <img src="docs/screenshots/Workspace.png" alt="Doc2Struct Workspace" width="800" />
</p>

<p align="center">
  <img src="docs/screenshots/Extracted_Fields_Demo.png" alt="Extracted fields with PDF highlights" width="800" />
</p>

## Problem

Most organizations still rely on manual data entry to process documents such as:

- invoices
- CVs and applications
- contracts
- internal forms
- financial reports

This leads to:

- time-consuming manual re-entry
- human errors in structured systems (CRM, ERP, spreadsheets)
- slow operational workflows
- fragmented document handling across tools

## Solution

Doc2Struct automates the transformation of unstructured documents into structured, validated data.

It provides:

- document upload and storage
- AI-based classification (invoice, CV, contract, report, etc.)
- structured field extraction with confidence scoring
- review interface with PDF-level highlighting
- export to JSON, CSV, Excel
- API-first architecture for integration into business systems

## Who This Is For

- Finance teams processing invoices and expense documents
- HR teams handling CVs and recruitment documents
- Legal teams reviewing contracts and agreements
- Operations teams digitizing internal workflows
- Startups and enterprises building internal automation tools

## Key Capabilities

### Document Processing

- Upload PDFs, DOCX, XLSX, TXT (up to 50MB)
- Automatic or manual analysis workflow
- Document lifecycle tracking (upload → analyze → completed)

### AI Extraction

- Schema-driven structured extraction (not free-form text)
- Document classification
- Field-level confidence scoring
- Summaries, key insights, and action extraction

### Review Interface

- Side-by-side PDF preview and extracted fields
- Highlighted extracted elements inside documents
- Confidence indicators per field
- Analysis history and persistence

### Export & Integration

- JSON (full structured output)
- CSV (tabular data)
- Excel (.xlsx)
- REST API for external systems

## Why Not Just ChatGPT?

Unlike generic prompting tools, Doc2Struct provides:

- deterministic schemas per document type
- structured and validated outputs (not raw text)
- persistent storage and document history
- repeatable extraction pipelines
- integration-ready REST API
- dedicated UX for review and validation

## Product Flow

```text
Upload document
  → classify document type
  → extract structured fields (AI)
  → review results with PDF highlights
  → export to business tools (CSV / JSON / Excel)
```

## Core Design Principles

- **API-first architecture:** every feature is accessible programmatically
- **Schema-driven extraction:** structured outputs instead of free-form responses
- **Asynchronous processing:** scalable background analysis workflow
- **Separation of concerns UI:**
  - Dashboard = entry + document management
  - Workspace = analysis + review environment
- **Graceful degradation:** local fallback mode without database
- **Cost-aware execution:** analysis triggered explicitly by user action

## Features

### UI / UX

- Dashboard (upload + recent documents)
- Workspace (analysis + PDF viewer + extracted fields)
- Drag & drop upload
- Manual analysis trigger
- Dark / light mode
- Live backend status indicator

### AI Layer

- Groq LLM integration (Llama models)
- Document classification engine
- Structured extraction pipeline
- Per-field confidence scoring
- Summary + insights generation

### Backend

- FastAPI REST API
- Async document processing pipeline
- PostgreSQL (Neon) persistence
- In-memory fallback for local development
- Full OpenAPI documentation

### Export

- JSON structured output
- CSV tabular export
- Excel export for business workflows

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI, Pydantic, SQLAlchemy async, Uvicorn |
| Database | Neon PostgreSQL (asyncpg) |
| AI | Groq (Llama 3.1 / 3.3) |
| Parsing | pdfplumber, PyMuPDF, python-docx, pandas, openpyxl |
| Deployment | Vercel (frontend), Railway (backend) |

## Architecture

```text
Frontend (Next.js)
        ↓
FastAPI backend
        ↓
LLM extraction (Groq)
        ↓
Document parsing layer
        ↓
PostgreSQL (Neon)
```

## Key Design Decisions

- Documents are stored before processing (decoupled workflow)
- Analysis is explicit (cost + control)
- Schema-based extraction instead of free-form prompting
- Optimistic UI with polling for async jobs
- Multi-format export pipeline for real-world integration
- Separation of Dashboard / Workspace to mirror enterprise SaaS tools

## Setup

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `.env`:

```env
GROQ_API_KEY=your_key
DATABASE_URL=your_neon_url
```

Run:

```powershell
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

| Component | Platform |
| --- | --- |
| Frontend | [Vercel](https://doc2-struct.vercel.app) — Root Directory: `frontend` |
| Backend | Railway — Root Directory: `backend` |
| Database | Neon |

**Vercel:** `NEXT_PUBLIC_API_URL=https://doc2struct-production.up.railway.app`  
**Railway:** `FRONTEND_URL=https://doc2-struct.vercel.app` (CORS)

### API

| Resource | URL |
| --- | --- |
| Swagger UI | [doc2struct-production.up.railway.app/docs](https://doc2struct-production.up.railway.app/docs) |
| Health check | [doc2struct-production.up.railway.app/health](https://doc2struct-production.up.railway.app/health) |

```text
GET    /health
GET    /api/v1/stats
GET    /api/v1/documents/
POST   /api/v1/documents/upload
POST   /api/v1/documents/{id}/analyze
GET    /api/v1/documents/{id}
GET    /api/v1/documents/{id}/extraction
POST   /api/v1/documents/{id}/export
DELETE /api/v1/documents/{id}
```

## Demo Dataset

Sample PDFs ship with the frontend under `frontend/public/samples/`:

| File | Purpose |
| --- | --- |
| `sample-invoice.pdf` | Simple invoice (quick smoke test) |
| `sample-invoice-detailed.pdf` | Realistic B2B invoice — 11 line items, discounts, VAT breakdown |
| `sample-resume.pdf` | Simple CV (quick smoke test) |
| `sample-resume-dense.pdf` | Dense 2-page CV — 5 roles, certs, publications |
| `sample-contract.pdf` | Simple NDA (quick smoke test) |
| `sample-contract-msa.pdf` | 3-page Master Services Agreement with appendices |
| `sample-report.pdf` | Financial report demo |
| `client-capex-request.pdf` | Enterprise CAPEX internal form |
| `client-it-access-request.pdf` | IT license & access request form |

Regenerate:

```powershell
cd samples
python generate_all_samples.py
python generate_realistic_samples.py
python generate_enterprise_samples.py
```

## Roadmap

- OAuth / team workspaces
- Webhooks for processing completion
- Google Drive / SharePoint connectors
- Custom extraction schemas per client
- Prompt versioning + evaluation system
- Audit logs (enterprise)
- Billing & usage tracking

## What This Project Demonstrates

- Full-stack SaaS architecture
- LLM-based structured extraction system
- Production-ready backend design
- Document processing pipeline at scale
- API-first product thinking
- Enterprise-oriented UX patterns
