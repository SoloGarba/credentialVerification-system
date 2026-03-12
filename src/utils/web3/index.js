/**
 * frontend/src/utils/web3/index.js
 * 
 * Central export for Web3/contract utilities
 */

// CredentialRegistry contract functions
export {
  getRegistryContract,
  addCredential,
  updateMerkleRoot,
  updateZKVerifier,
  transferAdmin,
  verifyStandard,
  verifyWithZKProof,
  doesCredentialExist,
  getCredentialCID,
  getMerkleRoot,
  getAdmin,
  getVerificationRecord,
  estimateAddCredentialGas,
  estimateVerifyStandardGas,
  estimateVerifyZKGas
} from './registry.js';

// Groth16Verifier contract functions
export {
  getVerifierContract,
  verifyProof,
  verifyProofWithDetails,
  isVerifierDeployed,
  getVerifierAddressFromConfig,
  estimateVerificationGas,
  testVerifier
} from './verifier.js';

// CredentialVerifierWrapper contract functions
export {
  getWrapperContract,
  verifyCredentialStandard,
  verifyCredentialZK,
  quickCheck,
  getCurrentMerkleRoot,
  isWrapperDeployed,
  batchQuickCheck
} from './wrapper.js';