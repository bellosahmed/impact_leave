const User = require('../user/model');
const { Verify, Resettoken } = require('./model');
const { createSendtoken } = require('../middleware/auth');
const { createTransporter, createMailOptions } = require('../utils/email');
const { generateOtp } = require('../utils/otp');

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();
const { isValidObjectId } = require('mongoose');

//Signup User
const signup = async (req, res) => {
    const { fname, lname, email, password, age, phonenum, dob } = req.body;
    try {
        const user = await User.findOne({ $or: [{ email }] });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            fname,
            lname,
            email: email.toLowerCase(),
            password,
            phonenum,
            age,
            dob
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        const token = createSendtoken(newUser, res);

        const otp = generateOtp();
        const verify = new Verify({
            owner: newUser._id,
            token: otp,
        });

        const transporter = createTransporter();

        const textMessage = `Click the following link to verify your account: ${otp}`;
        const htmlMessage = `<p>Insert the OTP code to verify your account:</p><p>${otp}</p>`;

        const mailOptions = createMailOptions(
            newUser.email,
            'Verify Account',
            textMessage,
            htmlMessage
        );

        await transporter.send(mailOptions);
        await verify.save();
        await newUser.save();

        res.status(201).json({
            newUser,
            token,
            status: true,
        });
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ message: error.message });
    }
};

// Verify Account
const verify = async (req, res) => {
    try {
        const { userId, otp } = req.body; // details to get

        // Check for missing or empty userId and otp
        if (!userId || !otp.trim()) {
            return res.status(400).json({ msg: 'Invalid request', status: false });
        }

        // Check if userId is a valid ObjectId
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ msg: 'Invalid Id', status: false });
        }
        const user = await User.findById(userId); // find by user by id
        if (!user) {
            return res.status(404).json({ msg: 'No user found', status: false });
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return res.status(400).json({ msg: 'Account is already verified', status: true });
        }

        // Find the verification token for the user
        const token = await Verify.findOne({
            owner: user._id,
        });

        if (!token) { // if token does not exist
            return res.status(400).json({ msg: 'No verification token found', status: false });
        }

        user.isVerified = true; // will change this to be from false to true
        await Verify.findByIdAndDelete(token._id); // delete the token
        await user.save(); // save the user

        const transporter = createTransporter();

        const textMessage = `Mail has been verified`; // message to be sent 
        const htmlMessage = `<p> Check your mail to access your account</p>`; // message to be sent 

        const mailOptions = createMailOptions( // details to be passed
            user.email,
            'Verify account',
            textMessage,
            htmlMessage
        );

        await transporter.send(mailOptions); // send the mails

        return res.status(200).json({
            success: true,
            msg: 'Account has been verified'
        });

    } catch (error) {
        // if there is error
        console.error('Error in signup:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        console.log("\n--- New Login Attempt ---");
        const { email, password } = req.body;
        console.log("1. Received credentials for email:", email);

        if (!(email && password)) {
            console.log("-> FAIL: Email or password missing from request.");
            return res.status(400).json({ msg: "All input is required", status: false });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log("-> FAIL: User not found in database.");
            return res.status(400).json({ msg: 'Email or Password maybe incorrect', status: false });
        };

        console.log("2. User found in database. User ID:", user._id);
        console.log("   - Is user verified?", user.isVerified);

        if (!user.isVerified) {
            console.log("-> FAIL: User is not verified. Sending new OTP.");
            // Your logic for re-sending OTP is correct.
            const otp = generateOtp();
            const verify = new Verify({ owner: user._id, token: otp });
            await verify.save();
            // ... (email sending logic)
            return res.status(401).json({ msg: 'Please verify your account. A new OTP has been sent.', status: false });
        };

        console.log("3. Comparing provided password with stored hash...");
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log("-> FAIL: Password comparison failed. Passwords do not match.");
            return res.status(401).json({ msg: 'Invalid Credentials', status: false });
        };

        console.log("4. SUCCESS: Passwords match. Creating token.");
        const token = createSendtoken(user, res);

        const safeUser = {
            _id: user._id,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            role: user.role,
            leaveBalance: user.leaveBalance,
        };

        console.log("5. Login successful. Sending token and user data to client.");
        res.status(200).json({ token, user: safeUser, status: true });

    } catch (error) {
        console.error("!!! CRASH in login controller !!!", error);
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password
const forgotpass = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ msg: 'Provide a valid email', status: false });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'User not found', status: false });
        }

        const token = await Resettoken.findOne({ owner: user._id });

        if (token) {
            return res.json({ msg: 'Your forgot password email has been sent', status: true });
        }

        const otp = await generateOtp();
        const reset = new Resettoken({
            owner: user._id,
            token: otp
        });

        const transporter = createTransporter();
        const textMessage = `This is the link to your forgot password ${otp}`;
        const htmlMessage = `<p>Use the link to access your password</p> ${otp}`;

        const mailOptions = createMailOptions(
            user.email,
            'Forgot Password',
            textMessage,
            htmlMessage
        );

        await transporter.send(mailOptions);
        await reset.save();

        res.status(200).json({ msg: 'Check your email for the reset pin', status: true });

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("Error in Forgot Password: ", error.message);
    }
};

// Reset Password
const resetpass = async (req, res) => {
    try {
        // 1. We now expect email, otp, and password from the body.
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ msg: 'Invalid request. Please provide email, otp, and password', status: false });
        }

        // 2. Find the user by their email address first.
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'User with this email not found.', status: false });
        }

        // 3. Now that we have the user, we can find their reset token.
        const storedToken = await Resettoken.findOne({ owner: user._id, token: otp });
        if (!storedToken) {
            return res.status(400).json({ msg: 'Invalid or expired OTP.', status: false });
        }

        // 4. All checks passed. Hash the new password and save the user.
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // 5. Delete the used OTP so it cannot be used again.
        await Resettoken.deleteOne({ _id: storedToken._id });

        // 6. Send a confirmation email.
        const transporter = createTransporter();
        const textMessage = `Password has been changed successfully.`;
        const htmlMessage = `<p>Your password has been changed. You can now login with your new password.</p>`;
        const mailOptions = createMailOptions(user.email, 'Password Changed', textMessage, htmlMessage);
        await transporter.send(mailOptions);

        res.status(200).json({ msg: 'Password changed successfully', status: true });

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("Error in Reset Password: ", error.message);
    }
};

// Logout
const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 1 });  // Clears JWT cookie
        res.status(200).json({ message: 'User logged out' });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("Error in Logout: ", error.message);
    }
};

// Passport 

// to export files
module.exports = { signup, login, logout, verify, forgotpass, resetpass };