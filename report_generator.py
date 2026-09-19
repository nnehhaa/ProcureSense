import csv
import io
import json
from datetime import datetime


REPORT_FIELDS = [
    "id", "filename", "vendor", "agreement_type",
    "effective_date", "renewal_date", "notice_period", "auto_renewal",
    "price_escalation", "payment_terms",
    "sla", "uptime_commitment", "response_time", "sla_penalties",
    "termination_clause", "liability_clause", "compliance_clause",
    "risk", "score", "created_at"
]


def generate_csv_report(contracts: list) -> bytes:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=REPORT_FIELDS, extrasaction="ignore")
    writer.writeheader()

    for c in contracts:
        if hasattr(c, "__dict__"):
            row = {field: getattr(c, field, "") for field in REPORT_FIELDS}
        else:
            row = {field: c.get(field, "") for field in REPORT_FIELDS}

        if isinstance(row.get("created_at"), datetime):
            row["created_at"] = row["created_at"].isoformat()

        writer.writerow(row)

    return output.getvalue().encode("utf-8")


def generate_summary_report(contract) -> dict:

    if hasattr(contract, "__dict__"):
        data = {field: getattr(contract, field, "") for field in REPORT_FIELDS}
    else:
        data = {field: contract.get(field, "") for field in REPORT_FIELDS}

    if isinstance(data.get("created_at"), datetime):
        data["created_at"] = data["created_at"].isoformat()

    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "contract_id": data.get("id"),
        "filename": data.get("filename"),
        "metadata": {
            "vendor": data.get("vendor"),
            "agreement_type": data.get("agreement_type"),
            "effective_date": data.get("effective_date"),
            "renewal_date": data.get("renewal_date"),
        },
        "renewal": {
            "notice_period": data.get("notice_period"),
            "auto_renewal": data.get("auto_renewal"),
        },
        "financial": {
            "price_escalation": data.get("price_escalation"),
            "payment_terms": data.get("payment_terms"),
        },
        "sla": {
            "sla_target": data.get("sla"),
            "uptime_commitment": data.get("uptime_commitment"),
            "response_time": data.get("response_time"),
            "sla_penalties": data.get("sla_penalties"),
        },
        "risk_clauses": {
            "termination_clause": data.get("termination_clause"),
            "liability_clause": data.get("liability_clause"),
            "compliance_clause": data.get("compliance_clause"),
        },
        "assessment": {
            "risk_level": data.get("risk"),
            "health_score": data.get("score"),
        },
        "created_at": data.get("created_at"),
    }
