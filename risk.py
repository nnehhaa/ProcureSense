import re

from score import calculate_score


def _number(value, default):
    match = re.search(r"\d+(?:\.\d+)?", str(value))
    return float(match.group()) if match else default


def _is_true(value):
    normalized = str(value).strip().lower()
    return normalized in {"true", "yes", "y", "1", "automatic", "auto-renewing"} or normalized.startswith(("true,", "yes,", "automatic "))


def calculate_risk(details: dict) -> str:
    score = 0

    escalation = _number(details.get("price_escalation", "0"), 0)
    if escalation >= 15:
        score += 2
    elif escalation > 7:
        score += 1

    sla = _number(details.get("sla", "100"), 100)
    if sla < 99:
        score += 2
    elif sla < 99.9:
        score += 1

    termination = str(details.get("termination_clause", "Not specified")).lower()
    if termination not in ("not specified", "", "none", "n/a"):
        if any(word in termination for word in [
            "immediate", "without notice", "unilateral", "without cause",
            "at any time", "sole discretion", "may not terminate",
        ]):
            score += 2

    liability = str(details.get("liability_clause", "Not specified")).lower()
    if any(phrase in liability for phrase in [
        "unlimited", "consequential", "indirect damages",
        "strictly limited", "limited to $", "indemnifies", "indemnify",
    ]):
        score += 2
    elif any(phrase in liability for phrase in ["liability cap", "shall not exceed", "capped"]):
        score += 1

    auto_renewal = _is_true(details.get("auto_renewal", "false"))
    notice = str(details.get("notice_period", "Not specified")).lower()
    notice_days = _number(notice, 0)
    if auto_renewal and notice in ("not specified", "", "none", "n/a"):
        score += 1
    elif notice_days and notice_days < 30:
        score += 2 if notice_days < 7 else 1

    sla_penalties = str(details.get("sla_penalties", "Not specified")).lower()
    if sla < 99.9 and sla_penalties in ("not specified", "", "none", "n/a"):
        score += 1

    if score >= 4:
        return "High"
    elif score >= 2:
        return "Medium"
    else:
        return "Low"


def calculate_assessment(details: dict) -> dict:
    return {
        "risk": calculate_risk(details),
        "score": calculate_score(details),
    }