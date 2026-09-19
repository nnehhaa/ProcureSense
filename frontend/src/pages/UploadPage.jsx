import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UploadCloud, FileText, CheckCircle, Loader2, AlertCircle, X, Plus } from "lucide-react";

const STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  DONE: "done",
  ERROR: "error",
};

function FileRow({ name, status, error, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 16px", borderRadius: "8px",
      backgroundColor: "var(--color-bg-primary)",
      border: status === STATUS.ERROR
        ? "1px solid rgba(220, 38, 38, 0.3)"
        : status === STATUS.DONE
          ? "1px solid rgba(22, 163, 74, 0.3)"
          : "var(--border-subtle)",
    }}>
      <FileText size={16} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--color-text-primary)", wordBreak: "break-all" }}>{name}</span>

      {status === STATUS.IDLE && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center" }}
        >
          <X size={14} />
        </button>
      )}
      {status === STATUS.UPLOADING && (
        <Loader2 size={16} color="var(--color-accent-secondary)" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      )}
      {status === STATUS.DONE && (
        <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
      )}
      {status === STATUS.ERROR && (
        <span style={{ fontSize: "0.78rem", color: "var(--color-danger)", maxWidth: "200px", textAlign: "right" }}>{error}</span>
      )}
    </div>
  );
}

export default function UploadPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState([]); // [{ file, status, error, resultId }]
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const addFiles = useCallback((newFiles) => {
    const allowed = Array.from(newFiles).filter(f => {
      const ext = f.name.split(".").pop().toLowerCase();
      return ext === "pdf" || ext === "docx";
    });
    const rejected = newFiles.length - allowed.length;

    if (rejected > 0) {
      setGlobalError(`${rejected} file(s) rejected. Only PDF and DOCX are supported.`);
    } else {
      setGlobalError("");
    }

    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.file.name));
      const deduped = allowed.filter(f => !existingNames.has(f.name));
      return [...prev, ...deduped.map(f => ({ file: f, status: STATUS.IDLE, error: "", resultId: null }))];
    });
  }, []);

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (uploading) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (entry, index) => {
    const formData = new FormData();
    formData.append("file", entry.file);

    setFiles(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status: STATUS.UPLOADING, error: "" };
      return next;
    });

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      if (!data.id) {
        throw new Error("No contract ID returned from server.");
      }

      setFiles(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: STATUS.DONE, resultId: data.id };
        return next;
      });

      return data.id;
    } catch (err) {
      setFiles(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: STATUS.ERROR, error: err.message || "Upload failed" };
        return next;
      });
      return null;
    }
  };

  const handleUploadAll = async () => {
    const pending = files.filter(f => f.status === STATUS.IDLE);
    if (!pending.length) return;

    setUploading(true);
    setGlobalError("");

    let lastSuccessId = null;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== STATUS.IDLE) continue;
      const id = await uploadFile(files[i], i);
      if (id) lastSuccessId = id;
    }

    setUploading(false);

    // If only one file, navigate to it. If multiple, go to library.
    const pendingCount = pending.length;
    setTimeout(() => {
      if (pendingCount === 1 && lastSuccessId) {
        navigate(`/contracts/${lastSuccessId}`);
      } else if (lastSuccessId) {
        navigate("/contracts");
      }
    }, 1200);
  };

  const pendingCount = files.filter(f => f.status === STATUS.IDLE).length;
  const doneCount = files.filter(f => f.status === STATUS.DONE).length;
  const hasFiles = files.length > 0;

  return (
    <div className="page" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "600", letterSpacing: "-0.02em", marginBottom: "6px" }}>Upload Contracts</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Upload one or more procurement contracts (PDF or DOCX) for automated analysis.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className="upload-box"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current.click()}
        style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          multiple
          style={{ display: "none" }}
        />

        <UploadCloud size={44} color="var(--color-accent-secondary)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "1.1rem", fontWeight: "500", marginBottom: "4px" }}>
          {hasFiles ? "Add more files" : "Drop files here"}
        </h2>
        <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.88rem" }}>or click to browse</p>
        <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "8px" }}>
          <span className="badge">PDF</span>
          <span className="badge">DOCX</span>
          <span className="badge">Scanned PDF (OCR)</span>
        </div>
      </div>

      {globalError && (
        <div style={{ marginTop: "12px", color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "7px", fontSize: "0.88rem" }}>
          <AlertCircle size={14} /> {globalError}
        </div>
      )}

      {/* File list */}
      {hasFiles && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)" }}>
              {files.length} file{files.length !== 1 ? "s" : ""} selected
              {doneCount > 0 && ` · ${doneCount} uploaded`}
            </span>
            {!uploading && (
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-accent-secondary)", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "5px"
                }}
              >
                <Plus size={14} /> Add more
              </button>
            )}
          </div>

          {files.map((entry, i) => (
            <FileRow
              key={`${entry.file.name}-${i}`}
              name={entry.file.name}
              status={entry.status}
              error={entry.error}
              onRemove={() => removeFile(i)}
            />
          ))}

          {pendingCount > 0 && (
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className="hero-button"
              style={{ marginTop: "12px", width: "100%", padding: "11px" }}
            >
              {uploading
                ? "Uploading..."
                : `Analyse ${pendingCount} Contract${pendingCount !== 1 ? "s" : ""}`}
            </button>
          )}

          {doneCount > 0 && pendingCount === 0 && !uploading && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginTop: "8px",
              padding: "14px", backgroundColor: "rgba(22,163,74,0.08)",
              borderRadius: "8px", border: "1px solid rgba(22,163,74,0.25)"
            }}>
              <CheckCircle size={20} color="var(--color-success)" />
              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-success)" }}>
                {doneCount === 1 ? "Analysis complete — redirecting..." : `${doneCount} contracts uploaded — redirecting to library...`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
