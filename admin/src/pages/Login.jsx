import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';

function Login() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    const attemptLogin = async () => {
      try {
        const res = await axios.post(
          serverUrl + 'api/auth/admin-login',
          formData,
          { 
            withCredentials: true,
            timeout: 8000
          }
        );
        console.log(res.data);
        navigate('/');
      } catch (err) {
        const isBackendDown = 
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT' ||
          err.response?.status === 502 ||
          err.response?.status === 503 ||
          err.message?.includes('timeout');

        if (isBackendDown && retryCount < MAX_RETRIES) {
          retryCount++;
          // Retry with delay
          setTimeout(attemptLogin, RETRY_DELAY_MS);
          return;
        }

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to connect to server';
        setError(msg);
        setLoading(false);
      }
    };

    attemptLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Ornament */}
        <div className="ornament">⚜</div>

        {/* Title */}
        <h1 className="auth-title">Admin Portal</h1>
        <p className="auth-subtitle">Manage your bookstore</p>
        <hr className="auth-divider" />

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">Email Address</label>
            <input
              id="admin-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Bottom divider */}
        <hr className="auth-divider-bottom" />
        <p className="auth-bottom-text">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}

export default Login;