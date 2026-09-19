import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FileText, ShieldAlert, DollarSign, CalendarClock,
  ArrowLeft, Download, AlertTriangle, CheckCircle
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const RISK_COLORS = { Safe: "#16a34a", Medium: "#d97706", High: "#dc2626" };

function getRiskData(riskLevel = "") {
  const r = riskLevel.toLowerCase();
  if (r === "low") return [{ name: "Safe", value: 75 }, { name: "Medium", value: 20 }, { name: "High", value: 5 }];
  if (r === "medium") return [{ name: "Safe", value: 35 }, { name: "Medium", value: 50 }, { name: "High", value: 15 }];
  return [{ name: "Safe", value: 10 }, { name: "Medium", value: 25 }, { name: "High", value: 65 }];
}

function getClauseData(contract) {
  const check = (val) => val && val !== "Not specified" && val !== "None" && val !== "N/A" ? 1 : 0;
  return [
    { name: "Pricing", present: check(contract.price_escalation) },
    { name: "Terms", present: check(contract.payment_terms) },
    { name: "SLA", present: check(contract.sla) },
    { name: "Penalty", present: check(contract.sla_penalties) },
    { name: "Notice", present: check(contract.notice_period) },
    { name: "Term.", present: check(contract.termination_clause) },
    { name: "Liab.", present: check(contract.liability_clause) },
  ];
}

function RiskBadge({ risk = "" }) {
  const r = risk.toLowerCase();
  let color = "var(--color-success)";
  let icon = <CheckCircle size={15} />;

  if (r === "high") {
    color = "var(--color-danger)";
    icon = <AlertTriangle size={15} />;
  } else if (r === "medium") {
    color = "var(--color-warning)";
    icon = <ShieldAlert size={15} />;
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      color, fontWeight: "600", fontSize: "0.9rem", padding: "4px 12px",
      backgroundColor: `${color}18`, borderRadius: "6px",
      border: `1px solid ${color}40`
    }}>
      {icon} {risk}
    </span>
  );
}

function DetailSection({ title, icon, children }) {
  return (
    <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px", padding: "24px", border: "var(--border-subtle)" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", marginBottom: "20px", paddingBottom: "12px", borderBottom: "var(--border-subtle)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "500" }}>
        {icon} {title}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: "0.95rem", color: "var(--color-text-primary)", wordBreak: "break-word", lineHeight: 1.5 }}>{value || "Not specified"}</span>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/contracts/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setContract(data);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id, token]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid var(--color-bg-tertiary)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Contract not found</h2>
        <Link to="/contracts" className="hero-button" style={{ marginTop: "24px", display: "inline-flex" }}>Back to Library</Link>
      </div>
    );
  }

  const riskData = getRiskData(contract.risk);
  const clauseData = getClauseData(contract);

  return (
    <div className="page">
      <Link
        to="/contracts"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-text-tertiary)", marginBottom: "24px", fontSize: "0.88rem", transition: "color 0.15s" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text-primary)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-tertiary)"}
      >
        <ArrowLeft size={15} /> Back to Library
      </Link>

      <div className="dashboard-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 style={{ marginBottom: "8px", fontSize: "1.6rem" }}>{contract.vendor}</h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <RiskBadge risk={contract.risk} />
            <span style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem" }}>{contract.filename}</span>
          </div>
        </div>

        {(user.role === "admin" || user.role === "procurement") && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => window.open(`http://127.0.0.1:8000/contracts/${contract.id}/report`, "_blank")}
              className="hero-button secondary"
              style={{ padding: "8px 14px", fontSize: "0.88rem" }}
            >
              <Download size={15} /> Export Report
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px", padding: "24px", border: "var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: "6px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>Health Score / 100</h3>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.82rem", maxWidth: "220px", lineHeight: 1.5 }}>Based on SLA targets, notice periods, and price escalation terms.</p>
          </div>
          <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 36 36" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke={contract.score > 80 ? "#16a34a" : contract.score > 50 ? "#d97706" : "#dc2626"}
                strokeWidth="3" strokeDasharray={`${contract.score}, 100`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "1.5rem", fontWeight: "700" }}>{contract.score}</span>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px", padding: "24px", border: "var(--border-subtle)" }}>
          <h3 style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: "14px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Flags</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {contract.auto_renewal?.toLowerCase() === "true" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-warning)", fontSize: "0.88rem" }}>
                <AlertTriangle size={14} /> Auto-renews — notice required: {contract.notice_period}
              </div>
            )}
            {contract.price_escalation && contract.price_escalation !== "0%" && contract.price_escalation !== "Not specified" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
                <DollarSign size={14} color="var(--color-accent-secondary)" /> Price escalation clause: {contract.price_escalation}
              </div>
            )}
            {contract.termination_clause && contract.termination_clause !== "Not specified" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
                <ShieldAlert size={14} color="var(--color-accent-secondary)" /> Specific termination conditions present
              </div>
            )}
            {!contract.auto_renewal && contract.price_escalation === "0%" && contract.termination_clause === "Not specified" && (
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.88rem" }}>No critical flags detected.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "16px" }}>
        <DetailSection title="Metadata & Timelines" icon={<CalendarClock size={15} />}>
          <Field label="Agreement Type" value={contract.agreement_type} />
          <Field label="Effective Date" value={contract.effective_date} />
          <Field label="Renewal Date" value={contract.renewal_date} />
          <Field label="Auto Renewal" value={contract.auto_renewal} />
          <Field label="Notice Period" value={contract.notice_period} />
        </DetailSection>

        <DetailSection title="Financial & SLA" icon={<DollarSign size={15} />}>
          <Field label="Payment Terms" value={contract.payment_terms} />
          <Field label="Price Escalation" value={contract.price_escalation} />
          <Field label="SLA Target" value={contract.sla} />
          <Field label="Uptime Commitment" value={contract.uptime_commitment} />
          <Field label="Response Time" value={contract.response_time} />
          <Field label="SLA Penalties" value={contract.sla_penalties} />
        </DetailSection>

        <DetailSection title="Risk Clauses" icon={<ShieldAlert size={15} />}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Termination Clause" value={contract.termination_clause} /></div>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Liability Limitations" value={contract.liability_clause} /></div>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Compliance Requirements" value={contract.compliance_clause} /></div>
        </DetailSection>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Risk Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={4} dataKey="value">
                {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [`${val}%`, name]} contentStyle={{ background: "var(--color-bg-secondary)", border: "var(--border-subtle)", borderRadius: "8px" }} />
              <Legend iconType="circle" iconSize={9} formatter={(value) => <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Clause Coverage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clauseData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => v === 1 ? "Yes" : "No"} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip formatter={(val) => [val === 1 ? "Present" : "Missing"]} contentStyle={{ background: "var(--color-bg-secondary)", border: "var(--border-subtle)", borderRadius: "8px" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="present" radius={[3, 3, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
