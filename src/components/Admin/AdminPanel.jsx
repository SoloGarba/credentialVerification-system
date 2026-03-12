/**
 * frontend/src/components/Admin/AdminPanel.jsx
 * 
 * Main admin dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractContext } from '../../context/ContractContext';
import { useWalletContext } from '../../context/WalletContext';
import AdminStats from './AdminStats';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/admin.css';

const AdminPanel = () => {
  const { account } = useWalletContext();
  console.log('WalletContext in AdminPanel:', { account });
  const { getMerkleRoot, getAdmin } = useContractContext();
  const [loading, setLoading] = useState(true);
  const [merkleRoot, setMerkleRoot] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    console.log('=== ADMIN CHECK START ===');
    console.log('Account:', account);
    
    if (!account) {
      console.log('No account connected');
      setLoading(false);
      setIsAdmin(false);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Calling getAdmin()...');
      const adminAddress = await getAdmin();
      console.log('Contract admin:', adminAddress);
      console.log('Your wallet:', account);
      console.log('Addresses match?:', adminAddress?.toLowerCase() === account?.toLowerCase());
      
      setIsAdmin(adminAddress?.toLowerCase() === account?.toLowerCase());
      
      if (adminAddress?.toLowerCase() === account?.toLowerCase()) {
        console.log('User is admin! Getting merkle root...');
        const root = await getMerkleRoot();
        console.log('Merkle root:', root);
        setMerkleRoot(root);
      }
    } catch (error) {
      console.error('=== ADMIN CHECK ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      setIsAdmin(false);
    } finally {
      console.log('=== ADMIN CHECK COMPLETE ===');
      setLoading(false);
    }
  };
  
  checkAdmin();
}, [account]);
  if (loading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>❌ Access Denied</h2>
          <p>You must be an admin to access this page.</p>
          <Link to="/">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👑 Admin Dashboard</h1>
        <p>Manage credentials and system settings</p>
      </div>

      {/* Statistics */}
      <AdminStats />

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <Link to="/admin/issue" className="action-card">
            <div className="card-icon">📝</div>
            <h3>Issue Credential</h3>
            <p>Create and issue a new credential</p>
          </Link>

          <Link to="/admin/manage" className="action-card">
            <div className="card-icon">📋</div>
            <h3>Manage Credentials</h3>
            <p>View and manage issued credentials</p>
          </Link>

          <Link to="/admin/update-root" className="action-card">
            <div className="card-icon">🌳</div>
            <h3>Update Merkle Root</h3>
            <p>Rebuild and update the Merkle tree</p>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="system-info">
        <h2>System Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Current Merkle Root:</label>
            <code className="merkle-root">
              {merkleRoot ? `${merkleRoot.slice(0, 10)}...${merkleRoot.slice(-8)}` : 'Not set'}
            </code>
          </div>
          <div className="info-item">
            <label>Admin Address:</label>
            <code>{account}</code>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <p className="coming-soon">📊 Activity log coming soon...</p>
      </div>
    </div>
  );
};

export default AdminPanel;