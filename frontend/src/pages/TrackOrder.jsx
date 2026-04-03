import React from 'react';
import { useNavigate } from 'react-router-dom';

const TrackOrder = () => {
  const navigate = useNavigate();

  return (
    <div className="info-page-container">
      <button className="btn-back" onClick={() => navigate('/')}>← Back to Home</button>
      
      <section className="info-page-section">
        <div className="section-header">
          <div className="section-badge">Orders</div>
          <h2 className="section-title">Track Your Order</h2>
          <p className="section-subtitle">Follow your current and past orders</p>
        </div>
        <div className="footer-info-grid">
          <article className="footer-info-card">
            <h3>Profile orders</h3>
            <p>Open your profile to see order status, payment state, and delivery progress for all orders.</p>
          </article>
          <article className="footer-info-card">
            <h3>Order status</h3>
            <p>Pending, Shipped, Delivered, and Cancelled are shown in your order history section.</p>
          </article>
          <article className="footer-info-card">
            <h3>Tracking number</h3>
            <p>Once your order ships, check your email for tracking details and a carrier link.</p>
          </article>
          <article className="footer-info-card">
            <h3>Estimated delivery</h3>
            <p>Your order details page shows the estimated delivery date based on your location and shipping method.</p>
          </article>
          <article className="footer-info-card">
            <h3>Order not arrived?</h3>
            <p>If your order hasn't arrived by the estimated date, check the tracking status or contact support.</p>
          </article>
          <article className="footer-info-card">
            <h3>Order history</h3>
            <p>All past orders are permanently stored in your profile for reference and reordering.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default TrackOrder;
