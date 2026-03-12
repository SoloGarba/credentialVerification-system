/**
 * utils/merkle/index.js
 * 
 * Central export for Merkle tree utilities
 */

export {
  buildMerkleTree,
  addLeafToTree,
  buildTreeFromCredentials,
  getTreeStats
} from './builder.js';

export {
  generateMerkleProof,
  generateAllProofs,
  generateProofByCredentialId,
  formatProofForCircuit,
  validateProofStructure
} from './proofGenerator.js';

export {
  verifyMerkleProof,
  verifyProofObject,
  verifyCredentialInTree,
  debugProofVerification
} from './verifier.js';