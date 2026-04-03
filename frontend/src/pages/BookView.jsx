import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/authContex';
import { useCart } from '../context/CartContext';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop';

const renderStars = (rating) =>
  [0, 1, 2, 3, 4].map((i) => (
    <span key={i} style={{ color: i < Math.floor(rating) ? '#c4a04a' : '#d1c5a0', fontSize: '1.1rem' }}>
      {i < Math.floor(rating) ? '★' : '☆'}
    </span>
  ));

const normalizeBook = (p) => ({
  id: p.id,
  title: p.title,
  author: p.author || 'Unknown',
  category: p.category || 'General',
  price: Number(p.price || 0),
  stock: Number(p.stock || 0),
  cover: p.imageUrl || p.image1 || p.image2 || p.image3 || FALLBACK_COVER,
  rating: Number(p.rating || 4.5),
  description: p.description || 'A great read from our catalog.',
  fullDescription: p.fullDescription || p.description || 'A great read from our catalog.',
  pages: p.pages || '',
  isbn: p.isbn || '',
  publisher: p.publisher || '',
  reviews: Array.isArray(p.reviews) ? p.reviews : [],
});

export default function BookView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { serverUrl } = useContext(authDataContext);
  const { addToCart } = useCart();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showCustomerReviews, setShowCustomerReviews] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBook = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${serverUrl}api/product/${id}`);
        if (cancelled) return;
        setBook(normalizeBook(res.data?.product || {}));
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Failed to load book details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBook();
    return () => {
      cancelled = true;
    };
  }, [id, serverUrl]);

  const totalPrice = useMemo(() => Number(book?.price || 0) * quantity, [book, quantity]);

  const handleAddToCart = () => {
    if (!book) return;
    addToCart(book, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="book-view-page">
      <div className="book-view-shell">
        <div className="book-view-topbar">
          <button type="button" className="book-view-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <Link to="/cart" className="book-view-cart-link">
            Go to Cart
          </Link>
        </div>

        {loading ? (
          <div className="book-view-loading">Loading book details...</div>
        ) : error ? (
          <div className="book-view-error">{error}</div>
        ) : book ? (
          <div className="book-view-card">
            <div className="book-view-visual">
              <img
                src={book.cover}
                alt={book.title}
                className="book-view-cover"
                onError={(e) => {
                  e.target.src = FALLBACK_COVER;
                }}
              />
              <div className="book-view-visual-meta">
                <span>{book.category}</span>
                <span>{book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</span>
              </div>
            </div>

            <div className="book-view-content">
              <div className="book-view-badge">Book Detail</div>
              <h1 className="book-view-title">{book.title}</h1>
              <p className="book-view-author">by {book.author}</p>

              <div className="book-view-rating-row">
                <div>{renderStars(book.rating)}</div>
                <span className="book-view-rating">{book.rating}</span>
                <span className="book-view-rating">({book.reviews.length} reviews)</span>
              </div>

              <div className="book-view-meta-grid">
                <div>
                  <div className="book-view-meta-label">Category</div>
                  <div className="book-view-meta-value">{book.category}</div>
                </div>
                <div>
                  <div className="book-view-meta-label">Publisher</div>
                  <div className="book-view-meta-value">{book.publisher || '—'}</div>
                </div>
                <div>
                  <div className="book-view-meta-label">Pages</div>
                  <div className="book-view-meta-value">{book.pages || '—'}</div>
                </div>
                <div>
                  <div className="book-view-meta-label">ISBN</div>
                  <div className="book-view-meta-value">{book.isbn || '—'}</div>
                </div>
              </div>

              <div className="book-view-price-row">
                <div>
                  <div className="book-view-meta-label">Price</div>
                  <div className="book-view-price">₹{book.price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="book-view-meta-label">Stock</div>
                  <div className="book-view-meta-value">{book.stock > 0 ? `${book.stock} available` : 'Out of stock'}</div>
                </div>
              </div>

              <div className="book-view-description">
                <h3>Description</h3>
                <p>{book.fullDescription || book.description}</p>
              </div>

              <div className="book-view-cart-row">
                <div className="book-view-qty">
                  <span>Quantity:</span>
                  <button type="button" className="book-view-qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <span className="book-view-qty-num">{quantity}</span>
                  <button type="button" className="book-view-qty-btn" onClick={() => setQuantity((q) => q + 1)}>+</button>
                </div>
                <button
                  type="button"
                  className={`book-view-add-btn${added ? ' book-view-add-btn--added' : ''}`}
                  onClick={handleAddToCart}
                >
                  {added ? 'Added to Cart' : `Add to Cart • ₹${totalPrice.toLocaleString('en-IN')}`}
                </button>
              </div>

              <div className="book-view-reviews-shell">
                <button
                  type="button"
                  className="book-view-reviews-toggle"
                  onClick={() => setShowCustomerReviews((prev) => !prev)}
                >
                  📝 Customer Reviews {showCustomerReviews ? '▲' : '▼'}
                </button>

                {showCustomerReviews ? (
                  <div className="book-view-reviews-list">
                    {book.reviews.length === 0 ? (
                      <p className="book-view-review-empty">No customer reviews yet.</p>
                    ) : (
                      book.reviews.map((review, index) => (
                        <div key={`${review.name}-${index}`} className="book-view-review-card">
                          <div className="book-view-review-head">
                            <strong>{review.name || 'Customer'}</strong>
                            <span>{'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}</span>
                          </div>
                          <p>{review.text}</p>
                          {review.deliveryImageUrl ? (
                            <img
                              src={review.deliveryImageUrl}
                              alt="Delivered book"
                              className="book-view-review-image"
                            />
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
