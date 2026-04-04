import User from "../model/useModel.js";
import AdminUser from "../model/adminModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import { genToken, genTokenAdmin } from "../config/token.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { verifyFirebaseIdToken } from "../config/verifyFirebaseToken.js";
import { logAudit, getClientIp, getUserAgent } from "../utils/auditLogger.js";

const isProduction = process.env.NODE_ENV === "production";

/** HTTP-only auth cookie (same options everywhere) - Reduced to 24 hours */
const authCookieOptions = {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    // Render deploys use different origins for frontend/admin vs backend,
    // so production cookies must allow cross-site credentialed requests.
    sameSite: isProduction ? "none" : "lax",
    path: "/",
};

const setAuthCookie = (res, token) => {
    res.cookie("token", token, authCookieOptions);
};

const clearAuthCookie = (res) => {
    res.cookie("token", "", { ...authCookieOptions, maxAge: 0 });
};

/** Safe user object for JSON (no password / reset secrets) */
const toPublicUser = (userDoc) => {
    if (!userDoc) return null;
    const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete u.password;
    delete u.resetPasswordToken;
    delete u.resetPasswordExpiresAt;
    return u;
};

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");
const fallbackClientUrl = "https://bookstore-frontend-v8pe.onrender.com";

const generateResetToken = () => crypto.randomBytes(32).toString("hex");
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const buildResetUrl = (req, resetToken) => {
    const raw =
        process.env.CLIENT_URL ||
        req.headers.origin ||
        fallbackClientUrl;
    const base = String(raw).replace(/\/$/, "");
    return `${base}/reset-password?token=${encodeURIComponent(resetToken)}`;
};

/** Gmail shows app passwords as "xxxx xxxx xxxx xxxx" — SMTP must use 16 chars with no spaces. */
function normalizeSmtpPassword(raw) {
    return String(raw || "")
        .trim()
        .replace(/\s+/g, "");
}

/** True if we should use Gmail-specific SMTP settings. */
function isGmailSmtp(host, user) {
    const h = (host || "").toLowerCase();
    const u = (user || "").toLowerCase();
    return (
        h.includes("gmail.com") ||
        u.endsWith("@gmail.com") ||
        u.endsWith("@googlemail.com")
    );
}

/**
 * Gmail: use explicit smtp.gmail.com:587 + STARTTLS
 */
function createResetEmailTransporter() {
    const host = (process.env.SMTP_HOST || "").trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = (process.env.SMTP_USER || "").trim();
    const pass = normalizeSmtpPassword(process.env.SMTP_PASS);
    const debug = process.env.SMTP_DEBUG === "true";

    if (isGmailSmtp(host, user)) {
        return nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: { user, pass },
            tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
            connectionTimeout: 20_000,
            greetingTimeout: 20_000,
            debug,
            logger: debug ? console : false,
        });
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        debug,
        logger: debug ? console : false,
    });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export const ForgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email" });
        }

        const user = await User.findOne({ email });

        const genericMessage = "If the email exists, a reset link has been sent.";

        if (!user) {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        const resetToken = generateResetToken();
        const resetTokenHash = hashResetToken(resetToken);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpiresAt = expiresAt;
        await user.save();

        const resetUrl = buildResetUrl(req, resetToken);

        const SMTP_HOST = (process.env.SMTP_HOST || "").trim();
        const SMTP_USER = (process.env.SMTP_USER || "").trim();
        const SMTP_PASS = normalizeSmtpPassword(process.env.SMTP_PASS);
        const EMAIL_FROM = (process.env.EMAIL_FROM || "").trim();
        const smtpConfigured = Boolean(
            SMTP_USER &&
                SMTP_PASS.length > 0 &&
                (SMTP_HOST || isGmailSmtp("", SMTP_USER))
        );

        if (!smtpConfigured) {
            console.warn(
                "[forgot-password] SMTP not fully configured (need SMTP_USER + SMTP_PASS, and SMTP_HOST unless using @gmail.com). Showing dev resetUrl only."
            );
        }

        console.log("Password reset link:", resetUrl);

        if (smtpConfigured) {
            try {
                const transporter = createResetEmailTransporter();
                await transporter.verify();
                const mailSubject = process.env.RESET_EMAIL_SUBJECT || "Password reset";
                const fromAddr =
                    isGmailSmtp(SMTP_HOST, SMTP_USER) ? SMTP_USER : EMAIL_FROM || SMTP_USER;
                const info = await transporter.sendMail({
                    from: `"Bibliotheca" <${fromAddr}>`,
                    to: email,
                    subject: mailSubject,
                    text: `You requested a password reset.\n\nReset link: ${resetUrl}\n\nThis link expires in 30 minutes.`,
                    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes.</p>`,
                });
                console.log(
                    "[forgot-password] Email sent OK:",
                    { to: email, messageId: info.messageId, response: info.response }
                );
            } catch (mailErr) {
                console.error("SMTP send failed:", mailErr?.message || mailErr);
                const msg = String(mailErr?.message || "");
                const code = mailErr?.responseCode;
                let hint = "Could not send the email. Check server logs.";
                if (
                    code === 535 ||
                    msg.includes("Invalid login") ||
                    msg.includes("Username and Password not accepted") ||
                    msg.includes("BadCredentials")
                ) {
                    hint =
                        "Gmail rejected SMTP login. Fix: (1) Turn on 2-Step Verification. (2) Open https://myaccount.google.com/apppasswords — create a password for 'Mail'. (3) Put the 16 characters in backend/.env as SMTP_PASS. (4) SMTP_USER must be that same Gmail address. (5) Restart the backend.";
                }
                return res.status(503).json({
                    success: false,
                    message: hint,
                });
            }

            return res.status(200).json({ success: true, message: genericMessage });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
            resetUrl,
        });
    } catch (error) {
        console.error("ForgotPassword:", error);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
};

export const ResetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body || {};

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required",
            });
        }
        if (String(newPassword).length < 12) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 12 characters with uppercase, lowercase, number, and special character",
            });
        }

        const tokenHash = hashResetToken(token);
        const user = await User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpiresAt: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or has expired",
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpiresAt = null;
        await user.save();

        await logAudit({
            action: "PASSWORD_RESET",
            actor: user._id,
            actorEmail: user.email,
            actorRole: "customer",
            resourceType: "Auth",
            status: "SUCCESS",
        });

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. You can sign in now.",
        });
    } catch (error) {
        console.error("ResetPassword:", error);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const Registration = async (req, res) => {
    try {
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password;
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email" });
        }
        if (String(password).length < 12) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 12 characters with uppercase, lowercase, number, and special character",
            });
        }

        const existUser = await User.findOne({ email });
        if (existUser) {
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: email,
                actorRole: "customer",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Email already registered",
                ipAddress,
                userAgent,
            });
            return res.status(409).json({ success: false, message: "An account with this email already exists" });
        }

        const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
        if (adminEmail && email === adminEmail) {
            return res.status(403).json({
                success: false,
                message: "This email is reserved for administrators. Use the admin portal to sign in.",
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashPassword });

        const token = await genToken(user._id);
        if (!token) {
            return res.status(500).json({ success: false, message: "Could not create session" });
        }
        setAuthCookie(res, token);

        await logAudit({
            action: "LOGIN",
            actor: user._id,
            actorEmail: email,
            actorRole: "customer",
            resourceType: "Auth",
            status: "SUCCESS",
            ipAddress,
            userAgent,
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: toPublicUser(user),
            token,
        });
    } catch (error) {
        console.error("Registration:", error);
        return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
    }
};

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const Login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password;
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email" });
        }

        const admin = await AdminUser.findOne({ email });
        if (admin) {
            if (admin.accountLockedUntil && admin.accountLockedUntil > new Date()) {
                const lockTimeRemaining = Math.ceil(
                    (admin.accountLockedUntil - new Date()) / 1000 / 60
                );
                await logAudit({
                    action: "LOGIN_FAILED",
                    actorEmail: email,
                    actor: admin._id,
                    actorRole: "admin",
                    resourceType: "Auth",
                    status: "FAILURE",
                    errorMessage: `Account locked for ${lockTimeRemaining} minutes`,
                    ipAddress,
                    userAgent,
                });
                return res.status(429).json({
                    success: false,
                    message: `Account temporarily locked. Try again in ${lockTimeRemaining} minutes`,
                });
            }

            if (admin.status !== "active") {
                await logAudit({
                    action: "LOGIN_FAILED",
                    actor: admin._id,
                    actorEmail: email,
                    actorRole: "admin",
                    resourceType: "Auth",
                    status: "FAILURE",
                    errorMessage: "Admin account is inactive",
                    ipAddress,
                    userAgent,
                });
                return res.status(403).json({
                    success: false,
                    message: "This admin account is inactive",
                });
            }

            const isAdminPasswordMatch = await bcrypt.compare(password, admin.password);
            if (!isAdminPasswordMatch) {
                admin.loginAttempts = (admin.loginAttempts || 0) + 1;
                if (admin.loginAttempts >= 5) {
                    admin.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                }
                await admin.save();

                await logAudit({
                    action: "LOGIN_FAILED",
                    actor: admin._id,
                    actorEmail: email,
                    actorRole: "admin",
                    resourceType: "Auth",
                    status: "FAILURE",
                    errorMessage: `Invalid password. Attempt ${admin.loginAttempts}/5`,
                    ipAddress,
                    userAgent,
                });

                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            admin.loginAttempts = 0;
            admin.accountLockedUntil = null;
            admin.lastLogin = new Date();
            await admin.save();

            const token = await genTokenAdmin(admin._id);
            if (!token) {
                return res.status(500).json({ success: false, message: "Could not create session" });
            }
            setAuthCookie(res, token);

            await logAudit({
                action: "LOGIN",
                actor: admin._id,
                actorEmail: email,
                actorRole: admin.role,
                resourceType: "Auth",
                status: "SUCCESS",
                ipAddress,
                userAgent,
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    _id: admin._id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
                token,
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: email,
                actorRole: "customer",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "User not found",
                ipAddress,
                userAgent,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google sign-in. Please use Google sign-in.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logAudit({
                action: "LOGIN_FAILED",
                actor: user._id,
                actorEmail: email,
                actorRole: "customer",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Invalid password",
                ipAddress,
                userAgent,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = await genToken(user._id);
        if (!token) {
            return res.status(500).json({ success: false, message: "Could not create session" });
        }
        setAuthCookie(res, token);

        await logAudit({
            action: "LOGIN",
            actor: user._id,
            actorEmail: email,
            actorRole: "customer",
            resourceType: "Auth",
            status: "SUCCESS",
            ipAddress,
            userAgent,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error("Login:", error);
        return res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
};

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export const logout = async (req, res) => {
    try {
        const ipAddress = getClientIp(req);

        await logAudit({
            action: "LOGOUT",
            actor: req.user?._id,
            actorEmail: req.user?.email,
            actorRole: "customer",
            resourceType: "Auth",
            status: "SUCCESS",
            ipAddress,
        });

        clearAuthCookie(res);
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("logout:", error);
        return res.status(500).json({ success: false, message: "Logout failed" });
    }
};

// ---------------------------------------------------------------------------
// Google Login
// ---------------------------------------------------------------------------

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body || {};
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!idToken) {
            return res.status(400).json({ success: false, message: "idToken is required" });
        }

        const projectId = process.env.FIREBASE_PROJECT_ID || "gloginbookstore";

        let profile;
        try {
            profile = await verifyFirebaseIdToken(idToken, projectId);
        } catch (verifyErr) {
            console.error("googleLogin verify:", verifyErr.message);
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: "google-user",
                actorRole: "customer",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Invalid Firebase token",
                ipAddress,
                userAgent,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid Google sign-in token",
                ...(isProduction ? {} : { detail: verifyErr.message }),
            });
        }

        const email = normalizeEmail(profile.email);
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email from Google" });
        }

        const name = profile.name || email.split("@")[0] || "User";
        let user = await User.findOne({ email });
        if (!user) {
            const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
            if (adminEmail && email === adminEmail) {
                return res.status(403).json({
                    success: false,
                    message: "This email is reserved for the admin portal. Sign in there with your admin password.",
                });
            }
            const randomPass = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
            user = await User.create({ name, email, password: randomPass });
        } else if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator accounts must use the admin portal to sign in.",
            });
        }

        const token = await genToken(user._id);
        if (!token) {
            return res.status(500).json({ success: false, message: "Could not create session" });
        }
        setAuthCookie(res, token);

        await logAudit({
            action: "LOGIN",
            actor: user._id,
            actorEmail: email,
            actorRole: "customer",
            resourceType: "Auth",
            status: "SUCCESS",
            ipAddress,
            userAgent,
        });

        const fresh = await User.findById(user._id).select(
            "-password -resetPasswordToken -resetPasswordExpiresAt"
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: toPublicUser(fresh),
            token,
        });
    } catch (error) {
        console.error("googleLogin:", error);
        const detail = error?.message || "Unknown Google sign-in error";
        return res.status(500).json({
            success: false,
            message: isProduction ? "Google sign-in failed" : detail,
        });
    }
};

// ---------------------------------------------------------------------------
// Admin Login
// ---------------------------------------------------------------------------

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const inputEmail = normalizeEmail(email);
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!inputEmail || !password) {
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: inputEmail,
                actorRole: "admin",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Missing email or password",
                ipAddress,
                userAgent,
            });
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find admin user in database
        let admin = await AdminUser.findOne({ email: inputEmail });

        if (!admin) {
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: inputEmail,
                actorRole: "admin",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Admin user not found",
                ipAddress,
                userAgent,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials",
            });
        }

        // Check if account is locked
        if (admin.accountLockedUntil && admin.accountLockedUntil > new Date()) {
            const lockTimeRemaining = Math.ceil(
                (admin.accountLockedUntil - new Date()) / 1000 / 60
            );
            await logAudit({
                action: "LOGIN_FAILED",
                actorEmail: inputEmail,
                actor: admin._id,
                actorRole: "admin",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: `Account locked for ${lockTimeRemaining} minutes`,
                ipAddress,
                userAgent,
            });
            return res.status(429).json({
                success: false,
                message: `Account temporarily locked. Try again in ${lockTimeRemaining} minutes`,
            });
        }

        // Check if admin is inactive
        if (admin.status !== "active") {
            await logAudit({
                action: "LOGIN_FAILED",
                actor: admin._id,
                actorEmail: inputEmail,
                actorRole: "admin",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: "Admin account is inactive",
                ipAddress,
                userAgent,
            });
            return res.status(403).json({
                success: false,
                message: "This admin account is inactive",
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            admin.loginAttempts = (admin.loginAttempts || 0) + 1;

            // Lock account after 5 failed attempts for 30 minutes
            if (admin.loginAttempts >= 5) {
                admin.accountLockedUntil = new Date(
                    Date.now() + 30 * 60 * 1000
                );
            }

            await admin.save();

            await logAudit({
                action: "LOGIN_FAILED",
                actor: admin._id,
                actorEmail: inputEmail,
                actorRole: "admin",
                resourceType: "Auth",
                status: "FAILURE",
                errorMessage: `Invalid password. Attempt ${admin.loginAttempts}/5`,
                ipAddress,
                userAgent,
            });

            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials",
            });
        }

        // Successful login
        admin.loginAttempts = 0;
        admin.accountLockedUntil = null;
        admin.lastLogin = new Date();
        await admin.save();

        const token = await genTokenAdmin(admin._id);
        if (!token) {
            return res.status(500).json({
                success: false,
                message: "Could not create session",
            });
        }

        setAuthCookie(res, token);

        await logAudit({
            action: "LOGIN",
            actor: admin._id,
            actorEmail: inputEmail,
            actorRole: admin.role,
            resourceType: "Auth",
            status: "SUCCESS",
            ipAddress,
            userAgent,
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            user: {
                _id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            token,
        });
    } catch (error) {
        console.error("adminLogin:", error);
        return res.status(500).json({
            success: false,
            message: "Admin login error",
        });
    }
};
