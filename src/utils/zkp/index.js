/**
 * frontend/src/utils/zkp/index.js
 * 
 * Central export for ZKP utilities
 */

export {
  generateProof,
  generateProofCustom,
  estimateProofTime,
  checkCircuitArtifacts,
  preloadCircuitArtifacts,
  generateProofWithTracking,
  validateProofInputs
} from './proofGenerator.js';

export {
  formatProofForContract,
  formatProofForEthers,
  formatProofForDisplay,
  serializeProof,
  deserializeProof,
  validateProofStructure,
  getProofStats,
  compareProofs,
  exportProofAsFile,
  parseProofFromFile,
  createShareableProofLink,
  parseProofFromLink,
  formatPublicSignals
} from './proofFormatter.js';

export {
  verifyProofLocally,
  verifyProofWithDetails,
  batchVerifyProofs,
  isVerificationKeyAvailable,
  preloadVerificationKey,
  validateProofBeforeVerification,
  verifyProofRoot,
  completeProofValidation,
  estimateGasSavings
} from './proofValidator.js';