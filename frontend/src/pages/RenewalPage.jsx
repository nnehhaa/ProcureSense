import { useContext } from "react";
import { ContractContext } from "../context/ContractContext";
import { CalendarClock, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function RenewalPage() {
  const { contract } = useContext(ContractContext);

  if (!contract) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>No contract found</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
          Upload a contract to view upcoming renewals.
        </p>
        <Link to="/upload" className="hero-button">
          Upload Contract
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Upcoming Renewals</h1>
      </div>

      <div className="insight-grid" style={{ maxWidth: "800px" }}>
        <div className="insight-card" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--color-warning)" }}></div>
          
          <h3 style={{ borderBottom: "none", marginBottom: "var(--spacing-4)" }}>
            <CalendarClock size={20} color="var(--color-warning)" />
            Renewal Alert: {contract.vendor}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "var(--spacing-2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Vendor</span>
              <span style={{ fontWeight: "500" }}>{contract.vendor}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "var(--spacing-2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Renewal Date</span>
              <span style={{ fontWeight: "500" }}>{contract.renewal_date}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "var(--spacing-2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Notice Period</span>
              <span style={{ fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertCircle size={14} color="var(--color-warning)" />
                {contract.notice_period}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Auto Renewal</span>
              <span style={{ fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                <RefreshCw size={14} color={contract.auto_renewal?.toLowerCase() === 'true' ? "var(--color-success)" : "var(--color-text-secondary)"} />
                {contract.auto_renewal}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}