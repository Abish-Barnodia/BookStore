import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';

const DEFAULT_CATS = ['Self-Help', 'Fiction', 'Sci-Fi', 'Finance', 'Classic', 'History', 'Fantasy', 'General'];

function stockLabel(n) {
  if (n === 0) return { text: 'Out of Stock', cls: 'stock-out' };
  if (n <= 5) return { text: 'Low Stock 🔴', cls: 'stock-low' };
  if (n <= 15) return { text: 'Medium', cls: 'stock-med' };
  return { text: 'In Stock', cls: 'stock-ok' };
}

function coverCell(b) {
  const url = b.imageUrl?.trim();
  if (url && /^https?:\/\//i.test(url)) {
    return (
      <img src={url} alt="" className="inv-thumb" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />
    );
  }
  return <span style={{ fontSize: '2rem' }}>{b.img || '📗'}</span>;
}

function List() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${serverUrl}api/admin/products`, { withCredentials: true });
      if (res.data?.success) setBooks(res.data.products || []);
      else setError(res.data?.message || 'Failed to load products');
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

  const categories = useMemo(() => {
    const fromData = [...new Set(books.map((b) => b.category).filter(Boolean))];
    const merged = ['All', ...new Set([...DEFAULT_CATS, ...fromData])];
    return merged;
  }, [books]);

  const filtered = books.filter((b) => {
    const matchCat = catFilter === 'All' || b.category === catFilter;
    const q = search.toLowerCase();
    const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const lowStock = books.filter((b) => b.stock > 0 && b.stock <= 5).length;
  const outStock = books.filter((b) => b.stock === 0).length;

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`${serverUrl}api/admin/products/${deleteId}`, { withCredentials: true });
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <p className="td-muted">Loading inventory…</p>
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

      {(lowStock > 0 || outStock > 0) && (
        <div className="alert-bar">
          🔴 <strong>{outStock} book(s) out of stock</strong> &nbsp;·&nbsp;
          ⚠️ <strong>{lowStock} book(s) running low</strong>
        </div>
      )}

      <div className="inv-topbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search books or authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cat-pills">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`cat-pill${catFilter === c ? ' cat-pill--active' : ''}`}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <Link to="/inventory/add" className="btn-add">＋ Add Book</Link>
      </div>

      <div className="section-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Title / Author</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                    No books found. <Link to="/inventory/add">Add one</Link>.
                  </td>
                </tr>
              )}
              {filtered.map((b) => {
                const sl = stockLabel(b.stock);
                return (
                  <tr key={b.id}>
                    <td>{coverCell(b)}</td>
                    <td>
                      <div className="td-bold">{b.title}</div>
                      <div className="td-muted">{b.author}</div>
                    </td>
                    <td><span className="cat-tag">{b.category}</span></td>
                    <td className="td-bold">₹{b.price}</td>
                    <td>
                      <span className={`stock-badge ${sl.cls}`}>{sl.text} ({b.stock})</span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/inventory/edit/${b.id}`} className="btn-icon btn-edit" title="Edit">✏️</Link>
                        <button type="button" className="btn-icon btn-del" title="Delete" onClick={() => setDeleteId(b.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete book?</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" disabled={deleting} onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="btn-modal-delete" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default List;
