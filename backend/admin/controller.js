const User = require('../user/model');
const { createSendtoken } = require('../middleware/auth')

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



module.exports = { alluser, changestatus, arp, getemail };