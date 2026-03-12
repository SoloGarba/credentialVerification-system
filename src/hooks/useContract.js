/**
 * frontend/src/hooks/useContract.js
 *
 * React hook for interacting with smart contracts
 */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';
import {
  getRegistryContract,
  getVerifierContract,
  getWrapperContract
} from '../contracts/contractInstances';
import * as registryUtils from '../utils/web3/registry';
import * as verifierUtils from '../utils/web3/verifier';
import * as wrapperUtils from '../utils/web3/wrapper';

export const useContract = () => {
  const { provider, signer, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const [contracts, setContracts] = useState({
    registry: null,
    verifier: null,
    wrapper: null
  });

  useEffect(() => {
    if (provider) {
      setContracts({
        registry: getRegistryContract(provider),
        verifier: getVerifierContract(provider),
        wrapper: getWrapperContract(provider)
      });
    }
  }, [provider]);

  const addCredential = useCallback(async (credentialHash, ipfsCID) => {
    if (!signer) { setError('Wallet not connected'); return null; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const result = await registryUtils.addCredential(credentialHash, ipfsCID, signer);
      setTxHash(result.transactionHash);
      return result;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [signer]);

  const updateMerkleRoot = useCallback(async (newRoot) => {
    if (!signer) { setError('Wallet not connected'); return null; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const result = await registryUtils.updateMerkleRoot(newRoot, signer);
      setTxHash(result.transactionHash);
      return result;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [signer]);

  const verifyStandard = useCallback(async (credentialHash, ipfsCID) => {
    if (!signer) { setError('Wallet not connected'); return null; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const result = await registryUtils.verifyStandard(credentialHash, ipfsCID, signer);
      setTxHash(result.transactionHash);
      return result;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [signer]);

  const verifyWithZKProof = useCallback(async (pA, pB, pC, pubSignals) => {
    if (!signer) { setError('Wallet not connected'); return null; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const result = await registryUtils.verifyWithZKProof(pA, pB, pC, pubSignals, signer);
      setTxHash(result.transactionHash);
      return result;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [signer]);

  const checkCredentialExists = useCallback(async (credentialHash) => {
    if (!provider) { setError('Provider not available'); return false; }
    setLoading(true); setError(null);
    try {
      return await registryUtils.doesCredentialExist(credentialHash, provider);
    } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  }, [provider]);

  const getCredentialCID = useCallback(async (credentialHash) => {
    if (!provider) { setError('Provider not available'); return null; }
    setLoading(true); setError(null);
    try {
      return await registryUtils.getCredentialCID(credentialHash, provider);
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [provider]);

  const getMerkleRoot = useCallback(async () => {
    if (!provider) { setError('Provider not available'); return null; }
    setLoading(true); setError(null);
    try {
      return await registryUtils.getMerkleRoot(provider);
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [provider]);

  /**
   * Fetch all on-chain credential hashes, rebuild the Merkle tree
   * in the browser, and return the siblings proof for credentialHash.
   */
  const getMerkleProof = useCallback(async (credentialHash) => {
    if (!provider) { setError('Provider not available'); return null; }
    setLoading(true); setError(null);
    try {
      return await registryUtils.getMerkleProof(credentialHash, provider);
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [provider]);

  const getAdmin = useCallback(async () => {
    if (!provider) { setError('Provider not available'); return null; }
    setLoading(true); setError(null);
    try {
      return await registryUtils.getAdmin(provider);
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  }, [provider]);

  const isAdmin = useCallback(async (userAddress) => {
    if (!provider) return false;
    try {
      const adminAddress = await registryUtils.getAdmin(provider);
      return adminAddress.toLowerCase() === userAddress.toLowerCase();
    } catch { return false; }
  }, [provider]);

  const estimateGas = useCallback(async (operation, ...args) => {
    if (!signer) return null;
    try {
      switch (operation) {
        case 'addCredential':
          return await registryUtils.estimateAddCredentialGas(args[0], args[1], signer);
        case 'verifyStandard':
          return await registryUtils.estimateVerifyStandardGas(args[0], args[1], signer);
        case 'verifyZK':
          return await registryUtils.estimateVerifyZKGas(args[0], args[1], args[2], args[3], signer);
        default:
          return null;
      }
    } catch (err) {
      console.error('Gas estimation error:', err);
      return null;
    }
  }, [signer]);

  const clearError = useCallback(() => setError(null), []);

  return {
    contracts,
    loading,
    error,
    txHash,
    addCredential,
    updateMerkleRoot,
    verifyStandard,
    verifyWithZKProof,
    checkCredentialExists,
    getCredentialCID,
    getMerkleRoot,
    getMerkleProof,   // ← new
    getAdmin,
    isAdmin,
    estimateGas,
    clearError,
    isConnected
  };
};