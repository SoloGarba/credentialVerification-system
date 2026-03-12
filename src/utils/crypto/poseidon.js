/**
 * utils/crypto/poseidon.js
 * 
 * Poseidon hash wrapper for consistent usage across the app
 * Poseidon is a ZK-friendly hash function used in circuits
 */

import { buildPoseidon } from 'circomlibjs';

let poseidonInstance = null;

/**
 * Get or initialize Poseidon hasher
 * @returns {Promise<Poseidon>} Poseidon hasher instance
 */
export const getPoseidon = async () => {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
};

/**
 * Hash multiple inputs with Poseidon
 * @param {Array<string|number|BigInt>} inputs - Values to hash
 * @returns {Promise<string>} Hash as string
 */
export const poseidonHash = async (inputs) => {
  const poseidon = await getPoseidon();
  
  // Convert all inputs to BigInt
  const bigIntInputs = inputs.map(input => BigInt(input));
  
  const hash = poseidon(bigIntInputs);
  return poseidon.F.toString(hash);
};

/**
 * Hash two values (common in Merkle trees)
 * @param {string|number|BigInt} left - Left value
 * @param {string|number|BigInt} right - Right value
 * @returns {Promise<string>} Hash as string
 */
export const poseidonHash2 = async (left, right) => {
  return poseidonHash([left, right]);
};

/**
 * Hash four values (used for credential leaves)
 * @param {string|number|BigInt} a - First value
 * @param {string|number|BigInt} b - Second value
 * @param {string|number|BigInt} c - Third value
 * @param {string|number|BigInt} d - Fourth value
 * @returns {Promise<string>} Hash as string
 */
export const poseidonHash4 = async (a, b, c, d) => {
  return poseidonHash([a, b, c, d]);
};

/**
 * Convert hash to bytes32 format for Solidity
 * @param {string} hash - Hash as string
 * @returns {string} Hash as 0x-prefixed hex string (bytes32)
 */
export const hashToBytes32 = (hash) => {
  // Convert to hex and pad to 32 bytes (64 hex chars)
  const hex = BigInt(hash).toString(16).padStart(64, '0');
  return '0x' + hex;
};

/**
 * Convert bytes32 to BigInt string
 * @param {string} bytes32 - 0x-prefixed hex string
 * @returns {string} BigInt as string
 */
export const bytes32ToBigInt = (bytes32) => {
  return BigInt(bytes32).toString();
};