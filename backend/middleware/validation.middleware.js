/**
 * Enhanced validation middleware with detailed error responses
 */

/**
 * Validation rule types and their validators
 */
const validators = {
	required: (value, message) => {
		if (value === undefined || value === null || value === '') {
			return message || 'This field is required';
		}
		if (typeof value === 'string' && value.trim() === '') {
			return message || 'This field is required';
		}
		return null;
	},

	string: (value, options = {}, message) => {
		if (
			value !== undefined &&
			value !== null &&
			typeof value !== 'string'
		) {
			return message || 'Must be a string';
		}

		if (typeof value === 'string') {
			if (options.minLength && value.length < options.minLength) {
				return (
					message ||
					`Must be at least ${options.minLength} characters long`
				);
			}
			if (options.maxLength && value.length > options.maxLength) {
				return (
					message ||
					`Must be no more than ${options.maxLength} characters long`
				);
			}
			if (options.pattern && !new RegExp(options.pattern).test(value)) {
				return message || 'Invalid format';
			}
		}

		return null;
	},

	number: (value, options = {}, message) => {
		if (value !== undefined && value !== null) {
			const numValue = Number(value);
			if (isNaN(numValue)) {
				return message || 'Must be a valid number';
			}

			if (options.min !== undefined && numValue < options.min) {
				return message || `Must be at least ${options.min}`;
			}
			if (options.max !== undefined && numValue > options.max) {
				return message || `Must be no more than ${options.max}`;
			}
			if (options.integer && !Number.isInteger(numValue)) {
				return message || 'Must be an integer';
			}
		}

		return null;
	},

	email: (value, options = {}, message) => {
		if (value !== undefined && value !== null && value !== '') {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value)) {
				return message || 'Must be a valid email address';
			}
		}
		return null;
	},

	array: (value, options = {}, message) => {
		if (value !== undefined && value !== null && !Array.isArray(value)) {
			return message || 'Must be an array';
		}

		if (Array.isArray(value)) {
			if (options.minLength && value.length < options.minLength) {
				return (
					message ||
					`Must contain at least ${options.minLength} items`
				);
			}
			if (options.maxLength && value.length > options.maxLength) {
				return (
					message ||
					`Must contain no more than ${options.maxLength} items`
				);
			}
		}

		return null;
	},

	enum: (value, options = {}, message) => {
		if (value !== undefined && value !== null && options.values) {
			if (!options.values.includes(value)) {
				return (
					message || `Must be one of: ${options.values.join(', ')}`
				);
			}
		}
		return null;
	},

	custom: (value, validator, message) => {
		if (typeof validator === 'function') {
			const result = validator(value);
			if (result !== true) {
				return message || result || 'Invalid value';
			}
		}
		return null;
	},
};

/**
 * Validate a single field against its rules
 * @param {*} value - Value to validate
 * @param {Object} rules - Validation rules
 * @param {string} fieldName - Name of the field
 * @returns {string|null} Error message or null if valid
 */
const validateField = (value, rules, fieldName) => {
	// Check required first
	if (rules.required) {
		const error = validators.required(value, rules.required.message);
		if (error) return error;
	}

	// Skip other validations if field is empty and not required
	if (value === undefined || value === null || value === '') {
		return null;
	}

	// Type validation
	if (rules.type) {
		const typeRule = rules.type;
		const validator = validators[typeRule.name || typeRule];

		if (validator) {
			const error = validator(value, typeRule.options, typeRule.message);
			if (error) return error;
		}
	}

	// Custom validation
	if (rules.custom) {
		const error = validators.custom(
			value,
			rules.custom.validator,
			rules.custom.message,
		);
		if (error) return error;
	}

	return null;
};

/**
 * Create validation middleware for request body
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => {
	return (req, res, next) => {
		const errors = {};
		const body = req.body || {};

		// Validate each field in the schema
		Object.keys(schema).forEach((fieldName) => {
			const rules = schema[fieldName];
			const value = body[fieldName];

			const error = validateField(value, rules, fieldName);
			if (error) {
				errors[fieldName] = error;
			}
		});

		// If there are validation errors, return them
		if (Object.keys(errors).length > 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: errors,
				},
			});
		}

		next();
	};
};

/**
 * Create validation middleware for query parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
	return (req, res, next) => {
		const errors = {};
		const query = req.query || {};

		// Validate each field in the schema
		Object.keys(schema).forEach((fieldName) => {
			const rules = schema[fieldName];
			const value = query[fieldName];

			const error = validateField(value, rules, fieldName);
			if (error) {
				errors[fieldName] = error;
			}
		});

		// If there are validation errors, return them
		if (Object.keys(errors).length > 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Query parameter validation failed',
					details: errors,
				},
			});
		}

		next();
	};
};

/**
 * Car validation schemas
 */
const carValidationSchemas = {
	create: {
		make: {
			required: { message: 'Make is required' },
			type: {
				name: 'string',
				options: { minLength: 1, maxLength: 50 },
				message: 'Make must be between 1 and 50 characters',
			},
		},
		model: {
			required: { message: 'Model is required' },
			type: {
				name: 'string',
				options: { minLength: 1, maxLength: 50 },
				message: 'Model must be between 1 and 50 characters',
			},
		},
		year: {
			required: { message: 'Year is required' },
			type: {
				name: 'number',
				options: {
					min: 2000,
					max: new Date().getFullYear() + 1,
					integer: true,
				},
				message: `Year must be between 2000 and ${
					new Date().getFullYear() + 1
				}`,
			},
		},
		dailyRate: {
			required: { message: 'Daily rate is required' },
			type: {
				name: 'number',
				options: { min: 0, max: 10000 },
				message: 'Daily rate must be between 0 and 10000',
			},
		},
		fuelType: {
			required: { message: 'Fuel type is required' },
			type: {
				name: 'enum',
				options: {
					values: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
				},
				message:
					'Fuel type must be one of: Gasoline, Diesel, Electric, Hybrid',
			},
		},
		transmission: {
			required: { message: 'Transmission is required' },
			type: {
				name: 'enum',
				options: { values: ['Manual', 'Automatic'] },
				message: 'Transmission must be either Manual or Automatic',
			},
		},
		seatingCapacity: {
			required: { message: 'Seating capacity is required' },
			type: {
				name: 'number',
				options: { min: 1, max: 15, integer: true },
				message: 'Seating capacity must be between 1 and 15',
			},
		},
		licensePlate: {
			required: { message: 'License plate is required' },
			type: {
				name: 'string',
				options: {
					minLength: 3,
					maxLength: 10,
					pattern: '^[A-Z0-9\\-\\s]+$',
				},
				message:
					'License plate must be 3-10 characters and contain only letters, numbers, hyphens, and spaces',
			},
		},
		availabilityStatus: {
			type: {
				name: 'enum',
				options: { values: ['Available', 'Rented', 'Maintenance'] },
				message:
					'Availability status must be one of: Available, Rented, Maintenance',
			},
		},
		description: {
			type: {
				name: 'string',
				options: { maxLength: 1000 },
				message: 'Description must be no more than 1000 characters',
			},
		},
		features: {
			type: {
				name: 'array',
				options: { maxLength: 20 },
				message: 'Features must be an array with no more than 20 items',
			},
		},
		images: {
			type: {
				name: 'array',
				options: { maxLength: 10 },
				message: 'Images must be an array with no more than 10 items',
			},
		},
	},

	update: {
		make: {
			type: {
				name: 'string',
				options: { minLength: 1, maxLength: 50 },
				message: 'Make must be between 1 and 50 characters',
			},
		},
		model: {
			type: {
				name: 'string',
				options: { minLength: 1, maxLength: 50 },
				message: 'Model must be between 1 and 50 characters',
			},
		},
		year: {
			type: {
				name: 'number',
				options: {
					min: 2000,
					max: new Date().getFullYear() + 1,
					integer: true,
				},
				message: `Year must be between 2000 and ${
					new Date().getFullYear() + 1
				}`,
			},
		},
		dailyRate: {
			type: {
				name: 'number',
				options: { min: 0, max: 10000 },
				message: 'Daily rate must be between 0 and 10000',
			},
		},
		fuelType: {
			type: {
				name: 'enum',
				options: {
					values: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
				},
				message:
					'Fuel type must be one of: Gasoline, Diesel, Electric, Hybrid',
			},
		},
		transmission: {
			type: {
				name: 'enum',
				options: { values: ['Manual', 'Automatic'] },
				message: 'Transmission must be either Manual or Automatic',
			},
		},
		seatingCapacity: {
			type: {
				name: 'number',
				options: { min: 1, max: 15, integer: true },
				message: 'Seating capacity must be between 1 and 15',
			},
		},
		licensePlate: {
			type: {
				name: 'string',
				options: {
					minLength: 3,
					maxLength: 10,
					pattern: '^[A-Z0-9\\-\\s]+$',
				},
				message:
					'License plate must be 3-10 characters and contain only letters, numbers, hyphens, and spaces',
			},
		},
		availabilityStatus: {
			type: {
				name: 'enum',
				options: { values: ['Available', 'Rented', 'Maintenance'] },
				message:
					'Availability status must be one of: Available, Rented, Maintenance',
			},
		},
		description: {
			type: {
				name: 'string',
				options: { maxLength: 1000 },
				message: 'Description must be no more than 1000 characters',
			},
		},
		features: {
			type: {
				name: 'array',
				options: { maxLength: 20 },
				message: 'Features must be an array with no more than 20 items',
			},
		},
		images: {
			type: {
				name: 'array',
				options: { maxLength: 10 },
				message: 'Images must be an array with no more than 10 items',
			},
		},
	},

	query: {
		search: {
			type: {
				name: 'string',
				options: { maxLength: 100 },
				message: 'Search term must be no more than 100 characters',
			},
		},
		priceMin: {
			type: {
				name: 'number',
				options: { min: 0 },
				message: 'Minimum price must be non-negative',
			},
		},
		priceMax: {
			type: {
				name: 'number',
				options: { min: 0 },
				message: 'Maximum price must be non-negative',
			},
		},
		fuelType: {
			type: {
				name: 'enum',
				options: {
					values: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
				},
				message:
					'Fuel type must be one of: Gasoline, Diesel, Electric, Hybrid',
			},
		},
		transmission: {
			type: {
				name: 'enum',
				options: { values: ['Manual', 'Automatic'] },
				message: 'Transmission must be either Manual or Automatic',
			},
		},
		minSeating: {
			type: {
				name: 'number',
				options: { min: 1, max: 15, integer: true },
				message: 'Minimum seating must be between 1 and 15',
			},
		},
		status: {
			type: {
				name: 'enum',
				options: { values: ['Available', 'Rented', 'Maintenance'] },
				message:
					'Status must be one of: Available, Rented, Maintenance',
			},
		},
		limit: {
			type: {
				name: 'number',
				options: { min: 1, max: 100, integer: true },
				message: 'Limit must be between 1 and 100',
			},
		},
		skip: {
			type: {
				name: 'number',
				options: { min: 0, integer: true },
				message: 'Skip must be a non-negative integer',
			},
		},
		sortBy: {
			type: {
				name: 'enum',
				options: {
					values: ['make', 'model', 'year', 'dailyRate', 'createdAt'],
				},
				message:
					'Sort by must be one of: make, model, year, dailyRate, createdAt',
			},
		},
		sortOrder: {
			type: {
				name: 'enum',
				options: { values: ['asc', 'desc'] },
				message: 'Sort order must be either asc or desc',
			},
		},
	},
};

/**
 * Enhanced error handler middleware with detailed error responses
 */
const enhancedErrorHandler = (err, req, res, next) => {
	console.error('Error occurred:', {
		message: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		body: req.body,
		query: req.query,
		params: req.params,
		timestamp: new Date().toISOString(),
	});

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
				message: 'Data validation failed',
				details: errors,
			},
		});
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		const value = err.keyValue[field];

		return res.status(409).json({
			success: false,
			error: {
				code: 'DUPLICATE_ERROR',
				message: `${field} '${value}' already exists`,
				details: {
					[field]: `This ${field} is already in use`,
				},
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
				details: {
					[err.path]: 'Invalid ID format',
				},
			},
		});
	}

	// JWT errors
	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({
			success: false,
			error: {
				code: 'INVALID_TOKEN',
				message: 'Invalid authentication token',
			},
		});
	}

	if (err.name === 'TokenExpiredError') {
		return res.status(401).json({
			success: false,
			error: {
				code: 'TOKEN_EXPIRED',
				message: 'Authentication token has expired',
			},
		});
	}

	// Multer errors (file upload)
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({
			success: false,
			error: {
				code: 'FILE_TOO_LARGE',
				message: 'File size exceeds the maximum allowed limit',
			},
		});
	}

	if (err.code === 'LIMIT_FILE_COUNT') {
		return res.status(400).json({
			success: false,
			error: {
				code: 'TOO_MANY_FILES',
				message: 'Too many files uploaded',
			},
		});
	}

	// Database connection errors
	if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
		return res.status(503).json({
			success: false,
			error: {
				code: 'DATABASE_UNAVAILABLE',
				message:
					'Database is temporarily unavailable. Please try again later.',
			},
		});
	}

	// Default error
	const statusCode = err.statusCode || err.status || 500;
	const message =
		process.env.NODE_ENV === 'production'
			? 'An unexpected error occurred'
			: err.message;

	res.status(statusCode).json({
		success: false,
		error: {
			code: 'INTERNAL_SERVER_ERROR',
			message: message,
			...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
		},
	});
};

module.exports = {
	validateBody,
	validateQuery,
	validateField,
	validators,
	carValidationSchemas,
	enhancedErrorHandler,
};
