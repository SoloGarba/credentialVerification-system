/**
 * frontend/src/utils/web3/registry.js
 */

import { ethers } from 'ethers';
import CredentialRegistryABI from '../../contracts/abis/CredentialRegistry.json';
import { getRegistryAddress } from '../../contracts/addresses.js';
import { buildMerkleTree } from '../merkle/builder.js';
import { generateProofByCredentialId, formatProofForCircuit } from '../merkle/proofGenerator.js';
import { bytes32ToBigInt, hashToBytes32 } from '../crypto/poseidon.js';

export const getRegistryContract = (signerOrProvider) => {
  const address = getRegistryAddress();
  return new ethers.Contract(address, CredentialRegistryABI, signerOrProvider);
};

// ============ ADMIN FUNCTIONS ============

export const addCredential = async (credentialHash, ipfsCID, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const tx = await contract.addCredential(credentialHash, ipfsCID);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
  } catch (error) {
    throw new Error(`Failed to add credential: ${error.message}`);
  }
};

export const updateMerkleRoot = async (newRoot, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const tx = await contract.updateMerkleRoot(newRoot);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), newRoot };
  } catch (error) {
    throw new Error(`Failed to update root: ${error.message}`);
  }
};

export const updateZKVerifier = async (verifierAddress, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const tx = await contract.updateZKVerifier(verifierAddress);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash, verifierAddress };
  } catch (error) {
    throw new Error(`Failed to update verifier: ${error.message}`);
  }
};

export const transferAdmin = async (newAdmin, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const tx = await contract.transferAdmin(newAdmin);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash, newAdmin };
  } catch (error) {
    throw new Error(`Failed to transfer admin: ${error.message}`);
  }
};

// ============ VERIFICATION FUNCTIONS ============

export const verifyStandard = async (credentialHash, ipfsCID, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const tx = await contract.verifyStandard(credentialHash, ipfsCID);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e && e.name === 'CredentialVerified');
    return { success: true, isValid: event ? event.args.isValid : false, transactionHash: receipt.hash, gasUsed: receipt.gasUsed.toString(), timestamp: new Date().toISOString() };
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
};

export const verifyWithZKProof = async (pA, pB, pC, pubSignals, signer) => {
  try {
    const contract = getRegistryContract(signer);

    // Format proof for Solidity — pB must be transposed (snarkjs is column-major)
    const formattedPA = [pA[0], pA[1]];
    const formattedPB = [
      [pB[0][1], pB[0][0]],
      [pB[1][1], pB[1][0]],
    ];
    const formattedPC = [pC[0], pC[1]];

    // Contract expects uint[1] — only the Merkle root
    const formattedPubSignals = [pubSignals[0]];

    // Fetch on-chain root for comparison
    const onChainRoot = await contract.getMerkleRoot();
    const onChainRootBigInt = BigInt(onChainRoot);

    console.log('[verify] proof pubSignal root (decimal):', pubSignals[0]);
    console.log('[verify] on-chain root (decimal):', onChainRootBigInt.toString());
    console.log('[verify] on-chain root (hex):', onChainRoot);
    console.log('[verify] roots match:', pubSignals[0] === onChainRootBigInt.toString());

    const tx = await contract.verifyWithZKProof(formattedPA, formattedPB, formattedPC, formattedPubSignals);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e && e.name === 'CredentialVerified');
    return {
      success: true,
      isValid: event ? event.args.isValid : false,
      transactionHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[verifyWithZKProof] raw error:', error);
    throw new Error(`ZK verification failed: ${error.message}`);
  }
};

// ============ VIEW FUNCTIONS ============

export const doesCredentialExist = async (credentialHash, provider) => {
  try {
    const contract = getRegistryContract(provider);
    return await contract.doesCredentialExist(credentialHash);
  } catch (error) {
    throw new Error(`Failed to check credential: ${error.message}`);
  }
};

export const getCredentialCID = async (credentialHash, provider) => {
  try {
    const contract = getRegistryContract(provider);
    return await contract.getCredentialCID(credentialHash);
  } catch (error) {
    throw new Error(`Failed to get CID: ${error.message}`);
  }
};

export const getMerkleRoot = async (provider) => {
  try {
    const contract = getRegistryContract(provider);
    return await contract.getMerkleRoot();
  } catch (error) {
    throw new Error(`Failed to get Merkle root: ${error.message}`);
  }
};

export const getAdmin = async (provider) => {
  try {
    const contract = getRegistryContract(provider);
    return await contract.admin();
  } catch (error) {
    throw new Error(`Failed to get admin: ${error.message}`);
  }
};

export const getVerificationRecord = async (credentialHash, provider) => {
  try {
    const contract = getRegistryContract(provider);
    const record = await contract.getVerificationRecord(credentialHash);
    return {
      verifier: record.verifier,
      timestamp: new Date(record.timestamp.toNumber() * 1000).toISOString(),
      mode: record.mode === 0 ? 'STANDARD' : 'ZK_PROOF',
      isValid: record.isValid
    };
  } catch (error) {
    throw new Error(`Failed to get verification record: ${error.message}`);
  }
};

// ============ MERKLE PROOF (CLIENT-SIDE) ============

export const getMerkleProof = async (credentialHash, provider) => {
  try {
    const contract = getRegistryContract(provider);

    const filter = contract.filters.CredentialAdded();
    const events = await contract.queryFilter(filter, 0, 'latest');

    if (events.length === 0) {
      throw new Error('No credentials found on-chain. The registry may be empty.');
    }

    const leaves = events.map(e => bytes32ToBigInt(e.args.credentialHash));
    console.log(`[getMerkleProof] Rebuilding tree from ${leaves.length} leaves:`, leaves);

    const treeData = await buildMerkleTree(leaves);
    console.log('[getMerkleProof] Computed root:', treeData.root);

    const targetLeaf = bytes32ToBigInt(credentialHash);
    console.log('[getMerkleProof] All leaves:', leaves);
    console.log('[getMerkleProof] Target leaf:', targetLeaf);
    console.log('[getMerkleProof] Target found:', leaves.includes(targetLeaf));

    const rawProof = generateProofByCredentialId(treeData, targetLeaf);

    const onChainRoot = await contract.getMerkleRoot();
    const onChainRootBigInt = BigInt(onChainRoot).toString();
    console.log('[getMerkleProof] On-chain root:', onChainRootBigInt);
    console.log('[getMerkleProof] Computed root:', treeData.root);
    console.log('[getMerkleProof] Roots match:', treeData.root === onChainRootBigInt);

    if (treeData.root !== onChainRootBigInt) {
      throw new Error(
        'Computed Merkle root does not match the on-chain root. ' +
        'The admin may not have called updateMerkleRoot after adding credentials.'
      );
    }

    const proof = formatProofForCircuit(rawProof);
    console.log('[getMerkleProof] Full proof:', JSON.stringify(proof));
    console.log('[getMerkleProof] Proof root:', proof.root);
    return proof;

  } catch (error) {
    console.error('[getMerkleProof] Error:', error);
    throw error;
  }
};

// ============ GAS ESTIMATION ============

export const estimateAddCredentialGas = async (credentialHash, ipfsCID, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const gasEstimate = await contract.estimateGas.addCredential(credentialHash, ipfsCID);
    return gasEstimate.toString();
  } catch (error) {
    return '100000';
  }
};

export const estimateVerifyStandardGas = async (credentialHash, ipfsCID, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const gasEstimate = await contract.estimateGas.verifyStandard(credentialHash, ipfsCID);
    return gasEstimate.toString();
  } catch (error) {
    return '50000';
  }
};

export const estimateVerifyZKGas = async (pA, pB, pC, pubSignals, signer) => {
  try {
    const contract = getRegistryContract(signer);
    const gasEstimate = await contract.estimateGas.verifyWithZKProof(pA, pB, pC, pubSignals);
    return gasEstimate.toString();
  } catch (error) {
    return '300000';
  }
};