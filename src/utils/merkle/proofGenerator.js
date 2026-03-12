/**
 * utils/merkle/proofGenerator.js
 *
 * Generate Merkle proofs from a built tree structure
 */

/**
 * Generate a Merkle proof for a leaf at a given index.
 *
 * @param {Object} treeData  - Output of buildMerkleTree: { tree, root, leaves, height }
 * @param {number} leafIndex - Index of the target leaf in treeData.leaves
 * @returns {{ pathElements: string[], pathIndex: number[], root: string }}
 */
export const generateMerkleProof = (treeData, leafIndex) => {
  const { tree, root } = treeData;
  const pathElements = [];
  const pathIndex = [];
  let currentIndex = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const isLeft = currentIndex % 2 === 0;
    const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

    pathElements.push(tree[level][siblingIndex] || '0');
    pathIndex.push(isLeft ? 0 : 1);

    currentIndex = Math.floor(currentIndex / 2);
  }

  return { pathElements, pathIndex, root };
};

/**
 * Generate proofs for all leaves in the tree.
 *
 * @param {Object} treeData - Output of buildMerkleTree
 * @returns {Array<{ leafIndex: number, leaf: string, pathElements: string[], pathIndex: number[], root: string }>}
 */
export const generateAllProofs = (treeData) => {
  return treeData.leaves.map((leaf, index) => ({
    leafIndex: index,
    leaf,
    ...generateMerkleProof(treeData, index)
  }));
};

/**
 * Generate a proof by matching a credential's leafHash in the tree.
 *
 * @param {Object}   treeData    - Output of buildMerkleTree
 * @param {string}   credentialId - The leafHash to search for
 * @returns {{ pathElements: string[], pathIndex: number[], root: string, leafIndex: number } | null}
 */
export const generateProofByCredentialId = (treeData, credentialId) => {
  const leafIndex = treeData.leaves.findIndex(
    (l) => l.toString() === credentialId.toString()
  );

  if (leafIndex === -1) {
    throw new Error(
      `Credential not found in tree. Make sure the hash matches a registered credential.`
    );
  }

  return {
    leafIndex,
    ...generateMerkleProof(treeData, leafIndex)
  };
};

/**
 * Format a proof into the shape expected by the ZK circuit and useZkProof hook.
 * Maps pathElements → siblings and pathIndex → pathIndices.
 *
 * @param {{ pathElements: string[], pathIndex: number[], root: string }} proof
 * @returns {{ siblings: string[], pathIndices: number[], root: string }}
 */
export const formatProofForCircuit = (proof) => {
  return {
    siblings: proof.pathElements,
    pathIndices: proof.pathIndex,
    root: proof.root
  };
};

/**
 * Basic structural validation of a proof object.
 *
 * @param {Object} proof
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateProofStructure = (proof) => {
  const errors = [];

  if (!proof) {
    return { valid: false, errors: ['Proof is null or undefined'] };
  }
  if (!proof.pathElements || !Array.isArray(proof.pathElements)) {
    errors.push('pathElements must be an array');
  }
  if (!proof.pathIndex || !Array.isArray(proof.pathIndex)) {
    errors.push('pathIndex must be an array');
  }
  if (proof.pathElements && proof.pathIndex &&
      proof.pathElements.length !== proof.pathIndex.length) {
    errors.push('pathElements and pathIndex must have the same length');
  }
  if (!proof.root) {
    errors.push('root is missing');
  }

  return { valid: errors.length === 0, errors };
};