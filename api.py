from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os

from contract_parser import extract_text
from extractor import extract_contract_details

from risk import calculate_risk
from score import calculate_score

from chunker import split_text
from embeddings import create_embeddings
from vector_store import store_chunks

from rag_engine import ask_contract


app = FastAPI()

latest_contract = {}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(
    "contracts",
    exist_ok=True,
)


@app.get("/")
def home():

    return {
        "message":
        "ProcureSense API running"
    }


@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...)
):

    global latest_contract

    file_path = os.path.join(
        "contracts",
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as f:

        f.write(
            await file.read()
        )

    text = extract_text(
        file_path
    )

    details = extract_contract_details(
        text
    )

    details["risk"] = calculate_risk(
        details
    )

    details["score"] = calculate_score(
        details
    )

    chunks = split_text(
        text
    )

    embeddings = create_embeddings(
        chunks
    )

    store_chunks(
        chunks,
        embeddings
    )

    latest_contract = details

    return details


class Question(BaseModel):
    question: str


@app.post("/chat")
async def chat(payload: Question):

    question = payload.question

    # ask_contract handles RAG retrieval + LLM generation internally
    answer = ask_contract(question)

    return {"answer": answer}