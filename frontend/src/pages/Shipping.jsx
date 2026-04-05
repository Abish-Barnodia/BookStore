import React from 'react';
import { useNavigate } from 'react-router-dom';

const Shipping = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Shipping</div>
          <h2 className="section-title">Shipping Information</h2>
          <p className="section-subtitle">Delivery timing and handling details</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Delivery window</h3>
            <p>Orders are usually dispatched within 1-2 business days and delivered in 3-7 business days.</p>
          </article>
          <article className="footer-info-card">
            <h3>Packaging</h3>
            <p>Books are packed securely to protect covers and corners during transit.</p>
          </article>
          <article className="footer-info-card">
            <h3>Tracking information</h3>
            <p>Once your order ships, you'll receive tracking details via your registered contact information.</p>
          </article>
          <article className="footer-info-card">
            <h3>Shipping costs</h3>
            <p>Shipping costs are calculated based on order weight and destination at checkout.</p>
          </article>
          <article className="footer-info-card">
            <h3>Free shipping</h3>
            <p>Some orders may qualify for free shipping. Check your cart for eligibility.</p>
          </article>
          <article className="footer-info-card">
            <h3>Delays</h3>
            <p>In rare cases, shipments may be delayed due to weather or carrier issues. We'll notify you promptly.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Shipping;
