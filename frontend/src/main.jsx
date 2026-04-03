import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import AuthContextProvider from './context/authContex.jsx';
import DevBackendBanner from './components/DevBackendBanner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <DevBackendBanner />
        <App />
      </AuthContextProvider>
    </BrowserRouter>
  </StrictMode>,
);
