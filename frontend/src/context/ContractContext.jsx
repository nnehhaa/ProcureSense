import { createContext, useState, useEffect } from "react";

export const ContractContext = createContext();

export function ContractProvider({ children }) {
  // Initialize from localStorage so data survives page refreshes
  const [contract, setContractState] = useState(() => {
    try {
      const saved = localStorage.getItem("procuresense_contract");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Whenever contract changes, persist it
  const setContract = (data) => {
    setContractState(data);
    if (data) {
      localStorage.setItem("procuresense_contract", JSON.stringify(data));
    } else {
      localStorage.removeItem("procuresense_contract");
    }
  };

  return (
    <ContractContext.Provider value={{ contract, setContract }}>
      {children}
    </ContractContext.Provider>
  );
}