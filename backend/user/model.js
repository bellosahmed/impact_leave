// install npm packages
const mongoose = require('mongoose');

// creation of the user
const userSchema = new mongoose.Schema({
    fname: { // First name
        type: String,
        //required: true
    },
    lname: { // Last name
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true // email can't be the same with others
    },
    phonenum: {
        type: Number,
        required: true,
        unique: true // email can't be the same with others
    },
    age: {
        type: Number
    },
    dob: { // Date of Birth
        type: Date
    },
    profilepic: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin', 'supervisor'], // user has basic access while admin have more
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false // when user is registered will show false untill he verifies his account
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // This tells Mongoose it's a reference to another User document
    },
    leaveBalance: {
        type: Number,
        default: 30
    }

}, { timestamps: true }); // timestamps create when the file is created


// export User
module.exports = mongoose.model('User', userSchema);