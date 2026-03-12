import React from 'react';

const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>About This Project</h1>
      <p>This is a blockchain-based credential verification system with zero-knowledge proof support.</p>
      
      <h2>Features:</h2>
      <ul>
        <li>Issue credentials on blockchain</li>
        <li>Store certificates on IPFS</li>
        <li>Dual verification: Standard & ZK Proof</li>
        <li>Privacy-preserving verification</li>
      </ul>

      <h2>Technology Stack:</h2>
      <ul>
        <li>Smart Contracts: Solidity</li>
        <li>ZK Proofs: Circom + SnarkJS (Groth16)</li>
        <li>Storage: IPFS</li>
        <li>Frontend: React</li>
        <li>Blockchain: Ethereum (Sepolia testnet)</li>
      </ul>
    </div>
  );
};

export default AboutPage;