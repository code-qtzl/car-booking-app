const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/signup', userController.signup);
router.post('/signin', userController.signin);

// Protected routes that require authentication
router.get(
	'/validate-session',
	authenticateUser,
	userController.validateSession,
);
router.get('/profile', authenticateUser, userController.getProfile);

module.exports = router;
