/**
 * utils/crypto/index.js
 * 
 * Central export for all cryptographic utilities
 */

export {
  getPoseidon,
  poseidonHash,
  poseidonHash2,
  poseidonHash4,
  hashToBytes32,
  bytes32ToBigInt
} from './poseidon.js';

export {
  hashCredential,
  hashCredentialToBytes32,
  hashStudentId,
  hashIPFSCID,
  hashMetadata,
  prepareCredentialForHashing,
  processCredential,
  verifyCredentialHash
} from './hashCredential.js';