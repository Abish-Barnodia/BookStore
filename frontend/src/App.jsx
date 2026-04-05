import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CartProvider } from './context/CartContext';
import Home from './pages/home.jsx';
import Login from './pages/login.jsx';
import Registration from './pages/Registration.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Cart from './pages/Cart.jsx';
import PlaceOrder from './pages/PlaceOrder.jsx';
import Profile from './pages/Profile.jsx';
import BookView from './pages/BookView.jsx';
import FAQ from './pages/FAQ.jsx';
import Shipping from './pages/Shipping.jsx';
import Returns from './pages/Returns.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import Contact from './pages/Contact.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import SelfHelp from './Categories/SelfHelp.jsx';
import Fiction from './Categories/Friction.jsx';
import ScienceFiction from './Categories/ScienceFriction.jsx';
import Finance from './Categories/Finance.jsx';
import Classic from './Categories/Classic.jsx';
import History from './Categories/History.jsx';
import Fantasy from './Categories/Fantasy.jsx';
import General from './Categories/General.jsx';
import { authDataContext } from './context/authContex';
import { clearAuthToken, getAuthToken } from './utils/sessionAuth';

function RequireAuth({ children }) {
  const location = useLocation();
  const { serverUrl } = useContext(authDataContext);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const token = getAuthToken();

      try {
        await axios.post(
          serverUrl + 'api/user/get-user',
          {},
          {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!cancelled) {
          setAuthorized(true);
        }
      } catch {
        if (token) {
          clearAuthToken();
        }
        if (!cancelled) {
          setAuthorized(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [serverUrl, location.pathname, location.search]);

  if (checking) {
    return null;
  }

  if (!authorized) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname + (location.search || '') }} />;
  }

  return children;
}

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Registration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/place-order" element={<RequireAuth><PlaceOrder /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/book/:id" element={<RequireAuth><BookView /></RequireAuth>} />
        <Route path="/faq" element={<RequireAuth><FAQ /></RequireAuth>} />
        <Route path="/shipping" element={<RequireAuth><Shipping /></RequireAuth>} />
        <Route path="/returns" element={<RequireAuth><Returns /></RequireAuth>} />
        <Route path="/track-order" element={<RequireAuth><TrackOrder /></RequireAuth>} />
        <Route path="/contact" element={<RequireAuth><Contact /></RequireAuth>} />
        <Route path="/privacy-policy" element={<RequireAuth><PrivacyPolicy /></RequireAuth>} />
        <Route path="/terms-of-service" element={<RequireAuth><TermsOfService /></RequireAuth>} />
        <Route path="/cookie-policy" element={<RequireAuth><CookiePolicy /></RequireAuth>} />
        <Route path="/admin/*" element={<RequireAuth><AdminPortal /></RequireAuth>} />
        <Route path="/self-help" element={<RequireAuth><SelfHelp /></RequireAuth>} />
        <Route path="/fiction" element={<RequireAuth><Fiction /></RequireAuth>} />
        <Route path="/sci-fi" element={<RequireAuth><ScienceFiction /></RequireAuth>} />
        <Route path="/finance" element={<RequireAuth><Finance /></RequireAuth>} />
        <Route path="/classic" element={<RequireAuth><Classic /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
        <Route path="/fantasy" element={<RequireAuth><Fantasy /></RequireAuth>} />
        <Route path="/general" element={<RequireAuth><General /></RequireAuth>} />
      </Routes>
    </CartProvider>
  );
}

export default App;