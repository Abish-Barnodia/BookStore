import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';

const ROLES = ['customer', 'staff', 'admin'];
const STATUS_COLOR = { Active: '#4f8a5b', Blocked: '#c0552a' };

function Users() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${serverUrl}api/admin/users`, { withCredentials: true });
      if (res.data?.success) setUsers(res.data.users || []);
      else setError(res.data?.message || 'Failed to load users');
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

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const patchUser = async (id, body) => {
    try {
      const res = await axios.patch(`${serverUrl}api/admin/users/${id}`, body, { withCredentials: true });
      if (res.data?.success && res.data.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.data.user : u)));
        return res.data.user;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) navigate('/login');
    }
    return null;
  };

  const toggleBlock = async (u) => {
    const next = u.status === 'Active' ? 'Blocked' : 'Active';
    await patchUser(u.id, { status: next });
  };

  const saveRole = async () => {
    if (!roleModal) return;
    await patchUser(roleModal.id, { role: newRole });
    setRoleModal(null);
  };

  const totalCustomers = users.filter((u) => u.role === 'customer').length;
  const blocked = users.filter((u) => u.status === 'Blocked').length;

  if (loading) {
    return (
      <div className="page-content">
        <p className="td-muted">Loading users…</p>
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

      <div className="stats-grid stats-grid--sm">
        {[
          { icon: '👤', label: 'Total Users', value: users.length },
          { icon: '🛍️', label: 'Customers', value: totalCustomers },
          { icon: '🔒', label: 'Blocked', value: blocked },
          { icon: '👷', label: 'Staff / Admin', value: users.filter((u) => u.role !== 'customer').length },
        ].map((s) => (
          <div className="stat-card stat-card--sm" key={s.label}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-body">
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="inv-topbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search users by name or email…"
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
                <th>User</th><th>Role</th><th>Status</th>
                <th>Orders</th><th>Total Spent</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No users found</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name?.[0] || '?'}</div>
                      <div>
                        <div className="td-bold">{u.name}</div>
                        <div className="td-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-tag role-${u.role}`}>{u.role}</span></td>
                  <td>
                    <span className="status-badge" style={{ background: STATUS_COLOR[u.status] + '22', color: STATUS_COLOR[u.status] }}>
                      {u.status}
                    </span>
                  </td>
                  <td>{u.orders}</td>
                  <td className="td-bold">{u.spent > 0 ? `₹${u.spent.toLocaleString()}` : '—'}</td>
                  <td className="td-muted">{u.joined}</td>
                  <td>
                    <div className="action-btns">
                      <button type="button" className="btn-icon btn-edit" title="View Profile" onClick={() => setDetail(u)}>👁</button>
                      <button
                        type="button"
                        className={`btn-icon ${u.status === 'Active' ? 'btn-del' : 'btn-advance'}`}
                        title={u.status === 'Active' ? 'Block User' : 'Unblock User'}
                        onClick={() => toggleBlock(u)}
                      >
                        {u.status === 'Active' ? '🔒' : '🔓'}
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        title="Change Role"
                        onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                      >
                        🎭
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal modal--detail" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div className="user-avatar user-avatar--lg">{detail.name?.[0] || '?'}</div>
            </div>
            <h2 className="modal-title">{detail.name}</h2>
            <div className="invoice-grid">
              <div className="invoice-section">
                <div className="invoice-label">Email</div>
                <div className="invoice-value">{detail.email}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Role</div>
                <span className={`role-tag role-${detail.role}`}>{detail.role}</span>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Status</div>
                <span className="status-badge" style={{ background: STATUS_COLOR[detail.status] + '22', color: STATUS_COLOR[detail.status] }}>
                  {detail.status}
                </span>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Joined</div>
                <div className="invoice-value">{detail.joined}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Total Orders</div>
                <div className="invoice-value">{detail.orders}</div>
              </div>
              <div className="invoice-section">
                <div className="invoice-label">Total Spent</div>
                <div className="invoice-value">{detail.spent > 0 ? `₹${detail.spent.toLocaleString()}` : '—'}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {roleModal && (
        <div className="modal-overlay" onClick={() => setRoleModal(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Change Role</h2>
            <p className="td-muted" style={{ marginBottom: '1rem' }}>{roleModal.name}</p>
            <div className="form-group">
              <label className="form-label" htmlFor="role-select">Assign Role</label>
              <select id="role-select" className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setRoleModal(null)}>Cancel</button>
              <button type="button" className="btn-modal-save" onClick={saveRole}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
