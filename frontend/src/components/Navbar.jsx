import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Library,
  LayoutDashboard, 
  MessageSquare, 
  CalendarDays, 
  UploadCloud, 
  Activity,
  LogOut,
  Scale
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  // Hide Navbar completely on login page
  if (location.pathname === "/login") return null;

  return (
    <nav className="navbar">
      <h2 className="logo">
        <Link to="/">
          <Activity size={28} />
          ProcureSense
        </Link>
      </h2>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/contracts" className={isActive("/contracts")}>
              <Library size={18} />
              Library
            </Link>

            <Link to="/dashboard" className={isActive("/dashboard")}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link to="/chat" className={isActive("/chat")}>
              <MessageSquare size={18} />
              Assistant
            </Link>

            <Link to="/renewals" className={isActive("/renewals")}>
              <CalendarDays size={18} />
              Renewals
            </Link>
            
            <Link to="/evaluate" className={isActive("/evaluate")}>
              <Scale size={18} />
              Evaluate
            </Link>

            {user.role !== "legal" && (
              <Link to="/upload" className={isActive("/upload")}>
                <UploadCloud size={18} />
                Upload
              </Link>
            )}

            <div style={{ marginLeft: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: "1.2" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-primary)" }}>{user.name}</span>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)", 
                  padding: "6px 10px", borderRadius: "8px", color: "var(--color-text-secondary)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/about" className={isActive("/about")}>About</Link>
            <Link to="/login" className="hero-button" style={{ padding: "6px 16px", fontSize: "0.95rem" }}>Sign In</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;