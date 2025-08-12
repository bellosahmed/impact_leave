// backend/holiday/model.js
const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Holiday name is required.']
    },
    date: {
        type: Date,
        required: [true, 'Holiday date is required.'],
        unique: true // Prevents adding the same date twice
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);