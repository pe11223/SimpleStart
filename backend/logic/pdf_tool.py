import fitz  # PyMuPDF
import io
from typing import List

def convert_pdf_to_images(pdf_bytes: bytes, dpi: int = 150) -> List[bytes]:
    """
    Converts a PDF file to a list of images (PNG bytes).
    
    Args:
        pdf_bytes: The binary content of the PDF file.
        dpi: Resolution for the output images.
        
    Returns:
        A list of bytes, where each item is a PNG image.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    
    for page in doc:
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        images.append(img_bytes)
        
    doc.close()
    return images
