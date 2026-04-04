import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Login() {
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const storefrontBase = (import.meta.env.VITE_STOREFRONT_URL || 'https://bookstore-frontend-v8pe.onrender.com').replace(/\/$/, '');
  const sharedLoginUrl = `${storefrontBase}/login?from=admin&redirectTo=${encodeURIComponent(redirectTo)}`;

  useEffect(() => {
    window.location.replace(sharedLoginUrl);
  }, [sharedLoginUrl]);

  return null;
}

export default Login;