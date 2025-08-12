// backend/holiday/controller.js
const Holiday = require('./model');

// Admin: Add a new public holiday
const addHoliday = async (req, res) => {
    try {
        const { name, date } = req.body;
        // The unique index on the model will prevent duplicate dates
        const holiday = await Holiday.create({ name, date });
        res.status(201).json({ message: "Holiday added successfully.", holiday });
    } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A holiday on this date already exists.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// All Users: Get all public holidays
const getAllHolidays = async (req, res) => {
    try {
        // Sort by date to show them in chronological order
        const holidays = await Holiday.find().sort({ date: 'asc' });
        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Delete a public holiday
const deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found.' });
        }
        res.status(200).json({ message: 'Holiday deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addHoliday, getAllHolidays, deleteHoliday };