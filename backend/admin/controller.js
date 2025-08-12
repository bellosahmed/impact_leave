const User = require('../user/model');
const Leave = require('../leave/model');
const Holiday = require('../holiday/model');

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
        // Return both the user's info and their list of leaves
        res.status(200).json({ user, leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.error("Error in getLeavesForUser: ", error.message);
    }
};

// --- THIS IS THE NEW CONTROLLER FUNCTION ---
const getUserLeaveSummary = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('fname lname email leaveBalance').lean();
        const approvedLeaves = await Leave.find({ status: 'approved' });
        const holidays = await Holiday.find();

        // Create a map to store total leave days taken by each user
        const leaveDaysMap = new Map();

        approvedLeaves.forEach(leave => {
            const userId = leave.user.toString();
            const daysTaken = calculateLeaveDays(leave.startDate, leave.endDate, holidays);
            const currentTotal = leaveDaysMap.get(userId) || 0;
            leaveDaysMap.set(userId, currentTotal + daysTaken);
        });

        // Combine the user data with their calculated leave totals
        const summary = users.map(user => ({
            ...user,
            totalDaysTaken: leaveDaysMap.get(user._id.toString()) || 0,
        }));

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.error("Error in getUserLeaveSummary: ", error.message);
    }
};

//admin get all user
const alluser = async (req, res) => {
    try {
        const getuser = req.userId
        const user = await User.find({ _id: { $ne: getuser }, role: { $nin: ['admin'] } });
        if (!user) {
            return res.status(404).json({ status: false, message: 'No user found' });
        }
        res.status(200).json({ status: true, message: 'All users has been found', user })
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("Error in all user admin: ", error.message);
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



module.exports = { alluser, changestatus, arp, getemail, getUserLeaveSummary, getLeavesForUser };