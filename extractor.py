"""
extractor.py — LLM-powered structured extraction of 15 contract fields.
Uses Ollama llama3 to extract all fields from contract text.
"""

import json
import re
import ollama


def extract_contract_details(text: str) -> dict:
    """
    Extract 15 structured fields from contract text using llama3.
    Returns a dict with all fields, falling back to defaults for missing ones.
    """

    # Truncate to avoid token limits while keeping the most informative sections
    truncated_text = text[:8000] if len(text) > 8000 else text

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
        "sla": "99%",
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

        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?", "", answer).strip()
        cleaned = cleaned.strip("`").strip()

        # Extract the JSON object
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1

        if start == -1 or end == 0:
            print("[extractor] No JSON object found in response:", cleaned[:300])
            return default_contract

        json_text = cleaned[start:end]
        extracted = json.loads(json_text)

        # Merge into defaults (ensures all 15 fields always present)
        for key, value in extracted.items():
            if value and str(value).strip() and str(value).strip() != "":
                default_contract[key] = value

        print(f"[extractor] Successfully extracted {len(extracted)} fields for vendor: {default_contract.get('vendor')}")
        return default_contract

    except Exception as e:
        print(f"[extractor] Extraction failed: {str(e)}")
        return default_contract