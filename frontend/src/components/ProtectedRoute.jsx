import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, token } = useContext(AuthContext);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="page" style={{ textAlign: "center", marginTop: "100px" }}>
        <div style={{
          display: "inline-block",
          padding: "32px 48px",
          borderRadius: "16px",
          background: "var(--color-bg-secondary)",
          border: "1px solid rgba(239,68,68,0.3)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#ef4444", marginBottom: "8px" }}>Access Denied</h2>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Your role (<strong style={{ color: "var(--color-text-primary)" }}>{user.role}</strong>) does not
            have permission to access this page.
          </p>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem", marginTop: "8px" }}>
            Required role: <strong>{requiredRole}</strong>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
