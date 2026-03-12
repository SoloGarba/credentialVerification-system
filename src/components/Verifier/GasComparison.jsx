import React from 'react';

const GasCostComparison = () => {
  const data = {
    standard: { gas: 50000, cost: 7.5 },
    zk: { gas: 300000, cost: 45 }
  };

  return (
    <div className="gas-cost-comparison">
      <h1>⛽ Gas Cost Comparison</h1>
      
      <div className="comparison-chart">
        <div className="comparison-item">
          <h3>Standard Verification</h3>
          <p>Gas: {data.standard.gas.toLocaleString()}</p>
          <p>Cost: ${data.standard.cost}</p>
          <div className="bar" style={{ width: '30%', background: '#4CAF50' }} />
        </div>

        <div className="comparison-item">
          <h3>ZK Proof Verification</h3>
          <p>Gas: {data.zk.gas.toLocaleString()}</p>
          <p>Cost: ${data.zk.cost}</p>
          <div className="bar" style={{ width: '100%', background: '#2196F3' }} />
        </div>
      </div>

      <div className="insights">
        <h3>📊 Insights for Your Thesis:</h3>
        <ul>
          <li>ZK verification costs 6x more gas</li>
          <li>Privacy premium: ~$37.50</li>
          <li>Standard is cheaper but reveals CID</li>
          <li>Use case determines best choice</li>
        </ul>
      </div>
    </div>
  );
};

export default GasCostComparison;