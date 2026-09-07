"""
chunker.py — Semantic chunking with metadata for ProcureSense RAG pipeline.
Produces chunks with source_file and chunk_index metadata for ChromaDB storage.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_text(text: str, source_file: str = "unknown") -> list:
    """
    Split text into overlapping chunks with attached metadata.

    Returns a list of dicts:
      {
        "text": str,
        "chunk_index": int,
        "source_file": str,
      }

    Chunk size: 700 chars | Overlap: 150 chars
    Separators follow clause-aware hierarchy: paragraphs → sentences → words.
    """

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
    """Extract just the text strings from chunk dicts (for embedding)."""
    return [c["text"] if isinstance(c, dict) else c for c in chunks]