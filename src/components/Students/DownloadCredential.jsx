import React from 'react';
import { useIPFS } from '../../hooks/useIPFS';

const DownloadCredential = ({ cid, filename }) => {
  const { downloadAndSave, downloading } = useIPFS();

  const handleDownload = () => {
    downloadAndSave(cid, filename);
  };

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? '⏳ Downloading...' : '📥 Download Certificate'}
    </button>
  );
};

export default DownloadCredential;