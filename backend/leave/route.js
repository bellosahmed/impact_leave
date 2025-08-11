// To install or import npm packages or files
const express = require('express');
const { requestLeave, approveLeave, declineLeave, getMyLeaves, getAllLeaves, cancelLeave, getAdminDashboard } = require('./controller');
const { auth, restrict } = require('../middleware/auth');

const router = express.Router();

// router.use(auth); // 🛡 All routes below require login

// Leave Routes for Users
router.post('/request', auth, requestLeave);      // For user to request leave
router.get('/my', auth, getMyLeaves);
router.delete('/cancel/:id', auth, cancelLeave); //  user cancels and delete own pending leave

// For user to view their own leaves

// Leave Routes for Admin Only
router.get('/all', auth, getAllLeaves);         // Admin views all leave requests
router.put('/approve/:id', auth, approveLeave); // Admin approves leave
router.put('/decline/:id', auth, declineLeave); // Admin declines leave
router.get('/dashboard', auth, getAdminDashboard); //  Admin dashboard

module.exports = router;
