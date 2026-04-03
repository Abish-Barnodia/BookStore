import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import connectDb from './config/db.js'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import productRoutes from './routes/productRoutes.js'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { apiLimiter } from './middleware/rateLimiter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Always load backend/.env (fixes missing SMTP_* when Node cwd is not the backend folder).
dotenv.config({ path: path.join(__dirname, '.env') })

const smtpUserForHint = (process.env.SMTP_USER || '').trim().toLowerCase()
const smtpPassLen = String(process.env.SMTP_PASS || '')
  .trim()
  .replace(/\s+/g, '').length
if (
  smtpUserForHint &&
  smtpPassLen > 0 &&
  (smtpUserForHint.endsWith('@gmail.com') || smtpUserForHint.endsWith('@googlemail.com')) &&
  smtpPassLen !== 16
) {
  console.warn(
    `[env] SMTP_PASS is ${smtpPassLen} characters (spaces removed). Gmail app passwords are almost always exactly 16 letters — check for a copy/paste typo or regenerate at https://myaccount.google.com/apppasswords`
  )
}

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '')
const renderFrontendUrl = 'https://bookstore-frontend-v8pe.onrender.com'
const renderAdminUrl = 'https://bookstore-admin-3wc7.onrender.com'

const port = process.env.PORT || 8000
const clientUrl = normalizeOrigin(process.env.CLIENT_URL)
const adminUrl = normalizeOrigin(process.env.ADMIN_URL)
const effectiveAdminUrl = normalizeOrigin(adminUrl || renderAdminUrl)
const frontendUrl = normalizeOrigin(clientUrl || renderFrontendUrl)
if (clientUrl) {
  console.log("[config] CLIENT_URL =", clientUrl, "(reset links will use this base)")
} else {
  console.log("[config] CLIENT_URL not set — reset links will use request origin or localhost")
}

// Helpful debug warnings for Google login (do not print secrets).
if (!process.env.JWT_SECRET) {
  console.warn('[config] JWT_SECRET is missing. Google login may fail to create a session.');
}
if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn('[config] FIREBASE_PROJECT_ID is missing. Firebase ID token verification may fail.');
}

const app = express()

// Render runs behind a proxy; trust it so req.ip is the real client IP.
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", frontendUrl],
  }
}))
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}))

// Request logging
app.use(morgan('combined'))

// Body parser with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'public')))

// API rate limiting
app.use('/api/', apiLimiter)
const allowedOrigins = [
  'http://localhost:5173',           // dev — storefront
  'http://127.0.0.1:5173',
  'http://localhost:5174',           // admin panel (vite default in admin/)
  'http://127.0.0.1:5174',
  frontendUrl,
  clientUrl,
  effectiveAdminUrl,
].filter(Boolean)

const isLocalDevOrigin = (origin) => {
  try {
    const parsed = new URL(origin)
    const hostname = parsed.hostname
    
    // Check if private IP (192.168, 10.x.x.x, 172.16-31.x.x.x)
    const isPrivateIP = (ip) => {
      const parts = ip.split('.')
      if (parts.length !== 4) return false
      const [a, b] = [parseInt(parts[0], 10), parseInt(parts[1], 10)]
      return (
        a === 192 && b === 168 ||  // 192.168.0.0/16
        a === 10 ||                 // 10.0.0.0/8
        a === 172 && b >= 16 && b <= 31  // 172.16.0.0/12
      )
    }
    
    return (
      parsed.protocol === 'http:' &&
      (hostname === 'localhost' || hostname === '127.0.0.1' || isPrivateIP(hostname))
    )
  } catch {
    return false
  }
}

const isBookstoreRenderOrigin = (origin) => {
  try {
    const parsed = new URL(origin)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.onrender.com') &&
      parsed.hostname.startsWith('bookstore-')
    )
  } catch {
    return false
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, mobile apps)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin) || isBookstoreRenderOrigin(origin)) {
        return callback(null, true)
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`))
    },
    credentials: true,
  })
)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/product', productRoutes)


// Lightweight health check for dev / monitoring (proxied from Vite as /api/health)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'ecommerce-api' })
})

app.get('/', (req, res) => {
  res.send('Hello from server!')
})

const startServer = async () => {
  try {
    await connectDb()
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
