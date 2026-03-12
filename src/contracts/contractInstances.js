/**
 * frontend/src/contracts/contractInstances.js
 * 
 * Helper functions to get contract instances with proper provider/signer
 */

import { ethers } from 'ethers';
import CredentialRegistryJSON from './abis/CredentialRegistry.json';
import Groth16VerifierJSON from './abis/Groth16Verifier.json';
import CredentialVerifierWrapperJSON from './abis/CredentialVerifierwrapper.json';
import { getRegistryAddress, getVerifierAddress, getWrapperAddress } from './addresses.js';

// Extract ABIs from JSON (handles both old and new format)
const CredentialRegistryABI = CredentialRegistryJSON.abi || CredentialRegistryJSON;
const Groth16VerifierABI = Groth16VerifierJSON.abi || Groth16VerifierJSON;
const CredentialVerifierWrapperABI = CredentialVerifierWrapperJSON.abi || CredentialVerifierWrapperJSON;

/**
 * Get CredentialRegistry contract instance
 * @param {Object} signerOrProvider - Ethers signer or provider
 * @returns {ethers.Contract}
 */
export const getRegistryContract = (signerOrProvider) => {
  console.log('=== getRegistryContract ===');
  console.log('signerOrProvider:', signerOrProvider);
  
  const address = getRegistryAddress();
  console.log('Got registry address:', address);
  console.log('ABI exists:', CredentialRegistryABI ? 'YES' : 'NO');
  console.log('ABI length:', CredentialRegistryABI?.length);
  
  const contract = new ethers.Contract(address, CredentialRegistryABI, signerOrProvider);
  console.log('Contract created, target:', contract.target);
  
  
  return contract;
};

/**
 * Get Groth16Verifier contract instance
 * @param {Object} signerOrProvider - Ethers signer or provider
 * @returns {ethers.Contract}
 */
export const getVerifierContract = (signerOrProvider) => {
  const address = getVerifierAddress();
  return new ethers.Contract(address, Groth16VerifierABI, signerOrProvider);
};

/**
 * Get CredentialVerifierWrapper contract instance
 * @param {Object} signerOrProvider - Ethers signer or provider
 * @returns {ethers.Contract}
 */
export const getWrapperContract = (signerOrProvider) => {
  const address = getWrapperAddress();
  return new ethers.Contract(address, CredentialVerifierWrapperABI, signerOrProvider);
};

/**
 * Get all contract instances at once
 * @param {Object} signerOrProvider - Ethers signer or provider
 * @returns {Object} All contract instances
 */
export const getAllContracts = (signerOrProvider) => {
  return {
    registry: getRegistryContract(signerOrProvider),
    verifier: getVerifierContract(signerOrProvider),
    wrapper: getWrapperContract(signerOrProvider)
  };
};
