/**
 * frontend/src/App.jsx
 * 
 * Main App component with routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { UserRoleProvider } from './context/UserRoleContext';
import { ContractProvider } from './context/ContractContext';

// Layout
import NavigationBar from './components/Common/NavigationBar';

// Pages
import HomePage from './pages/Homepage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import VerifierPage from './pages/VerifierPage';
import AboutPage from './pages/AboutPage';

// Admin Components
import IssueCredential from './components/Admin/IssueCredential';
import ManageCredentials from './components/Admin/ManageCredentials';
import UpdateMerkleRoot from './components/Admin/UpdateMerkleRoot';

// Student Components
import MyCredentials from './components/Student/MyCredentials';
import ChooseVerificationMode from './components/Student/ChooseVerificationMode';

// Verifier Components
import VerificationHistory from './components/Verifier/VerificationHistory';
import GasCostComparison from './components/Verifier/GasCostComparison';

import './styles/global.css';

function App() {
  return (
    <Router>
      <WalletProvider>
        <ContractProvider>
          <UserRoleProvider>
            <div className="app">
              <NavigationBar />
              
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/issue" element={<IssueCredential />} />
                  <Route path="/admin/manage" element={<ManageCredentials />} />
                  <Route path="/admin/update-root" element={<UpdateMerkleRoot />} />

                  {/* Student Routes */}
                  <Route path="/student" element={<StudentPage />} />
                  <Route path="/student/credentials" element={<MyCredentials />} />
                  <Route path="/student/verify/:credentialId" element={<ChooseVerificationMode />} />

                  {/* Verifier Routes */}
                  <Route path="/verifier" element={<VerifierPage />} />
                  <Route path="/verifier/history" element={<VerificationHistory />} />
                  <Route path="/verifier/comparison" element={<GasCostComparison />} />

                  {/* 404 */}
                  <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
              </main>

              <footer className="footer">
                <p>© 2024 Credential DApp | Built with ❤️ for thesis project</p>
              </footer>
            </div>
          </UserRoleProvider>
        </ContractProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;