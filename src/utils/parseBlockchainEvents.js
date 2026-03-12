/**
 * frontend/src/utils/parseBlockchainEvents.js
 */

import { ethers } from 'ethers';
import CredentialRegistryABI from '../contracts/abis/CredentialRegistry.json';
import { getRegistryAddress } from '../contracts/addresses';

const RPC_URL = 'https://sepolia.infura.io/v3/7bb6cf1eaef94cd5ba2896727c4a250f';
const FROM_BLOCK = 7300000;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

/**
 * Fetch zkDataCID from Pinata keyvalues, then fetch the full JSON from IPFS.
 * Returns empty object if anything fails.
 */
const fetchCredentialMetadata = async (ipfsCID) => {
  try {
    const JWT = process.env.REACT_APP_PINATA_JWT;
    if (!JWT) return {};

    // Step 1: Get zkDataCID from Pinata pin metadata
    const res = await fetch(
      `https://api.pinata.cloud/data/pinList?status=pinned&hashContains=${ipfsCID}`,
      { headers: { Authorization: `Bearer ${JWT}` } }
    );
    if (!res.ok) return {};

    const data = await res.json();
    const pin = data.rows?.[0];
    if (!pin) return {};

    const zkDataCID = pin.metadata?.keyvalues?.zkDataCID;
    if (!zkDataCID) {
      // Old format — fall back to keyvalues directly
      return pin.metadata?.keyvalues || {};
    }

    // Step 2: Fetch the full JSON from IPFS gateway
    const jsonRes = await fetch(`${IPFS_GATEWAY}/${zkDataCID}`);
    if (!jsonRes.ok) return pin.metadata?.keyvalues || {};

    return await jsonRes.json();
  } catch {
    return {};
  }
};

export const getIssuedCredentials = async (adminAddress = null) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(getRegistryAddress(), CredentialRegistryABI, provider);

    console.log('Querying blockchain events...');
    const events = await contract.queryFilter(contract.filters.CredentialAdded(), FROM_BLOCK, 'latest');
    console.log(`Found ${events.length} credential events`);

    const credentials = await Promise.all(
      events.map(async (event) => {
        const { credentialHash, ipfsCID, timestamp } = event.args;
        const tx = await event.getTransaction();
        const block = await event.getBlock();
        const meta = await fetchCredentialMetadata(ipfsCID);

        return {
          hash: credentialHash,
          ipfsCID,
          studentName:    meta.studentName    || null,
          studentId:      meta.studentId      || null,
          degree:         meta.degree         || null,
          institution:    meta.institution    || null,
          graduationDate: meta.graduationDate || null,
          gpa:            meta.gpa            || null,
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          date: new Date(Number(timestamp) * 1000).toISOString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          addedBy: tx.from,
          blockTimestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          status: 'active',
        };
      })
    );

    return adminAddress
      ? credentials.filter(c => c.addedBy.toLowerCase() === adminAddress.toLowerCase())
      : credentials;
  } catch (error) {
    console.error('Error fetching blockchain events:', error);
    throw error;
  }
};

export const getVerificationHistory = async (verifierAddress = null) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(getRegistryAddress(), CredentialRegistryABI, provider);

    const events = await contract.queryFilter(contract.filters.CredentialVerified(), FROM_BLOCK, 'latest');

    const verifications = await Promise.all(
      events.map(async (event) => {
        const { credentialHash, verifier, mode, isValid, timestamp } = event.args;
        const block = await event.getBlock();
        return {
          credentialHash, verifier,
          mode: Number(mode) === 0 ? 'standard' : 'zk',
          isValid,
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          blockTimestamp: new Date(Number(block.timestamp) * 1000).toISOString()
        };
      })
    );

    return verifierAddress
      ? verifications.filter(v => v.verifier.toLowerCase() === verifierAddress.toLowerCase())
      : verifications;
  } catch (error) {
    console.error('Error fetching verification events:', error);
    throw error;
  }
};

export const getCredentialByHash = async (credentialHash) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(getRegistryAddress(), CredentialRegistryABI, provider);

    const exists = await contract.doesCredentialExist(credentialHash);
    if (!exists) return null;

    const ipfsCID = await contract.getCredentialCID(credentialHash);
    const verificationRecord = await contract.getVerificationRecord(credentialHash);
    const meta = await fetchCredentialMetadata(ipfsCID);

    return {
      hash: credentialHash, ipfsCID, exists: true,
      studentName: meta.studentName || null,
      studentId: meta.studentId || null,
      degree: meta.degree || null,
      institution: meta.institution || null,
      lastVerification: verificationRecord.timestamp > 0 ? {
        verifier: verificationRecord.verifier,
        timestamp: new Date(Number(verificationRecord.timestamp) * 1000).toISOString(),
        mode: Number(verificationRecord.mode) === 0 ? 'standard' : 'zk',
        isValid: verificationRecord.isValid
      } : null
    };
  } catch (error) {
    console.error('Error fetching credential:', error);
    throw error;
  }
};

const CACHE_KEY_PREFIX = 'blockchain_cache_';
const CACHE_DURATION = 5 * 60 * 1000;

export const getCachedOrFetch = async (cacheKey, fetchFunction) => {
  const fullKey = CACHE_KEY_PREFIX + cacheKey;
  const cached = localStorage.getItem(fullKey);

  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached data');
        return data;
      }
    } catch { }
  }

  const data = await fetchFunction();
  localStorage.setItem(fullKey, JSON.stringify({ data, timestamp: Date.now() }));
  return data;
};