import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# AZURE EMBEDDING CLIENT
# ============================================================
embedding_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_EMBEDDING_ENDPOINT"),
    api_key=os.getenv("AZURE_EMBEDDING_KEY"),
    api_version="2024-02-01"
)

EMBEDDING_DEPLOYMENT = os.getenv("AZURE_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")

def chunk_text(text: str, chunk_size: int = 500) -> list:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - 50):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def embed_text(text: str) -> list:
    response = embedding_client.embeddings.create(
        model=EMBEDDING_DEPLOYMENT,
        input=text
    )
    return response.data[0].embedding

def index_documents(pdf_texts: list) -> list:
    index = []
    for doc in pdf_texts:
        chunks = chunk_text(doc["text"])
        for i, chunk in enumerate(chunks):
            embedding = embed_text(chunk)
            index.append({
                "source": doc["source"],
                "chunk_id": i,
                "text": chunk,
                "embedding": embedding
            })
        print(f"Indexed {len(chunks)} chunks from {doc['source']}")
    return index

def save_index(index: list, path: str = "rag/index.json"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(index, f)
    print(f"Index saved to {path} ({len(index)} chunks)")

def load_index(path: str = "rag/index.json") -> list:
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        return json.load(f)
