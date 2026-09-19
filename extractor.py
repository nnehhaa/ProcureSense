import json
import re
import ollama


def _risk_excerpt(text: str) -> str:
    keywords = (
        "auto-renew", "renewal", "notice", "price escalation", "price increase",
        "sla", "uptime", "penalt", "termination", "liability", "indemnif",
        "damages", "compliance",
    )
    lines = [line.strip() for line in text.splitlines() if any(keyword in line.lower() for keyword in keywords)]
    return "\n".join(lines[:80])


def _apply_labeled_risk_fields(details: dict, text: str) -> dict:
    patterns = {
        "auto_renewal": r"auto[- ]?renewal\s*:\s*(.+)",
        "price_escalation": r"(?:price escalation|price increase)\s*:\s*(.+)",
        "sla": r"(?:sla|uptime(?: commitment)?)\s*:\s*(.+)",
        "notice_period": r"notice period\s*:\s*(.+)",
        "sla_penalties": r"sla penalties?\s*:\s*(.+)",
        "termination_clause": r"termination clause\s*:\s*(.+)",
        "liability_clause": r"liability clause\s*:\s*(.+)",
        "compliance_clause": r"compliance clause\s*:\s*(.+)",
    }
    for line in text.splitlines():
        for field, pattern in patterns.items():
            match = re.search(pattern, line, re.IGNORECASE)
            if match and match.group(1).strip():
                details[field] = match.group(1).strip()
    return details


def extract_contract_details(text: str) -> dict:
    truncated_text = text[:8000] if len(text) > 8000 else text
    risk_excerpt = _risk_excerpt(text)

    prompt = f"""You are a precision procurement contract data extractor.

Read the contract below and extract EXACTLY these 15 fields.
Return ONLY a raw JSON object. No markdown, no code fences, no explanation.
Just the JSON object starting with {{ and ending with }}.

Required fields:
1. vendor: company or vendor name (string)
2. agreement_type: type of contract e.g. "MSA", "SOW", "Purchase Order", "Vendor Agreement" (string)
3. effective_date: contract start date (string, e.g. "January 1, 2024")
4. renewal_date: contract renewal or expiry date (string, e.g. "December 31, 2025")
5. notice_period: notice period for termination (string, e.g. "90 days")
6. auto_renewal: whether contract auto-renews ("true" or "false")
7. price_escalation: annual price increase percentage (string, e.g. "5%")
8. payment_terms: payment schedule or terms (string, e.g. "Net 30")
9. sla: service level agreement uptime or performance target (string, e.g. "99.9%")
10. uptime_commitment: uptime percentage committed (string, e.g. "99.5%")
11. response_time: SLA response time commitment (string, e.g. "4 hours")
12. sla_penalties: penalties for SLA breach (string, e.g. "5% credit per breach")
13. termination_clause: summary of termination conditions (string)
14. liability_clause: summary of liability limitations (string)
15. compliance_clause: compliance or regulatory requirements (string)

If a field is not found in the contract, use "Not specified".
Never leave a field empty — always use "Not specified" as fallback.

Contract:
{truncated_text}

Risk-related clauses found throughout the document:
{risk_excerpt}
"""

    default_contract = {
        "vendor": "Unknown Vendor",
        "agreement_type": "Not specified",
        "effective_date": "Not specified",
        "renewal_date": "Not specified",
        "notice_period": "Not specified",
        "auto_renewal": "false",
        "price_escalation": "0%",
        "payment_terms": "Not specified",
        "sla": "Not specified",
        "uptime_commitment": "Not specified",
        "response_time": "Not specified",
        "sla_penalties": "Not specified",
        "termination_clause": "Not specified",
        "liability_clause": "Not specified",
        "compliance_clause": "Not specified",
    }

    try:
        response = ollama.chat(
            model="llama3",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a JSON extractor for procurement contracts. "
                        "You ONLY output valid raw JSON objects. "
                        "No markdown. No code fences. No explanation. Just the JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        answer = response["message"]["content"].strip()
        cleaned = re.sub(r"```(?:json)?", "", answer).strip()
        cleaned = cleaned.strip("`").strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1

        if start == -1 or end == 0:
            return _apply_labeled_risk_fields(default_contract, text)

        json_text = cleaned[start:end]
        extracted = json.loads(json_text)
        if not isinstance(extracted, dict):
            return _apply_labeled_risk_fields(default_contract, text)

        for key, value in extracted.items():
            if key not in default_contract:
                continue
            if value and str(value).strip() and str(value).strip() != "":
                default_contract[key] = value

        return _apply_labeled_risk_fields(default_contract, text)

    except Exception:
        return _apply_labeled_risk_fields(default_contract, text)