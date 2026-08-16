import pandas as pd

from risk import calculate_risk


def create_dashboard(contracts):

    processed_contracts = []

    for contract in contracts:

        current_contract = {
            "vendor": contract.get(
                "vendor",
                "Unknown"
            ),
            "renewal_date": contract.get(
                "renewal_date",
                "Not found"
            ),
            "price_escalation": contract.get(
                "price_escalation",
                "0%"
            ),
            "sla": contract.get(
                "sla",
                "100%"
            ),
            "notice_period": contract.get(
                "notice_period",
                "Not specified"
            ),
            "auto_renewal": contract.get(
                "auto_renewal",
                "false"
            )
        }

        auto_renewal = str(
            current_contract["auto_renewal"]
        ).lower()

        current_contract["auto_renewal"] = (
            "✅ Yes"
            if auto_renewal == "true"
            else "❌ No"
        )

        current_contract["risk"] = calculate_risk(
            current_contract
        )

        processed_contracts.append(
            current_contract
        )

    return pd.DataFrame(
        processed_contracts
    )