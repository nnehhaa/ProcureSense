import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles, FileText, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "Summarize this contract",
  "Identify risky clauses",
  "Show payment terms",
  "Find termination conditions",
  "Explain compliance issues"
];

function ChatBot() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm your AI Contract Assistant. You can ask me questions about your uploaded contracts, and I'll find the answers directly from the source text." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch available contracts for the scope selector
    fetch("http://127.0.0.1:8000/contracts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setContracts(data))
      .catch(err => console.error("Could not fetch contracts for chat", err));
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (query) => {
    if (!query.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setInput("");
    setIsTyping(true);

    try {
      const payload = { question: query };
      if (selectedFile) payload.source_file = selectedFile;

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: data.answer,
        sources: data.sources 
      }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="page" style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column", padding: "0" }}>
      {/* Chat Header & Scope Selector */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-bg-secondary)" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={20} color="var(--color-accent-secondary)" /> Procurement Assistant
          </h1>
          <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
            Powered by Llama3 RAG
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>Search Scope:</span>
          <div style={{ position: "relative" }}>
            <Database size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              style={{
                padding: "8px 16px 8px 36px", borderRadius: "8px",
                backgroundColor: "rgba(0,0,0,0.2)", color: "white",
                border: "1px solid rgba(255,255,255,0.1)", outline: "none",
                fontSize: "0.9rem", cursor: "pointer"
              }}
            >
              <option value="">All Contracts</option>
              {contracts.map(c => (
                <option key={c.id} value={c.filename}>{c.vendor} ({c.filename})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages" style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {messages.map((msg, index) => (
          <motion.div 
            key={index} 
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: "flex", gap: "16px",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%"
            }}
          >
            {msg.role === "ai" && (
              <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={18} color="var(--color-accent-secondary)"/>
              </div>
            )}
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ 
                padding: "16px 20px", borderRadius: "16px", fontSize: "1.05rem", lineHeight: 1.6,
                backgroundColor: msg.role === "user" ? "var(--color-accent-primary)" : "var(--color-bg-secondary)",
                color: msg.role === "user" ? "white" : "var(--color-text-primary)",
                border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.05)",
                borderTopRightRadius: msg.role === "user" ? "4px" : "16px",
                borderTopLeftRadius: msg.role === "ai" ? "4px" : "16px",
                whiteSpace: "pre-wrap"
              }}>
                {msg.content}
              </div>

              {/* Citations block */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", paddingLeft: "4px" }}>Sources:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {msg.sources.map((src, i) => (
                      <div key={i} title={`Relevance: ${src.score.toFixed(2)}\n\n${src.text}`} style={{ 
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px", backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)",
                        fontSize: "0.85rem", color: "var(--color-text-secondary)", cursor: "help"
                      }}>
                        <FileText size={14} color="var(--color-accent-secondary)" />
                        {src.source_file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} color="white" />
              </div>
            )}
          </motion.div>
        ))}
        
        {isTyping && (
          <div style={{ display: "flex", gap: "16px", alignSelf: "flex-start", maxWidth: "80%" }}>
            <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="var(--color-accent-secondary)"/>
            </div>
            <div style={{ padding: "16px 20px", borderRadius: "16px", borderTopLeftRadius: "4px", backgroundColor: "var(--color-bg-secondary)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="typing-indicator" style={{ display: "flex", gap: "4px" }}>
                <span className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-text-tertiary)" }}></span>
                <span className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-text-tertiary)" }}></span>
                <span className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-text-tertiary)" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: "24px 32px", backgroundColor: "var(--color-bg-secondary)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
          {SUGGESTIONS.map((suggestion, index) => (
            <button 
              key={index} 
              onClick={() => handleSend(suggestion)}
              disabled={isTyping}
              style={{
                whiteSpace: "nowrap", padding: "8px 16px", borderRadius: "20px",
                backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-secondary)", fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-accent-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Ask a question about your contracts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
            style={{
              flex: 1, padding: "16px 24px", borderRadius: "12px", fontSize: "1.05rem",
              backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", outline: "none"
            }}
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="hero-button"
            style={{ padding: "0 24px", borderRadius: "12px" }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;