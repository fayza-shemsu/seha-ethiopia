from fastapi import APIRouter, UploadFile, File
from cognitive.image_upload import upload_to_blob

router = APIRouter()


@router.get("/")
def documents_stub():
    return {
        "status": "ok",
        "message": "Documents route is working",
        "data": {
            "summary": "Patient has elevated white blood cell count",
            "key_findings": ["WBC: 12.5", "Hemoglobin: 9.2"],
            "flagged": ["Low hemoglobin"]
        }
    }


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF or image) to Azure Blob Storage.
    Returns the blob URL.
    """
    try:
        # Read file content
        file_data = await file.read()

        # Upload to Azure Blob Storage
        blob_url = upload_to_blob(file.filename, file_data)

        return {
            "status": "ok",
            "message": "File uploaded successfully",
            "file_name": file.filename,
            "blob_url": blob_url
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }