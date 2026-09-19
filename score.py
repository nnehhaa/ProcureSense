import re


def calculate_score(contract):

    score = 100

    def number(value, default):
        match = re.search(r"\d+(?:\.\d+)?", str(value))
        return float(match.group()) if match else default

    sla = number(contract.get("sla", "99%"), 99)
    escalation = number(contract.get("price_escalation", "0%"), 0)
    notice_days = number(contract.get("notice_period", "0 days"), 0)

    score -= escalation * 2

    if sla < 99.5:

        score -= 10

    if notice_days < 60:

        score -= 15

    return max(round(score), 0)