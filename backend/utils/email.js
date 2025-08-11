const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// This no longer returns a transporter — it just re-exports sgMail
const createTransporter = () => sgMail;

const createMailOptions = (to, subject, text, html = '') => {
    return {
        to,
        from: process.env.authemail, // Must be verified in SendGrid
        subject,
        text,
        html,
    };
};

module.exports = {
    createTransporter,
    createMailOptions,
};
