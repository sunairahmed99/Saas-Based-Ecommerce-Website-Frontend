import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const loginType = params.get('loginType') || 'google';

    if (!token) {
      navigate('/login?error=google_auth_incomplete', { replace: true });
      return;
    }

    // Sirf token save karo — koi API call nahi
    localStorage.setItem('token', token);
    localStorage.setItem('loginType', loginType);
    sessionStorage.removeItem('postLoginRedirect');

    // Seedha splash/home pe redirect
    navigate('/', { replace: true });

  }, [location.search, navigate]);

  return null;
};

export default GoogleCallback;

