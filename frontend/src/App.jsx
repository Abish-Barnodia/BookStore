import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Registration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book/:id" element={<BookView />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/self-help" element={<SelfHelp />} />
        <Route path="/fiction" element={<Fiction />} />
        <Route path="/sci-fi" element={<ScienceFiction />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/classic" element={<Classic />} />
        <Route path="/history" element={<History />} />
        <Route path="/fantasy" element={<Fantasy />} />
        <Route path="/general" element={<General />} />
      </Routes>
    </CartProvider>
  );
}

export default App;