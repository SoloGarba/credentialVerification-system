/**
 * frontend/src/components/Admin/ManageCredentials.jsx
 * 
 * Admin page to view all issued credentials and update Merkle root.
 * Includes credential revocation via revokeCredential().
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useContractContext } from '../../context/ContractContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { getIssuedCredentials, getCachedOrFetch } from '../../utils/parseBlockchainEvents';
import '../../styles/admin.css';
import { buildMerkleTree } from '../../utils/merkle/builder.js';
import { bytes32ToBigInt, hashToBytes32 } from '../../utils/crypto/poseidon.js';
import { getRegistryContract } from '../../utils/web3/registry.js';

const ManageCredentials = () => {
  const navigate = useNavigate();
  const { account, provider: walletProvider } = useWalletContext();
  const { 
    getMerkleRoot, 
    updateMerkleRoot,
    revokeCredential,
    checkCredentialExists,
    getCredentialCID,
    loading, 
    error, 
    txHash 
  } = useContractContext();

  const [currentRoot, setCurrentRoot]           = useState('');
  const [newRoot, setNewRoot]                   = useState('');
  const [credentials, setCredentials]           = useState([]);
  const [generating, setGenerating]             = useState(false);
  const [showUpdateModal, setShowUpdateModal]   = useState(false);
  const [updateSuccess, setUpdateSuccess]       = useState(false);
  const [searchHash, setSearchHash]             = useState('');
  const [searchLoading, setSearchLoading]       = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [useBlockchain, setUseBlockchain]       = useState(true);

  // Revocation state
  const [revokingHash, setRevokingHash]         = useState(null);   // hash currently being revoked
  const [revokedHashes, setRevokedHashes]       = useState(new Set()); // locally confirmed revocations
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(null); // hash pending confirmation

  useEffect(() => {
    loadMerkleRoot();
    loadCredentials();
  }, [account, useBlockchain]);

  const loadCredentials = async () => {
    setLoadingCredentials(true);
    try {
      if (useBlockchain) {
        const blockchainCredentials = await getCachedOrFetch(
          `credentials_${account}`,
          () => getIssuedCredentials(account)
        );
        console.log(`Loaded ${blockchainCredentials.length} credentials from blockchain`);
        setCredentials(blockchainCredentials);
      } else {
        const savedCredentials = localStorage.getItem('issuedCredentials');
        setCredentials(savedCredentials ? JSON.parse(savedCredentials) : []);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      const savedCredentials = localStorage.getItem('issuedCredentials');
      setCredentials(savedCredentials ? JSON.parse(savedCredentials) : []);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const loadMerkleRoot = async () => {
    try {
      const root = await getMerkleRoot();
      setCurrentRoot(root);
    } catch (err) {
      console.error('Failed to load Merkle root:', err);
    }
  };

  const handleUpdateRoot = async (e) => {
    e.preventDefault();
    if (!newRoot || newRoot.length !== 66 || !newRoot.startsWith('0x')) {
      alert('Please enter a valid Merkle root (0x followed by 64 hex characters)');
      return;
    }
    try {
      const result = await updateMerkleRoot(newRoot);
      if (result && result.success) {
        setUpdateSuccess(true);
        setCurrentRoot(newRoot);
        setNewRoot('');
        setTimeout(() => { setShowUpdateModal(false); setUpdateSuccess(false); }, 3000);
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchHash) { alert('Please enter a credential hash'); return; }
    setSearchLoading(true);
    try {
      const exists = await checkCredentialExists(searchHash);
      if (exists) {
        const cid = await getCredentialCID(searchHash);
        alert(`Credential found!\nHash: ${searchHash}\nIPFS CID: ${cid}`);
      } else {
        alert('Credential not found in registry');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateRoot = async () => {
    try {
      setGenerating(true);
      const contract = getRegistryContract(walletProvider);
      const filter = contract.filters.CredentialAdded();
      const events = await contract.queryFilter(filter, 0, 'latest');
      if (events.length === 0) { alert('No credentials found on-chain.'); return; }
      const leaves = events.map(e => bytes32ToBigInt(e.args.credentialHash));
      const treeData = await buildMerkleTree(leaves);
      setNewRoot(hashToBytes32(treeData.root));
    } catch (err) {
      console.error('Failed to generate root:', err);
      alert('Failed to generate root: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Revocation ────────────────────────────────────────────────────────────

  const handleRevokeClick = (hash) => {
    // Show confirmation dialog before sending the transaction
    setShowRevokeConfirm(hash);
  };

  const handleRevokeConfirm = async () => {
    const hash = showRevokeConfirm;
    setShowRevokeConfirm(null);
    setRevokingHash(hash);

    try {
      const result = await revokeCredential(hash);
      if (result) {
        // Mark as revoked locally so the UI updates immediately
        setRevokedHashes(prev => new Set([...prev, hash]));

        // Also update localStorage if the credential is stored there
        const saved = JSON.parse(localStorage.getItem('issuedCredentials') || '[]');
        const updated = saved.map(c =>
          (c.hash === hash || c.credential_hash === hash)
            ? { ...c, status: 'revoked' }
            : c
        );
        localStorage.setItem('issuedCredentials', JSON.stringify(updated));

        alert('✅ Credential revoked successfully. Standard verification will now return invalid for this credential.');
      }
    } catch (err) {
      console.error('Revocation error:', err);
      alert('Failed to revoke credential: ' + err.message);
    } finally {
      setRevokingHash(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isCredentialRevoked = (cred) => {
    const hash = cred.hash || cred.credential_hash;
    return cred.status === 'revoked' || revokedHashes.has(hash);
  };

  const handleViewOnIPFS = (ipfsCID) => {
    window.open(`https://gateway.pinata.cloud/ipfs/${ipfsCID}`, '_blank');
  };

  const handleRefreshFromBlockchain = async () => {
    const cacheKey = `blockchain_cache_credentials_${account}`;
    localStorage.removeItem(cacheKey);
    await loadCredentials();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading && !showUpdateModal) return <LoadingSpinner message="Loading..." />;
  if (loadingCredentials) return <LoadingSpinner message="Loading credentials from blockchain..." />;

  return (
    <div className="manage-credentials-page">

      {/* ── Revoke Confirmation Modal ── */}
      {showRevokeConfirm && (
        <div className="modal-overlay" onClick={() => setShowRevokeConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Revoke Credential</h3>
              <button onClick={() => setShowRevokeConfirm(null)} className="close-btn">×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <p>Are you sure you want to revoke this credential?</p>
              <p style={{ marginTop: '0.5rem' }}><strong>This action is permanent and cannot be undone.</strong></p>
              <code style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', wordBreak: 'break-all', background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                {showRevokeConfirm}
              </code>
              <p style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.85rem' }}>
                Note: Standard verification will return invalid. ZK verification is unaffected by design (the identity is hidden in ZK proofs).
              </p>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowRevokeConfirm(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRevokeConfirm} className="btn" style={{ background: '#dc2626', color: '#fff' }}>
                Revoke Credential
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>📋 Manage Credentials</h1>
          <p>View and manage all issued credentials</p>
          <div className="data-source-indicator">
            {useBlockchain ? (
              <span className="source-badge blockchain">🔗 Loading from Blockchain</span>
            ) : (
              <span className="source-badge local">💾 Loading from Local Storage</span>
            )}
            <button onClick={handleRefreshFromBlockchain} className="btn-link" style={{ marginLeft: '1rem' }}>
              🔄 Refresh
            </button>
          </div>
        </div>
        <button onClick={() => navigate('/admin/issue')} className="btn btn-primary">
          + Issue New Credential
        </button>
      </div>

      {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}

      {/* Merkle Root Section */}
      <div className="merkle-section">
        <div className="merkle-card">
          <div className="merkle-header">
            <h3>🌳 Merkle Root</h3>
            <button onClick={() => setShowUpdateModal(true)} className="btn btn-primary btn-sm">
              Update Root
            </button>
          </div>
          <div className="merkle-display">
            {currentRoot ? (
              <>
                <label>Current Root:</label>
                <code className="root-value">{currentRoot}</code>
                <small className="root-info">Last updated: {new Date().toLocaleString()}</small>
              </>
            ) : (
              <p className="no-root">No Merkle root set yet</p>
            )}
          </div>
          <div className="merkle-info">
            <strong>ℹ️ About Merkle Root:</strong>
            <p>The Merkle root represents all credentials in a single cryptographic hash. Update it after issuing new credentials to enable ZK verification.</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <h3>🔍 Search Credential</h3>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Enter credential hash (0x...)"
            className="search-input"
          />
          <button type="submit" className="btn btn-primary" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Credentials List */}
      <div className="credentials-list-section">
        <div className="section-header">
          <h3>Issued Credentials</h3>
          <span className="count-badge">{credentials.length} total</span>
        </div>

        {credentials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>No Credentials Issued</h4>
            <p>Start by issuing your first credential</p>
            <button onClick={() => navigate('/admin/issue')} className="btn btn-primary">
              Issue First Credential
            </button>
          </div>
        ) : (
          <div className="credentials-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Degree</th>
                  <th>Date</th>
                  <th>Hash</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred, index) => {
                  const hash = cred.hash || cred.credential_hash;
                  const revoked = isCredentialRevoked(cred);
                  const isRevoking = revokingHash === hash;

                  return (
                    <tr key={index} style={{ opacity: revoked ? 0.6 : 1 }}>
                      <td>
                        <div className="student-cell">
                          <strong>{cred.studentName || cred.student_name || 'N/A'}</strong>
                          <small>{cred.studentId || cred.student_id || 'N/A'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="degree-cell">
                          <span>{cred.degree || 'N/A'}</span>
                          <small>{cred.institution || 'N/A'}</small>
                        </div>
                      </td>
                      <td>
                        {cred.date
                          ? new Date(cred.date).toLocaleDateString()
                          : cred.graduationDate
                          ? new Date(cred.graduationDate).toLocaleDateString()
                          : cred.timestamp
                          ? new Date(cred.timestamp).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <code className="hash-cell">
                          {hash?.slice(0, 10)}...{hash?.slice(-8)}
                        </code>
                      </td>
                      <td>
                        <span className={`status-badge ${revoked ? 'revoked' : cred.status || 'active'}`}>
                          {revoked ? '🚫 revoked' : cred.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewOnIPFS(cred.ipfsCID || cred.ipfs_cid)}
                            className="btn-icon"
                            title="View on IPFS"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(hash);
                              alert('Hash copied!');
                            }}
                            className="btn-icon"
                            title="Copy hash"
                          >
                            📋
                          </button>
                          {cred.txHash && (
                            <button
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${cred.txHash}`, '_blank')}
                              className="btn-icon"
                              title="View transaction"
                            >
                              🔗
                            </button>
                          )}
                          {/* Revoke button — hidden once already revoked */}
                          {!revoked && (
                            <button
                              onClick={() => handleRevokeClick(hash)}
                              disabled={isRevoking}
                              className="btn-icon"
                              title="Revoke credential"
                              style={{ color: '#dc2626' }}
                            >
                              {isRevoking ? '⏳' : '🚫'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Merkle Root Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {updateSuccess ? (
              <div className="success-modal">
                <div className="success-icon">✅</div>
                <h3>Merkle Root Updated!</h3>
                <p>The new Merkle root has been set successfully.</p>
                <p className="tx-hash">Transaction: <code>{txHash}</code></p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Update Merkle Root</h3>
                  <button onClick={() => setShowUpdateModal(false)} className="close-btn">×</button>
                </div>
                <form onSubmit={handleUpdateRoot} className="modal-form">
                  <div className="form-group">
                    <label>Current Root:</label>
                    <code className="current-root-display">{currentRoot || 'Not set'}</code>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newRoot">New Merkle Root *</label>
                    <input
                      type="text"
                      id="newRoot"
                      value={newRoot}
                      onChange={(e) => setNewRoot(e.target.value)}
                      placeholder="0x..."
                      required
                    />
                    <small className="form-help">Enter the new Merkle root (0x followed by 64 hex characters)</small>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={handleGenerateRoot} className="btn btn-secondary" disabled={generating}>
                      {generating ? 'Generating...' : 'Generate Demo Root'}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Root'}
                    </button>
                  </div>
                  <div className="warning-box">
                    <strong>⚠️ Warning:</strong>
                    <p>Updating the Merkle root will affect ZK proof verification. Only update after all new credentials are added.</p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCredentials;