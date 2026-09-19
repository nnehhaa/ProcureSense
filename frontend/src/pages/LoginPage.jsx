import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("procurement");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("procurement");
  };

  const switchMode = (newMode) => {
    reset();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error("Full name is required.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        await register(name.trim(), email, password, role);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px 10px 38px",
    backgroundColor: "var(--color-bg-secondary)",
    border: "var(--border-default)",
    borderRadius: "8px",
    color: "var(--color-text-primary)",
    outline: "none",
    fontSize: "0.95rem",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    color: "var(--color-text-secondary)",
    fontSize: "0.85rem",
    fontWeight: "500",
  };

  const iconStyle = {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--color-text-tertiary)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-bg-primary)" }}>
      {/* Left panel — form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10%" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--color-text-primary)", marginBottom: "6px" }}>
              ProcureSense
            </h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.9rem" }}>Contract Intelligence Platform</p>
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", borderBottom: "var(--border-subtle)", marginBottom: "28px" }}>
            <button
              onClick={() => switchMode("login")}
              style={{
                flex: 1, padding: "10px 0", background: "none", border: "none",
                fontSize: "0.9rem", fontWeight: "600", cursor: "pointer",
                color: mode === "login" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                borderBottom: mode === "login" ? "2px solid var(--color-accent-primary)" : "2px solid transparent",
                marginBottom: "-1px", transition: "color 0.15s",
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("register")}
              style={{
                flex: 1, padding: "10px 0", background: "none", border: "none",
                fontSize: "0.9rem", fontWeight: "600", cursor: "pointer",
                color: mode === "register" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                borderBottom: mode === "register" ? "2px solid var(--color-accent-primary)" : "2px solid transparent",
                marginBottom: "-1px", transition: "color 0.15s",
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              padding: "12px 16px", borderRadius: "8px", marginBottom: "24px",
              display: "flex", alignItems: "center", gap: "8px", color: "#fca5a5",
              fontSize: "0.9rem"
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {mode === "register" && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={iconStyle} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    style={inputStyle}
                    required
                    onFocus={(e) => e.target.style.borderColor = "var(--color-accent-secondary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={iconStyle} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={inputStyle}
                  required
                  onFocus={(e) => e.target.style.borderColor = "var(--color-accent-secondary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={iconStyle} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  required
                  onFocus={(e) => e.target.style.borderColor = "var(--color-accent-secondary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                />
              </div>
              {mode === "register" && (
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-tertiary)", marginTop: "5px" }}>
                  Minimum 8 characters.
                </p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px",
                    backgroundColor: "var(--color-bg-secondary)",
                    border: "var(--border-default)",
                    borderRadius: "8px", color: "var(--color-text-primary)",
                    outline: "none", fontSize: "0.95rem",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-accent-secondary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
                >
                  <option value="procurement">Procurement Officer</option>
                  <option value="legal">Legal Reviewer</option>
                </select>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-tertiary)", marginTop: "5px" }}>
                  Admin access is provisioned separately.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="hero-button"
              style={{ width: "100%", marginTop: "4px", padding: "11px" }}
            >
              {loading
                ? (mode === "login" ? "Signing in..." : "Creating account...")
                : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel — feature list */}
      <div style={{
        flex: 1,
        backgroundColor: "var(--color-bg-secondary)",
        borderLeft: "var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "40px"
      }}>
        <div style={{ maxWidth: "420px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "20px", letterSpacing: "-0.02em" }}>
            Procurement contract review, done right.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "Document ingestion", detail: "PDF and DOCX contracts, including scanned documents via OCR" },
              { label: "Clause extraction", detail: "Renewal dates, SLA obligations, price escalation, and liability terms" },
              { label: "RAG-based Q&A", detail: "Answers cited from the actual contract — not hallucinated" },
              { label: "Obligation dashboard", detail: "Upcoming renewals, expiring SLAs, and risk timelines at a glance" },
              { label: "Role-based access", detail: "Admin, Procurement, and Legal roles with enforced permissions" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-accent-primary)", marginTop: "8px", flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--color-text-primary)" }}>{item.label}</span>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "2px", lineHeight: 1.5 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
