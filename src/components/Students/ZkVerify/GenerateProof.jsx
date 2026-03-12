import React from 'react';
import { useZKProof } from '../../../hooks/useZkproof';
import LoadingSpinner from '../../Common/LoadingSpinner';

const GenerateProof = ({ credential, merklePath }) => {
  const { generate, generating, proof, progress } = useZKProof();

  const handleGenerate = async () => {
    await generate(credential, merklePath);
  };

  return (
    <div className="generate-proof">
      <h2>Generate ZK Proof</h2>
      
      {generating ? (
        <div>
          <LoadingSpinner message={progress.message} />
          <div className="progress-bar">
            <div style={{ width: `${progress.progress}%` }} />
          </div>
        </div>
      ) : proof ? (
        <div>
          <p>✅ Proof generated!</p>
          <button onClick={() => window.location.href = `/student/verify/zk/submit/${credential.credentialId}`}>
            Submit Proof
          </button>
        </div>
      ) : (
        <button onClick={handleGenerate}>Generate Proof</button>
      )}
    </div>
  );
};

export default GenerateProof;