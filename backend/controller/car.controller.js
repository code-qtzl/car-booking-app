const carService = require('../service/car.service');

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
			limit: req.query.limit,
			skip: req.query.skip,
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

		res.json({
			success: true,
			data: result.cars,
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

module.exports = {
	getAllCars,
	getCarById,
	createCar,
	updateCar,
	deleteCar,
	searchCars,
	getCarsByAvailability,
};
