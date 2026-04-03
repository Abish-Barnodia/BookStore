import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { authDataContext } from '../context/authContex';
import axios from 'axios';
import { getApiErrorMessage } from '../utils/apiError';

function ForgotPassword() {
  const { serverUrl } = useContext(authDataContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    

     
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResetUrl('');
             
    try {
      const res = await axios.post(
        serverUrl + 'api/auth/forgot-password',
        { email },
        { withCredentials: true }
      );
      setSuccess(
        res?.data?.message ||
          'If this address is registered, a reset link was sent. Check Inbox and Spam. Use the same email you signed up with.'
      );
      setResetUrl(res?.data?.resetUrl || '');
      setEmail('');
    } catch (err) {
      setError(getApiErrorMessage(err, err.response?.data?.message || 'Unable to connect to server'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Ornament */}
        <div className="ornament">⚜</div>

        {/* Back to login */}
        <Link to="/login" className="back-link">
          ← Back to login
        </Link>

        {/* Title */}
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your email to receive a reset link</p>
        <hr className="auth-divider" />

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {import.meta.env.DEV && resetUrl && (
          <div className="success-message" style={{ wordBreak: 'break-word' }}>
            <div>Dev only (no SMTP): open this link to reset:</div>
            <a href={resetUrl} target="_blank" rel="noreferrer">
              {resetUrl}
            </a>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email" className="form-label">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              className="form-input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
                if (success) setSuccess('');
              }}
              autoComplete="email"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Bottom */}
        <hr className="auth-divider-bottom" />
        <p className="auth-bottom-link">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>

        {/* Bottom ornament */}
        <div className="ornament" style={{ marginTop: '1rem', marginBottom: 0 }}>⚜</div>
      </div>
    </div>
  );
}

export default ForgotPassword;


