// backend/middleware/auth.js

const User = require('../user/model');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Generate JWT token (Unchanged)
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token via cookie (Unchanged)
const createSendtoken = (user, res) => {
    const token = signToken(user._id);
    const expirationTime = new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000);
    const cookieOptions = {
        expires: expirationTime,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };
    res.cookie('jwt', token, cookieOptions);
    return token;
};

// Middleware to authenticate user (Unchanged)
const auth = async (req, res, next) => {
    let token;
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ msg: 'Unauthorized! You need to log in.', status: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ msg: 'User belonging to this token does no longer exist.', status: false });
        }

        req.user = user;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Session expired. Please log in again.', status: false });
        }
        res.status(401).json({ msg: 'Token is not valid.', error: e.message });
    }
};


// Middleware to restrict access based on a role hierarchy.
const restrict = (requiredRole) => {
    return (req, res, next) => {
        // Rule 1: A superadmin can do anything.
        if (req.user.role === 'superadmin') {
            return next();
        }
        // Rule 2: An admin can do anything that requires the 'admin' role.
        if (req.user.role === 'admin' && requiredRole === 'admin') {
            return next();
        }
        // Rule 3: A regular user cannot access restricted routes.
        // If the code reaches here, the user is not a superadmin and does not have the required role.
        return res.status(403).json({ message: 'You do not have permission to perform this action.', status: false });
    };
};

module.exports = { auth, signToken, createSendtoken, restrict };