/**
 * frontend/src/utils/ipfs/upload.js
 * 
 * Upload files to IPFS using web3.storage or Pinata
 */

// Using Pinata as the IPFS provider
import axios from 'axios';

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET = process.env.REACT_APP_PINATA_SECRET;

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
  
  throw new Error('Pinata credentials not found. Set REACT_APP_PINATA_JWT in .env');
};

/**
 * Upload a file to IPFS using Pinata
 * @param {File} file - File object from input
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<string>} IPFS CID
 */
export const uploadFile = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);
    
    const headers = getPinataHeaders();
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data`,
          ...headers
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        }
      }
    );
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Pinata upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to IPFS using Pinata
 * @param {FileList|Array<File>} files - Array of files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array<string>>} Array of IPFS CIDs
 */
export const uploadMultipleFiles = async (files, onProgress) => {
  try {
    const cids = [];
    const totalFiles = files.length;
    
    for (let i = 0; i < totalFiles; i++) {
      const cid = await uploadFile(files[i], (fileProgress) => {
        if (onProgress) {
          const totalProgress = ((i + (fileProgress / 100)) / totalFiles) * 100;
          onProgress(totalProgress);
        }
      });
      cids.push(cid);
    }
    
    return cids;
  } catch (error) {
    console.error('IPFS multi-upload error:', error);
    throw new Error(`Failed to upload files: ${error.message}`);
  }
};

/**
 * Upload JSON data to IPFS using Pinata
 * @param {Object} data - JSON data
 * @param {string} filename - Filename for the JSON
 * @returns {Promise<string>} IPFS CID
 */
export const uploadJSON = async (data, filename = 'data.json') => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const file = new File([blob], filename);
    
    return await uploadFile(file);
  } catch (error) {
    console.error('IPFS JSON upload error:', error);
    throw new Error(`Failed to upload JSON: ${error.message}`);
  }
};

/**
 * Upload credential certificate (PDF) with metadata using Pinata
 * @param {File} pdfFile - Certificate PDF
 * @param {Object} metadata - Credential metadata
 * @returns {Promise<Object>} CID and metadata
 */
export const uploadCredentialCertificate = async (pdfFile, metadata) => {
  try {
    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }
    
    // Upload PDF
    const cid = await uploadFile(pdfFile);
    
    // Also upload metadata separately
    const metadataCid = await uploadJSON(metadata, 'metadata.json');
    
    return {
      certificateCID: cid,
      metadataCID: metadataCid,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Credential upload error:', error);
    throw new Error(`Failed to upload credential: ${error.message}`);
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS CID
 * @param {string} filename - Optional filename
 * @returns {string} Gateway URL
 */
export const getIPFSUrl = (cid, filename = '') => {
  // Use Pinata gateway
  const baseUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
  return filename ? `${baseUrl}/${filename}` : baseUrl;
};


// Remove the old Pinata alternative section since we're using it as primary now

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
  } = options;
  
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
  }
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};