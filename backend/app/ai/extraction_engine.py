"""
AI Extraction Engine — uses Groq (OpenAI-compatible API) for classification and extraction.
Supports invoice, resume, contract, report, and generic unknown document schemas.
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
    "unknown": {
        "description": (
            "Generic internal or business document (forms, capex requests, memos, "
            "authorizations, procedures). Infer field keys from labels in the source text."
        ),
        "fields": {
            "document_title": "string — main title or form name",
            "document_subtype": "string — short type label (e.g. capex request, internal memo)",
            "organization": "string — company or entity name",
            "department": "string or null",
            "submitted_by": "string or null — person and role if present",
            "reference_id": "string or null — request ID, case number, form ID",
            "submission_date": "date (YYYY-MM-DD) or null",
            "purpose": "string — request summary / reason for the document",
            "estimated_cost": "number or null",
            "currency": "string or null (ISO code)",
            "budget_code": "string or null",
            "vendor": "string or null — preferred supplier or third party",
            "delivery_date": "date (YYYY-MM-DD) or null",
            "approval_steps": (
                "array of {step: string, status: string} — one object per workflow line"
            ),
            "attachments_referenced": "array of strings — quoted refs, logs, file IDs",
            "notes": "string or null — only if not already covered by attachments_referenced",
            "_dynamic": (
                "ADD more snake_case keys for every other labeled value in the document "
                "(e.g. line_number, incident_id, jurisdiction). Do not leave sections empty."
            ),
        },
    },
}

INTERNAL_FORM_MARKERS = (
    "internal use only",
    "capital expenditure",
    "capex",
    "approval workflow",
    "request form",
    "request id",
    "submitted by",
    "budget code",
    "estimated cost",
)

REPORT_MARKERS = (
    "quarterly",
    "annual report",
    "net profit",
    "revenue growth",
    "earnings per share",
    "fiscal year",
    "key performance indicator",
)

UNKNOWN_FILENAME_HINTS = (
    "capex",
    "request",
    "internal",
    "form",
    "memo",
)

REPORT_KPI_FIELDS = (
    "revenue",
    "net_profit",
    "growth_rate",
    "period",
    "key_metrics",
)

EXTRACTION_SYSTEM = """You are an AI document data extraction specialist.
Return ONLY valid JSON. No markdown, no explanations.
For missing fields use null. Include a confidence score (0-100) per field."""

UNIFIED_PROMPT = """Analyze this document in a single pass.

1. Classify as one of: invoice, resume, contract, report, unknown
2. Extract fields using the schema for that type (see schemas below)
3. Write a 2-sentence summary
4. Provide 3 key_insights, 2 action_items, and any warnings

Classification rules:
- invoice / resume / contract: only when the document is clearly that type
- report: only for financial or quarterly/annual reports with KPIs and financial statements
- unknown: internal forms, capex/purchase requests, memos, procedures, letters, or anything else

When document_type is unknown:
- Use the unknown schema as a starting point, then ADD snake_case keys for every labeled value in the text
- Name keys after document labels (e.g. request_id, preferred_vendor, required_delivery)
- Extract 10–18 populated fields; omit fields that are not in the document (do not return null placeholders)
- Do NOT use invoice/resume/contract/report field names unless they literally appear in the document
- estimated_cost and similar amounts: return as JSON numbers (not strings); keep currency in a separate field
- approval_steps: return [{step, status}, ...] not a comma-separated string
- Do not duplicate attachment references in both notes and attachments_referenced

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
        aliases = {"generic": "unknown", "form": "unknown", "internal": "unknown", "memo": "unknown"}
        if doc_type in aliases:
            return aliases[doc_type]
        for t in EXTRACTION_SCHEMAS:
            if t in doc_type:
                return t
        return "unknown"

    def _is_empty_value(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str) and not value.strip():
            return True
        if isinstance(value, (list, dict)) and len(value) == 0:
            return True
        return False

    def _field_value(self, fields: dict, key: str) -> Any:
        data = fields.get(key)
        if isinstance(data, dict):
            return data.get("value")
        return data

    def _filename_suggests_unknown(self, filename: str | None) -> bool:
        if not filename:
            return False
        lowered = filename.lower()
        return any(hint in lowered for hint in UNKNOWN_FILENAME_HINTS)

    def _looks_like_internal_form(self, text: str) -> bool:
        lowered = text.lower()
        hits = sum(1 for marker in INTERNAL_FORM_MARKERS if marker in lowered)
        if hits >= 1:
            return not any(marker in lowered for marker in REPORT_MARKERS)
        return False

    def _looks_like_misclassified_report(self, parsed: dict) -> bool:
        """Report schema with mostly empty KPIs = likely an internal form."""
        fields = parsed.get("fields") or {}
        if not isinstance(fields, dict):
            return False

        empty_kpis = sum(
            1 for key in REPORT_KPI_FIELDS if self._is_empty_value(self._field_value(fields, key))
        )
        if empty_kpis < 3:
            return False

        populated = [
            key
            for key, data in fields.items()
            if not key.startswith("_") and not self._is_empty_value(
                data.get("value") if isinstance(data, dict) else data
            )
        ]
        return len(populated) <= 5

    async def _extract_as_unknown(self, text: str) -> dict:
        """Second pass when a form was misclassified as report."""
        schema = json.dumps(EXTRACTION_SCHEMAS["unknown"]["fields"], indent=2)
        prompt = f"""This is an unknown/internal business document (NOT a financial report).

Extract using the unknown schema below. Add snake_case keys for every labeled value in the text.
Only include fields present in the document — do not invent report/financial KPI fields.
Return monetary amounts as numbers; approval_steps as [{step, status}, ...]; avoid duplicating attachments in notes.

Schema:
{schema}

Return JSON:
{{
  "document_type": "unknown",
  "fields": {{"field_name": {{"value": <value>, "confidence": <0-100>}}, ...}},
  "summary": "...",
  "key_insights": ["..."],
  "action_items": ["..."],
  "warnings": ["..."]
}}

Document text:
{text[:4000]}"""

        content = await self._chat(
            [
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            max_tokens=4096,
            temperature=0.1,
            json_mode=True,
        )
        return _parse_json_content(content)

    async def process_document(
        self,
        text: str,
        filename: str | None = None,
    ) -> dict[str, Any]:
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

        should_reclassify = doc_type == "report" and (
            self._looks_like_internal_form(text)
            or self._filename_suggests_unknown(filename)
            or self._looks_like_misclassified_report(parsed)
        )
        if should_reclassify:
            logger.info(
                "Re-classifying misclassified report → unknown (file=%s)",
                filename or "n/a",
            )
            parsed = await self._extract_as_unknown(text)
            doc_type = "unknown"

        fields_blob = parsed.get("fields") or {}
        raw_json = fields_blob if isinstance(fields_blob, dict) else parsed
        fields = self._parse_fields(raw_json)
        fields, raw_json = self._postprocess_fields(fields, raw_json)
        populated = [f for f in fields if not self._is_empty_value(f.get("value"))]
        fields = populated or fields
        confidence = (
            sum(f["confidence"] for f in fields) / len(fields) if fields else 0
        )
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

    def _parse_money_number(self, value: Any) -> Any:
        if value is None or isinstance(value, (int, float)):
            return value
        if not isinstance(value, str):
            return value
        cleaned = re.sub(r"[^\d.,-]", "", value.replace(" ", ""))
        if not cleaned:
            return value
        if "," in cleaned and "." in cleaned:
            cleaned = cleaned.replace(",", "")
        elif "," in cleaned:
            parts = cleaned.split(",")
            cleaned = (
                parts[0].replace(".", "") + "." + parts[-1]
                if len(parts) == 2 and len(parts[-1]) == 2
                else cleaned.replace(",", "")
            )
        try:
            return float(cleaned) if "." in cleaned else int(cleaned)
        except ValueError:
            return value

    def _parse_approval_steps(self, value: Any) -> Any:
        if isinstance(value, list):
            normalized: list[dict[str, str]] = []
            for item in value:
                if isinstance(item, dict):
                    step = str(item.get("step") or item.get("name") or "").strip()
                    status = str(item.get("status") or item.get("state") or "").strip()
                    if step:
                        normalized.append({"step": step, "status": status or "Unknown"})
                elif isinstance(item, str) and item.strip():
                    parsed = self._parse_approval_step_line(item.strip())
                    if parsed:
                        normalized.append(parsed)
            return normalized or value

        if isinstance(value, str) and value.strip():
            steps: list[dict[str, str]] = []
            chunks = re.split(r",\s+(?=[^:,]+:)|\n+", value)
            for chunk in chunks:
                parsed = self._parse_approval_step_line(chunk.strip())
                if parsed:
                    steps.append(parsed)
            if not steps:
                for chunk in value.split(","):
                    parsed = self._parse_approval_step_line(chunk.strip())
                    if parsed:
                        steps.append(parsed)
            return steps or value

        return value

    def _parse_approval_step_line(self, line: str) -> dict[str, str] | None:
        line = re.sub(r"^\d+\.\s*", "", line).strip()
        if not line:
            return None
        if ":" in line:
            step, status = line.split(":", 1)
            step, status = step.strip(), status.strip()
            if step:
                return {"step": step, "status": status or "Unknown"}
        return {"step": line, "status": "Unknown"}

    def _deduplicate_notes_attachments(self, fields_by_key: dict[str, dict]) -> None:
        notes_field = fields_by_key.get("notes")
        att_field = fields_by_key.get("attachments_referenced")
        if not notes_field or not att_field:
            return

        notes = notes_field.get("value")
        attachments = att_field.get("value")
        if not isinstance(notes, str) or not notes.strip():
            return

        att_list = (
            attachments
            if isinstance(attachments, list)
            else [str(attachments)]
            if attachments
            else []
        )
        if not att_list:
            return

        note_lower = notes.lower().strip()
        refs_in_notes = sum(
            1 for ref in att_list if str(ref).lower() in note_lower
        )
        if refs_in_notes == 0:
            return

        trimmed = notes
        for ref in att_list:
            trimmed = re.sub(re.escape(str(ref)), "", trimmed, flags=re.IGNORECASE)
        trimmed = re.sub(
            r"(?i)\battach(?:ment)?s?\b[^.]*\.?",
            "",
            trimmed,
        ).strip(" .,;")

        if len(trimmed) < 12 or refs_in_notes >= max(1, len(att_list) // 2):
            fields_by_key.pop("notes", None)
        else:
            notes_field["value"] = trimmed

    def _postprocess_fields(
        self,
        fields: list[dict],
        raw_json: dict,
    ) -> tuple[list[dict], dict]:
        fields_by_key = {f["key"]: f for f in fields}

        money_keys = (
            "estimated_cost",
            "annual_cost_estimate",
            "total_amount",
            "subtotal",
            "tax_amount",
        )
        for key in money_keys:
            if key in fields_by_key:
                fields_by_key[key]["value"] = self._parse_money_number(
                    fields_by_key[key]["value"]
                )
                if isinstance(fields_by_key[key]["value"], (int, float)):
                    fields_by_key[key]["field_type"] = "number"

        if "approval_steps" in fields_by_key:
            normalized = self._parse_approval_steps(fields_by_key["approval_steps"]["value"])
            fields_by_key["approval_steps"]["value"] = normalized
            fields_by_key["approval_steps"]["field_type"] = "array"

        self._deduplicate_notes_attachments(fields_by_key)

        updated_fields = list(fields_by_key.values())
        updated_raw = {
            key: {
                "value": f["value"],
                "confidence": f["confidence"],
            }
            for key, f in fields_by_key.items()
        }
        return updated_fields, updated_raw

    def _fallback_summary(self, doc_type: str, fields: list[dict]) -> str:
        parts = [f"{f['key']}: {f['value']}" for f in fields[:4] if f.get("value")]
        if parts:
            return f"{doc_type.capitalize()} document — " + "; ".join(parts) + "."
        return f"{doc_type.capitalize()} document processed."

    def _parse_fields(self, raw_json: dict) -> list[dict]:
        fields = []
        for key, data in raw_json.items():
            if key.startswith("_"):
                continue
            if isinstance(data, dict) and "value" in data:
                value = data.get("value")
                fields.append({
                    "key": key,
                    "value": value,
                    "confidence": float(data.get("confidence", 80)),
                    "field_type": self._infer_type(value),
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
