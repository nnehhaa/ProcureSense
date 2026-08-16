import { Link } from "react-router-dom";
import { 
  Home,
  LayoutDashboard, 
  MessageSquare, 
  CalendarDays, 
  Info, 
  Activity 
} from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">
        <Link to="/">
          <Activity size={28} />
          ProcureSense
        </Link>
      </h2>

      <div className="nav-links">
        <Link to="/">
          <Home size={18} />
          Home
        </Link>

        <Link to="/dashboard">
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link to="/chat">
          <MessageSquare size={18} />
          AI Assistant
        </Link>

        <Link to="/renewals">
          <CalendarDays size={18} />
          Renewals
        </Link>

        <Link to="/about">
          <Info size={18} />
          About
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;