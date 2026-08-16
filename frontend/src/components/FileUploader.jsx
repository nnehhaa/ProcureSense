import { useState, useContext, useEffect, useRef } from "react";
import { ContractContext } from "../context/ContractContext";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loadingStages = [
  "Extracting clauses...",
  "Identifying risks...",
  "Running AI analysis...",
  "Generating recommendations..."
];

function FileUploader() {
  const { setContract } = useContext(ContractContext);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setContract(data);
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Upload failed", error);
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      {/* Hidden file input triggered by clicking the box */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={uploadFile}
        style={{ display: "none" }}
      />

      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            key="upload-box"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="upload-box"
            onClick={handleBoxClick}
            style={{ cursor: "pointer" }}
          >
            <UploadCloud size={52} className="upload-icon" />
            <h2 style={{ marginBottom: "4px" }}>Upload Procurement Contract</h2>
            <p className="upload-subtext">Click anywhere here to browse for a PDF</p>
            <p className="upload-subtext" style={{ fontSize: "0.8rem", marginTop: "4px" }}>
              Supported format: PDF
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="processing-state"
          >
            <Loader2 size={48} className="spinner" />
            <motion.p
              key={stageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="processing-text"
            >
              {loadingStages[stageIndex]}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FileUploader;