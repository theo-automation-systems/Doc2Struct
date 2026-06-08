"""Generate a sample invoice PDF for Doc2Struct import testing."""

from pathlib import Path

import fitz  # PyMuPDF

OUTPUT = Path(__file__).parent / "sample-invoice.pdf"

LINES = [
    ("INVOICE", 22, True),
    ("", 12, False),
    ("DigitalFlow SAS", 14, True),
    ("42 Avenue de la République, 75011 Paris, France", 10, False),
    ("SIRET: 892 456 123 00017  |  VAT: FR89 245612300", 10, False),
    ("", 12, False),
    ("BILL TO", 11, True),
    ("Acme Industries Ltd.", 11, False),
    ("128 Baker Street, London NW1 6XE, United Kingdom", 10, False),
    ("", 12, False),
    ("Invoice Number: INV-2026-0042", 11, False),
    ("Issue Date: 2026-05-15", 11, False),
    ("Due Date: 2026-06-14", 11, False),
    ("Payment Terms: Net 30 days", 11, False),
    ("Currency: EUR", 11, False),
    ("", 12, False),
    ("LINE ITEMS", 11, True),
    ("Description                          Qty    Unit Price      Total", 10, False),
    ("-" * 62, 10, False),
    ("SaaS Platform License (Annual)         1      1,200.00 EUR   1,200.00 EUR", 10, False),
    ("Onboarding & Training (8h)             1        800.00 EUR     800.00 EUR", 10, False),
    ("Premium API Support (Monthly)          3        150.00 EUR     450.00 EUR", 10, False),
    ("", 12, False),
    ("Subtotal:                                              2,450.00 EUR", 11, False),
    ("Tax Rate: 20% (VAT)", 11, False),
    ("Tax Amount:                                             490.00 EUR", 11, False),
    ("TOTAL AMOUNT DUE:                                     2,940.00 EUR", 12, True),
    ("", 12, False),
    ("Notes: Thank you for your business. Please reference INV-2026-0042 on payment.", 9, False),
    ("Bank: BNP Paribas  |  IBAN: FR76 3000 4000 1200 3456 7890 123", 9, False),
]


def main() -> None:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    y = 50
    for text, size, bold in LINES:
        if not text:
            y += size * 0.6
            continue
        font = "hebo" if bold else "helv"
        page.insert_text((50, y), text, fontname=font, fontsize=size, color=(0.1, 0.1, 0.15))
        y += size * 1.35

    doc.save(OUTPUT)
    doc.close()
    print(f"Created: {OUTPUT}")


if __name__ == "__main__":
    main()
