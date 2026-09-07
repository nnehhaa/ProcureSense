import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Library, Trash2, ExternalLink, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

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
    } catch (err) {
      console.error("Failed to fetch contracts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const deleteContract = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this contract?")) return;
    
    try {
      await fetch(`http://127.0.0.1:8000/contracts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setContracts(contracts.filter(c => c.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const filteredContracts = contracts.filter(c => {
    if (filter === "All") return true;
    return c.risk.includes(filter);
  });

  const getRiskIcon = (risk) => {
    if (risk.includes("High")) return <AlertTriangle size={16} color="#ef4444" />;
    if (risk.includes("Medium")) return <ShieldAlert size={16} color="#f59e0b" />;
    return <CheckCircle size={16} color="#10b981" />;
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%" }}></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Library size={28} color="var(--color-accent-secondary)" />
            Contract Library
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Manage and analyze your organization's procurement contracts.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: "8px 16px", borderRadius: "8px", 
              backgroundColor: "var(--color-bg-secondary)", color: "white",
              border: "1px solid rgba(255,255,255,0.1)", outline: "none"
            }}
          >
            <option value="All">All Risks</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
          
          <button 
            onClick={() => window.open("http://127.0.0.1:8000/contracts/report/all", "_blank")}
            className="hero-button secondary"
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            Export CSV
          </button>
          
          {user.role !== "legal" && (
            <Link to="/upload" className="hero-button" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Upload New
            </Link>
          )}
        </div>
      </div>

      {contracts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.2)" }}>
          <Library size={64} color="var(--color-text-tertiary)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ marginBottom: "8px" }}>Your library is empty</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
            Upload your first procurement contract to start analyzing.
          </p>
          {user.role !== "legal" && (
            <Link to="/upload" className="hero-button">Upload Contract</Link>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto", backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <table className="library-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-tertiary)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <th style={{ padding: "16px" }}>Vendor</th>
                <th style={{ padding: "16px" }}>Type</th>
                <th style={{ padding: "16px" }}>Renewal</th>
                <th style={{ padding: "16px" }}>Risk</th>
                <th style={{ padding: "16px" }}>Score</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract, idx) => (
                <motion.tr 
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  style={{ 
                    borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={{ padding: "16px", fontWeight: "500", color: "var(--color-text-primary)" }}>{contract.vendor}</td>
                  <td style={{ padding: "16px", color: "var(--color-text-secondary)" }}>{contract.agreement_type}</td>
                  <td style={{ padding: "16px", color: "var(--color-text-secondary)" }}>{contract.renewal_date}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                      {getRiskIcon(contract.risk)}
                      {contract.risk.replace(/[^a-zA-Z ]/g, "").trim()}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "40px", height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${contract.score}%`, height: "100%", backgroundColor: contract.score > 80 ? "#10b981" : contract.score > 50 ? "#f59e0b" : "#ef4444" }}></div>
                      </div>
                      <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{contract.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${contract.id}`); }}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <ExternalLink size={16} />
                      </button>
                      {user.role === "admin" && (
                        <button 
                          onClick={(e) => deleteContract(contract.id, e)}
                          className="action-btn delete-btn"
                          title="Delete Contract"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredContracts.length === 0 && contracts.length > 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
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
