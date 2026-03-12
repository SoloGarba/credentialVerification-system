/**
 * utils/merkle/verifier.js
 *
 * Verify Merkle proofs using Poseidon hashing (matches circuit)
 */

import { getPoseidon } from '../crypto/poseidon.js';

/**
 * Verify a Merkle proof by recomputing the root from leaf + siblings.
 *
 * @param {string}   leaf          - The leaf hash (as BigInt string or hex)
 * @param {string[]} pathElements  - Sibling hashes at each level
 * @param {number[]} pathIndex     - 0 = current node is left, 1 = current node is right
 * @param {string}   expectedRoot  - The on-chain Merkle root to check against
 * @returns {Promise<boolean>}
 */
export const verifyMerkleProof = async (leaf, pathElements, pathIndex, expectedRoot) => {
  const poseidon = await getPoseidon();
  let currentHash = BigInt(leaf);

  for (let i = 0; i < pathElements.length; i++) {
    const sibling = BigInt(pathElements[i] || '0');
    const isLeft = pathIndex[i] === 0; // 0 means current node is on the left

    const [left, right] = isLeft
      ? [currentHash, sibling]
      : [sibling, currentHash];

    const result = poseidon([left, right]);
    currentHash = BigInt(poseidon.F.toString(result));
  }

  return currentHash.toString() === BigInt(expectedRoot).toString();
};

/**
 * Verify a proof object (output of generateMerkleProof / formatProofForCircuit).
 *
 * @param {string} leaf
 * @param {{ pathElements: string[], pathIndex: number[], root: string }} proofObj
 * @param {string} expectedRoot
 * @returns {Promise<boolean>}
 */
export const verifyProofObject = async (leaf, proofObj, expectedRoot) => {
  return verifyMerkleProof(
    leaf,
    proofObj.pathElements || proofObj.siblings,
    proofObj.pathIndex || proofObj.pathIndices,
    expectedRoot
  );
};

/**
 * Verify that a credential hash exists in the tree by checking its proof.
 *
 * @param {string} credentialHash
 * @param {{ pathElements: string[], pathIndex: number[], root: string }} proof
 * @param {string} onChainRoot
 * @returns {Promise<boolean>}
 */
export const verifyCredentialInTree = async (credentialHash, proof, onChainRoot) => {
  const isValid = await verifyProofObject(credentialHash, proof, onChainRoot);
  if (!isValid) {
    console.warn('[verifyCredentialInTree] Proof verification failed. Root mismatch or invalid siblings.');
  }
  return isValid;
};

/**
 * Debug helper — logs each step of proof verification to the console.
 *
 * @param {string}   leaf
 * @param {string[]} pathElements
 * @param {number[]} pathIndex
 * @param {string}   expectedRoot
 */
export const debugProofVerification = async (leaf, pathElements, pathIndex, expectedRoot) => {
  const poseidon = await getPoseidon();
  let currentHash = BigInt(leaf);

  console.group('[debugProofVerification]');
  console.log('Leaf:', currentHash.toString());

  for (let i = 0; i < pathElements.length; i++) {
    const sibling = BigInt(pathElements[i] || '0');
    const isLeft = pathIndex[i] === 0;
    const [left, right] = isLeft ? [currentHash, sibling] : [sibling, currentHash];

    const result = poseidon([left, right]);
    currentHash = BigInt(poseidon.F.toString(result));

    console.log(`Level ${i}: ${isLeft ? 'current=left' : 'current=right'} → hash: ${currentHash.toString()}`);
  }

  console.log('Computed root:', currentHash.toString());
  console.log('Expected root:', BigInt(expectedRoot).toString());
  console.log('Match:', currentHash.toString() === BigInt(expectedRoot).toString());
  console.groupEnd();
};