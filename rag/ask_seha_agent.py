import os
import json
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

DISCLAIMER = (
    "This is for information only. Always consult a licensed healthcare provider."
)


def _build_prompts(question: str, language: str = "en"):
    context_chunks = retrieve(question, top_k=4)
    if context_chunks:
        context_text = "\n\n".join([
            f"[From: {c['source']}]\n{c['text']}"
            for c in context_chunks
        ])
        sources = list(dict.fromkeys(c["source"] for c in context_chunks))
    else:
        context_text = "No specific guideline found. Use general medical knowledge."
        sources = []

    if language == "am":
        lang_instruction = "Answer in Amharic (አማርኛ). Be clear and simple."
    else:
        lang_instruction = "Answer in English. Be clear and simple."

    system_prompt = f"""You are SEHA, an AI health assistant for Ethiopia.
You answer questions based on Ethiopian Ministry of Health guidelines and WHO recommendations.
Always be accurate, compassionate, and clear.
If you are unsure, say so and recommend seeing a doctor.
{lang_instruction}
Do not repeat the disclaimer in your answer — it is shown separately in the UI."""

    user_prompt = f"""Context from medical guidelines:
{context_text}

Question: {question}
Answer based on the context above. If the context doesn't cover the question, use your general medical knowledge but say so."""

    return system_prompt, user_prompt, sources, len(context_chunks) > 0


def ask_seha(question: str, language: str = "en") -> dict:
    system_prompt, user_prompt, sources, context_used = _build_prompts(question, language)

    response = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=600
    )

    answer = response.choices[0].message.content.strip()
    return {
        "question": question,
        "answer": answer,
        "language": language,
        "sources": sources,
        "context_used": context_used,
        "disclaimer": DISCLAIMER,
    }


def ask_seha_stream(question: str, language: str = "en"):
    """Yield SSE events: meta → token chunks → done."""
    system_prompt, user_prompt, sources, context_used = _build_prompts(question, language)

    yield f"data: {json.dumps({'type': 'meta', 'sources': sources, 'context_used': context_used, 'disclaimer': DISCLAIMER})}\n\n"

    stream = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=600,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
