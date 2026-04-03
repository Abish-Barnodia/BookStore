import React from 'react';
import { useNavigate } from 'react-router-dom';

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ maxWidth: 720, margin: '2rem auto' }}>
      <div className="section-card" style={{ padding: '1.5rem' }}>
        <h2 className="section-card-title" style={{ fontSize: '1.3rem', marginBottom: '0.8rem' }}>
          Access denied (403)
        </h2>
        <p className="td-muted" style={{ fontSize: '0.95rem', marginBottom: '1.2rem' }}>
          You are signed in, but your account does not have administrator permissions for this panel.
        </p>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn-modal-cancel" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;