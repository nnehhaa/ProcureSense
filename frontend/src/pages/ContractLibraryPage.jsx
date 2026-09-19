import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Library, Trash2, ExternalLink, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export default function ContractLibraryPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchContracts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/contracts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setContracts(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [token]);

  const deleteContract = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this contract?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/contracts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setContracts(contracts.filter(c => c.id !== id));
    } catch {
      // fail silently
    }
  };

  const filteredContracts = contracts.filter(c => {
    if (filter === "All") return true;
    return c.risk === filter;
  });

  const getRiskIcon = (risk) => {
    if (risk === "High") return <AlertTriangle size={14} color="var(--color-danger)" />;
    if (risk === "Medium") return <ShieldAlert size={14} color="var(--color-warning)" />;
    if (risk !== "Low") return <ShieldAlert size={14} color="var(--color-text-tertiary)" />;
    return <CheckCircle size={14} color="var(--color-success)" />;
  };

  const getRiskClass = (risk) => {
    if (risk === "High") return "risk-high";
    if (risk === "Medium") return "risk-medium";
    return risk === "Low" ? "risk-low" : "risk-unknown";
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid var(--color-bg-tertiary)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Contract Library</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px", fontSize: "0.9rem" }}>
            Manage and analyze your organisation's procurement contracts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: "8px",
              backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-primary)",
              border: "var(--border-default)", outline: "none", fontSize: "0.88rem"
            }}
          >
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {(user.role === "admin" || user.role === "procurement") && (
            <button
              onClick={() => window.open("http://127.0.0.1:8000/contracts/report/all", "_blank")}
              className="hero-button secondary"
              style={{ padding: "8px 14px", fontSize: "0.88rem" }}
            >
              Export CSV
            </button>
          )}

          {(user.role === "admin" || user.role === "procurement") && (
            <Link to="/upload" className="hero-button" style={{ padding: "8px 14px", fontSize: "0.88rem" }}>
              Upload
            </Link>
          )}
        </div>
      </div>

      {contracts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "var(--border-subtle)" }}>
          <Library size={48} color="var(--color-text-tertiary)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ marginBottom: "8px", fontWeight: "500" }}>No contracts yet</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
            Upload your first procurement contract to begin.
          </p>
          {(user.role === "admin" || user.role === "procurement") && (
            <Link to="/upload" className="hero-button">Upload Contract</Link>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto", backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px", border: "var(--border-subtle)" }}>
          <table className="library-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "var(--border-default)", color: "var(--color-text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "14px 16px" }}>Vendor</th>
                <th style={{ padding: "14px 16px" }}>Type</th>
                <th style={{ padding: "14px 16px" }}>Renewal</th>
                <th style={{ padding: "14px 16px" }}>Risk</th>
                <th style={{ padding: "14px 16px" }}>Health</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => (
                <tr
                  key={contract.id}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  style={{
                    borderBottom: "var(--border-subtle)", cursor: "pointer",
                    transition: "background-color 0.1s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.015)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={{ padding: "14px 16px", fontWeight: "500", color: "var(--color-text-primary)", fontSize: "0.9rem" }}>{contract.vendor}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>{contract.agreement_type}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>{contract.renewal_date}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                      className={`badge ${getRiskClass(contract.risk)}`}>
                      {getRiskIcon(contract.risk)}
                      {contract.risk}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "40px", height: "3px", backgroundColor: "var(--color-bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${contract.score}%`, height: "100%", backgroundColor: contract.score > 80 ? "var(--color-success)" : contract.score > 50 ? "var(--color-warning)" : "var(--color-danger)" }} />
                      </div>
                      <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--color-text-primary)" }}>{contract.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${contract.id}`); }}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <ExternalLink size={14} />
                      </button>
                      {user.role === "admin" && (
                        <button
                          onClick={(e) => deleteContract(contract.id, e)}
                          className="action-btn delete-btn"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContracts.length === 0 && contracts.length > 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "0.9rem" }}>
                    No contracts match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
