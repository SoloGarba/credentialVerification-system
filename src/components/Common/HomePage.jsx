import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useUserRole } from '../../context/UserRoleContext';

const HomePage = () => {
  const { isConnected } = useWalletContext();
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected || loading) return;
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'verifier') navigate('/verifier', { replace: true });
    else if (role === 'student') navigate('/student', { replace: true });
  }, [isConnected, role, loading, navigate]);

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '0 2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
      <h1 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '1rem' }}>CredentialDApp</h1>
      <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '3rem', lineHeight: 1.7 }}>
        A blockchain-powered academic credential system with zero-knowledge proof verification.
        Institutions issue tamper-proof credentials. Students share them privately. Employers verify instantly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { icon: '🔒', title: 'Zero-Knowledge Proofs', desc: 'Verify credentials without revealing personal data' },
          { icon: '⛓️', title: 'Blockchain Secured', desc: 'Credentials anchored on Ethereum Sepolia' },
          { icon: '📄', title: 'IPFS Storage', desc: 'Certificates stored permanently on IPFS' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '2rem' }}>
          <p style={{ color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Connect your wallet to get started</p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Use the <strong>Connect Wallet</strong> button in the top right</p>
        </div>
      )}

      {isConnected && loading && (
        <p style={{ color: '#64748b' }}>Detecting your role...</p>
      )}
    </div>
  );
};

export default HomePage;
