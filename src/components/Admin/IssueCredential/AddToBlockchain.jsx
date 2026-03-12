/**
 * frontend/src/components/Admin/IssueCredential/AddToBlockchain.jsx
 * 
 * Add credential to blockchain
 */

import React, { useState } from 'react';
import { useContractContext } from '../../../context/ContractContext';
import { processCredential } from '../../../utils/crypto/hashCredential';
import LoadingSpinner from '../../Common/LoadingSpinner';
import ErrorMessage from '../../Common/ErrorMessage';

const AddToBlockchain = ({ credentialData, ipfsCID, onComplete, onBack }) => {
  const { addCredential } = useContractContext();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);

  const handleAddToBlockchain = async () => {
    setAdding(true);
    setError(null);

    try {
      // Prepare credential data
      const rawCredential = {
        studentEmail: credentialData.studentEmail,
        ipfsCID: ipfsCID,
        metadata: credentialData.metadata,
        credentialId: credentialData.credentialId
      };

      // Process credential to get hashes
      const processed = await processCredential(rawCredential);

      // Add to blockchain
      const result = await addCredential(
        processed.leafHashBytes32,
        ipfsCID
      );

      if (result && result.success) {
        // Save credential data locally for student
        const credentialRecord = {
          ...processed,
          studentName: credentialData.studentName,
          degree: credentialData.degree,
          major: credentialData.major,
          ipfsCID,
          transactionHash: result.transactionHash,
          issuedDate: new Date().toISOString()
        };

        // In production, you'd save this to a database or send to student
        console.log('Credential record:', credentialRecord);
        
        onComplete(result.transactionHash);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Add to blockchain error:', err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="add-to-blockchain">
      <h2>Step 3: Add to Blockchain</h2>
      <p>Store the credential hash on the blockchain</p>

      <div className="blockchain-summary">
        <h3>Ready to Submit:</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Student:</label>
            <span>{credentialData.studentName}</span>
          </div>
          <div className="summary-item">
            <label>IPFS CID:</label>
            <code>{ipfsCID}</code>
          </div>
          <div className="summary-item">
            <label>Credential ID:</label>
            <code>{credentialData.credentialId}</code>
          </div>
        </div>
      </div>

      <div className="blockchain-info">
        <h4>ℹ️ What will be stored on-chain:</h4>
        <ul>
          <li>✅ Credential hash (derived from student ID, CID, metadata)</li>
          <li>✅ IPFS CID (for standard verification)</li>
          <li>❌ Student's personal information (kept private)</li>
        </ul>
        <p className="estimated-gas">
          Estimated Gas: ~70,000 gas
        </p>
      </div>

      {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

      {adding ? (
        <LoadingSpinner message="Adding to blockchain... Please confirm in MetaMask" />
      ) : (
        <div className="form-actions">
          <button onClick={onBack} className="btn-secondary" disabled={adding}>
            ← Back
          </button>
          <button onClick={handleAddToBlockchain} className="btn-primary" disabled={adding}>
             Add to Blockchain
          </button>
        </div>
      )}
    </div>
  );
};

export default AddToBlockchain;