/**
 * frontend/src/components/Admin/ViewIssuedCredentials.jsx
 * 
 * Detailed view of issued credentials with export functionality
 */

import React, { useState, useEffect } from 'react';

const ViewIssuedCredentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('issuedCredentials');
    if (stored) {
      setCredentials(JSON.parse(stored));
    }
  }, []);

  const exportCredentials = () => {
    const dataStr = JSON.stringify(credentials, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credentials-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="view-issued-credentials">
      <div className="page-header">
        <h1>📜 Issued Credentials</h1>
        <button onClick={exportCredentials} className="btn-secondary">
          📥 Export All
        </button>
      </div>

      {credentials.length === 0 ? (
        <div className="empty-state">
          <p>No credentials issued yet</p>
        </div>
      ) : (
        <div className="credentials-grid">
          {credentials.map((cred, index) => (
            <div 
              key={index} 
              className="credential-card"
              onClick={() => setSelectedCredential(cred)}
            >
              <div className="card-header">
                <h3>{cred.studentName}</h3>
                <span className="credential-id">#{cred.credentialId}</span>
              </div>
              <div className="card-body">
                <p><strong>Degree:</strong> {cred.degree}</p>
                <p><strong>Major:</strong> {cred.major}</p>
                <p><strong>Issued:</strong> {new Date(cred.issuedDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCredential && (
        <div className="modal-overlay" onClick={() => setSelectedCredential(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Credential Details</h2>
            <div className="detail-grid">
              <div><strong>Student:</strong> {selectedCredential.studentName}</div>
              <div><strong>Email:</strong> {selectedCredential.studentEmail}</div>
              <div><strong>Degree:</strong> {selectedCredential.degree}</div>
              <div><strong>IPFS CID:</strong> <code>{selectedCredential.ipfsCID}</code></div>
            </div>
            <button onClick={() => setSelectedCredential(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewIssuedCredentials;