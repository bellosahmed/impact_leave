// backend/admin/route.js

const express = require('express');
const {
    alluser,
    getUserLeaveSummary,
    getLeavesForUser,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    getSupervisors
} = require('./controller');
const { auth, restrict } = require('../middleware/auth');
// --- Import our new validation middleware ---
const {
    handleValidationErrors,
    userCreationValidationRules,
    userUpdateValidationRules
} = require('./validators');

const router = express.Router();

// --- User Management Routes with Validation ---
router.post(
    '/users',
    auth,
    restrict('admin'),
    userCreationValidationRules(), // 1. Apply validation rules for creating a user
    handleValidationErrors,        // 2. Handle any validation errors
    createUserByAdmin              // 3. Only if validation passes, proceed to the controller
);

router.patch(
    '/users/:userId',
    auth,
    restrict('admin'),
    userUpdateValidationRules(), // 1. Apply validation rules for updating a user
    handleValidationErrors,       // 2. Handle any validation errors
    updateUserByAdmin             // 3. Only if validation passes, proceed to the controller
);

router.delete('/users/:userId', auth, restrict('admin'), deleteUserByAdmin);
router.get('/users', auth, restrict('admin'), alluser);
router.get('/supervisors', auth, restrict('admin'), getSupervisors);

// --- Other Admin Routes ---
router.get('/user-leave-summary', auth, restrict('admin'), getUserLeaveSummary);
router.get('/leaves/:userId', auth, restrict('admin'), getLeavesForUser);

module.exports = router;