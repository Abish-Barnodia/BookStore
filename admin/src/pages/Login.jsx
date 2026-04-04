import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Login() {
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const envStorefront = (import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '');
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const envIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envStorefront);
  const fallbackStorefront = isLocalHost ? 'http://localhost:5173' : 'https://bookstore-frontend-v8pe.onrender.com';
  const storefrontBase = envStorefront && !(envIsLocal && !isLocalHost) ? envStorefront : fallbackStorefront;
  const sharedLoginUrl = `${storefrontBase}/#/login?from=admin&redirectTo=${encodeURIComponent(redirectTo)}`;

  useEffect(() => {
    window.location.replace(sharedLoginUrl);
  }, [sharedLoginUrl]);

  return null;
}

export default Login;