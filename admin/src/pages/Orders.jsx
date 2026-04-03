import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';

const STATUSES = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_FILTERS = ['All', 'Paid', 'Pending'];
const STATUS_COLOR = { Delivered: '#4f8a5b', Shipped: '#2a80c0', Pending: '#c0552a', Cancelled: '#888' };
const PAYMENT_COLOR = { Paid: '#2f855a', Pending: '#b7791f' };
const NEXT_STATUS = { Pending: 'Shipped', Shipped: 'Delivered' };

const getPaymentLabel = (paymentStatus) =>
  String(paymentStatus || '').toLowerCase() === 'paid' ? 'Paid' : 'Pending';

function Orders() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [cancelId, setCancelId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${serverUrl}api/admin/orders`, { withCredentials: true });
      if (res.data?.success) setOrders(res.data.orders || []);
      else setError(res.data?.message || 'Failed to load orders');
    } catch (err) {
      const msg = err.response?.status === 401 ? 'Session expired — log in again.' : err.response?.data?.message || err.message;
      setError(msg);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate, serverUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter((o) => {
    const matchF = filter === 'All' || o.status === filter;
    const paymentLabel = getPaymentLabel(o.paymentStatus);
    const matchP = paymentFilter === 'All' || paymentLabel === paymentFilter;
    const q = search.toLowerCase();
    const matchQ = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    return matchF && matchP && matchQ;
  });

  const patchOrder = async (mongoId, body) => {
    try {
      const res = await axios.patch(`${serverUrl}api/admin/orders/${mongoId}`, body, { withCredentials: true });
      if (res.data?.success && res.data.order) {
        setOrders((prev) => prev.map((o) => (o._id === mongoId ? res.data.order : o)));
        return res.data.order;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) navigate('/login');
    }
    return null;
  };

  const advance = async (mongoId) => {
    await patchOrder(mongoId, {});
  };

  const cancel = async (mongoId) => {
    const updated = await patchOrder(mongoId, { status: 'Cancelled' });
    if (updated) {
      setCancelId(null);
      setDetail((d) => (d && d._id === mongoId ? { ...d, status: 'Cancelled' } : d));
    }
  };

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  const paymentCounts = PAYMENT_FILTERS.slice(1).reduce((acc, p) => {
    acc[p] = orders.filter((o) => getPaymentLabel(o.paymentStatus) === p).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="page-content">
        <p className="td-muted">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {error && (
        <div className="alert-bar" style={{ marginBottom: '1rem', background: '#fde8e8', color: '#8a2a2a' }}>
          {error}
          <button type="button" className="btn-modal-cancel" style={{ marginLeft: '1rem' }} onClick={load}>Retry</button>
        </div>
      )}

      <div className="order-filter-row">
        <div className="cat-pills">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`cat-pill${filter === s ? ' cat-pill--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
              {s !== 'All' && <span className="pill-count">{counts[s]}</span>}
            </button>
          ))}
        </div>
        <div className="cat-pills">
          {PAYMENT_FILTERS.map((p) => (
            <button
              key={p}
              type="button"
              className={`cat-pill${paymentFilter === p ? ' cat-pill--active' : ''}`}
              onClick={() => setPaymentFilter(p)}
            >
              {p}
              {p !== 'All' && <span className="pill-count">{paymentCounts[p]}</span>}
            </button>
          ))}
        </div>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search order ID or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="section-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Book</th>
                <th>Qty</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No orders found</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o._id}>
                  {(() => {
                    const paymentLabel = getPaymentLabel(o.paymentStatus);
                    return (
                      <>
                  <td className="td-mono">{o.id}</td>
                  <td>
                    <div className="td-bold">{o.customer}</div>
                    <div className="td-muted">{o.email}</div>
                  </td>
                  <td className="td-muted">{o.book}</td>
                  <td>{o.qty}</td>
                  <td className="td-bold">₹{o.amount}</td>
                  <td>
                    <span className="status-badge" style={{ background: PAYMENT_COLOR[paymentLabel] + '22', color: PAYMENT_COLOR[paymentLabel] }}>
                      {paymentLabel}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="td-muted">{o.date}</td>
                  <td>
                    <div className="action-btns">
                      <button type="button" className="btn-icon btn-edit" title="View Details" onClick={() => setDetail(o)}>👁</button>
                      {NEXT_STATUS[o.status] && (
                        <button type="button" className="btn-icon btn-advance" title={`Mark as ${NEXT_STATUS[o.status]}`} onClick={() => advance(o._id)}>✅</button>
                      )}
                      {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                        <button type="button" className="btn-icon btn-del" title="Cancel Order" onClick={() => setCancelId(o._id)}>✖</button>
                      )}
                    </div>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal modal--detail" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Order {detail.id}</h2>
            <div className="invoice-grid">
              <div className="invoice-section">
                <div className="invoice-label">Customer</div>
                <div className="invoice-value">{detail.customer}</div>
                <div className="invoice-value td-muted">{detail.email}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Delivery Address</div>
                <div className="invoice-value">{detail.address || '—'}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Book</div>
                <div className="invoice-value">{detail.book}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Qty · Amount</div>
                <div className="invoice-value">
                  {detail.qty} × ₹{detail.qty ? Math.round(detail.amount / detail.qty) : 0} = <strong>₹{detail.amount}</strong>
                </div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Date</div>
                <div className="invoice-value">{detail.date}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Payment</div>
                <span className="status-badge" style={{
                  background: PAYMENT_COLOR[getPaymentLabel(detail.paymentStatus)] + '22',
                  color: PAYMENT_COLOR[getPaymentLabel(detail.paymentStatus)],
                }}>
                  {getPaymentLabel(detail.paymentStatus)}
                </span>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Status</div>
                <span className="status-badge" style={{ background: STATUS_COLOR[detail.status] + '22', color: STATUS_COLOR[detail.status] }}>
                  {detail.status}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              {NEXT_STATUS[detail.status] && (
                <button type="button" className="btn-modal-save" onClick={async () => {
                  const u = await patchOrder(detail._id, {});
                  if (u) setDetail(u);
                }}
                >
                  Mark as {NEXT_STATUS[detail.status]}
                </button>
              )}
              {detail.status !== 'Cancelled' && detail.status !== 'Delivered' && (
                <button type="button" className="btn-modal-delete" onClick={() => setCancelId(detail._id)}>Cancel Order</button>
              )}
              <button type="button" className="btn-modal-cancel" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Cancel Order?</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
              This will mark the order as Cancelled.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setCancelId(null)}>Go Back</button>
              <button type="button" className="btn-modal-delete" onClick={() => cancel(cancelId)}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
