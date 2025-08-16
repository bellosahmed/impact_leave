// backend/data/seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Import all of your models
const User = require('../user/model');
const Leave = require('../leave/model');
const Holiday = require('../holiday/model');

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB Connected for Seeding...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        // --- 1. Clear Existing Data ---
        await Leave.deleteMany();
        await Holiday.deleteMany();
        await User.deleteMany();
        console.log('Data Cleared!');

        // --- 2. Create Holidays ---
        const holidays = [
            { name: 'New Year\'s Day', date: new Date('2025-01-01') },
            { name: 'Christmas Day', date: new Date('2025-12-25') },
        ];
        await Holiday.insertMany(holidays);
        console.log('Holidays Imported...');

        // --- 3. Create Users ---
        // We define the users with plain text passwords first
        let usersToCreate = [
            { fname: 'Sade', lname: 'Admin', email: 'superadmin@example.com', phonenum: '1111111111', password: 'SuperAdminP@ss123', role: 'superadmin' },
            { fname: 'Ademola', lname: 'Manager', email: 'admin@example.com', phonenum: '2222222222', password: 'AdminP@ss123', role: 'admin' },
            { fname: 'Susan', lname: 'Visor', email: 'supervisor@example.com', phonenum: '3333333333', password: 'SupervisorP@ss123', role: 'supervisor' },
            { fname: 'Uche', lname: 'User', email: 'user1@example.com', phonenum: '4444444444', password: 'UserP@ss123', role: 'user' },
            { fname: 'Usman', lname: 'Staff', email: 'user2@example.com', phonenum: '5555555555', password: 'StaffP@ss123', role: 'user' },
        ];

        // Hash all the passwords before saving
        for (const user of usersToCreate) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            user.isVerified = true; // Pre-verify all seeded users
        }

        const createdUsers = await User.insertMany(usersToCreate);
        console.log('Users Imported...');

        // --- 4. Assign Supervisors ---
        const supervisor = createdUsers.find(u => u.role === 'supervisor');
        const user1 = createdUsers.find(u => u.email === 'user1@example.com');

        if (supervisor && user1) {
            user1.supervisor = supervisor._id;
            await user1.save();
            console.log(`${user1.fname} assigned to supervisor ${supervisor.fname}.`);
        }

        // --- 5. Create Sample Leave Requests ---
        const admin = createdUsers.find(u => u.role === 'admin');
        const user2 = createdUsers.find(u => u.email === 'user2@example.com');

        const leaves = [
            { // A pending request from a user assigned to a supervisor
                user: user1._id,
                startDate: new Date('2025-10-10'),
                endDate: new Date('2025-10-12'),
                reason: 'Family event, pending supervisor approval.',
            },
            { // A pending request from a user with no supervisor
                user: user2._id,
                startDate: new Date('2025-11-05'),
                endDate: new Date('2025-11-07'),
                reason: 'Short vacation, pending admin approval.',
            },
            { // A request from a supervisor, pending superadmin approval
                user: supervisor._id,
                startDate: new Date('2025-09-15'),
                endDate: new Date('2025-09-19'),
                reason: 'Management conference.',
            },
            { // An already approved leave
                user: user1._id,
                startDate: new Date('2025-08-01'),
                endDate: new Date('2025-08-05'),
                reason: 'Previous summer holiday.',
                status: 'approved',
                supervisorDecision: 'approved',
                actionTakenByRole: 'admin',
                adminComment: 'Approved. Have a great time!'
            },
        ];

        await Leave.insertMany(leaves);
        console.log('Sample Leaves Imported...');

        console.log('\n✅ Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error seeding database: ${error}`);
        process.exit(1);
    }
};

connectDB().then(() => {
    importData();
});