import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Library,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  UploadCloud,
  LogOut,
  Scale,
  FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/", { replace: true });
    logout();
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  if (location.pathname === "/" || location.pathname === "/login") return null;

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          <FileText size={20} />
          ProcureSense
        </Link>
      </div>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/contracts" className={isActive("/contracts")}>
              <Library size={16} />
              Library
            </Link>

            <Link to="/dashboard" className={isActive("/dashboard")}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>

            <Link to="/chat" className={isActive("/chat")}>
              <MessageSquare size={16} />
              Q&amp;A
            </Link>

            <Link to="/renewals" className={isActive("/renewals")}>
              <CalendarDays size={16} />
              Renewals
            </Link>

            {(user.role === "admin" || user.role === "procurement") && (
              <Link to="/upload" className={isActive("/upload")}>
                <UploadCloud size={16} />
                Upload
              </Link>
            )}

            <div style={{ marginLeft: "8px", display: "flex", alignItems: "center", gap: "10px", paddingLeft: "16px", borderLeft: "var(--border-subtle)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: "1.2" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-primary)" }}>{user.name}</span>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent", border: "var(--border-subtle)",
                  padding: "6px 10px", borderRadius: "6px", color: "var(--color-text-secondary)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s", fontSize: "0.85rem"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="hero-button" style={{ padding: "7px 16px", fontSize: "0.88rem" }}>Sign In</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;