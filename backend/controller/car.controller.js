const carService = require('../service/car.service');
const imageService = require('../service/image.service');
const {
	validateBody,
	validateQuery,
	carValidationSchemas,
} = require('../middleware/validation.middleware');
const path = require('path');

/**
 * Get all cars with optional filtering and pagination
 */
const getAllCars = async (req, res) => {
	try {
		const filters = {
			searchQuery: req.query.search,
			priceMin: req.query.priceMin,
			priceMax: req.query.priceMax,
			fuelType: req.query.fuelType,
			transmission: req.query.transmission,
			minSeating: req.query.minSeating,
			availabilityStatus: req.query.status,
			make: req.query.make,
			model: req.query.model,
			year: req.query.year,
		};

		const options = {
			limit: parseInt(req.query.limit) || 12,
			skip: parseInt(req.query.skip) || 0,
			sortBy: req.query.sortBy,
			sortOrder: req.query.sortOrder,
		};

		// Remove undefined values from filters and options
		Object.keys(filters).forEach((key) => {
			if (filters[key] === undefined) {
				delete filters[key];
			}
		});

		Object.keys(options).forEach((key) => {
			if (options[key] === undefined) {
				delete options[key];
			}
		});

		const result = await carService.findCars(filters, options);

		// Set enhanced cache headers for performance optimization
		res.set({
			'Cache-Control': 'public, max-age=600, s-maxage=1200', // 10 min client, 20 min CDN
			ETag: `"cars-${JSON.stringify(filters)}-${JSON.stringify(
				options,
			)}"`,
			'Last-Modified': new Date().toUTCString(),
			Vary: 'Accept-Encoding',
		});

		res.json({
			success: true,
			data: result.cars,
			pagination: {
				totalCount: result.totalCount,
				currentPage: result.page,
				totalPages: Math.ceil(result.totalCount / options.limit),
				limit: result.limit,
				hasMore: result.hasMore,
				hasPrevious: result.page > 1,
			},
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			error: {
				code: 'FETCH_CARS_ERROR',
				message: error.message,
			},
		});
	}
};

/**
 * Get a specific car by ID
 */
const getCarById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_ID',
					message: 'Car ID is required',
				},
			});
		}

		const car = await carService.findCarById(id);

		res.json({
			success: true,
			data: car,
		});
	} catch (error) {
		const statusCode = error.message.includes('not found') ? 404 : 400;

		res.status(statusCode).json({
			success: false,
			error: {
				code: statusCode === 404 ? 'CAR_NOT_FOUND' : 'FETCH_CAR_ERROR',
				message: error.message,
			},
		});
	}
};

/**
 * Create a new car (Admin only)
 */
const createCar = async (req, res) => {
	try {
		const carData = req.body;
		const adminUserId = req.user.id; // Set by authentication middleware

		if (!carData || Object.keys(carData).length === 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_DATA',
					message: 'Car data is required',
				},
			});
		}

		const car = await carService.createCar(carData, adminUserId);

		res.status(201).json({
			success: true,
			message: 'Car created successfully',
			data: car,
		});
	} catch (error) {
		let statusCode = 400;
		let errorCode = 'CREATE_CAR_ERROR';

		// Handle validation errors
		if (
			error.message.includes('validation failed') ||
			error.message.includes('required')
		) {
			statusCode = 400;
			errorCode = 'VALIDATION_ERROR';
		}

		// Handle duplicate key errors (e.g., license plate)
		if (
			error.message.includes('duplicate') ||
			error.message.includes('E11000')
		) {
			statusCode = 409;
			errorCode = 'DUPLICATE_ERROR';
		}

		res.status(statusCode).json({
			success: false,
			error: {
				code: errorCode,
				message: error.message,
			},
		});
	}
};

/**
 * Update an existing car (Admin only)
 */
const updateCar = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;
		const adminUserId = req.user.id; // Set by authentication middleware

		if (!id) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_ID',
					message: 'Car ID is required',
				},
			});
		}

		if (!updateData || Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_UPDATE_DATA',
					message: 'Update data is required',
				},
			});
		}

		const car = await carService.updateCar(id, updateData, adminUserId);

		res.json({
			success: true,
			message: 'Car updated successfully',
			data: car,
		});
	} catch (error) {
		let statusCode = 400;
		let errorCode = 'UPDATE_CAR_ERROR';

		if (error.message.includes('not found')) {
			statusCode = 404;
			errorCode = 'CAR_NOT_FOUND';
		} else if (
			error.message.includes('validation failed') ||
			error.message.includes('required')
		) {
			statusCode = 400;
			errorCode = 'VALIDATION_ERROR';
		} else if (
			error.message.includes('duplicate') ||
			error.message.includes('E11000')
		) {
			statusCode = 409;
			errorCode = 'DUPLICATE_ERROR';
		}

		res.status(statusCode).json({
			success: false,
			error: {
				code: errorCode,
				message: error.message,
			},
		});
	}
};

/**
 * Delete a car (soft delete - Admin only)
 */
const deleteCar = async (req, res) => {
	try {
		const { id } = req.params;
		const adminUserId = req.user.id; // Set by authentication middleware

		if (!id) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_ID',
					message: 'Car ID is required',
				},
			});
		}

		const car = await carService.removeCar(id, adminUserId);

		res.json({
			success: true,
			message: 'Car removed successfully',
			data: car,
		});
	} catch (error) {
		let statusCode = 400;
		let errorCode = 'DELETE_CAR_ERROR';

		if (error.message.includes('not found')) {
			statusCode = 404;
			errorCode = 'CAR_NOT_FOUND';
		} else if (error.message.includes('currently rented')) {
			statusCode = 409;
			errorCode = 'CAR_IN_USE';
		}

		res.status(statusCode).json({
			success: false,
			error: {
				code: errorCode,
				message: error.message,
			},
		});
	}
};

/**
 * Search cars with text search
 */
const searchCars = async (req, res) => {
	try {
		const searchTerm = req.query.q || req.query.search;

		if (!searchTerm) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_SEARCH_TERM',
					message: 'Search term is required',
				},
			});
		}

		const filters = {
			priceMin: req.query.priceMin,
			priceMax: req.query.priceMax,
			fuelType: req.query.fuelType,
			transmission: req.query.transmission,
			minSeating: req.query.minSeating,
			availabilityStatus: req.query.status,
		};

		const options = {
			limit: req.query.limit,
			skip: req.query.skip,
			sortBy: req.query.sortBy || 'relevance',
			sortOrder: req.query.sortOrder,
		};

		// Remove undefined values
		Object.keys(filters).forEach((key) => {
			if (filters[key] === undefined) {
				delete filters[key];
			}
		});

		Object.keys(options).forEach((key) => {
			if (options[key] === undefined) {
				delete options[key];
			}
		});

		const result = await carService.searchCars(
			searchTerm,
			filters,
			options,
		);

		res.json({
			success: true,
			data: result.cars,
			searchTerm: result.searchTerm,
			pagination: {
				totalCount: result.totalCount,
				page: result.page,
				limit: result.limit,
				hasMore: result.hasMore,
			},
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			error: {
				code: 'SEARCH_CARS_ERROR',
				message: error.message,
			},
		});
	}
};

/**
 * Get cars by availability status
 */
const getCarsByAvailability = async (req, res) => {
	try {
		const { status } = req.params;

		if (!status) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_STATUS',
					message: 'Availability status is required',
				},
			});
		}

		const cars = await carService.getCarsByAvailability(status);

		res.json({
			success: true,
			data: cars,
			count: cars.length,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			error: {
				code: 'FETCH_CARS_BY_STATUS_ERROR',
				message: error.message,
			},
		});
	}
};

/**
 * Upload images for a car
 */
const uploadCarImages = async (req, res) => {
	try {
		const { carId } = req.params;
		const files = req.files;

		if (!carId) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_ID',
					message: 'Car ID is required',
				},
			});
		}

		if (!files || files.length === 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'NO_FILES_UPLOADED',
					message: 'No image files were uploaded',
				},
			});
		}

		// Process uploaded files
		const imageData = imageService.processUploadedFiles(files);

		// Update car with new image URLs
		const car = await carService.addCarImages(carId, imageData.urls);

		res.json({
			success: true,
			message: 'Images uploaded successfully',
			data: {
				car: car,
				uploadedImages: {
					count: imageData.count,
					urls: imageData.urls,
				},
			},
		});
	} catch (error) {
		// Clean up uploaded files if car update fails
		if (req.files) {
			const filenames = req.files.map((file) => file.filename);
			imageService.deleteImages(filenames);
		}

		let statusCode = 400;
		let errorCode = 'UPLOAD_ERROR';

		if (error.message.includes('not found')) {
			statusCode = 404;
			errorCode = 'CAR_NOT_FOUND';
		}

		res.status(statusCode).json({
			success: false,
			error: {
				code: errorCode,
				message: error.message,
			},
		});
	}
};

/**
 * Serve car images
 */
const serveCarImage = async (req, res) => {
	try {
		const { filename } = req.params;

		if (!filename) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_FILENAME',
					message: 'Image filename is required',
				},
			});
		}

		// Validate image exists
		const validation = await imageService.validateImage(filename);

		if (!validation.valid) {
			return res.status(404).json({
				success: false,
				error: {
					code: 'IMAGE_NOT_FOUND',
					message: validation.error,
				},
			});
		}

		// Serve the image file
		const imagePath = imageService.getImagePath(filename);

		// Set appropriate content type based on file extension
		const ext = path.extname(filename).toLowerCase();
		const contentTypes = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp',
		};

		const contentType = contentTypes[ext] || 'image/jpeg';
		res.setHeader('Content-Type', contentType);
		res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

		res.sendFile(imagePath);
	} catch (error) {
		res.status(500).json({
			success: false,
			error: {
				code: 'SERVE_IMAGE_ERROR',
				message: 'Failed to serve image',
			},
		});
	}
};

/**
 * Delete car images
 */
const deleteCarImages = async (req, res) => {
	try {
		const { carId } = req.params;
		const { imageUrls } = req.body;

		if (!carId) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_CAR_ID',
					message: 'Car ID is required',
				},
			});
		}

		if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
			return res.status(400).json({
				success: false,
				error: {
					code: 'MISSING_IMAGE_URLS',
					message: 'Image URLs array is required',
				},
			});
		}

		// Extract filenames from URLs
		const filenames = imageService.extractFilenamesFromUrls(imageUrls);

		// Remove images from car record
		const car = await carService.removeCarImages(carId, imageUrls);

		// Delete physical files
		const deleteResults = await imageService.deleteImages(filenames);

		res.json({
			success: true,
			message: 'Images deleted successfully',
			data: {
				car: car,
				deletedImages: {
					count: deleteResults.deleted,
					failed: deleteResults.failed,
				},
			},
		});
	} catch (error) {
		let statusCode = 400;
		let errorCode = 'DELETE_IMAGES_ERROR';

		if (error.message.includes('not found')) {
			statusCode = 404;
			errorCode = 'CAR_NOT_FOUND';
		}

		res.status(statusCode).json({
			success: false,
			error: {
				code: errorCode,
				message: error.message,
			},
		});
	}
};

module.exports = {
	getAllCars,
	getCarById,
	createCar,
	updateCar,
	deleteCar,
	searchCars,
	getCarsByAvailability,
	uploadCarImages,
	serveCarImage,
	deleteCarImages,
};
