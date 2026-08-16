import { useContext } from "react";
import { Link } from "react-router-dom";

import {
  ContractContext,
} from "../context/ContractContext";

export default function DashboardPage() {
  const { contract } =
    useContext(
      ContractContext
    );

    if (!contract) {
        return (
        <div className="page">
            <h1>No contract found</h1>
            <Link
            to="/"
            className="hero-button"
            >
                Upload a Contract
                </Link>
                </div>
                )
            }



  return (
    <div className="hero">
      <h1>
        Contract Dashboard
      </h1>

      <div className="feature-grid">
        <div className="feature-card">
          <h3>Risk</h3>

          <p>
            {contract.risk}
          </p>
        </div>

        <div className="feature-card">
          <h3>Score</h3>

          <p>
            {contract.score}/100
          </p>
        </div>

        <div className="feature-card">
          <h3>Vendor</h3>

          <p>
            {contract.vendor}
          </p>
        </div>

        <div className="feature-card">
          <h3>SLA</h3>

          <p>
            {contract.sla}
          </p>
        </div>
      </div>
    </div>
  );
}