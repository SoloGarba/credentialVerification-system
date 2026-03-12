/**
 * frontend/src/hooks/useWallet.js
 * 
 * React hook for wallet connection and management
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Connect to MetaMask
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to use this app.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      });
      const chainIdNum = parseInt(chainIdHex, 16);

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setAccount(accounts[0]);
      setChainId(chainIdNum);
      setProvider(web3Provider);
      setSigner(web3Signer);

      // Store connection state
      if (typeof window !== 'undefined') {
  localStorage.setItem('walletConnected', 'true');
}

    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    if (typeof window !== 'undefined') {
  localStorage.removeItem('walletConnected');
}
  }, []);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        setError('Please add this network to MetaMask first');
      } else {
        setError(err.message);
      }
    }
  }, []);

  /**
   * Get balance
   */
  const getBalance = useCallback(async () => {
    if (!provider || !account) return null;

    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Get balance error:', err);
      return null;
    }
  }, [provider, account]);

  /**
   * Handle account changes
   */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnect();
      } else {
        // User switched account
        setAccount(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [disconnect]);

  /**
   * Handle chain changes
   */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainIdHex) => {
      const chainIdNum = parseInt(chainIdHex, 16);
      setChainId(chainIdNum);
      // Reload page on network change (recommended by MetaMask)
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  /**
   * Auto-connect if previously connected
   */
 /**
 * Auto-connect if previously connected
 */
useEffect(() => {
  const autoConnect = async () => {
    if (!window.ethereum) return;
    
    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        console.log('Auto-connecting to existing wallet connection...');
        await connect();
      }
    } catch (error) {
      console.error('Auto-connect error:', error);
    }
  };
  
  autoConnect();
}, []); // Run once on mount
  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error,
    isConnected: !!account,
    connect,
    disconnect,
    switchNetwork,
    getBalance
  };
};
