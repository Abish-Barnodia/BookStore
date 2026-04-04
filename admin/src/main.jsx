import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AuthContext from './context/AuthContext.jsx'
import { bootstrapAuthToken, setAuthToken } from './utils/sessionAuth'

const hash = window.location.hash || ''
if (hash.includes('authToken=')) {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  const incomingToken = hashParams.get('authToken') || ''
  if (incomingToken) {
    setAuthToken(incomingToken)
    const cleanUrl = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', cleanUrl)
  }
}

bootstrapAuthToken()

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthContext>
      <App />
    </AuthContext>
  </BrowserRouter>,
)
