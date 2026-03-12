/**
 * frontend/src/components/Verifier/ZKVerification/VerifyProof.jsx
 */

import React, { useState } from 'react';
import { useContractContext } from '../../../context/ContractContext';
import { deserializeProof } from '../../../utils/zkp/proofFormatter';
import LoadingSpinner from '../../Common/LoadingSpinner';
import ErrorMessage from '../../Common/ErrorMessage';
import VerificationResult from './VerificationResult';

const VerifyProof = () => {
  const { verifyWithZKProof } = useContractContext();
  const [proofJSON, setProofJSON] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const { proof, publicSignals } = deserializeProof(proofJSON);
      
      const pA = [proof.pi_a[0], proof.pi_a[1]];
      const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ];
      const pC = [proof.pi_c[0], proof.pi_c[1]];
      const pubSignals = [publicSignals[0]];

      const verificationResult = await verifyWithZKProof(pA, pB, pC, pubSignals);
      setResult(verificationResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="verify-proof">
      <h2>Verify ZK Proof</h2>
      
      <textarea
        placeholder="Paste the ZK proof JSON here..."
        value={proofJSON}
        onChange={(e) => setProofJSON(e.target.value)}
        rows={15}
      />

      {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

      {verifying ? (
        <LoadingSpinner message="Verifying proof on blockchain..." />
      ) : (
        <button onClick={handleVerify} disabled={!proofJSON}>
          Verify Proof
        </button>
      )}

      {result && <VerificationResult result={result} />}
    </div>
  );
};

export default VerifyProof;