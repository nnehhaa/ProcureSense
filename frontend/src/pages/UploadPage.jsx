import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UploadCloud, FileType, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, uploading, extracting, analyzing, done, error
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setErrorMsg("Please upload a PDF or DOCX file.");
      setStatus("error");
      return;
    }
    setFile(selectedFile);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    
    // Simulate steps for UI progression since backend does it all in one go
    setTimeout(() => { if(status !== "error") setStatus("extracting"); }, 2000);
    setTimeout(() => { if(status !== "error") setStatus("analyzing"); }, 5000);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await res.json();
      setStatus("done");
      setTimeout(() => {
        navigate(`/contracts/${data.id}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during processing.");
      setStatus("error");
    }
  };

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: "16px", fontSize: "2.5rem" }}>Upload Contract</h1>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "48px", fontSize: "1.1rem" }}>
        Securely upload procurement contracts (PDF/DOCX) for AI analysis.
      </p>

      {status === "idle" || status === "error" ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="upload-box"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={{ cursor: "pointer", padding: "60px 20px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "16px", backgroundColor: "var(--color-bg-secondary)", transition: "all 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-accent-secondary)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.docx" 
            style={{ display: "none" }} 
          />
          
          <UploadCloud size={64} color="var(--color-accent-secondary)" style={{ margin: "0 auto 24px" }} />
          
          {file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                <FileType size={20} color="var(--color-text-secondary)" />
                <span style={{ fontWeight: "500" }}>{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                className="hero-button"
                style={{ marginTop: "16px" }}
              >
                Start Analysis
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Drag & Drop your file here</h2>
              <p style={{ color: "var(--color-text-tertiary)" }}>or click to browse from your computer</p>
              <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "12px" }}>
                <span className="badge">PDF</span>
                <span className="badge">DOCX</span>
                <span className="badge">Scanned PDFs (OCR)</span>
              </div>
            </>
          )}

          {status === "error" && (
            <div style={{ marginTop: "24px", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ padding: "48px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Processing Contract</h2>
            <p style={{ color: "var(--color-text-secondary)" }}>{file.name}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "400px", margin: "0 auto", textAlign: "left" }}>
            
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", opacity: 1 }}>
              {status === "uploading" ? <Loader2 size={24} className="spin" color="var(--color-accent-secondary)" /> : <CheckCircle size={24} color="#10b981" />}
              <span style={{ fontSize: "1.1rem", fontWeight: status === "uploading" ? "600" : "400", color: status === "uploading" ? "white" : "var(--color-text-secondary)" }}>
                Uploading document...
              </span>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", opacity: status === "uploading" ? 0.4 : 1 }}>
              {status === "uploading" ? <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} /> : 
               status === "extracting" ? <Loader2 size={24} className="spin" color="var(--color-accent-secondary)" /> : <CheckCircle size={24} color="#10b981" />}
              <span style={{ fontSize: "1.1rem", fontWeight: status === "extracting" ? "600" : "400", color: status === "extracting" ? "white" : "var(--color-text-secondary)" }}>
                Extracting metadata & clauses...
              </span>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", opacity: (status === "uploading" || status === "extracting") ? 0.4 : 1 }}>
              {(status === "uploading" || status === "extracting") ? <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} /> : 
               status === "analyzing" ? <Loader2 size={24} className="spin" color="var(--color-accent-secondary)" /> : <CheckCircle size={24} color="#10b981" />}
              <span style={{ fontSize: "1.1rem", fontWeight: status === "analyzing" ? "600" : "400", color: status === "analyzing" ? "white" : "var(--color-text-secondary)" }}>
                Computing risk score & generating embeddings...
              </span>
            </div>

            {/* Done */}
            <AnimatePresence>
              {status === "done" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", padding: "16px", backgroundColor: "rgba(16,185,129,0.1)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  <CheckCircle size={24} color="#10b981" />
                  <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#10b981" }}>
                    Analysis Complete! Redirecting...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </div>
  );
}
