import React from 'react';

const ShareCID = ({ credential }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(credential.ipfsCID);
    alert('CID copied!');
  };

  return (
    <div className="share-cid">
      <h2>Standard Verification</h2>
      <p>Share this information with the verifier:</p>
      
      <div className="share-box">
        <label>Credential Hash:</label>
        <code>{credential.leafHash}</code>
        
        <label>IPFS CID:</label>
        <code>{credential.ipfsCID}</code>
        
        <button onClick={handleCopy}>📋 Copy CID</button>
      </div>
    </div>
  );
};

export default ShareCID;