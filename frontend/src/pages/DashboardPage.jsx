import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { FileText, ShieldAlert, TrendingUp, CalendarClock, ListChecks } from "lucide-react";

const RISK_COLORS = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };

export default function DashboardPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/contracts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setContracts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("http://127.0.0.1:8000/obligations", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : { events: [] })
      .then(data => setObligations(Array.isArray(data.events) ? data.events : []))
      .catch(() => setObligations([]));
  }, [token]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid var(--color-bg-tertiary)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const totalContracts = contracts.length;

  const avgScore = totalContracts > 0
    ? Math.round(contracts.reduce((sum, c) => sum + (c.score || 0), 0) / totalContracts)
    : 0;

  const highRiskCount = contracts.filter(c => c.risk === "High").length;

  const expiring90Days = contracts.filter(c => {
    try {
      const date = new Date(c.renewal_date);
      if (isNaN(date.getTime())) return false;
      const diffDays = (date - new Date()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 90;
    } catch {
      return false;
    }
  }).length;

  const riskCounts = contracts.reduce((acc, c) => {
    const r = c.risk;
    if (r === "High") acc.High++;
    else if (r === "Medium") acc.Medium++;
    else if (r === "Low") acc.Low++;
    return acc;
  }, { Low: 0, Medium: 0, High: 0 });

  const riskData = [
    { name: "Low", value: riskCounts.Low },
    { name: "Medium", value: riskCounts.Medium },
    { name: "High", value: riskCounts.High },
  ].filter(d => d.value > 0);

  const slaData = contracts.map(c => {
    const slaVal = parseFloat(c.sla) || 0;
    return { name: c.vendor.substring(0, 10), sla: slaVal > 100 ? 100 : slaVal };
  }).slice(0, 10);

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Portfolio Dashboard</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px", fontSize: "0.9rem" }}>
            Overview of all procurement contracts and risk posture.
          </p>
        </div>
      </div>

      {totalContracts === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "var(--border-subtle)" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }}>No contracts uploaded yet. Upload contracts to populate your dashboard.</p>
          <Link to="/upload" className="hero-button">Upload Contract</Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3><FileText size={14} /> Total Contracts</h3>
              <div className="stat-value">{totalContracts}</div>
            </div>

            <div className="stat-card">
              <h3><TrendingUp size={14} /> Avg Health Score</h3>
              <div className="stat-value" style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span>{avgScore}</span>
                <span style={{ fontSize: "1rem", color: "var(--color-text-secondary)", fontWeight: "400" }}>/100</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: highRiskCount > 0 ? "rgba(220, 38, 38, 0.3)" : "" }}>
              <h3>
                <ShieldAlert size={14} color={highRiskCount > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)"} />
                High Risk
              </h3>
              <div className="stat-value" style={{ color: highRiskCount > 0 ? "var(--color-danger)" : "var(--color-text-primary)" }}>
                {highRiskCount}
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: expiring90Days > 0 ? "rgba(217, 119, 6, 0.3)" : "" }}>
              <h3>
                <CalendarClock size={14} color={expiring90Days > 0 ? "var(--color-warning)" : "var(--color-text-tertiary)"} />
                Expiring &lt; 90 Days
              </h3>
              <div className="stat-value" style={{ color: expiring90Days > 0 ? "var(--color-warning)" : "var(--color-text-primary)" }}>
                {expiring90Days}
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                {riskData.length > 0 ? (
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [val, `${name} Risk`]}
                      contentStyle={{ background: "var(--color-bg-secondary)", border: "var(--border-subtle)", borderRadius: "8px" }}
                    />
                    <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem" }}>{value} Risk</span>} />
                  </PieChart>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: "0.9rem" }}>No risk data</div>
                )}
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Vendor SLA Commitments</h3>
              <ResponsiveContainer width="100%" height={240}>
                {slaData.length > 0 ? (
                  <BarChart data={slaData} barSize={28} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" dy={10} />
                    <YAxis domain={[95, 100]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, "SLA"]}
                      contentStyle={{ background: "var(--color-bg-secondary)", border: "var(--border-subtle)", borderRadius: "8px" }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="sla" radius={[3, 3, 0, 0]} fill="#2563eb" />
                  </BarChart>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: "0.9rem" }}>No SLA data</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card obligations-timeline">
            <h3><ListChecks size={14} /> Obligation Timeline</h3>
            {obligations.length > 0 ? (
              <div className="obligation-list">
                {obligations.slice(0, 12).map((event, index) => (
                  <Link to={`/contracts/${event.contract_id}`} className={`obligation-item obligation-${event.type}`} key={`${event.contract_id}-${event.type}-${index}`}>
                    <span className="obligation-date">{event.date || "Review"}</span>
                    <span className="obligation-detail">
                      <strong>{event.label}</strong>
                      <small>{event.vendor} · {event.filename}</small>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="obligations-empty">No obligation dates have been extracted yet.</p>
            )}
          </div>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
            <Link to="/contracts" className="hero-button secondary">View All Contracts</Link>
          </div>
        </>
      )}
    </div>
  );
}