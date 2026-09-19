from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./data/procuresense.db"

os.makedirs("data", exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    vendor = Column(String, default="Unknown Vendor")
    agreement_type = Column(String, default="Not specified")
    effective_date = Column(String, default="Not specified")
    renewal_date = Column(String, default="Not specified")
    notice_period = Column(String, default="Not specified")
    auto_renewal = Column(String, default="false")
    price_escalation = Column(String, default="0%")
    payment_terms = Column(String, default="Not specified")
    sla = Column(String, default="Not specified")
    uptime_commitment = Column(String, default="Not specified")
    response_time = Column(String, default="Not specified")
    sla_penalties = Column(String, default="Not specified")
    termination_clause = Column(String, default="Not specified")
    liability_clause = Column(String, default="Not specified")
    compliance_clause = Column(String, default="Not specified")
    risk = Column(String, default="Medium")
    score = Column(Integer, default=70)
    uploaded_by = Column(String, default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="anonymous")
    action = Column(String, nullable=False)
    contract_id = Column(Integer, nullable=True)
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_contract(details: dict, filename: str, db, uploaded_by: str = "anonymous") -> Contract:
    contract = Contract(
        filename=filename,
        vendor=details.get("vendor", "Unknown Vendor"),
        agreement_type=details.get("agreement_type", "Not specified"),
        effective_date=details.get("effective_date", "Not specified"),
        renewal_date=details.get("renewal_date", "Not specified"),
        notice_period=details.get("notice_period", "Not specified"),
        auto_renewal=str(details.get("auto_renewal", "false")),
        price_escalation=details.get("price_escalation", "0%"),
        payment_terms=details.get("payment_terms", "Not specified"),
        sla=details.get("sla", "Not specified"),
        uptime_commitment=details.get("uptime_commitment", "Not specified"),
        response_time=details.get("response_time", "Not specified"),
        sla_penalties=details.get("sla_penalties", "Not specified"),
        termination_clause=details.get("termination_clause", "Not specified"),
        liability_clause=details.get("liability_clause", "Not specified"),
        compliance_clause=details.get("compliance_clause", "Not specified"),
        risk=details.get("risk", "Medium"),
        score=int(details.get("score", 70)),
        uploaded_by=uploaded_by,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def log_action(action: str, user_id: str = "anonymous", contract_id: int = None, details: str = "", db=None):
    if db is None:
        return
    entry = AuditLog(
        user_id=user_id,
        action=action,
        contract_id=contract_id,
        details=details,
    )
    db.add(entry)
    db.commit()


init_db()
