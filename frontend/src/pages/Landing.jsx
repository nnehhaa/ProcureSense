import { Link } from "react-router-dom";

const MARQUEE_ITEMS = [
  "AUTOMATED CLAUSE EXTRACTION",
  "RISK SCORING",
  "RAG-POWERED Q&A",
  "ROLE-BASED ACCESS CONTROL",
  "SLA TRACKING",
  "RENEWAL ALERTS",
  "PDF & DOCX INGESTION",
  "AUTOMATED CLAUSE EXTRACTION",
  "RISK SCORING",
  "RAG-POWERED Q&A",
  "ROLE-BASED ACCESS CONTROL",
  "SLA TRACKING",
  "RENEWAL ALERTS",
  "PDF & DOCX INGESTION",
];

export default function Landing() {
  return (
    <div className="landing-container">
      {/* NAVBAR — minimal version for landing */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 8%", position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(6, 8, 13, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Grotesk', monospace" }}>
          ProcureSense
        </span>
        <Link to="/login" className="hero-button" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
          Sign In
        </Link>
      </header>

      {/* HERO SECTION */}
      <section className="hero-split new-hero">
        <div className="hero-content">
          <h1>
            CONTRACT<br />
            <em>INTELLIGENCE.</em><br />
            FAST.
          </h1>
          <p style={{
            color: "var(--color-text-secondary)", fontSize: "1.05rem",
            lineHeight: 1.6, marginBottom: "32px", maxWidth: "460px"
          }}>
            Procurement-grade contract analysis. Upload a PDF or DOCX and get
            clause extraction, risk scoring, and natural-language Q&amp;A in seconds.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="hero-button pill-button primary">
              Get Started
            </Link>
            <Link to="/login" className="hero-button pill-button secondary">
              View Platform
            </Link>
          </div>
        </div>
        <div className="hero-graphic new-graphic" />
      </section>

      {/* MARQUEE */}
      <div className="marquee-container">
        <div className="marquee-content">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className={i % 2 === 1 ? "marquee-blue" : ""}>{item}</span>
          ))}
        </div>
      </div>

      {/* ABOUT SECTION */}
      <section className="image-split-section">
        <div className="image-split-text">
          <p>
            ProcureSense delivers a full suite of contract intelligence tools
            through a flexible, role-based platform built for procurement and
            legal teams. Navigate complex agreements, track SLA obligations, and
            drive sustained business value — at speed and scale.
            <br /><br />
            Our RAG-powered Q&amp;A engine gives you capacity and capability when
            you need it, grounding every answer in the actual contract text —
            no hallucinations, no guesswork.
          </p>
        </div>
        <div className="image-split-visual">
          <div className="ai-scan-visual">
            <div className="scan-line" />
            <div className="doc-blocks">
              <div className="doc-block" style={{ width: "30%", height: "14px", marginBottom: "24px" }} />
              <div className="doc-block" style={{ width: "100%", height: "10px" }} />
              <div className="doc-block" style={{ width: "90%", height: "10px" }} />
              <div className="doc-block" style={{ width: "95%", height: "10px", marginBottom: "24px" }} />
              
              <div className="doc-block highlight-risk" style={{ width: "100%", height: "10px" }} />
              <div className="doc-block highlight-risk" style={{ width: "85%", height: "10px" }} />
              <div className="doc-block highlight-risk" style={{ width: "40%", height: "10px", marginBottom: "24px" }} />
              
              <div className="doc-block" style={{ width: "100%", height: "10px" }} />
              <div className="doc-block" style={{ width: "70%", height: "10px" }} />
            </div>
            
            {/* Overlay tooltips */}
            <div className="scan-tooltip tooltip-1">
              <span className="dot" style={{ backgroundColor: "#3b82f6" }}></span>
              Analyzing Clauses
            </div>
            <div className="scan-tooltip tooltip-2">
              <span className="dot" style={{ backgroundColor: "#ef4444" }}></span>
              High Risk Detected
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="key-facts-section">
        <h2 className="key-facts-title">CORE CAPABILITIES</h2>
        <div className="facts-grid">
          <div className="fact-item">
            <span className="fact-number">15+</span>
            <span className="fact-desc">Key Clauses<br />Extracted</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">3</span>
            <span className="fact-desc">User Roles<br />Supported</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">100%</span>
            <span className="fact-desc">Document-grounded<br />Q&amp;A Answers</span>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="services-section">
        <div className="services-left">
          <h2>
            <span className="blue-text">FEATURES</span> THAT<br />
            MEET YOU<br />
            WHERE YOU ARE
          </h2>
        </div>
        <div className="services-right">
          <p>
            Whether you're a highly automated procurement team looking to
            extend your contract intelligence or you're moving from ad hoc
            reviews to a more formal program — ProcureSense makes that
            journey faster and smoother.
          </p>
          <Link to="/login" className="hero-button pill-button primary" style={{ width: "fit-content", padding: "12px 30px" }}>
            Explore Platform
          </Link>
        </div>
      </section>

      {/* PLATFORM BANNER */}
      <section className="platform-banner-container">
        <div className="platform-banner">
          <div className="platform-banner-text">
            <h2>
              <span className="blue-text">A PLATFORM</span> THAT<br />
              PUTS YOU IN CONTROL
            </h2>
            <p>
              ProcureSense's intelligence platform lets you kick off contract
              reviews as easily as uploading a file, while integrating with
              your existing workflows — from SLA tracking to automated risk
              dashboards and renewal alerts.
            </p>
            <Link to="/login" className="hero-button pill-button primary" style={{ width: "fit-content", marginTop: "20px" }}>
              Get Started
            </Link>
          </div>
          <div className="platform-banner-graphic" />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "28px 8%",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "12px",
      }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
          ProcureSense
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>
          Contract Intelligence Platform
        </span>
      </footer>
    </div>
  );
}