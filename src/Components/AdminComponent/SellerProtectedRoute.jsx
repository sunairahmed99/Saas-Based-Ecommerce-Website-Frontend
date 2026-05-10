import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, selectUserInitializing } from '../../Features/Backend/UserSlice';
import { selectSeller, selectSellerInitializing } from '../../Features/Backend/SellerSlice';
import LoaderOverlay from '../LoaderOverlay';

const SellerProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const userInitializing = useSelector(selectUserInitializing);
  const sellerInitializing = useSelector(selectSellerInitializing);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for initialization to complete
    if (userInitializing || sellerInitializing) return;

    // Check if seller is logged in
    const token = localStorage.getItem('token');
    const loginType = localStorage.getItem('loginType');

    if (!token) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    // Check if user is logged in as seller
    if (loginType === 'seller' && seller?.data) {
      // Seller user, allow access
      return;
    }

    // Not a seller, redirect to home
    navigate('/');
    return;

  }, [seller, userInitializing, sellerInitializing, navigate]);

  // Show loading while initializing
  if (userInitializing || sellerInitializing) {
    return <LoaderOverlay />;
  }

  // If not seller, don't render children (redirect will happen in useEffect)
  const token = localStorage.getItem('token');
  const loginType = localStorage.getItem('loginType');

  if (!token || loginType !== 'seller' || !seller?.data) {
    return null;
  }

  // Render children if seller
  return children;
};

export default SellerProtectedRoute;
