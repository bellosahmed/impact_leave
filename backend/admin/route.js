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
const {
    handleValidationErrors,
    userCreationValidationRules,
    userUpdateValidationRules
} = require('./validators');

const router = express.Router();

// --- THESE ROUTES REMAIN ACCESSIBLE TO ADMINS ---
router.get('/user-leave-summary', auth, restrict('admin'), getUserLeaveSummary);
router.get('/leaves/:userId', auth, restrict('admin'), getLeavesForUser);
router.get('/supervisors', auth, restrict('admin'), getSupervisors);
router.get('/users', auth, restrict('admin'), alluser); // Admins can still VIEW the user list

// --- THESE ROUTES ARE NOW SUPERADMIN-ONLY ---
// Only a superadmin can create, update, or delete users.
router.post(
    '/users',
    auth,
    restrict('superadmin'), // <-- CHANGED
    userCreationValidationRules(),
    handleValidationErrors,
    createUserByAdmin
);

router.patch(
    '/users/:userId',
    auth,
    restrict('superadmin'), // <-- CHANGED
    userUpdateValidationRules(),
    handleValidationErrors,
    updateUserByAdmin
);

router.delete('/users/:userId', auth, restrict('superadmin'), deleteUserByAdmin); // <-- CHANGED

module.exports = router;