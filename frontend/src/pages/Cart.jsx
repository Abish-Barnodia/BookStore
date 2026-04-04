import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { authDataContext } from '../context/authContex';
import { getAuthToken } from '../utils/sessionAuth';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const { serverUrl } = useContext(authDataContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const authToken = getAuthToken();

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      // If user is not logged in, backend will reject this request (auth middleware).
      await axios.post(
        serverUrl + 'api/user/get-user',
        {},
        {
          withCredentials: true,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      navigate('/place-order');
    } catch {
      // Redirect to login, then come back to checkout after successful login.
      navigate('/login', { state: { redirectTo: '/place-order' } });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-left">
          <button className="cat-back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <h1 className="cart-title">🛒 Your Cart</h1>
            <p className="cart-subtitle">{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</p>
          </div>
        </div>
        {cartItems.length > 0 && (
          <button className="cart-clear-btn" onClick={clearCart}>
            🗑 Clear All
          </button>
        )}
      </div>

      <div className="cart-body">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">📚</div>
            <h2 className="cart-empty-title">Your cart is empty</h2>
            <p className="cart-empty-desc">Browse our categories and add books you love!</p>
            <button className="cart-browse-btn" onClick={() => navigate('/dashboard')}>
              Browse Books
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items List */}
            <div className="cart-items-col">
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-card">
                    <div className="cart-item-cover-wrap">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="cart-item-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=110&fit=crop';
                        }}
                      />
                    </div>
                    <div className="cart-item-info">
                      <h3 className="cart-item-title">{item.title}</h3>
                      <p className="cart-item-author">by {item.author}</p>
                      <p className="cart-item-price-unit">₹{item.price} / copy</p>
                      <div className="cart-item-controls">
                        <div className="cart-qty-ctrl">
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >−</button>
                          <span className="cart-qty-num">{item.quantity}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >+</button>
                        </div>
                        <span className="cart-item-subtotal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        <button
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove"
                        >✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="cart-summary-col">
              <div className="cart-summary-card">
                <h2 className="cart-summary-title">Order Summary</h2>

                <div className="cart-summary-rows">
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-summary-row">
                      <span className="cart-summary-book-name">
                        {item.title.length > 22 ? item.title.slice(0, 22) + '…' : item.title}
                        <span className="cart-summary-qty"> ×{item.quantity}</span>
                      </span>
                      <span className="cart-summary-amount">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="cart-summary-divider" />

                <div className="cart-summary-row cart-summary-total-row">
                  <span className="cart-summary-total-label">Total</span>
                  <span className="cart-summary-total-amount">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="cart-summary-note">📦 Free delivery on orders above ₹999</div>

                <button
                  className="cart-checkout-btn"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  Proceed to Checkout →
                </button>

                <button className="cart-continue-btn" onClick={() => navigate('/dashboard')}>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
