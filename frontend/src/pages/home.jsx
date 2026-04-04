import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/authContex';
import { useCart } from '../context/CartContext';
import { clearAuthToken, getAuthToken } from '../utils/sessionAuth';

/* ─── Book Data ─── */
const FEATURED_BOOKS = [
  {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    price: 12.99,
    category: 'Classic',
    rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop',
  },
  {
    id: 2,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    price: 14.99,
    category: 'Fiction',
    rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=560&fit=crop',
  },
  {
    id: 3,
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    price: 10.99,
    category: 'Romance',
    rating: 4.7,
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=560&fit=crop',
  },
  {
    id: 4,
    title: '1984',
    author: 'George Orwell',
    price: 11.99,
    category: 'Dystopian',
    rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=560&fit=crop',
  },
  {
    id: 5,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    price: 13.49,
    category: 'Philosophy',
    rating: 4.6,
    cover: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=560&fit=crop',
  },
];

const HERO_BOOKS = [
  {
    title: 'Moby Dick',
    author: 'Herman Melville',
    price: '$9.99',
    cover: 'https://images.unsplash.com/photo-1529158062015-cad636e205a0?w=300&h=420&fit=crop',
  },
  {
    title: 'War and Peace',
    author: 'Leo Tolstoy',
    price: '$15.99',
    cover: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=420&fit=crop',
  },
  {
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    price: '$11.99',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=420&fit=crop',
  },
];

const CATEGORIES = [
  { name: 'Self-Help', icon: '🧭', path: '/self-help' },
  { name: 'Fiction', icon: '📖', path: '/fiction' },
  { name: 'Sci-Fi', icon: '🚀', path: '/sci-fi' },
  { name: 'Finance', icon: '💹', path: '/finance' },
  { name: 'Classic', icon: '🏛️', path: '/classic' },
  { name: 'History', icon: '📜', path: '/history' },
  { name: 'Fantasy', icon: '🧙', path: '/fantasy' },
  { name: 'General', icon: '📚', path: '/general' },
];

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop';

const normalizeBook = (p) => ({
  id: p.id,
  title: p.title,
  author: p.author || 'Unknown',
  category: p.category || 'General',
  price: Number(p.price || 0),
  stock: Number(p.stock || 0),
  bestSeller: Boolean(p.bestSeller),
  cover: p.imageUrl || p.image1 || p.image2 || p.image3 || FALLBACK_COVER,
  rating: Number(p.rating || 4.5),
  description: p.description || 'A great read from our catalog.',
  fullDescription: p.fullDescription || p.description || 'A great read from our catalog.',
  pages: p.pages || '',
  isbn: p.isbn || '',
  publisher: p.publisher || '',
  reviews: Array.isArray(p.reviews) ? p.reviews : [],
});

const normalizeCategoryKey = (category = '') => {
  const normalized = category.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Keep category labels flexible across admin/user naming.
  if (normalized === 'scifi' || normalized === 'sciencefiction') return 'sciencefiction';
  if (normalized === 'nonfiction') return 'nonfiction';
  if (normalized === 'selfhelp') return 'selfhelp';
  return normalized;
};

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);
  const { totalItems, addToCart } = useCart();
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const searchResultsRef = useRef(null);
  const authToken = getAuthToken();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check cookie session so we can show Profile/Logout.
    const checkAuth = async () => {
      try {
        const res = await axios.post(
          serverUrl + 'api/user/get-user',
          {},
          {
            withCredentials: true,
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          }
        );
        setAuthUser(res.data?.user || null);
      } catch {
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [serverUrl]);

  useEffect(() => {
    let cancelled = false;
    const loadInventory = async () => {
      setInventoryLoading(true);
      setInventoryError('');
      try {
        const res = await axios.get(serverUrl + 'api/product/list');
        if (cancelled) return;
        setInventory((res.data?.products || []).map(normalizeBook));
      } catch (err) {
        if (cancelled) return;
        setInventoryError(err?.response?.data?.message || 'Failed to load inventory');
      } finally {
        if (!cancelled) setInventoryLoading(false);
      }
    };

    loadInventory();
    return () => {
      cancelled = true;
    };
  }, [serverUrl]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory.filter((book) =>
      [book.title, book.author, book.category]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [inventory, searchQuery]);

  const featuredBooks = useMemo(() => {
    const bestSellers = inventory.filter((book) => book.bestSeller);
    return bestSellers.length > 0 ? bestSellers.slice(0, 8) : FEATURED_BOOKS;
  }, [inventory]);

  const featuredTickerBooks = useMemo(() => {
    if (!Array.isArray(featuredBooks) || featuredBooks.length === 0) return [];
    // Duplicate list so the vertical loop can scroll seamlessly.
    return [...featuredBooks, ...featuredBooks];
  }, [featuredBooks]);

  const joinFreeTarget = authUser || authToken ? '/profile' : '/signup';
  const joinFreeLabel = authUser || authToken ? 'My Profile' : 'Join Free';

  const categoryCounts = useMemo(() => {
    const counts = new Map();

    inventory.forEach((book) => {
      const key = normalizeCategoryKey(book.category);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }, [inventory]);

  const categoriesWithCounts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        count: categoryCounts.get(normalizeCategoryKey(category.name)) || 0,
      })),
    [categoryCounts]
  );

  const totalBookCount = useMemo(() => inventory.length, [inventory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFeaturedBookOpen = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleFeaturedAddToCart = (book, event) => {
    event.preventDefault();
    event.stopPropagation();
    const cartBook = {
      ...book,
      price: Number(book.price || 0),
      cover: book.cover || FALLBACK_COVER,
    };
    addToCart(cartBook, 1);
  };

  const handleLogout = async () => {
    try {
      await axios.post(serverUrl + 'api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('logout:', err);
    }
    clearAuthToken();
    setAuthUser(null);
    navigate('/login', { replace: true });
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < full ? 'star' : ''}>
          {i < full ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="nav-logo">
          📚 Biblio<span>theca</span>
        </Link>

        <ul className="nav-links">
          <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
          <li><a href="#featured" onClick={(e) => { e.preventDefault(); scrollToSection('featured'); }}>Books</a></li>
          <li><a href="#categories" onClick={(e) => { e.preventDefault(); scrollToSection('categories'); }}>Categories</a></li>
          <li><a href="#newsletter" onClick={(e) => { e.preventDefault(); scrollToSection('newsletter'); }}>Contact</a></li>
        </ul>

        <div className="nav-actions">
          <form className="nav-search" onSubmit={handleSearchSubmit}>
            <button type="submit" className="nav-search-button" aria-label="Search inventory">
              <span className="nav-search-icon">🔍</span>
            </button>
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <button type="button" className="nav-cart" onClick={() => navigate('/cart')} aria-label="Open cart">
            🛒
            {totalItems > 0 && <span className="nav-cart-badge">{totalItems}</span>}
          </button>
          {authUser ? (
            <>
              <Link to="/profile" className="btn-nav btn-nav-outline">My Profile</Link>
              <button
                type="button"
                className="btn-nav btn-nav-filled"
                onClick={handleLogout}
                disabled={authLoading}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav btn-nav-outline">Sign In</Link>
              <Link to="/signup" className="btn-nav btn-nav-filled">Join</Link>
            </>
          )}
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              ✨ New arrivals every week
            </div>
            <h1 className="hero-title">
              Discover Your Next<br />
              <span className="highlight">Literary Adventure</span>
            </h1>
            <p className="hero-description">
              Explore thousands of carefully curated books across every genre.
              From timeless classics to modern masterpieces, your next favourite
              read is waiting for you.
            </p>
            <div className="hero-actions">
              <a
                href="#featured"
                className="btn-hero-primary"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('featured');
                }}
              >
                Browse Collection
              </a>
              <Link to={joinFreeTarget} className="btn-hero-secondary">{joinFreeLabel}</Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{totalBookCount.toLocaleString('en-IN')}</div>
                <div className="stat-label">Books</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">12K+</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9</div>
                <div className="stat-label">Rating</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-books-grid">
              {HERO_BOOKS.map((book, i) => (
                <div key={i} className="book-card">
                  <img src={book.cover} alt={book.title} className="book-cover" />
                  <div className="book-info">
                    <div className="book-title-card">{book.title}</div>
                    <div className="book-author">{book.author}</div>
                    <div className="book-price">{book.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {searchQuery.trim() && (
        <section className="search-results-section" ref={searchResultsRef}>
          <div className="section-header">
            <div className="section-badge">🔎 Inventory search</div>
            <h2 className="section-title">Search Results</h2>
            <p className="section-subtitle">
              {inventoryLoading
                ? 'Searching the inventory...'
                : searchResults.length > 0
                  ? `${searchResults.length} matching ${searchResults.length === 1 ? 'book' : 'books'} found`
                  : 'No matching books found in inventory'}
            </p>
          </div>

          {inventoryError && <div className="search-results-error">{inventoryError}</div>}

          {!inventoryLoading && searchResults.length > 0 && (
            <div className="search-results-grid">
              {searchResults.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className="search-result-card"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <div className="search-result-card-inner">
                    <div className="search-result-card-face search-result-card-front">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="search-result-cover"
                        onError={(e) => {
                          e.target.src = FALLBACK_COVER;
                        }}
                      />
                      <div className="search-result-info">
                        <div className="search-result-category">{book.category}</div>
                        <div className="search-result-title">{book.title}</div>
                        <div className="search-result-author">by {book.author}</div>
                      </div>
                    </div>
                    <div className="search-result-card-face search-result-card-back">
                      <div className="search-result-back-badge">View Details</div>
                      <div className="search-result-title">{book.title}</div>
                      <div className="search-result-author">{book.category} · {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</div>
                      <div className="search-result-footer">
                        <span className="search-result-price">₹{Number(book.price || 0).toLocaleString('en-IN')}</span>
                        <span className="search-result-stock">Tap to open</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════ FEATURED BOOKS ═══════════ */}
      <section id="featured" className="featured-section">
        <div className="section-header">
          <div className="section-badge">⭐ Best sellers</div>
          <h2 className="section-title">Featured Books</h2>
          <p className="section-subtitle">Top books marked by the admin in inventory</p>
        </div>

        <div className="featured-marquee" aria-label="Featured best seller books">
          <div className="featured-marquee-track">
            {featuredTickerBooks.map((book, index) => (
              <div
                key={`${book.id}-${index}`}
                className="featured-book"
                onClick={() => handleFeaturedBookOpen(book.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFeaturedBookOpen(book.id);
                  }
                }}
              >
                <div className="featured-cover-wrapper">
                  <img src={book.cover} alt={book.title} className="featured-cover" />
                  <div className="featured-overlay">
                    <button
                      type="button"
                      className="btn-add-cart"
                      onClick={(e) => handleFeaturedAddToCart(book, e)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="featured-details">
                  <div className="featured-category">{book.category}</div>
                  <div className="featured-book-title">{book.title}</div>
                  <div className="featured-book-author">{book.author}</div>
                  <div className="featured-book-bottom">
                    <div className="featured-book-price">₹{Number(book.price || 0).toLocaleString('en-IN')}</div>
                    <div className="featured-book-rating">
                      {renderStars(book.rating)} {book.rating}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <div className="section-badge">📂 Browse by genre</div>
          <h2 className="section-title">Popular Categories</h2>
          <p className="section-subtitle">Find exactly what you're looking for</p>
        </div>

        <div className="categories-grid">
          {categoriesWithCounts.map((cat, i) => (
            <Link key={i} to={cat.path} className="category-card" style={{ textDecoration: 'none' }}>
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-count">{cat.count} {cat.count === 1 ? 'book' : 'books'}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ NEWSLETTER ═══════════ */}
      <section id="newsletter" className="newsletter-section">
        <h2 className="newsletter-title">Stay in the Loop</h2>
        <p className="newsletter-subtitle">
          Get weekly book recommendations and exclusive deals
        </p>
        <form
          className="newsletter-form"
          onSubmit={(e) => {
            e.preventDefault();
            setNewsletterEmail('');
          }}
        >
          <input
            type="email"
            className="newsletter-input"
            placeholder="Enter your email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
          />
          <button type="submit" className="btn-newsletter">Subscribe</button>
        </form>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="home-footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">📚 Biblio<span>theca</span></div>
            <p className="footer-description">
              Your premier online bookstore. Discover, explore, and immerse
              yourself in the world of literature.
            </p>
          </div>
          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><button onClick={() => scrollToSection('home')} className="footer-link-btn">Home</button></li>
              <li><button onClick={() => scrollToSection('featured')} className="footer-link-btn">Books</button></li>
              <li><button onClick={() => scrollToSection('categories')} className="footer-link-btn">Categories</button></li>
              <li><button onClick={() => navigate('/contact')} className="footer-link-btn">Contact</button></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><button onClick={() => navigate('/faq')} className="footer-link-btn">FAQ</button></li>
              <li><button onClick={() => navigate('/shipping')} className="footer-link-btn">Shipping</button></li>
              <li><button onClick={() => navigate('/returns')} className="footer-link-btn">Returns</button></li>
              <li><button onClick={() => navigate('/track-order')} className="footer-link-btn">Track Order</button></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><button onClick={() => navigate('/privacy-policy')} className="footer-link-btn">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms-of-service')} className="footer-link-btn">Terms of Service</button></li>
              <li><button onClick={() => navigate('/cookie-policy')} className="footer-link-btn">Cookie Policy</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Bibliotheca. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
