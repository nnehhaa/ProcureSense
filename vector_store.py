import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_or_create_collection(
    name="contracts"
)



def store_chunks(chunks, embeddings):

    existing = collection.count()

    for i, (chunk, embedding) in enumerate(
        zip(chunks, embeddings)
    ):

        collection.add(
            ids=[str(existing + i)],
            documents=[chunk],
            embeddings=[embedding.tolist()]
        )


def search_contract(query_embedding):

    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=3
    )

    return results["documents"][0]