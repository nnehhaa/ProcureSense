import { useContext } from "react";
import { ContractContext } from "../context/ContractContext";
import { Link } from "react-router-dom";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { FileText, ShieldAlert, FileCheck2, TrendingUp, HelpCircle } from "lucide-react";

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const CLAUSE_DATA = [
  { name: 'Payment', count: 4 },
  { name: 'Termination', count: 2 },
  { name: 'Liability', count: 3 },
  { name: 'Confidentiality', count: 5 },
  { name: 'Warranties', count: 1 },
];

export default function DashboardPage() {
  const { contract } = useContext(ContractContext);

  if (!contract) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>No contract found</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
          Upload a contract to view analytics and insights.
        </p>
        <Link to="/upload" className="hero-button">
          Upload Contract
        </Link>
      </div>
    );
  }

  // Mocked risk distribution based on overall risk
  const getRiskData = (riskLevel) => {
    if (riskLevel?.includes("Low")) return [{ name: 'Safe', value: 80 }, { name: 'Medium', value: 15 }, { name: 'High', value: 5 }];
    if (riskLevel?.includes("Medium")) return [{ name: 'Safe', value: 40 }, { name: 'Medium', value: 45 }, { name: 'High', value: 15 }];
    return [{ name: 'Safe', value: 10 }, { name: 'Medium', value: 20 }, { name: 'High', value: 70 }];
  };
  const riskData = getRiskData(contract.risk);

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Contract Analytics</h1>
        <Link to="/chat" className="hero-button secondary" style={{ padding: "8px 16px" }}>
          <HelpCircle size={16} /> Ask AI
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3><FileText size={16} /> Vendor Name</h3>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>{contract.vendor}</div>
        </div>
        <div className="stat-card">
          <h3><ShieldAlert size={16} /> Risk Level</h3>
          <div className="stat-value">{contract.risk}</div>
        </div>
        <div className="stat-card">
          <h3><TrendingUp size={16} /> Overall Score</h3>
          <div className="stat-value">{contract.score}/100</div>
        </div>
        <div className="stat-card">
          <h3><FileCheck2 size={16} /> Compliance / SLA</h3>
          <div className="stat-value">{contract.sla}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Risk Distribution</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Clause Categories</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={CLAUSE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="var(--color-accent-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <h3>Executive Summary</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            This contract with <strong>{contract.vendor}</strong> has an overall score of <strong>{contract.score}/100</strong> and is assessed at a <strong>{contract.risk}</strong> risk level. The stated SLA is {contract.sla}. 
            Notice period for termination or renewal is {contract.notice_period}, with an auto-renewal status of {contract.auto_renewal}.
          </p>
        </div>

        <div className="insight-card">
          <h3>Key Findings</h3>
          <ul className="insight-list">
            <li>
              <ShieldAlert className="icon" size={16} />
              <span>Price escalation is set to <strong>{contract.price_escalation}</strong>.</span>
            </li>
            <li>
              <FileCheck2 className="icon" size={16} style={{ color: "var(--color-success)" }}/>
              <span>Standard SLAs meet the minimum required threshold.</span>
            </li>
            <li>
              <HelpCircle className="icon" size={16} style={{ color: "var(--color-warning)" }}/>
              <span>Notice period: {contract.notice_period}. Consider setting an early reminder.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}