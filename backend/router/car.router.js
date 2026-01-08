const express = require('express');
const router = express.Router();
const carController = require('../controller/car.controller');
const {
	authenticateAdmin,
	authenticateUser,
	optionalAuthentication,
} = require('../middleware/auth.middleware');
const {
	validateBody,
	validateQuery,
	carValidationSchemas,
} = require('../middleware/validation.middleware');
const {
	uploadMultiple,
	handleUploadError,
} = require('../middleware/upload.middleware');
const {
	cacheMiddleware,
	clearCacheMiddleware,
	cacheStatsMiddleware,
} = require('../middleware/cache.middleware');
const {
	publicRateLimit,
	adminRateLimit,
	searchRateLimit,
	uploadRateLimit,
} = require('../middleware/security.middleware');

// Public routes (optional authentication) - with enhanced caching, validation, and rate limiting
router.get(
	'/',
	publicRateLimit,
	validateQuery(carValidationSchemas.query),
	optionalAuthentication,
	cacheMiddleware(600000),
	carController.getAllCars,
); // 10 minutes cache
router.get(
	'/search',
	searchRateLimit,
	validateQuery(carValidationSchemas.query),
	optionalAuthentication,
	cacheMiddleware(300000),
	carController.searchCars,
); // 5 minutes cache for search
router.get(
	'/images/:filename',
	publicRateLimit,
	cacheMiddleware(86400000), // 24 hours cache for images
	carController.serveCarImage,
);
router.get(
	'/:id',
	publicRateLimit,
	optionalAuthentication,
	cacheMiddleware(600000),
	carController.getCarById,
); // 10 minutes cache
router.get(
	'/availability/:status',
	publicRateLimit,
	optionalAuthentication,
	cacheMiddleware(300000), // 5 minutes cache for availability
	carController.getCarsByAvailability,
);

// Cache statistics endpoint (for monitoring)
router.get(
	'/admin/cache/stats',
	adminRateLimit,
	authenticateAdmin,
	cacheStatsMiddleware,
);

// Admin-only routes (authentication and admin role required) - with enhanced cache clearing, validation, and rate limiting
router.post(
	'/',
	adminRateLimit,
	authenticateAdmin,
	validateBody(carValidationSchemas.create),
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.createCar,
);
router.put(
	'/:id',
	adminRateLimit,
	authenticateAdmin,
	validateBody(carValidationSchemas.update),
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.updateCar,
);
router.delete(
	'/:id',
	adminRateLimit,
	authenticateAdmin,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.deleteCar,
);

// Image upload routes (admin only) - with enhanced cache clearing and rate limiting
router.post(
	'/:carId/images',
	uploadRateLimit,
	authenticateAdmin,
	uploadMultiple,
	handleUploadError,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.uploadCarImages,
);
router.delete(
	'/:carId/images',
	adminRateLimit,
	authenticateAdmin,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.deleteCarImages,
);

module.exports = router;
