/**
 * frontend/src/components/Students/MyCredentials.jsx
 *
 * Students enter their IPFS CID to view their credential details.
 * Credentials are saved locally so they don't need to re-enter each time.
 */

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { useContractContext } from '../../context/ContractContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/student.css';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';
const STORAGE_KEY = 'my_credentials';

const MyCredentials = () => {
  const { account, isConnected } = useWalletContext();
  const { checkCredentialExists } = useContractContext();

  const [credentials, setCredentials] = useState([]);
  const [cidInput, setCidInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCredentials(JSON.parse(saved));
  }, []);

  const saveCredentials = (creds) => {
    setCredentials(creds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  };

  /**
   * Fetch credential metadata from IPFS using CID.
   * First gets zkDataCID from Pinata keyvalues, then fetches the JSON.
   */
  const fetchCredentialByCID = async (pdfCID) => {
    const JWT = process.env.REACT_APP_PINATA_JWT;
    if (!JWT) throw new Error('Pinata JWT not configured.');

    // Get zkDataCID from Pinata pin metadata
    const res = await fetch(
      `https://api.pinata.cloud/data/pinList?status=pinned&hashContains=${pdfCID}`,
      { headers: { Authorization: `Bearer ${JWT}` } }
    );
    if (!res.ok) throw new Error('Failed to query Pinata.');

    const data = await res.json();
    const pin = data.rows?.[0];
    if (!pin) throw new Error('CID not found. Make sure you entered the correct CID.');

    const zkDataCID = pin.metadata?.keyvalues?.zkDataCID;
    const credentialHash = pin.metadata?.keyvalues?.credentialHash;

    if (!zkDataCID) {
      throw new Error('This credential was issued before ZK support. Ask your admin to re-issue it.');
    }

    // Fetch full metadata JSON from IPFS
    const jsonRes = await fetch(`${IPFS_GATEWAY}/${zkDataCID}`);
    if (!jsonRes.ok) throw new Error('Failed to fetch credential data from IPFS.');
    const metadata = await jsonRes.json();

    return {
      ipfsCID: pdfCID,
      zkDataCID,
      credentialHash: metadata.credentialHash || credentialHash,
      studentName: metadata.studentName,
      studentId: metadata.studentId,
      degree: metadata.degree,
      institution: metadata.institution,
      graduationDate: metadata.graduationDate,
      gpa: metadata.gpa,
      addedAt: new Date().toISOString(),
    };
  };

  const handleAddCredential = async (e) => {
    e.preventDefault();
    if (!cidInput.trim()) return;

    setFetching(true);
    setFetchError(null);

    try {
      // Check if already added
      if (credentials.find(c => c.ipfsCID === cidInput.trim())) {
        setFetchError('This credential has already been added.');
        return;
      }

      const cred = await fetchCredentialByCID(cidInput.trim());

      // Verify it exists on-chain
      const exists = await checkCredentialExists(cred.credentialHash);
      if (!exists) {
        setFetchError('This credential hash is not registered on the blockchain.');
        return;
      }

      const updated = [...credentials, cred];
      saveCredentials(updated);
      setCidInput('');
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleRemove = (ipfsCID) => {
    const updated = credentials.filter(c => c.ipfsCID !== ipfsCID);
    saveCredentials(updated);
  };

  const handleViewOnIPFS = (ipfsCID) => {
    window.open(`${IPFS_GATEWAY}/${ipfsCID}`, '_blank');
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    alert('Hash copied to clipboard!');
  };

  if (!isConnected) {
    return (
      <div className="my-credentials-page">
        <div className="page-header">
          <h1>📜 My Credentials</h1>
          <p>View and manage your academic credentials</p>
        </div>
        <div className="alert alert-warning">Please connect your wallet to view your credentials.</div>
      </div>
    );
  }

  if (fetching) {
    return <LoadingSpinner message="Fetching credential from IPFS..." />;
  }

  return (
    <div className="my-credentials-page">
      <div className="page-header">
        <h1>📜 My Credentials</h1>
        <p>View and manage your academic credentials</p>
      </div>

      {/* Add Credential Section */}
      <div className="search-section">
        <h3>➕ Add a Credential</h3>
        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Enter the IPFS CID your institution gave you when your credential was issued.
        </p>
        <form onSubmit={handleAddCredential} className="search-form">
          <input
            type="text"
            value={cidInput}
            onChange={(e) => setCidInput(e.target.value)}
            placeholder="Enter your IPFS CID (bafybeih...)"
            className="search-input"
          />
          <button type="submit" className="btn btn-primary" disabled={fetching}>
            Add Credential
          </button>
        </form>

        {fetchError && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {fetchError}
          </div>
        )}
      </div>

      {/* Credentials List */}
      <div className="credentials-section">
        <div className="section-header">
          <h3>Your Credentials</h3>
          <span className="credential-count">
            {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
          </span>
        </div>

        {credentials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>No Credentials Yet</h4>
            <p>Add your first credential using the IPFS CID from your institution.</p>
            <p className="empty-note">
              Your credentials are stored locally in your browser — they won't be lost on refresh.
            </p>
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((cred, index) => (
              <div key={index} className="credential-card">
                <div className="card-header">
                  <div className="card-icon">🎓</div>
                  <span className="status-badge verified">✓ Verified</span>
                </div>

                <div className="card-content">
                  <h4>{cred.degree || 'Unknown Degree'}</h4>
                  <p className="institution">{cred.institution || 'Unknown Institution'}</p>

                  <div className="credential-meta">
                    <div className="meta-item">
                      <span className="meta-label">Student:</span>
                      <span className="meta-value">{cred.studentName || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">ID:</span>
                      <span className="meta-value">{cred.studentId || 'N/A'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Graduation:</span>
                      <span className="meta-value">
                        {cred.graduationDate
                          ? new Date(cred.graduationDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    {cred.gpa && (
                      <div className="meta-item">
                        <span className="meta-label">GPA:</span>
                        <span className="meta-value">{cred.gpa}</span>
                      </div>
                    )}
                  </div>

                  <div className="credential-hash">
                    <label>Credential Hash:</label>
                    <code>{cred.credentialHash?.slice(0, 20)}...{cred.credentialHash?.slice(-10)}</code>
                  </div>

                  <div className="credential-hash">
                    <label>IPFS CID:</label>
                    <code>{cred.ipfsCID?.slice(0, 20)}...</code>
                  </div>
                </div>

                <div className="card-actions">
                  <button onClick={() => handleViewOnIPFS(cred.ipfsCID)} className="btn btn-secondary btn-small">
                    👁️ View
                  </button>
                  <button onClick={() => handleCopyHash(cred.credentialHash)} className="btn btn-secondary btn-small">
                    📋 Copy Hash
                  </button>
                  <button onClick={() => handleRemove(cred.ipfsCID)} className="btn btn-danger btn-small">
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Use */}
      <div className="info-section">
        <h3>ℹ️ How to Use Your Credentials</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">➕</div>
            <h4>Add</h4>
            <p>Paste the CID from your institution to add your credential here</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h4>ZK Proof</h4>
            <p>Use your CID on the Generate ZK Proof page for privacy-preserving verification</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📥</div>
            <h4>Download</h4>
            <p>View or download your certificate PDF directly from IPFS</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📋</div>
            <h4>Share</h4>
            <p>Copy your credential hash to share with verifiers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCredentials;