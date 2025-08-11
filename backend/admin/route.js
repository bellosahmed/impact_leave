const express = require('express');
const { alluser, changestatus, arp, getemail } = require('./controller');
const { auth, restrict } = require('../middleware/auth');

const router = express.Router();

router.get('/alluser', auth, alluser);
router.get('/arp/:status', auth, arp);
router.get('/status/:id', auth, changestatus);
router.get('/email/:email', auth, getemail);

module.exports = router;