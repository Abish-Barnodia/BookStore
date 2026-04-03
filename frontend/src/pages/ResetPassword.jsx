import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/authContex';

function ResetPassword() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        serverUrl + 'api/auth/reset-password',
        { token, newPassword },
        { withCredentials: true }
      );
      setSuccess('Password updated successfully. Please sign in.');
      setNewPassword('');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to reset password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="ornament">⚜</div>

        <Link to="/login" className="back-link">
          ← Back to login
        </Link>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Choose a new password</p>
        <hr className="auth-divider" />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-password" className="form-label">New Password</label>
            <input
              id="reset-password"
              type="password"
              className="form-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
                if (success) setSuccess('');
              }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

