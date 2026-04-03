import React, { createContext } from 'react';

export const authDataContext = createContext();

function AuthContextProvider({ children }) {
  // Use Vite env when provided; default to deployed backend URL.
  const serverUrlRaw = import.meta.env.VITE_SERVER_URL || 'https://bookstore-backen.onrender.com';
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