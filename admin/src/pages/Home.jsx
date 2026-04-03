import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';

const STATUS_COLOR = { Delivered: '#4f8a5b', Shipped: '#2a80c0', Pending: '#c0552a', Cancelled: '#888' };

function MiniBarChart({ data, color, labels }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mini-chart">
      {data.map((v, i) => (
        <div key={labels[i]} className="mini-chart-col">
          <div
            className="mini-chart-bar"
            style={{ height: `${(v / max) * 100}%`, background: color }}
            title={`${labels[i]}: ${v}`}
          />
          <span className="mini-chart-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [activeChart, setActiveChart] = useState('orders');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${serverUrl}api/admin/stats`, { withCredentials: true });
        if (cancelled) return;
        if (res.data?.success) setStats(res.data.stats);
        else setError(res.data?.message || 'Could not load stats');
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.status === 401 ? 'Unauthorized' : err.response?.data?.message || err.message);
          if (err.response?.status === 401) navigate('/login');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, serverUrl]);

  const sc = stats?.statusCounts || {};
  const orderFlow = [sc.Pending || 0, sc.Shipped || 0, sc.Delivered || 0, sc.Cancelled || 0];
  const labels = ['Pending', 'Shipped', 'Delivered', 'Cancel'];

  const statCards = stats
    ? [
        { icon: '📚', label: 'Total Books', value: String(stats.productCount), sub: 'In catalog', color: '#b08d3a' },
        { icon: '🛒', label: 'Orders', value: String(stats.orderCount), sub: `${stats.pendingOrders} pending`, color: '#4f8a5b' },
        { icon: '👤', label: 'Users', value: String(stats.userCount), sub: 'Registered', color: '#8a4f7a' },
        { icon: '⚠️', label: 'Low stock', value: String(stats.lowStockBooks), sub: '≤5 units', color: '#c0552a' },
        { icon: '📦', label: 'Pending', value: String(sc.Pending || 0), sub: 'Need action', color: '#c0552a' },
        { icon: '🚚', label: 'Shipped', value: String(sc.Shipped || 0), sub: 'In transit', color: '#2a80c0' },
      ]
    : [];

  const recentOrders = stats?.recentOrders || [];
  const chartData = activeChart === 'orders' ? orderFlow : orderFlow.map((v, i) => v * (120 + i * 30));
  const chartColor = activeChart === 'orders' ? '#b08d3a' : '#4f8a5b';

  return (
    <div className="page-content">
      {error && (
        <div className="alert-bar" style={{ marginBottom: '1rem', background: '#fde8e8', color: '#8a2a2a' }}>
          {error}
        </div>
      )}

      {!stats && !error && <p className="td-muted">Loading dashboard…</p>}

      {stats && (
        <>
          <div className="stats-grid">
            {statCards.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-card-icon" style={{ background: s.color + '1a', color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-card-body">
                  <div className="stat-card-value">{s.value}</div>
                  <div className="stat-card-label">{s.label}</div>
                  <div className="stat-card-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Orders by status</h3>
                <div className="chart-tabs">
                  <button
                    type="button"
                    className={`chart-tab${activeChart === 'orders' ? ' chart-tab--active' : ''}`}
                    onClick={() => setActiveChart('orders')}
                  >
                    Counts
                  </button>
                  <button
                    type="button"
                    className={`chart-tab${activeChart === 'revenue' ? ' chart-tab--active' : ''}`}
                    onClick={() => setActiveChart('revenue')}
                  >
                    Activity
                  </button>
                </div>
              </div>
              <MiniBarChart data={chartData} color={chartColor} labels={labels} />
            </div>

            <div className="chart-card chart-card--sm">
              <h3 className="chart-card-title">Status mix</h3>
              {(() => {
                const t = orderFlow.reduce((a, b) => a + b, 0) || 1;
                const p0 = (orderFlow[0] / t) * 100;
                const p1 = ((orderFlow[0] + orderFlow[1]) / t) * 100;
                return (
                  <>
                    <div className="donut-wrap">
                      <div
                        className="donut"
                        style={{
                          background: `conic-gradient(#c0552a 0% ${p0}%, #2a80c0 ${p0}% ${p1}%, #4f8a5b ${p1}% 100%)`,
                        }}
                      />
                      <div className="donut-hole" />
                    </div>
                    <div className="donut-legend">
                      <span className="donut-dot" style={{ background: '#c0552a' }} /> Pending {orderFlow[0]}
                      <span className="donut-dot" style={{ background: '#2a80c0' }} /> Shipped {orderFlow[1]}
                      <span className="donut-dot" style={{ background: '#4f8a5b' }} /> Delivered {orderFlow[2]}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Recent orders</h3>
              <Link to="/orders" className="section-card-link">View all →</Link>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Customer</th><th>Book</th>
                    <th>Amount</th><th>Status</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No orders yet</td></tr>
                  )}
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className="td-mono">{o.id}</td>
                      <td>{o.customer}</td>
                      <td className="td-muted">{o.book}</td>
                      <td className="td-bold">₹{o.amount}</td>
                      <td>
                        <span className="status-badge" style={{ background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status] }}>
                          {o.status}
                        </span>
                      </td>
                      <td className="td-muted">{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
