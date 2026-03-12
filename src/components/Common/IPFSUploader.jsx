/**
 * frontend/src/components/Common/IPFSUploader.jsx
 * 
 * Reusable IPFS file uploader component
 */

import React, { useState } from 'react';
import { useIPFS } from '../../hooks/useIPFS';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';

const IPFSUploader = ({ 
  onUploadComplete, 
  allowedTypes = ['application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  label = 'Upload File'
}) => {
  const { upload, uploading, progress, error, cid, clearError } = useIPFS();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }
      
      // Validate file size
      if (file.size > maxSize) {
        alert(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const uploadedCid = await upload(selectedFile);
    
    if (uploadedCid && onUploadComplete) {
      onUploadComplete(uploadedCid, selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect({ target: { files: [file] } });
    }
  };

  return (
    <div className="ipfs-uploader">
      <h3>{label}</h3>
      
      {/* Drag & Drop Area */}
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <div className="upload-icon">📁</div>
            <p>Drag & drop your file here, or</p>
            <label className="file-input-label">
              <input 
                type="file" 
                onChange={handleFileSelect}
                accept={allowedTypes.join(',')}
                className="file-input"
              />
              <span className="file-input-button">Browse Files</span>
            </label>
            <p className="upload-hint">
              Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </>
        ) : (
          <div className="file-selected">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button 
              className="remove-file-btn"
              onClick={() => setSelectedFile(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && !uploading && !cid && (
        <button 
          className="upload-btn"
          onClick={handleUpload}
        >
          📤 Upload to IPFS
        </button>
      )}

      {/* Progress */}
      {uploading && (
        <div className="upload-progress">
          <LoadingSpinner message="Uploading to IPFS..." />
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{progress.toFixed(0)}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorMessage 
          error={error}
          onDismiss={clearError}
        />
      )}

      {/* Success */}
      {cid && (
        <SuccessMessage 
          message="File uploaded successfully!"
        />
      )}

      {/* CID Display */}
      {cid && (
        <div className="cid-display">
          <label>IPFS CID:</label>
          <div className="cid-box">
            <code>{cid}</code>
            <button 
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(cid)}
            >
              📋 Copy
            </button>
          </div>
          <a 
            href={`https://ipfs.io/ipfs/${cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ipfs-link"
          >
            View on IPFS ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default IPFSUploader;