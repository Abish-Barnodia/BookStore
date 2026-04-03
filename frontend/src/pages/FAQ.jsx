import React from 'react';
import { useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Help Center</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Quick answers to common questions</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>How do I place an order?</h3>
            <p>Open a book, add it to cart, then continue to checkout from the cart page.</p>
          </article>
          <article className="footer-info-card">
            <h3>Can I track my order?</h3>
            <p>Yes. After placing an order, open your profile orders section to see order status and delivery progress.</p>
          </article>
          <article className="footer-info-card">
            <h3>Need help?</h3>
            <p>Use the newsletter/contact section on the home page to reach us with any order issue.</p>
          </article>
          <article className="footer-info-card">
            <h3>What payment methods do you accept?</h3>
            <p>We accept credit cards and digital payment methods through our secure checkout system.</p>
          </article>
          <article className="footer-info-card">
            <h3>Can I change my order after placing it?</h3>
            <p>Contact us immediately through the contact form if you need to modify your order before it ships.</p>
          </article>
          <article className="footer-info-card">
            <h3>Do you offer international shipping?</h3>
            <p>Currently, we ship within the country. International options may be available soon.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
