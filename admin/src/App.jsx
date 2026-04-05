import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Nav     from './components/Nav';
import Home      from './pages/Home';
import List      from './pages/List';
import Add       from './pages/Add';
import Orders    from './pages/Orders';
import Users     from './pages/Users';
import Profile   from './pages/Profile';
import AccessDenied from './pages/AccessDenied';
import { authDataContext } from './context/AuthContext';
import { clearAuthToken, getAuthToken } from './utils/sessionAuth';
import './App.css';

function SharedLoginRedirect({ redirectTo = '/' }) {
  const envStorefront = (import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '');
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const envIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envStorefront);
  const fallbackStorefront = isLocalHost ? 'http://localhost:5173' : 'https://bookstore-frontend-v8pe.onrender.com';
  const storefrontBase = envStorefront && !(envIsLocal && !isLocalHost) ? envStorefront : fallbackStorefront;

  useEffect(() => {
    const url = `${storefrontBase}/#/login?from=admin&redirectTo=${encodeURIComponent(redirectTo)}`;
    window.location.replace(url);
  }, [redirectTo, storefrontBase]);

  return null;
}

/* Wrap every protected page with Sidebar + Navbar */
function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    closeOnResize();
    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, []);

  return (
    <div className={`admin-shell${sidebarOpen ? ' admin-shell--menu-open' : ''}`}>
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="admin-main">
        <Nav onMenuClick={() => setSidebarOpen((value) => !value)} />
        <main className="admin-body">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminGuard({ children }) {
  const { serverUrl } = React.useContext(authDataContext);
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 1000; // 1 second between retries
    const token = getAuthToken();

    const checkAdmin = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const res = await axios.post(
          `${serverUrl}api/user/get-user`,
          {},
          { 
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000 // 8 second timeout per request
          }
        );

        if (cancelled) return;
        const user = res.data?.user;
        const authenticated = Boolean(user?._id || user?.email);
        setIsAuthenticated(authenticated);
        setIsAdmin(authenticated && (user?.role === 'admin' || user?.role === 'super-admin'));
        setBackendError(null);
      } catch (error) {
        if (cancelled) return;

        const status = error.response?.status;

        // Check if this is a connection/backend error (502, 503, ECONNREFUSED, timeout)
        const isBackendDown = 
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          status === 502 ||
          status === 503 ||
          error.message?.includes('timeout');

        if (isBackendDown && retryCount < MAX_RETRIES) {
          retryCount++;
          // Retry with delay
          setTimeout(() => {
            if (!cancelled) checkAdmin();
          }, RETRY_DELAY_MS);
          return;
        }

        // After max retries or non-backend error, show error
        if (isBackendDown) {
          setBackendError('Backend server is not running. Please start the backend first (npm run dev in backend/)');
          setIsAuthenticated(false);
          setIsAdmin(false);
        } else if (status === 401) {
          setBackendError(null); // Not logged in is fine
          clearAuthToken();
          setIsAuthenticated(false);
          setIsAdmin(false);
        } else if (status === 403) {
          setBackendError(null); // Forbidden is an auth/role issue, not a connectivity issue
          setIsAuthenticated(true);
          setIsAdmin(false);
        } else {
          setBackendError('Failed to connect to backend. Please check if the server is running.');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [serverUrl]);

  if (checking) {
    return (
      <div className="page-content">
        <p className="td-muted">Checking admin access...</p>
      </div>
    );
  }

  if (backendError) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px', 
          padding: '1.5rem',
          maxWidth: '500px',
          margin: '2rem auto'
        }}>
          <h2 style={{ color: '#c33', marginTop: 0 }}>⚠️ Connection Error</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{backendError}</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Make sure the backend is running before accessing the admin panel.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SharedLoginRedirect redirectTo={`${location.pathname}${location.search || ''}`} />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<SharedLoginRedirect />} />

      {/* Protected admin routes */}
      <Route path="/" element={
        <AdminGuard><AdminLayout><Home /></AdminLayout></AdminGuard>
      } />
      <Route path="/inventory" element={
        <AdminGuard><AdminLayout><List /></AdminLayout></AdminGuard>
      } />
      <Route path="/inventory/add" element={
        <AdminGuard><AdminLayout><Add /></AdminLayout></AdminGuard>
      } />
      <Route path="/inventory/edit/:id" element={
        <AdminGuard><AdminLayout><Add /></AdminLayout></AdminGuard>
      } />
      <Route path="/orders" element={
        <AdminGuard><AdminLayout><Orders /></AdminLayout></AdminGuard>
      } />
      <Route path="/users" element={
        <AdminGuard><AdminLayout><Users /></AdminLayout></AdminGuard>
      } />
      <Route path="/profile" element={
        <AdminGuard><AdminLayout><Profile /></AdminLayout></AdminGuard>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
