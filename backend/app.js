// backend/app.js

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./config/db');

// Security Imports (express-mongo-sanitize has been removed)
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoute = require('./auth/route');
const userRoute = require('./user/route');
const leaveRoute = require('./leave/route');
const adminRoute = require('./admin/route');
const holidayRoute = require('./holiday/route');
const resetLeaveBalance = require('./utils/resetleave');

db();
const app = express();

// ===============================================
// --- 1. GLOBAL SECURITY MIDDLEWARE ---
// ===============================================

app.use(helmet({ contentSecurityPolicy: { /* your CSP config */ } }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', apiLimiter);

// ===============================================
// --- 2. DATA PARSING & SANITIZATION MIDDLEWARE ---
// ===============================================

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// --- The express-mongo-sanitize middleware has been completely removed ---
// Your application is still protected by Mongoose's schema validation and express-validator.

// ===============================================
// --- 3. APPLICATION LOGIC & ROUTES ---
// ===============================================

resetLeaveBalance();

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/leave', leaveRoute);
app.use('/api/admin', adminRoute);
app.use('/api/holidays', holidayRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ===============================================
// --- 4. ERROR HANDLING ---
// ===============================================

app.use((err, req, res, next) => {
    console.error('--- UNHANDLED ERROR ---', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went very wrong on the server.'
    });
});

// ===============================================
// --- 5. START SERVER ---
// ===============================================

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));