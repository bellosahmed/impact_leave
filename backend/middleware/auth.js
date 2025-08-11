const User = require('../user/model');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Generate JWT token
const signToken = id => {
    return jwt.sign({ id }, process.env.jwt_secret, {
        expiresIn: process.env.jwt_expires_in
    });
};

// Create and send token via cookie
const createSendtoken = (user, res) => {
    const token = signToken(user._id);

    // Set the expiration time in milliseconds
    const expirationTime = new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    );

    const cookieOptions = {
        expires: expirationTime,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Set secure flag in production
    };

    res.cookie('jwt', token, cookieOptions);

    // Return the token for other uses (e.g., in the response body)
    return token;
};

// Middleware to authenticate user
const auth = async (req, res, next) => {
    let token;

    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ msg: 'Unauthorized! You need to log in.', status: false });
        }

        // This will throw if expired
        const decoded = jwt.verify(token, process.env.jwt_secret);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ msg: 'User not found.', status: false });
        }

        req.user = user;
        next();
    } catch (e) {
        console.error('Token verification error:', e.message);

        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Session expired. Please log in again.', status: false });
        }

        res.status(401).json({ msg: 'Token is not valid.', error: e.message });
    }
};


// Middleware to restrict access based on role
const restrict = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You do not have access to this resource.', status: false });
        }
        next();
    };
};

module.exports = { auth, signToken, createSendtoken, restrict };