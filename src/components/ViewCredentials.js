// src/components/ViewCredentials.js
import React, { useState } from "react";

/**
 *  - readonlyContract: ethers.Contract connected to a read-only provider (or signer)
 */
export default function ViewCredentials({ contract }) {
  const [cid, setCid] = useState("");
  const [credential, setCredential] = useState(null);
  const [status, setStatus] = useState("");

  const lookup = async () => {
    if (!contract) return alert("Connect or provide a read-only contract");
    if (!cid) return alert("Enter CID");
    try {
      setStatus("Fetching...");
      const cred = await contract.getCredentialByCid(cid);
      // cred is a tuple (struct)
      setCredential(cred);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Not found or error");
    }
  };

  return (
    <div>
      <h4>View / Verify Credential</h4>
      <input type="text" className="form-control" placeholder="Enter IPFS CID" value={cid} onChange={(e) => setCid(e.target.value)} />
      <button className="btn btn-primary mt-2" onClick={lookup}>Lookup</button>
      <div className="mt-3">
        {status && <div>{status}</div>}
        {credential && (
          <div className="card p-3">
            <div><strong>ID:</strong> {credential.id.toString()}</div>
            <div><strong>Student:</strong> {credential.student}</div>
            <div><strong>Issuer:</strong> {credential.issuer}</div>
            <div><strong>IPFS CID:</strong> {credential.ipfsCID}</div>
            <div><strong>Metadata Hash:</strong> {credential.metadataHash}</div>
            <div><strong>Date Issued:</strong> {new Date(Number(credential.dateIssued) * 1000).toLocaleString()}</div>
            <div><strong>Revoked:</strong> {credential.revoked ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
