import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Legal</div>
          <h2 className="section-title">Terms of Service</h2>
          <p className="section-subtitle">Rules and conditions for using our bookstore</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Account creation</h3>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining account security.</p>
          </article>
          <article className="footer-info-card">
            <h3>Account use</h3>
            <p>Keep your login information private and use the store responsibly. Do not share or transfer your account.</p>
          </article>
          <article className="footer-info-card">
            <h3>Purchases</h3>
            <p>Orders are subject to product availability, payment confirmation, and the store's policies.</p>
          </article>
          <article className="footer-info-card">
            <h3>Product liability</h3>
            <p>Books are sold as-is. We are not liable for content within books or personal injuries from product use.</p>
          </article>
          <article className="footer-info-card">
            <h3>Prohibited conduct</h3>
            <p>Do not attempt unauthorized access, copying, or distribution of content from our platform.</p>
          </article>
          <article className="footer-info-card">
            <h3>Modification rights</h3>
            <p>We reserve the right to modify these terms at any time. Continued use implies acceptance of updated terms.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
