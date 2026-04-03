import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/authContex';
import axios from 'axios';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';

import { auth, provider } from "../utils/Firebase";
import { getApiErrorMessage } from "../utils/apiError";

const GOOGLE_ICON = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

function Registration() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shouldUseRedirectAuth = () => {
    const ua = navigator.userAgent || '';
    const isTouchDevice =
      typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
    const isCoarsePointer =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches;
    return (
      /android|iphone|ipad|ipod|mobile|wv|webview/i.test(ua) ||
      isTouchDevice ||
      Boolean(isCoarsePointer)
    );
  };

  const isStrongPassword = (value) => {
    const pwd = String(value || '');
    return (
      pwd.length >= 12 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)
    );
  };

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
    return getApiErrorMessage(err, 'Google sign up failed');
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

  useEffect(() => {
    let cancelled = false;

    const handleRedirectAuth = async () => {
      try {
        const credential = await getRedirectResult(auth);
        if (!cancelled && credential?.user) {
          setLoading(true);
          await handleGoogleCredential(credential);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('googleSignup redirect', err);
          setError(getGoogleAuthMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    handleRedirectAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo, serverUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!isStrongPassword(formData.password)) {
      setError('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        serverUrl + 'api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );
      console.log(res.data);
      // After creating an account, send user back to login.
      navigate('/login', { state: { redirectTo } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to connect to server'));
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      if (shouldUseRedirectAuth()) {
        await signInWithRedirect(auth, provider);
        return;
      }

      let credential;
      try {
        credential = await signInWithPopup(auth, provider);
      } catch (err) {
        if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }
      await handleGoogleCredential(credential);
    } catch (error) {
      console.error('googleSignup', error);
      setError(getGoogleAuthMessage(error));
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
        <h1 className="auth-title">Join Bibliotheca</h1>
        <p className="auth-subtitle">Start your literary journey today</p>
        <hr className="auth-divider" />

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">Full Name</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="john@gmail.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-text">
          <span>or continue with</span>
        </div>

        {/* Google */}
        <button className="btn-google" type="button" onClick={googleSignup} disabled={loading}>
          <img src={GOOGLE_ICON} alt="Google" />
          Sign up with Google
        </button>

        {/* Bottom divider & link */}
        <hr className="auth-divider-bottom" />
        <p className="auth-bottom-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Registration;
