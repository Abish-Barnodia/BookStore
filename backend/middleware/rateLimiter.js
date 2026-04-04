import rateLimit from 'express-rate-limit';

// Login rate limiter: 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
});

// Registration rate limiter: 10 attempts per hour
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many registration attempts, please try again in about an hour',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
});

// Password reset rate limiter: 3 attempts per hour
export const forgotPasswordLimiter = rateLimit({
    // Keep abuse protection, but allow reasonable retries during real user issues.
    windowMs: 10 * 60 * 1000,
    max: 10,
    handler: (req, res) => {
        const retryAfter = Math.ceil((req.rateLimit?.resetTime?.getTime() - Date.now()) / 1000);
        return res.status(429).json({
            success: false,
            message: `Too many password reset attempts. Try again in ${Math.max(retryAfter || 0, 0)} seconds.`,
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
});

// Admin login rate limiter: 5 attempts per 15 minutes (stricter)
export const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many admin login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
});

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production',
});
