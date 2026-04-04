import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Login() {
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const storefrontBase = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const sharedLoginUrl = `${storefrontBase}/login?from=admin&redirectTo=${encodeURIComponent(redirectTo)}`;

  useEffect(() => {
    window.location.replace(sharedLoginUrl);
  }, [sharedLoginUrl]);

  return null;
}

export default Login;