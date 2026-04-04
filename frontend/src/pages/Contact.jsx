import React from 'react';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Home</button>

      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Support</div>
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Get help with orders, payments, or account issues</p>
        </div>

        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Email support</h3>
            <p>Write to support@bibliotheca.store and we usually reply within 24 hours.</p>
          </article>

          <article className="footer-info-card">
            <h3>Phone support</h3>
            <p>Call +91 90000 12345 from Monday to Saturday, 9:00 AM to 7:00 PM.</p>
          </article>

          <article className="footer-info-card">
            <h3>Order help</h3>
            <p>Share your order ID so we can quickly assist with tracking, returns, or replacements.</p>
          </article>

          <article className="footer-info-card">
            <h3>Business inquiries</h3>
            <p>For partnerships, bulk purchases, and publishing requests, contact business@bibliotheca.store.</p>
          </article>

          <article className="footer-info-card">
            <h3>Address</h3>
            <p>Bibliotheca Bookstore, 21 Library Lane, New Delhi, India.</p>
          </article>

          <article className="footer-info-card">
            <h3>Need to go back?</h3>
            <p>Use the "Back to Home" button above to return to the home page anytime.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Contact;
