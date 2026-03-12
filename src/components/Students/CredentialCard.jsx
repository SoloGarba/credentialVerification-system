import React from 'react';
import { Link } from 'react-router-dom';

const CredentialCard = ({ credential }) => {
  return (
    <div className="credential-card">
      <h3>{credential.degree}</h3>
      <p>{credential.major}</p>
      <p>Issued: {new Date(credential.issuedDate).toLocaleDateString()}</p>
      <div className="card-actions">
        <Link to={`/student/verify/${credential.credentialId}`}>Verify</Link>
        <a href={`https://ipfs.io/ipfs/${credential.ipfsCID}`} target="_blank" rel="noopener noreferrer">View</a>
      </div>
    </div>
  );
};

export default CredentialCard;