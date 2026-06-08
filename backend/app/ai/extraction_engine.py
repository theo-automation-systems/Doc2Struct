"""
AI Extraction Engine — uses Groq (OpenAI-compatible API) for classification and extraction.
Supports invoice, resume, contract, and report extraction schemas.
"""

import asyncio
import json
import os
import time
import logging
import re
from typing import Any

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"  # higher Groq free-tier rate limits
FALLBACK_GROQ_MODEL = "llama-3.3-70b-versatile"

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

EXTRACTION_SYSTEM = """You are an AI document data extraction specialist.
Return ONLY valid JSON. No markdown, no explanations.
For missing fields use null. Include a confidence score (0-100) per field."""

UNIFIED_PROMPT = """Analyze this document in a single pass.

1. Classify as one of: invoice, resume, contract, report, unknown
2. Extract fields using the schema for that type (see schemas below)
3. Write a 2-sentence summary
4. Provide 3 key_insights, 2 action_items, and any warnings

Schemas by type:
{schemas}

Return JSON:
{{
  "document_type": "invoice|resume|contract|report|unknown",
  "fields": {{"field_name": {{"value": <value>, "confidence": <0-100>}}, ...}},
  "summary": "...",
  "key_insights": ["..."],
  "action_items": ["..."],
  "warnings": ["..."]
}}

Document text:
{text}"""


def _parse_json_content(content: str) -> dict:
    """Parse JSON from model output, tolerating markdown fences."""
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


class ExtractionEngine:

    def __init__(self, api_key: str | None = None, model: str | None = None):
        key = api_key or os.environ.get("GROQ_API_KEY")
        if not key:
            raise ValueError("GROQ_API_KEY is not configured")
        self.client = AsyncOpenAI(api_key=key, base_url=GROQ_BASE_URL)
        self.model = model or os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL)

    async def _chat(
        self,
        messages: list[dict],
        *,
        max_tokens: int = 1024,
        temperature: float = 0.1,
        json_mode: bool = False,
    ) -> str:
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        last_err: Exception | None = None
        for attempt in range(3):
            try:
                response = await self.client.chat.completions.create(**kwargs)
                return response.choices[0].message.content or ""
            except Exception as exc:
                last_err = exc
                err = str(exc).lower()
                if "429" in err or "rate" in err:
                    await asyncio.sleep(2 ** attempt + 1)
                    continue
                if json_mode and "response_format" in kwargs:
                    kwargs.pop("response_format", None)
                    try:
                        response = await self.client.chat.completions.create(**kwargs)
                        return response.choices[0].message.content or ""
                    except Exception as exc2:
                        last_err = exc2
                break
        raise last_err  # type: ignore[misc]

    def _normalize_doc_type(self, doc_type: str) -> str:
        doc_type = (doc_type or "unknown").strip().lower()
        for t in [*EXTRACTION_SCHEMAS.keys(), "unknown"]:
            if t in doc_type:
                return t
        return "unknown"

    async def process_document(self, text: str) -> dict[str, Any]:
        """Single Groq call: classify, extract, summarize (saves API quota)."""
        start_time = time.time()
        schemas = json.dumps(
            {k: v["fields"] for k, v in EXTRACTION_SCHEMAS.items()},
            indent=2,
        )
        prompt = UNIFIED_PROMPT.format(schemas=schemas, text=text[:4000])

        content = await self._chat(
            [
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=4096,
            temperature=0.1,
            json_mode=True,
        )

        parsed = _parse_json_content(content)
        doc_type = self._normalize_doc_type(parsed.get("document_type", "unknown"))
        fields_blob = parsed.get("fields") or {}
        raw_json = fields_blob if isinstance(fields_blob, dict) else parsed
        fields = self._parse_fields(raw_json)
        confidence = sum(f["confidence"] for f in fields) / len(fields) if fields else 0
        processing_time = int((time.time() - start_time) * 1000)

        return {
            "document_type": doc_type,
            "fields": fields,
            "raw_json": raw_json,
            "summary": parsed.get("summary") or self._fallback_summary(doc_type, fields),
            "key_insights": parsed.get("key_insights") or [],
            "action_items": parsed.get("action_items") or [],
            "warnings": parsed.get("warnings") or [],
            "confidence": round(confidence, 1),
            "processing_time_ms": processing_time,
        }

    def _fallback_summary(self, doc_type: str, fields: list[dict]) -> str:
        parts = [f"{f['key']}: {f['value']}" for f in fields[:4] if f.get("value")]
        if parts:
            return f"{doc_type.capitalize()} document — " + "; ".join(parts) + "."
        return f"{doc_type.capitalize()} document processed."

    def _parse_fields(self, raw_json: dict) -> list[dict]:
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
