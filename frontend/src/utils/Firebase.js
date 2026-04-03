import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "gloginbookstore.firebaseapp.com",
  projectId: "gloginbookstore",
  storageBucket: "gloginbookstore.firebasestorage.app",
  messagingSenderId: "331919531428",
  appId: "1:331919531428:web:38774c362f19bb94f27531",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const Provider = provider // backward-compatible alias

export { auth, provider, Provider }