"""
SQLAlchemy ORM models — Document and Extraction tables.
No ORM relationships — queries are done explicitly in routes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any

from sqlalchemy import String, Integer, Float, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.document import DocumentType, DocumentStatus


def _as_enum(value, enum_cls):
    if isinstance(value, enum_cls):
        return value
    if hasattr(value, "value"):
        return enum_cls(value.value)
    return enum_cls(value)


class DocumentORM(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    # Plain strings — avoids asyncpg / PostgreSQL native ENUM issues on Neon
    type: Mapped[str] = mapped_column(String(32), default="unknown", server_default="unknown", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", server_default="pending", nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    pages: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        nullable=False,
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=False), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    extracted_fields: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_pydantic(self):
        from app.models.document import DocumentMetadata
        return DocumentMetadata(
            id=self.id,
            name=self.name,
            type=_as_enum(self.type, DocumentType),
            status=_as_enum(self.status, DocumentStatus),
            size=self.size,
            pages=self.pages,
            uploaded_at=self.uploaded_at,
            processed_at=self.processed_at,
            confidence=self.confidence,
            extracted_fields=self.extracted_fields,
            summary=self.summary,
            error_message=self.error_message,
        )


class ExtractionORM(Base):
    __tablename__ = "extractions"

    document_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    fields: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    raw_json: Mapped[Any] = mapped_column(JSONB, nullable=False, default=dict)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    key_insights: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    action_items: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    warnings: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def to_dict(self) -> dict:
        return {
            "document_id": self.document_id,
            "document_type": self.document_type,
            "fields": self.fields,
            "raw_json": self.raw_json,
            "summary": self.summary,
            "key_insights": self.key_insights,
            "action_items": self.action_items,
            "warnings": self.warnings,
            "confidence": self.confidence,
            "processing_time_ms": self.processing_time_ms,
        }
