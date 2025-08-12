const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Load environment and database
dotenv.config();
const db = require('./config/db');


// Load all your route files
const authRoute = require('./auth/route');
const userRoute = require('./user/route');
const leaveRoute = require('./leave/route');
const adminRoute = require('./admin/route');
const holidayRoute = require('./holiday/route');
const resetLeaveBalance = require('./utils/resetleave');

db();

// Initialize app
const app = express();

// 1. Enable CORS for your React app
// This allows your frontend (on localhost:5173) to make requests
app.use(cors({
    origin: 'http://localhost:5173', // The specific origin of your React app
    credentials: true
}));

// 2. Standard Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cron job for resetting leave
resetLeaveBalance();

// --- API Routes ---
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/leave', leaveRoute);
app.use('/api/admin', adminRoute);
app.use('/api/holidays', holidayRoute);

// Optional: Add a simple health check route to easily test if the server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));