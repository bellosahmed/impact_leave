// backend/auth/route.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, logout, verify, forgotpass, resetpass } = require('./controller');
// Import the validation middleware
const { handleValidationErrors, passwordResetValidationRules } = require('../admin/validators');

const router = express.Router();

// --- Rate Limiter for sensitive authentication actions (login, password resets) ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
});

// --- A very strict rate limiter for creating new accounts to prevent spam ---
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 signup attempts per hour
    message: 'Too many accounts created from this IP, please try again after an hour.'
});


// --- AUTHENTICATION ROUTES ---

// Apply the limiters and validators to the appropriate routes
router.post(
    '/signup',
    signupLimiter,                     // 1. Apply strict signup rate limit
    passwordResetValidationRules(),    // 2. Validate for a strong password
    handleValidationErrors,            // 3. Handle any validation errors
    signup                             // 4. Proceed to controller if valid
);

router.post('/login', authLimiter, login);

router.post('/forgotpassword', authLimiter, forgotpass);

router.post(
    '/resetpassword',
    authLimiter,                       // 1. Apply auth rate limit
    passwordResetValidationRules(),    // 2. Validate for a strong new password
    handleValidationErrors,            // 3. Handle any validation errors
    resetpass                          // 4. Proceed to controller if valid
);

// Other, less sensitive routes
router.post('/logout', logout);
router.post('/verify', verify);

module.exports = router;