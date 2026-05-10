import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoaderOverlay from '../Components/LoaderOverlay';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const loginType = params.get('loginType');

    if (token && loginType) {
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('loginType', 'user'); // Standardize as 'user' for consistency
      
      // Redirect to home page
      window.location.href = '/';
    } else {
      // If no token, redirect to login with error
      navigate('/login?error=google_auth_incomplete');
    }
  }, [navigate, location]);

  return (
    <LoaderOverlay show={true} message="Authenticating with Google..." />
  );
};

export default GoogleCallback;
