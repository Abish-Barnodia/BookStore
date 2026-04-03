import React from 'react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Legal</div>
          <h2 className="section-title">Cookie Policy</h2>
          <p className="section-subtitle">How cookies are used on this site</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Session cookies</h3>
            <p>We use cookies to keep you signed in and to support secure checkout sessions throughout your visit.</p>
          </article>
          <article className="footer-info-card">
            <h3>Browsing preferences</h3>
            <p>Cookies help remember your browsing session while you move between pages and return to previously viewed books.</p>
          </article>
          <article className="footer-info-card">
            <h3>Cart data</h3>
            <p>Your shopping cart is stored locally using browser storage, not tracking cookies.</p>
          </article>
          <article className="footer-info-card">
            <h3>Authentication</h3>
            <p>Authentication tokens are stored securely in cookies and sent with each request to verify your identity.</p>
          </article>
          <article className="footer-info-card">
            <h3>Third-party cookies</h3>
            <p>We do not use third-party tracking cookies or analytics that profile your behavior across other sites.</p>
          </article>
          <article className="footer-info-card">
            <h3>Cookie control</h3>
            <p>You can disable cookies in your browser settings, but this may affect your ability to use some features.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicy;
