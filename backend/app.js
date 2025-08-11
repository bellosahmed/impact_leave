const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

// Load environment and database
dotenv.config();
const db = require('./config/db');
db();

// Load routes
const authRoute = require('./auth/route');
const userRoute = require('./user/route');
const leaveRoute = require('./leave/route');
const resetLeaveBalance = require('./utils/resetleave');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Reset leave task
resetLeaveBalance();

// API routes
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/leave', leaveRoute);


// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
