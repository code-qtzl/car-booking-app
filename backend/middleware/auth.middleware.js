const User = require('../model/user.model');

/**
 * Middleware to authenticate users and extract user information
 * This is a simplified version - in production, you'd use JWT tokens
 */
const authenticateUser = async (req, res, next) => {
	try {
		// For now, we'll use a simple approach where the user ID is passed in headers
		// In production, this would validate JWT tokens
		const userId = req.headers['x-user-id'];

		if (!userId) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'AUTHENTICATION_REQUIRED',
					message: 'User authentication is required',
				},
			});
		}

		// Find the user in the database
		const user = await User.findById(userId);

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'INVALID_USER',
					message: 'Invalid user credentials',
				},
			});
		}

		// Attach user to request object
		req.user = {
			id: user._id,
			name: user.name,
			emailId: user.emailId,
			role: user.role || 'customer',
		};

		next();
	} catch (error) {
		res.status(500).json({
			success: false,
			error: {
				code: 'AUTHENTICATION_ERROR',
				message: 'Authentication failed',
			},
		});
	}
};

/**
 * Middleware to authenticate admin users
 * Requires user authentication and admin role
 */
const authenticateAdmin = async (req, res, next) => {
	try {
		// First authenticate the user
		await new Promise((resolve, reject) => {
			authenticateUser(req, res, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		// Check if user has admin role
		if (!req.user || req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				error: {
					code: 'ADMIN_ACCESS_REQUIRED',
					message: 'Admin access is required for this operation',
				},
			});
		}

		next();
	} catch (error) {
		// If authentication failed, the error response was already sent
		if (!res.headersSent) {
			res.status(500).json({
				success: false,
				error: {
					code: 'AUTHORIZATION_ERROR',
					message: 'Authorization failed',
				},
			});
		}
	}
};

/**
 * Middleware for request validation
 */
const validateRequest = (schema) => {
	return (req, res, next) => {
		const { error } = schema.validate(req.body);

		if (error) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: error.details.reduce((acc, detail) => {
						acc[detail.path.join('.')] = detail.message;
						return acc;
					}, {}),
				},
			});
		}

		next();
	};
};

/**
 * Middleware for error handling
 */
const errorHandler = (err, req, res, next) => {
	console.error('Error:', err);

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const errors = {};
		Object.keys(err.errors).forEach((key) => {
			errors[key] = err.errors[key].message;
		});

		return res.status(400).json({
			success: false,
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Validation failed',
				details: errors,
			},
		});
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		return res.status(409).json({
			success: false,
			error: {
				code: 'DUPLICATE_ERROR',
				message: `${field} already exists`,
			},
		});
	}

	// Mongoose cast error (invalid ObjectId)
	if (err.name === 'CastError') {
		return res.status(400).json({
			success: false,
			error: {
				code: 'INVALID_ID',
				message: 'Invalid ID format',
			},
		});
	}

	// Default error
	res.status(500).json({
		success: false,
		error: {
			code: 'INTERNAL_SERVER_ERROR',
			message: 'An unexpected error occurred',
		},
	});
};

module.exports = {
	authenticateUser,
	authenticateAdmin,
	validateRequest,
	errorHandler,
};
