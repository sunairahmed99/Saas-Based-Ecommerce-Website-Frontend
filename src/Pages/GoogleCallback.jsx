import React, { useEffect, useRef } from 'react';
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
import { saveCatalogCache } from '../utils/catalogCache';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const completeGoogleLogin = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const loginType = params.get('loginType') || 'google';
      const redirectTo = sessionStorage.getItem('postLoginRedirect') || params.get('redirectTo') || '/shop';

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

        const [categories, subcategories, products] = await Promise.all([
          dispatch(fetchcategories()).unwrap().catch(() => null),
          dispatch(fetchsubcategories()).unwrap().catch(() => null),
          dispatch(fetchproducts()).unwrap().catch(() => null),
          prefetchAllShopProducts(queryClient).catch(() => null),
        ]);

        saveCatalogCache({
          categories: categories || undefined,
          subcategories: subcategories || undefined,
          products: products || undefined,
        });

        sessionStorage.setItem('splashComplete', '1');
        sessionStorage.removeItem('postLoginRedirect');
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
