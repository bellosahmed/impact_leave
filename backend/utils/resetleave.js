// backend/utils/resetleave.js
const cron = require("node-cron");
const User = require("../user/model");

const CARRY_OVER_LIMIT = 5; // The maximum number of days a user can carry over
const ANNUAL_LEAVE_ALLOCATION = 30; // The standard number of new leave days per year

const resetLeaveBalance = () => {
    // This cron job is scheduled to run at midnight on January 1st of every year.
    // Format: "minute hour day-of-month month day-of-week"
    cron.schedule("0 0 1 1 *", async () => {
        try {
            console.log("🗓️  Running annual leave balance reset task...");

            // Find all users (excluding superadmins, who may have unlimited leave)
            const users = await User.find({ role: { $in: ['user', 'admin'] } });

            if (users.length === 0) {
                console.log("No users found to update. Task complete.");
                return;
            }

            // Create an array of update operations to perform in bulk
            const bulkOps = users.map(user => {
                // Determine the number of days to carry over
                const carryOverDays = Math.min(user.leaveBalance, CARRY_OVER_LIMIT);

                // Calculate the new balance for the upcoming year
                const newBalance = ANNUAL_LEAVE_ALLOCATION + carryOverDays;

                console.log(`- Updating ${user.email}: Carrying over ${carryOverDays} days. New balance will be ${newBalance}.`);

                return {
                    updateOne: {
                        filter: { _id: user._id },
                        update: { $set: { leaveBalance: newBalance } }
                    }
                };
            });

            // Execute all the updates in a single, efficient database call
            const result = await User.bulkWrite(bulkOps);

            console.log(`✅ Leave balances reset successfully. ${result.modifiedCount} users updated.`);
        } catch (err) {
            console.error("❌ Error resetting leave balances:", err.message);
        }
    });
};

module.exports = resetLeaveBalance;