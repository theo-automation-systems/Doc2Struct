"""
Document repository — raw SQL via SQLAlchemy Core.
Bypasses ORM mappers entirely (avoids relationship / enum mapper crashes).
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentMetadata, DocumentType, DocumentStatus

_DOC_COLS = (
    "id, name, type, status, size, pages, uploaded_at, "
    "processed_at, confidence, extracted_fields, summary, error_message"
)


def _enum_val(v: Any) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _jsonb(value: Any) -> str:
    """asyncpg requires JSON strings for JSONB columns in raw SQL."""
    return json.dumps(value, ensure_ascii=False, default=str)


def _row_to_doc(row: Any) -> DocumentMetadata:
    m = dict(row)
    return DocumentMetadata(
        id=m["id"],
        name=m["name"],
        type=DocumentType(m["type"]),
        status=DocumentStatus(m["status"]),
        size=m["size"],
        pages=m.get("pages"),
        uploaded_at=m["uploaded_at"],
        processed_at=m.get("processed_at"),
        confidence=m.get("confidence"),
        extracted_fields=m.get("extracted_fields"),
        summary=m.get("summary"),
        error_message=m.get("error_message"),
    )


async def list_documents(
    session: AsyncSession,
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[DocumentMetadata]:
    sql = f"SELECT {_DOC_COLS} FROM documents"
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    conditions: list[str] = []
    if doc_type:
        conditions.append("type = :doc_type")
        params["doc_type"] = doc_type
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY uploaded_at DESC LIMIT :limit OFFSET :offset"
    result = await session.execute(text(sql), params)
    return [_row_to_doc(r) for r in result.mappings()]


async def get_document(session: AsyncSession, doc_id: str) -> Optional[DocumentMetadata]:
    result = await session.execute(
        text(f"SELECT {_DOC_COLS} FROM documents WHERE id = :id"),
        {"id": doc_id},
    )
    row = result.mappings().first()
    return _row_to_doc(row) if row else None


async def insert_document(session: AsyncSession, doc: DocumentMetadata) -> None:
    await session.execute(
        text("""
            INSERT INTO documents
                (id, name, type, status, size, pages, uploaded_at,
                 processed_at, confidence, extracted_fields, summary, error_message)
            VALUES
                (:id, :name, :type, :status, :size, :pages, :uploaded_at,
                 :processed_at, :confidence, :extracted_fields, :summary, :error_message)
        """),
        {
            "id": doc.id,
            "name": doc.name,
            "type": _enum_val(doc.type),
            "status": _enum_val(doc.status),
            "size": doc.size,
            "pages": doc.pages,
            "uploaded_at": doc.uploaded_at,
            "processed_at": doc.processed_at,
            "confidence": doc.confidence,
            "extracted_fields": doc.extracted_fields,
            "summary": doc.summary,
            "error_message": doc.error_message,
        },
    )
    await session.commit()


async def update_document(session: AsyncSession, doc_id: str, **fields: Any) -> None:
    if not fields:
        return
    clean = {k: _enum_val(v) if hasattr(v, "value") else v for k, v in fields.items()}
    set_clause = ", ".join(f"{k} = :{k}" for k in clean)
    await session.execute(
        text(f"UPDATE documents SET {set_clause} WHERE id = :doc_id"),
        {**clean, "doc_id": doc_id},
    )
    await session.commit()


async def delete_document(session: AsyncSession, doc_id: str) -> None:
    await session.execute(text("DELETE FROM extractions WHERE document_id = :id"), {"id": doc_id})
    await session.execute(text("DELETE FROM documents WHERE id = :id"), {"id": doc_id})
    await session.commit()


async def get_extraction(session: AsyncSession, doc_id: str) -> Optional[dict]:
    result = await session.execute(
        text("""
            SELECT document_id, document_type, fields, raw_json, summary,
                   key_insights, action_items, warnings, confidence, processing_time_ms
            FROM extractions WHERE document_id = :id
        """),
        {"id": doc_id},
    )
    row = result.mappings().first()
    if not row:
        return None
    return dict(row)


async def save_extraction(session: AsyncSession, doc_id: str, data: dict) -> None:
    await session.execute(
        text("""
            INSERT INTO extractions
                (document_id, document_type, fields, raw_json, summary,
                 key_insights, action_items, warnings, confidence, processing_time_ms)
            VALUES
                (:document_id, :document_type, CAST(:fields AS jsonb), CAST(:raw_json AS jsonb), :summary,
                 CAST(:key_insights AS jsonb), CAST(:action_items AS jsonb), CAST(:warnings AS jsonb),
                 :confidence, :processing_time_ms)
            ON CONFLICT (document_id) DO UPDATE SET
                document_type = EXCLUDED.document_type,
                fields = EXCLUDED.fields,
                raw_json = EXCLUDED.raw_json,
                summary = EXCLUDED.summary,
                key_insights = EXCLUDED.key_insights,
                action_items = EXCLUDED.action_items,
                warnings = EXCLUDED.warnings,
                confidence = EXCLUDED.confidence,
                processing_time_ms = EXCLUDED.processing_time_ms
        """),
        {
            "document_id": doc_id,
            "document_type": _enum_val(data.get("document_type", "unknown")),
            "fields": _jsonb(data.get("fields", [])),
            "raw_json": _jsonb(data.get("raw_json", {})),
            "summary": data.get("summary", ""),
            "key_insights": _jsonb(data.get("key_insights", [])),
            "action_items": _jsonb(data.get("action_items", [])),
            "warnings": _jsonb(data.get("warnings", [])),
            "confidence": data.get("confidence", 0.0),
            "processing_time_ms": data.get("processing_time_ms", 0),
        },
    )
    await session.commit()


async def count_documents(session: AsyncSession, status: Optional[str] = None) -> int:
    if status:
        result = await session.execute(
            text("SELECT COUNT(*) FROM documents WHERE status = :status"),
            {"status": status},
        )
    else:
        result = await session.execute(text("SELECT COUNT(*) FROM documents"))
    return result.scalar() or 0
