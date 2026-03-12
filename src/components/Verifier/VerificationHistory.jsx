/**
 * frontend/src/components/Verifier/VerificationHistory.jsx
 * 
 * View past credential verifications
 */

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import '../../styles/verifier.css';

const VerificationHistory = () => {
  const { account, isConnected } = useWalletContext();
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'valid', 'invalid'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'oldest'

  useEffect(() => {
    loadVerifications();
  }, [account]);

  const loadVerifications = () => {
    // Load from localStorage
    const saved = localStorage.getItem('verificationHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter by current account
        const userVerifications = parsed.filter(v => 
          v.verifier?.toLowerCase() === account?.toLowerCase()
        );
        setVerifications(userVerifications);
      } catch (err) {
        console.error('Failed to load history:', err);
        setVerifications([]);
      }
    }
  };

  const getFilteredVerifications = () => {
    let filtered = [...verifications];

    // Apply filter
    if (filter === 'valid') {
      filtered = filtered.filter(v => v.isValid);
    } else if (filter === 'invalid') {
      filtered = filtered.filter(v => !v.isValid);
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your verification history?')) {
      // Remove only current user's verifications
      const allVerifications = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      const otherVerifications = allVerifications.filter(v => 
        v.verifier?.toLowerCase() !== account?.toLowerCase()
      );
      localStorage.setItem('verificationHistory', JSON.stringify(otherVerifications));
      setVerifications([]);
    }
  };

  const handleViewTransaction = (txHash) => {
    window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
  };

  const handleViewOnIPFS = (ipfsCID) => {
    window.open(`https://gateway.pinata.cloud/ipfs/${ipfsCID}`, '_blank');
  };

  const filteredVerifications = getFilteredVerifications();

  if (!isConnected) {
    return (
      <div className="verification-history-page">
        <div className="page-header">
          <h1>📊 Verification History</h1>
          <p>View your past credential verifications</p>
        </div>
        <div className="alert alert-warning">
          Please connect your wallet to view your verification history.
        </div>
      </div>
    );
  }

  return (
    <div className="verification-history-page">
      <div className="page-header">
        <div>
          <h1>📊 Verification History</h1>
          <p>View and manage your past credential verifications</p>
        </div>
        {verifications.length > 0 && (
          <button onClick={handleClearHistory} className="btn btn-secondary">
            Clear History
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{verifications.length}</div>
            <div className="stat-label">Total Verifications</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {verifications.filter(v => v.isValid).length}
            </div>
            <div className="stat-label">Valid Credentials</div>
          </div>
        </div>

        <div className="stat-card error">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">
              {verifications.filter(v => !v.isValid).length}
            </div>
            <div className="stat-label">Invalid Attempts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔒</div>
          <div className="stat-content">
            <div className="stat-value">
              {verifications.filter(v => v.mode === 'zk').length}
            </div>
            <div className="stat-label">ZK Verifications</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {verifications.length > 0 && (
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({verifications.length})
              </button>
              <button
                className={`filter-btn ${filter === 'valid' ? 'active' : ''}`}
                onClick={() => setFilter('valid')}
              >
                Valid ({verifications.filter(v => v.isValid).length})
              </button>
              <button
                className={`filter-btn ${filter === 'invalid' ? 'active' : ''}`}
                onClick={() => setFilter('invalid')}
              >
                Invalid ({verifications.filter(v => !v.isValid).length})
              </button>
            </div>
          </div>

          <div className="sort-group">
            <label>Sort:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {/* History List */}
      {verifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Verifications Yet</h3>
          <p>Your verification history will appear here after you verify credentials.</p>
          <a href="/verifier" className="btn btn-primary">
            Verify a Credential
          </a>
        </div>
      ) : filteredVerifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Results</h3>
          <p>No verifications match your current filter.</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredVerifications.map((verification, index) => (
            <div key={index} className={`history-item ${verification.isValid ? 'valid' : 'invalid'}`}>
              <div className="history-header">
                <div className="status-indicator">
                  {verification.isValid ? (
                    <span className="status-icon valid">✅</span>
                  ) : (
                    <span className="status-icon invalid">❌</span>
                  )}
                  <div className="status-text">
                    <strong>
                      {verification.isValid ? 'Valid Credential' : 'Invalid Credential'}
                    </strong>
                    <span className="timestamp">
                      {new Date(verification.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mode-badge">
                  {verification.mode === 'standard' ? '📋 Standard' : '🔒 Zero-Knowledge'}
                </div>
              </div>

              <div className="history-details">
                {verification.mode === 'standard' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Credential Hash:</span>
                      <code className="detail-value">
                        {verification.credentialHash?.slice(0, 20)}...
                        {verification.credentialHash?.slice(-10)}
                      </code>
                    </div>

                    {verification.ipfsCID && (
                      <div className="detail-row">
                        <span className="detail-label">IPFS CID:</span>
                        <code className="detail-value">{verification.ipfsCID}</code>
                      </div>
                    )}
                  </>
                )}

                {verification.mode === 'zk' && (
                  <div className="detail-row">
                    <span className="detail-label">Verification Type:</span>
                    <span className="detail-value">Privacy-Preserving (No details revealed)</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">Transaction Hash:</span>
                  <code className="detail-value">
                    {verification.txHash?.slice(0, 20)}...{verification.txHash?.slice(-10)}
                  </code>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Gas Used:</span>
                  <span className="detail-value">{verification.gasUsed || 'N/A'}</span>
                </div>
              </div>

              <div className="history-actions">
                <button
                  onClick={() => handleViewTransaction(verification.txHash)}
                  className="btn-link"
                >
                  View on Etherscan →
                </button>
                {verification.ipfsCID && (
                  <button
                    onClick={() => handleViewOnIPFS(verification.ipfsCID)}
                    className="btn-link"
                  >
                    View Certificate →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      {verifications.length > 0 && (
        <div className="info-banner">
          <strong>ℹ️ About Your History:</strong>
          <p>
            Your verification history is stored locally in your browser. 
            It will be cleared if you clear your browser data. 
            For permanent records, always check the blockchain via Etherscan.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationHistory;