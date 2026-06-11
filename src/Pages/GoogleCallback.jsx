import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import LoaderOverlay from '../Components/LoaderOverlay';
import { fetchCurrentUser } from '../Features/Backend/UserSlice';
import { fetchFavorites } from '../Features/Backend/FavoriteSlice';
import { fetchcategories } from '../Features/Backend/CategorySlice';
import { fetchsubcategories } from '../Features/Backend/SubCategorySlice';
import { fetchproducts } from '../Features/Backend/ProductSlice';
import { prefetchAllShopProducts } from '../utils/prefetchProduct';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

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
        if (loginType === 'google' || loginType === 'user') {
          dispatch(fetchFavorites());
        }

        // Google OAuth does a full page reload, wiping in-memory caches.
        // Warm shop data before redirect so the shop page does not show a loading skeleton.
        await Promise.all([
          dispatch(fetchcategories()).unwrap().catch(() => {}),
          dispatch(fetchsubcategories()).unwrap().catch(() => {}),
          dispatch(fetchproducts()).unwrap().catch(() => {}),
          prefetchAllShopProducts(queryClient).catch(() => {}),
        ]);

        sessionStorage.setItem('splashComplete', '1');
        navigate(redirectTo, { replace: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('loginType');
        navigate('/login?error=google_auth_failed', { replace: true });
      }
    };

    completeGoogleLogin();
  }, [dispatch, queryClient, location.search, navigate]);

  return (
    <LoaderOverlay show={true} message="Signing you in with Google..." />
  );
};

export default GoogleCallback;
