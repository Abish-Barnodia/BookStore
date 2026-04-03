import React, { createContext } from 'react'

export const authDataContext = createContext()

function AuthContext({ children }) {
  const raw = import.meta.env.VITE_SERVER_URL ?? 'https://bookstore-backen.onrender.com'
  const serverUrl = raw.endsWith('/') ? raw : `${raw}/`

  return (
    <authDataContext.Provider value={{ serverUrl }}>
      {children}
    </authDataContext.Provider>
  )
}

export default AuthContext