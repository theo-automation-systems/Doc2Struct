"""Generate sample PDFs (1 per category) for Groq extraction testing."""

from pathlib import Path

import fitz

OUT_DIR = Path(__file__).parent
PUBLIC_DIR = Path(__file__).parent.parent / "frontend" / "public" / "samples"

SAMPLES: dict[str, list[tuple[str, int, bool]]] = {
    "sample-invoice.pdf": [
        ("INVOICE", 22, True),
        ("", 12, False),
        ("DigitalFlow SAS", 14, True),
        ("42 Avenue de la Republique, 75011 Paris, France", 10, False),
        ("", 12, False),
        ("BILL TO: Acme Industries Ltd.", 11, False),
        ("Invoice Number: INV-2026-0042", 11, False),
        ("Issue Date: 2026-05-15", 11, False),
        ("Due Date: 2026-06-14", 11, False),
        ("Subtotal: 2,450.00 EUR  |  Tax 20%: 490.00 EUR", 11, False),
        ("TOTAL AMOUNT DUE: 2,940.00 EUR", 12, True),
    ],
    "sample-resume.pdf": [
        ("SARAH MITCHELL", 20, True),
        ("San Francisco, CA  |  sarah.mitchell@email.com  |  +1 415 555 0192", 10, False),
        ("", 12, False),
        ("SENIOR FULL-STACK DEVELOPER", 14, True),
        ("", 12, False),
        ("EXPERIENCE", 12, True),
        ("Stripe — Senior Software Engineer (2022 - Present)", 11, False),
        ("Led payment infrastructure team, $2B+ transaction volume.", 10, False),
        ("Google — Software Engineer II (2018 - 2022)", 11, False),
        ("Built Google Workspace features for 3M+ enterprise users.", 10, False),
        ("", 12, False),
        ("SKILLS: React, TypeScript, Node.js, Python, AWS, PostgreSQL", 10, False),
        ("EDUCATION: B.Sc. Computer Science, Stanford University, 2016", 10, False),
        ("LANGUAGES: English, French, Spanish", 10, False),
    ],
    "sample-contract.pdf": [
        ("NON-DISCLOSURE AGREEMENT", 18, True),
        ("", 12, False),
        ("Parties: TechVentures Inc. and DigitalFlow Ltd.", 11, False),
        ("Contract Type: Mutual Non-Disclosure Agreement", 11, False),
        ("Effective Date: 2025-12-01", 11, False),
        ("Expiry Date: 2028-12-01", 11, False),
        ("Jurisdiction: Delaware, USA", 11, False),
        ("Governing Law: State of Delaware", 11, False),
        ("", 12, False),
        ("OBLIGATIONS", 12, True),
        ("- Both parties shall keep confidential all proprietary information", 10, False),
        ("- No disclosure to third parties without written consent", 10, False),
        ("- Return or destroy materials upon termination", 10, False),
        ("", 12, False),
        ("Termination: Either party may terminate with 30 days written notice.", 10, False),
        ("Confidentiality: Yes — mutual binding clause applies.", 10, False),
    ],
    "sample-report.pdf": [
        ("Q3 2025 FINANCIAL REPORT", 18, True),
        ("GlobalTech Solutions", 14, True),
        ("", 12, False),
        ("Period: Q3 2025 (July - September)", 11, False),
        ("Currency: USD", 11, False),
        ("", 12, False),
        ("KEY METRICS", 12, True),
        ("Revenue:           $18,400,000", 11, False),
        ("Net Profit:         $4,200,000", 11, False),
        ("Growth Rate (YoY):       23%", 11, False),
        ("Operating Margin:       22.8%", 11, False),
        ("", 12, False),
        ("HIGHLIGHTS", 12, True),
        ("- EMEA region grew 31% year-over-year", 10, False),
        ("- New enterprise contracts up 18%", 10, False),
        ("- Cloud services margin improved 4.2pp", 10, False),
        ("", 12, False),
        ("RISKS: APAC growth slowing to 12%. Monitor Q4 pipeline.", 10, False),
        ("OUTLOOK: Strong finish expected for FY2025.", 10, False),
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
    for filename, lines in SAMPLES.items():
        path = write_pdf(filename, lines)
        dest = PUBLIC_DIR / filename
        dest.write_bytes(path.read_bytes())
        print(f"Created: {path} -> {dest}")


if __name__ == "__main__":
    main()
