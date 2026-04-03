import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { initializeApp } from "firebase/app"

const FALLBACK_FIREBASE_API_KEY = "AIzaSyAOFPkTWmjWp7SjdcqmdObiILqq7CKfHnw"
const envApiKey = String(import.meta.env.VITE_FIREBASE_APIKEY || "")
  .trim()
  .replace(/^['\"]+|['\"]+$/g, "")

const firebaseApiKey = envApiKey || FALLBACK_FIREBASE_API_KEY

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "gloginbookstore.firebaseapp.com",
  projectId: "gloginbookstore",
  storageBucket: "gloginbookstore.firebasestorage.app",
  messagingSenderId: "331919531428",
  appId: "1:331919531428:web:38774c362f19bb94f27531",
}

if (!envApiKey) {
  console.warn("[firebase] VITE_FIREBASE_APIKEY is missing. Using fallback key.")
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const Provider = provider // backward-compatible alias

export { auth, provider, Provider }