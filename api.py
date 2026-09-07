"""
api.py — ProcureSense FastAPI backend.
Full production API with multi-contract support, auth, RAG chat with citations,
evaluation framework, and report export.
"""

import os
from fastapi import (
    FastAPI, UploadFile, File, Depends, HTTPException,
    status, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import io

from contract_parser import extract_text
from extractor import extract_contract_details
from risk import calculate_risk
from score import calculate_score
from chunker import split_text
from embeddings import create_embeddings
from vector_store import store_chunks
from rag_engine import ask_contract
from alerts import get_renewal_alerts
from database import get_db, save_contract, log_action, Contract
from auth import authenticate_user, create_token, verify_token, get_demo_credentials
from evaluator import evaluate_query
from report_generator import generate_csv_report, generate_summary_report

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ProcureSense API",
    description="Enterprise procurement contract intelligence platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("contracts", exist_ok=True)
os.makedirs("data", exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def get_current_user(request: Request) -> Optional[dict]:
    """Extract and validate JWT from Authorization header. Returns None if missing."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        return verify_token(token)
    return None


def require_auth(request: Request) -> dict:
    """Dependency: require valid JWT. Raises 401 if missing/invalid."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    email: str
    password: str


class Question(BaseModel):
    question: str
    source_file: Optional[str] = None


class EvaluationRequest(BaseModel):
    question: str

# ---------------------------------------------------------------------------
# Routes — Public
# ---------------------------------------------------------------------------


@app.get("/")
def home():
    return {
        "message": "ProcureSense API v2.0 running",
        "endpoints": [
            "/upload", "/contracts", "/chat", "/evaluate",
            "/alerts", "/auth/login", "/auth/demo-credentials"
        ]
    }


@app.post("/auth/login")
def login(payload: LoginRequest):
    """Authenticate user and return JWT token."""
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    token = create_token(
        user_id=user["user_id"],
        role=user["role"],
        email=user["email"],
        name=user["name"],
    )
    return {
        "token": token,
        "user": {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        }
    }


@app.get("/auth/demo-credentials")
def demo_credentials():
    """Return demo credentials for the login page display."""
    return {"credentials": get_demo_credentials()}

# ---------------------------------------------------------------------------
# Routes — Contract Upload
# ---------------------------------------------------------------------------


@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    request: Request = None,
):
    """
    Upload a contract (PDF or DOCX), extract all fields, embed, and store.
    Returns full extracted contract data with risk + score.
    """
    # Validate file type
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: .pdf, .docx"
        )

    # Save file to disk
    file_path = os.path.join("contracts", file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text (auto-detects PDF/DOCX/scanned)
    text = extract_text(file_path)

    # Extract 15 structured fields via LLM
    details = extract_contract_details(text)

    # Compute risk and score
    details["risk"] = calculate_risk(details)
    details["score"] = calculate_score(details)
    details["filename"] = file.filename

    # Persist to SQLite
    db_contract = save_contract(details, filename=file.filename, db=db)
    details["id"] = db_contract.id

    # Embed and store chunks in ChromaDB
    chunks = split_text(text, source_file=file.filename)
    embeddings = create_embeddings(chunks)
    store_chunks(chunks, embeddings)

    # Audit log
    user = get_current_user(request) if request else None
    user_id = user.get("sub", "anonymous") if user else "anonymous"
    log_action("upload", user_id=user_id, contract_id=db_contract.id,
               details=f"Uploaded {file.filename}", db=db)

    return details

# ---------------------------------------------------------------------------
# Routes — Contract Library
# ---------------------------------------------------------------------------


@app.get("/contracts")
def list_contracts(db: Session = Depends(get_db)):
    """Return all contracts as a list of summaries."""
    contracts = db.query(Contract).order_by(Contract.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "filename": c.filename,
            "vendor": c.vendor,
            "agreement_type": c.agreement_type,
            "effective_date": c.effective_date,
            "renewal_date": c.renewal_date,
            "notice_period": c.notice_period,
            "auto_renewal": c.auto_renewal,
            "price_escalation": c.price_escalation,
            "payment_terms": c.payment_terms,
            "sla": c.sla,
            "uptime_commitment": c.uptime_commitment,
            "response_time": c.response_time,
            "sla_penalties": c.sla_penalties,
            "termination_clause": c.termination_clause,
            "liability_clause": c.liability_clause,
            "compliance_clause": c.compliance_clause,
            "risk": c.risk,
            "score": c.score,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in contracts
    ]


@app.get("/contracts/{contract_id}")
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """Return full details for a single contract."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return {
        "id": contract.id,
        "filename": contract.filename,
        "vendor": contract.vendor,
        "agreement_type": contract.agreement_type,
        "effective_date": contract.effective_date,
        "renewal_date": contract.renewal_date,
        "notice_period": contract.notice_period,
        "auto_renewal": contract.auto_renewal,
        "price_escalation": contract.price_escalation,
        "payment_terms": contract.payment_terms,
        "sla": contract.sla,
        "uptime_commitment": contract.uptime_commitment,
        "response_time": contract.response_time,
        "sla_penalties": contract.sla_penalties,
        "termination_clause": contract.termination_clause,
        "liability_clause": contract.liability_clause,
        "compliance_clause": contract.compliance_clause,
        "risk": contract.risk,
        "score": contract.score,
        "created_at": contract.created_at.isoformat() if contract.created_at else None,
    }


@app.delete("/contracts/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    request: Request = None,
):
    """Delete a contract from SQLite. (ChromaDB chunks persist — acceptable for demo)."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    filename = contract.filename
    db.delete(contract)
    db.commit()

    user = get_current_user(request) if request else None
    user_id = user.get("sub", "anonymous") if user else "anonymous"
    log_action("delete", user_id=user_id, contract_id=contract_id,
               details=f"Deleted {filename}", db=db)

    return {"message": f"Contract '{filename}' deleted successfully."}


@app.get("/contracts/{contract_id}/report")
def download_contract_report(contract_id: int, db: Session = Depends(get_db)):
    """Download a CSV report for a single contract."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    csv_bytes = generate_csv_report([contract])
    filename = f"ProcureSense_Report_{contract.vendor.replace(' ', '_')}_{contract.id}.csv"

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/contracts/report/all")
def download_all_contracts_report(db: Session = Depends(get_db)):
    """Download a CSV report for all contracts."""
    contracts = db.query(Contract).all()
    if not contracts:
        raise HTTPException(status_code=404, detail="No contracts found.")

    csv_bytes = generate_csv_report(contracts)

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ProcureSense_All_Contracts.csv"'},
    )

# ---------------------------------------------------------------------------
# Routes — Chat (RAG)
# ---------------------------------------------------------------------------


@app.post("/chat")
async def chat(payload: Question):
    """
    RAG-based contract Q&A.
    Returns grounded answer + source citations.
    """
    result = ask_contract(payload.question, source_file=payload.source_file)
    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
    }

# ---------------------------------------------------------------------------
# Routes — Alerts
# ---------------------------------------------------------------------------


@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Return renewal alerts for all contracts in the library."""
    contracts = db.query(Contract).all()
    contract_dicts = [
        {"vendor": c.vendor, "renewal_date": c.renewal_date, "id": c.id}
        for c in contracts
    ]
    alerts = get_renewal_alerts(contract_dicts)
    return {"alerts": alerts}

# ---------------------------------------------------------------------------
# Routes — Evaluation
# ---------------------------------------------------------------------------


@app.post("/evaluate")
async def evaluate(payload: EvaluationRequest):
    """
    Run RAG vs. no-RAG evaluation for a query.
    Returns side-by-side comparison with faithfulness scores.
    """
    result = evaluate_query(payload.question)
    return result