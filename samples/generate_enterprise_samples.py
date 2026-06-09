"""Generate enterprise internal-form PDFs for unknown-schema extraction testing."""

from pathlib import Path

import fitz

OUT_DIR = Path(__file__).parent
PUBLIC_DIR = Path(__file__).parent.parent / "frontend" / "public" / "samples"

ENTERPRISE_SAMPLES: dict[str, list[tuple[str, int, bool]]] = {
    "client-capex-request.pdf": [
        ("INTERNAL USE ONLY", 10, False),
        ("Capital Expenditure Request Form", 18, True),
        ("", 10, False),
        ("Company: NordAxis Components GmbH", 11, False),
        ("Department: Operations & Maintenance", 11, False),
        ("Request ID: CAP-2026-0147", 11, False),
        ("Submitted by: Elena Vogt (Plant Manager)", 11, False),
        ("Submission Date: 2026-03-18", 11, False),
        ("", 10, False),
        ("REQUEST SUMMARY", 12, True),
        ("Replacement of the hydraulic press monitoring unit on Line 4.", 10, False),
        ("The legacy controller cannot export telemetry required for Q2 audits.", 10, False),
        ("", 10, False),
        ("FINANCIAL DETAILS", 12, True),
        ("Estimated Cost: EUR 18,450.00", 11, False),
        ("Budget Code: OPEX-TRANSFER-7741", 11, False),
        ("Preferred Vendor: Mechatron Systems AG", 11, False),
        ("Required Delivery: 2026-05-02", 11, False),
        ("", 10, False),
        ("APPROVAL WORKFLOW", 12, True),
        ("1. Department Head: Pending", 10, False),
        ("2. Finance Controller: Pending", 10, False),
        ("3. Regional Director: Pending", 10, False),
        ("", 10, False),
        ("NOTES", 12, True),
        ("Attach vendor quote ref. MS-44821 and maintenance incident log #INC-9034.", 10, False),
        ("This document is not a contract, invoice, or financial statement.", 9, False),
    ],
    "client-it-access-request.pdf": [
        ("CONFIDENTIAL — INTERNAL HR/IT USE", 10, False),
        ("Software License & System Access Request", 17, True),
        ("", 10, False),
        ("Organization: NordAxis Components GmbH", 11, False),
        ("Requesting Department: Product Engineering", 11, False),
        ("Request ID: IT-REQ-2026-0882", 11, False),
        ("Submitted by: Marcus Chen (Engineering Lead)", 11, False),
        ("Submission Date: 2026-04-02", 11, False),
        ("", 10, False),
        ("REQUEST SUMMARY", 12, True),
        ("Provision Figma Enterprise and Jira Software seats for 3 new hires.", 10, False),
        ("Start date: 2026-04-15. SSO groups must be mapped before day one.", 10, False),
        ("", 10, False),
        ("ACCESS DETAILS", 12, True),
        ("Application: Figma Enterprise (3 seats)", 10, False),
        ("Application: Jira Software Cloud (3 seats)", 10, False),
        ("Cost Center: ENG-PRODUCT-220", 11, False),
        ("Annual Cost Estimate: EUR 4,680.00", 11, False),
        ("Preferred Vendor: Atlassian / Figma (direct billing)", 10, False),
        ("Required Activation Date: 2026-04-14", 11, False),
        ("", 10, False),
        ("COMPLIANCE", 12, True),
        ("Data Classification: Internal", 10, False),
        ("GDPR Review Required: Yes — employee PII in provisioning", 10, False),
        ("Security Review: Pending — SSO group mapping", 10, False),
        ("", 10, False),
        ("APPROVAL WORKFLOW", 12, True),
        ("1. Department Head: Approved (Marcus Chen)", 10, False),
        ("2. IT Security: Pending", 10, False),
        ("3. Procurement: Pending", 10, False),
        ("", 10, False),
        ("NOTES", 12, True),
        ("Reference onboarding ticket #ONB-7731. Attach signed NDA templates.", 10, False),
        ("This document is not a financial statement or external contract.", 9, False),
    ],
}


def write_pdf(filename: str, lines: list[tuple[str, int, bool]]) -> Path:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    y = 50
    for text, size, bold in lines:
        if not text:
            y += size * 0.6
            continue
        font = "hebo" if bold else "helv"
        page.insert_text((50, y), text, fontname=font, fontsize=size, color=(0.1, 0.1, 0.15))
        y += size * 1.35
    path = OUT_DIR / filename
    doc.save(path)
    doc.close()
    return path


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    for filename, lines in ENTERPRISE_SAMPLES.items():
        path = write_pdf(filename, lines)
        dest = PUBLIC_DIR / filename
        dest.write_bytes(path.read_bytes())
        print(f"Created: {path} -> {dest}")


if __name__ == "__main__":
    main()
