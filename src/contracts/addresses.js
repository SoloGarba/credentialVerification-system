/**
 * frontend/src/contracts/addresses.js
 * 
 * Smart contract addresses for different networks
 * UPDATE THESE AFTER DEPLOYMENT!
 */

// Contract addresses by network
const addresses = {
  // Local development (Hardhat/Ganache)
  localhost: {
    CredentialRegistry: '0xF555414ACDc564Fff77b98bE0B31A22a4eE4dBC7',
    Groth16Verifier: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    CredentialVerifierWrapper: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
  },
  
  // Sepolia testnet
  sepolia: {
    CredentialRegistry: '0x02681089489068e37F588aABF899554A0bb9F62f',
    Groth16Verifier: '0xd9bADcC6dB0bA29853950E810E2233f858Eae6Ea',    // UPDATE AFTER DEPLOYMENT
    CredentialVerifierWrapper: '0x903A1CaE4DceB587e373E6fD74f84AC7E7917Edd' // UPDATE AFTER DEPLOYMENT
  },
  
  // Goerli testnet (deprecated but included for reference)
  goerli: {
    CredentialRegistry: '0x0000000000000000000000000000000000000000',
    Groth16Verifier: '0x0000000000000000000000000000000000000000',
    CredentialVerifierWrapper: '0x0000000000000000000000000000000000000000'
  },
  
  // Ethereum mainnet (for future production)
  mainnet: {
    CredentialRegistry: '0x0000000000000000000000000000000000000000',
    Groth16Verifier: '0x0000000000000000000000000000000000000000',
    CredentialVerifierWrapper: '0x0000000000000000000000000000000000000000'
  },
  
  // Polygon Mumbai testnet
  mumbai: {
    CredentialRegistry: '0x0000000000000000000000000000000000000000',
    Groth16Verifier: '0x0000000000000000000000000000000000000000',
    CredentialVerifierWrapper: '0x0000000000000000000000000000000000000000'
  },
  
  // Polygon mainnet
  polygon: {
    CredentialRegistry: '0x0000000000000000000000000000000000000000',
    Groth16Verifier: '0x0000000000000000000000000000000000000000',
    CredentialVerifierWrapper: '0x0000000000000000000000000000000000000000'
  }
};

// Network IDs
const networkIds = {
  localhost: 31337,
  sepolia: 11155111,
  goerli: 5,
  mainnet: 1,
  mumbai: 80001,
  polygon: 137
};

/**
 * Get network name from chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Network name
 */
export const getNetworkName = (chainId) => {
  const networks = {
    31337: 'localhost',
    11155111: 'sepolia',
    5: 'goerli',
    1: 'mainnet',
    80001: 'mumbai',
    137: 'polygon'
  };
  
  return networks[chainId] || 'unknown';
};

/**
 * Get current network from window.ethereum
 * @returns {Promise<string>} Network name
 */
export const getCurrentNetwork = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  const chainIdNum = parseInt(chainId, 16);
  
  return getNetworkName(chainIdNum);
};

/**
 * Get CredentialRegistry address for current network
 * @param {string} network - Network name (optional, auto-detects if not provided)
 * @returns {string} Contract address
 */
export const getRegistryAddress = (network) => {
  const net = network || process.env.REACT_APP_NETWORK || 'localhost';

   console.log('=== getRegistryAddress called ===');
  console.log('Network parameter:', network);
  console.log('process.env.REACT_APP_NETWORK:', process.env.REACT_APP_NETWORK);
  console.log('Final network:', net);
  console.log('Returning address:', addresses[net]?.CredentialRegistry);
  
  if (!addresses[net]) {
    throw new Error(`Unsupported network: ${net}`);
  }
  
  return addresses[net].CredentialRegistry;
};

/**
 * Get Groth16Verifier address for current network
 * @param {string} network - Network name
 * @returns {string} Contract address
 */
export const getVerifierAddress = (network) => {
  const net = network || process.env.REACT_APP_NETWORK || 'localhost';
  
  if (!addresses[net]) {
    throw new Error(`Unsupported network: ${net}`);
  }
  
  return addresses[net].Groth16Verifier;
};

/**
 * Get CredentialVerifierWrapper address for current network
 * @param {string} network - Network name
 * @returns {string} Contract address
 */
export const getWrapperAddress = (network) => {
  const net = network || process.env.REACT_APP_NETWORK || 'localhost';
  
  if (!addresses[net]) {
    throw new Error(`Unsupported network: ${net}`);
  }
  
  return addresses[net].CredentialVerifierWrapper;
};

/**
 * Get all contract addresses for a network
 * @param {string} network - Network name
 * @returns {Object} All contract addresses
 */
export const getAllAddresses = (network) => {
  const net = network || process.env.REACT_APP_NETWORK || 'localhost';
  
  if (!addresses[net]) {
    throw new Error(`Unsupported network: ${net}`);
  }
  
  return addresses[net];
};

/**
 * Check if contracts are deployed on current network
 * @param {string} network - Network name
 * @returns {boolean} True if deployed
 */
export const areContractsDeployed = (network) => {
  const net = network || process.env.REACT_APP_NETWORK || 'localhost';
  
  if (!addresses[net]) {
    return false;
  }
  
  const addrs = addresses[net];
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  
  return (
    addrs.CredentialRegistry !== zeroAddress &&
    addrs.Groth16Verifier !== zeroAddress
  );
};

/**
 * Update contract addresses (for admin use after deployment)
 * @param {string} network - Network name
 * @param {Object} newAddresses - New addresses
 */
export const updateAddresses = (network, newAddresses) => {
  if (!addresses[network]) {
    console.warn(`Network ${network} not found in addresses config`);
    return;
  }
  
  addresses[network] = {
    ...addresses[network],
    ...newAddresses
  };
  
  console.log(`Updated addresses for ${network}:`, addresses[network]);
};

/**
 * Get block explorer URL for a network
 * @param {string} network - Network name
 * @param {string} address - Contract address
 * @returns {string} Block explorer URL
 */
export const getExplorerUrl = (network, address) => {
  const explorers = {
    localhost: null,
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    goerli: `https://goerli.etherscan.io/address/${address}`,
    mainnet: `https://etherscan.io/address/${address}`,
    mumbai: `https://mumbai.polygonscan.com/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`
  };
  
  return explorers[network] || null;
};

// Export addresses for direct access if needed
export { addresses, networkIds };