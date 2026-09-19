import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CalendarDays, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

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
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid var(--color-bg-tertiary)", borderTopColor: "var(--color-accent-secondary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.days <= 30).sort((a, b) => a.days - b.days);
  const warningAlerts = alerts.filter(a => a.days > 30 && a.days <= 90).sort((a, b) => a.days - b.days);
  const upcomingAlerts = alerts.filter(a => a.days > 90).sort((a, b) => a.days - b.days);

  const CONFIGS = {
    critical: { color: "var(--color-danger)", borderColor: "rgba(220,38,38,0.2)", icon: <AlertTriangle size={16} color="var(--color-danger)" /> },
    warning: { color: "var(--color-warning)", borderColor: "rgba(217,119,6,0.2)", icon: <AlertCircle size={16} color="var(--color-warning)" /> },
    upcoming: { color: "var(--color-success)", borderColor: "rgba(22,163,74,0.2)", icon: <ShieldCheck size={16} color="var(--color-success)" /> },
  };

  const AlertCard = ({ alert, type }) => {
    const c = CONFIGS[type];
    return (
      <div
        onClick={() => navigate(`/contracts/${alert.id}`)}
        style={{
          position: "relative", overflow: "hidden", cursor: "pointer",
          backgroundColor: "var(--color-bg-secondary)", padding: "18px 20px",
          borderRadius: "10px", border: "var(--border-subtle)", transition: "border-color 0.15s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = c.color + "60"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
      >
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: c.color }} />
        <div style={{ paddingLeft: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              {c.icon}
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "var(--color-text-primary)" }}>{alert.vendor}</h3>
            </div>
            <span style={{ backgroundColor: c.color + "18", color: c.color, padding: "3px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600", border: `1px solid ${c.color}40` }}>
              {alert.days}d
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-tertiary)", fontSize: "0.82rem" }}>
            <span>Renewal Date</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{alert.renewal_date || "—"}</span>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, color, borderColor, items, type }) => (
    <section>
      <h2 style={{ fontSize: "0.85rem", color, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600", borderBottom: `1px solid ${borderColor}`, paddingBottom: "8px" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {items.map(a => <AlertCard key={a.id} alert={a} type={type} />)}
      </div>
    </section>
  );

  return (
    <div className="page">
      <div className="dashboard-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1>Upcoming Renewals</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px", fontSize: "0.9rem" }}>
            Contract expiration and notice deadlines within the next 365 days.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px", border: "var(--border-subtle)" }}>
          <CalendarDays size={40} color="var(--color-text-tertiary)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px", fontSize: "0.95rem" }}>No upcoming renewals found in the next 365 days.</p>
          <Link to="/contracts" className="hero-button secondary">View Contract Library</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {criticalAlerts.length > 0 && (
            <Section title="Critical — less than 30 days" color="var(--color-danger)" borderColor="rgba(220,38,38,0.2)" items={criticalAlerts} type="critical" />
          )}
          {warningAlerts.length > 0 && (
            <Section title="Warning — 30 to 90 days" color="var(--color-warning)" borderColor="rgba(217,119,6,0.2)" items={warningAlerts} type="warning" />
          )}
          {upcomingAlerts.length > 0 && (
            <Section title="Upcoming — 90 to 365 days" color="var(--color-success)" borderColor="rgba(22,163,74,0.2)" items={upcomingAlerts} type="upcoming" />
          )}
        </div>
      )}
    </div>
  );
}