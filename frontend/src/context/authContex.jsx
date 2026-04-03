import React, { createContext } from 'react';

export const authDataContext = createContext();

function AuthContextProvider({ children }) {
  // Use Vite env when provided; default to same-origin (/api) so Vite proxy can forward to backend.
  const serverUrlRaw = import.meta.env.VITE_SERVER_URL || '/';
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