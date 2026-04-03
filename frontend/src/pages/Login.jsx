import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/authContex';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/Firebase';
import { getApiErrorMessage } from '../utils/apiError';

const GOOGLE_ICON = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

function Login() { 
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getGoogleAuthMessage = (err) => {
    const code = err?.code || '';
    if (code === 'auth/unauthorized-domain') {
      return 'Google sign-in domain is not authorized in Firebase. Add this domain in Firebase Console -> Authentication -> Settings -> Authorized domains.';
    }
    if (code === 'auth/web-storage-unsupported') {
      return 'Browser privacy settings blocked Google sign-in storage. Disable strict tracking prevention for this site or use email/password login.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google popup was closed before sign-in completed. Please try again.';
    }
    return getApiErrorMessage(err, 'Google sign-in failed');
  };

  const handleGoogleCredential = async (credential) => {
    if (!credential?.user) return;
    const idToken = await credential.user.getIdToken();
    await axios.post(
      serverUrl + 'api/auth/google-login',
      { idToken },
      { withCredentials: true }
    );
    navigate(redirectTo);
  };

  useEffect(() => {}, [navigate, redirectTo, serverUrl]);

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

    try {
      const res = await axios.post(
        serverUrl + 'api/auth/login',
        formData,
        { withCredentials: true }
      );
      console.log(res.data);
      navigate(redirectTo);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to connect to server'));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const credential = await signInWithPopup(auth, provider);
      await handleGoogleCredential(credential);
    } catch (err) {
      console.error('googleLogin', err);
      console.error('googleLogin response data:', err?.response?.data);
      setError(getGoogleAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Ornament */}
        <div className="ornament">⚜</div>

        {/* Title */}
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Continue your literary adventure</p>
        <hr className="auth-divider" />

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
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
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-text">
          <span>or continue with</span>
        </div>

        {/* Google */}
        <button className="btn-google" type="button" onClick={googleLogin} disabled={loading}>
          <img src={GOOGLE_ICON} alt="Google" />
          Sign in with Google
        </button>

        {/* Bottom divider & link */}
        <hr className="auth-divider-bottom" />
        <p className="auth-bottom-link">
          Don't have an account?{' '}
          <Link to="/signup" state={{ redirectTo }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
