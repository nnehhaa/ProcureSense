import json
import re

import ollama

from embeddings import embed_query
from reranker import rerank
from vector_store import search_contract, search_with_filter

NOT_FOUND_MSG = "Information not found in this contract."
EVIDENCE_THRESHOLD = 0.05


def _unique_candidates(candidates: list) -> list:
    seen = set()
    unique = []
    for candidate in candidates:
        key = (candidate.get("source_file"), candidate.get("chunk_index"), candidate.get("text", "").strip())
        if key not in seen:
            seen.add(key)
            unique.append(candidate)
    return unique


def _parse_json_response(content: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", content).strip().strip("`").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1 or end <= start:
        return {}
    try:
        return json.loads(cleaned[start:end])
    except json.JSONDecodeError:
        return {}


def _validated_sources(payload: dict, top_chunks: list, source_file: str) -> list:
    sources = []
    seen = set()
    for citation in payload.get("citations", []):
        excerpt = str(citation.get("excerpt", "")).strip()
        matching_chunk = next(
            (chunk for chunk in top_chunks if excerpt and excerpt in chunk.get("text", "")),
            None,
        )
        if not matching_chunk:
            continue
        key = (source_file, excerpt)
        if key in seen:
            continue
        seen.add(key)
        sources.append({
            "source_file": source_file,
            "chunk_index": matching_chunk.get("chunk_index", 0),
            "text": excerpt,
            "excerpt": excerpt,
            "relevance": round(float(matching_chunk.get("score", 0)), 4),
        })
        break
    return sources


def _answer_for_contract(question: str, top_chunks: list, source_file: str) -> dict:
    if not top_chunks:
        return {"source_file": source_file, "status": "not_found", "answer": NOT_FOUND_MSG, "sources": []}

    context_text = "\n\n---\n\n".join(
        f"[Source: {source_file}]\n{chunk['text']}" for chunk in top_chunks
    )
    prompt = f"""You are ProcureSense, an evidence-first contract analyst.

Determine whether the answer to the user's question is explicitly present in the contract excerpt below.
Return ONLY valid JSON with this exact shape:
{{
  "supported": true or false,
  "answer": "a concise answer, or exactly '{NOT_FOUND_MSG}'",
  "citations": [{{"source_file": "{source_file}", "excerpt": "an exact contiguous substring copied from the excerpt"}}]
}}

Rules:
- Do not infer, generalize, or use outside knowledge.
- Set supported to false when the requested information is absent or ambiguous.
- When supported is false, use exactly '{NOT_FOUND_MSG}' and return an empty citations array.
- Return only the smallest exact sentence or passage that proves the answer.
- Every citation excerpt must be copied character-for-character from the contract excerpt.

CONTRACT EXCERPT:
{context_text}

USER QUESTION: {question}
"""

    response = ollama.chat(
        model="llama3",
        messages=[
            {"role": "system", "content": "Return only the requested JSON. Never invent facts or citations."},
            {"role": "user", "content": prompt},
        ],
    )
    parsed = _parse_json_response(response["message"]["content"])
    sources = _validated_sources(parsed, top_chunks, source_file) if parsed.get("supported") else []
    if not parsed.get("supported") or not sources:
        return {"source_file": source_file, "status": "not_found", "answer": NOT_FOUND_MSG, "sources": []}
    return {
        "source_file": source_file,
        "status": "supported",
        "answer": str(parsed.get("answer", NOT_FOUND_MSG)).strip(),
        "sources": sources,
    }


def ask_contract(question: str, source_file: str = None, allowed_source_files: list[str] | None = None) -> dict:
    query_embedding = embed_query(question)
    if source_file:
        source_files = [source_file]
    elif allowed_source_files is not None:
        source_files = allowed_source_files
    else:
        results = search_contract(query_embedding, n_results=10)
        source_files = sorted({
            meta.get("source_file") for meta in results.get("metadatas", []) if meta and meta.get("source_file")
        })

    contract_results = []
    for current_file in source_files:
        results = search_with_filter(query_embedding, source_file=current_file, n_results=10)
        candidates = [
            {
                "text": doc,
                "source_file": current_file,
                "chunk_index": meta.get("chunk_index", 0) if meta else 0,
            }
            for doc, meta in zip(results.get("documents", []), results.get("metadatas", []))
        ]
        top_chunks = [
            chunk for chunk in rerank(question, _unique_candidates(candidates), top_k=3)
            if float(chunk.get("score", 0)) >= EVIDENCE_THRESHOLD
        ]
        contract_results.append(_answer_for_contract(question, top_chunks, current_file))

    supported = [result for result in contract_results if result["status"] == "supported"]
    if not supported:
        answer = "\n\n".join(f"{result['source_file']}: {NOT_FOUND_MSG}" for result in contract_results) or NOT_FOUND_MSG
        return {"answer": answer, "sources": [], "results": contract_results}

    answer = "\n\n".join(f"{result['source_file']}: {result['answer']}" for result in supported)
    sources = [source for result in supported for source in result["sources"]]
    return {"answer": answer, "sources": sources, "results": contract_results}
