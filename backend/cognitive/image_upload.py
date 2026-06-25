import os
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
from fastapi import UploadFile

load_dotenv()

def get_blob_client():
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise Exception("AZURE_STORAGE_CONNECTION_STRING not found in .env")
    
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    return blob_service_client

async def upload_to_blob(file: UploadFile):
    try:
        blob_service_client = get_blob_client()
        container_name = os.getenv("AZURE_STORAGE_CONTAINER", "health-documents")
        container_client = blob_service_client.get_container_client(container_name)
        
        # Create uploads folder structure
        blob_name = f"uploads/{file.filename}"
        blob_client = container_client.get_blob_client(blob_name)
        
        content = await file.read()
        blob_client.upload_blob(content, overwrite=True)
        
        url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob_name}"
        return url
    except Exception as e:
        raise Exception(f"Upload failed: {str(e)}")