"""
Automation template routes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/automations", tags=["Automations"])


class AutomationTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    schema: dict[str, str]
    status: str = "active"
    documents_processed: int = 0


TEMPLATES: dict[str, AutomationTemplate] = {
    "invoice": AutomationTemplate(
        id="auto_invoice",
        name="Invoice Processing",
        description="Automatically extract vendor details, amounts, dates, and line items.",
        category="Finance",
        schema={
            "invoice_number": "string",
            "vendor_name": "string",
            "total_amount": "currency",
            "due_date": "date",
            "tax_amount": "currency",
        },
        documents_processed=1284,
    ),
    "resume": AutomationTemplate(
        id="auto_resume",
        name="Resume Screening",
        description="Parse CVs to extract skills, experience, and education.",
        category="HR",
        schema={
            "full_name": "string",
            "email": "email",
            "years_experience": "number",
            "skills": "array",
            "current_company": "string",
        },
        documents_processed=847,
    ),
    "contract": AutomationTemplate(
        id="auto_contract",
        name="Contract Analyzer",
        description="Extract key contract clauses, parties, and risk flags.",
        category="Legal",
        schema={
            "parties": "array",
            "effective_date": "date",
            "total_value": "currency",
            "obligations": "array",
            "termination_clause": "string",
        },
        documents_processed=312,
    ),
    "report": AutomationTemplate(
        id="auto_report",
        name="Financial Report Parser",
        description="Extract KPIs and trends from financial reports.",
        category="Finance",
        schema={
            "revenue": "currency",
            "net_profit": "currency",
            "growth_rate": "number",
            "key_metrics": "array",
            "period": "string",
        },
        documents_processed=156,
    ),
}


@router.get("/", response_model=list[AutomationTemplate])
async def list_automations():
    return list(TEMPLATES.values())


@router.get("/{template_id}", response_model=AutomationTemplate)
async def get_automation(template_id: str):
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Automation template not found")
    return TEMPLATES[template_id]
