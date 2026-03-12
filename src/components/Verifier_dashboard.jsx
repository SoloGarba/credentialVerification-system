import React, { useState } from "react";
import { uploadJSONToIPFS } from "../utils/ipfs";
import { ethers } from "ethers";

export default function VerifierDashboard({ contract }) {
  const [cid, setCid] = useState("");
  const [credential, setCredential] = useState(null);
  const [status, setStatus] = useState("");

  const lookup = async () => {
    if (!cid) return alert("Enter CID");
    setStatus("Fetching on-chain record...");
    try {
      const cred = await contract.getCredentialByCid(cid);
      setCredential(cred);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("Not found or error");
    }
  };

  const verifyMetadata = async () => {
    if (!credential) return alert("Fetch credential first");
    // For off-chain metadata verification: read metadata JSON from IPFS gateway
    try {
      setStatus("Fetching metadata from IPFS...");
      const res = await fetch(`https://ipfs.io/ipfs/${credential.ipfsCID}`);
      const json = await res.json();
      const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(json)));
      const matches = hash === credential.metadataHash;
      setStatus(matches ? "Metadata hash MATCHES on-chain" : "Mismatch! Metadata may have changed");
    } catch (e) {
      console.error(e);
      setStatus("Failed to fetch metadata or compute hash");
    }
  };

  return (
    <div>
      <h3>Verifier Dashboard</h3>
      <input value={cid} onChange={(e)=>setCid(e.target.value)} placeholder="Enter IPFS CID" className="form-control" />
      <button onClick={lookup} className="btn btn-primary mt-2">Lookup</button>

      {status && <div style={{ marginTop: 8 }}>{status}</div>}

      {credential && (
        <div style={{ marginTop: 12 }} className="card p-3">
          <div><strong>ID</strong>: {String(credential.id)}</div>
          <div><strong>Student</strong>: {credential.student}</div>
          <div><strong>Issuer</strong>: {credential.issuer}</div>
          <div><strong>CID</strong>: {credential.ipfsCID}</div>
          <div><strong>Metadata hash</strong>: {credential.metadataHash}</div>
          <div><strong>Revoked</strong>: {credential.revoked ? "Yes" : "No"}</div>
          <div style={{ marginTop: 10 }}>
            <button onClick={verifyMetadata} className="btn btn-success">Verify Metadata</button>
            <a target="_blank" rel="noreferrer" href={`https://ipfs.io/ipfs/${credential.ipfsCID}`} className="btn btn-link">Open IPFS</a>
          </div>
        </div>
      )}
    </div>
  );
}
