/**
 * frontend/src/hooks/useMerkleTree.js
 * 
 * React hook for Merkle tree operations
 */

import { useState, useCallback } from 'react';
import {
  buildMerkleTree,
  buildTreeFromCredentials,
  getTreeStats
} from '../utils/merkle/builder';
import {
  generateMerkleProof,
  generateProofByCredentialId,
  formatProofForCircuit
} from '../utils/merkle/proofGenerator';
import {
  verifyMerkleProof,
  verifyCredentialInTree
} from '../utils/merkle/verifier';
import { hashCredential, processCredential } from '../utils/crypto/hashCredential';

export const useMerkleTree = () => {
  const [building, setBuilding] = useState(false);
  const [tree, setTree] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  /**
   * Build Merkle tree from credentials
   */
  const buildTree = useCallback(async (credentials, height = 20) => {
    setBuilding(true);
    setError(null);

    try {
      // Process credentials to get leaf hashes
      const processedCredentials = [];
      
      for (const cred of credentials) {
        const processed = await processCredential(cred);
        processedCredentials.push(processed);
      }

      // Build tree
      const leaves = processedCredentials.map(c => c.leafHash);
      const merkleTree = await buildMerkleTree(leaves, height);

      setTree(merkleTree);
      setStats(getTreeStats(merkleTree));

      return {
        tree: merkleTree,
        credentials: processedCredentials
      };
    } catch (err) {
      console.error('Build tree error:', err);
      setError(err.message);
      return null;
    } finally {
      setBuilding(false);
    }
  }, []);

  /**
   * Generate proof for a specific credential
   */
  const getProof = useCallback((leafIndex) => {
    if (!tree) {
      setError('No tree built yet');
      return null;
    }

    try {
      const proof = generateMerkleProof(tree, leafIndex);
      return proof;
    } catch (err) {
      console.error('Get proof error:', err);
      setError(err.message);
      return null;
    }
  }, [tree]);

  /**
   * Generate proof by credential ID
   */
  const getProofByCredentialId = useCallback((credentials, credentialId) => {
    if (!tree) {
      setError('No tree built yet');
      return null;
    }

    try {
      const proof = generateProofByCredentialId(tree, credentials, credentialId);
      return proof;
    } catch (err) {
      console.error('Get proof by ID error:', err);
      setError(err.message);
      return null;
    }
  }, [tree]);

  /**
   * Verify a Merkle proof
   */
  const verifyProof = useCallback(async (leaf, pathElements, pathIndex, expectedRoot) => {
    try {
      const isValid = await verifyMerkleProof(leaf, pathElements, pathIndex, expectedRoot);
      return isValid;
    } catch (err) {
      console.error('Verify proof error:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Verify credential is in tree
   */
  const verifyCredential = useCallback(async (credential, proof, expectedRoot) => {
    try {
      const isValid = await verifyCredentialInTree(credential, proof, expectedRoot);
      return isValid;
    } catch (err) {
      console.error('Verify credential error:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Get tree root
   */
  const getRoot = useCallback(() => {
    if (!tree) {
      return null;
    }
    return tree.root;
  }, [tree]);

  /**
   * Get tree statistics
   */
  const getStats = useCallback(() => {
    if (!tree) {
      return null;
    }
    return getTreeStats(tree);
  }, [tree]);

  /**
   * Format proof for circuit input
   */
  const formatForCircuit = useCallback((proof, credential) => {
    try {
      return formatProofForCircuit(proof, credential);
    } catch (err) {
      console.error('Format for circuit error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setBuilding(false);
    setTree(null);
    setError(null);
    setStats(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    building,
    tree,
    error,
    stats,
    hasTree: !!tree,
    
    // Functions
    buildTree,
    getProof,
    getProofByCredentialId,
    verifyProof,
    verifyCredential,
    getRoot,
    getStats,
    formatForCircuit,
    
    // Utilities
    reset,
    clearError
  };
};