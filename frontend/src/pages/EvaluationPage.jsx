import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Scale, Loader2, AlertTriangle, CheckCircle, Search, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EvaluationPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/evaluate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ question: query }),
      });

      if (!res.ok) {
        throw new Error("Evaluation failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to run evaluation. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="dashboard-header" style={{ marginBottom: "32px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Scale size={28} color="var(--color-accent-secondary)" />
            RAG Evaluation Framework
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Compare grounded RAG responses against baseline LLM hallucinations.
          </p>
        </div>
      </div>

      {/* Query Input */}
      <form onSubmit={handleEvaluate} style={{ marginBottom: "40px" }}>
        <div style={{ position: "relative", display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={20} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a test question (e.g. 'What is the penalty for AWS SLA breach?')"
              style={{ 
                width: "100%", padding: "16px 16px 16px 48px", fontSize: "1.1rem",
                backgroundColor: "var(--color-bg-secondary)", border: "1px solid rgba(255,255,255,0.1)", 
                borderRadius: "12px", color: "white", outline: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="hero-button"
            style={{ padding: "0 32px", fontSize: "1.05rem" }}
          >
            {loading ? <Loader2 size={20} className="spin" /> : "Evaluate"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Metrics Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div style={{ backgroundColor: "var(--color-bg-secondary)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "8px" }}>Faithfulness Score</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "bold", color: result.faithfulness_score >= 0.7 ? "#10b981" : result.faithfulness_score >= 0.4 ? "#f59e0b" : "#ef4444" }}>
                    {Math.round(result.faithfulness_score * 100)}%
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.2 }}>Grounded in<br/>retrieved context</span>
                </div>
              </div>

              <div style={{ backgroundColor: "var(--color-bg-secondary)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "8px" }}>Hallucination Flag (No-RAG)</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {result.hallucination_flag ? (
                    <><AlertTriangle size={32} color="#ef4444" /> <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#ef4444" }}>Detected</span></>
                  ) : (
                    <><CheckCircle size={32} color="#10b981" /> <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#10b981" }}>Not Detected</span></>
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: "var(--color-bg-secondary)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.9rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", marginBottom: "8px" }}>Retrieval Performance</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-primary)" }}>{result.retrieval_count}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.2 }}>Chunks<br/>reranked & used</span>
                </div>
              </div>
            </div>

            {/* Comparison Panels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "stretch" }}>
              
              {/* RAG Answer */}
              <div style={{ backgroundColor: "rgba(16,185,129,0.05)", padding: "24px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", color: "#10b981", marginBottom: "16px" }}>
                  <CheckCircle size={20} /> ProcureSense RAG Answer
                </h3>
                <div style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--color-text-primary)", flex: 1, whiteSpace: "pre-wrap" }}>
                  {result.rag_answer}
                </div>
                
                {/* Sources */}
                {result.rag_sources && result.rag_sources.length > 0 && (
                  <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(16,185,129,0.2)" }}>
                    <h4 style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "12px", textTransform: "uppercase" }}>Sources Used</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {result.rag_sources.map((src, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem" }}>
                          <FileText size={14} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <div>
                            <span style={{ color: "var(--color-text-primary)", fontWeight: "500" }}>{src.source_file}</span>
                            <span style={{ color: "var(--color-text-tertiary)", marginLeft: "8px" }}>(Relevance: {src.score.toFixed(2)})</span>
                            <div style={{ color: "var(--color-text-secondary)", marginTop: "2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              "{src.text}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* No-RAG Baseline */}
              <div style={{ backgroundColor: "rgba(239,68,68,0.05)", padding: "24px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", color: "#ef4444", marginBottom: "16px" }}>
                  <AlertTriangle size={20} /> Baseline LLM Answer (No RAG)
                </h3>
                <div style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--color-text-primary)", flex: 1, whiteSpace: "pre-wrap" }}>
                  {result.norag_answer}
                </div>
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(239,68,68,0.2)", fontSize: "0.85rem", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                  This model answers from general training data without access to your uploaded contracts, often leading to hallucinations.
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
