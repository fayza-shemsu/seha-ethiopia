import os
import json
import numpy as np
from dotenv import load_dotenv
from rag.indexer import load_index, embed_text

load_dotenv()

def cosine_similarity(a: list, b: list) -> float:
    a = np.array(a)
    b = np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def retrieve(query: str, top_k: int = 4) -> list:
    index = load_index()
    if not index:
        return []

    query_embedding = embed_text(query)

    scored = []
    for chunk in index:
        score = cosine_similarity(query_embedding, chunk["embedding"])
        scored.append({
            "source": chunk["source"],
            "text": chunk["text"],
            "score": score
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
