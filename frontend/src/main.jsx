import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import AuthContextProvider from './context/authContex.jsx';
import DevBackendBanner from './components/DevBackendBanner.jsx';
import { bootstrapAuthToken, initAuthTabLifecycle } from './utils/sessionAuth';

initAuthTabLifecycle();
bootstrapAuthToken();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthContextProvider>
        <DevBackendBanner />
        <App />
      </AuthContextProvider>
    </HashRouter>
  </StrictMode>,
);
