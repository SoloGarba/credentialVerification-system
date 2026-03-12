import React from 'react';
import { Link } from 'react-router-dom';

const ChooseVerificationMode = ({ credentialId }) => {
  return (
    <div className="choose-verification-mode">
      <h2>Choose Verification Method</h2>
      
      <div className="mode-options">
        <Link to={`/student/verify/standard/${credentialId}`} className="mode-card">
          <h3>🔓 Standard Verification</h3>
          <p>Cost: ~$5 | Privacy: Low</p>
          <p>Reveals your IPFS CID</p>
        </Link>

        <Link to={`/student/verify/zk/${credentialId}`} className="mode-card highlight">
          <h3>🔒 ZK Proof Verification</h3>
          <p>Cost: ~$30 | Privacy: High</p>
          <p>Fully anonymous proof</p>
        </Link>
      </div>
    </div>
  );
};

export default ChooseVerificationMode;