"""
Export Service — converts extraction results to CSV, JSON, Excel.
"""

import csv
import json
import io
from typing import Any


class ExportService:

    def to_csv(self, fields: list[dict], include_confidence: bool = True) -> str:
        """Convert extraction fields to CSV string."""
        output = io.StringIO()
        fieldnames = ["field", "value"]
        if include_confidence:
            fieldnames.append("confidence")

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for field in fields:
            row = {"field": field["key"], "value": str(field["value"] or "")}
            if include_confidence:
                row["confidence"] = f"{field['confidence']:.1f}%"
            writer.writerow(row)

        return output.getvalue()

    def to_json(self, result: dict, indent: int = 2) -> str:
        """Convert extraction result to formatted JSON string."""
        export_data = {
            "document_id": result.get("document_id"),
            "document_type": result.get("document_type"),
            "confidence": result.get("confidence"),
            "extracted_data": result.get("raw_json", {}),
            "summary": result.get("summary"),
            "key_insights": result.get("key_insights", []),
            "action_items": result.get("action_items", []),
            "warnings": result.get("warnings", []),
        }
        return json.dumps(export_data, indent=indent, ensure_ascii=False)

    def to_excel_bytes(self, fields: list[dict], document_name: str = "extraction") -> bytes:
        """Convert extraction fields to Excel file bytes."""
        import pandas as pd

        data = []
        for field in fields:
            data.append({
                "Field": field["key"].replace("_", " ").title(),
                "Value": str(field["value"] or ""),
                "Type": field.get("field_type", "string"),
                "Confidence (%)": f"{field['confidence']:.1f}",
            })

        df = pd.DataFrame(data)
        output = io.BytesIO()

        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Extraction Results", index=False)
            worksheet = writer.sheets["Extraction Results"]
            for col in worksheet.columns:
                max_len = max(len(str(cell.value or "")) for cell in col)
                worksheet.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

        return output.getvalue()
