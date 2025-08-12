// backend/holiday/route.js
const express = require('express');
const { addHoliday, getAllHolidays, deleteHoliday } = require('./controller');
const { auth, restrict } = require('../middleware/auth');

const router = express.Router();

// Only admins can add or delete holidays
router.post('/', auth, restrict('admin'), addHoliday);
router.delete('/:id', auth, restrict('admin'), deleteHoliday);

// All authenticated users can view the holiday list
router.get('/', auth, getAllHolidays);

module.exports = router;