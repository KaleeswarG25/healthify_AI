# ai-service/app/pdf_parser.py
import PyPDF2
import io

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from PDF binary content
    """
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
        
        if not text.strip():
            return "⚠️ No text could be extracted. The PDF might be scanned or image-based."
        
        return text.strip()
        
    except Exception as e:
        return f"❌ Error extracting text: {str(e)}"