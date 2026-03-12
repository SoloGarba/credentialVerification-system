/**
 * frontend/src/utils/zkp/proofFormatter.js
 * 
 * Format ZK proofs for smart contract submission and display
 */

/**
 * Format proof for Solidity contract call
 * Converts snarkjs proof format to Groth16 verifier format
 * 
 * @param {Object} proof - snarkjs proof object
 * @param {Array} publicSignals - Public signals array
 * @returns {Object} Formatted proof for contract
 */
export const formatProofForContract = (proof, publicSignals) => {
  return {
    pA: [proof.pi_a[0], proof.pi_a[1]],
    pB: [
      [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: reversed!
      [proof.pi_b[1][1], proof.pi_b[1][0]]  // Note: reversed!
    ],
    pC: [proof.pi_c[0], proof.pi_c[1]],
    pubSignals: [publicSignals[0]] // Just the root for our circuit
  };
};

/**
 * Format proof for ethers.js contract call
 * 
 * @param {Object} proof - snarkjs proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Array} Array of arguments for contract.verifyWithZKProof()
 */
export const formatProofForEthers = (proof, publicSignals) => {
  const formatted = formatProofForContract(proof, publicSignals);
  
  return [
    formatted.pA,
    formatted.pB,
    formatted.pC,
    formatted.pubSignals
  ];
};

/**
 * Format proof for display in UI
 * Truncates long values for readability
 * 
 * @param {Object} proof - snarkjs proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Object} Display-friendly proof
 */
export const formatProofForDisplay = (proof, publicSignals) => {
  const truncate = (val, len = 10) => {
    const str = String(val);
    return str.length > len ? `${str.slice(0, len)}...${str.slice(-4)}` : str;
  };
  
  return {
    pi_a: proof.pi_a.map(v => truncate(v)),
    pi_b: proof.pi_b.map(row => row.map(v => truncate(v))),
    pi_c: proof.pi_c.map(v => truncate(v)),
    publicSignals: publicSignals.map(v => truncate(v)),
    size: `${(JSON.stringify(proof).length / 1024).toFixed(2)} KB`,
    protocol: 'Groth16'
  };
};

/**
 * Serialize proof to JSON string
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {string} JSON string
 */
export const serializeProof = (proof, publicSignals) => {
  return JSON.stringify({
    proof,
    publicSignals,
    timestamp: new Date().toISOString(),
    protocol: 'groth16'
  }, null, 2);
};

/**
 * Deserialize proof from JSON string
 * 
 * @param {string} jsonString - JSON proof string
 * @returns {Object} Proof and public signals
 */
export const deserializeProof = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    return {
      proof: data.proof,
      publicSignals: data.publicSignals,
      timestamp: data.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to deserialize proof: ${error.message}`);
  }
};

/**
 * Validate proof structure
 * 
 * @param {Object} proof - Proof object
 * @returns {boolean} True if valid structure
 */
export const validateProofStructure = (proof) => {
  try {
    return (
      proof &&
      Array.isArray(proof.pi_a) && proof.pi_a.length === 3 &&
      Array.isArray(proof.pi_b) && proof.pi_b.length === 3 &&
      Array.isArray(proof.pi_c) && proof.pi_c.length === 3 &&
      Array.isArray(proof.pi_b[0]) && proof.pi_b[0].length === 2 &&
      typeof proof.protocol === 'string'
    );
  } catch (error) {
    return false;
  }
};

/**
 * Get proof statistics
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {Object} Proof stats
 */
export const getProofStats = (proof, publicSignals) => {
  const proofString = JSON.stringify(proof);
  
  return {
    sizeBytes: proofString.length,
    sizeKB: (proofString.length / 1024).toFixed(2),
    publicSignalsCount: publicSignals.length,
    protocol: proof.protocol || 'groth16',
    curveType: proof.curve || 'bn128'
  };
};

/**
 * Compare two proofs (for testing/debugging)
 * 
 * @param {Object} proof1 - First proof
 * @param {Object} proof2 - Second proof
 * @returns {boolean} True if identical
 */
export const compareProofs = (proof1, proof2) => {
  return JSON.stringify(proof1) === JSON.stringify(proof2);
};

/**
 * Export proof as downloadable file
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @param {string} filename - Download filename
 */
export const exportProofAsFile = (proof, publicSignals, filename = 'proof.json') => {
  const data = serializeProof(proof, publicSignals);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Parse proof from file upload
 * 
 * @param {File} file - Uploaded proof file
 * @returns {Promise<Object>} Parsed proof
 */
export const parseProofFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = deserializeProof(e.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Create shareable proof link (base64 encoded)
 * 
 * @param {Object} proof - Proof object
 * @param {Array} publicSignals - Public signals
 * @returns {string} Shareable URL
 */
export const createShareableProofLink = (proof, publicSignals) => {
  const data = serializeProof(proof, publicSignals);
  const encoded = btoa(data); // Base64 encode
  
  return `${window.location.origin}/verify?proof=${encoded}`;
};

/**
 * Parse proof from shareable link
 * 
 * @param {string} encodedProof - Base64 encoded proof
 * @returns {Object} Proof and public signals
 */
export const parseProofFromLink = (encodedProof) => {
  try {
    const decoded = atob(encodedProof);
    return deserializeProof(decoded);
  } catch (error) {
    throw new Error(`Failed to parse proof from link: ${error.message}`);
  }
};

/**
 * Format public signals for display
 * 
 * @param {Array} publicSignals - Public signals array
 * @returns {Object} Formatted signals
 */
export const formatPublicSignals = (publicSignals) => {
  return {
    root: publicSignals[0],
    rootShort: `${String(publicSignals[0]).slice(0, 10)}...${String(publicSignals[0]).slice(-10)}`,
    count: publicSignals.length
  };
};