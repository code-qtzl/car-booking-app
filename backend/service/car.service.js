const carRepo = require('../repository/car.repository');

/**
 * Car Service Layer
 * Handles business logic for car operations including audit logging and search/filtering
 */

/**
 * Simple audit logger for admin operations
 * In a production environment, this would integrate with a proper logging system
 */
const auditLogger = {
	log: (operation, userId, carId, details = {}) => {
		const logEntry = {
			timestamp: new Date().toISOString(),
			operation,
			userId,
			carId,
			details,
		};

		// For now, log to console. In production, this would go to a proper logging system
		console.log('[AUDIT LOG]', JSON.stringify(logEntry));

		return logEntry;
	},
};

/**
 * Find cars with business logic and filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (sort, limit, skip)
 * @returns {Promise<Object>} Object containing cars array and metadata
 */
const findCars = async (filters = {}, options = {}) => {
	try {
		// Apply business rules for filtering
		const processedFilters = processFilters(filters);
		const processedOptions = processOptions(options);

		// Get cars and total count for pagination
		const [cars, totalCount] = await Promise.all([
			carRepo.findCars(processedFilters, processedOptions),
			carRepo.countCars(processedFilters),
		]);

		return {
			cars,
			totalCount,
			page:
				Math.floor(
					(processedOptions.skip || 0) /
						(processedOptions.limit || 10),
				) + 1,
			limit: processedOptions.limit || 10,
			hasMore: (processedOptions.skip || 0) + cars.length < totalCount,
		};
	} catch (error) {
		throw new Error(`Failed to retrieve cars: ${error.message}`);
	}
};

/**
 * Find a single car by ID with business logic
 * @param {string} carId - Car ID
 * @returns {Promise<Object|null>} Car document or null
 */
const findCarById = async (carId) => {
	try {
		if (!carId) {
			throw new Error('Car ID is required');
		}

		const car = await carRepo.findCarById(carId);

		if (!car) {
			throw new Error('Car not found');
		}

		return car;
	} catch (error) {
		throw new Error(`Failed to retrieve car: ${error.message}`);
	}
};

/**
 * Create a new car with business logic and audit logging
 * @param {Object} carData - Car data
 * @param {string} adminUserId - ID of the admin creating the car
 * @returns {Promise<Object>} Created car document
 */
const createCar = async (carData, adminUserId) => {
	try {
		if (!adminUserId) {
			throw new Error('Admin user ID is required for car creation');
		}

		// Apply business rules for car creation
		const processedCarData = processCarData(carData);
		processedCarData.createdBy = adminUserId;

		// Validate business rules
		validateCarBusinessRules(processedCarData);

		const car = await carRepo.createCar(processedCarData);

		// Log the admin operation
		auditLogger.log('CREATE_CAR', adminUserId, car._id, {
			make: car.make,
			model: car.model,
			year: car.year,
			licensePlate: car.licensePlate,
		});

		return car;
	} catch (error) {
		throw new Error(`Failed to create car: ${error.message}`);
	}
};

/**
 * Update a car with business logic and audit logging
 * @param {string} carId - Car ID
 * @param {Object} updateData - Data to update
 * @param {string} adminUserId - ID of the admin updating the car
 * @returns {Promise<Object|null>} Updated car document or null
 */
const updateCar = async (carId, updateData, adminUserId) => {
	try {
		if (!carId) {
			throw new Error('Car ID is required');
		}

		if (!adminUserId) {
			throw new Error('Admin user ID is required for car updates');
		}

		// Get the existing car for audit logging
		const existingCar = await carRepo.findCarById(carId);
		if (!existingCar) {
			throw new Error('Car not found');
		}

		// Apply business rules for car updates
		const processedUpdateData = processCarData(updateData);

		// Validate business rules for updates
		validateCarBusinessRules(processedUpdateData, true);

		const updatedCar = await carRepo.updateCar(carId, processedUpdateData);

		if (!updatedCar) {
			throw new Error('Car not found or update failed');
		}

		// Log the admin operation with changes
		const changes = getChanges(existingCar, updatedCar);
		auditLogger.log('UPDATE_CAR', adminUserId, carId, {
			changes,
			make: updatedCar.make,
			model: updatedCar.model,
			licensePlate: updatedCar.licensePlate,
		});

		return updatedCar;
	} catch (error) {
		throw new Error(`Failed to update car: ${error.message}`);
	}
};

/**
 * Remove a car (soft delete) with business logic and audit logging
 * @param {string} carId - Car ID
 * @param {string} adminUserId - ID of the admin removing the car
 * @returns {Promise<Object|null>} Updated car document or null
 */
const removeCar = async (carId, adminUserId) => {
	try {
		if (!carId) {
			throw new Error('Car ID is required');
		}

		if (!adminUserId) {
			throw new Error('Admin user ID is required for car removal');
		}

		// Get the existing car for audit logging
		const existingCar = await carRepo.findCarById(carId);
		if (!existingCar) {
			throw new Error('Car not found');
		}

		// Check business rules for removal
		if (existingCar.availabilityStatus === 'Rented') {
			throw new Error('Cannot remove a car that is currently rented');
		}

		const removedCar = await carRepo.softDeleteCar(carId);

		if (!removedCar) {
			throw new Error('Car not found or removal failed');
		}

		// Log the admin operation
		auditLogger.log('REMOVE_CAR', adminUserId, carId, {
			make: existingCar.make,
			model: existingCar.model,
			year: existingCar.year,
			licensePlate: existingCar.licensePlate,
			previousStatus: existingCar.availabilityStatus,
		});

		return removedCar;
	} catch (error) {
		throw new Error(`Failed to remove car: ${error.message}`);
	}
};

/**
 * Search cars with advanced filtering and business logic
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Object containing search results and metadata
 */
const searchCars = async (searchTerm, filters = {}, options = {}) => {
	try {
		if (!searchTerm || searchTerm.trim().length === 0) {
			// If no search term, fall back to regular filtering
			return findCars(filters, options);
		}

		// Process filters and options
		const processedFilters = processFilters(filters);
		const processedOptions = processOptions(options);

		// Perform text search
		const cars = await carRepo.searchCars(
			searchTerm.trim(),
			processedFilters,
			processedOptions,
		);

		// Get total count for search results
		const totalCount = await carRepo.countCars({
			...processedFilters,
			$text: { $search: searchTerm.trim() },
		});

		return {
			cars,
			totalCount,
			searchTerm: searchTerm.trim(),
			page:
				Math.floor(
					(processedOptions.skip || 0) /
						(processedOptions.limit || 10),
				) + 1,
			limit: processedOptions.limit || 10,
			hasMore: (processedOptions.skip || 0) + cars.length < totalCount,
		};
	} catch (error) {
		throw new Error(`Failed to search cars: ${error.message}`);
	}
};

/**
 * Get cars by availability status with business logic
 * @param {string} status - Availability status
 * @returns {Promise<Array>} Array of car documents
 */
const getCarsByAvailability = async (status) => {
	try {
		const validStatuses = ['Available', 'Rented', 'Maintenance'];
		if (!validStatuses.includes(status)) {
			throw new Error(
				`Invalid availability status. Must be one of: ${validStatuses.join(
					', ',
				)}`,
			);
		}

		return await carRepo.findCarsByAvailability(status);
	} catch (error) {
		throw new Error(`Failed to get cars by availability: ${error.message}`);
	}
};

/**
 * Process and validate filter parameters
 * @param {Object} filters - Raw filter parameters
 * @returns {Object} Processed filter parameters
 */
const processFilters = (filters) => {
	const processed = { ...filters };

	// Validate and process price filters
	if (processed.priceMin !== undefined) {
		const priceMin = parseFloat(processed.priceMin);
		if (isNaN(priceMin) || priceMin < 0) {
			throw new Error('Minimum price must be a non-negative number');
		}
		processed.priceMin = priceMin;
	}

	if (processed.priceMax !== undefined) {
		const priceMax = parseFloat(processed.priceMax);
		if (isNaN(priceMax) || priceMax < 0) {
			throw new Error('Maximum price must be a non-negative number');
		}
		processed.priceMax = priceMax;
	}

	// Validate price range
	if (processed.priceMin !== undefined && processed.priceMax !== undefined) {
		if (processed.priceMin > processed.priceMax) {
			throw new Error(
				'Minimum price cannot be greater than maximum price',
			);
		}
	}

	// Validate fuel type
	if (processed.fuelType) {
		const validFuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
		if (Array.isArray(processed.fuelType)) {
			const invalidTypes = processed.fuelType.filter(
				(type) => !validFuelTypes.includes(type),
			);
			if (invalidTypes.length > 0) {
				throw new Error(
					`Invalid fuel types: ${invalidTypes.join(', ')}`,
				);
			}
		} else if (!validFuelTypes.includes(processed.fuelType)) {
			throw new Error(`Invalid fuel type: ${processed.fuelType}`);
		}
	}

	// Validate transmission
	if (processed.transmission) {
		const validTransmissions = ['Manual', 'Automatic'];
		if (!validTransmissions.includes(processed.transmission)) {
			throw new Error(`Invalid transmission: ${processed.transmission}`);
		}
	}

	// Validate seating capacity
	if (processed.minSeating !== undefined) {
		const minSeating = parseInt(processed.minSeating);
		if (isNaN(minSeating) || minSeating < 1) {
			throw new Error('Minimum seating capacity must be at least 1');
		}
		processed.minSeating = minSeating;
	}

	// Validate availability status
	if (processed.availabilityStatus) {
		const validStatuses = ['Available', 'Rented', 'Maintenance'];
		if (!validStatuses.includes(processed.availabilityStatus)) {
			throw new Error(
				`Invalid availability status: ${processed.availabilityStatus}`,
			);
		}
	}

	return processed;
};

/**
 * Process and validate query options
 * @param {Object} options - Raw query options
 * @returns {Object} Processed query options
 */
const processOptions = (options) => {
	const processed = { ...options };

	// Validate and process pagination
	if (processed.limit !== undefined) {
		const limit = parseInt(processed.limit);
		if (isNaN(limit) || limit < 1 || limit > 100) {
			throw new Error('Limit must be between 1 and 100');
		}
		processed.limit = limit;
	}

	if (processed.skip !== undefined) {
		const skip = parseInt(processed.skip);
		if (isNaN(skip) || skip < 0) {
			throw new Error('Skip must be a non-negative number');
		}
		processed.skip = skip;
	}

	// Validate sort options
	if (processed.sortBy) {
		const validSortFields = [
			'make',
			'model',
			'year',
			'dailyRate',
			'createdAt',
			'relevance',
		];
		if (!validSortFields.includes(processed.sortBy)) {
			throw new Error(`Invalid sort field: ${processed.sortBy}`);
		}
	}

	if (processed.sortOrder) {
		const validSortOrders = ['asc', 'desc'];
		if (!validSortOrders.includes(processed.sortOrder)) {
			throw new Error(`Invalid sort order: ${processed.sortOrder}`);
		}
	}

	return processed;
};

/**
 * Process and validate car data
 * @param {Object} carData - Raw car data
 * @returns {Object} Processed car data
 */
const processCarData = (carData) => {
	const processed = { ...carData };

	// Trim string fields
	if (processed.make) processed.make = processed.make.trim();
	if (processed.model) processed.model = processed.model.trim();
	if (processed.description)
		processed.description = processed.description.trim();
	if (processed.licensePlate)
		processed.licensePlate = processed.licensePlate.trim().toUpperCase();

	// Process features array
	if (processed.features && Array.isArray(processed.features)) {
		processed.features = processed.features
			.map((feature) => feature.trim())
			.filter((feature) => feature.length > 0);
	}

	// Process images array
	if (processed.images && Array.isArray(processed.images)) {
		processed.images = processed.images
			.map((image) => image.trim())
			.filter((image) => image.length > 0);
	}

	return processed;
};

/**
 * Validate business rules for car data
 * @param {Object} carData - Car data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 */
const validateCarBusinessRules = (carData, isUpdate = false) => {
	// Business rule: Daily rate must be reasonable
	if (carData.dailyRate !== undefined) {
		if (carData.dailyRate > 10000) {
			throw new Error('Daily rate cannot exceed $10,000');
		}
	}

	// Business rule: Year must be reasonable for rental cars
	if (carData.year !== undefined) {
		const currentYear = new Date().getFullYear();
		if (carData.year < 2000) {
			throw new Error('Rental cars must be from year 2000 or later');
		}
		if (carData.year > currentYear + 1) {
			throw new Error(
				'Car year cannot be more than one year in the future',
			);
		}
	}

	// Business rule: License plate format validation (basic)
	if (carData.licensePlate !== undefined) {
		if (
			carData.licensePlate.length < 3 ||
			carData.licensePlate.length > 10
		) {
			throw new Error(
				'License plate must be between 3 and 10 characters',
			);
		}
	}

	// Business rule: Seating capacity must be reasonable for rental cars
	if (carData.seatingCapacity !== undefined) {
		if (carData.seatingCapacity > 15) {
			throw new Error('Rental cars cannot have more than 15 seats');
		}
	}
};

/**
 * Compare two car objects and return the changes
 * @param {Object} oldCar - Original car object
 * @param {Object} newCar - Updated car object
 * @returns {Object} Object containing the changes
 */
const getChanges = (oldCar, newCar) => {
	const changes = {};
	const fieldsToCheck = [
		'make',
		'model',
		'year',
		'dailyRate',
		'fuelType',
		'transmission',
		'seatingCapacity',
		'availabilityStatus',
		'description',
		'licensePlate',
	];

	fieldsToCheck.forEach((field) => {
		if (oldCar[field] !== newCar[field]) {
			changes[field] = {
				from: oldCar[field],
				to: newCar[field],
			};
		}
	});

	return changes;
};

module.exports = {
	findCars,
	findCarById,
	createCar,
	updateCar,
	removeCar,
	searchCars,
	getCarsByAvailability,
	auditLogger,
	// Export helper functions for testing
	processFilters,
	processOptions,
	processCarData,
	validateCarBusinessRules,
	getChanges,
};
