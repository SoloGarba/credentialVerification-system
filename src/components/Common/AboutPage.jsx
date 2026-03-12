/**
 * frontend/src/components/Common/AboutPage.jsx
 */
import React from 'react';

const AboutPage = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎓</div>
        <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem' }}>About CredentialDApp</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          A decentralized academic credential system built on Ethereum, using zero-knowledge proofs 
          to let students prove their qualifications without revealing personal data.
        </p>
      </div>

      {/* How It Works */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '🏛️', title: 'Institution Issues', desc: 'Admin uploads a credential PDF to IPFS and registers a Poseidon hash on the Ethereum blockchain.' },
            { icon: '🎓', title: 'Student Receives', desc: 'The student receives their IPFS CID and can view, download, or generate ZK proofs from their dashboard.' },
            { icon: '🔒', title: 'ZK Proof Generated', desc: 'The student generates a zero-knowledge proof locally in their browser — no data leaves their device.' },
            { icon: '✅', title: 'Verifier Confirms', desc: 'Any verifier can confirm credential validity by checking the proof against the on-chain Merkle root.' },
          ].map((step, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{step.icon}</div>
              <h3 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1rem' }}>{step.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>Technology Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '⛓️', title: 'Ethereum Sepolia', desc: 'Smart contracts for credential registration and on-chain Merkle root storage.' },
            { icon: '📦', title: 'IPFS via Pinata', desc: 'Credential PDFs and circuit input JSON files stored permanently on IPFS.' },
            { icon: '🔐', title: 'Circom + SnarkJS', desc: 'ZK circuits compiled with Circom. Proofs generated client-side using Groth16.' },
            { icon: '🌲', title: 'Poseidon Merkle Tree', desc: 'ZK-friendly hash function used for leaves and tree nodes, matching circuit constraints.' },
            { icon: '⚛️', title: 'React', desc: 'Frontend SPA with wallet integration via MetaMask and ethers.js.' },
            { icon: '🔷', title: 'Solidity', desc: 'On-chain verifier contract generated from the compiled ZK circuit.' },
          ].map((tech, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{tech.icon}</div>
              <h3 style={{ color: '#0f172a', marginBottom: '0.5rem', fontSize: '1rem' }}>{tech.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div style={{ ...sectionStyle, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h2 style={{ ...sectionTitle, color: '#1e40af' }}>🔒 Privacy by Design</h2>
        <p style={{ color: '#1e40af', lineHeight: 1.7, marginBottom: '1rem' }}>
          Zero-knowledge proofs allow a student to prove they hold a valid credential without 
          revealing which credential it is, who issued it, or any personal details. 
          The verifier learns only one thing: the credential is valid.
        </p>
        <p style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
          All proof generation happens locally in your browser using a Web Worker. 
          Your credential data never leaves your device.
        </p>
      </div>

      {/* Contract Info */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>Contract Information</h2>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Network:</span>
            <span style={{ marginLeft: '0.75rem', color: '#0f172a' }}>Ethereum Sepolia Testnet</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Explorer:</span>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: '0.75rem', color: '#2563eb', textDecoration: 'none' }}
            >
              sepolia.etherscan.io →
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

const sectionStyle = {
  background: 'white',
  borderRadius: '12px',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const sectionTitle = {
  fontSize: '1.25rem',
  color: '#0f172a',
  marginBottom: '1.5rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #e2e8f0',
};

const cardStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '1.25rem',
};

export default AboutPage;