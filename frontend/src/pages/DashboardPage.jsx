import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  FileText, ShieldAlert, TrendingUp, AlertTriangle, CalendarClock
} from "lucide-react";

const RISK_COLORS = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };

export default function DashboardPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState([]);
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
      .catch(err => {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%" }}></div>
      </div>
    );
  }

  // --- Aggregate Metrics ---
  const totalContracts = contracts.length;
  
  const avgScore = totalContracts > 0 
    ? Math.round(contracts.reduce((sum, c) => sum + (c.score || 0), 0) / totalContracts)
    : 0;

  const highRiskCount = contracts.filter(c => c.risk?.includes("High")).length;

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

  // --- Pie Chart Data ---
  const riskCounts = contracts.reduce((acc, c) => {
    if (c.risk?.includes("High")) acc.High++;
    else if (c.risk?.includes("Medium")) acc.Medium++;
    else acc.Low++;
    return acc;
  }, { Low: 0, Medium: 0, High: 0 });

  const riskData = [
    { name: "Low", value: riskCounts.Low },
    { name: "Medium", value: riskCounts.Medium },
    { name: "High", value: riskCounts.High },
  ].filter(d => d.value > 0);

  // --- Bar Chart Data ---
  const slaData = contracts.map(c => {
    const slaVal = parseFloat(c.sla) || 0;
    return { name: c.vendor.substring(0, 10), sla: slaVal > 100 ? 100 : slaVal };
  }).slice(0, 10); // show top 10

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Portfolio Dashboard</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Overview of all procurement contracts and risk posture.
          </p>
        </div>
      </div>

      {totalContracts === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }}>No data available. Upload contracts to populate your dashboard.</p>
          <Link to="/upload" className="hero-button">Upload Contract</Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3><FileText size={15} /> Total Contracts</h3>
              <div className="stat-value">{totalContracts}</div>
            </div>

            <div className="stat-card">
              <h3><TrendingUp size={15} /> Avg Health Score</h3>
              <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{avgScore}</span>
                <span style={{ fontSize: "1rem", color: "var(--color-text-secondary)" }}>/100</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: highRiskCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.05)" }}>
              <h3><ShieldAlert size={15} color={highRiskCount > 0 ? "#ef4444" : "var(--color-text-tertiary)"} /> High Risk</h3>
              <div className="stat-value" style={{ color: highRiskCount > 0 ? "#ef4444" : "var(--color-text-primary)" }}>
                {highRiskCount}
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: expiring90Days > 0 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.05)" }}>
              <h3><CalendarClock size={15} color={expiring90Days > 0 ? "#f59e0b" : "var(--color-text-tertiary)"} /> Expiring &lt; 90 Days</h3>
              <div className="stat-value" style={{ color: expiring90Days > 0 ? "#f59e0b" : "var(--color-text-primary)" }}>
                {expiring90Days}
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--color-text-secondary)" }}>Portfolio Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                {riskData.length > 0 ? (
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {riskData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, `${name} Risk`]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px" }} />
                    <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{value} Risk</span>} />
                  </PieChart>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)" }}>No risk data available</div>
                )}
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "var(--color-text-secondary)" }}>Vendor SLA Commitments</h3>
              <ResponsiveContainer width="100%" height={260}>
                {slaData.length > 0 ? (
                  <BarChart data={slaData} barSize={32} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} angle={-30} textAnchor="end" dy={10} />
                    <YAxis domain={[95, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val) => [`${val}%`, "SLA"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="sla" radius={[4, 4, 0, 0]} fill="url(#barGrad)" />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)" }}>No SLA data available</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
            <Link to="/contracts" className="hero-button secondary">View All Contracts</Link>
          </div>
        </>
      )}
    </div>
  );
}