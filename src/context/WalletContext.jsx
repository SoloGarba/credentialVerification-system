/**
 * frontend/src/context/WalletContext.jsx
 * 
 * Global wallet state management
 */
import React, { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const wallet = useWallet();
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Hook to use wallet context
 */
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  
  return context;
};

export default WalletContext;
