const User = require('../user/model');
const Leave = require('./model');
const mongoose = require("mongoose");

// Helper to calculate number of leave days
function calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
            count++;
        }
    }

    return count;
};


// Request leave
async function requestLeave(req, res) {
    try {
        const { startDate, endDate, reason } = req.body;
        const userId = req.user.id;

        const leaveDays = calculateLeaveDays(startDate, endDate);
        const user = await User.findById(userId);

        if (leaveDays > user.leaveBalance) {
            return res.status(400).json({ message: "Insufficient leave balance." });
        }

        const leave = await Leave.create({
            user: userId,
            startDate,
            endDate,
            reason
        });

        res.status(201).json({ message: "Leave request submitted.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Admin: Approve leave
async function approveLeave(req, res) {
    try {
        const leave = await Leave.findById(req.params.id).populate("user");

        if (!leave || leave.status !== "pending") {
            return res.status(404).json({ message: "Leave not found or already processed." });
        }

        const leaveDays = calculateLeaveDays(leave.startDate, leave.endDate);

        if (leaveDays > leave.user.leaveBalance) {
            return res.status(400).json({ message: "User has insufficient leave balance." });
        }

        leave.user.leaveBalance -= leaveDays;
        leave.status = "approved";

        await leave.user.save();
        await leave.save();

        res.status(200).json({ message: "Leave approved.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Admin: Decline leave
async function declineLeave(req, res) {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave || leave.status !== "pending") {
            return res.status(404).json({ message: "Leave not found or already processed." });
        }

        leave.status = "declined";
        await leave.save();

        res.status(200).json({ message: "Leave declined.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// User: View my leave history
async function getMyLeaves(req, res) {
    try {
        const leaves = await Leave.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Admin: View all leave requests
async function getAllLeaves(req, res) {
    try {
        const leaves = await Leave.find()
            .populate("user", "fname lname email leaveBalance")
            .sort({ createdAt: -1 });

        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

async function cancelLeave(req, res) {
    try {
        const leave = await Leave.findOne({
            _id: req.params.id,
            user: req.user.id,        // only the owner can cancel
            status: 'pending'         // only if still pending
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found or cannot be canceled.', status: false });
        }

        await leave.deleteOne(); // or use .remove()
        res.status(200).json({ message: 'Leave request canceled successfully.', status: true });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

async function getAdminDashboard(req, res) {
    try {
        const totalUsers = await User.countDocuments();
        const totalLeaves = await Leave.countDocuments();

        const [pending, approved, declined] = await Promise.all([
            Leave.countDocuments({ status: 'pending' }),
            Leave.countDocuments({ status: 'approved' }),
            Leave.countDocuments({ status: 'declined' })
        ]);

        const users = await User.find({}, 'leaveBalance'); // get all users' leave balance
        const avgLeaveBalance = users.length > 0
            ? users.reduce((sum, u) => sum + u.leaveBalance, 0) / users.length
            : 0;

        res.status(200).json({
            status: true,
            dashboard: {
                totalUsers,
                totalLeaves,
                pending,
                approved,
                declined,
                avgLeaveBalance: avgLeaveBalance.toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Export all controller methods
module.exports = {
    requestLeave,
    approveLeave,
    declineLeave,
    getMyLeaves,
    getAllLeaves,
    cancelLeave,
    getAdminDashboard
};