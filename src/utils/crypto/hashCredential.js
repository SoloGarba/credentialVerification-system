/**
 * utils/crypto/hashCredential.js
 * 
 * Functions for hashing credential data
 * Must match the circuit's hashing logic exactly!
 */

import { poseidonHash4, hashToBytes32 } from './poseidon.js';
import { ethers } from 'ethers';

/**
 * Hash a complete credential into a leaf hash
 * This MUST match the circuit's Poseidon(4) hash in credential.circom
 * 
 * @param {Object} credential - Credential data
 * @param {string} credential.student - Student identifier hash
 * @param {string} credential.cidHash - IPFS CID hash
 * @param {string} credential.metadataHash - Metadata hash
 * @param {string} credential.credentialId - Credential ID
 * @returns {Promise<string>} Leaf hash as string
 */
export const hashCredential = async (credential) => {
  const { student, cidHash, metadataHash, credentialId } = credential;
  
  // Hash with Poseidon (4 inputs, matching circuit)
  const leafHash = await poseidonHash4(
    student,
    cidHash,
    metadataHash,
    credentialId
  );
  
  return leafHash;
};

/**
 * Hash a complete credential and return as bytes32 for Solidity
 * @param {Object} credential - Credential data
 * @returns {Promise<string>} Leaf hash as 0x-prefixed hex string
 */
export const hashCredentialToBytes32 = async (credential) => {
  const hash = await hashCredential(credential);
  return hashToBytes32(hash);
};

/**
 * Hash student identifier (e.g., student ID, email, address)
 * @param {string} studentIdentifier - Any unique student identifier
 * @returns {string} Hash as BigInt string
 */
export const hashStudentId = (studentIdentifier) => {
  // Use keccak256 for simplicity, then convert to BigInt
  const hash = ethers.keccak256(ethers.toUtf8Bytes(studentIdentifier));
  return BigInt(hash).toString();
};

/**
 * Hash IPFS CID
 * @param {string} cid - IPFS CID (e.g., "QmXxx...")
 * @returns {string} Hash as BigInt string
 */
export const hashIPFSCID = (cid) => {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(cid));
  return BigInt(hash).toString();
};

/**
 * Hash credential metadata (degree, graduation date, etc.)
 * @param {Object} metadata - Metadata object
 * @returns {string} Hash as BigInt string
 */
export const hashMetadata = (metadata) => {
  // Stringify and hash the metadata object
  const metadataString = JSON.stringify(metadata);
  const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));
  return BigInt(hash).toString();
};

/**
 * Prepare credential data for hashing
 * Converts raw credential data into hashable format
 * 
 * @param {Object} rawCredential - Raw credential data
 * @param {string} rawCredential.studentEmail - Student email or ID
 * @param {string} rawCredential.ipfsCID - IPFS CID
 * @param {Object} rawCredential.metadata - Metadata object
 * @param {string} rawCredential.credentialId - Credential ID
 * @returns {Object} Prepared credential with all fields as BigInt strings
 */
export const prepareCredentialForHashing = (rawCredential) => {
  return {
    student: hashStudentId(rawCredential.studentEmail),
    cidHash: hashIPFSCID(rawCredential.ipfsCID),
    metadataHash: hashMetadata(rawCredential.metadata),
    credentialId: rawCredential.credentialId.toString()
  };
};

/**
 * Complete workflow: raw data → hashed credential → leaf hash
 * @param {Object} rawCredential - Raw credential data
 * @returns {Promise<Object>} Credential with leaf hash
 */
export const processCredential = async (rawCredential) => {
  // Step 1: Prepare (hash individual fields)
  const prepared = prepareCredentialForHashing(rawCredential);
  
  // Step 2: Hash the complete credential
  const leafHash = await hashCredential(prepared);
  const leafHashBytes32 = hashToBytes32(leafHash);
  
  return {
    ...prepared,
    leafHash,
    leafHashBytes32,
    // Keep original data for reference
    original: rawCredential
  };
};

/**
 * Verify a credential hash matches
 * Useful for debugging and validation
 * 
 * @param {Object} credential - Credential with hashes
 * @param {string} expectedLeafHash - Expected leaf hash
 * @returns {Promise<boolean>} True if matches
 */
export const verifyCredentialHash = async (credential, expectedLeafHash) => {
  const computedHash = await hashCredential(credential);
  return computedHash === expectedLeafHash;
};