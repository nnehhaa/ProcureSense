import { useState, useRef, useEffect } from "react";
import { Send, User, MessageSquare, FileText, Database, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "Summarize this contract",
  "What are the payment terms?",
  "Identify risky clauses",
  "What is the termination notice period?",
  "Show price escalation details",
];

function ChatBot() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    { role: "ai", content: "Contract Q&A is ready. Ask a question about your uploaded contracts and the answer will be grounded in the actual contract text." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/contracts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => Array.isArray(data) && setContracts(data))
      .catch(() => {});
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (query) => {
    const q = typeof query === "string" ? query : input;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: q }]);
    setInput("");
    setIsTyping(true);

    try {
      const payload = { question: q };
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

      if (!response.ok) {
        const errorMsg = data.detail || `Server error (${response.status})`;
        setMessages(prev => [...prev, { role: "ai", content: `Error: ${errorMsg}` }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: "ai",
        content: data.answer || "No response received.",
        sources: data.sources || [],
        results: data.results || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "Could not reach the backend. Make sure the API server is running at http://127.0.0.1:8000."
      }]);
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
    <section className="chat-shell">
      <header className="chat-header">
        <div className="chat-title-block">
          <div className="chat-title-icon"><MessageSquare size={17} /></div>
          <div>
            <div className="chat-title-row">
              <h1>Contract Q&amp;A</h1>
              <span className="chat-status"><span /> Grounded</span>
            </div>
            <p>Ask questions and trace every answer back to its source.</p>
          </div>
        </div>

        <label className="chat-scope">
          <span>Search scope</span>
          <div className="chat-scope-select">
            <Database size={14} />
            <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
              <option value="">All contracts</option>
              {contracts.map(c => (
                <option key={c.id} value={c.filename}>{c.vendor} ({c.filename})</option>
              ))}
            </select>
          </div>
        </label>
      </header>

      <div className="chat-body">
        <div className="chat-thread">
          <div className="chat-thread-intro">
            <ShieldCheck size={17} />
            <span>Responses use only the contract text in your selected scope.</span>
          </div>

          {messages.map((msg, index) => (
            <article className={`chat-message ${msg.role === "user" ? "is-user" : "is-ai"}`} key={index}>
              <div className="chat-avatar" aria-hidden="true">
                {msg.role === "user" ? <User size={15} /> : <MessageSquare size={15} />}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-meta">{msg.role === "user" ? "You" : "ProcureSense"}</div>
                <div className="chat-bubble">
                  {msg.results && msg.results.length > 1 ? "Contract-by-contract findings" : msg.content}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="chat-sources">
                    <div className="chat-sources-heading">
                      <span>Evidence</span>
                      <span>{msg.sources.length} {msg.sources.length === 1 ? "source" : "sources"}</span>
                    </div>
                    {msg.sources.map((src, i) => (
                      <details className="chat-source" key={i}>
                        <summary>
                          <FileText size={14} />
                          <strong>{src.source_file}</strong>
                          <span>View excerpt</span>
                        </summary>
                        <div className="chat-source-text">{src.excerpt || src.text}</div>
                      </details>
                    ))}
                  </div>
                )}

                {msg.results && msg.results.length > 1 && (
                  <div className="chat-contract-results">
                    {msg.results.map((result) => (
                      <div className={`chat-contract-result ${result.status}`} key={result.source_file}>
                        <strong>{result.source_file}</strong>
                        <span>{result.status === "supported" ? result.answer : "Information not found on this contract."}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {isTyping && (
            <article className="chat-message is-ai">
              <div className="chat-avatar" aria-hidden="true"><MessageSquare size={15} /></div>
              <div className="chat-message-content">
                <div className="chat-message-meta">ProcureSense</div>
                <div className="chat-bubble chat-typing" aria-label="Preparing response">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="chat-composer">
        <div className="chat-suggestions" aria-label="Suggested questions">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} onClick={() => handleSend(suggestion)} disabled={isTyping} className="suggestion-chip">
              {suggestion}
            </button>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Ask about a clause, date, risk, or obligation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
            aria-label="Ask a contract question"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="chat-send-button"
            title="Send question"
            aria-label="Send question"
          >
            <Send size={17} />
          </button>
        </div>
        <p className="chat-input-hint">Press Enter to send <span>·</span> Shift + Enter for a new line</p>
      </footer>
    </section>
  );
}

export default ChatBot;