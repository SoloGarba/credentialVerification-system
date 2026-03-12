/**
 * frontend/src/utils/ipfs/download.js
 * 
 * Download and retrieve files from IPFS
 */

import { Web3Storage } from 'web3.storage';

const WEB3_STORAGE_TOKEN = process.env.REACT_APP_WEB3_STORAGE_TOKEN;

/**
 * Get Web3Storage client
 */
const getClient = () => {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('Web3.Storage token not found');
  }
  return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
};

/**
 * Download file from IPFS by CID
 * @param {string} cid - IPFS CID
 * @returns {Promise<Response>} Response object
 */
export const downloadFile = async (cid) => {
  try {
    const client = getClient();
    const res = await client.get(cid);
    
    if (!res.ok) {
      throw new Error(`Failed to get ${cid}: ${res.status}`);
    }
    
    return res;
  } catch (error) {
    console.error('IPFS download error:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Get file as Blob
 * @param {string} cid - IPFS CID
 * @param {string} filename - Specific filename if CID is a directory
 * @returns {Promise<Blob>} File blob
 */
export const getFileAsBlob = async (cid, filename = null) => {
  try {
    const res = await downloadFile(cid);
    const files = await res.files();
    
    if (filename) {
      // Find specific file in directory
      const file = files.find(f => f.name === filename);
      if (!file) {
        throw new Error(`File ${filename} not found in CID ${cid}`);
      }
      return file;
    }
    
    // Return first file if no filename specified
    return files[0];
  } catch (error) {
    console.error('Get blob error:', error);
    throw new Error(`Failed to get file as blob: ${error.message}`);
  }
};

/**
 * Get JSON data from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} Parsed JSON data
 */
export const getJSON = async (cid) => {
  try {
    const file = await getFileAsBlob(cid);
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Get JSON error:', error);
    throw new Error(`Failed to get JSON: ${error.message}`);
  }
};

/**
 * Get file as Data URL (for display in browser)
 * @param {string} cid - IPFS CID
 * @param {string} filename - Optional filename
 * @returns {Promise<string>} Data URL
 */
export const getFileAsDataURL = async (cid, filename = null) => {
  try {
    const file = await getFileAsBlob(cid, filename);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Get data URL error:', error);
    throw new Error(`Failed to get data URL: ${error.message}`);
  }
};

/**
 * Download credential certificate (PDF)
 * @param {string} cid - Certificate CID
 * @returns {Promise<Blob>} PDF blob
 */
export const downloadCredentialCertificate = async (cid) => {
  try {
    const file = await getFileAsBlob(cid);
    
    // Validate it's a PDF
    if (file.type !== 'application/pdf') {
      console.warn(`Expected PDF but got ${file.type}`);
    }
    
    return file;
  } catch (error) {
    console.error('Download certificate error:', error);
    throw new Error(`Failed to download certificate: ${error.message}`);
  }
};

/**
 * Trigger browser download for a file
 * @param {string} cid - IPFS CID
 * @param {string} filename - Download filename
 */
export const triggerDownload = async (cid, filename = 'download') => {
  try {
    const file = await getFileAsBlob(cid);
    const url = URL.createObjectURL(file);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Trigger download error:', error);
    throw new Error(`Failed to trigger download: ${error.message}`);
  }
};

/**
 * Get IPFS gateway URL
 * @param {string} cid - IPFS CID
 * @param {string} filename - Optional filename
 * @returns {string} Gateway URL
 */
export const getGatewayUrl = (cid, filename = '') => {
  // Use multiple gateways for redundancy
  const gateways = [
    `https://${cid}.ipfs.w3s.link`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`
  ];
  
  // Return primary gateway with filename
  const baseUrl = gateways[0];
  return filename ? `${baseUrl}/${filename}` : baseUrl;
};

/**
 * Check if CID is accessible (file exists)
 * @param {string} cid - IPFS CID
 * @returns {Promise<boolean>} True if accessible
 */
export const checkCIDAccessible = async (cid) => {
  try {
    const url = getGatewayUrl(cid);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get file metadata without downloading entire file
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (cid) => {
  try {
    const res = await downloadFile(cid);
    const files = await res.files();
    
    return files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      cid: file.cid
    }));
  } catch (error) {
    console.error('Get metadata error:', error);
    throw new Error(`Failed to get metadata: ${error.message}`);
  }
};

/**
 * Preview image from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<string>} Image URL for <img> src
 */
export const getImagePreview = async (cid) => {
  try {
    const file = await getFileAsBlob(cid);
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }
    
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Get image preview error:', error);
    throw new Error(`Failed to get image preview: ${error.message}`);
  }
};