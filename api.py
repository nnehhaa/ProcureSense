import os
from datetime import datetime
from fastapi import (
    FastAPI, UploadFile, File, Depends, HTTPException,
    status, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
import io

from contract_parser import extract_text
from extractor import extract_contract_details
from risk import calculate_assessment
from chunker import split_text
from embeddings import create_embeddings
from vector_store import store_chunks
from rag_engine import ask_contract
from alerts import DATE_FORMATS, get_renewal_alerts
from database import get_db, save_contract, log_action, Contract
from auth import authenticate_user, create_token, verify_token, has_permission, register_user
from evaluator import evaluate_query
from report_generator import generate_csv_report

app = FastAPI(
    title="ProcureSense API",
    description="Enterprise procurement contract intelligence platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def refresh_assessment(contract) -> bool:
    assessment = calculate_assessment({
        "price_escalation": contract.price_escalation,
        "sla": contract.sla,
        "notice_period": contract.notice_period,
        "auto_renewal": contract.auto_renewal,
        "sla_penalties": contract.sla_penalties,
        "termination_clause": contract.termination_clause,
        "liability_clause": contract.liability_clause,
    })
    changed = contract.risk != assessment["risk"] or contract.score != assessment["score"]
    contract.risk = assessment["risk"]
    contract.score = assessment["score"]
    return changed

os.makedirs("contracts", exist_ok=True)
os.makedirs("data", exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def get_current_user(request: Request) -> Optional[dict]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        return verify_token(token)
    return None


def require_auth(request: Request) -> dict:
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user


def require_role(allowed_roles: List[str]):
    def dependency(request: Request) -> dict:
        user = get_current_user(request)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
            )
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}. Your role: {user.get('role')}.",
            )
        return user
    return dependency


def visible_contracts(db: Session, current_user: dict):
    query = db.query(Contract)
    if current_user.get("role") != "admin":
        query = query.filter(Contract.uploaded_by == current_user.get("sub", ""))
    return query


def get_visible_contract(db: Session, contract_id: int, current_user: dict):
    contract = visible_contracts(db, current_user).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return contract


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "procurement" or "legal"


class Question(BaseModel):
    question: str
    source_file: Optional[str] = None


class EvaluationRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {
        "message": "ProcureSense API v2.0 running",
        "endpoints": [
            "/upload", "/contracts", "/chat", "/evaluate",
            "/alerts", "/auth/login", "/auth/register", "/auth/me"
        ]
    }


@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(payload.email, payload.password, db=db)
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


@app.post("/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )
    try:
        user = register_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
            role=payload.role,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

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


@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    request: Request = None,
    current_user: dict = Depends(require_role(["admin", "procurement"])),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: .pdf, .docx"
        )

    file_path = os.path.join("contracts", file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        text = extract_text(file_path)
        if not text.strip() or text.lstrip().startswith("["):
            raise ValueError("Document text could not be extracted. Check the PDF/DOCX file or OCR installation.")
        details = extract_contract_details(text)

        details.update(calculate_assessment(details))
        details["filename"] = file.filename

        user_id = current_user.get("sub", "anonymous")
        db_contract = save_contract(details, filename=file.filename, db=db, uploaded_by=user_id)
        details["id"] = db_contract.id

        chunks = split_text(text, source_file=file.filename)
        embeddings = create_embeddings(chunks)
        store_chunks(chunks, embeddings)

        log_action("upload", user_id=user_id, contract_id=db_contract.id,
                   details=f"Uploaded {file.filename}", db=db)

        return details
    except Exception as e:
        # Catch any extraction or processing errors to avoid 500 crashes
        error_msg = str(e)
        if "connection" in error_msg.lower() or "ollama" in error_msg.lower():
            raise HTTPException(status_code=503, detail="AI Model (Ollama) is unavailable or crashed during extraction.")
        raise HTTPException(status_code=400, detail=f"Failed to process document: {error_msg}")


@app.get("/contracts")
def list_contracts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    contracts = visible_contracts(db, current_user).order_by(Contract.created_at.desc()).all()
    assessment_changed = False
    for contract in contracts:
        assessment_changed = refresh_assessment(contract) or assessment_changed
    if assessment_changed:
        db.commit()

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
            "uploaded_by": c.uploaded_by,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in contracts
    ]


@app.get("/contracts/report/all")
def download_all_contracts_report(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin", "procurement"])),
):
    contracts = visible_contracts(db, current_user).all()
    if not contracts:
        raise HTTPException(status_code=404, detail="No contracts found.")

    csv_bytes = generate_csv_report(contracts)

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ProcureSense_All_Contracts.csv"'},
    )


@app.get("/contracts/{contract_id}")
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    contract = get_visible_contract(db, contract_id, current_user)
    if refresh_assessment(contract):
        db.commit()

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
        "uploaded_by": contract.uploaded_by,
        "created_at": contract.created_at.isoformat() if contract.created_at else None,
    }


@app.delete("/contracts/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"])),
):
    contract = get_visible_contract(db, contract_id, current_user)
    if refresh_assessment(contract):
        db.commit()

    filename = contract.filename
    db.delete(contract)
    db.commit()

    log_action("delete", user_id=current_user.get("sub", "anonymous"),
               contract_id=contract_id, details=f"Deleted {filename}", db=db)

    return {"message": f"Contract '{filename}' deleted successfully."}


@app.get("/contracts/{contract_id}/report")
def download_contract_report(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin", "procurement"])),
):
    contract = get_visible_contract(db, contract_id, current_user)

    csv_bytes = generate_csv_report([contract])
    filename = f"ProcureSense_Report_{contract.vendor.replace(' ', '_')}_{contract.id}.csv"

    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/chat")
async def chat(
    payload: Question,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    try:
        allowed_source_files = [filename for (filename,) in visible_contracts(db, current_user).with_entities(Contract.filename).distinct().all()]
        if payload.source_file and payload.source_file not in allowed_source_files:
            raise HTTPException(status_code=404, detail="Contract not found.")
        result = ask_contract(
            payload.question,
            source_file=payload.source_file,
            allowed_source_files=allowed_source_files,
        )
        return {
            "answer": result["answer"],
            "sources": result.get("sources", []),
            "results": result.get("results", []),
        }
    except Exception as e:
        error_msg = str(e)
        if "ollama" in error_msg.lower() or "connection" in error_msg.lower():
            return {
                "answer": "The AI model is not available. Please ensure Ollama is running with `ollama serve` and that the llama3 model is installed (`ollama pull llama3`).",
                "sources": [],
            }
        return {
            "answer": f"An error occurred while processing your question: {error_msg}",
            "sources": [],
        }


@app.get("/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    contracts = visible_contracts(db, current_user).all()
    contract_dicts = [
        {"id": c.id, "vendor": c.vendor, "renewal_date": c.renewal_date}
        for c in contracts
    ]
    alerts = get_renewal_alerts(contract_dicts)
    return {"alerts": alerts}


@app.get("/obligations")
def get_obligations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth),
):
    events = []
    for contract in visible_contracts(db, current_user).order_by(Contract.renewal_date.asc()).all():
        renewal_date = None
        raw_date = (contract.renewal_date or "").strip()
        for date_format in DATE_FORMATS:
            try:
                renewal_date = datetime.strptime(raw_date, date_format)
                break
            except ValueError:
                continue

        if renewal_date is None:
            events.append({
                "contract_id": contract.id,
                "vendor": contract.vendor,
                "filename": contract.filename,
                "date": None,
                "type": "review",
                "label": "Renewal date needs review",
            })
            continue

        date_value = renewal_date.date().isoformat()
        events.append({
            "contract_id": contract.id,
            "vendor": contract.vendor,
            "filename": contract.filename,
            "date": date_value,
            "type": "renewal",
            "label": "Contract renewal",
        })
        events.append({
            "contract_id": contract.id,
            "vendor": contract.vendor,
            "filename": contract.filename,
            "date": date_value,
            "type": "sla",
            "label": f"SLA review ({contract.sla})",
        })
        if contract.price_escalation and contract.price_escalation not in ("0%", "Not specified"):
            events.append({
                "contract_id": contract.id,
                "vendor": contract.vendor,
                "filename": contract.filename,
                "date": date_value,
                "type": "price",
                "label": f"Price escalation review ({contract.price_escalation})",
            })

    return {"events": events}


@app.post("/evaluate")
async def evaluate(
    payload: EvaluationRequest,
    current_user: dict = Depends(require_role(["admin", "procurement"])),
):
    result = evaluate_query(payload.question)
    return result


@app.get("/auth/me")
def get_me(current_user: dict = Depends(require_auth)):
    return {
        "user_id": current_user.get("sub"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "role": current_user.get("role"),
    }