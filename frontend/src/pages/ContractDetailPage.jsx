import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, ShieldAlert, FileCheck2, DollarSign, CalendarClock,
  ArrowLeft, Download, AlertTriangle, CheckCircle
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const RISK_COLORS = { Safe: "#10b981", Medium: "#f59e0b", High: "#ef4444" };

function getRiskData(riskLevel = "") {
  const r = riskLevel.toLowerCase();
  if (r.includes("low")) return [{ name: "Safe", value: 75 }, { name: "Medium", value: 20 }, { name: "High", value: 5 }];
  if (r.includes("medium")) return [{ name: "Safe", value: 35 }, { name: "Medium", value: 50 }, { name: "High", value: 15 }];
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
  const color = r.includes("low") ? "#10b981" : r.includes("medium") ? "#f59e0b" : "#ef4444";
  const icon = r.includes("low") ? <CheckCircle size={16}/> : r.includes("medium") ? <ShieldAlert size={16}/> : <AlertTriangle size={16}/>;
  const label = risk.replace(/[^a-zA-Z ]/g, "").trim();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      color, fontWeight: 700, fontSize: "1.1rem", padding: "4px 12px",
      backgroundColor: `${color}20`, borderRadius: "20px"
    }}>
      {icon} {label}
    </span>
  );
}

function DetailSection({ title, icon, children }) {
  return (
    <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-primary)" }}>
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
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "1rem", color: "var(--color-text-primary)", wordBreak: "break-word" }}>{value || "Not specified"}</span>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
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
      } catch (err) {
        console.error("Failed to fetch contract details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id, token]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%" }}></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Contract not found</h2>
        <Link to="/contracts" className="hero-button" style={{ marginTop: "24px" }}>Back to Library</Link>
      </div>
    );
  }

  const riskData = getRiskData(contract.risk);
  const clauseData = getClauseData(contract);

  return (
    <div className="page">
      <Link to="/contracts" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", marginBottom: "24px", fontSize: "0.9rem", transition: "color 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.color="white"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--color-text-secondary)"}>
        <ArrowLeft size={16} /> Back to Library
      </Link>

      <div className="dashboard-header" style={{ marginBottom: "32px" }}>
        <div>
          <h1 style={{ marginBottom: "8px" }}>{contract.vendor}</h1>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <RiskBadge risk={contract.risk} />
            <span style={{ color: "var(--color-text-tertiary)", fontSize: "0.9rem" }}>{contract.filename}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={() => window.open(`http://127.0.0.1:8000/contracts/${contract.id}/report`, "_blank")}
            className="hero-button secondary"
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Score Card */}
        <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ color: "var(--color-text-secondary)", fontSize: "1rem", marginBottom: "8px" }}>Overall Health Score</h3>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", maxWidth: "250px" }}>Score out of 100 based on SLA targets, notice periods, and price escalation clauses.</p>
          </div>
          <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 36 36" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={contract.score > 80 ? "#10b981" : contract.score > 50 ? "#f59e0b" : "#ef4444"} strokeWidth="3" strokeDasharray={`${contract.score}, 100`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{contract.score}</span>
          </div>
        </div>

        {/* Action Highlights */}
        <div style={{ backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ color: "var(--color-text-secondary)", fontSize: "1rem", marginBottom: "16px" }}>Key Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {contract.auto_renewal?.toLowerCase() === "true" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-warning)", fontSize: "0.9rem" }}>
                <AlertTriangle size={16} /> Contract auto-renews. Notice required: {contract.notice_period}.
              </div>
            )}
            {contract.price_escalation && contract.price_escalation !== "0%" && contract.price_escalation !== "Not specified" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-text-primary)", fontSize: "0.9rem" }}>
                <DollarSign size={16} color="var(--color-accent-secondary)"/> Has price escalation clause: {contract.price_escalation}.
              </div>
            )}
            {contract.termination_clause && contract.termination_clause !== "Not specified" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--color-text-primary)", fontSize: "0.9rem" }}>
                <ShieldAlert size={16} color="var(--color-accent-secondary)"/> Contains specific termination conditions.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "24px" }}>
        <DetailSection title="Metadata & Timelines" icon={<CalendarClock size={18} color="var(--color-accent-secondary)"/>}>
          <Field label="Agreement Type" value={contract.agreement_type} />
          <Field label="Effective Date" value={contract.effective_date} />
          <Field label="Renewal Date" value={contract.renewal_date} />
          <Field label="Auto Renewal" value={contract.auto_renewal} />
          <Field label="Notice Period" value={contract.notice_period} />
        </DetailSection>

        <DetailSection title="Financial & SLA Details" icon={<DollarSign size={18} color="var(--color-accent-secondary)"/>}>
          <Field label="Payment Terms" value={contract.payment_terms} />
          <Field label="Price Escalation" value={contract.price_escalation} />
          <Field label="SLA Target" value={contract.sla} />
          <Field label="Uptime Commitment" value={contract.uptime_commitment} />
          <Field label="Response Time" value={contract.response_time} />
          <Field label="SLA Penalties" value={contract.sla_penalties} />
        </DetailSection>

        <DetailSection title="Risk Clauses" icon={<ShieldAlert size={18} color="var(--color-accent-secondary)"/>}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Termination Clause" value={contract.termination_clause} /></div>
          <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}><Field label="Liability Limitations" value={contract.liability_clause} /></div>
          <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}><Field label="Compliance Requirements" value={contract.compliance_clause} /></div>
        </DetailSection>
      </div>

      {/* Charts Section */}
      <div className="charts-grid" style={{ marginBottom: "0" }}>
        <div className="chart-card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--color-text-secondary)" }}>Risk Model Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [`${val}%`, name]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px" }} />
              <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--color-text-secondary)" }}>Clause Coverage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clauseData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => v === 1 ? "Yes" : "No"} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(val) => [val === 1 ? "Present" : "Missing/Not specified"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="present" radius={[4, 4, 0, 0]} fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
