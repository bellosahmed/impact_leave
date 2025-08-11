const cron = require("node-cron");
const User = require("../user/model");

const resetLeaveBalance = () => {
    cron.schedule("0 0 1 1 *", async () => {
        try {
            await User.updateMany({}, { leaveBalance: 30 });
            console.log("✅ Leave balances reset to 30 for all users");
        } catch (err) {
            console.error("❌ Error resetting leave balances:", err.message);
        }
    });
};

module.exports = resetLeaveBalance;


// NB: admin should be able to add public holiday

