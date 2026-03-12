import React from 'react';

const ProofStatus = ({ progress }) => {
  return (
    <div className="proof-status">
      <h3>Status: {progress.stage}</h3>
      <div className="progress-indicator">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
        </div>
        <p>{progress.progress}%</p>
      </div>
      <p>{progress.message}</p>
    </div>
  );
};

export default ProofStatus;