const express = require('express');
const router = express.Router();
const carController = require('../controller/car.controller');
const {
	authenticateAdmin,
	authenticateUser,
} = require('../middleware/auth.middleware');
const {
	uploadMultiple,
	handleUploadError,
} = require('../middleware/upload.middleware');

// Public routes (no authentication required)
router.get('/', carController.getAllCars);
router.get('/search', carController.searchCars);
router.get('/images/:filename', carController.serveCarImage);
router.get('/:id', carController.getCarById);

// Admin-only routes (authentication and admin role required)
router.post('/', authenticateAdmin, carController.createCar);
router.put('/:id', authenticateAdmin, carController.updateCar);
router.delete('/:id', authenticateAdmin, carController.deleteCar);

// Image upload routes (admin only)
router.post(
	'/:carId/images',
	authenticateAdmin,
	uploadMultiple,
	handleUploadError,
	carController.uploadCarImages,
);
router.delete(
	'/:carId/images',
	authenticateAdmin,
	carController.deleteCarImages,
);

// Additional utility routes
router.get('/availability/:status', carController.getCarsByAvailability);

module.exports = router;
