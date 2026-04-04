import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',          icon: '📊', label: 'Dashboard'  },
  { to: '/inventory', icon: '📚', label: 'Inventory'  },
  { to: '/orders',    icon: '🛒', label: 'Orders'     },
  { to: '/users',     icon: '👤', label: 'Users'      },
  { to: '/profile',    icon: '⚙️', label: 'Profile'    },
];

function Sidebar({ open, onNavigate }) {
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);
  const envStorefront = (import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '');
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const envIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envStorefront);
  const fallbackStorefront = isLocalHost ? 'http://localhost:5173' : 'https://bookstore-frontend-v8pe.onrender.com';
  const storefrontBase = envStorefront && !(envIsLocal && !isLocalHost) ? envStorefront : fallbackStorefront;
  const sharedLoginUrl = `${storefrontBase}/#/login`;

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}api/auth/logout`, {}, { withCredentials: true });
    } catch {
      /* still leave admin UI */
    }
    window.location.replace(sharedLoginUrl);
  };

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">⚜</span>
        <div>
          <div className="sidebar-logo-title">Bibliotheca</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
            }
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
