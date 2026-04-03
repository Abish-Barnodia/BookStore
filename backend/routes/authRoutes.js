import express from "express"
import { 
    Registration, 
    Login, 
    logout, 
    ForgotPassword, 
    ResetPassword, 
    googleLogin, 
    adminLogin 
} from "../controller/authController.js"
import { 
    loginLimiter, 
    registerLimiter, 
    forgotPasswordLimiter,
    adminLoginLimiter 
} from "../middleware/rateLimiter.js"
import { 
    validate, 
    registrationValidation, 
    loginValidation, 
    forgotPasswordValidation,
    resetPasswordValidation,
    adminLoginValidation
} from "../middleware/validation.js"

const authRoutes = express.Router()

authRoutes.post("/register", registerLimiter, validate(registrationValidation), Registration)
authRoutes.post("/login", loginLimiter, validate(loginValidation), Login)
authRoutes.post("/logout", logout)
authRoutes.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordValidation), ForgotPassword)
authRoutes.post("/reset-password", validate(resetPasswordValidation), ResetPassword)
authRoutes.post("/google-login", googleLogin)
authRoutes.post("/admin-login", adminLoginLimiter, validate(adminLoginValidation), adminLogin)

export default authRoutes