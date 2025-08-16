// backend/leave/controller.js

const User = require('../user/model');
const Leave = require('./model');
const Holiday = require('../holiday/model');
const { createTransporter, createMailOptions } = require('../utils/email');

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

// --- CONTROLLER TO REQUEST LEAVE (with hierarchical notifications) ---
async function requestLeave(req, res) {
    try {
        const { startDate, endDate, reason } = req.body;
        const user = await User.findById(req.user.id).populate('supervisor');
        const holidays = await Holiday.find({ date: { $gte: new Date(startDate), $lte: new Date(endDate) } });
        const leaveDays = calculateLeaveDays(startDate, endDate, holidays);

        if (leaveDays > user.leaveBalance) {
            return res.status(400).json({ message: "Insufficient leave balance." });
        }

        const leave = await Leave.create({ user: user._id, startDate, endDate, reason });

        let recipients = [];
        if (user.role === 'user' && user.supervisor) {
            recipients.push(user.supervisor);
        } else if (user.role === 'user' && !user.supervisor) {
            recipients = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        } else if (user.role === 'supervisor') {
            recipients = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        } else if (user.role === 'admin') {
            const superAdmin = await User.findOne({ role: 'superadmin' });
            if (superAdmin) recipients.push(superAdmin);
        }        // If a superadmin requests leave, the recipients array remains empty, and no one is notified.
        if (recipients.length > 0) {
            const transporter = createTransporter();
            const subject = `New Leave Request from ${user.fname} ${user.lname}`;
            let textMessage = `A new leave request for ${leaveDays} day(s) has been submitted by ${user.fname} ${user.lname}. Please log in to review.`;
            let htmlMessage = `<p>A new leave request for <strong>${leaveDays}</strong> day(s) has been submitted by <strong>${user.fname} ${user.lname}</strong>.</p><p>Please log in to the admin dashboard to review.</p>`;

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

// --- CONTROLLER TO APPROVE LEAVE (with hierarchical authorization) ---
async function approveLeave(req, res) {
    try {
        const { comment } = req.body;
        const leave = await Leave.findById(req.params.id).populate("user");

        // An admin can give final approval on a request that is pending their review,
        // OR they can bypass the supervisor step if a request is still 'pending'.
        if (!leave || !['pending', 'awaiting_admin_approval'].includes(leave.status)) {
            return res.status(404).json({ message: "This leave request is not available for final approval." });
        }

        const approver = req.user;
        const requestor = leave.user;

        const roles = { user: 1, supervisor: 2, admin: 3, superadmin: 4 };
        if (roles[approver.role] <= roles[requestor.role]) {
            return res.status(403).json({ message: "You do not have permission to approve requests for this user." });
        }

        const holidays = await Holiday.find({ date: { $gte: leave.startDate, $lte: leave.endDate } });
        const leaveDays = calculateLeaveDays(leave.startDate, leave.endDate, holidays);

        if (leaveDays > leave.user.leaveBalance) {
            return res.status(400).json({ message: "User has insufficient leave balance." });
        }
        leave.user.leaveBalance -= leaveDays;
        leave.status = "approved";
        if (comment) {
            leave.adminComment = comment;
            leave.actionTakenByRole = approver.role; // <-- THIS IS THE CHANGE
        }
        await leave.user.save();
        await leave.save();      // Send email notification to the user
        const transporter = createTransporter();
        const subject = 'Your Leave Request has been Approved';

        let textMessage = `Hi ${leave.user.fname}, Your leave request for ${leaveDays} day(s) from ${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()} has been approved.`;
        let htmlMessage = `<p>Hi ${leave.user.fname},</p><p>Your leave request for <strong>${leaveDays}</strong> day(s) from <strong>${new Date(leave.startDate).toDateString()} to ${new Date(endDate).toDateString()}</strong> has been <strong>approved</strong>.</p>`;

        if (comment) {
            textMessage += ` Admin's Comment: ${comment}`;
            htmlMessage += `<p><strong>Admin's Comment:</strong> <em>${comment}</em></p>`;
        }

        textMessage += ` Your remaining leave balance is now ${leave.user.leaveBalance} days.`;
        htmlMessage += `<p>Your remaining leave balance is now <strong>${leave.user.leaveBalance}</strong> days.</p>`;

        const mailOptions = createMailOptions(leave.user.email, subject, textMessage, htmlMessage);

        console.log(`Attempting to send 'Approval' email to user: ${leave.user.email}`);
        await transporter.send(mailOptions).catch(err => {
            console.error("!!! FAILED TO SEND 'APPROVAL' EMAIL NOTIFICATION !!!");
            if (err.response) {
                console.error("SendGrid Response Body:", JSON.stringify(err.response.body.errors, null, 2));
            } else {
                console.error("SendGrid Error:", err);
            }
        });

        res.status(200).json({ message: "Leave approved successfully.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- CONTROLLER TO DECLINE LEAVE (with hierarchical authorization) ---
async function declineLeave(req, res) {
    try {
        const { comment } = req.body;
        const leave = await Leave.findById(req.params.id).populate("user");

        if (!leave || !['pending', 'awaiting_admin_approval'].includes(leave.status)) {
            return res.status(404).json({ message: "This leave request is not available for a final decision." });
        }

        const decliner = req.user;
        const requestor = leave.user;

        const roles = { user: 1, supervisor: 2, admin: 3, superadmin: 4 };
        if (roles[decliner.role] <= roles[requestor.role]) {
            return res.status(403).json({ message: "You do not have permission to decline requests for this user." });
        }

        leave.status = "declined";
        if (comment) {
            leave.adminComment = comment;
            leave.actionTakenByRole = decliner.role;
        }
        await leave.save();        // Send email notification to the user
        const transporter = createTransporter();
        const subject = 'Your Leave Request has been Declined';

        let textMessage = `Hi ${leave.user.fname}, Unfortunately, your leave request for the period ${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()} has been declined.`;
        let htmlMessage = `<p>Hi ${leave.user.fname},</p><p>Unfortunately, your leave request for the period <strong>${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()}</strong> has been <strong>declined</strong>.</p>`;

        if (comment) {
            textMessage += ` Admin's Comment: ${comment}`;
            htmlMessage += `<p><strong>Admin's Comment:</strong> <em>${comment}</em></p>`;
        }

        textMessage += ` Please contact your administrator if you have any questions.`;
        htmlMessage += `<p>Please contact your administrator if you have any questions.</p>`;

        const mailOptions = createMailOptions(leave.user.email, subject, textMessage, htmlMessage);

        console.log(`Attempting to send 'Decline' email to user: ${leave.user.email}`);
        await transporter.send(mailOptions).catch(err => {
            console.error("!!! FAILED TO SEND 'DECLINE' EMAIL NOTIFICATION !!!");
            if (err.response) {
                console.error("SendGrid Response Body:", JSON.stringify(err.response.body.errors, null, 2));
            } else {
                console.error("SendGrid Error:", err);
            }
        });

        res.status(200).json({ message: "Leave declined successfully.", leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// --- CONTROLLER TO GET ALL LEAVES (populates 'role') ---
async function getAllLeaves(req, res) {
    try {
        const leaves = await Leave.find()
            // THE FIX: We must add 'supervisor' to the list of fields to populate from the user document.
            .populate("user", "fname lname email leaveBalance role supervisor")
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
        // Now counts all roles except superadmin for a more accurate total
        const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
        const totalLeaves = await Leave.countDocuments();
        const [pending, approved, declined] = await Promise.all([
            Leave.countDocuments({ status: 'pending' }),
            Leave.countDocuments({ status: 'approved' }),
            Leave.countDocuments({ status: 'declined' })
        ]);
        const users = await User.find({ role: { $ne: 'superadmin' } }, 'leaveBalance');
        const avgLeaveBalance = users.length > 0 ? users.reduce((sum, u) => sum + u.leaveBalance, 0) / users.length : 0;
        res.status(200).json({
            status: true,
            dashboard: { totalUsers, totalLeaves, pending, approved, declined, avgLeaveBalance: avgLeaveBalance.toFixed(2) }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

async function makeSupervisorDecision(req, res) {
    try {
        const { decision, comment } = req.body; // 'approved' or 'declined'
        const leaveId = req.params.id;
        const supervisor = req.user;

        const leave = await Leave.findById(leaveId);

        if (!leave) {
            return res.status(404).json({ message: "Leave request not found." });
        }
        if (leave.status !== 'pending') {
            return res.status(400).json({ message: "This leave request is no longer pending supervisor review." });
        }

        const requestor = await User.findById(leave.user);
        if (!requestor) {
            return res.status(404).json({ message: "Requesting user not found." });
        }

        leave.supervisorDecision = decision;
        if (comment) {
            leave.supervisorComment = comment;
        }
        leave.status = 'awaiting_admin_approval';

        const updatedLeave = await leave.save();

        const managers = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        if (managers.length > 0) {
            const transporter = createTransporter();
            const subject = `Supervisor Action on Leave Request for ${requestor.fname}`;
            const textMessage = `Supervisor ${supervisor.fname} ${supervisor.lname} has ${decision} the leave request for ${requestor.fname} ${requestor.lname}. The request is now awaiting final approval.`;
            let htmlMessage = `<p>Supervisor <strong>${supervisor.fname} ${supervisor.lname}</strong> has <strong>${decision}</strong> the leave request for <strong>${requestor.fname} ${requestor.lname}</strong>.</p><p>The request is now awaiting your final review in the admin dashboard.</p>`;
            if (comment) {
                htmlMessage += `<p><strong>Supervisor's Comment:</strong> <em>${comment}</em></p>`;
            }

            for (const manager of managers) {
                const mailOptions = createMailOptions(manager.email, subject, textMessage, htmlMessage);
                await transporter.send(mailOptions).catch(console.error);
            }
        }

        res.status(200).json({ message: "Supervisor decision recorded successfully.", leave: updatedLeave });
    } catch (error) {
        console.error("CRASH in makeSupervisorDecision:", error);
        res.status(500).json({ message: error.message });
    }
}
module.exports = { requestLeave, makeSupervisorDecision, approveLeave, declineLeave, getMyLeaves, getAllLeaves, cancelLeave, getAdminDashboard, _calculateLeaveDaysForTest: calculateLeaveDays };