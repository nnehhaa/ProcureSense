import json
import ollama


def extract_contract_details(text):

    prompt = f"""
You are a procurement contract analyst.

Analyze the contract below.

Extract:

1. Vendor name
2. Renewal date
3. Price escalation
4. SLA
5. Notice period
6. Auto-renewal

Return ONLY valid JSON.

Example:

{{
    "vendor": "",
    "renewal_date": "",
    "price_escalation": "",
    "sla": "",
    "notice_period": "",
    "auto_renewal": ""
}}

Contract:

{text}
"""

    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response["message"]["content"]

    default_contract = {
        "vendor": "Unknown",
        "renewal_date": "Not found",
        "price_escalation": "0%",
        "sla": "100%",
        "notice_period": "Not specified",
        "auto_renewal": "false"
    }

    try:

        start = answer.find("{")

        end = answer.rfind("}") + 1

        json_text = answer[start:end]

        extracted = json.loads(json_text)

        default_contract.update(extracted)

        return default_contract

    except:

        return default_contract