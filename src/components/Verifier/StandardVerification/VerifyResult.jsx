import React from 'react';

const VerifyResult = ({ result }) => {
  return (
    <div className={`verify-result ${result.isValid ? 'valid' : 'invalid'}`}>
      <h3>{result.isValid ? '✅ Valid Credential' : '❌ Invalid Credential'}</h3>
      <p>Gas Used: {result.gasUsed}</p>
      <p>Transaction: {result.transactionHash}</p>
    </div>
  );
};

export default VerifyResult;