"""
reranker.py — Cross-encoder reranker for ProcureSense RAG pipeline.
Improves retrieval precision by scoring candidate chunks against the query.
Model: cross-encoder/ms-marco-MiniLM-L-6-v2 (lightweight, M4-optimized).
"""

from sentence_transformers import CrossEncoder

# Load once at module level to avoid reloading per request
_reranker = None


def get_reranker() -> CrossEncoder:
    """Lazy-load the cross-encoder model."""
    global _reranker
    if _reranker is None:
        print("[reranker] Loading cross-encoder/ms-marco-MiniLM-L-6-v2 ...")
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        print("[reranker] Reranker loaded.")
    return _reranker


def rerank(query: str, chunks: list, top_k: int = 3) -> list:
    """
    Rerank a list of candidate chunk dicts by cross-encoder relevance score.

    Args:
        query: The user question string.
        chunks: List of chunk strings or dicts with 'text' key.
        top_k: Number of top results to return.

    Returns:
        List of dicts: [{text, source_file, chunk_index, score}, ...]
        Sorted descending by score (most relevant first).
    """
    if not chunks:
        return []

    reranker = get_reranker()

    # Normalize chunks to dicts
    normalized = []
    for c in chunks:
        if isinstance(c, dict):
            normalized.append(c)
        else:
            normalized.append({"text": c, "source_file": "unknown", "chunk_index": 0})

    # Prepare (query, passage) pairs for cross-encoder
    pairs = [(query, c["text"]) for c in normalized]

    # Score all candidates
    scores = reranker.predict(pairs)

    # Attach scores and sort descending
    scored = []
    for chunk, score in zip(normalized, scores):
        scored.append({
            "text": chunk.get("text", ""),
            "source_file": chunk.get("source_file", "unknown"),
            "chunk_index": chunk.get("chunk_index", 0),
            "score": float(score),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)

    return scored[:top_k]
