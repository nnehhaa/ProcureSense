"""
database.py — SQLAlchemy + SQLite persistence layer for ProcureSense.
Stores all extracted contract data and audit logs.
"""

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

    # Metadata
    agreement_type = Column(String, default="Not specified")
    effective_date = Column(String, default="Not specified")
    renewal_date = Column(String, default="Not specified")

    # Renewal
    notice_period = Column(String, default="Not specified")
    auto_renewal = Column(String, default="false")

    # Financial
    price_escalation = Column(String, default="0%")
    payment_terms = Column(String, default="Not specified")

    # SLA
    sla = Column(String, default="99%")
    uptime_commitment = Column(String, default="Not specified")
    response_time = Column(String, default="Not specified")
    sla_penalties = Column(String, default="Not specified")

    # Risk clauses
    termination_clause = Column(String, default="Not specified")
    liability_clause = Column(String, default="Not specified")
    compliance_clause = Column(String, default="Not specified")

    # Computed
    risk = Column(String, default="🟡 Medium")
    score = Column(Integer, default=70)

    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="anonymous")
    action = Column(String, nullable=False)
    contract_id = Column(Integer, nullable=True)
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_contract(details: dict, filename: str, db) -> Contract:
    """Save extracted contract fields to SQLite and return the ORM object."""
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
        sla=details.get("sla", "99%"),
        uptime_commitment=details.get("uptime_commitment", "Not specified"),
        response_time=details.get("response_time", "Not specified"),
        sla_penalties=details.get("sla_penalties", "Not specified"),
        termination_clause=details.get("termination_clause", "Not specified"),
        liability_clause=details.get("liability_clause", "Not specified"),
        compliance_clause=details.get("compliance_clause", "Not specified"),
        risk=details.get("risk", "🟡 Medium"),
        score=int(details.get("score", 70)),
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def log_action(action: str, user_id: str = "anonymous", contract_id: int = None, details: str = "", db=None):
    """Write an audit log entry."""
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


# Auto-init on import
init_db()
