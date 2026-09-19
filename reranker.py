from sentence_transformers import CrossEncoder

_reranker = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        print("[reranker] Loading cross-encoder/ms-marco-MiniLM-L-6-v2 ...")
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        print("[reranker] Reranker loaded.")
    return _reranker


def rerank(query: str, chunks: list, top_k: int = 3) -> list:
    if not chunks:
        return []

    reranker = get_reranker()

    normalized = []
    for c in chunks:
        if isinstance(c, dict):
            normalized.append(c)
        else:
            normalized.append({"text": c, "source_file": "unknown", "chunk_index": 0})

    pairs = [(query, c["text"]) for c in normalized]
    scores = reranker.predict(pairs)

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

