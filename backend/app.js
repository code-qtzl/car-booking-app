const express = require('express');
const userRoutes = require('./router/user.router');
const carRoutes = require('./router/car.router');
const { errorHandler } = require('./middleware/auth.middleware');
const { enhancedErrorHandler } = require('./middleware/validation.middleware');
const {
	securityHeaders,
	requestSizeLimit,
	sanitizeInput,
	validateApiKey,
	securityLogger,
	corsSecurityMiddleware,
	speedLimiter,
} = require('./middleware/security.middleware');

const app = express();

// Security middleware (applied first)
app.use(securityHeaders);
app.use(securityLogger);
app.use(corsSecurityMiddleware);
app.use(speedLimiter);
app.use(sanitizeInput);
app.use(validateApiKey);
app.use(requestSizeLimit);

// Body parsing middleware with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// providing main path
app.use('/api/login', userRoutes);
app.use('/api/cars', carRoutes);

// Error handling middleware (should be last)
app.use(enhancedErrorHandler);

module.exports = app;
