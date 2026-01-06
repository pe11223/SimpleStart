import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import io
import re

def replace_terms_in_epub(epub_bytes: bytes, glossary: dict) -> tuple[bytes, int]:
    """
    Replaces terms in an EPUB file based on a glossary dictionary.
    
    Args:
        epub_bytes: The binary content of the EPUB file.
        glossary: A dictionary where keys are terms to find and values are replacements.
        
    Returns:
        A tuple containing:
        - The binary content of the modified EPUB file.
        - The total number of replacements made.
    """
    
    # Load EPUB from bytes
    input_io = io.BytesIO(epub_bytes)
    total_replacements = 0
    
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as tmp_in:
        tmp_in.write(epub_bytes)
        tmp_in_path = tmp_in.name
        
    try:
        book = epub.read_epub(tmp_in_path)
        
        # Sort glossary by length of keys descending to avoid partial replacement issues
        sorted_glossary = dict(sorted(glossary.items(), key=lambda item: len(item[0]), reverse=True))
        
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                # This is an HTML/XHTML file
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                
                # We only want to replace text in text nodes, not attributes or tags
                for text_node in soup.find_all(string=True):
                    if text_node.parent.name in ['script', 'style']:
                        continue
                        
                    original_text = text_node.string
                    if not original_text:
                        continue
                        
                    new_text = original_text
                    modified = False
                    
                    for term, replacement in sorted_glossary.items():
                        if term in new_text:
                            count = new_text.count(term)
                            if count > 0:
                                new_text = new_text.replace(term, replacement)
                                total_replacements += count
                                modified = True
                            
                    if modified:
                        text_node.replace_with(new_text)
                        
                item.set_content(str(soup).encode('utf-8'))
                
        # Save to new BytesIO
        output_io = io.BytesIO()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as tmp_out:
            epub.write_epub(tmp_out.name, book, {})
            tmp_out_path = tmp_out.name
            
        with open(tmp_out_path, "rb") as f:
            output_bytes = f.read()
            
        # Cleanup
        os.unlink(tmp_out_path)
        
        return output_bytes, total_replacements
        
    finally:
        if os.path.exists(tmp_in_path):
            os.unlink(tmp_in_path)
