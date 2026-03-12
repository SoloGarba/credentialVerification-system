import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="spinner">⏳</div>
      <p>{message}</p>
    </div>
  );
}
