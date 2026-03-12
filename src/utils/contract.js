/**
 * Contract utility - provides readonly contract instance and wallet functions
 */
import { ethers } from 'ethers';
import { getRegistryContract } from './web3/registry';

/**
 * Get a readonly contract instance using a public RPC provider
 * @returns {ethers.Contract} Readonly contract instance
 */
export const getReadonlyContract = () => {
  const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/7bb6cf1eaef94cd5ba2896727c4a250f');
  return getRegistryContract(provider);
};

/**
 * Connect to MetaMask wallet
 * @returns {Promise<Object>} Connection details
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    const address = accounts[0];
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Get contract instance with signer
    const contract = getRegistryContract(signer);
    
    return { address, contract, signer, provider };
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
};

/**
 * Disconnect wallet (clears local state, doesn't disconnect MetaMask)
 * @returns {Promise<void>}
 */
export const disconnectWallet = async () => {
  // Note: Can't actually disconnect MetaMask programmatically
  // This just clears local state
  return Promise.resolve();
};
