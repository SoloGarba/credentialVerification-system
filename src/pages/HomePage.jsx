import React from 'react';
import { Link } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { useUserRole } from '../context/UserRoleContext';

const HomePage = () => {
  const { isConnected } = useWalletContext();
  const { role } = useUserRole();

  return (
    <div className="home-page">
      <div className="hero">
        <h1>🎓 Blockchain Credential Verification</h1>
        <p>Secure, private, and verifiable academic credentials</p>
        
        {!isConnected ? (
          <div>
            <p>Connect your wallet to get started</p>
          </div>
        ) : (
          <div className="role-links">
            {role === 'admin' && <Link to="/admin" className="btn-primary">Admin Dashboard</Link>}
            {role === 'student' && <Link to="/student" className="btn-primary">Student Dashboard</Link>}
            {role === 'verifier' && <Link to="/verifier" className="btn-primary">Verify Credentials</Link>}
          </div>
        )}
      </div>

      <div className="features">
        <div className="feature">
          <h3>🔒 Privacy-Preserving</h3>
          <p>Optional ZK proofs keep your identity private</p>
        </div>
        <div className="feature">
          <h3>⛓️ Blockchain-Backed</h3>
          <p>Immutable and tamper-proof credentials</p>
        </div>
        <div className="feature">
          <h3>💰 Cost-Effective</h3>
          <p>Choose between cheap standard or private ZK verification</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;