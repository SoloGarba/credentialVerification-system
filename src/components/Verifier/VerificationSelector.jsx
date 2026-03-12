import React, { useState } from 'react';

const VerificationSelector = () => {
  const [mode, setMode] = useState('standard');

  return (
    <div className="verification-selector">
      <div className="mode-tabs">
        <button 
          className={mode === 'standard' ? 'active' : ''}
          onClick={() => setMode('standard')}
        >
          Standard
        </button>
        <button 
          className={mode === 'zk' ? 'active' : ''}
          onClick={() => setMode('zk')}
        >
          ZK Proof
        </button>
      </div>
      {/* Render appropriate component based on mode */}
    </div>
  );
};

export default VerificationSelector;