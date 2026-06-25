import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend folder to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now import routes
from routes import symptom, documents, prescription, assistant

app = FastAPI(
    title="SEHA API",
    description="AI Healthcare Assistant for Ethiopia",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(symptom.router, prefix="/symptoms", tags=["Symptoms"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(prescription.router, prefix="/prescription", tags=["Prescription"])
app.include_router(assistant.router, prefix="/ask", tags=["Assistant"])

@app.get("/")
def root():
    return {"message": "SEHA API is running ✅", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)