// src/components/IssueCredential.js
import React, { useState } from "react";
import UploadToIPFS from "./UploadToIPFS";
import { ethers } from "ethers";

/**
 * Props:
 * - contract: ethers.Contract connected with signer (from ConnectWallet onConnect result)
 */
export default function IssueCredential({ contract }) {
  const [studentAddress, setStudentAddress] = useState("");
  const [metadata, setMetadata] = useState("");
  const [cid, setCid] = useState("");
  const [status, setStatus] = useState("");

  const handleUploaded = ({ cid }) => {
    setCid(cid);
  };

  const issue = async () => {
    if (!contract) return alert("Connect wallet as an issuer first");
    if (!ethers.isAddress(studentAddress)) return alert("Invalid student address");
    if (!cid) return alert("No CID available (upload first)");
    try {
      setStatus("Preparing metadata hash...");
      // Metadata should be JSON string.
      const metadataJson = metadata || JSON.stringify({ issuedBy: await contract.signer.getAddress(), note: "Credential" });
      const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataJson)); // bytes32
      setStatus("Sending transaction to issue credential...");
      const tx = await contract.issueCredential(studentAddress, cid, hash);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus(`Issued successfully. Transaction: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setStatus("Error issuing credential");
    }
  };

  return (
    <div>
      <h4>Issue Credential</h4>
      <label>Student Wallet Address</label>
      <input type="text" className="form-control" value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} />
      <label className="mt-2">Metadata (JSON)</label>
      <textarea className="form-control" rows={4} value={metadata} onChange={(e) => setMetadata(e.target.value)} placeholder='{"degree":"BSc","program":"CS"}' />
      <div className="mt-2">
        <UploadToIPFS onUploaded={handleUploaded} />
      </div>
      {cid && <div className="alert alert-info mt-2">CID: {cid}</div>}
      <button className="btn btn-primary mt-2" onClick={issue}>Issue Credential</button>
      <div className="mt-2">{status}</div>
    </div>
  );
}
