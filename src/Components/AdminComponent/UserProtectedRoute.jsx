import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginType = localStorage.getItem('loginType');

    // Simple check: if no token, redirect to login
    if (!token || !loginType) {
      navigate('/login');
    }
  }, [navigate]);

  const token = localStorage.getItem('token');
  const loginType = localStorage.getItem('loginType');

  // If no token, don't render anything (will redirect in useEffect)
  if (!token || !loginType) {
    return null;
  }

  // If we have a token, assume user is authenticated
  return children;
};

export default UserProtectedRoute;
