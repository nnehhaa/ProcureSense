import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  MessageSquare, 
  ShieldAlert, 
  CalendarClock 
} from "lucide-react";

export default function Landing() {
  return (
    <>
      <section className="hero">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Procurement Intelligence, <br/> Elevated.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          AI-powered procurement contract analysis for instant risk detection, 
          vendor comparison, and compliance tracking.
        </motion.p>

        <motion.div 
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link to="/upload" className="hero-button">
            Upload Contract
          </Link>

          <Link to="/dashboard" className="hero-button secondary">
            Dashboard
          </Link>
        </motion.div>
      </section>

      <div className="feature-grid">
        <motion.div 
          className="feature-card"
          whileHover={{ y: -5 }}
        >
          <h3><BarChart3 size={20} color="var(--color-accent-secondary)"/> Dashboard</h3>
          <p>
            Gain instant visibility into contract scores, SLAs, risks,
            and vendor insights with our analytics dashboard.
          </p>
        </motion.div>

        <motion.div 
          className="feature-card"
          whileHover={{ y: -5 }}
        >
          <h3><MessageSquare size={20} color="var(--color-accent-secondary)"/> AI Assistant</h3>
          <p>
            Chat naturally with your procurement contracts. Ask complex questions
            and get instant, context-aware answers.
          </p>
        </motion.div>

        <motion.div 
          className="feature-card"
          whileHover={{ y: -5 }}
        >
          <h3><ShieldAlert size={20} color="var(--color-accent-secondary)"/> Risk Detection</h3>
          <p>
            Automatically identify risky procurement clauses, hidden fees,
            and non-standard terms before you sign.
          </p>
        </motion.div>

        <motion.div 
          className="feature-card"
          whileHover={{ y: -5 }}
        >
          <h3><CalendarClock size={20} color="var(--color-accent-secondary)"/> Renewals</h3>
          <p>
            Never miss a critical contract renewal or notice period with 
            automated tracking and alerts.
          </p>
        </motion.div>
      </div>
    </>
  );
}