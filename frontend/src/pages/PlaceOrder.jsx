import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { authDataContext } from '../context/authContex';
import { getApiErrorMessage } from '../utils/apiError';

const loadRazorpayScript = async () => {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

function PlaceOrder() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);
  const { cartItems, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Protect this route: user must be logged in to place an order.
    const checkAuth = async () => {
      try {
        const res = await axios.post(
          serverUrl + 'api/user/get-user',
          {},
          { withCredentials: true }
        );
        const user = res.data?.user;

        // Prefill from Profile (leave phone empty because it is not stored in user model yet)
        setForm((prev) => ({
          ...prev,
          name: prev.name || user?.name || '',
          email: prev.email || user?.email || '',
          address: prev.address || user?.address || '',
        }));
      } catch {
        navigate('/login', { state: { redirectTo: '/place-order' } });
      }
    };

    checkAuth();
  }, [navigate, serverUrl]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    paymentMethod: 'cash',
  });

  const mappedItems = useMemo(
    () =>
      cartItems.map((item) => ({
        product: item.id,
        title: item.title,
        qty: item.quantity,
        unitPrice: Number(item.price || 0),
      })),
    [cartItems]
  );

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!form.name || !form.email || !form.address || !form.phone) {
      setError('Please fill all delivery fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const addressWithPhone = `${form.address} | Phone: ${form.phone}`;

      if (form.paymentMethod === 'razorpay') {
        const { data } = await axios.post(
          serverUrl + 'api/order/place-orderbyrazorpay',
          {
            items: mappedItems,
            amount: totalAmount,
            address: addressWithPhone,
            paymentMethod: 'razorpay',
            customerName: form.name,
            customerEmail: form.email,
          },
          { withCredentials: true }
        );

        if (!data?.success) {
          setError(data?.message || 'Failed to create Razorpay order');
          return;
        }

        await loadRazorpayScript();

        const { order, razorpay } = data;
        const options = {
          key: razorpay.keyId,
          amount: razorpay.amountPaise,
          currency: razorpay.currency,
          name: 'Biblio theca',
          order_id: razorpay.orderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          handler: async function (response) {
            try {
              const verifyRes = await axios.post(
                serverUrl + 'api/order/verify-razorpay',
                {
                  orderId: order.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
                { withCredentials: true }
              );

              if (verifyRes.data?.success) {
                setSuccess('Payment successful! Order placed.');
                clearCart();
                setTimeout(() => navigate('/dashboard'), 1200);
              } else {
                setError(verifyRes.data?.message || 'Payment verification failed');
              }
            } catch (err) {
              setError(
                err?.response?.data?.message ||
                  'Payment verification failed. Please contact support.'
              );
            }
          },
          theme: {
            color: '#166534',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Cash / COD
        await axios.post(
          serverUrl + 'api/order/place',
          {
            items: mappedItems,
            amount: totalAmount,
            address: addressWithPhone,
            paymentMethod: 'cash',
            customerName: form.name,
            customerEmail: form.email,
          },
          { withCredentials: true }
        );

        setSuccess('Order placed successfully!');
        clearCart();
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Order API unavailable right now. Make sure backend /api/order routes are mounted.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="ornament">⚜</div>
        <Link to="/cart" className="back-link">← Back to cart</Link>
        <h1 className="auth-title">Place Order</h1>
        <p className="auth-subtitle">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
        <hr className="auth-divider" />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input id="name" type="text" className="form-input" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input id="email" type="email" className="form-input" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="address" className="form-label">Address</label>
            <input id="address" type="text" className="form-input" value={form.address} onChange={(e) => onChange('address', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone</label>
            <input id="phone" type="tel" className="form-input" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="paymentMethod" className="form-label">Payment Method</label>
            <select
              id="paymentMethod"
              className="form-input"
              value={form.paymentMethod}
              onChange={(e) => onChange('paymentMethod', e.target.value)}
            >
              <option value="cash">Cash on Delivery</option>
              <option value="razorpay">Razorpay (Card/UPI)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || cartItems.length === 0}>
            {loading ? 'Placing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlaceOrder;