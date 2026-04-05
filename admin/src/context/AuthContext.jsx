import React, { createContext } from 'react'

export const authDataContext = createContext()

function AuthContext({ children }) {
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const raw = import.meta.env.VITE_SERVER_URL ?? (isLocalHost ? 'http://localhost:8000' : 'https://bookstore-backen.onrender.com')
  const serverUrl = raw.endsWith('/') ? raw : `${raw}/`

  return (
    <authDataContext.Provider value={{ serverUrl }}>
      {children}
    </authDataContext.Provider>
  )
}

export default AuthContext