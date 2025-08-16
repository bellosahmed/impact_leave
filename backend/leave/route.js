// backend/leave/route.js
const express = require('express');
const {
    requestLeave, approveLeave, declineLeave, getMyLeaves, getAllLeaves,
    cancelLeave, getAdminDashboard, makeSupervisorDecision
} = require('./controller');
const { auth, restrict } = require('../middleware/auth');

const router = express.Router();

router.post('/request', auth, requestLeave);
router.get('/my', auth, getMyLeaves);
router.delete('/cancel/:id', auth, cancelLeave);
router.put('/supervisor/decision/:id', auth, restrict('supervisor'), makeSupervisorDecision);
router.get('/all', auth, restrict('supervisor'), getAllLeaves);
router.get('/dashboard', auth, restrict('supervisor'), getAdminDashboard);
router.put('/approve/:id', auth, restrict('admin'), approveLeave);
router.put('/decline/:id', auth, restrict('admin'), declineLeave);

module.exports = router;