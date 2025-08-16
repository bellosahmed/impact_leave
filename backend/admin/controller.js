const User = require('../user/model');
const Leave = require('../leave/model');
const Holiday = require('../holiday/model');
const { Verify, Resettoken } = require('../auth/model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createTransporter, createMailOptions } = require('../utils/email');

// Helper function to calculate leave days, needed for the summary
function calculateLeaveDays(startDate, endDate, holidays = []) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const holidayDates = new Set(holidays.map(h => new Date(h.date).toISOString().split('T')[0]));
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        const dateStr = d.toISOString().split('T')[0];
        if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
            count++;
        }
    }
    return count;
};

const getLeavesForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('fname lname');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const leaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ user, leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserLeaveSummary = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['user', 'supervisor', 'admin'] } }).select('fname lname email leaveBalance').lean();
        const approvedLeaves = await Leave.find({ status: 'approved' });
        const holidays = await Holiday.find();
        const leaveDaysMap = new Map();
        approvedLeaves.forEach(leave => {
            const userId = leave.user.toString();
            const daysTaken = calculateLeaveDays(leave.startDate, leave.endDate, holidays);
            const currentTotal = leaveDaysMap.get(userId) || 0;
            leaveDaysMap.set(userId, currentTotal + daysTaken);
        });
        const summary = users.map(user => ({
            ...user,
            totalDaysTaken: leaveDaysMap.get(user._id.toString()) || 0,
        }));
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//admin get all user
// const alluser = async (req, res) => {
//     try {
//         const getuser = req.userId
//         const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
//         if (!user) {
//             return res.status(404).json({ status: false, message: 'No user found' });
//         }
//         res.status(200).json({ status: true, message: 'All users has been found', user })
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//         console.log("Error in all user admin: ", error.message);
//     }
// };

const alluser = async (req, res) => {
    try {
        // Find all users where the _id is "not equal" ($ne) to the current user's ID.
        // This ensures an admin never sees themselves in the list they are managing.
        const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin can search active and inactive. // change it to leave
const arp = async (req, res) => {
    const { status } = req.params;
    try {
        const user = await User.find({ status }).sort({ _id: -1 }).exec();;
        if (!user) {
            return res.status(400).json({ message: "User not found", status: false });
        }
        res.status(200).json({ user, status: true })
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.error("Error in search user for active, inactive, and pending: ", error.message);
    }
};

// Admin can change the status of the user like pending, etc
const changestatus = async (req, res) => {
    const { status } = req.body;
    const userId = req.params.id;
    try {
        let user = await User.findById(userId); // find by user by id
        if (!user) { // no user found
            res.status(404).json({ status: false, msg: 'User does not exist' });
        }

        user.status = status || user.status;

        user = await user.save(); // save in the databse
        res.status(200).json({ message: 'User Updated', user, status: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.error("Error in change user for active, inactive, and pending: ", error.message);
    }
};

// Admin can search by email
const getemail = async (req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ email }).exec(); // Search for the user by email
        if (user) {
            res.status(200).json(user); // Return the user if found
        } else {
            res.status(404).json({ message: 'User not found' }); // Return a 404 if the user is not found
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log('Error in getemail:', error.message);
    }
};

// --- NEW: Function for Admin to create a new user ---
const createUserByAdmin = async (req, res) => {
    try {
        const { fname, lname, email, phonenum, role, supervisor } = req.body;
        const tempPassword = crypto.randomBytes(20).toString('hex');
        const userExists = await User.findOne({ email: email.toLowerCase() });

        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        const newUser = new User({
            fname, lname, email: email.toLowerCase(), password: tempPassword, phonenum,
            role: role || 'user',
            isVerified: true,
            supervisor: supervisor || null
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);
        await newUser.save();
        // --- Generate a secure, single-use password reset token ---
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const reset = new Resettoken({
            owner: newUser._id,
            token: hashedToken,
            createdAt: Date.now()
        });
        await reset.save();

        // --- Send the "Welcome & Set Password" Email ---
        // This link contains the raw token and user ID, which the frontend will use.
        const resetURL = `http://localhost:5173/reset-password?token=${resetToken}&id=${newUser._id}`;

        const transporter = createTransporter();
        const subject = 'Welcome to Impact Leave! Set Your Password';
        const textMessage = `Welcome to the team, ${fname}! An account has been created for you. Please set your password by visiting the following link: ${resetURL}`;
        const htmlMessage = `<p>Welcome to the team, ${fname}!</p><p>An account has been created for you in the Impact Leave management system. To get started, please set your password by clicking the link below:</p><p><a href="${resetURL}">Set Your Password</a></p><p>This link will expire in one hour.</p>`;

        const mailOptions = createMailOptions(newUser.email, subject, textMessage, htmlMessage);
        await transporter.send(mailOptions);

        res.status(201).json({ message: "User created successfully. A welcome email has been sent for them to set their password.", user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// --- NEW: Function for Admin to delete a user ---
const deleteUserByAdmin = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        await Leave.deleteMany({ user: req.params.userId });
        res.status(200).json({ message: 'User and their associated leave deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserByAdmin = async (req, res) => {
    try {
        const { fname, lname, email, phonenum, role, leaveBalance, supervisor, password } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.fname = fname ?? user.fname;
        user.lname = lname ?? user.lname;
        user.email = email ?? user.email;
        user.phonenum = phonenum ?? user.phonenum;
        user.role = role ?? user.role;
        user.leaveBalance = leaveBalance ?? user.leaveBalance;
        user.supervisor = supervisor || null;

        // --- THIS IS THE FIX ---
        // If a new password was provided in the form, hash it before saving.
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.status(200).json({ message: 'User updated successfully.', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({
            role: { $in: ['supervisor', 'admin', 'superadmin'] }
        }).select('fname lname _id'); // Select only the necessary fields
        res.status(200).json(supervisors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { alluser, getSupervisors, changestatus, arp, getemail, getUserLeaveSummary, getLeavesForUser, createUserByAdmin, deleteUserByAdmin, updateUserByAdmin };