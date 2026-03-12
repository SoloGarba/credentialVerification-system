/**
 * frontend/src/context/UserRoleContext.jsx
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWalletContext } from './WalletContext';
import { useContract } from '../hooks/useContract';

const UserRoleContext = createContext(null);

export const UserRoleProvider = ({ children }) => {
  const { account, isConnected } = useWalletContext();
  const { getAdmin } = useContract();
  const [role, setRole] = useState(null);
  const [isAdminAddress, setIsAdminAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  const determineRole = useCallback(async () => {
    if (!account || !isConnected) { setRole(null); setIsAdminAddress(false); return; }
    setLoading(true);
    try {
      const adminAddress = await getAdmin();
      const isAdmin = adminAddress && adminAddress.toLowerCase() === account.toLowerCase();
      setIsAdminAddress(isAdmin);

      // Check saved role — but if saved role is 'admin' and user is NOT admin, ignore it
      const savedRole = localStorage.getItem(`userRole_${account}`);
      if (savedRole === 'admin' && !isAdmin) {
        localStorage.removeItem(`userRole_${account}`);
        setRole('student');
      } else if (savedRole) {
        setRole(savedRole);
      } else {
        // Default: admin → 'admin', everyone else → 'student'
        setRole(isAdmin ? 'admin' : 'student');
      }
    } catch (error) {
      console.error('Error determining role:', error);
      setRole('student');
    } finally {
      setLoading(false);
    }
  }, [account, isConnected, getAdmin]);

  const switchRole = useCallback((newRole) => {
    if (['admin', 'student', 'verifier'].includes(newRole)) {
      // Prevent non-admins from switching to admin
      if (newRole === 'admin' && !isAdminAddress) return;
      setRole(newRole);
      if (account) localStorage.setItem(`userRole_${account}`, newRole);
    }
  }, [account, isAdminAddress]);

  useEffect(() => {
    if (isConnected) {
      determineRole();
    } else {
      setRole(null);
      setIsAdminAddress(false);
    }
  }, [isConnected, account, determineRole]);

  const value = {
    role,
    loading,
    isAdmin: role === 'admin',
    isStudent: role === 'student',
    isVerifier: role === 'verifier',
    isAdminAddress,
    switchRole,
    determineRole
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
  return context;
};

export default UserRoleContext;