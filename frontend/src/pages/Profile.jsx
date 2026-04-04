import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/authContex';

export default function Profile() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
  });

  const orderStatusColor = {
    Delivered: '#4f8a5b',
    Shipped: '#2a80c0',
    Pending: '#c0552a',
    Cancelled: '#888888',
  };

  const paymentColor = {
    Paid: '#2f855a',
    Pending: '#b7791f',
    Failed: '#a94442',
  };

  const fetchUser = async () => {
    const res = await axios.post(
      serverUrl + 'api/user/get-user',
      {},
      { withCredentials: true }
    );
    return res.data?.user || null;
  };

  const fetchOrders = async () => {
    const res = await axios.get(
      serverUrl + 'api/order/my-orders',
      { withCredentials: true }
    );
    return res.data?.orders || [];
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const u = await fetchUser();
        if (!u) {
          setError('Could not load user profile. Please refresh and try again.');
          return;
        }
        setUser(u);
        setForm((prev) => ({
          ...prev,
          name: u?.name || '',
          email: u?.email || '',
          address: u?.address || '',
        }));

        try {
          const myOrders = await fetchOrders();
          setOrders(myOrders);
        } catch (orderErr) {
          console.error('fetchOrders:', orderErr);
          setOrders([]);
          if (orderErr?.response?.status === 401) {
            navigate('/login', { state: { redirectTo: '/profile' } });
            return;
          }
          setError(orderErr?.response?.data?.message || 'Could not load your order history right now.');
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate('/login', { state: { redirectTo: '/profile' } });
          return;
        }
        setError(err?.response?.data?.message || 'Could not load profile right now. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, serverUrl]);

  const profileSubtitle = useMemo(() => {
    if (!user) return '';
    const role = user.role ? `Role: ${user.role}` : '';
    const status = user.status ? `Status: ${user.status}` : '';
    return [role, status].filter(Boolean).join(' • ');
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        serverUrl + 'api/user/update-user',
        {
          name: form.name,
          email: form.email,
          address: form.address || '',
        },
        { withCredentials: true }
      );

      // Refresh user after update
      const u = await fetchUser();
      setUser(u);
      setForm((prev) => ({
        ...prev,
        name: u?.name || '',
        email: u?.email || '',
        address: u?.address || '',
      }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      await axios.post(serverUrl + 'api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      // Even if logout fails, we still clear UI and redirect
      console.error('logout:', err);
    }
    navigate('/login');
  };

  const openReviewModal = (order, item) => {
    setReviewTarget({
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId: item.productId,
      title: item.title,
    });
    setReviewRating(5);
    setReviewText('');
    setReviewImage(null);
    setReviewError('');
    setReviewSuccess('');
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setReviewTarget(null);
    setReviewError('');
    setReviewSuccess('');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget?.productId) return;
    if (!reviewText.trim()) {
      setReviewError('Please write a review.');
      return;
    }
    if (!reviewImage) {
      setReviewError('Please upload delivered product image.');
      return;
    }

    setReviewError('');
    setReviewSuccess('');
    setReviewSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('text', reviewText.trim());
      formData.append('rating', String(reviewRating));
      formData.append('deliveryImage', reviewImage);

      await axios.post(
        `${serverUrl}api/product/${reviewTarget.productId}/reviews`,
        formData,
        { withCredentials: true }
      );

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: Array.isArray(order.items)
            ? order.items.map((item) =>
                item.productId === reviewTarget.productId ? { ...item, reviewed: true } : item
              )
            : [],
        }))
      );

      setReviewSuccess('Review submitted. It will now show in customer reviews.');
      setTimeout(() => {
        setReviewTarget(null);
      }, 700);
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login', { state: { redirectTo: '/profile' } });
        return;
      }
      setReviewError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const renderOrderTracker = (status) => {
    const steps = ['Pending', 'Shipped', 'Delivered'];
    const activeIndex = steps.indexOf(status);

    if (status === 'Cancelled') {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: orderStatusColor.Cancelled, fontSize: '0.88rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: orderStatusColor.Cancelled }} />
          Cancelled
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
          {steps.map((step, index) => {
            const active = index <= activeIndex;
            return (
              <div
                key={step}
                style={{
                  padding: '0.45rem 0.55rem',
                  borderRadius: 999,
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  color: active ? '#fff' : 'var(--color-leather-500)',
                  background: active ? orderStatusColor[step] : 'var(--color-cream-100)',
                  border: `1px solid ${active ? orderStatusColor[step] : 'var(--color-cream-300)'}`,
                }}
              >
                {step}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="ornament">⚜</div>
        <Link to="/dashboard" className="back-link">
          ← Back to shop
        </Link>
        <h1 className="auth-title">My Profile</h1>
        <p className="auth-subtitle">{loading ? 'Loading...' : profileSubtitle}</p>

        {error && <div className="error-message">{error}</div>}

        {user && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-leather-800)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-leather-500)' }}>{user.email}</div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="profile-name" className="form-label">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-email" className="form-label">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-address" className="form-label">Address</label>
                <textarea
                  id="profile-address"
                  className="form-input"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Enter your delivery address"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-cream-300)', background: 'rgba(255,255,255,0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-leather-800)', marginBottom: '0.15rem' }}>My Orders</h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-leather-500)' }}>Track your order status and payment progress here.</p>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--color-leather-500)' }}>
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </div>
              </div>

              {orders.length === 0 ? (
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--color-cream-100)', color: 'var(--color-leather-500)', fontSize: '0.92rem' }}>
                  No orders yet. Once you place an order, it will appear here for tracking.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        border: '1px solid var(--color-cream-300)',
                        background: 'linear-gradient(180deg, #fff 0%, #faf7ef 100%)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-leather-800)' }}>
                            Order #{order.orderNumber}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-leather-500)' }}>
                            {order.title} · {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                        <div style={{ display: 'grid', justifyItems: 'end', gap: '0.35rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.35rem 0.7rem',
                              borderRadius: 999,
                              background: `${paymentColor[order.paymentStatus] || paymentColor.Pending}22`,
                              color: paymentColor[order.paymentStatus] || paymentColor.Pending,
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-sans)',
                              fontWeight: 700,
                            }}
                          >
                            {order.paymentStatus}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.35rem 0.7rem',
                              borderRadius: 999,
                              background: `${orderStatusColor[order.status] || orderStatusColor.Pending}22`,
                              color: orderStatusColor[order.status] || orderStatusColor.Pending,
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-sans)',
                              fontWeight: 700,
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '0.65rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--color-leather-600)' }}>
                          <div><strong style={{ color: 'var(--color-leather-800)' }}>Date:</strong> {order.date}</div>
                          <div><strong style={{ color: 'var(--color-leather-800)' }}>Amount:</strong> ₹{Number(order.amount || 0).toLocaleString('en-IN')}</div>
                          <div><strong style={{ color: 'var(--color-leather-800)' }}>Payment:</strong> {order.paymentMethod}</div>
                        </div>

                        {renderOrderTracker(order.status)}

                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          <div style={{ display: 'grid', gap: '0.6rem' }}>
                            <div style={{ fontSize: '0.86rem', color: 'var(--color-leather-700)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                              Ordered Books
                            </div>
                            {order.items.map((item, idx) => (
                              <div
                                key={`${order.id}-${item.productId || idx}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.7rem',
                                  flexWrap: 'wrap',
                                  background: 'rgba(255,255,255,0.8)',
                                  border: '1px solid var(--color-cream-300)',
                                  borderRadius: '10px',
                                  padding: '0.55rem 0.7rem',
                                }}
                              >
                                <div style={{ fontSize: '0.84rem', color: 'var(--color-leather-700)' }}>
                                  <strong style={{ color: 'var(--color-leather-800)' }}>{item.title}</strong>
                                  {' '}x{item.qty}
                                </div>

                                {order.status === 'Delivered' && item.productId ? (
                                  item.reviewed ? (
                                    <span
                                      style={{
                                        fontSize: '0.78rem',
                                        fontFamily: 'var(--font-sans)',
                                        fontWeight: 700,
                                        color: '#1d6f42',
                                        background: 'rgba(47,133,90,0.14)',
                                        border: '1px solid rgba(47,133,90,0.28)',
                                        borderRadius: 999,
                                        padding: '0.3rem 0.65rem',
                                      }}
                                    >
                                      Reviewed
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openReviewModal(order, item)}
                                      style={{
                                        fontSize: '0.78rem',
                                        fontFamily: 'var(--font-sans)',
                                        fontWeight: 700,
                                        color: 'var(--color-leather-800)',
                                        background: 'var(--color-cream-100)',
                                        border: '1px solid var(--color-cream-400)',
                                        borderRadius: 999,
                                        padding: '0.34rem 0.72rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      📝 Review
                                    </button>
                                  )
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {order.address && (
                          <div style={{ fontSize: '0.86rem', color: 'var(--color-leather-500)', lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--color-leather-800)' }}>Delivery:</strong> {order.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="auth-divider-bottom" style={{ marginTop: '1.5rem' }} />
            <button type="button" className="btn-nav btn-nav-outline" onClick={handleLogout} disabled={loading}>
              Logout
            </button>
          </>
        )}
      </div>

      {reviewTarget ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReviewModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(42,29,16,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: 'min(560px, 100%)',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #fffdf7 0%, #faf6ea 100%)',
              border: '1px solid var(--color-cream-300)',
              padding: '1rem',
              boxShadow: '0 24px 50px rgba(0,0,0,0.24)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-leather-800)', fontWeight: 700 }}>Customer Review</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-leather-500)' }}>{reviewTarget.title} • Order #{reviewTarget.orderNumber}</div>
              </div>
              <button type="button" onClick={closeReviewModal} style={{ border: 'none', background: 'transparent', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={submitReview} style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-leather-600)' }}>Rating:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      color: s <= reviewRating ? '#c4a04a' : '#d1c5a0',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review..."
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid var(--color-cream-400)',
                  padding: '0.7rem 0.9rem',
                  fontFamily: 'var(--font-body)',
                  resize: 'vertical',
                }}
              />

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', color: 'var(--color-leather-600)', fontFamily: 'var(--font-sans)' }}>
                  Upload delivered book image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReviewImage(e.target.files?.[0] || null)}
                  required
                />
              </div>

              {reviewError ? <div className="error-message" style={{ margin: 0 }}>{reviewError}</div> : null}
              {reviewSuccess ? <div className="success-message" style={{ margin: 0 }}>{reviewSuccess}</div> : null}

              <button type="submit" className="btn-primary" disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

