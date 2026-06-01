"""
AI Extraction Engine — uses OpenAI structured outputs to extract data from documents.
Supports invoice, resume, contract, and report extraction schemas.
"""

import json
import time
import logging
from typing import Any

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


EXTRACTION_SCHEMAS = {
    "invoice": {
        "description": "Extract invoice data",
        "fields": {
            "invoice_number": "string",
            "company_name": "string",
            "company_address": "string",
            "client_name": "string",
            "client_address": "string",
            "issue_date": "date (YYYY-MM-DD)",
            "due_date": "date (YYYY-MM-DD)",
            "subtotal": "number",
            "tax_rate": "string (e.g. '14.5%')",
            "tax_amount": "number",
            "total_amount": "number",
            "currency": "string (ISO code)",
            "payment_terms": "string",
            "line_items": "array of {description, quantity, unit_price, total}",
        },
    },
    "resume": {
        "description": "Extract resume/CV data",
        "fields": {
            "full_name": "string",
            "email": "string",
            "phone": "string",
            "location": "string",
            "current_title": "string",
            "years_experience": "number",
            "current_company": "string",
            "education_degree": "string",
            "education_school": "string",
            "education_year": "string",
            "primary_skills": "array of strings",
            "languages": "array of strings",
            "previous_companies": "array of strings",
            "linkedin": "string or null",
            "github": "string or null",
        },
    },
    "contract": {
        "description": "Extract contract data",
        "fields": {
            "parties": "array of party names",
            "contract_type": "string",
            "effective_date": "date (YYYY-MM-DD)",
            "expiry_date": "date or null",
            "total_value": "number or null",
            "currency": "string or null",
            "jurisdiction": "string",
            "obligations": "array of key obligation strings",
            "termination_clause": "string",
            "governing_law": "string",
            "confidentiality": "boolean",
        },
    },
    "report": {
        "description": "Extract financial/business report data",
        "fields": {
            "report_title": "string",
            "period": "string",
            "company": "string",
            "revenue": "number or null",
            "net_profit": "number or null",
            "growth_rate": "number or null (percentage)",
            "currency": "string",
            "key_metrics": "array of {name, value} objects",
            "highlights": "array of key finding strings",
            "risks": "array of risk strings",
            "outlook": "string",
        },
    },
}

CLASSIFICATION_PROMPT = """Classify the following document into one of these types:
- invoice: a billing document requesting payment
- resume: a CV or resume for a job applicant
- contract: a legal agreement between parties
- report: a business or financial report
- unknown: if it doesn't fit any of the above

Respond with ONLY the type string (one of: invoice, resume, contract, report, unknown).

Document text (first 1000 chars):
{text}"""

EXTRACTION_SYSTEM = """You are an AI document data extraction specialist. 
Extract structured data from the provided document text.
Return ONLY valid JSON matching the specified schema. Do not include explanations.
For missing fields, use null. Be precise and accurate.
Include a confidence score (0-100) for each field based on how clearly it appears in the text.
Format: {"field_name": {"value": <value>, "confidence": <0-100>}, ...}"""


class ExtractionEngine:

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o-mini"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def classify_document(self, text: str) -> str:
        """Classify document type using AI."""
        try:
            truncated = text[:1500]
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": CLASSIFICATION_PROMPT.format(text=truncated)}
                ],
                max_tokens=20,
                temperature=0,
            )
            doc_type = response.choices[0].message.content.strip().lower()
            return doc_type if doc_type in EXTRACTION_SCHEMAS else "unknown"
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return "unknown"

    async def extract(self, text: str, doc_type: str) -> dict[str, Any]:
        """Extract structured data from document text."""
        start_time = time.time()

        schema = EXTRACTION_SCHEMAS.get(doc_type)
        if not schema:
            schema = EXTRACTION_SCHEMAS["report"]

        schema_str = json.dumps(schema["fields"], indent=2)
        prompt = f"""Extract structured data from this {doc_type} document.

Schema to extract:
{schema_str}

Document text:
{text[:4000]}

Return JSON with confidence scores for each field."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            raw_json = json.loads(response.choices[0].message.content)
            fields = self._parse_fields(raw_json)
            confidence = sum(f["confidence"] for f in fields) / len(fields) if fields else 0

            processing_time = int((time.time() - start_time) * 1000)

            summary = await self._generate_summary(text, doc_type, raw_json)
            insights = await self._generate_insights(doc_type, raw_json)

            return {
                "fields": fields,
                "raw_json": raw_json,
                "summary": summary,
                "key_insights": insights.get("key_insights", []),
                "action_items": insights.get("action_items", []),
                "warnings": insights.get("warnings", []),
                "confidence": round(confidence, 1),
                "processing_time_ms": processing_time,
            }
        except Exception as e:
            logger.exception(f"Extraction failed: {e}")
            raise

    async def _generate_summary(self, text: str, doc_type: str, extracted: dict) -> str:
        """Generate a concise AI summary of the document."""
        prompt = f"""Write a 2-3 sentence professional summary of this {doc_type} document.
Be concise and factual. Include key figures/names.

Extracted data: {json.dumps(extracted)[:1000]}
Document snippet: {text[:500]}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()

    async def _generate_insights(self, doc_type: str, extracted: dict) -> dict:
        """Generate insights, action items, and warnings."""
        prompt = f"""Based on this extracted {doc_type} data, provide:
1. 3-4 key insights
2. 2-3 recommended action items
3. Any warnings or concerns

Data: {json.dumps(extracted)[:1500]}

Respond as JSON: {{"key_insights": [...], "action_items": [...], "warnings": [...]}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=400,
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content)

    def _parse_fields(self, raw_json: dict) -> list[dict]:
        """Parse extracted JSON into field list with confidence scores."""
        fields = []
        for key, data in raw_json.items():
            if isinstance(data, dict) and "value" in data:
                fields.append({
                    "key": key,
                    "value": data.get("value"),
                    "confidence": float(data.get("confidence", 80)),
                    "field_type": self._infer_type(data.get("value")),
                })
            else:
                fields.append({
                    "key": key,
                    "value": data,
                    "confidence": 80.0,
                    "field_type": self._infer_type(data),
                })
        return fields

    def _infer_type(self, value: Any) -> str:
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, (int, float)):
            return "number"
        if isinstance(value, list):
            return "array"
        if isinstance(value, str):
            if "@" in value:
                return "email"
            if any(c in value for c in ["$", "€", "£"]):
                return "currency"
            if len(value) == 10 and value[4] == "-":
                return "date"
        return "string"
