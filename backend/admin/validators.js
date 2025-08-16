// backend/admin/validators.js
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const userCreationValidationRules = () => {
    return [
        // --- XSS PROTECTION: Sanitize string inputs ---
        body('fname').trim().notEmpty().withMessage('First name is required.').escape(),
        body('lname').trim().notEmpty().withMessage('Last name is required.').escape(),

        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email.'),
        body('phonenum').isMobilePhone().withMessage('Please provide a valid phone number.'),
        body('role').isIn(['user', 'supervisor', 'admin', 'superadmin']).withMessage('Invalid role specified.'),
    ];
};

const userUpdateValidationRules = () => {
    return [
        body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty.').escape(),
        body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty.').escape(),
        body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email.'),
        body('phonenum').optional().isMobilePhone().withMessage('Please provide a valid phone number.'),
        body('role').optional().isIn(['user', 'supervisor', 'admin', 'superadmin']).withMessage('Invalid role specified.'),
        body('leaveBalance').optional().isNumeric().withMessage('Leave balance must be a number.'),
    ];
};

// --- NEW: Password validation for the public-facing forms ---
const passwordResetValidationRules = () => {
    return [
        body('password')
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
    ];
};

module.exports = {
    handleValidationErrors,
    userCreationValidationRules,
    userUpdateValidationRules,
    passwordResetValidationRules // <-- Export the new rules
};