import React, { useState } from 'react';

const InputProof = ({ onProofSubmit }) => {
  const [proofJSON, setProofJSON] = useState('');

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(proofJSON);
      onProofSubmit(parsed);
    } catch (error) {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="input-proof">
      <h2>ZK Proof Verification</h2>
      <textarea 
        placeholder="Paste proof JSON"
        value={proofJSON}
        onChange={(e) => setProofJSON(e.target.value)}
        rows={10}
      />
      <button onClick={handleSubmit}>Verify Proof</button>
    </div>
  );
};

export default InputProof;