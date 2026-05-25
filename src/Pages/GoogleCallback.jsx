import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import LoaderOverlay from '../Components/LoaderOverlay';
import { fetchCurrentUser } from '../Features/Backend/UserSlice';
import { fetchCartItems } from '../Features/Backend/CartSlice';
import { fetchFavorites } from '../Features/Backend/FavoriteSlice';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const completeGoogleLogin = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const loginType = params.get('loginType') || 'google';
      const redirectTo = params.get('redirectTo') || '/';

      if (!token) {
        navigate('/login?error=google_auth_incomplete', { replace: true });
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('loginType', loginType);

      try {
        await dispatch(fetchCurrentUser()).unwrap();
        dispatch(fetchCartItems({ force: true }));
        if (loginType === 'google' || loginType === 'user') {
          dispatch(fetchFavorites());
        }
        navigate(redirectTo, { replace: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('loginType');
        navigate('/login?error=google_auth_failed', { replace: true });
      }
    };

    completeGoogleLogin();
  }, [dispatch, location.search, navigate]);

  return (
    <LoaderOverlay show={true} message="Signing you in with Google..." />
  );
};

export default GoogleCallback;
