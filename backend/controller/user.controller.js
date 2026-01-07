const userService = require('../service/user.service');

const signup = async (req, res) => {
	try {
		const user = await userService.signup(req.body);
		res.status(201).json({
			message: 'Signup successful',
			user,
		});
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

const signin = async (req, res) => {
	try {
		const { emailId, password } = req.body;
		const user = await userService.signin(emailId, password);
		res.json({
			message: 'Signin successful',
			user,
		});
	} catch (error) {
		res.status(401).json({ error: error.message });
	}
};

/**
 * Validate user session and return user info
 * Used by frontend to verify authentication status
 */
const validateSession = async (req, res) => {
	try {
		// User info is already attached by authenticateUser middleware
		const user = req.user;

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'INVALID_SESSION',
					message: 'Session is invalid or expired',
				},
			});
		}

		res.json({
			success: true,
			message: 'Session is valid',
			user: {
				id: user.id,
				emailId: user.emailId,
				role: user.role,
				typeOfUser: user.typeOfUser,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: {
				code: 'SESSION_VALIDATION_ERROR',
				message: 'Failed to validate session',
			},
		});
	}
};

/**
 * Get current user profile information
 */
const getProfile = async (req, res) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'AUTHENTICATION_REQUIRED',
					message: 'Authentication is required',
				},
			});
		}

		// Get full user details from database
		const fullUser = await userService.getUserById(user.id);

		res.json({
			success: true,
			data: {
				id: fullUser._id,
				emailId: fullUser.emailId,
				role: fullUser.typeOfUser === 'ADMIN' ? 'admin' : 'customer',
				typeOfUser: fullUser.typeOfUser,
				createdAt: fullUser.createdAt,
				updatedAt: fullUser.updatedAt,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: {
				code: 'PROFILE_FETCH_ERROR',
				message: 'Failed to fetch user profile',
			},
		});
	}
};

module.exports = {
	signup,
	signin,
	validateSession,
	getProfile,
};
