import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useUserRole } from '../../context/UserRoleContext';
import WalletButton from './WalletButton';
import '../../styles/global.css';
import '../../styles/navbar.css';

const NavigationBar = () => {
  const { isConnected } = useWalletContext();
  const { role, isAdmin, isStudent, isVerifier, isAdminAddress, switchRole } = useUserRole();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole) => {
    switchRole(newRole);
    // Navigate to the appropriate home page for that role
    if (newRole === 'admin') navigate('/admin');
    else if (newRole === 'student') navigate('/student');
    else if (newRole === 'verifier') navigate('/verifier');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/">
            <h2>🎓 CredentialDApp</h2>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">Home</Link>
          {isConnected && isAdmin && <Link to="/admin" className="nav-link">Admin Panel</Link>}
          {isConnected && isStudent && <Link to="/student" className="nav-link">My Dashboard</Link>}
          {isConnected && isVerifier && <Link to="/verifier" className="nav-link">Verify Credentials</Link>}
          <Link to="/about" className="nav-link">About</Link>
        </div>

        <div className="navbar-actions">
          {isConnected && (
            <div className="role-switcher">
              <button
                className={`role-switch-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('student')}
              >
                🎓 Student
              </button>
              <button
                className={`role-switch-btn ${role === 'verifier' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('verifier')}
              >
                ✓ Verifier
              </button>
              {isAdminAddress && (
                <button
                  className={`role-switch-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => handleRoleSwitch('admin')}
                >
                  👑 Admin
                </button>
              )}
            </div>
          )}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;