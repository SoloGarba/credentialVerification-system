/**
 * utils/merkle/builder.js
 * 
 * Build Merkle trees from credential leaves
 */

import { poseidonHash2 } from '../crypto/poseidon.js';

/**
 * Build a Merkle tree from leaf hashes
 * 
 * @param {Array<string>} leaves - Array of leaf hashes (as strings)
 * @param {number} height - Tree height (must match circuit)
 * @returns {Promise<Object>} Tree structure with root
 */
export const buildMerkleTree = async (leaves, height = 20) => {
  if (leaves.length === 0) {
    throw new Error('Cannot build tree from empty leaves array');
  }
  
  if (leaves.length > Math.pow(2, height)) {
    throw new Error(`Too many leaves for tree height ${height}. Max: ${Math.pow(2, height)}`);
  }
  
  // Initialize tree with leaves at level 0
  const tree = [leaves.slice()]; // Copy array
  let currentLevel = leaves.slice();
  
  // Build tree bottom-up
  for (let level = 0; level < height; level++) {
    const nextLevel = [];
    
    // Process pairs
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : '0';
      
      // Hash the pair
      const parent = await poseidonHash2(left, right);
      nextLevel.push(parent);
    }
    
    
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }
  
  const root = tree[tree.length - 1][0];
  
  return {
    root,
    tree,
    leaves,
    height: tree.length - 1,
    totalLeaves: leaves.length
  };
};

/**
 * Add a leaf to an existing tree and recompute affected nodes
 * (Simplified version - full implementation would be more efficient)
 * 
 * @param {Object} existingTree - Existing tree structure
 * @param {string} newLeaf - New leaf hash to add
 * @returns {Promise<Object>} Updated tree structure
 */
export const addLeafToTree = async (existingTree, newLeaf) => {
  const newLeaves = [...existingTree.leaves, newLeaf];
  return buildMerkleTree(newLeaves, existingTree.height);
};

/**
 * Rebuild tree from credentials (convenience function)
 * 
 * @param {Array<Object>} credentials - Array of credential objects with leafHash
 * @param {number} height - Tree height
 * @returns {Promise<Object>} Tree structure
 */
export const buildTreeFromCredentials = async (credentials, height = 20) => {
  const leaves = credentials.map(cred => cred.leafHash);
  return buildMerkleTree(leaves, height);
};

/**
 * Get tree statistics
 * @param {Object} tree - Tree structure
 * @returns {Object} Statistics
 */
export const getTreeStats = (tree) => {
  return {
    root: tree.root,
    height: tree.height,
    totalLeaves: tree.totalLeaves,
    maxCapacity: Math.pow(2, tree.height),
    utilizationPercent: (tree.totalLeaves / Math.pow(2, tree.height)) * 100,
    levels: tree.tree.length
  };
};