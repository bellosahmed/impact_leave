const express = require('express');
const { getuser, edituser, deluser, getMe } = require('./controller'); // <-- 1. Import getMe
const { auth } = require('../middleware/auth');

const router = express.Router();

// Add the /me route - This is essential for the frontend
// It gets the currently logged-in user from their token
router.get('/me', auth, getMe);

// Your original routes are still here and work as before
router.get('/profile/:id', getuser);
router.patch('/update/:id', auth, edituser);
router.delete('/delete/:id', auth, deluser);

module.exports = router;