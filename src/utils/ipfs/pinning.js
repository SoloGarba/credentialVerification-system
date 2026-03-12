/**
 * frontend/src/utils/ipfs/pin.js
 * 
 * Pin files to IPFS for persistent storage
 * Using Pinata pinning service
 */

import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET = process.env.REACT_APP_PINATA_SECRET;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

/**
 * Get Pinata auth headers
 */
const getPinataHeaders = () => {
  if (PINATA_JWT) {
    return {
      'Authorization': `Bearer ${PINATA_JWT}`
    };
  }
  
  if (PINATA_API_KEY && PINATA_SECRET) {
    return {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET
    };
  }
  
  throw new Error('Pinata credentials not found in environment variables');
};

/**
 * Pin an existing CID to Pinata
 * @param {string} cid - IPFS CID to pin
 * @param {string} name - Name for the pin
 * @returns {Promise<Object>} Pin status
 */
export const pinCID = async (cid, name = '') => {
  try {
    const headers = getPinataHeaders();
    
    const data = {
      hashToPin: cid,
      pinataMetadata: {
        name: name || `credential-${Date.now()}`,
        keyvalues: {
          type: 'credential',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinByHash',
      data,
      { headers }
    );
    
    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    };
  } catch (error) {
    console.error('Pin CID error:', error);
    throw new Error(`Failed to pin CID: ${error.message}`);
  }
};

/**
 * Unpin a CID from Pinata
 * @param {string} cid - IPFS CID to unpin
 * @returns {Promise<boolean>} Success status
 */
export const unpinCID = async (cid) => {
  try {
    const headers = getPinataHeaders();
    
    await axios.delete(
      `https://api.pinata.cloud/pinning/unpin/${cid}`,
      { headers }
    );
    
    return true;
  } catch (error) {
    console.error('Unpin CID error:', error);
    throw new Error(`Failed to unpin CID: ${error.message}`);
  }
};

/**
 * List all pinned files
 * @returns {Promise<Array>} List of pinned files
 */
export const listPinnedFiles = async () => {
  try {
    const headers = getPinataHeaders();
    
    const response = await axios.get(
      'https://api.pinata.cloud/data/pinList',
      { headers }
    );
    
    return response.data.rows.map(pin => ({
      ipfsHash: pin.ipfs_pin_hash,
      size: pin.size,
      timestamp: pin.date_pinned,
      name: pin.metadata?.name || 'Unnamed',
      metadata: pin.metadata
    }));
  } catch (error) {
    console.error('List pins error:', error);
    throw new Error(`Failed to list pins: ${error.message}`);
  }
};

/**
 * Check if a CID is pinned
 * @param {string} cid - IPFS CID
 * @returns {Promise<boolean>} True if pinned
 */
export const isCIDPinned = async (cid) => {
  try {
    const headers = getPinataHeaders();
    
    const response = await axios.get(
      `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
      { headers }
    );
    
    return response.data.rows.length > 0;
  } catch (error) {
    console.error('Check pin status error:', error);
    return false;
  }
};

/**
 * Update pin metadata
 * @param {string} cid - IPFS CID
 * @param {Object} metadata - New metadata
 * @returns {Promise<boolean>} Success status
 */
export const updatePinMetadata = async (cid, metadata) => {
  try {
    const headers = {
      ...getPinataHeaders(),
      'Content-Type': 'application/json'
    };
    
    const data = {
      ipfsPinHash: cid,
      name: metadata.name,
      keyvalues: metadata.keyvalues || {}
    };
    
    await axios.put(
      'https://api.pinata.cloud/pinning/hashMetadata',
      data,
      { headers }
    );
    
    return true;
  } catch (error) {
    console.error('Update metadata error:', error);
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
};

/**
 * Get pinning status for a CID
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} Pin details
 */
export const getPinStatus = async (cid) => {
  try {
    const headers = getPinataHeaders();
    
    const response = await axios.get(
      `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
      { headers }
    );
    
    if (response.data.rows.length === 0) {
      return {
        isPinned: false,
        cid
      };
    }
    
    const pin = response.data.rows[0];
    
    return {
      isPinned: true,
      cid: pin.ipfs_pin_hash,
      size: pin.size,
      timestamp: pin.date_pinned,
      name: pin.metadata?.name,
      metadata: pin.metadata
    };
  } catch (error) {
    console.error('Get pin status error:', error);
    throw new Error(`Failed to get pin status: ${error.message}`);
  }
};

/**
 * Batch pin multiple CIDs
 * @param {Array<Object>} items - Array of {cid, name}
 * @returns {Promise<Array>} Results for each CID
 */
export const batchPinCIDs = async (items) => {
  const results = [];
  
  for (const item of items) {
    try {
      const result = await pinCID(item.cid, item.name);
      results.push({ ...item, success: true, result });
    } catch (error) {
      results.push({ ...item, success: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * Get account pinning statistics
 * @returns {Promise<Object>} Storage stats
 */
export const getPinningStats = async () => {
  try {
    const pins = await listPinnedFiles();
    
    const totalSize = pins.reduce((acc, pin) => acc + pin.size, 0);
    const totalPins = pins.length;
    
    return {
      totalPins,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      pins
    };
  } catch (error) {
    console.error('Get stats error:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
};