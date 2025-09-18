// ======================
// 1. IMPORT DEPENDENCIES
// ======================
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./config/db');

// Security
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoute = require('./auth/route');
const userRoute = require('./user/route');
const leaveRoute = require('./leave/route');
const adminRoute = require('./admin/route');
const holidayRoute = require('./holiday/route');

// Utils
const resetLeaveBalance = require('./utils/resetleave');

// ======================
// 2. INIT EXPRESS & DB
// ======================
db();
const app = express();

// ======================
// 3. SECURITY MIDDLEWARE
// ======================
app.use(helmet());

// Rate limiting (200 requests / 15min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', apiLimiter);

// ======================
// 4. CORS CONFIG
// ======================
// Allowed frontend domains (local + vercel)
const clientOrigins = [
  'http://localhost:5173',                        // local dev (Vite)
  'https://impact-leave.vercel.app',              // Vercel main frontend
  'https://impact-leave-frontend.vercel.app'      // (optional) if you rename project
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / server-to-server
    if (clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: ${origin} not allowed`));
  },
  credentials: true,
}));

// Trust proxy (important for rate-limiter + Render)
app.set('trust proxy', 1);

// ======================
// 5. BODY PARSERS
// ======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ======================
// 6. ROUTES
// ======================
resetLeaveBalance();

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/leave', leaveRoute);
app.use('/api/admin', adminRoute);
app.use('/api/holidays', holidayRoute);

// Health check route
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ======================
// 7. ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  console.error('--- UNHANDLED ERROR ---', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong on the server.'
  });
});

// ======================
// 8. START SERVER
// ======================
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`✅ Server running on http://localhost:${port}`)
);
