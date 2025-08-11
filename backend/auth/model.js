const mongoose = require('mongoose');

// Define the verifySchema

// Verify password schema
const verifySchema = new mongoose.Schema({
    owner: {  // ref to the user
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    token: { // token serves as the pin 
        type: String,
    },
    createdAt: { // when pin is created and expires after 1 hour
        type: Date,
        expires: 3600,
        default: Date.now
    }
},

    { timestamps: true }); // timestamps create when the file is created


// Reset password Schema
const resetSchema = new mongoose.Schema({
    owner: { // ref to the user 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    token: {
        type: String,
    },
    createdAt: { // when pin is create and expires after 1 hour
        type: Date,
        expires: 3600,
        default: Date.now()
    }
}, { timestamps: true }); // timestamps create when the file is created


// Export both models
module.exports = {
    Verify: mongoose.model('Verify', verifySchema),
    Resettoken: mongoose.model('Reset', resetSchema),
};