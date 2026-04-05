import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AuthContext from './context/AuthContext.jsx'
import { bootstrapAuthToken, initAuthTabLifecycle, setAuthToken } from './utils/sessionAuth'

try {
  const handoffRaw = window.name || ''
  if (handoffRaw) {
    const parsed = JSON.parse(handoffRaw)
    const incomingToken = typeof parsed?.adminAuthToken === 'string' ? parsed.adminAuthToken : ''
    if (incomingToken) {
      setAuthToken(incomingToken)
    }
    // Always clear handoff data after first read.
    window.name = ''
  }
} catch {
  // Invalid handoff payload; clear and continue without session hydration.
  window.name = ''
}

bootstrapAuthToken()
initAuthTabLifecycle()

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthContext>
      <App />
    </AuthContext>
  </BrowserRouter>,
)
