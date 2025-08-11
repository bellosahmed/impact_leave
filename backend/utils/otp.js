function generateOtp() {
    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number
    return Math.floor(min + Math.random() * (max - min + 1));
};

module.exports = { generateOtp };