"""
vector_store.py — ChromaDB vector store for ProcureSense.
Uses contracts_v2 collection with full chunk metadata.
"""

import chromadb
import uuid

client = chromadb.PersistentClient(path="./chroma_db")

# New versioned collection with metadata support
# Old "contracts" collection is preserved for backward compatibility
collection = client.get_or_create_collection(
    name="contracts_v2",
    metadata={"hnsw:space": "cosine"}
)


def store_chunks(chunks: list, embeddings) -> None:
    """
    Store chunk texts + embeddings + metadata in ChromaDB.

    chunks: list of dicts {text, chunk_index, source_file}
    embeddings: numpy array of shape (n, 384)
    """
    if not chunks:
        return

    ids = []
    documents = []
    metadatas = []
    embedding_list = []

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_id = str(uuid.uuid4())

        if isinstance(chunk, dict):
            text = chunk["text"]
            meta = {
                "source_file": chunk.get("source_file", "unknown"),
                "chunk_index": str(chunk.get("chunk_index", i)),
            }
        else:
            # Backward-compatible plain string
            text = chunk
            meta = {
                "source_file": "unknown",
                "chunk_index": str(i),
            }

        ids.append(chunk_id)
        documents.append(text)
        metadatas.append(meta)
        embedding_list.append(embedding.tolist())

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embedding_list,
        metadatas=metadatas,
    )
    print(f"[vector_store] Stored {len(ids)} chunks in contracts_v2.")


def search_contract(query_embedding, n_results: int = 10) -> dict:
    """
    Search for top-n most relevant chunks.

    Returns dict with:
      - documents: list of text strings
      - metadatas: list of metadata dicts
      - distances: list of distance scores
    """
    if collection.count() == 0:
        return {"documents": [], "metadatas": [], "distances": []}

    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    return {
        "documents": results["documents"][0] if results["documents"] else [],
        "metadatas": results["metadatas"][0] if results["metadatas"] else [],
        "distances": results["distances"][0] if results["distances"] else [],
    }


def search_with_filter(query_embedding, source_file: str = None, n_results: int = 10) -> dict:
    """
    Search with optional source file filter to scope chat to a specific contract.
    """
    if collection.count() == 0:
        return {"documents": [], "metadatas": [], "distances": []}

    kwargs = {
        "query_embeddings": [query_embedding.tolist()],
        "n_results": min(n_results, collection.count()),
        "include": ["documents", "metadatas", "distances"],
    }

    if source_file:
        kwargs["where"] = {"source_file": source_file}

    results = collection.query(**kwargs)

    return {
        "documents": results["documents"][0] if results["documents"] else [],
        "metadatas": results["metadatas"][0] if results["metadatas"] else [],
        "distances": results["distances"][0] if results["distances"] else [],
    }


def get_collection_count() -> int:
    """Return total number of indexed chunks."""
    return collection.count()