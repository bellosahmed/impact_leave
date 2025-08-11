// to install or import npm packages or files
const express = require('express');
const { signup, login, logout, verify, forgotpass, resetpass } = require('./controller');

const router = express.Router();

router.post('/signup', signup);// for user to user
router.post('/login', login); // for user to login
router.post('/logout', logout); // to logout
router.post('/verify', verify); // to verify account
router.post('/forgotpassword', forgotpass); // to send an email of forgot password
router.post('/resetpassword', resetpass); // to reset your password an an otp

module.exports = router;