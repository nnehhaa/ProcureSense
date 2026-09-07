"""
contract_parser.py — Unified document text extraction for ProcureSense.
Supports: PDF (digital), PDF (scanned/OCR), DOCX.
"""

import os
import fitz  # PyMuPDF


def _is_scanned_pdf(text: str) -> bool:
    """Heuristic: if extracted text is very short, the PDF is likely scanned."""
    return len(text.strip()) < 150


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a digital PDF using PyMuPDF."""
    document = fitz.open(pdf_path)
    text = ""
    for page in document:
        text += page.get_text()
    document.close()
    return text


def extract_text_from_pdf_ocr(pdf_path: str) -> str:
    """OCR fallback for scanned PDFs using pytesseract + Pillow."""
    try:
        import pytesseract
        from PIL import Image
        import io

        document = fitz.open(pdf_path)
        text = ""
        for page_num, page in enumerate(document):
            # Render page to image at 300 DPI
            mat = fitz.Matrix(300 / 72, 300 / 72)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            page_text = pytesseract.image_to_string(image, lang="eng")
            text += f"\n[Page {page_num + 1}]\n{page_text}"
        document.close()
        return text

    except ImportError:
        print("[contract_parser] pytesseract/Pillow not installed — OCR unavailable for scanned PDF.")
        return "[Scanned PDF detected — OCR not available. Install pytesseract and Pillow for OCR support.]"

    except Exception as e:
        print(f"[contract_parser] OCR error: {e}")
        return f"[OCR failed: {str(e)}]"


def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(docx_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]

        # Also extract text from tables
        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    table_texts.append(row_text)

        all_text = "\n".join(paragraphs)
        if table_texts:
            all_text += "\n\n[Tables]\n" + "\n".join(table_texts)

        return all_text

    except ImportError:
        print("[contract_parser] python-docx not installed — DOCX extraction unavailable.")
        return "[DOCX extraction failed — install python-docx.]"

    except Exception as e:
        print(f"[contract_parser] DOCX extraction error: {e}")
        return f"[DOCX extraction failed: {str(e)}]"


def extract_text(file_path: str) -> str:
    """
    Unified extraction entry point.
    Detects file type, applies appropriate extractor,
    and falls back to OCR for scanned PDFs.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".docx":
        print(f"[contract_parser] Extracting DOCX: {file_path}")
        return extract_text_from_docx(file_path)

    elif ext == ".pdf":
        print(f"[contract_parser] Extracting PDF: {file_path}")
        text = extract_text_from_pdf(file_path)

        if _is_scanned_pdf(text):
            print(f"[contract_parser] Scanned PDF detected — running OCR on: {file_path}")
            text = extract_text_from_pdf_ocr(file_path)
        else:
            print(f"[contract_parser] Digital PDF — extracted {len(text)} chars.")

        return text

    else:
        print(f"[contract_parser] Unsupported file type: {ext}")
        return f"[Unsupported file type: {ext}. Supported: .pdf, .docx]"