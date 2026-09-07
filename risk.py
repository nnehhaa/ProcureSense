"""
risk.py — Enhanced contract risk scoring for ProcureSense.
5-signal scoring system covering price, SLA, termination, liability, and auto-renewal risk.
"""

import re


def calculate_risk(details: dict) -> str:
    """
    Calculate risk level based on 5 signals.
    Returns: "🟢 Low", "🟡 Medium", or "🔴 High"
    """
    score = 0

    # --- Signal 1: Price Escalation ---
    escalation_text = str(details.get("price_escalation", "0"))
    escalation_match = re.search(r"\d+\.?\d*", escalation_text)
    escalation = float(escalation_match.group()) if escalation_match else 0
    if escalation > 7:
        score += 1  # High escalation is risky

    # --- Signal 2: SLA Quality ---
    sla_text = str(details.get("sla", "100"))
    sla_match = re.search(r"\d+\.?\d*", sla_text)
    sla = float(sla_match.group()) if sla_match else 100
    if sla < 99.9:
        score += 1  # Below gold standard SLA

    # --- Signal 3: Termination Clause ---
    termination = str(details.get("termination_clause", "Not specified")).lower()
    if termination not in ("not specified", "", "none", "n/a"):
        # Has explicit termination clause — increases scrutiny
        if any(word in termination for word in ["immediate", "without notice", "unilateral"]):
            score += 1

    # --- Signal 4: Liability Clause ---
    liability = str(details.get("liability_clause", "Not specified")).lower()
    if any(phrase in liability for phrase in ["unlimited", "consequential", "indirect damages"]):
        score += 1

    # --- Signal 5: Auto-Renewal without Notice ---
    auto_renewal = str(details.get("auto_renewal", "false")).lower()
    notice = str(details.get("notice_period", "Not specified")).lower()
    if auto_renewal == "true" and notice in ("not specified", "", "none", "n/a"):
        score += 1  # Auto-renews with no notice period — trap risk

    # Categorize
    if score <= 1:
        return "🟢 Low"
    elif score <= 3:
        return "🟡 Medium"
    else:
        return "🔴 High"