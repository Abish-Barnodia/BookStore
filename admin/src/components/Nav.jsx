import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/inventory': 'Inventory Management',
  '/orders':    'Order Management',
  '/users':     'User Management',
  '/profile':   'Admin Profile',
};

function Nav({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'Admin Panel';
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <h1 className="admin-navbar-title">{title}</h1>
        <p className="admin-navbar-date">{dateStr}</p>
      </div>
      <div className="admin-navbar-right">
        <button type="button" className="admin-avatar" onClick={() => navigate('/profile')} aria-label="Open admin profile">
          A
        </button>
      </div>
    </header>
  );
}

export default Nav;
