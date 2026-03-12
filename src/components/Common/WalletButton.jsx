// src/components/ConnectWallet.js
import React, { useState, useEffect } from "react";
import { connectWallet, disconnectWallet } from '../../utils/contract';

export default function ConnectWallet({ onConnect }) {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    
  }, []);

  const handleConnect = async () => {
    try {
      setStatus("Connecting...");
      const { address, contract, signer, provider } = await connectWallet();
      setAccount(address);
      setStatus("Connected");
      if (onConnect) onConnect({ address, contract, signer, provider });
    } catch (err) {
      console.error("connect error", err);
      setStatus("Failed to connect");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAccount("");
      setStatus("Disconnected");
      if (onConnect) onConnect(null);
    } catch (err) {
      console.error("disconnect error", err);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={handleConnect} className="btn btn-primary" style={{ marginRight: 8 }}>
        {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
      </button>
      <button onClick={handleDisconnect} className="btn btn-secondary">
        Disconnect
      </button>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
