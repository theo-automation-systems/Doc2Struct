"""
Document routes — upload, process, retrieve documents.
Backed by Neon PostgreSQL via SQLAlchemy async.
Falls back to in-memory store when DATABASE_URL is not set.
"""

import os
import uuid
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Query, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from ..models.document import (
    DocumentMetadata,
    DocumentType,
    DocumentStatus,
    ExtractionResult,
    ExportRequest,
)
from ..processing.document_parser import DocumentParser
from ..ai.extraction_engine import ExtractionEngine
from ..exports.export_service import ExportService

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)

parser = DocumentParser()
export_service = ExportService()

# ── DB availability ───────────────────────────────────────────────────────────

def _db_available() -> bool:
    return bool(os.environ.get("DATABASE_URL"))

def _get_session_dep():
    """Return the get_session dependency only when DB is available."""
    if _db_available():
        from ..database import get_session
        return get_session
    return None

# ── In-memory fallback (no DATABASE_URL) ─────────────────────────────────────

_documents_store: dict[str, DocumentMetadata] = {}
_extractions_store: dict[str, dict] = {}


# ── Helpers: abstract over DB vs in-memory ────────────────────────────────────

async def _get_doc(doc_id: str, session: Optional[AsyncSession]) -> Optional[DocumentMetadata]:
    if session:
        from ..models.orm import DocumentORM
        row = await session.get(DocumentORM, doc_id)
        return row.to_pydantic() if row else None
    return _documents_store.get(doc_id)


async def _list_docs(
    session: Optional[AsyncSession],
    doc_type: Optional[str],
    status: Optional[str],
    limit: int,
    offset: int,
) -> list[DocumentMetadata]:
    if session:
        from ..models.orm import DocumentORM
        stmt = select(DocumentORM).order_by(DocumentORM.uploaded_at.desc())
        if doc_type:
            stmt = stmt.where(DocumentORM.type == doc_type)
        if status:
            stmt = stmt.where(DocumentORM.status == status)
        stmt = stmt.offset(offset).limit(limit)
        result = await session.execute(stmt)
        return [row.to_pydantic() for row in result.scalars()]
    docs = list(_documents_store.values())
    if doc_type:
        docs = [d for d in docs if d.type == doc_type]
    if status:
        docs = [d for d in docs if d.status == status]
    docs.sort(key=lambda d: d.uploaded_at, reverse=True)
    return docs[offset : offset + limit]


async def _save_doc(doc: DocumentMetadata, session: Optional[AsyncSession]) -> None:
    if session:
        from ..models.orm import DocumentORM
        row = DocumentORM(
            id=doc.id,
            name=doc.name,
            type=doc.type.value if hasattr(doc.type, "value") else doc.type,
            status=doc.status.value if hasattr(doc.status, "value") else doc.status,
            size=doc.size,
            pages=doc.pages,
            uploaded_at=doc.uploaded_at,
            processed_at=doc.processed_at,
            confidence=doc.confidence,
            extracted_fields=doc.extracted_fields,
            summary=doc.summary,
            error_message=doc.error_message,
        )
        await session.merge(row)
        await session.commit()
    else:
        _documents_store[doc.id] = doc


async def _update_doc_fields(doc_id: str, session: Optional[AsyncSession], **fields) -> None:
    # Serialise enum values to their string primitives for asyncpg compatibility
    clean = {k: (v.value if hasattr(v, "value") else v) for k, v in fields.items()}
    if session:
        from ..models.orm import DocumentORM
        await session.execute(
            update(DocumentORM).where(DocumentORM.id == doc_id).values(**clean)
        )
        await session.commit()
    else:
        if doc_id in _documents_store:
            for k, v in clean.items():
                setattr(_documents_store[doc_id], k, v)


async def _get_extraction(doc_id: str, session: Optional[AsyncSession]) -> Optional[dict]:
    if session:
        from ..models.orm import ExtractionORM
        row = await session.get(ExtractionORM, doc_id)
        return row.to_dict() if row else None
    return _extractions_store.get(doc_id)


async def _save_extraction(doc_id: str, data: dict, session: Optional[AsyncSession]) -> None:
    if session:
        from ..models.orm import ExtractionORM
        row = ExtractionORM(document_id=doc_id, **data)
        await session.merge(row)
        await session.commit()
    else:
        _extractions_store[doc_id] = data


async def _delete_doc(doc_id: str, session: Optional[AsyncSession]) -> None:
    if session:
        from ..models.orm import DocumentORM, ExtractionORM
        await session.execute(delete(ExtractionORM).where(ExtractionORM.document_id == doc_id))
        await session.execute(delete(DocumentORM).where(DocumentORM.id == doc_id))
        await session.commit()
    else:
        _documents_store.pop(doc_id, None)
        _extractions_store.pop(doc_id, None)


# ── Background processing task ────────────────────────────────────────────────

async def process_document_task(
    doc_id: str,
    file_bytes: bytes,
    filename: str,
    api_key: Optional[str] = None,
):
    """Parse document and run AI extraction in a background task."""
    # Each background task gets its own session scope
    if _db_available():
        from ..database import AsyncSessionLocal
        session_ctx = AsyncSessionLocal()
    else:
        session_ctx = None  # type: ignore[assignment]

    async def _run(session):
        try:
            await _update_doc_fields(doc_id, session, status=DocumentStatus.processing)

            parsed = parser.parse(file_bytes, filename)
            if parsed.get("error"):
                raise ValueError(f"Parse error: {parsed['error']}")

            text = parsed["text"]
            pages = parsed["pages"]
            await _update_doc_fields(doc_id, session, pages=pages)

            effective_key = api_key or os.environ.get("OPENAI_API_KEY")
            engine = ExtractionEngine(api_key=effective_key)

            doc_type_str = await engine.classify_document(text)
            doc_type = DocumentType(doc_type_str)

            extraction = await engine.extract(text, doc_type_str)

            extraction_data = {
                "document_type": doc_type.value if hasattr(doc_type, "value") else doc_type,
                "fields": [f if isinstance(f, dict) else f.model_dump() for f in extraction["fields"]],
                "raw_json": extraction["raw_json"],
                "summary": extraction["summary"],
                "key_insights": extraction["key_insights"],
                "action_items": extraction["action_items"],
                "warnings": extraction["warnings"],
                "confidence": extraction["confidence"],
                "processing_time_ms": extraction["processing_time_ms"],
            }
            await _save_extraction(doc_id, extraction_data, session)

            await _update_doc_fields(
                doc_id, session,
                type=doc_type,
                status=DocumentStatus.completed,
                processed_at=datetime.utcnow(),
                confidence=extraction["confidence"],
                extracted_fields=len(extraction["fields"]),
                summary=extraction["summary"],
            )

        except Exception as exc:
            logger.exception(f"Processing failed for {doc_id}: {exc}")
            # Bulletproof fallback — always mark as failed even if DB is down
            try:
                await _update_doc_fields(
                    doc_id, session,
                    status=DocumentStatus.failed,
                    error_message=str(exc)[:500],
                )
            except Exception as update_exc:
                logger.error(f"Could not update failed status for {doc_id}: {update_exc}")
                # Last resort: update in-memory store directly
                if doc_id in _documents_store:
                    _documents_store[doc_id].status = DocumentStatus.failed
                    _documents_store[doc_id].error_message = str(exc)[:500]

    if session_ctx is not None:
        async with session_ctx as session:
            await _run(session)
    else:
        await _run(None)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentMetadata)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    openai_api_key: Optional[str] = Query(None, description="OpenAI API key"),
):
    """Upload a document and start async AI processing."""
    allowed_extensions = {".pdf", ".txt", ".docx", ".xlsx", ".doc", ".xls"}
    if file.filename and not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_bytes = await file.read()
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

    doc_id = str(uuid.uuid4())
    doc = DocumentMetadata(
        id=doc_id,
        name=file.filename or "document",
        size=len(file_bytes),
        status=DocumentStatus.pending,
    )

    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            await _save_doc(doc, session)
    else:
        _documents_store[doc_id] = doc

    background_tasks.add_task(
        process_document_task,
        doc_id,
        file_bytes,
        file.filename or "document",
        openai_api_key,
    )
    return doc


@router.get("/", response_model=list[DocumentMetadata])
async def list_documents(
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            return await _list_docs(session, doc_type, status, limit, offset)
    return await _list_docs(None, doc_type, status, limit, offset)


@router.get("/{doc_id}", response_model=DocumentMetadata)
async def get_document(doc_id: str):
    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            doc = await _get_doc(doc_id, session)
    else:
        doc = await _get_doc(doc_id, None)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/extraction")
async def get_extraction(doc_id: str):
    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            doc = await _get_doc(doc_id, session)
            extraction = await _get_extraction(doc_id, session)
    else:
        doc = await _get_doc(doc_id, None)
        extraction = await _get_extraction(doc_id, None)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == DocumentStatus.processing or doc.status == DocumentStatus.pending:
        raise HTTPException(status_code=202, detail="Document is still being processed")
    if doc.status == DocumentStatus.failed:
        raise HTTPException(status_code=422, detail=f"Processing failed: {doc.error_message}")
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction results not available")
    return extraction


@router.post("/{doc_id}/export")
async def export_document(doc_id: str, request: ExportRequest):
    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            extraction = await _get_extraction(doc_id, session)
            doc = await _get_doc(doc_id, session)
    else:
        extraction = await _get_extraction(doc_id, None)
        doc = await _get_doc(doc_id, None)

    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction results not found")

    fields = extraction.get("fields", [])

    if request.format == "csv":
        content = export_service.to_csv(fields, request.include_confidence)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={doc_id}_extraction.csv"},
        )
    elif request.format == "json":
        content = export_service.to_json(extraction)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={doc_id}_extraction.json"},
        )
    elif request.format == "excel":
        doc_name = doc.name if doc else "extraction"
        content = export_service.to_excel_bytes(fields, doc_name)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={doc_id}_extraction.xlsx"},
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {request.format}")


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    if _db_available():
        from ..database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            doc = await _get_doc(doc_id, session)
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")
            await _delete_doc(doc_id, session)
    else:
        if doc_id not in _documents_store:
            raise HTTPException(status_code=404, detail="Document not found")
        await _delete_doc(doc_id, None)
    return {"message": "Document deleted successfully"}
