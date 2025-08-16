const mongoose = require("mongoose");
const User = require('../user/model');

const leaveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "declined", "awaiting_admin_approval"],
        default: "pending"
    },
    supervisorDecision: {
        type: String,
        enum: ["pending", "approved", "declined"],
        default: "pending"
    },
    supervisorComment: { type: String, trim: true },
    adminComment: {
        type: String,
        trim: true
    }, actionTakenByRole: {
        type: String,
        enum: ['admin', 'superadmin']
    },
}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);