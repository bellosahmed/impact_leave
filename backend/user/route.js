const express = require('express');
const { getuser, edituser, deluser } = require('./controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile/:id', getuser); // for profile
router.patch('/update/:id', auth, edituser); // edit user don't know if its put or patch
router.delete('/delete/:id', auth, deluser); // delete user

module.exports = router;