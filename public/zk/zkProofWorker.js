/**
 * frontend/public/zk/zkProofWorker.js
 *
 * Web Worker for ZK proof generation — runs snarkjs off the main thread
 * so the UI stays responsive during the 15-25 second proving process.
 *
 * ADDED: performance.now() timing around fullProve() so the main thread
 * can display and log how long proof generation actually took.
 * This is the instrumentation described in the Performance Evaluation
 * section of the project report (Section 4.5.3.4).
 */
importScripts('/zk/snarkjs.min.js');

const WASM_PATH = '/zk/credential.wasm';
const ZKEY_PATH = '/zk/credential_final.zkey';

const progress = (message) => self.postMessage({ type: 'PROOF_PROGRESS', payload: { message } });

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  if (type !== 'GENERATE_PROOF') return;

  const { credentialHash, merkleSiblings, merkleRoot } = payload;

  try {
    progress('Preparing circuit inputs...');

    const TREE_HEIGHT = 20;

    const paddedPathElements = Array.from({ length: TREE_HEIGHT }, (_, i) =>
      merkleSiblings[i] || '0'
    );
    const paddedPathIndex = Array.from({ length: TREE_HEIGHT }, (_, i) =>
      (payload.pathIndices || [])[i] ?? 0
    );

    const input = {
      student:      credentialHash.student,
      cidHash:      credentialHash.cidHash,
      metadataHash: credentialHash.metadataHash,
      credentialId: credentialHash.credentialId,
      pathElements: paddedPathElements,
      pathIndex:    paddedPathIndex,
    };

    progress('DEBUG_INPUT:' + JSON.stringify({
      student:        input.student,
      cidHash:        input.cidHash,
      metadataHash:   input.metadataHash,
      credentialId:   input.credentialId,
      pathElements_0: input.pathElements[0],
      pathIndex_0:    input.pathIndex[0],
      merkleRoot:     merkleRoot,
    }));

    progress('Generating zero-knowledge proof (this may take 10-30 seconds)...');

    // ── TIMING INSTRUMENTATION ────────────────────────────────────────────
    // performance.now() is available inside Web Workers exactly as it is on
    // the main thread. It returns a high-resolution timestamp in milliseconds
    // (e.g. 17432.61 ms). We capture it immediately before and immediately
    // after the snarkjs call so that no input-preparation or formatting time
    // contaminates the measurement — only the actual proving work is timed.
    const proofStartTime = performance.now();

    const { proof: rawProof, publicSignals } = await snarkjs.groth16.fullProve(
      input, WASM_PATH, ZKEY_PATH
    );

    const proofEndTime = performance.now();

    // Round to whole milliseconds. Sub-millisecond precision is meaningless
    // for a process that takes tens of seconds, and rounding avoids confusion
    // in the report (e.g. "17432 ms" is cleaner than "17432.617 ms").
    const generationTimeMs = Math.round(proofEndTime - proofStartTime);
    // ── END TIMING ────────────────────────────────────────────────────────

    progress('DEBUG_OUTPUT:' + JSON.stringify({ publicSignals }));

    // Also log to the worker console so the value is always visible in
    // DevTools → Console, even across repeated runs where the UI might not
    // redraw cleanly. Useful for recording the 10 trial values for the report.
    console.log(`[zkProofWorker] Proof generated in ${(generationTimeMs / 1000).toFixed(2)}s (${generationTimeMs}ms)`);

    progress('Formatting proof...');

    const formattedProof = {
      pA: rawProof.pi_a,
      pB: rawProof.pi_b,
      pC: rawProof.pi_c,
      pubSignals: publicSignals,
      // generationTimeMs is piggybacked onto the payload so that
      // GenerateProof.jsx can display it on the success screen.
      // The component strips this field before writing the download file
      // so that verifiers always receive a clean standard proof.json
      // containing only pA, pB, pC, and pubSignals.
      generationTimeMs,
    };

    self.postMessage({ type: 'PROOF_SUCCESS', payload: formattedProof });

  } catch (err) {
    let message = err.message || 'Unknown error during proof generation.';
    if (message.includes('Cannot read')) {
      message = 'Circuit input mismatch — check your credential data matches the circuit.';
    } else if (message.includes('importScripts') || message.includes('fetch')) {
      message = 'Failed to load circuit files. Check /public/zk/ folder.';
    }
    self.postMessage({ type: 'PROOF_ERROR', payload: { message } });
  }
};