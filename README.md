# Doc2Struct

AI-powered document intelligence for enterprise teams — upload unstructured files, extract structured data, and export results in seconds.

**Live API:** [doc2struct-production.up.railway.app](https://doc2struct-production.up.railway.app/health)

Doc2Struct is a SaaS-style document processing platform that turns PDFs, contracts, invoices, CVs, and internal business documents into validated, structured JSON. It combines a polished product UI with an API-first backend, schema-driven LLM extraction, and production-ready persistence.

Designed for:

- finance and accounting teams processing invoices,
- HR departments screening resumes at scale,
- legal and procurement teams reviewing contracts,
- operations teams digitizing internal forms and requests,
- pilots and POCs where enterprises want **their own documents** analyzed without manual data entry.

Built as a realistic freelance portfolio product: deployable architecture, clear UX, and a workflow that mirrors how B2B document AI tools are actually sold and adopted.

## Why This Project?

Organizations still lose hours re-keying data from PDFs into ERPs, spreadsheets, and ticketing systems.

Doc2Struct helps teams:

- upload documents without triggering immediate processing noise,
- run AI extraction on demand with visible progress,
- preview PDFs with field-level highlights,
- review confidence scores and AI summaries before export,
- export to **CSV, JSON, or Excel** for downstream systems,
- keep a persistent document history (PostgreSQL on Neon).

The product is intentionally split into a **Dashboard** (entry point + upload) and a **Workspace** (3-column analysis environment) — a flow familiar to enterprise SaaS users.

## Why Not Just ChatGPT?

Unlike ad-hoc prompting in a chat UI, Doc2Struct provides:

- deterministic document-type schemas (invoice, resume, contract, report),
- automatic classification of unknown enterprise documents,
- structured field outputs with per-field confidence,
- persistent document storage and retrieval,
- REST API for integration into existing tools,
- export pipelines ready for finance / BI / ops workflows,
- a dedicated workspace UX instead of copy-paste from chat.

## Features

### Product UX

- **Dashboard** (`/`) — upload entry point, KPIs, recent documents
- **Workspace** (`/workspace`) — document list, PDF preview, AI analysis panel
- Drag-and-drop upload (PDF, DOCX, XLSX, TXT — up to 50 MB)
- Manual **Analyze** workflow with live scanning feedback
- PDF preview with extracted-field highlights (pdf.js)
- Light / dark theme
- Backend connection status in the top navigation
- Sample documents for demos + one uncategorized client-style document

### AI & Extraction

- Document classification and field extraction via **Groq** (Llama models)
- Typed schemas per document category
- Summary, key insights, action items, and warnings
- Global confidence score and per-field confidence
- Client-side Groq key override (optional) or server-side key

### API & Data

- FastAPI REST API with OpenAPI docs
- Upload → pending → analyze → processing → completed lifecycle
- PostgreSQL persistence (Neon) with in-memory fallback for local dev
- List, retrieve, delete documents
- Platform statistics endpoint

### Export

- JSON (full extraction payload)
- CSV (tabular fields)
- Excel (`.xlsx`)

### Automation Templates (API)

- Invoice Processing
- Resume Screening
- Contract Analyzer
- Financial Report Parser

## Product Flow

```text
Dashboard
  → Upload document
  → Redirect to Workspace (document pre-selected)
  → Click Analyze
  → Background AI extraction (Groq)
  → Review fields + PDF highlights
  → Export CSV / JSON / Excel
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **PDF Preview** | pdf.js (pdfjs-dist) |
| **Backend** | FastAPI, Pydantic, Uvicorn, SQLAlchemy async |
| **Database** | Neon PostgreSQL (asyncpg) |
| **AI** | Groq OpenAI-compatible API (Llama 3.1 / 3.3) |
| **Parsing** | pdfplumber, PyMuPDF, python-docx, pandas, openpyxl |
| **Deployment** | Railway (API), Vercel-ready frontend |

## Key Design Decisions

- **API-first backend** — the UI is a client; integrations can call the same endpoints
- **Manual analyze by default** — upload stores the file; extraction runs only when the user requests it (cost control + predictable UX)
- **Optimistic UI + polling** — handles async background processing and Railway cold starts
- **Schema-driven extraction** — prompts and field contracts per document type, not free-form text
- **DB with graceful fallback** — works locally without `DATABASE_URL` (in-memory store)
- **Sample document catalog** — demo PDFs for sales/POC without requiring client data on day one
- **Separate Dashboard and Workspace routes** — mirrors enterprise SaaS onboarding vs. power-user flows

## Architecture

```text
Doc2Struct/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── page.tsx             # Dashboard (home)
│   │   └── workspace/           # 3-column document workspace
│   ├── components/
│   │   ├── workspace/           # DocumentWorkspace, ExportActions
│   │   ├── documents/           # UploadZone, PdfPreviewCanvas, DocumentPreview
│   │   └── extraction/          # ExtractionResult panel
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── hooks/useDocuments.ts
│   └── public/samples/          # Demo PDFs
├── backend/
│   ├── main.py                  # FastAPI app, lifespan, CORS
│   ├── app/
│   │   ├── routes/documents.py  # Upload, analyze, export, CRUD
│   │   ├── ai/extraction_engine.py
│   │   ├── processing/document_parser.py
│   │   ├── exports/export_service.py
│   │   ├── db/document_repo.py
│   │   └── models/
│   └── Procfile                   # Railway deployment
└── samples/                     # PDF generation scripts
```

### High-Level Flow

```text
1. User uploads a file on the Dashboard
2. Frontend POST /api/v1/documents/upload → document stored as pending
3. User opens Workspace and clicks Analyze
4. Backend parses the file (PDF/DOCX/XLSX/TXT)
5. Groq classifies the document and extracts schema-bound fields
6. Results saved to PostgreSQL + returned to the UI
7. User exports structured data or deletes the document
```

### LLM Pipeline

```text
Raw file bytes
  ↓
DocumentParser (pdfplumber / PyMuPDF / docx / xlsx)
  ↓
Plain text + page count
  ↓
ExtractionEngine (Groq / Llama)
  ↓
Classification + schema-specific field extraction
  ↓
JSON normalization + confidence scoring
  ↓
PostgreSQL + API response + UI highlights
```

## Setup

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Groq API key** from the [Groq Console](https://console.groq.com/keys)
- **Neon PostgreSQL** URL (optional for local dev — in-memory fallback works)

### Installation

**Backend**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Set `GROQ_API_KEY` in `.env`. Add `DATABASE_URL` for persistent storage.

**Frontend**

```powershell
cd frontend
npm install
copy .env.local.example .env.local   # if present, or create manually
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, point to your deployed API (e.g. Railway).

### Environment Variables

**Backend** (`backend/.env.example`)

| Variable | Description |
| --- | --- |
| `GROQ_API_KEY` | Groq API key for document extraction |
| `GROQ_MODEL` | Model name (default: `llama-3.3-70b-versatile`) |
| `DATABASE_URL` | Neon PostgreSQL connection string (optional locally) |
| `FRONTEND_URL` | Allowed CORS origin for production frontend |
| `MAX_FILE_SIZE_MB` | Upload size limit (default: 50) |

**Frontend** (`frontend/.env.local`)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL |

## Run Locally

**Option A — Windows launcher**

```powershell
.\start.bat
```

Opens the frontend at `http://localhost:3000` and the backend at `http://localhost:8000` (if `backend/venv` exists).

**Option B — Manual**

Terminal 1 — API:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Terminal 2 — UI:

```powershell
cd frontend
npm run dev
```

| Service | URL |
| --- | --- |
| Dashboard | http://localhost:3000 |
| Workspace | http://localhost:3000/workspace |
| API health | http://localhost:8000/health |
| OpenAPI docs | http://localhost:8000/docs |

## Demo Dataset

Sample PDFs ship with the frontend under `frontend/public/samples/`:

| File | Purpose |
| --- | --- |
| `sample-invoice.pdf` | Invoice extraction demo |
| `sample-resume.pdf` | Resume / CV demo |
| `sample-contract.pdf` | Contract clauses demo |
| `sample-report.pdf` | Financial report demo |
| `client-capex-request.pdf` | Uncategorized enterprise internal form |

Regenerate samples (optional):

```powershell
cd samples
python generate_all_samples.py
```

## API Endpoints

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
GET    /api/v1/automations/
```

## Deployment

| Component | Target | Notes |
| --- | --- | --- |
| Backend | Railway | `Procfile` + `DATABASE_URL` + `GROQ_API_KEY` |
| Database | Neon | Serverless PostgreSQL |
| Frontend | Vercel / Railway | Set `NEXT_PUBLIC_API_URL` to the API URL |

Ensure `FRONTEND_URL` is set on the backend so CORS allows your production domain.

## Current Limitations

- No multi-tenant authentication or RBAC yet
- No webhook / queue-based processing (background tasks run in-process)
- LLM output quality depends on document scan quality and model limits
- `/analyze` endpoint deployment may lag behind local code on Railway — frontend includes a compatibility fallback
- Notion export is defined in the API contract but not fully wired in the UI
- No automated E2E test suite in the repository yet

## Future Improvements

- OAuth / SSO and team workspaces
- Webhook notifications on analysis complete
- Redis + worker queue for high-volume batch processing
- Gmail / SharePoint / Google Drive connectors
- Custom extraction schemas per customer
- Prompt versioning and evaluation harness
- Audit logs and GDPR retention policies
- Billing and usage metering for SaaS monetization

## Troubleshooting

| Issue | Fix |
| --- | --- |
| **Connected → Offline** in the UI | Check `NEXT_PUBLIC_API_URL`, Railway cold start (wait ~30s), or run the backend locally |
| Upload works but Analyze does nothing | Verify `GROQ_API_KEY` on the server; check browser Network tab for API errors |
| Hydration warnings | Hard-refresh after frontend updates (`Ctrl+Shift+R`) |
| `DATABASE_URL` missing | Backend falls back to in-memory — data is lost on restart |
| Groq rate limits | Retry after a few seconds; consider a paid Groq tier or model with higher limits |

## Portfolio Context

This project demonstrates end-to-end product delivery for enterprise clients:

- product thinking (Dashboard → Workspace funnel),
- full-stack implementation (Next.js + FastAPI + PostgreSQL),
- LLM integration with structured outputs,
- deployable cloud architecture (Railway + Neon),
- UX polish suitable for stakeholder demos and POCs.

---

**Author:** Freelance full-stack / AI product build  
**License:** See `LICENSE` if present, or contact for commercial licensing.
