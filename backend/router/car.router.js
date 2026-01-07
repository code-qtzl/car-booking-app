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

// Public routes (optional authentication) - with enhanced caching and validation
router.get(
	'/',
	validateQuery(carValidationSchemas.query),
	optionalAuthentication,
	cacheMiddleware(600000),
	carController.getAllCars,
); // 10 minutes cache
router.get(
	'/search',
	validateQuery(carValidationSchemas.query),
	optionalAuthentication,
	cacheMiddleware(300000),
	carController.searchCars,
); // 5 minutes cache for search
router.get(
	'/images/:filename',
	cacheMiddleware(86400000), // 24 hours cache for images
	carController.serveCarImage,
);
router.get(
	'/:id',
	optionalAuthentication,
	cacheMiddleware(600000),
	carController.getCarById,
); // 10 minutes cache
router.get(
	'/availability/:status',
	optionalAuthentication,
	cacheMiddleware(300000), // 5 minutes cache for availability
	carController.getCarsByAvailability,
);

// Cache statistics endpoint (for monitoring)
router.get('/admin/cache/stats', authenticateAdmin, cacheStatsMiddleware);

// Admin-only routes (authentication and admin role required) - with enhanced cache clearing and validation
router.post(
	'/',
	authenticateAdmin,
	validateBody(carValidationSchemas.create),
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.createCar,
);
router.put(
	'/:id',
	authenticateAdmin,
	validateBody(carValidationSchemas.update),
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.updateCar,
);
router.delete(
	'/:id',
	authenticateAdmin,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.deleteCar,
);

// Image upload routes (admin only) - with enhanced cache clearing
router.post(
	'/:carId/images',
	authenticateAdmin,
	uploadMultiple,
	handleUploadError,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.uploadCarImages,
);
router.delete(
	'/:carId/images',
	authenticateAdmin,
	clearCacheMiddleware(['/api/cars'], false), // Clear only car-related cache
	carController.deleteCarImages,
);

module.exports = router;
