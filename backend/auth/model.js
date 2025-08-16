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


const resetSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true }, // Store the hashed token
    createdAt: { type: Date, expires: 3600, default: Date.now() } // Expires in 1 hour
});


// Export both models
module.exports = {
    Verify: mongoose.model('Verify', verifySchema),
    Resettoken: mongoose.model('Reset', resetSchema),
};