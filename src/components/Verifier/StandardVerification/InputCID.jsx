import React, { useState } from 'react';
import { useContractContext } from '../../../context/ContractContext';

const InputCID = () => {
  const [hash, setHash] = useState('');
  const [cid, setCid] = useState('');
  const { verifyStandard } = useContractContext();

  const handleVerify = async () => {
    await verifyStandard(hash, cid);
  };

  return (
    <div className="input-cid">
      <h2>Standard Verification</h2>
      <input 
        placeholder="Credential Hash"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
      />
      <input 
        placeholder="IPFS CID"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
};

export default InputCID;