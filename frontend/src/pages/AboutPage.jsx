import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div className="dashboard-header">
        <h1>About ProcureSense</h1>
      </div>

      <div className="insight-card" style={{ padding: "var(--spacing-6)", textAlign: "center" }}>
        <Info size={48} color="var(--color-accent-secondary)" style={{ marginBottom: "var(--spacing-4)" }} />
        <h2 style={{ marginBottom: "var(--spacing-3)" }}>Intelligent Contract Analysis</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", lineHeight: "1.8", maxWidth: "600px", margin: "0 auto" }}>
          ProcureSense is an enterprise-grade AI-powered procurement intelligence platform. 
          It seamlessly analyzes contracts, detects risks, tracks upcoming renewals, and 
          provides deep context-aware insights through a conversational AI assistant.
        </p>
      </div>
    </div>
  );
}