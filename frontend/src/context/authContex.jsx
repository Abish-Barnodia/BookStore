import React, { createContext } from 'react';

export const authDataContext = createContext();

function AuthContextProvider({ children }) {
  // Prefer local API during local development to avoid remote cold-start latency.
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const serverUrlRaw = import.meta.env.VITE_SERVER_URL || (isLocalHost ? 'http://localhost:8000' : 'https://bookstore-backen.onrender.com');
  const serverUrl = serverUrlRaw.endsWith('/') ? serverUrlRaw : `${serverUrlRaw}/`;

  const value = {
    serverUrl,
  };

  return (
    <authDataContext.Provider value={value}>
      {children}
    </authDataContext.Provider>
  );
}

export default AuthContextProvider;