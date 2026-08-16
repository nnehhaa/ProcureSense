import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "Summarize this contract",
  "Identify risky clauses",
  "Show payment terms",
  "Find termination conditions",
  "Explain compliance issues"
];

function ChatBot() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm your AI Contract Assistant. How can I help you analyze your procurement contract today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "ai", content: data.answer }]);
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
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <motion.div 
            key={index} 
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-avatar">
              {msg.role === "user" ? <User size={18} /> : <Sparkles size={18} color="var(--color-accent-secondary)"/>}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="message ai">
            <div className="message-avatar">
              <Sparkles size={18} color="var(--color-accent-secondary)"/>
            </div>
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-suggestions">
          {SUGGESTIONS.map((suggestion, index) => (
            <button 
              key={index} 
              className="suggestion-chip"
              onClick={() => handleSend(suggestion)}
              disabled={isTyping}
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <div className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about the contract..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            className="chat-submit" 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;