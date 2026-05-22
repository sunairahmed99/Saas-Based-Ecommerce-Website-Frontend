import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, selectUserInitializing, fetchCurrentUser } from '../../Features/Backend/UserSlice';
import { selectSeller } from '../../Features/Backend/SellerSlice';
import LoaderOverlay from '../LoaderOverlay';

const AdminProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const initializing = useSelector(selectUserInitializing);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginType = localStorage.getItem('loginType');
    if (token && loginType === 'user' && !user?.data) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, user?.data]);

  useEffect(() => {
    // Wait for initialization to complete
    if (initializing) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const loginType = localStorage.getItem('loginType');

    if (!token) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    // If we have user data, check role
    if (user?.data) {
      if (loginType === 'user' && user.data.role === 'admin') {
        // Admin user, allow access
        return;
      } else {
        // Not an admin or wrong login type, redirect to home
        navigate('/');
        return;
      }
    }

    // If we have token but no user data yet, wait for it to load
    // The component will re-render when user data loads

  }, [user, seller, initializing, navigate]);

  // Show loading while initializing
  if (initializing) {
    return <LoaderOverlay />;
  }

  // If still initializing or no user data yet, show loading
  if (initializing || (localStorage.getItem('token') && !user?.data)) {
    return <LoaderOverlay />;
  }

  // Check final conditions
  const token = localStorage.getItem('token');
  const loginType = localStorage.getItem('loginType');

  if (!token || loginType !== 'user' || !user?.data || user.data.role !== 'admin') {
    return null;
  }

  // Render children if admin
  return children;
};

export default AdminProtectedRoute;
