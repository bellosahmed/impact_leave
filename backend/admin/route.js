// backend/admin/route.js
const express = require('express');
const { alluser, changestatus, arp, getemail, getUserLeaveSummary, getLeavesForUser } = require('./controller');
const { auth, restrict } = require('../middleware/auth');

const router = express.Router();

router.get('/alluser', auth, restrict('admin'), alluser);
router.get('/arp/:status', auth, restrict('admin'), arp);
router.patch('/status/:id', auth, restrict('admin'), changestatus); // Note: Should probably be PATCH not GET
router.get('/email/:email', auth, restrict('admin'), getemail);
router.get('/user-leave-summary', auth, restrict('admin'), getUserLeaveSummary);
router.get('/leaves/:userId', auth, restrict('admin'), getLeavesForUser);

module.exports = router;