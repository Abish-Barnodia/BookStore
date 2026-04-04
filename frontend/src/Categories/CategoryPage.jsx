import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookDetail from './BookDetail';
import { useCart } from '../context/CartContext';
import { authDataContext } from '../context/authContex';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=420&fit=crop';

function normalizeBook(p) {
  const cover = p.imageUrl || p.image1 || p.image2 || p.image3 || FALLBACK_COVER;
  return {
    id: p.id,
    title: p.title,
    author: p.author || 'Unknown',
    rating: Number(p.rating || 4.5),
    price: Number(p.price || 0),
    pages: p.pages || 0,
    isbn: p.isbn || '',
    publisher: p.publisher || '',
    cover,
    description: p.description || 'A great read from our catalog.',
    fullDescription: p.fullDescription || p.description || 'A great read from our catalog.',
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
  };
}

export default function CategoryPage({ title, icon, category }) {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { serverUrl } = useContext(authDataContext);
  const [wishlist, setWishlist] = useState({});
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleBookUpdated = (updatedBook) => {
    if (!updatedBook?.id) return;
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? { ...b, ...updatedBook } : b)));
    setSelectedBook((prev) => (prev?.id === updatedBook.id ? { ...prev, ...updatedBook } : prev));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${serverUrl}api/product/list`, {
          params: { category },
          withCredentials: true,
        });
        if (cancelled) return;
        const rows = (res.data?.products || []).map(normalizeBook);
        setBooks(rows);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load books');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, serverUrl]);

  const emptyMsg = useMemo(() => `No ${category} books in inventory yet.`, [category]);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    return [0, 1, 2, 3, 4].map((i) => (
      <span key={i} style={{ color: i < full ? '#c4a04a' : '#d1c5a0', fontSize: '0.85rem' }}>
        {i < full ? '*' : '-'}
      </span>
    ));
  };

  return (
    <div className="cat-page">
      <div className="cat-header">
        <div className="cat-header-left">
          <button className="cat-back-btn" onClick={() => navigate('/dashboard')}>{'<-'}</button>
          <div>
            <h1 className="cat-title">{icon} {title}</h1>
            <p className="cat-count">{books.length} books available</p>
          </div>
        </div>
        <button className="cat-cart-btn" onClick={() => navigate('/cart')}>
          Cart{totalItems > 0 && <span className="cat-cart-badge">{totalItems}</span>}
        </button>
      </div>

      {error && <div className="error-message" style={{ margin: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '1.5rem', color: '#6d5430' }}>Loading books...</div>
      ) : (
        <div className="cat-book-grid">
          {books.length === 0 && <p style={{ color: '#6d5430' }}>{emptyMsg}</p>}
          {books.map((book) => (
            <div key={book.id} className="cat-book-card">
              <div className="cat-cover-wrapper">
                <img src={book.cover} alt={book.title} className="cat-cover"
                  onError={(e) => { e.target.src = FALLBACK_COVER; }} />
                <button className={`cat-heart ${wishlist[book.id] ? 'wishlisted' : ''}`}
                  onClick={() => setWishlist((p) => ({ ...p, [book.id]: !p[book.id] }))} aria-label="Wishlist">
                  {wishlist[book.id] ? 'x' : '+'}
                </button>
              </div>
              <div className="cat-book-info">
                <h3 className="cat-book-title">{book.title}</h3>
                <p className="cat-book-author">by {book.author}</p>
                <div className="cat-stars">{renderStars(book.rating)}</div>
                <div className="cat-book-footer">
                  <span className="cat-price">Rs {book.price}</span>
                  <button className="btn-view-details" onClick={() => setSelectedBook(book)}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onBookUpdated={handleBookUpdated}
        />
      )}
    </div>
  );
}
