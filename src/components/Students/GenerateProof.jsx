/**
 * frontend/src/components/Students/GenerateZKProof.jsx
 *
 * Student enters PDF CID → app fetches zkDataCID from Pinata keyvalues
 * → fetches circuit inputs JSON from IPFS gateway
 * → fetches Merkle proof from chain → generates ZK proof via worker
 *
 * ADDED: Reads generationTimeMs from the proof payload (set by the worker)
 * and displays it on the success screen. The timing field is stripped from
 * the proof object before the download file is written, so verifiers always
 * receive a clean standard proof.json (pA, pB, pC, pubSignals only).
 */

import React, { useState } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import useZkProof from '../../hooks/useZkproof';
import { useContractContext } from '../../context/ContractContext';
import '../../styles/student.css';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

const GenerateZKProof = () => {
  const [step, setStep] = useState(1);
  const [ipfsCID, setIpfsCID] = useState('');
  const [fetchError, setFetchError] = useState(null);

  const { getMerkleProof } = useContractContext();
  const { generateProof, proof: generatedProof, status, progress, error, reset } = useZkProof();

  const loading = status === 'validating' || status === 'generating';

  // ── Read proof generation time from the worker payload ───────────────────
  // The worker adds generationTimeMs to the PROOF_SUCCESS payload after
  // measuring it with performance.now(). Because the useZkProof hook stores
  // the entire payload as the proof object, we can read it directly here.
  // We then convert it to seconds for display (1 decimal place is sufficient).
  const generationTimeMs  = generatedProof?.generationTimeMs ?? null;
  const generationTimeSec = generationTimeMs !== null
    ? (generationTimeMs / 1000).toFixed(1)
    : null;
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Step 1: Get zkDataCID from Pinata keyvalues using the PDF CID
   */
  const fetchZkDataCID = async (pdfCID) => {
    const JWT = process.env.REACT_APP_PINATA_JWT;
    if (!JWT) throw new Error('Pinata JWT not configured in .env file.');

    const res = await fetch(
      `https://api.pinata.cloud/data/pinList?status=pinned&hashContains=${pdfCID}`,
      { headers: { Authorization: `Bearer ${JWT}` } }
    );
    if (!res.ok) throw new Error('Failed to query Pinata.');

    const data = await res.json();
    console.log('[fetchZkDataCID] Pinata response:', JSON.stringify(data.rows?.[0]?.metadata));
    const pin = data.rows?.[0];
    if (!pin) throw new Error('CID not found in Pinata. Check your CID is correct.');

    const zkDataCID = pin.metadata?.keyvalues?.zkDataCID;
    if (!zkDataCID) {
      throw new Error(
        'This credential was issued before ZK support. Please ask your admin to re-issue it.'
      );
    }
    return zkDataCID;
  };

  /**
   * Step 2: Fetch the circuit inputs JSON from the IPFS gateway
   */
  const fetchCircuitInputs = async (zkDataCID) => {
    const res = await fetch(`${IPFS_GATEWAY}/${zkDataCID}`);
    if (!res.ok) throw new Error('Failed to fetch credential data from IPFS.');
    return await res.json();
  };

  const handleGenerateProof = async (e) => {
    e.preventDefault();
    setFetchError(null);
    setStep(2);

    // Fetch zkDataCID from Pinata keyvalues
    let zkDataCID;
    try {
      zkDataCID = await fetchZkDataCID(ipfsCID);
    } catch (err) {
      setFetchError(err.message);
      setStep(1);
      return;
    }

    // Fetch circuit inputs JSON from IPFS
    let circuitData;
    try {
      circuitData = await fetchCircuitInputs(zkDataCID);
      console.log('[circuitData] credentialHash:', circuitData.credentialHash);
      console.log('[circuitData] all fields:', JSON.stringify(circuitData));
      // Verify leaf recomputation
      const { poseidonHash4 } = await import('../../utils/crypto/poseidon');
      const recomputedLeaf = await poseidonHash4(
        circuitData.student,
        circuitData.cidHash,
        circuitData.metadataHash,
        circuitData.credentialId
      );
      console.log('[debug] recomputed leaf:', recomputedLeaf);
      console.log('[debug] credentialHash as BigInt:', BigInt(circuitData.credentialHash).toString());
      console.log('[debug] leaf matches credentialHash:', recomputedLeaf === BigInt(circuitData.credentialHash).toString());

    } catch (err) {
      setFetchError(err.message);
      setStep(1);
      return;
    }

    // Fetch Merkle proof from chain
    let merkleProof;
    try {
      merkleProof = await getMerkleProof(circuitData.credentialHash);
      if (!merkleProof) { setStep(1); return; }
    } catch (err) {
      setFetchError(err.message);
      setStep(1);
      return;
    }
    console.log('[proof] merkleProof.root:', merkleProof.root);

    // Generate ZK proof
    const circuitInputs = {
      student:      circuitData.student,
      cidHash:      circuitData.cidHash,
      metadataHash: circuitData.metadataHash,
      credentialId: circuitData.credentialId,
    };

    const result = await generateProof(circuitInputs, merkleProof);
    if (result) setStep(3);
    else setStep(1);
  };

  const handleDownloadProof = () => {
    // ── Strip the timing field before writing the download file ──────────
    // generationTimeMs is an internal measurement for display purposes only.
    // Verifier.sol and any other verifier expects exactly four fields:
    // pA, pB, pC, pubSignals. Including extra fields would not break
    // verification, but it is non-standard and potentially confusing.
    // Destructuring assignment here cleanly separates the two concerns.
    const { generationTimeMs: _timing, ...proofToDownload } = generatedProof;
    // ─────────────────────────────────────────────────────────────────────

    const blob = new Blob([JSON.stringify(proofToDownload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `zk-proof-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => { reset(); setStep(1); setIpfsCID(''); setFetchError(null); };

  if (loading) {
    return (
      <LoadingSpinner
        message={progress || (status === 'validating'
          ? 'Fetching credential data...'
          : 'Generating zero-knowledge proof...')}
      />
    );
  }

  return (
    <div className="generate-zk-proof-page">
      <div className="page-header">
        <h1>🔒 Generate ZK Proof</h1>
        <p>Create a privacy-preserving proof of your credential</p>
      </div>

      <div className="steps-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Enter CID</div>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Generate Proof</div>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Download</div>
        </div>
      </div>

      {(fetchError || error) && (
        <div className="alert alert-error">
          <strong>Error:</strong> {fetchError || error}
          <button className="btn btn-link" onClick={handleReset}>Try Again</button>
        </div>
      )}

      {step === 1 && (
        <div className="zk-form-container">
          <div className="info-box">
            <strong>ℹ️ What is a ZK Proof?</strong>
            <p>
              Prove you hold a valid credential without revealing personal details.
              Just enter your IPFS CID — the app fetches everything else automatically.
            </p>
          </div>

          <form onSubmit={handleGenerateProof} className="zk-form">
            <div className="form-section">
              <h3>Your Credential</h3>
              <div className="form-group">
                <label htmlFor="ipfsCID">Your IPFS CID *</label>
                <input
                  type="text"
                  id="ipfsCID"
                  value={ipfsCID}
                  onChange={(e) => setIpfsCID(e.target.value)}
                  placeholder="QmX..."
                  required
                />
                <small className="form-help">
                  The IPFS CID your institution gave you when your credential was issued.
                </small>
              </div>
            </div>

            <div className="warning-box">
              <strong>🔐 Privacy Notice:</strong>
              <p>
                Your credential data is used locally to generate the proof.
                Only the proof is shared with verifiers.
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-large">
                Generate ZK Proof
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && generatedProof && (
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2>Proof Generated Successfully!</h2>
          <p>Your zero-knowledge proof is ready to share with verifiers.</p>

          {/* ── Proof generation time display ───────────────────────────────
              Shows the wall-clock time for snarkjs.groth16.fullProve() as
              measured by performance.now() inside the Web Worker.
              This is the figure to record in the performance evaluation table.
              The note clarifies the measurement method for any examiner reading
              the source code.
          ─────────────────────────────────────────────────────────────────── */}
          {generationTimeSec !== null && (
            <div className="proof-timing-badge">
              ⏱ Proof generated in <strong>{generationTimeSec}s</strong>
              <span className="timing-note">
                {' '}({generationTimeMs}ms — measured via performance.now() in Web Worker)
              </span>
            </div>
          )}

          <div className="proof-preview">
            <h4>Proof Preview:</h4>
            <pre className="proof-json">{JSON.stringify(generatedProof, null, 2)}</pre>
          </div>

          <div className="success-actions">
            <button onClick={handleDownloadProof} className="btn btn-primary">
              📥 Download Proof
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Generate Another Proof
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GenerateProof = GenerateZKProof; export default GenerateProof;