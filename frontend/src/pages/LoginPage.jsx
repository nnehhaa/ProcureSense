import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoCreds, setDemoCreds] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/auth/demo-credentials")
      .then(res => res.json())
      .then(data => setDemoCreds(data.credentials || []))
      .catch(err => console.error("Could not fetch demo creds", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const autofill = (creds) => {
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-bg-primary)" }}>
      {/* Left panel - Login Form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10%" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <Activity size={32} color="var(--color-accent-secondary)" />
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>ProcureSense</h1>
          </div>
          
          <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Welcome back</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
            Please enter your details to sign in.
          </p>

          {error && (
            <div style={{ 
              backgroundColor: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "12px", borderRadius: "8px", marginBottom: "24px",
              display: "flex", alignItems: "center", gap: "8px", color: "#ef4444"
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ 
                    width: "100%", padding: "12px 12px 12px 40px", 
                    backgroundColor: "var(--color-bg-secondary)", border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: "8px", color: "white", outline: "none"
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ 
                    width: "100%", padding: "12px 12px 12px 40px", 
                    backgroundColor: "var(--color-bg-secondary)", border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: "8px", color: "white", outline: "none"
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="hero-button"
              style={{ width: "100%", marginTop: "8px", justifyContent: "center" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Academic Demo Credentials Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ 
              marginTop: "48px", padding: "20px", 
              backgroundColor: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)"
            }}
          >
            <h3 style={{ fontSize: "1rem", marginBottom: "16px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
              🎓 Academic Demo Credentials
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {demoCreds.map((cred, idx) => (
                <div 
                  key={idx} 
                  onClick={() => autofill(cred)}
                  style={{ 
                    padding: "12px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px",
                    cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-accent-secondary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--color-accent-secondary)" }}>{cred.role} Role</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>{cred.permissions}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                    Email: {cred.email} <br/>
                    Pass: {cred.password}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Graphic */}
      <div style={{ 
        flex: 1, backgroundColor: "var(--color-bg-secondary)", 
        borderLeft: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "40px"
      }}>
        <div style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ 
            width: "300px", height: "300px", margin: "0 auto 40px",
            background: "radial-gradient(circle, rgba(96,165,250,0.2) 0%, rgba(30,41,59,0) 70%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Activity size={120} color="var(--color-accent-secondary)" strokeWidth={1} style={{ opacity: 0.8 }} />
          </div>
          <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>Enterprise Procurement Intelligence</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", lineHeight: 1.6 }}>
            Identify risks, monitor SLAs, and never miss a renewal date with AI-powered contract analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
