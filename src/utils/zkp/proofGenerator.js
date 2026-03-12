/**
 * frontend/src/utils/zkp/proofGenerator.js
 * 
 * Generate zero-knowledge proofs in the browser
 */

import * as snarkjs from 'snarkjs';

// Paths to circuit artifacts (served from public folder)
const WASM_PATH = '/zkp/credential.wasm';
const ZKEY_PATH = '/zkp/credential_final.zkey';

/**
 * Generate a ZK proof for a credential
 * 
 * @param {Object} credentialData - Credential information
 * @param {Object} merklePath - Merkle proof path
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Proof and public signals
 */
export const generateProof = async (credentialData, merklePath, onProgress) => {
  try {
    // Prepare circuit inputs
    const input = {
      student: credentialData.student,
      cidHash: credentialData.cidHash,
      metadataHash: credentialData.metadataHash,
      credentialId: credentialData.credentialId,
      pathElements: merklePath.pathElements,
      pathIndex: merklePath.pathIndex,
      root: merklePath.root
    };
    
    if (onProgress) onProgress({ stage: 'preparing', progress: 0 });
    
    // Generate the proof
    // This takes 10-30 seconds in the browser!
    if (onProgress) onProgress({ stage: 'generating', progress: 20 });
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );
    
    if (onProgress) onProgress({ stage: 'complete', progress: 100 });
    
    return {
      proof,
      publicSignals,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Proof generation error:', error);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
};

/**
 * Generate proof with custom paths (for testing or advanced use)
 * 
 * @param {Object} input - Circuit inputs
 * @param {string} wasmPath - Path to WASM file
 * @param {string} zkeyPath - Path to ZKEY file
 * @returns {Promise<Object>} Proof and public signals
 */
export const generateProofCustom = async (input, wasmPath, zkeyPath) => {
  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );
    
    return { proof, publicSignals };
  } catch (error) {
    console.error('Custom proof generation error:', error);
    throw new Error(`Failed to generate custom proof: ${error.message}`);
  }
};

/**
 * Estimate proof generation time based on browser capabilities
 * @returns {Object} Time estimate
 */
export const estimateProofTime = () => {
  // Rough estimates based on typical browser performance
  const cores = navigator.hardwareConcurrency || 2;
  
  let estimate;
  if (cores >= 8) {
    estimate = { min: 10, max: 20, unit: 'seconds' };
  } else if (cores >= 4) {
    estimate = { min: 15, max: 30, unit: 'seconds' };
  } else {
    estimate = { min: 30, max: 60, unit: 'seconds' };
  }
  
  return {
    ...estimate,
    cores,
    message: `Estimated time: ${estimate.min}-${estimate.max} ${estimate.unit}`
  };
};

/**
 * Check if circuit artifacts are accessible
 * @returns {Promise<boolean>} True if artifacts exist
 */
export const checkCircuitArtifacts = async () => {
  try {
    const wasmCheck = await fetch(WASM_PATH, { method: 'HEAD' });
    const zkeyCheck = await fetch(ZKEY_PATH, { method: 'HEAD' });
    
    return wasmCheck.ok && zkeyCheck.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Preload circuit artifacts (call on app init for better UX)
 * @returns {Promise<void>}
 */
export const preloadCircuitArtifacts = async () => {
  try {
    console.log('Preloading circuit artifacts...');
    
    // Fetch both files to cache them
    await Promise.all([
      fetch(WASM_PATH),
      fetch(ZKEY_PATH)
    ]);
    
    console.log('Circuit artifacts preloaded');
  } catch (error) {
    console.warn('Failed to preload circuit artifacts:', error);
  }
};

/**
 * Generate proof with progress tracking (enhanced version)
 * 
 * @param {Object} credentialData - Credential data
 * @param {Object} merklePath - Merkle path
 * @returns {Promise<Object>} Proof with metadata
 */
export const generateProofWithTracking = async (credentialData, merklePath) => {
  const startTime = Date.now();
  
  let progressCallback = null;
  const progress = {
    current: 0,
    stage: 'initializing',
    message: 'Preparing to generate proof...'
  };
  
  // Create a promise that updates progress
  const proofPromise = new Promise(async (resolve, reject) => {
    try {
      // Stage 1: Preparation
      progress.stage = 'preparing';
      progress.message = 'Preparing circuit inputs...';
      progress.current = 10;
      if (progressCallback) progressCallback(progress);
      
      await new Promise(r => setTimeout(r, 100)); // Small delay for UI update
      
      // Stage 2: Generating
      progress.stage = 'generating';
      progress.message = 'Generating zero-knowledge proof (this may take 10-30 seconds)...';
      progress.current = 20;
      if (progressCallback) progressCallback(progress);
      
      const result = await generateProof(credentialData, merklePath);
      
      // Stage 3: Complete
      progress.stage = 'complete';
      progress.message = 'Proof generated successfully!';
      progress.current = 100;
      if (progressCallback) progressCallback(progress);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      resolve({
        ...result,
        metadata: {
          generationTime: duration,
          timestamp: new Date().toISOString(),
          credentialId: credentialData.credentialId
        }
      });
    } catch (error) {
      reject(error);
    }
  });
  
  // Expose progress callback setter
  proofPromise.onProgress = (callback) => {
    progressCallback = callback;
  };
  
  return proofPromise;
};

/**
 * Validate inputs before proof generation
 * @param {Object} credentialData - Credential data
 * @param {Object} merklePath - Merkle path
 * @returns {Object} Validation result
 */
export const validateProofInputs = (credentialData, merklePath) => {
  const errors = [];
  
  // Check credential data
  if (!credentialData.student) errors.push('Missing student hash');
  if (!credentialData.cidHash) errors.push('Missing CID hash');
  if (!credentialData.metadataHash) errors.push('Missing metadata hash');
  if (!credentialData.credentialId) errors.push('Missing credential ID');
  
  // Check Merkle path
  if (!merklePath.pathElements || !Array.isArray(merklePath.pathElements)) {
    errors.push('Invalid pathElements');
  }
  if (!merklePath.pathIndex || !Array.isArray(merklePath.pathIndex)) {
    errors.push('Invalid pathIndex');
  }
  if (!merklePath.root) errors.push('Missing Merkle root');
  
  // Check lengths match
  if (merklePath.pathElements && merklePath.pathIndex) {
    if (merklePath.pathElements.length !== merklePath.pathIndex.length) {
      errors.push('pathElements and pathIndex length mismatch');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};