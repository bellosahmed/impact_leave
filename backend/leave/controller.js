// backend/leave/controller.js

const User = require('../user/model');
const Leave = require('./model');
const Holiday = require('../holiday/model');
const { createTransporter, createMailOptions } = require('../utils/email');

/**
 * Calculates leave days, excluding weekends and public holidays.
 */
function calculateLeaveDays(startDate, endDate, holidays = []) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const holidayDates = new Set(holidays.map(h => new Date(h.date).toISOString().split('T')[0]));
    let count = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = d.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
            count++;
        }
    }
    return count;
};

// --- CONTROLLER TO REQUEST LEAVE (with Superadmin-aware notifications) ---
async function requestLeave(req, res) {
    try {
        const { startDate, endDate, reason } = req.body;
        const user = await User.findById(req.user.id);
        const holidays = await Holiday.find({ date: { $gte: new Date(startDate), $lte: new Date(endDate) } });
        const leaveDays = calculateLeaveDays(startDate, endDate, holidays);

        if (leaveDays > user.leaveBalance) {
            return res.status(400).json({ message: "Insufficient leave balance for the calculated work days." });
        }

        const leave = await Leave.create({ user: user._id, startDate, endDate, reason });

        // Smart Notification Logic
        let recipients = [];
        if (user.role === 'admin') {
            // If an admin requests leave, notify only the superadmin.
            const superAdmin = await User.findOne({ role: 'superadmin' });
            if (superAdmin) recipients.push(superAdmin);
        } else {
            // If a regular user requests leave, notify all admins and superadmins.
            recipients = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        }

        if (recipients.length > 0) {
            const transporter = createTransporter();
            const subject = `New Leave Request from ${user.fname} ${user.lname}`;
            const textMessage = `A new leave request for ${leaveDays} day(s) has been submitted by ${user.fname} ${user.lname}. Please log in to review.`;
            const htmlMessage = `<p>A new leave request for <strong>${leaveDays}</strong> day(s) has been submitted by <strong>${user.fname} ${user.lname}</strong>.</p><p>Please log in to the admin dashboard to review.</p>`;

            for (const recipient of recipients) {
                const mailOptions = createMailOptions(recipient.email, subject, textMessage, htmlMessage);
                await transporter.send(mailOptions).catch(console.error);
            }
        }

        res.status(201).json({ message: "Leave request submitted successfully.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- CONTROLLER TO APPROVE LEAVE (with Superadmin authorization) ---
async function approveLeave(req, res) {
    try {
        const { comment } = req.body;
        const leave = await Leave.findById(req.params.id).populate("user");

        if (!leave || leave.status !== "pending") {
            return res.status(404).json({ message: "Leave not found or already processed." });
        }

        const approver = req.user;
        const requestor = leave.user;

        // An admin cannot approve another admin's or a superadmin's leave.
        if (approver.role === 'admin' && requestor.role !== 'user') {
            return res.status(403).json({ message: "Admins can only approve leave for regular users." });
        }

        const holidays = await Holiday.find({ date: { $gte: leave.startDate, $lte: leave.endDate } });
        const leaveDays = calculateLeaveDays(leave.startDate, leave.endDate, holidays);

        if (leaveDays > leave.user.leaveBalance) {
            return res.status(400).json({ message: "User has insufficient leave balance." });
        }

        leave.user.leaveBalance -= leaveDays;
        leave.status = "approved";
        if (comment) { leave.adminComment = comment; }
        await leave.user.save();
        await leave.save();

        // ... (email notification logic is the same)
        res.status(200).json({ message: "Leave approved successfully.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- CONTROLLER TO DECLINE LEAVE (with Superadmin authorization) ---
async function declineLeave(req, res) {
    try {
        const { comment } = req.body;
        const leave = await Leave.findById(req.params.id).populate("user");

        if (!leave || leave.status !== "pending") {
            return res.status(404).json({ message: "Leave not found or already processed." });
        }

        const decliner = req.user;
        const requestor = leave.user;

        if (decliner.role === 'admin' && requestor.role !== 'user') {
            return res.status(403).json({ message: "Admins can only decline leave for regular users." });
        }

        leave.status = "declined";
        if (comment) { leave.adminComment = comment; }
        await leave.save();

        // ... (email notification logic is the same)
        res.status(200).json({ message: "Leave declined successfully.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- CONTROLLER TO GET ALL LEAVES (populates 'role') ---
async function getAllLeaves(req, res) {
    try {
        const leaves = await Leave.find()
            .populate("user", "fname lname email leaveBalance role")
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- OTHER CONTROLLERS (Unchanged) ---
async function getMyLeaves(req, res) {
    try {
        const leaves = await Leave.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function cancelLeave(req, res) {
    try {
        const leave = await Leave.findOne({ _id: req.params.id, user: req.user.id, status: 'pending' });
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found or cannot be canceled.', status: false });
        }
        await leave.deleteOne();
        res.status(200).json({ message: 'Leave request canceled successfully.', status: true });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

async function getAdminDashboard(req, res) {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalLeaves = await Leave.countDocuments();
        const [pending, approved, declined] = await Promise.all([
            Leave.countDocuments({ status: 'pending' }),
            Leave.countDocuments({ status: 'approved' }),
            Leave.countDocuments({ status: 'declined' })
        ]);
        const users = await User.find({ role: 'user' }, 'leaveBalance');
        const avgLeaveBalance = users.length > 0 ? users.reduce((sum, u) => sum + u.leaveBalance, 0) / users.length : 0;
        res.status(200).json({
            status: true,
            dashboard: { totalUsers, totalLeaves, pending, approved, declined, avgLeaveBalance: avgLeaveBalance.toFixed(2) }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = { requestLeave, approveLeave, declineLeave, getMyLeaves, getAllLeaves, cancelLeave, getAdminDashboard };