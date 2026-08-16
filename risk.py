import re


def calculate_risk(details):

    score = 0

    escalation_text = str(
        details.get(
            "price_escalation",
            "0"
        )
    )

    sla_text = str(
        details.get(
            "sla",
            "100"
        )
    )

    escalation_match = re.search(
        r"\d+",
        escalation_text
    )

    sla_match = re.search(
        r"\d+\.?\d*",
        sla_text
    )

    escalation = (
        int(escalation_match.group())
        if escalation_match
        else 0
    )

    sla = (
        float(sla_match.group())
        if sla_match
        else 100
    )

    if escalation > 7:
        score += 1

    if sla < 99.9:
        score += 1

    if score == 0:
        return "🟢 Low"

    elif score == 1:
        return "🟡 Medium"

    else:
        return "🔴 High"