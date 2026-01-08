/**
 * Security middleware for API protection
 * Implements rate limiting, security headers, and request validation
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

/**
 * General rate limiting for public endpoints
 */
const publicRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: {
		success: false,
		error: {
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many requests from this IP, please try again later.',
		},
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
	handler: (req, res) => {
		res.status(429).json({
			success: false,
			error: {
				code: 'RATE_LIMIT_EXCEEDED',
				message:
					'Too many requests from this IP, please try again later.',
				retryAfter: Math.round(req.rateLimit.resetTime / 1000),
			},
		});
	},
});

/**
 * Stricter rate limiting for admin endpoints
 */
const adminRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 200, // Higher limit for admin users
	message: {
		success: false,
		error: {
			code: 'ADMIN_RATE_LIMIT_EXCEEDED',
			message: 'Too many admin requests, please try again later.',
		},
	},
	// Remove custom keyGenerator to avoid IPv6 warnings
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
	handler: (req, res) => {
		res.status(429).json({
			success: false,
			error: {
				code: 'ADMIN_RATE_LIMIT_EXCEEDED',
				message: 'Too many admin requests, please try again later.',
				retryAfter: Math.round(req.rateLimit.resetTime / 1000),
			},
		});
	},
});

/**
 * Rate limiting for search endpoints
 */
const searchRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // Lower limit for search to prevent abuse
	message: {
		success: false,
		error: {
			code: 'SEARCH_RATE_LIMIT_EXCEEDED',
			message: 'Too many search requests, please try again later.',
		},
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
});

/**
 * Rate limiting for image upload endpoints
 */
const uploadRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limited uploads per window
	message: {
		success: false,
		error: {
			code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
			message: 'Too many upload requests, please try again later.',
		},
	},
	// Remove custom keyGenerator to avoid IPv6 warnings
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
});

/**
 * Slow down middleware for repeated requests
 */
const speedLimiter = slowDown({
	windowMs: 15 * 60 * 1000, // 15 minutes
	delayAfter: 50, // Allow 50 requests per windowMs without delay
	delayMs: () => 500, // Add 500ms delay per request after delayAfter
	maxDelayMs: 20000, // Maximum delay of 20 seconds
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
});

/**
 * Security headers middleware using Helmet
 */
const securityHeaders = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", 'data:', 'blob:'],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
		},
	},
	crossOriginEmbedderPolicy: false, // Disable for file uploads
	hsts: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: true,
	},
});

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (req, res, next) => {
	// Set different limits based on endpoint
	const isUpload = req.path.includes('/images');
	const maxSize = isUpload ? '50mb' : '1mb';

	// This is handled by express.json() with limit option
	// Just add headers for documentation
	res.set('X-Content-Length-Limit', maxSize);
	next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
	// Sanitize query parameters
	if (req.query) {
		Object.keys(req.query).forEach((key) => {
			if (typeof req.query[key] === 'string') {
				// Remove potentially dangerous characters
				req.query[key] = req.query[key]
					.replace(
						/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
						'',
					)
					.replace(/javascript:/gi, '')
					.replace(/on\w+\s*=/gi, '');
			}
		});
	}

	// Sanitize request body
	if (req.body && typeof req.body === 'object') {
		const sanitizeObject = (obj) => {
			Object.keys(obj).forEach((key) => {
				if (typeof obj[key] === 'string') {
					obj[key] = obj[key]
						.replace(
							/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
							'',
						)
						.replace(/javascript:/gi, '')
						.replace(/on\w+\s*=/gi, '');
				} else if (typeof obj[key] === 'object' && obj[key] !== null) {
					sanitizeObject(obj[key]);
				}
			});
		};
		sanitizeObject(req.body);
	}

	next();
};

/**
 * API key validation middleware (for future use)
 */
const validateApiKey = (req, res, next) => {
	const apiKey = req.headers['x-api-key'];

	// For now, just log API key usage
	if (apiKey) {
		console.log(`API Key used: ${apiKey.substring(0, 8)}...`);
	}

	// Future: Validate against database of API keys
	next();
};

/**
 * Request logging middleware for security monitoring
 */
const securityLogger = (req, res, next) => {
	const startTime = Date.now();

	// Log suspicious patterns
	const suspiciousPatterns = [
		/\.\.\//g, // Directory traversal
		/<script/gi, // XSS attempts
		/union\s+select/gi, // SQL injection
		/drop\s+table/gi, // SQL injection
		/exec\s*\(/gi, // Code injection
	];

	const requestData = JSON.stringify({
		query: req.query,
		body: req.body,
		params: req.params,
	});

	const isSuspicious = suspiciousPatterns.some(
		(pattern) => pattern.test(requestData) || pattern.test(req.url),
	);

	if (isSuspicious) {
		console.warn(`[SECURITY] Suspicious request detected:`, {
			ip: req.ip,
			method: req.method,
			url: req.url,
			userAgent: req.headers['user-agent'],
			timestamp: new Date().toISOString(),
		});
	}

	// Log response time for monitoring
	res.on('finish', () => {
		const duration = Date.now() - startTime;
		if (duration > 5000) {
			// Log slow requests
			console.warn(`[PERFORMANCE] Slow request detected: ${duration}ms`, {
				method: req.method,
				url: req.url,
				ip: req.ip,
			});
		}
	});

	next();
};

/**
 * CORS security middleware with enhanced configuration
 */
const corsSecurityMiddleware = (req, res, next) => {
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:5173',
		// Add production domains here
	];

	const origin = req.headers.origin;

	// Allow requests without origin (mobile apps, Postman, etc.)
	if (!origin || allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
	}

	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS',
	);
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id, X-API-Key, Cache-Control',
	);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Max-Age', '86400'); // 24 hours

	// Handle preflight requests
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
};

module.exports = {
	publicRateLimit,
	adminRateLimit,
	searchRateLimit,
	uploadRateLimit,
	speedLimiter,
	securityHeaders,
	requestSizeLimit,
	sanitizeInput,
	validateApiKey,
	securityLogger,
	corsSecurityMiddleware,
};
