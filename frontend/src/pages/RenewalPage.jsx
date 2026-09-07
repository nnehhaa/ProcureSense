import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CalendarClock, AlertCircle, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function RenewalPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/alerts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load alerts", err);
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

  // Categorize alerts by urgency
  const criticalAlerts = alerts.filter(a => a.days <= 30).sort((a, b) => a.days - b.days);
  const warningAlerts = alerts.filter(a => a.days > 30 && a.days <= 90).sort((a, b) => a.days - b.days);
  const upcomingAlerts = alerts.filter(a => a.days > 90).sort((a, b) => a.days - b.days);

  const AlertCard = ({ alert, type }) => {
    const config = {
      critical: { color: "#ef4444", bg: "rgba(239,68,68,0.05)", icon: <AlertTriangle size={20} color="#ef4444" /> },
      warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.05)", icon: <AlertCircle size={20} color="#f59e0b" /> },
      upcoming: { color: "#10b981", bg: "rgba(16,185,129,0.05)", icon: <ShieldCheck size={20} color="#10b981" /> }
    };
    const c = config[type];

    return (
      <motion.div 
        whileHover={{ y: -4 }}
        onClick={() => navigate(`/contracts/${alert.id}`)}
        className="insight-card" 
        style={{ position: "relative", overflow: "hidden", cursor: "pointer", backgroundColor: "var(--color-bg-secondary)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: c.color }}></div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "1.1rem", color: "var(--color-text-primary)", border: "none", padding: 0 }}>
            {c.icon} {alert.vendor}
          </h3>
          <span style={{ backgroundColor: c.bg, color: c.color, padding: "4px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>
            {alert.days} days left
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.95rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)" }}>
            <span>Renewal Date</span>
            <span style={{ color: "var(--color-text-primary)" }}>{alert.renewal_date || "Unknown"}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="page">
      <div className="dashboard-header" style={{ marginBottom: "32px" }}>
        <div>
          <h1>Upcoming Renewals</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Monitor and manage contract expiration and notice deadlines.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)" }}>
          <CalendarClock size={48} color="var(--color-text-tertiary)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px", fontSize: "1.1rem" }}>No upcoming renewals found in the next 365 days.</p>
          <Link to="/contracts" className="hero-button secondary">View Contract Library</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {criticalAlerts.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.2rem", color: "#ef4444", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(239,68,68,0.2)", paddingBottom: "8px" }}>
                Critical Renewals (&lt; 30 Days)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {criticalAlerts.map(a => <AlertCard key={a.id} alert={a} type="critical" />)}
              </div>
            </section>
          )}

          {warningAlerts.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.2rem", color: "#f59e0b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(245,158,11,0.2)", paddingBottom: "8px" }}>
                Warning Window (30 - 90 Days)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {warningAlerts.map(a => <AlertCard key={a.id} alert={a} type="warning" />)}
              </div>
            </section>
          )}

          {upcomingAlerts.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.2rem", color: "#10b981", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(16,185,129,0.2)", paddingBottom: "8px" }}>
                Upcoming Renewals (90 - 365 Days)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {upcomingAlerts.map(a => <AlertCard key={a.id} alert={a} type="upcoming" />)}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}