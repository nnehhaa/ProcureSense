from datetime import datetime


def get_renewal_alerts(contracts):

    today = datetime.now()

    alerts = []

    for contract in contracts:

        renewal_date = contract.get(
            "renewal_date",
            ""
        )

        try:

            renewal = datetime.strptime(
                renewal_date,
                "%B %d, %Y"
            )

            days_remaining = (
                renewal - today
            ).days

            if days_remaining <= 365:

                alerts.append(
                    {
                        "vendor": contract["vendor"],
                        "days": days_remaining
                    }
                )

        except:

            pass

    return alerts