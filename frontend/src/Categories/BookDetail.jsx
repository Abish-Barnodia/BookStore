import React, { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';

const renderStars = (rating) =>
  [0, 1, 2, 3, 4].map((i) => (
    <span key={i} style={{ color: i < Math.floor(rating) ? '#c4a04a' : '#d1c5a0', fontSize: '1.1rem' }}>
      {i < Math.floor(rating) ? '★' : '☆'}
    </span>
  ));

export default function BookDetail({ book, onClose, onBookUpdated }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [favourite, setFavourite] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState(book.reviews || []);
  const [showCustomerReviews, setShowCustomerReviews] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews.length) return Number(book.rating || 4.5);
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [book.rating, reviews]);

  const handleAddToCart = () => {
    addToCart(book, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bd-panel">
        {/* Close button */}
        <button className="bd-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Cover */}
        <div className="bd-cover-wrapper">
          <img
            src={book.cover}
            alt={book.title}
            className="bd-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop';
            }}
          />
        </div>

        {/* Add to Favorites */}
        <button
          className={`bd-fav-btn ${favourite ? 'active' : ''}`}
          onClick={() => setFavourite((f) => !f)}
        >
          {favourite ? '♥' : '♡'} {favourite ? 'Added to Favourites' : 'Add to Favourites'}
        </button>

        {/* Title / Author */}
        <h1 className="bd-title">{book.title}</h1>
        <p className="bd-author">by {book.author}</p>

        {/* Stars + review count */}
        <div className="bd-rating-row">
          <div className="bd-stars">{renderStars(avgRating)}</div>
          <span className="bd-rating-num">{avgRating}</span>
          <span className="bd-review-count">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
        </div>

        <hr className="bd-divider" />

        {/* Book details grid */}
        <div className="bd-details-grid">
          <div className="bd-detail-cell">
            <span className="bd-detail-icon">📖</span>
            <div>
              <div className="bd-detail-label">Pages</div>
              <div className="bd-detail-value">{book.pages || '—'}</div>
            </div>
          </div>
          <div className="bd-detail-cell">
            <div>
              <div className="bd-detail-label">Publisher</div>
              <div className="bd-detail-value">{book.publisher || '—'}</div>
            </div>
          </div>
          <div className="bd-detail-cell">
            <div>
              <div className="bd-detail-label">ISBN</div>
              <div className="bd-detail-value">{book.isbn || '—'}</div>
            </div>
          </div>
          <div className="bd-detail-cell">
            <div>
              <div className="bd-detail-label">Price</div>
              <div className="bd-detail-value bd-detail-price">₹{book.price}</div>
            </div>
          </div>
        </div>

        <hr className="bd-divider" />

        {/* Description */}
        <h3 className="bd-section-title">Description</h3>
        <p className="bd-desc">{book.fullDescription || book.description}</p>

        <hr className="bd-divider" />

        {/* Quantity + Add to Cart */}
        <div className="bd-cart-row">
          <div className="bd-qty">
            <span className="bd-qty-label">Quantity:</span>
            <button className="bd-qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span className="bd-qty-num">{quantity}</span>
            <button className="bd-qty-btn" onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <button
            className={`bd-add-cart-btn ${added ? 'bd-added' : ''}`}
            onClick={handleAddToCart}
          >
            {added ? '✓ Added to Cart!' : `🛒 Add to Cart (₹${book.price * quantity})`}
          </button>
        </div>

        <hr className="bd-divider" />

        {/* Customer Reviews */}
        <div className="bd-review-title-row">
          <h3 className="bd-section-title">Customer Reviews</h3>
          <button
            type="button"
            className="bd-customer-review-icon"
            onClick={() => setShowCustomerReviews((prev) => !prev)}
          >
            📝 Customer Reviews {showCustomerReviews ? '▲' : '▼'}
          </button>
        </div>

        {showCustomerReviews ? (
          <div className="bd-reviews-list">
            {reviews.length === 0 && (
              <p className="bd-no-reviews">No customer reviews yet.</p>
            )}
            {reviews.map((r, i) => (
              <div key={i} className="bd-review-card">
                <div className="bd-review-header">
                  <div className="bd-avatar">{(r.name || 'C').charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="bd-reviewer-name">{r.name || 'Customer'}</div>
                    <div className="bd-review-stars">
                      {[0,1,2,3,4].map((s) => (
                        <span key={s} style={{ color: s < r.rating ? '#c4a04a' : '#d1c5a0', fontSize: '0.9rem' }}>
                          {s < r.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="bd-review-text">{r.text}</p>
                {r.deliveryImageUrl ? (
                  <img src={r.deliveryImageUrl} alt="Delivered product" className="bd-delivery-proof" />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
