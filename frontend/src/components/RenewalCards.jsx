import { useContext } from "react";
import { ContractContext } from "../context/ContractContext";

function RenewalCards() {
  const { contract } = useContext(ContractContext);

  if (!contract) {
    return (
      <div className="result-card">
        <p>No contracts have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="result-card">
      <h3>Renewal Alert</h3>

      <p>
        <strong>Vendor:</strong> {contract.vendor}
      </p>

      <p>
        <strong>Renewal Date:</strong>{" "}
        {contract.renewal_date}
      </p>

      <p>
        <strong>Notice Period:</strong>{" "}
        {contract.notice_period}
      </p>

      <p>
        <strong>Auto Renewal:</strong>{" "}
        {contract.auto_renewal}
      </p>
    </div>
  );
}

export default RenewalCards;