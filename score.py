import re


def calculate_score(contract):

    score = 100

    try:

        sla = float(
            re.search(
                r"\d+\.?\d*",
                str(contract["sla"])
            ).group()
        )

    except:

        sla = 99

    try:

        escalation = int(
            re.search(
                r"\d+",
                str(contract["price_escalation"])
            ).group()
        )

    except:

        escalation = 0

    try:

        notice_days = int(
            re.search(
                r"\d+",
                str(contract["notice_period"])
            ).group()
        )

    except:

        notice_days = 0

    score -= escalation * 2

    if sla < 99.5:

        score -= 10

    if notice_days < 60:

        score -= 15

    return max(score, 0)