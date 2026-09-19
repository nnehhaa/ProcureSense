import ollama
from embeddings import embed_query
from vector_store import search_contract
from reranker import rerank


def _ask_without_rag(question: str) -> str:
    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a procurement contract analyst. "
                    "Answer the question below based on your general knowledge."
                )
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )
    return response["message"]["content"]


def _compute_faithfulness(answer: str, chunks: list) -> float:
    if not chunks or not answer:
        return 0.0

    chunk_tokens = set()
    for chunk in chunks:
        text = chunk.get("text", "") if isinstance(chunk, dict) else str(chunk)
        tokens = set(text.lower().split())
        chunk_tokens.update(tokens)

    sentences = [s.strip() for s in answer.replace(".", ".\n").split("\n") if len(s.strip()) > 20]
    if not sentences:
        return 0.5

    grounded_count = 0
    for sentence in sentences:
        sentence_tokens = set(sentence.lower().split())
        overlap = sentence_tokens & chunk_tokens
        stop_words = {"the", "a", "an", "is", "in", "of", "and", "or", "to", "for", "with", "that", "this"}
        meaningful_overlap = overlap - stop_words
        if len(meaningful_overlap) >= 3:
            grounded_count += 1

    return round(grounded_count / len(sentences), 2)


def _detect_hallucination(norag_answer: str, rag_chunks: list) -> bool:
    import re

    facts_in_norag = set(re.findall(r"\b\d+[\.,]?\d*%?\b", norag_answer))
    if not facts_in_norag:
        return False

    chunk_text = " ".join(
        c.get("text", "") if isinstance(chunk, dict) else str(chunk)
        for chunk in rag_chunks
    )
    facts_in_chunks = set(re.findall(r"\b\d+[\.,]?\d*%?\b", chunk_text))

    unsupported = facts_in_norag - facts_in_chunks
    return len(unsupported) > 0


def evaluate_query(question: str) -> dict:
    print(f"[evaluator] Evaluating: '{question[:80]}...'")


    # --- RAG Path ---
    query_embedding = embed_query(question)
    results = search_contract(query_embedding, n_results=10)
    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])

    candidates = []
    for doc, meta in zip(documents, metadatas or [{}] * len(documents)):
        candidates.append({
            "text": doc,
            "source_file": (meta or {}).get("source_file", "unknown"),
            "chunk_index": (meta or {}).get("chunk_index", 0),
        })

    top_chunks = rerank(question, candidates, top_k=3) if candidates else []

    if top_chunks:
        context_text = "\n\n---\n\n".join(
            f"[Source: {c['source_file']}]\n{c['text']}" for c in top_chunks
        )
        rag_prompt = f"""You are ProcureSense AI, a procurement contract analyst.
Answer the question using ONLY the contract excerpts below.
If the answer is not in the excerpts, say "Information not found in the uploaded contracts."

--- CONTRACT EXCERPTS ---
{context_text}
--- END EXCERPTS ---

Question: {question}
Answer:"""
        rag_response = ollama.chat(
            model="llama3",
            messages=[
                {"role": "system", "content": "You are a procurement analyst. Only use provided context."},
                {"role": "user", "content": rag_prompt}
            ]
        )
        rag_answer = rag_response["message"]["content"]
    else:
        rag_answer = "Information not found in the uploaded contracts."

    # --- No-RAG Path ---
    norag_answer = _ask_without_rag(question)

    # --- Scoring ---
    faithfulness = _compute_faithfulness(rag_answer, top_chunks)
    hallucination = _detect_hallucination(norag_answer, top_chunks)

    return {
        "question": question,
        "rag_answer": rag_answer,
        "norag_answer": norag_answer,
        "rag_sources": top_chunks,
        "faithfulness_score": faithfulness,
        "hallucination_flag": hallucination,
        "retrieval_count": len(top_chunks),
    }
