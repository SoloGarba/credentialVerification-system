import React from 'react';

const VerificationResult = ({ result }) => {
  return (
    <div className={`verification-result ${result.isValid ? 'valid' : 'invalid'}`}>
      <div className="result-icon">{result.isValid ? '✅' : '❌'}</div>
      <h2>{result.isValid ? 'Valid Credential' : 'Invalid Credential'}</h2>
      <div className="result-details">
        <p>Method: ZK Proof</p>
        <p>Gas Used: {result.gasUsed}</p>
        <p>Privacy: High (No data revealed)</p>
      </div>
    </div>
  );
};

export default VerificationResult;