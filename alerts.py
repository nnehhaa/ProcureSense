from datetime import datetime

DATE_FORMATS = [
    "%B %d, %Y",
    "%B %d,%Y",
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d-%m-%Y",
    "%d %B %Y",
]


def get_renewal_alerts(contracts):
    today = datetime.now()
    alerts = []

    for contract in contracts:
        renewal_date_str = contract.get("renewal_date", "")
        if not renewal_date_str or renewal_date_str in ("Not specified", "N/A", "None", ""):
            continue

        renewal = None
        for fmt in DATE_FORMATS:
            try:
                renewal = datetime.strptime(renewal_date_str.strip(), fmt)
                break
            except ValueError:
                continue

        if renewal is None:
            continue

        days_remaining = (renewal - today).days

        if 0 <= days_remaining <= 365:
            alerts.append({
                "id": contract.get("id"),
                "vendor": contract.get("vendor", "Unknown"),
                "renewal_date": renewal_date_str,
                "days": days_remaining,
            })

    return alerts