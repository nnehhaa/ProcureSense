from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_text(text: str, source_file: str = "unknown") -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""],
    )

    raw_chunks = splitter.split_text(text)

    chunks_with_metadata = []
    for i, chunk_text in enumerate(raw_chunks):
        chunks_with_metadata.append({
            "text": chunk_text,
            "chunk_index": i,
            "source_file": source_file,
        })

    print(f"[chunker] Split into {len(chunks_with_metadata)} chunks from '{source_file}'")
    return chunks_with_metadata


def get_chunk_texts(chunks: list) -> list:
    return [c["text"] if isinstance(c, dict) else c for c in chunks]