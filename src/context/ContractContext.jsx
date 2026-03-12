/**
 * frontend/src/context/ContractContext.jsx
 * 
 * Global contract state and functions
 */

import React, { createContext, useContext } from 'react';
import { useContract } from '../hooks/useContract';

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const contract = useContract();

  return (
    <ContractContext.Provider value={contract}>
      {children}
    </ContractContext.Provider>
  );
};

/**
 * Hook to use contract context
 */
export const useContractContext = () => {
  const context = useContext(ContractContext);
  
  if (!context) {
    throw new Error('useContractContext must be used within ContractProvider');
  }
  
  return context;
};

export default ContractContext;