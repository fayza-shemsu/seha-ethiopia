from fastapi import APIRouter, HTTPException, UploadFile, File
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from cognitive.image_upload import upload_to_blob
    from cognitive.document_reader import analyze_document
except ImportError as e:
    print(f"Warning: Could not import cognitive modules: {e}")
    upload_to_blob = None
    analyze_document = None

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if upload_to_blob is None:
        raise HTTPException(500, detail="Blob upload not configured")
    try:
        url = await upload_to_blob(file)
        return {"url": url}
    except Exception as e:
        raise HTTPException(500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze")   # Changed from /upload to avoid conflict
async def analyze_document_endpoint(data: dict):
    if not data.get("file_url"):
        raise HTTPException(400, detail="file_url is required")
    
    if analyze_document is None:
        raise HTTPException(500, detail="Document analysis not configured")
    
    try:
        result = analyze_document(data["file_url"])
        return result
    except Exception as e:
        raise HTTPException(500, detail=f"Analysis failed: {str(e)}")