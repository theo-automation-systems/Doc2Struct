# Doc2Struct — AI Document Processing SaaS

Transform unstructured documents into structured, actionable data using AI.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| Backend | Python FastAPI (async) |
| AI | OpenAI GPT-4o-mini (structured extraction) |
| Document Parsing | pdfplumber, PyMuPDF, pandas, python-docx |
| Charts | Recharts |

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your OpenAI API key
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

## Features

- **Document Upload** — Drag & drop PDF, DOCX, XLSX, TXT (up to 50MB)
- **AI Extraction** — Structured JSON extraction with confidence scores
- **6 Automation Templates** — Invoice, Resume, Contract, Report, Medical, Procurement
- **Export** — CSV, JSON, Excel, Notion integration
- **Analytics** — Processing trends, accuracy metrics, volume charts
- **AI Panel** — Collapsible insights panel with entity extraction

## Supported Document Types

| Type | Extracted Fields |
|------|-----------------|
| Invoice | vendor, amounts, dates, line items, tax |
| Resume | skills, experience, education, contact |
| Contract | parties, clauses, obligations, dates |
| Report | KPIs, metrics, revenue, highlights |

## API Endpoints

```
POST   /api/v1/documents/upload          Upload document
GET    /api/v1/documents/                List documents
GET    /api/v1/documents/{id}            Get document
GET    /api/v1/documents/{id}/extraction Get extraction results
POST   /api/v1/documents/{id}/export     Export as CSV/JSON/Excel
DELETE /api/v1/documents/{id}            Delete document
GET    /api/v1/automations/              List automation templates
GET    /api/v1/stats                     Platform statistics
```

## Environment Variables

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...     # Optional, defaults to in-memory
NOTION_API_KEY=secret_...         # Optional, for Notion export
```
