from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


CONTRACTS = {
	"contracts/High_Risk_Supplier_Agreement.pdf": [
		"HIGH-RISK SUPPLIER AGREEMENT",
		"Vendor: Apex Industrial Systems",
		"Agreement Type: Master Services Agreement",
		"Effective Date: January 15, 2026",
		"Renewal Date: January 15, 2027",
		"Auto-Renewal: Yes, automatic renewal for successive one-year terms.",
		"Notice Period: 5 days before expiration.",
		"Price Escalation: Vendor may increase prices by up to 25% annually.",
		"SLA: 95% uptime commitment.",
		"SLA Penalties: No service credits or financial remedies are provided.",
		"Termination Clause: Vendor may terminate immediately without cause and without notice.",
		"Liability Clause: Vendor liability is strictly limited to $100. Customer indemnifies Vendor against all third-party claims.",
		"Compliance Clause: Not specified.",
	],
	"contracts/High_Risk_Data_Processing_Addendum.pdf": [
		"HIGH-RISK DATA PROCESSING ADDENDUM",
		"Vendor: Northstar Data Operations",
		"Agreement Type: Data Processing Addendum",
		"Effective Date: February 1, 2026",
		"Renewal Date: February 1, 2027",
		"Auto-Renewal: Yes, automatic renewal unless notice is delivered 10 days before renewal.",
		"Notice Period: 10 days.",
		"Price Escalation: Fees may increase by 18% at each renewal.",
		"SLA: 98% availability commitment.",
		"SLA Penalties: Provider has no obligation to issue credits for downtime.",
		"Termination Clause: Customer may not terminate for convenience. Provider may terminate at any time at its sole discretion.",
		"Liability Clause: Liability shall not exceed one month's fees. Customer indemnifies Provider for all claims, including indirect damages.",
		"Compliance Clause: Security and regulatory requirements are not specified.",
	],
}


def write_contract(path, lines):
	document = canvas.Canvas(path, pagesize=letter)
	width, height = letter
	y = height - 72
	document.setFont("Helvetica-Bold", 14)
	document.drawString(60, y, lines[0])
	y -= 32
	document.setFont("Helvetica", 10)
	for line in lines[1:]:
		if y < 60:
			document.showPage()
			document.setFont("Helvetica", 10)
			y = height - 60
		document.drawString(60, y, line[:105])
		y -= 21
	document.save()


for contract_path, contract_lines in CONTRACTS.items():
	write_contract(contract_path, contract_lines)
