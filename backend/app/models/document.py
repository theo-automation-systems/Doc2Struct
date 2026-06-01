from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class DocumentType(str, Enum):
    invoice = "invoice"
    resume = "resume"
    contract = "contract"
    report = "report"
    unknown = "unknown"


class DocumentStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class DocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: DocumentType = DocumentType.unknown
    status: DocumentStatus = DocumentStatus.pending
    size: int
    pages: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    confidence: Optional[float] = None
    extracted_fields: Optional[int] = None
    summary: Optional[str] = None
    error_message: Optional[str] = None


class ExtractionField(BaseModel):
    key: str
    value: Any
    confidence: float = Field(ge=0, le=100)
    field_type: str = "string"


class ExtractionResult(BaseModel):
    document_id: str
    document_type: DocumentType
    fields: List[ExtractionField]
    raw_json: Dict[str, Any]
    summary: str
    key_insights: List[str] = []
    action_items: List[str] = []
    warnings: List[str] = []
    confidence: float
    processing_time_ms: int


class ExportRequest(BaseModel):
    document_id: str
    format: str = Field(pattern="^(csv|json|excel|notion)$")
    include_confidence: bool = True
    notion_database_id: Optional[str] = None


class ExportResult(BaseModel):
    document_id: str
    format: str
    file_url: Optional[str] = None
    content: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
