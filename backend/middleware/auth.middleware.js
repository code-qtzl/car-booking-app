const User = require('../model/user.model');

/**
 * Middleware to authenticate users and extract user information
 * Enhanced version with better session management and user lookup
 */
const authenticateUser = async (req, res, next) => {
	try {
		// Get user identifier from headers (email in this case)
		const userEmail = req.headers['x-user-id'];

		if (!userEmail) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'AUTHENTICATION_REQUIRED',
					message: 'User authentication is required',
				},
			});
		}

		// Find the user by email (since we're using email as the identifier)
		const user = await User.findOne({ emailId: userEmail });

		if (!user) {
			return res.status(401).json({
				success: false,
				error: {
					code: 'INVALID_USER',
					message: 'Invalid user credentials',
				},
			});
		}

		// Attach user to request object with proper role mapping
		req.user = {
			id: user._id,
			emailId: user.emailId,
			role: user.typeOfUser === 'ADMIN' ? 'admin' : 'customer',
			typeOfUser: user.typeOfUser,
		};

		next();
	} catch (error) {
		console.error('Authentication error:', error);
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

/**
 * Middleware for optional authentication
 * Allows both authenticated and unauthenticated access
 * If user is authenticated, adds user info to request
 */
const optionalAuthentication = async (req, res, next) => {
	try {
		const userEmail = req.headers['x-user-id'];

		if (!userEmail) {
			// No authentication provided, continue without user info
			req.user = null;
			return next();
		}

		// Try to authenticate the user
		const user = await User.findOne({ emailId: userEmail });

		if (user) {
			// User found, attach to request
			req.user = {
				id: user._id,
				emailId: user.emailId,
				role: user.typeOfUser === 'ADMIN' ? 'admin' : 'customer',
				typeOfUser: user.typeOfUser,
			};
		} else {
			// Invalid user, but don't fail the request
			req.user = null;
		}

		next();
	} catch (error) {
		console.error('Optional authentication error:', error);
		// Don't fail the request for optional auth errors
		req.user = null;
		next();
	}
};

module.exports = {
	authenticateUser,
	authenticateAdmin,
	optionalAuthentication,
	validateRequest,
	errorHandler,
};
