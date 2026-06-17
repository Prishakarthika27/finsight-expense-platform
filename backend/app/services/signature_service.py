import fitz
import base64
import io


def sign_pdf(pdf_bytes: bytes, signature_png_bytes: bytes, page_number: int = -1) -> bytes:
    """
    Overlays a signature image onto the last page (default) of a PDF.
    Returns the signed PDF as bytes.
    """
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

    page_index = page_number if page_number >= 0 else len(pdf_document) - 1
    page = pdf_document[page_index]
    page.clean_contents()

    page_rect = page.rect
    sig_width = 150
    sig_height = 60

    # Place signature in bottom-right area with some margin
    x = page_rect.width - sig_width - 50
    y = page_rect.height - sig_height - 50

    sig_rect = fitz.Rect(x, y, x + sig_width, y + sig_height)

    page.insert_image(sig_rect, stream=signature_png_bytes)

    output_buffer = io.BytesIO()
    pdf_document.save(output_buffer, garbage=4, deflate=True, clean=True)
    pdf_document.close()

    return output_buffer.getvalue()


def decode_base64_image(base64_data: str) -> bytes:
    """Strips data URL prefix if present and decodes base64 to bytes."""
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]
    return base64.b64decode(base64_data)


def create_blank_pdf_with_text(text: str) -> bytes:
    """Creates a simple one-page PDF with given text - used for testing/demo signing."""
    pdf_document = fitz.open()
    page = pdf_document.new_page()
    page.insert_text((50, 50), text, fontsize=12)

    output_buffer = io.BytesIO()
    pdf_document.save(output_buffer, garbage=4, deflate=True, clean=True)
    pdf_document.close()

    return output_buffer.getvalue()