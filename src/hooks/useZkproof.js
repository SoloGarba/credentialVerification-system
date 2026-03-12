/**
 * frontend/src/hooks/useZkProof.js
 */
import { useState, useCallback, useRef } from 'react';

const WORKER_PATH = '/zk/zkProofWorker.js';

const validateInput = ({ circuitInputs, merkleSiblings, merkleRoot }) => {
  if (!circuitInputs || typeof circuitInputs !== 'object') {
    throw new Error('Circuit inputs are required.');
  }
  if (!circuitInputs.student || !circuitInputs.cidHash ||
      !circuitInputs.metadataHash || !circuitInputs.credentialId) {
    throw new Error('Missing circuit input fields (student, cidHash, metadataHash, credentialId).');
  }
  if (!merkleRoot || merkleRoot.toString().trim() === '') {
    throw new Error('Merkle root is required.');
  }
  if (!Array.isArray(merkleSiblings)) {
    throw new Error('Merkle siblings must be an array.');
  }
};

const useZkProof = () => {
  const [proof, setProof]       = useState(null);
  const [status, setStatus]     = useState('idle');
  const [progress, setProgress] = useState(null);
  const [error, setError]       = useState(null);
  const workerRef = useRef(null);

  const reset = useCallback(() => {
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    setProof(null); setStatus('idle'); setProgress(null); setError(null);
  }, []);

  const generateProof = useCallback((circuitInputs, merkleProof) => {
    return new Promise((resolve) => {
      setProof(null); setError(null); setProgress(null);
      setStatus('validating');

      try {
        validateInput({
          circuitInputs,
          merkleSiblings: merkleProof?.siblings,
          merkleRoot: merkleProof?.root,
        });
      } catch (validationError) {
        setError(validationError.message);
        setStatus('error');
        resolve(null);
        return;
      }

      setStatus('generating');
      setProgress('Starting proof generation...');

      let worker;
      try {
        worker = new Worker(WORKER_PATH);
        workerRef.current = worker;
      } catch (workerError) {
        setError('Failed to start proof worker. Make sure zkProofWorker.js is in /public/zk/.');
        setStatus('error');
        resolve(null);
        return;
      }

      worker.onmessage = (event) => {
        const { type, payload } = event.data;

        if (type === 'PROOF_PROGRESS') {
          // Log all progress messages from worker to main console
          if (payload.message.startsWith('DEBUG_')) {
            console.log('[worker debug]:', payload.message);
          } else {
            console.log('[worker progress]:', payload.message);
          }
          setProgress(payload.message);
          return;
        }

        if (type === 'PROOF_SUCCESS') {
          console.log('[worker] Proof success. pubSignals:', payload.pubSignals);
          setProof(payload); setStatus('success'); setProgress(null);
          worker.terminate(); workerRef.current = null;
          resolve(payload);
          return;
        }

        if (type === 'PROOF_ERROR') {
          setError(payload.message); setStatus('error'); setProgress(null);
          worker.terminate(); workerRef.current = null;
          resolve(null);
        }
      };

      worker.onerror = (workerError) => {
        console.error('[useZkProof] Worker error:', workerError);
        setError(workerError.message || 'An unexpected error occurred in the proof worker.');
        setStatus('error'); setProgress(null);
        worker.terminate(); workerRef.current = null;
        resolve(null);
      };

      worker.postMessage({
        type: 'GENERATE_PROOF',
        payload: {
          credentialHash: circuitInputs,
          merkleSiblings: merkleProof.siblings,
          pathIndices: merkleProof.pathIndices,
          merkleRoot: merkleProof.root,
        },
      });
    });
  }, []);

  return { generateProof, proof, status, progress, error, reset };
};

export default useZkProof;