"""
evaluator.py — RAG vs. no-RAG evaluation framework for ProcureSense.
Compares grounded RAG answers against baseline LLM answers.
Measures: faithfulness, hallucination risk, retrieval quality.
"""

import ollama
from embeddings import embed_query
from vector_store import search_contract
from reranker import rerank


def _ask_without_rag(question: str) -> str:
    """Send question to LLM with NO contract context (baseline)."""
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
    """
    Heuristic faithfulness score:
    Ratio of answer sentences that share at least one significant token
    with any retrieved chunk.
    Score range: 0.0 (fully hallucinated) → 1.0 (fully grounded).
    """
    if not chunks or not answer:
        return 0.0

    # Build token set from all chunks
    chunk_tokens = set()
    for chunk in chunks:
        text = chunk.get("text", "") if isinstance(chunk, dict) else str(chunk)
        tokens = set(text.lower().split())
        chunk_tokens.update(tokens)

    # Evaluate each sentence in the answer
    sentences = [s.strip() for s in answer.replace(".", ".\n").split("\n") if len(s.strip()) > 20]
    if not sentences:
        return 0.5  # Can't evaluate

    grounded_count = 0
    for sentence in sentences:
        sentence_tokens = set(sentence.lower().split())
        # Significant overlap = more than 3 shared content words
        overlap = sentence_tokens & chunk_tokens
        # Remove common stop words from overlap count
        stop_words = {"the", "a", "an", "is", "in", "of", "and", "or", "to", "for", "with", "that", "this"}
        meaningful_overlap = overlap - stop_words
        if len(meaningful_overlap) >= 3:
            grounded_count += 1

    return round(grounded_count / len(sentences), 2)


def _detect_hallucination(norag_answer: str, rag_chunks: list) -> bool:
    """
    Hallucination flag: True if the no-RAG answer makes specific factual claims
    (contains numbers, dates, percentages) that do NOT appear in retrieved chunks.
    """
    import re

    # Extract specific factual claims (numbers, dates, percentages)
    facts_in_norag = set(re.findall(r"\b\d+[\.,]?\d*%?\b", norag_answer))
    if not facts_in_norag:
        return False  # No specific claims to hallucinate

    chunk_text = " ".join(
        c.get("text", "") if isinstance(c, dict) else str(c)
        for c in rag_chunks
    )
    facts_in_chunks = set(re.findall(r"\b\d+[\.,]?\d*%?\b", chunk_text))

    # If norag mentions facts not in chunks, likely hallucinating
    unsupported = facts_in_norag - facts_in_chunks
    return len(unsupported) > 0


def evaluate_query(question: str) -> dict:
    """
    Full evaluation run: compare RAG vs. no-RAG for a single query.

    Returns:
        {
            question: str,
            rag_answer: str,
            norag_answer: str,
            rag_sources: list of source dicts,
            faithfulness_score: float (0.0–1.0),
            hallucination_flag: bool,
            retrieval_count: int,
        }
    """
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
