"""
embeddings.py — Embedding generation for ProcureSense.
Uses BAAI/bge-small-en-v1.5 for higher retrieval quality.
BGE requires a query prefix for query-time encoding.
"""

from sentence_transformers import SentenceTransformer

# BGE-small: 384-dim, same as MiniLM but better retrieval accuracy
# Compatible with existing ChromaDB collection dimensions
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

# BGE instruction prefix for query encoding (improves retrieval accuracy)
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


def create_embeddings(chunks) -> list:
    """
    Generate embeddings for a list of text chunks or chunk dicts.
    Used at index time (no prefix needed for documents).
    Returns numpy array of shape (n_chunks, 384).
    """
    if not chunks:
        return []

    # Handle both plain strings and chunk dicts
    texts = [c["text"] if isinstance(c, dict) else c for c in chunks]
    return model.encode(texts, normalize_embeddings=True)


def embed_query(query: str):
    """
    Generate embedding for a user query.
    Applies BGE's required prefix for query-side encoding.
    Returns numpy array of shape (384,).
    """
    prefixed = QUERY_PREFIX + query
    return model.encode(prefixed, normalize_embeddings=True)