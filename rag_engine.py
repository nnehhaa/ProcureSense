import ollama
from embeddings import model
from vector_store import search_contract


def ask_contract(question):

    # Step 1: Embed the user question
    query_embedding = model.encode(question)

    # Step 2: Retrieve most relevant chunks from ChromaDB (RAG)
    context_chunks = search_contract(query_embedding)
    context_text = "\n\n".join(context_chunks)

    # Step 3: Build a well-structured prompt for Llama3
    prompt = f"""You are ProcureSense AI, an expert procurement contract analyst.

You will be given relevant excerpts from a procurement contract and a user question.
Your job is to answer the question clearly, accurately, and in plain natural language.

Important rules:
- NEVER return raw JSON. Always respond in clear, readable sentences.
- If the answer is found in the contract context, provide it directly.
- If not found, say "This information was not found in the uploaded contract."
- Be concise but thorough.

--- CONTRACT CONTEXT ---
{context_text}
--- END CONTEXT ---

User Question: {question}

Your Answer:"""

    # Step 4: Send to Llama3 via Ollama
    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content": "You are ProcureSense AI, a procurement contract analyst. Always answer in clear, plain English sentences. Never output raw JSON or code."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]