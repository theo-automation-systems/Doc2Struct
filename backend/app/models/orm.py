"""
SQLAlchemy ORM models — Document and Extraction tables.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any

from sqlalchemy import (
    String, Integer, Float, DateTime, Text, Enum as SAEnum, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.document import DocumentType, DocumentStatus


class DocumentORM(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    type: Mapped[str] = mapped_column(
        SAEnum(DocumentType, name="document_type", create_constraint=True),
        default=DocumentType.unknown,
        server_default="unknown",
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        SAEnum(DocumentStatus, name="document_status", create_constraint=True),
        default=DocumentStatus.pending,
        server_default="pending",
        nullable=False,
    )
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

    extraction: Mapped[Optional["ExtractionORM"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="noload",
    )

    def to_pydantic(self):
        from app.models.document import DocumentMetadata
        return DocumentMetadata(
            id=self.id,
            name=self.name,
            type=DocumentType(self.type),
            status=DocumentStatus(self.status),
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

    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    )
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    fields: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    raw_json: Mapped[Any] = mapped_column(JSONB, nullable=False, default=dict)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    key_insights: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    action_items: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    warnings: Mapped[Any] = mapped_column(JSONB, nullable=False, default=list)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    document: Mapped["DocumentORM"] = relationship(back_populates="extraction")

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
