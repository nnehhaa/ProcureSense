from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


def create_embeddings(chunks) -> list:
    if not chunks:
        return []

    texts = [c["text"] if isinstance(c, dict) else c for c in chunks]
    return model.encode(texts, normalize_embeddings=True)


def embed_query(query: str):
    prefixed = QUERY_PREFIX + query
    return model.encode(prefixed, normalize_embeddings=True)