/**
 * frontend/src/components/Student/StudentDashboard.jsx
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import '../../styles/student.css';

const StudentDashboard = () => {
  const { account } = useWalletContext();

  return (
    <div className="student-dashboard">
      <h1>🎓 Student Dashboard</h1>
      <p>Welcome back! Manage your credentials here.</p>

      <div className="dashboard-cards">
        <Link to="/student/credentials" className="dashboard-card">
          <div className="card-icon">📜</div>
          <h3>My Credentials</h3>
          <p>View and download your credentials</p>
        </Link>

        <Link to="/student/verify" className="dashboard-card">
          <div className="card-icon">✓</div>
          <h3>Verify Credentials</h3>
          <p>Choose verification mode</p>
        </Link>

        <Link to="/student/generate-proof" className="dashboard-card">
          <div className="card-icon">🔒</div>
          <h3>Generate ZK Proof</h3>
          <p>Create a privacy-preserving proof</p>
          </Link>

        <Link to="/student/history" className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>Verification History</h3>
          <p>View past verifications</p>
        </Link>
      </div>

      <div className="student-info">
        <h3>Your Address:</h3>
        <code>{account}</code>
      </div>
    </div>
  );
};

export default StudentDashboard;