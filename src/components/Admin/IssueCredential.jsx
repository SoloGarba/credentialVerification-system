/**
 * frontend/src/components/Admin/IssueCredential.jsx
 *
 * Upload flow:
 *   1. Pin a JSON file with circuit inputs + credential metadata → get zkDataCID
 *   2. Pin the PDF with only zkDataCID in keyvalues (4 keyvalues total, no length issues)
 *   3. Store PDF CID on-chain via addCredential()
 *
 * Students fetch circuit inputs via:
 *   PDF CID → keyvalues.zkDataCID → fetch JSON from IPFS gateway
 */

import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useContractContext } from '../../context/ContractContext';
import { poseidonHash4, hashToBytes32 } from '../../utils/crypto/poseidon';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/admin.css';

const stringToBigInt = (str) => {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(str));
  return (BigInt(hash) >> BigInt(3)).toString();
};

const IssueCredential = () => {
  const navigate = useNavigate();
  const { account } = useWalletContext();
  const { addCredential, loading, error, txHash } = useContractContext();

  const [formData, setFormData] = useState({
    studentName: '', studentId: '', degree: '',
    institution: '', graduationDate: '', gpa: '',
  });

  const [ipfsCID, setIpfsCID] = useState('');
  const [credentialHash, setCredentialHash] = useState('');
  const [circuitInputs, setCircuitInputs] = useState(null);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateHash = async () => {
    try {
      const studentInput      = stringToBigInt(formData.studentId);
      const cidHashInput      = stringToBigInt('0');
      const metadataInput     = stringToBigInt(`${formData.degree}|${formData.institution}|${formData.graduationDate}|${formData.gpa || '0'}`);
      const credentialIdInput = stringToBigInt(`${formData.studentId}|${formData.degree}|${Date.now()}`);

      const leafHash = await poseidonHash4(studentInput, cidHashInput, metadataInput, credentialIdInput);
      const leafHashHex = hashToBytes32(leafHash);

      setCircuitInputs({ student: studentInput, cidHash: cidHashInput, metadataHash: metadataInput, credentialId: credentialIdInput });
      setCredentialHash(leafHashHex);
      setStep(2);
    } catch (err) {
      console.error('Hash generation error:', err);
      alert('Failed to generate hash: ' + err.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please select a PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
    setSelectedFile(file);
  };

  /** Pin the circuit inputs + metadata as a JSON file. Returns its CID. */
  const pinCircuitDataJSON = async (JWT) => {
    const payload = {
      student: circuitInputs.student,
      cidHash: circuitInputs.cidHash,
      metadataHash: circuitInputs.metadataHash,
      credentialId: circuitInputs.credentialId,
      credentialHash,
      studentName: formData.studentName,
      studentId: formData.studentId,
      degree: formData.degree,
      institution: formData.institution,
      graduationDate: formData.graduationDate,
      gpa: formData.gpa || '',
    };

    const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], `zkdata-${Date.now()}.json`, { type: 'application/json' });

    const fd = new FormData();
    fd.append('file', jsonFile);
    fd.append('pinataMetadata', JSON.stringify({ name: `zkdata-${credentialHash.slice(0, 10)}.json` }));
    fd.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${JWT}` },
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to pin JSON data: ${JSON.stringify(err)}`);
    }
    return (await res.json()).IpfsHash;
  };

  /** Pin the PDF with zkDataCID as a keyvalue reference. Returns PDF CID. */
  const pinPDF = async (JWT, zkDataCID) => {
     console.log('[pinPDF] zkDataCID:', zkDataCID);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('pinataMetadata', JSON.stringify({
      name: `credential-${Date.now()}.pdf`,
      keyvalues: {
        credentialHash,
        zkDataCID,
        studentId: formData.studentId,
        institution: formData.institution,
      },
    }));
    fd.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${JWT}` },
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to pin PDF: ${JSON.stringify(err)}`);
    }
    return (await res.json()).IpfsHash;
  };

  const handleUploadToPinata = async () => {
    if (!selectedFile) { alert('Please select a file first'); return; }
    if (!circuitInputs) { alert('Please generate the credential hash first'); return; }

    const JWT = process.env.REACT_APP_PINATA_JWT;
    if (!JWT) { alert('Pinata JWT not configured. Add REACT_APP_PINATA_JWT to your .env file'); return; }

    setUploading(true);
    try {
      setUploadStatus('Uploading credential data...');
      const zkDataCID = await pinCircuitDataJSON(JWT);
      console.log('[upload] Circuit data CID:', zkDataCID);

      setUploadStatus('Uploading certificate PDF...');
      const pdfCID = await pinPDF(JWT, zkDataCID);
      console.log('[upload] PDF CID:', pdfCID);

      setIpfsCID(pdfCID);
      alert('Uploaded successfully to IPFS!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentialHash || !ipfsCID) { alert('Please generate hash and provide IPFS CID'); return; }

    try {
      const result = await addCredential(credentialHash, ipfsCID);
      if (result && result.success) {
        const existing = JSON.parse(localStorage.getItem('issuedCredentials') || '[]');
        existing.push({
          hash: credentialHash, ipfsCID,
          studentName: formData.studentName, studentId: formData.studentId,
          degree: formData.degree, institution: formData.institution,
          date: formData.graduationDate, gpa: formData.gpa,
          timestamp: new Date().toISOString(), status: 'active',
          txHash: result.transactionHash, circuitInputs,
        });
        localStorage.setItem('issuedCredentials', JSON.stringify(existing));
        setSuccess(true);
        setStep(3);
      }
    } catch (err) {
      console.error('Error issuing credential:', err);
    }
  };

  const handleReset = () => {
    setFormData({ studentName: '', studentId: '', degree: '', institution: '', graduationDate: '', gpa: '' });
    setIpfsCID(''); setCredentialHash(''); setCircuitInputs(null); setStep(1); setSuccess(false);
  };

  if (loading) return <LoadingSpinner message="Processing transaction..." />;

  if (success) {
    return (
      <div className="issue-credential-page">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2>Credential Issued Successfully!</h2>
          <p>The credential has been added to the blockchain.</p>
          <div className="success-details">
            <div className="detail-item"><label>Transaction Hash:</label><code>{txHash}</code></div>
            <div className="detail-item"><label>Credential Hash:</label><code>{credentialHash}</code></div>
            <div className="detail-item"><label>IPFS CID:</label><code>{ipfsCID}</code></div>
          </div>
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <strong>📤 Share with Student:</strong>
            <p>Give the student their <strong>IPFS CID</strong>: <code>{ipfsCID}</code><br />
            They use it to generate their ZK proof — no other data needed.</p>
          </div>
          <div className="success-actions">
            <button onClick={handleReset} className="btn btn-primary">Issue Another Credential</button>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-credential-page">
      <div className="page-header">
        <h1>📝 Issue New Credential</h1>
        <p>Create and register a new academic credential on the blockchain</p>
      </div>

      {error && <div className="alert alert-error"><strong>Error:</strong> {error}</div>}

      <div className="issue-form-container">
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}><div className="step-number">1</div><div className="step-label">Enter Details</div></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}><div className="step-number">2</div><div className="step-label">Generate Hash</div></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}><div className="step-number">3</div><div className="step-label">Submit</div></div>
        </div>

        <form onSubmit={handleSubmit} className="issue-form">
          {step === 1 && (
            <>
              <div className="form-section">
                <h3>Student Information</h3>
                <div className="form-group">
                  <label htmlFor="studentName">Student Name *</label>
                  <input type="text" id="studentName" name="studentName" value={formData.studentName} onChange={handleInputChange} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label htmlFor="studentId">Student ID *</label>
                  <input type="text" id="studentId" name="studentId" value={formData.studentId} onChange={handleInputChange} required placeholder="STU123456" />
                </div>
              </div>

              <div className="form-section">
                <h3>Credential Details</h3>
                <div className="form-group">
                  <label htmlFor="degree">Degree/Certificate *</label>
                  <input type="text" id="degree" name="degree" value={formData.degree} onChange={handleInputChange} required placeholder="Bachelor of Science in Computer Science" />
                </div>
                <div className="form-group">
                  <label htmlFor="institution">Institution *</label>
                  <input type="text" id="institution" name="institution" value={formData.institution} onChange={handleInputChange} required placeholder="University of Example" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="graduationDate">Graduation Date *</label>
                    <input type="date" id="graduationDate" name="graduationDate" value={formData.graduationDate} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gpa">GPA</label>
                    <input type="text" id="gpa" name="gpa" value={formData.gpa} onChange={handleInputChange} placeholder="3.85" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary">Cancel</button>
                <button type="button" onClick={handleGenerateHash} className="btn btn-primary">Next: Generate Hash →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-section">
                <h3>Credential Hash</h3>
                <p className="section-note">Generated using Poseidon hash — matches the ZK circuit exactly.</p>
                <div className="hash-display">
                  <label>Generated Hash:</label>
                  <code className="hash-value">{credentialHash}</code>
                </div>
              </div>

              <div className="form-section">
                <h3>IPFS Storage</h3>
                <p className="section-note">
                  Uploads two files: circuit data JSON first, then the PDF referencing it.
                  Students only need the PDF CID to generate their ZK proof.
                </p>
                <div className="upload-section">
                  <div className="file-upload-group">
                    <input type="file" id="certificate-file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
                    <label htmlFor="certificate-file" className="btn btn-secondary file-select-btn">
                      {selectedFile ? selectedFile.name : 'Choose PDF File'}
                    </label>
                    {selectedFile && (
                      <button type="button" onClick={handleUploadToPinata} disabled={uploading} className="btn btn-primary">
                        {uploading ? `⏳ ${uploadStatus}` : '📤 Upload to IPFS'}
                      </button>
                    )}
                  </div>
                  <div className="divider"><span>OR</span></div>
                </div>
                <div className="form-group">
                  <label htmlFor="ipfsCID">Paste IPFS CID Manually</label>
                  <input type="text" id="ipfsCID" value={ipfsCID} onChange={(e) => setIpfsCID(e.target.value)} required placeholder="QmX... (IPFS CID)" disabled={uploading} />
                  {ipfsCID && <small className="form-success">✅ CID ready: {ipfsCID.slice(0, 20)}...</small>}
                </div>
              </div>

              <div className="credential-preview">
                <h4>Preview</h4>
                <div className="preview-grid">
                  <div className="preview-item"><span className="preview-label">Student:</span><span className="preview-value">{formData.studentName}</span></div>
                  <div className="preview-item"><span className="preview-label">ID:</span><span className="preview-value">{formData.studentId}</span></div>
                  <div className="preview-item"><span className="preview-label">Degree:</span><span className="preview-value">{formData.degree}</span></div>
                  <div className="preview-item"><span className="preview-label">Institution:</span><span className="preview-value">{formData.institution}</span></div>
                  <div className="preview-item"><span className="preview-label">Date:</span><span className="preview-value">{formData.graduationDate}</span></div>
                  {formData.gpa && <div className="preview-item"><span className="preview-label">GPA:</span><span className="preview-value">{formData.gpa}</span></div>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
                <button type="submit" className="btn btn-primary" disabled={!ipfsCID}>Submit to Blockchain</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default IssueCredential;