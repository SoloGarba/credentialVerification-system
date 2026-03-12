/**
 * frontend/src/utils/zkp/proofValidator.js
 * 
 * Validate ZK proofs locally before submitting on-chain
 * (Optional - saves gas by catching invalid proofs early)
 */

import * as snarkjs from 'snarkjs';

// Path to verification key (served from public folder)
const VKEY_PATH = '/zkp/verification_key.json';

let cachedVKey = null;

/**
 * Load verification key
 * @returns {Promise<Object>} Verification key
 */
const loadVerificationKey = async () => {
  if (cachedVKey) {
    return cachedVKey;
  }
  
  try {
    const response = await fetch(VKEY_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load verification key: ${response.status}`);
    }
    
    cachedVKey = await response.json();
    return cachedVKey;
  } catch (error) {
    console.error('Load verification key error:', error);
    throw new Error(`Cannot load verification key: ${error.message}`);
  }
};

/**
 * Verify a proof locally (before submitting on-chain)
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Promise<boolean>} True if valid
 */
export const verifyProofLocally = async (proof, publicSignals) => {
  try {
    const vKey = await loadVerificationKey();
    
    const isValid = await snarkjs.groth16.verify(
      vKey,
      publicSignals,
      proof
    );
    
    return isValid;
  } catch (error) {
    console.error('Local verification error:', error);
    throw new Error(`Proof verification failed: ${error.message}`);
  }
};

/**
 * Verify proof with detailed result
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Promise<Object>} Detailed verification result
 */
export const verifyProofWithDetails = async (proof, publicSignals) => {
  const startTime = Date.now();
  
  try {
    const isValid = await verifyProofLocally(proof, publicSignals);
    const verificationTime = Date.now() - startTime;
    
    return {
      isValid,
      verificationTime,
      publicSignals,
      timestamp: new Date().toISOString(),
      message: isValid ? 'Proof is valid' : 'Proof is invalid'
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Verification failed'
    };
  }
};

/**
 * Batch verify multiple proofs
 * 
 * @param {Array<Object>} proofs - Array of {proof, publicSignals}
 * @returns {Promise<Array>} Verification results
 */
export const batchVerifyProofs = async (proofs) => {
  const results = [];
  
  for (const item of proofs) {
    try {
      const isValid = await verifyProofLocally(item.proof, item.publicSignals);
      results.push({ ...item, isValid, error: null });
    } catch (error) {
      results.push({ ...item, isValid: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * Check if verification key is available
 * @returns {Promise<boolean>} True if available
 */
export const isVerificationKeyAvailable = async () => {
  try {
    await loadVerificationKey();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Preload verification key (call on app init)
 * @returns {Promise<void>}
 */
export const preloadVerificationKey = async () => {
  try {
    console.log('Preloading verification key...');
    await loadVerificationKey();
    console.log('Verification key preloaded');
  } catch (error) {
    console.warn('Failed to preload verification key:', error);
  }
};

/**
 * Validate proof structure before verification
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Object} Validation result
 */
export const validateProofBeforeVerification = (proof, publicSignals) => {
  const errors = [];
  
  // Check proof structure
  if (!proof) {
    errors.push('Proof is null or undefined');
  } else {
    if (!proof.pi_a || !Array.isArray(proof.pi_a) || proof.pi_a.length !== 3) {
      errors.push('Invalid pi_a structure');
    }
    if (!proof.pi_b || !Array.isArray(proof.pi_b) || proof.pi_b.length !== 3) {
      errors.push('Invalid pi_b structure');
    }
    if (!proof.pi_c || !Array.isArray(proof.pi_c) || proof.pi_c.length !== 3) {
      errors.push('Invalid pi_c structure');
    }
  }
  
  // Check public signals
  if (!publicSignals || !Array.isArray(publicSignals)) {
    errors.push('Public signals must be an array');
  } else if (publicSignals.length === 0) {
    errors.push('Public signals array is empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Verify proof matches expected root
 * 
 * @param {Array} publicSignals - Public signals
 * @param {string} expectedRoot - Expected Merkle root
 * @returns {boolean} True if matches
 */
export const verifyProofRoot = (publicSignals, expectedRoot) => {
  if (!publicSignals || publicSignals.length === 0) {
    return false;
  }
  
  const proofRoot = String(publicSignals[0]);
  const expected = String(expectedRoot);
  
  return proofRoot === expected;
};

/**
 * Complete proof validation workflow
 * (Structure + Local verification + Root check)
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @param {string} expectedRoot - Expected root
 * @returns {Promise<Object>} Complete validation result
 */
export const completeProofValidation = async (proof, publicSignals, expectedRoot) => {
  const result = {
    structureValid: false,
    proofValid: false,
    rootMatches: false,
    errors: [],
    warnings: []
  };
  
  // Step 1: Structure validation
  const structureCheck = validateProofBeforeVerification(proof, publicSignals);
  result.structureValid = structureCheck.isValid;
  
  if (!structureCheck.isValid) {
    result.errors.push(...structureCheck.errors);
    return result;
  }
  
  // Step 2: Root check
  result.rootMatches = verifyProofRoot(publicSignals, expectedRoot);
  
  if (!result.rootMatches) {
    result.warnings.push('Proof root does not match expected root');
  }
  
  // Step 3: Local cryptographic verification
  try {
    result.proofValid = await verifyProofLocally(proof, publicSignals);
    
    if (!result.proofValid) {
      result.errors.push('Cryptographic verification failed');
    }
  } catch (error) {
    result.errors.push(`Verification error: ${error.message}`);
  }
  
  // Overall result
  result.isValid = result.structureValid && result.proofValid && result.rootMatches;
  
  return result;
};

/**
 * Estimate gas savings from local validation
 * @returns {Object} Gas savings estimate
 */
export const estimateGasSavings = () => {
  return {
    onChainVerificationGas: 300000,
    invalidProofGas: 300000, // Full gas cost even if invalid
    localVerificationTime: '~100ms',
    message: 'Local verification prevents wasting ~$15-45 on invalid proofs'
  };
};