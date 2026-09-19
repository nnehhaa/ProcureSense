import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, token } = useContext(AuthContext);

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "80px" }}>
        <div style={{
          display: "inline-block",
          padding: "32px 48px",
          borderRadius: "12px",
          background: "var(--color-bg-secondary)",
          border: "1px solid rgba(220, 38, 38, 0.25)",
          maxWidth: "480px",
          width: "100%"
        }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(220, 38, 38, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ color: "var(--color-text-primary)", marginBottom: "10px", fontSize: "1.2rem", fontWeight: "600" }}>Access Restricted</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Your role (<strong style={{ color: "var(--color-text-primary)" }}>{user.role}</strong>) does not have permission to access this page.
          </p>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.82rem", marginTop: "10px" }}>
            Required: {allowedRoles.join(" or ")}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
