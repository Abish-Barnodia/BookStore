import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/home.jsx';
import Login from './pages/Login.jsx';
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
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import Fiction from './Categories/Friction.jsx';
import NonFiction from './Categories/Non-Friction.jsx';
import Mystery from './Categories/Mystry.jsx';
import Philosophy from './Categories/Philosopy.jsx';
import Romance from './Categories/Romance.jsx';
import ScienceFiction from './Categories/ScienceFriction.jsx';

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
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
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/fiction" element={<Fiction />} />
        <Route path="/non-fiction" element={<NonFiction />} />
        <Route path="/mystery" element={<Mystery />} />
        <Route path="/philosophy" element={<Philosophy />} />
        <Route path="/romance" element={<Romance />} />
        <Route path="/science-fiction" element={<ScienceFiction />} />
      </Routes>
    </CartProvider>
  );
}

export default App;