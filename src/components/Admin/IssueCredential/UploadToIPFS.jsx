/**
 * frontend/src/components/Admin/IssueCredential/UploadToIPFS.jsx
 * 
 * Upload credential certificate to IPFS
 */

import React from 'react';
import IPFSUploader from '../../Common/IPFSUploader';

const UploadToIPFS = ({ credentialData, onComplete, onBack }) => {
  const handleUploadComplete = (cid, file) => {
    console.log('Uploaded to IPFS:', cid);
    onComplete(cid);
  };

  return (
    <div className="upload-to-ipfs">
      <h2>Step 2: Upload Certificate to IPFS</h2>
      <p>Upload the PDF certificate for {credentialData.studentName}</p>

      <div className="credential-summary">
        <h3>Credential Summary:</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Student:</label>
            <span>{credentialData.studentName}</span>
          </div>
          <div className="summary-item">
            <label>Degree:</label>
            <span>{credentialData.degree} in {credentialData.major}</span>
          </div>
          <div className="summary-item">
            <label>Graduation:</label>
            <span>{new Date(credentialData.graduationDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <IPFSUploader 
        onUploadComplete={handleUploadComplete}
        allowedTypes={['application/pdf']}
        maxSize={10 * 1024 * 1024}
        label="Upload Certificate (PDF)"
      />

      <div className="form-actions">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
      </div>
    </div>
  );
};

export default UploadToIPFS;