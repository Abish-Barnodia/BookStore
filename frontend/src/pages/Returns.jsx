import React from 'react';
import { useNavigate } from 'react-router-dom';

const Returns = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Returns</div>
          <h2 className="section-title">Return Policy</h2>
          <p className="section-subtitle">What to do if your order arrives damaged or you're unsatisfied</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Eligible returns</h3>
            <p>If a book is damaged, incorrect, or defective, contact support within 7 days of delivery.</p>
          </article>
          <article className="footer-info-card">
            <h3>Resolution</h3>
            <p>We will replace the item or issue a refund after verification and inspection.</p>
          </article>
          <article className="footer-info-card">
            <h3>How to initiate a return</h3>
            <p>Contact our support team with your order number and clear photos of the damage or issue.</p>
          </article>
          <article className="footer-info-card">
            <h3>Return shipping</h3>
            <p>For damaged items, we provide a return label. Return shipping is covered for eligible issues.</p>
          </article>
          <article className="footer-info-card">
            <h3>Refund timeline</h3>
            <p>Refunds are typically processed within 5-10 business days after we receive your return.</p>
          </article>
          <article className="footer-info-card">
            <h3>Conditions</h3>
            <p>Books must be in resalable condition. Minor wear is acceptable if due to shipping, not misuse.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Returns;
