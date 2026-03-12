import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/verifier.css';

const VerifierDashboard = () => {
  return (
    <div className="verifier-dashboard">
      <h1>✓ Verifier Dashboard</h1>
      
      <div className="verification-options">
        <Link to="/verifier/standard" className="option-card">
          <h3>Standard Verification</h3>
          <p>Verify using credential hash + CID</p>
        </Link>

        <Link to="/verifier/zk" className="option-card">
          <h3>ZK Proof Verification</h3>
          <p>Verify zero-knowledge proof</p>
        </Link>
      </div>

      <Link to="/verifier/history">View History</Link>
      <Link to="/verifier/comparison">Gas Cost Comparison</Link>
    </div>
  );
};

export default VerifierDashboard;