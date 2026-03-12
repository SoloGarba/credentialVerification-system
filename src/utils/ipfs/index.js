/**
 * frontend/src/utils/ipfs/index.js
 * 
 * Central export for IPFS utilities
 */

export {
  uploadFile,
  uploadMultipleFiles,
  uploadJSON,
  uploadCredentialCertificate,
  getIPFSUrl,
  validateFile
} from './upload.js';

export {
  downloadFile,
  getFileAsBlob,
  getJSON,
  getFileAsDataURL,
  downloadCredentialCertificate,
  triggerDownload,
  getGatewayUrl,
  checkCIDAccessible,
  getFileMetadata,
  getImagePreview
} from './download.js';

export {
  pinCID,
  unpinCID,
  listPinnedFiles,
  isCIDPinned,
  updatePinMetadata,
  getPinStatus,
  batchPinCIDs,
  getPinningStats
} from './pin.js';