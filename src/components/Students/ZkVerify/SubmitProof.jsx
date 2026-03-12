import React from 'react';
import { useContractContext } from '../../../context/ContractContext';
import { useZKProof } from '../../../hooks/useZkproof';

const SubmitProof = ({ credentialId }) => {
  const { verifyWithZKProof } = useContractContext();
  const { proof, publicSignals, formatForEthers } = useZKProof();

  const handleSubmit = async () => {
    const [pA, pB, pC, pubSignals] = formatForEthers();
    await verifyWithZKProof(pA, pB, pC, pubSignals);
  };

  return (
    <div className="submit-proof">
      <h2>Submit Proof to Blockchain</h2>
      <button onClick={handleSubmit}>🔗 Submit</button>
    </div>
  );
};

export default SubmitProof;