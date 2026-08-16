import ChatBot from "../components/ChatBot";

export default function ChatPage() {
  return (
    <div className="page" style={{ height: "calc(100vh - 80px)", paddingBottom: 0 }}>
      <div className="dashboard-header" style={{ marginBottom: "16px" }}>
        <h1>AI Assistant</h1>
      </div>
      <ChatBot />
    </div>
  );
}