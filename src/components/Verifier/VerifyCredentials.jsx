/**
 * frontend/src/components/Verifier/VerifyCredentials.jsx
 * 
 * Dual verification: Standard (reveals CID) vs ZK (privacy-preserving)
 */

import React, { useState } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { useContractContext } from '../../context/ContractContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/verifier.css';

const VerifyCredentials = () => {
  const { account, isConnected } = useWalletContext();
  const { verifyStandard, verifyWithZKProof, loading, error, txHash } = useContractContext();

  const [mode, setMode] = useState('standard'); // 'standard' or 'zk'
  const [verificationResult, setVerificationResult] = useState(null);

  // Standard verification state
  const [credentialHash, setCredentialHash] = useState('');
  const [ipfsCID, setIpfsCID] = useState('');

  // ZK verification state
  const [zkProof, setZkProof] = useState(null);
  const [proofFile, setProofFile] = useState(null);

  const handleStandardVerify = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!credentialHash || !ipfsCID) {
      alert('Please provide both credential hash and IPFS CID');
      return;
    }

    try {
      const result = await verifyStandard(credentialHash, ipfsCID);
      
      const verificationData = {
        mode: 'standard',
        isValid: result.isValid,
        txHash: result.transactionHash,
        gasUsed: result.gasUsed,
        timestamp: new Date().toISOString(),
        credentialHash,
        ipfsCID,
        verifier: account
      };

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      history.push(verificationData);
      localStorage.setItem('verificationHistory', JSON.stringify(history));

      setVerificationResult(verificationData);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult({
        mode: 'standard',
        isValid: false,
        error: err.message
      });
    }
  };

  const handleZKVerify = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!zkProof) {
      alert('Please upload a ZK proof file');
      return;
    }

    try {
      const { pA, pB, pC, pubSignals } = zkProof;
      
      const result = await verifyWithZKProof(pA, pB, pC, pubSignals);

      if (!result) {
  setVerificationResult({
    mode: 'zk',
    isValid: false,
    error: 'Verification failed. Check the console for details.'
  });
  return;
}
      
      const verificationData = {
        mode: 'zk',
        isValid: result.isValid,
        txHash: result.transactionHash,
        gasUsed: result.gasUsed,
        timestamp: new Date().toISOString(),
        verifier: account
      };

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      history.push(verificationData);
      localStorage.setItem('verificationHistory', JSON.stringify(history));

      setVerificationResult(verificationData);
    } catch (err) {
      console.error('ZK Verification error:', err);
      setVerificationResult({
        mode: 'zk',
        isValid: false,
        error: err.message
      });
    }
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const proof = JSON.parse(event.target.result);
        
        // Validate proof structure
        if (!proof.pA || !proof.pB || !proof.pC || !proof.pubSignals) {
          throw new Error('Invalid proof format');
        }
        
        setZkProof(proof);
        setProofFile(file.name);
      } catch (err) {
        alert('Invalid proof file. Please upload a valid JSON proof.');
        console.error('Proof parse error:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setVerificationResult(null);
    setCredentialHash('');
    setIpfsCID('');
    setZkProof(null);
    setProofFile(null);
  };

  if (loading) {
    return <LoadingSpinner message="Verifying credential..." />;
  }

  return (
    <div className="verify-credentials-page">
      <div className="page-header">
        <h1>✓ Verify Credentials</h1>
        <p>Choose your verification method: Standard or Zero-Knowledge Proof</p>
      </div>

      {!isConnected && (
        <div className="alert alert-warning">
          Please connect your wallet to verify credentials.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
          <div className="result-icon">
            {verificationResult.isValid ? '✅' : '❌'}
          </div>
          <h2>
            {verificationResult.isValid 
              ? 'Credential Verified Successfully!' 
              : 'Verification Failed'
            }
          </h2>
          
          {verificationResult.isValid ? (
            <>
              <p className="result-message">
                This credential is authentic and registered on the blockchain.
              </p>
              
              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">Verification Mode:</span>
                  <span className="detail-value">
                    {verificationResult.mode === 'standard' ? 'Standard (Public)' : 'Zero-Knowledge (Private)'}
                  </span>
                </div>
                
                {verificationResult.mode === 'standard' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Credential Hash:</span>
                      <code className="detail-value">{verificationResult.credentialHash}</code>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">IPFS CID:</span>
                      <code className="detail-value">{verificationResult.ipfsCID}</code>
                    </div>
                  </>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Transaction Hash:</span>
                  <code className="detail-value">{verificationResult.txHash}</code>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Gas Used:</span>
                  <span className="detail-value">{verificationResult.gasUsed}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Verified At:</span>
                  <span className="detail-value">
                    {new Date(verificationResult.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="result-message error-message">
                This credential could not be verified. It may not exist in the registry or the provided information is incorrect.
              </p>
              {verificationResult.error && (
                <p className="error-details">{verificationResult.error}</p>
              )}
            </>
          )}
          
          <button onClick={handleReset} className="btn btn-primary">
            Verify Another Credential
          </button>
        </div>
      )}

      {/* Verification Forms */}
      {!verificationResult && (
        <div className="verify-container">
          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'standard' ? 'active' : ''}`}
              onClick={() => setMode('standard')}
            >
              <div className="mode-icon">📋</div>
              <div className="mode-info">
                <h3>Standard Verification</h3>
                <p>Reveals credential details publicly</p>
                <span className="mode-tag">Lower Gas Cost</span>
              </div>
            </button>

            <button
              className={`mode-btn ${mode === 'zk' ? 'active' : ''}`}
              onClick={() => setMode('zk')}
            >
              <div className="mode-icon">🔒</div>
              <div className="mode-info">
                <h3>Zero-Knowledge Proof</h3>
                <p>Privacy-preserving verification</p>
                <span className="mode-tag">Higher Privacy</span>
              </div>
            </button>
          </div>

          {/* Standard Verification Form */}
          {mode === 'standard' && (
            <form onSubmit={handleStandardVerify} className="verify-form">
              <div className="form-header">
                <h3>📋 Standard Verification</h3>
                <p>Verify by providing the credential hash and IPFS CID</p>
              </div>

              <div className="form-group">
                <label htmlFor="credentialHash">Credential Hash *</label>
                <input
                  type="text"
                  id="credentialHash"
                  value={credentialHash}
                  onChange={(e) => setCredentialHash(e.target.value)}
                  placeholder="0x..."
                  required
                />
                <small className="form-help">
                  The unique hash identifying this credential on the blockchain
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="ipfsCID">IPFS CID *</label>
                <input
                  type="text"
                  id="ipfsCID"
                  value={ipfsCID}
                  onChange={(e) => setIpfsCID(e.target.value)}
                  placeholder="Qm..."
                  required
                />
                <small className="form-help">
                  The IPFS content identifier where the certificate is stored
                </small>
              </div>

              <div className="info-box">
                <strong>ℹ️ About Standard Verification:</strong>
                <p>
                  This method reveals the IPFS CID publicly on the blockchain.
                  Anyone can see where the credential is stored, but it costs less gas.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={!isConnected}
              >
                Verify Credential
              </button>
            </form>
          )}

          {/* ZK Verification Form */}
          {mode === 'zk' && (
            <form onSubmit={handleZKVerify} className="verify-form">
              <div className="form-header">
                <h3>🔒 Zero-Knowledge Verification</h3>
                <p>Verify without revealing credential details</p>
              </div>

              <div className="form-group">
                <label htmlFor="proofFile">Upload ZK Proof *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="proofFile"
                    accept=".json"
                    onChange={handleProofFileUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="proofFile" className="file-upload-label">
                    {proofFile ? (
                      <>
                        <span className="file-icon">📄</span>
                        <span>{proofFile}</span>
                      </>
                    ) : (
                      <>
                        <span className="upload-icon">📤</span>
                        <span>Click to upload proof.json</span>
                      </>
                    )}
                  </label>
                </div>
                <small className="form-help">
                  Upload the zero-knowledge proof generated by the credential holder
                </small>
              </div>

              <div className="info-box">
                <strong>ℹ️ About ZK Verification:</strong>
                <p>
                  Zero-knowledge proofs verify credentials without revealing any details.
                  The verifier confirms validity without seeing the credential data or IPFS location.
                  This provides maximum privacy but costs more gas.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={!isConnected || !zkProof}
              >
                Verify with ZK Proof
              </button>
            </form>
          )}

          {/* Gas Comparison */}
          <div className="gas-comparison">
            <h4>⛽ Gas Cost Comparison</h4>
            <div className="comparison-grid">
              <div className="comparison-item">
                <div className="comparison-label">Standard</div>
                <div className="comparison-value">~50,000 gas</div>
                <div className="comparison-note">Faster & Cheaper</div>
              </div>
              <div className="comparison-item">
                <div className="comparison-label">Zero-Knowledge</div>
                <div className="comparison-value">~300,000 gas</div>
                <div className="comparison-note">Private & Secure</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyCredentials;