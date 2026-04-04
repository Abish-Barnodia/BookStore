import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/authContex';

function AdminPortal() {
  const { serverUrl } = useContext(authDataContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  const adminTargetUrl = useMemo(() => {
    const adminBaseUrl = (import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5174').replace(/\/$/, '');
    const pathWithoutAdmin = location.pathname.replace(/^\/admin/, '') || '/';
    const query = location.search || '';
    return `${adminBaseUrl}${pathWithoutAdmin.startsWith('/') ? pathWithoutAdmin : `/${pathWithoutAdmin}`}${query}`;
  }, [location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;

    const validateAdminAccess = async () => {
      try {
        const res = await axios.post(
          `${serverUrl}api/user/get-user`,
          {},
          { withCredentials: true, timeout: 8000 }
        );

        if (cancelled) return;

        const role = res?.data?.user?.role;
        if (role === 'admin' || role === 'super-admin') {
          setStatus('allowed');
          return;
        }

        setStatus('denied');
      } catch (err) {
        if (cancelled) return;

        if (err?.response?.status === 401) {
          navigate('/login', {
            replace: true,
            state: { redirectTo: location.pathname + location.search },
          });
          return;
        }

        setStatus('error');
        setError(err?.response?.data?.message || err?.message || 'Unable to load admin area');
      }
    };

    validateAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, navigate, serverUrl]);

  useEffect(() => {
    if (status === 'allowed') {
      window.location.replace(adminTargetUrl);
    }
  }, [status, adminTargetUrl]);

  if (status === 'checking') {
    return <div style={{ padding: '2rem' }}>Checking admin access...</div>;
  }

  if (status === 'denied') {
    return <div style={{ padding: '2rem' }}>Access denied: this account is not an admin.</div>;
  }

  if (status === 'error') {
    return <div style={{ padding: '2rem' }}>Admin area unavailable: {error}</div>;
  }

  return <div style={{ padding: '2rem' }}>Redirecting to admin dashboard...</div>;
}

export default AdminPortal;
