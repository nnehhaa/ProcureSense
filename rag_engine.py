"""
rag_engine.py — RAG pipeline for ProcureSense.
Flow: embed query → retrieve top-10 → rerank → evidence gate → LLM → citations.
"""

import ollama
from embeddings import embed_query
from vector_store import search_contract
from reranker import rerank

# Evidence gate: minimum reranker score to consider chunk reliable
EVIDENCE_THRESHOLD = 0.05
NOT_FOUND_MSG = "Information not found in the uploaded contracts."


def ask_contract(question: str, source_file: str = None) -> dict:
    """
    Main RAG entry point.

    Args:
        question: Natural language user question.
        source_file: Optional — filter to a specific contract file.

    Returns:
        dict: {answer: str, sources: [{text, source_file, chunk_index, score}]}
    """

    # Step 1: Embed the user question (with BGE query prefix)
    query_embedding = embed_query(question)

    # Step 2: Retrieve top-10 candidate chunks from ChromaDB
    if source_file:
        from vector_store import search_with_filter
        results = search_with_filter(query_embedding, source_file=source_file, n_results=10)
    else:
        results = search_contract(query_embedding, n_results=10)

    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])

    if not documents:
        return {
            "answer": NOT_FOUND_MSG,
            "sources": []
        }

    # Step 3: Merge text + metadata into chunk dicts for reranker
    candidates = []
    for doc, meta in zip(documents, metadatas):
        candidates.append({
            "text": doc,
            "source_file": meta.get("source_file", "unknown") if meta else "unknown",
            "chunk_index": meta.get("chunk_index", 0) if meta else 0,
        })

    # Step 4: Rerank — cross-encoder scores and selects top-3
    top_chunks = rerank(question, candidates, top_k=3)

    # Step 5: Evidence gate — if best score is too low, no reliable evidence
    if not top_chunks or top_chunks[0]["score"] < EVIDENCE_THRESHOLD:
        return {
            "answer": NOT_FOUND_MSG,
            "sources": []
        }

    # Step 6: Build context from top-3 reranked chunks
    context_parts = []
    for i, chunk in enumerate(top_chunks):
        context_parts.append(
            f"[Source {i+1}: {chunk['source_file']}]\n{chunk['text']}"
        )
    context_text = "\n\n---\n\n".join(context_parts)

    # Step 7: Build grounded prompt for LLM
    prompt = f"""You are ProcureSense AI, an expert procurement contract analyst.

You will be given relevant excerpts retrieved from procurement contracts and a user question.
Answer the question clearly and accurately using ONLY the information in the contract excerpts below.

STRICT RULES:
- NEVER return raw JSON. Always respond in clear, readable sentences.
- ONLY use facts found in the excerpts below. Do not infer or hallucinate.
- If the answer is not in the excerpts, say exactly: "Information not found in the uploaded contracts."
- Be concise but thorough. Reference the source when possible.

--- CONTRACT EXCERPTS ---
{context_text}
--- END EXCERPTS ---

User Question: {question}

Your Answer:"""

    # Step 8: Generate with Ollama llama3
    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are ProcureSense AI, a procurement contract analyst. "
                    "Always answer in clear, plain English sentences. "
                    "Only use information from the provided contract excerpts. "
                    "Never output raw JSON or code."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response["message"]["content"]

    return {
        "answer": answer,
        "sources": top_chunks
    }