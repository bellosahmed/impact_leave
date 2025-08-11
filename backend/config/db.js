// Import of npm packages
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// This is to access .env file
dotenv.config();

//Connection of the Database
const db = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`Mongo is connected: ${con.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// This is to export the file
module.exports = db;