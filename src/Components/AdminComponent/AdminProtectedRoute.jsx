import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, selectUserInitializing, fetchCurrentUser } from '../../Features/Backend/UserSlice';
import LoaderOverlay from '../LoaderOverlay';
import { getAuthToken } from '../../utils/auth';

const getUserRecord = (user) => user?.data || user;

const isAdminUser = (user) => {
  const record = getUserRecord(user);
  return (record?.role || '').toLowerCase() === 'admin';
};

const AdminProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const initializing = useSelector(selectUserInitializing);
  const navigate = useNavigate();
  const [fetchFailed, setFetchFailed] = useState(false);
  const profileFetchStarted = useRef(false);

  const token = getAuthToken();
  const loginType = localStorage.getItem('loginType');
  const hasAdmin = isAdminUser(user);

  useEffect(() => {
    if (!token || loginType !== 'user') {
      navigate('/login');
      return;
    }

    if (!hasAdmin && !initializing && !profileFetchStarted.current) {
      profileFetchStarted.current = true;
      dispatch(fetchCurrentUser())
        .unwrap()
        .then((data) => {
          setFetchFailed(false);
          if ((data?.role || '').toLowerCase() !== 'admin') {
            navigate('/');
          }
        })
        .catch(() => {
          setFetchFailed(true);
        });
    }
  }, [dispatch, token, loginType, hasAdmin, initializing, navigate]);

  useEffect(() => {
    if (!initializing && hasAdmin) {
      setFetchFailed(false);
    }
  }, [initializing, hasAdmin]);

  if (!token || loginType !== 'user') {
    return null;
  }

  if (fetchFailed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a1428',
          color: '#fff',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <p>Could not load admin session. Please login again.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#00eaff',
            color: '#0a1428',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!hasAdmin && initializing) {
    return <LoaderOverlay show message="Loading admin panel..." />;
  }

  if (!hasAdmin) {
    return <LoaderOverlay show message="Loading admin panel..." />;
  }

  return children;
};

export default AdminProtectedRoute;
