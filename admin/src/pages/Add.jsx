import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';

const CATEGORIES = ['Self-Help', 'Fiction', 'Sci-Fi', 'Finance', 'Classic', 'History', 'Fantasy', 'General'];
const EMPTY_FIELDS = { title: '', author: '', category: 'Fiction', price: '', stock: '', bestSeller: false };

function Add() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm]         = useState(EMPTY_FIELDS);
  const [imageFile, setImageFile] = useState(null);       // File object from picker
  const [previewUrl, setPreviewUrl] = useState('');       // Blob URL for preview
  const [existingImg, setExistingImg] = useState('');     // Current image already saved (edit mode)
  const [dragOver, setDragOver]   = useState(false);
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Load existing product in edit mode
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${serverUrl}api/admin/products/${id}`, { withCredentials: true });
        if (cancelled) return;
        if (res.data?.success && res.data.product) {
          const p = res.data.product;
          setForm({
            title:    p.title    || '',
            author:   p.author   || '',
            category: p.category || 'General',
            price:    p.price    ?? '',
            stock:    p.stock    ?? '',
            bestSeller: Boolean(p.bestSeller),
          });
          setExistingImg(p.imageUrl || '');
        } else setError(res.data?.message || 'Not found');
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
          if (err.response?.status === 401) navigate('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, navigate, serverUrl]);

  // Revoke old blob URLs to avoid memory leaks
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError('');
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (error) setError('');
  };

  const onFileInput = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setExistingImg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || form.price === '' || form.price == null) {
      setError('Title, author, and price are required.');
      return;
    }
    // In add-mode, require an image
    if (!isEdit && !imageFile) {
      setError('Please select a cover image.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Use FormData so the image file can be sent as multipart
      const fd = new FormData();
      fd.append('title',    form.title.trim());
      fd.append('author',   form.author.trim());
      fd.append('category', form.category);
      fd.append('price',    Number(form.price));
      fd.append('stock',    form.stock === '' ? 0 : Number(form.stock));
      fd.append('bestSeller', form.bestSeller ? 'true' : 'false');
      if (imageFile) fd.append('image', imageFile);

      if (isEdit) {
        await axios.put(`${serverUrl}api/admin/products/${id}`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(`${serverUrl}api/admin/products`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/inventory');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <p className="td-muted">Loading…</p>
      </div>
    );
  }

  const displayImage = previewUrl || existingImg;
  const titleCount = form.title.trim().length;
  const authorCount = form.author.trim().length;
  const priceValue = Number(form.price || 0);
  const stockValue = Number(form.stock || 0);

  return (
    <div className="page-content">
      <div className="section-card addbook-shell">
        <div className="addbook-header">
          <h2 className="section-card-title addbook-title">{isEdit ? 'Edit Book' : 'Add Book'}</h2>
          <p className="td-muted addbook-subtitle">Fill the details below to publish this book in your store catalog.</p>
        </div>

        {error && <div className="error-message addbook-error">{error}</div>}

        <form onSubmit={submit} className="addbook-grid">
          <div className="addbook-form-col">
            <div className="form-group">
              <div className="addbook-label-row">
                <label className="form-label" htmlFor="title">Title</label>
                <span className="addbook-hint">{titleCount} chars</span>
              </div>
              <input
                id="title"
                className="form-input"
                type="text"
                placeholder="Book title"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="addbook-label-row">
                <label className="form-label" htmlFor="author">Author</label>
                <span className="addbook-hint">{authorCount} chars</span>
              </div>
              <input
                id="author"
                className="form-input"
                type="text"
                placeholder="Author name"
                value={form.author}
                onChange={(e) => handleChange('author', e.target.value)}
              />
            </div>

            <div className="addbook-row">
              <div className="form-group">
                <label className="form-label" htmlFor="price">Price (₹)</label>
                <input
                  id="price"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stock">Stock</label>
                <input
                  id="stock"
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <select
                id="category"
                className="form-input"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="addbook-toggle-row">
              <input
                id="bestSeller"
                type="checkbox"
                checked={Boolean(form.bestSeller)}
                onChange={(e) => handleChange('bestSeller', e.target.checked)}
                className="addbook-checkbox"
              />
              <label className="form-label" htmlFor="bestSeller">Mark as best seller</label>
              {form.bestSeller && <span className="cat-tag">Featured</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Cover image {isEdit ? '(leave blank to keep current)' : '*'}</label>

              {displayImage ? (
                <div className="addbook-preview-wrap">
                  <img src={displayImage} alt="Cover preview" className="addbook-cover-preview" />
                  <button type="button" onClick={removeImage} title="Remove image" className="addbook-remove-image">✕</button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="addbook-change-image">Change image</button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`addbook-dropzone${dragOver ? ' addbook-dropzone--active' : ''}`}
                >
                  <div className="addbook-dropzone-icon">🖼️</div>
                  <p className="addbook-dropzone-title">Drag and drop cover image or <span>browse files</span></p>
                  <p className="addbook-dropzone-sub">JPEG, PNG, WebP up to 5 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="imageFile"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileInput}
              />
            </div>

            <div className="modal-actions addbook-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => navigate('/inventory')}>Cancel</button>
              <button type="submit" className="btn-modal-save" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
              </button>
            </div>
          </div>

          <aside className="addbook-preview-col">
            <div className="section-card addbook-summary">
              <h3 className="section-card-title">Live Summary</h3>
              <div className="addbook-summary-grid">
                <div>
                  <div className="td-muted">Book</div>
                  <div className="td-bold">{form.title.trim() || 'Untitled Book'}</div>
                </div>
                <div>
                  <div className="td-muted">Author</div>
                  <div className="td-bold">{form.author.trim() || 'Unknown Author'}</div>
                </div>
                <div>
                  <div className="td-muted">Category</div>
                  <span className="cat-tag">{form.category}</span>
                </div>
                <div>
                  <div className="td-muted">Price</div>
                  <div className="td-bold">₹{Number.isFinite(priceValue) ? priceValue.toLocaleString('en-IN') : 0}</div>
                </div>
                <div>
                  <div className="td-muted">Stock</div>
                  <div className="td-bold">{Number.isFinite(stockValue) ? stockValue : 0}</div>
                </div>
                <div>
                  <div className="td-muted">Status</div>
                  <span className={`stock-badge ${stockValue <= 0 ? 'stock-out' : stockValue <= 5 ? 'stock-low' : stockValue <= 20 ? 'stock-med' : 'stock-ok'}`}>
                    {stockValue <= 0 ? 'Out of stock' : stockValue <= 5 ? 'Low stock' : 'Healthy stock'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default Add;
