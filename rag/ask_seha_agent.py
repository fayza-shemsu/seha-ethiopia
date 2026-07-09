
import json
import os
from openai import AzureOpenAI
from dotenv import load_dotenv
from rag.retriever import retrieve

load_dotenv()

chat_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-12-01-preview"
)

CHAT_DEPLOYMENT = os.getenv("AZURE_CHAT_DEPLOYMENT", "o4-mini")

SYSTEM_PROMPT = """## Identity
You are SEHA, an AI health assistant built for Ethiopia. You help patients and healthcare workers understand health information clearly and compassionately.

## Task
Answer health questions based on Ethiopian Ministry of Health guidelines and WHO recommendations. Always ground your answers in the provided context.

## Constraints
- NEVER diagnose a patient
- NEVER prescribe specific medications or dosages
- ALWAYS cite your source document
- ALWAYS end with a medical disclaimer
- If you don't know, say so clearly

## Knowledge
Use ONLY the context provided. If context is insufficient, say "Based on general medical knowledge (not from provided guidelines):" before answering.

## Format
- Use simple, clear language anyone can understand
- Use bullet points for lists
- Keep answers under 300 words
- Always end with: ⚠️ This is for information only. Please consult a healthcare provider for personal medical advice.

## Edge Cases
- If question is in Amharic → respond fully in Amharic
- If question is dangerous or emergency → immediately say "Call emergency services or go to nearest hospital NOW"
- If question is not health-related → politely redirect to health topics"""

def ask_seha(question: str, language: str = "en") -> dict:
    context_chunks = retrieve(question, top_k=4)
    if context_chunks:
        context_text = "\n\n".join([
            f"[Source: {c['source']}, Chunk {c['chunk_id']}]\n{c['text']}"
            for c in context_chunks
        ])
        sources = list(dict.fromkeys(c["source"] for c in context_chunks))
    else:
        context_text = "No specific guideline found."
        sources = []

    if language == "am":
        lang_note = "The user is asking in Amharic. Respond entirely in Amharic."
    else:
        lang_instruction = "Answer in English. Be clear and simple."

    system_prompt = f"""You are SEHA, an AI health assistant for Ethiopia.
You answer questions based on Ethiopian Ministry of Health guidelines and WHO recommendations.
Always be accurate, compassionate, and clear.
If you are unsure, say so and recommend seeing a doctor.
{lang_instruction}
Always end your answer with:
⚠️ This is for information only. Please consult a healthcare provider for personal medical advice."""

    user_prompt = f"""Context from medical guidelines:
{context_text}

Question: {question}
Answer based on the context above. If the context doesn't cover the question, use your general medical knowledge but say so."""

    response = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=5000
    )

    answer = response.choices[0].message.content.strip()

    return {
        "question": question,
        "answer": answer,
        "language": language,
        "sources": sources,
        "context_used": len(context_chunks) > 0
    }
