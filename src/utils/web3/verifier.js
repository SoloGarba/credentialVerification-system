/**
 * frontend/src/utils/web3/verifier.js
 * 
 * Interact with Groth16Verifier smart contract
 * (Usually called through CredentialRegistry, but available for direct access)
 */

import { ethers } from 'ethers';
import Groth16VerifierABI from '../../contracts/abis/Groth16Verifier.json';
import { getVerifierAddress } from '../../contracts/addresses.js';

/**
 * Get Groth16Verifier contract instance
 * @param {Object} signerOrProvider - Ethers signer or provider
 * @returns {ethers.Contract} Contract instance
 */
export const getVerifierContract = (signerOrProvider) => {
  const address = getVerifierAddress();
  
  if (!address || address === ethers.ZeroAddress) {
    throw new Error('Verifier contract not deployed yet');
  }
  
  return new ethers.Contract(address, Groth16VerifierABI, signerOrProvider);
};

/**
 * Verify a ZK proof directly (without going through registry)
 * @param {Array} pA - Proof component A [x, y]
 * @param {Array} pB - Proof component B [[x1, x2], [y1, y2]]
 * @param {Array} pC - Proof component C [x, y]
 * @param {Array} pubSignals - Public signals [root]
 * @param {Object} provider - Ethers provider
 * @returns {Promise<boolean>} True if proof is valid
 */
export const verifyProof = async (pA, pB, pC, pubSignals, provider) => {
  try {
    const contract = getVerifierContract(provider);
    
    const isValid = await contract.verifyProof(pA, pB, pC, pubSignals);
    
    return isValid;
  } catch (error) {
    console.error('Verifier proof check error:', error);
    throw new Error(`Failed to verify proof: ${error.message}`);
  }
};

/**
 * Verify proof and get detailed result
 * @param {Array} pA - Proof component A
 * @param {Array} pB - Proof component B
 * @param {Array} pC - Proof component C
 * @param {Array} pubSignals - Public signals
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Detailed verification result
 */
export const verifyProofWithDetails = async (pA, pB, pC, pubSignals, provider) => {
  const startTime = Date.now();
  
  try {
    const isValid = await verifyProof(pA, pB, pC, pubSignals, provider);
    const verificationTime = Date.now() - startTime;
    
    return {
      success: true,
      isValid,
      verificationTime,
      publicSignals: pubSignals,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      isValid: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check if verifier contract is deployed and accessible
 * @param {Object} provider - Ethers provider
 * @returns {Promise<boolean>} True if accessible
 */
export const isVerifierDeployed = async (provider) => {
  try {
    const address = getVerifierAddress();
    
    if (!address || address === ethers.ZeroAddress) {
      return false;
    }
    
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch (error) {
    console.error('Check verifier deployment error:', error);
    return false;
  }
};

/**
 * Get verifier contract address
 * @returns {string} Verifier address
 */
export const getVerifierAddressFromConfig = () => {
  return getVerifierAddress();
};

/**
 * Estimate gas for proof verification
 * @param {Array} pA - Proof component A
 * @param {Array} pB - Proof component B
 * @param {Array} pC - Proof component C
 * @param {Array} pubSignals - Public signals
 * @param {Object} provider - Ethers provider
 * @returns {Promise<string>} Estimated gas
 */
export const estimateVerificationGas = async (pA, pB, pC, pubSignals, provider) => {
  try {
    const contract = getVerifierContract(provider);
    const gasEstimate = await contract.estimateGas.verifyProof(pA, pB, pC, pubSignals);
    return gasEstimate.toString();
  } catch (error) {
    console.error('Gas estimation error:', error);
    return '250000'; // Fallback estimate for Groth16
  }
};

/**
 * Test verifier with a dummy proof (for debugging)
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Test result
 */
export const testVerifier = async (provider) => {
  // Dummy proof values (will fail verification but tests contract call)
  const dummyProof = {
    pA: ["1", "2"],
    pB: [["1", "2"], ["1", "2"]],
    pC: ["1", "2"],
    pubSignals: ["1"]
  };
  
  try {
    const isValid = await verifyProof(
      dummyProof.pA,
      dummyProof.pB,
      dummyProof.pC,
      dummyProof.pubSignals,
      provider
    );
    
    return {
      success: true,
      contractAccessible: true,
      dummyProofResult: isValid, // Should be false
      message: 'Verifier contract is accessible'
    };
  } catch (error) {
    return {
      success: false,
      contractAccessible: false,
      error: error.message,
      message: 'Verifier contract not accessible'
    };
  }
};