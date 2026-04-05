import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Legal</div>
          <h2 className="section-title">Privacy Policy</h2>
          <p className="section-subtitle">How we handle your personal information</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Data collection</h3>
            <p>We collect information needed for account creation, payment processing, and order fulfillment.</p>
          </article>
          <article className="footer-info-card">
            <h3>Data use</h3>
            <p>We only use your details to process orders, support your account, and improve the store experience.</p>
          </article>
          <article className="footer-info-card">
            <h3>Security</h3>
            <p>Your session cookies and order details are handled through secure backend authentication flows.</p>
          </article>
          <article className="footer-info-card">
            <h3>Third parties</h3>
            <p>We do not sell your data. We may share information with payment processors and shipping partners only as needed.</p>
          </article>
          <article className="footer-info-card">
            <h3>Cookies</h3>
            <p>We use cookies to maintain your session and improve your browsing experience. See our Cookie Policy for details.</p>
          </article>
          <article className="footer-info-card">
            <h3>Your rights</h3>
            <p>You can update your profile information or request account deletion at any time through your profile settings.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
