const Car = require('../model/car.model');

/**
 * Find all cars with optional filtering and pagination - Enhanced for maximum performance
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (sort, limit, skip)
 * @returns {Promise<Array>} Array of car documents
 */
const findCars = async (filters = {}, options = {}) => {
	const query = buildQuery(filters);

	let carQuery = Car.find(query)
		.select('-__v -createdBy') // Exclude unnecessary fields for better performance
		.lean(); // Use lean() for better performance when we don't need full Mongoose documents

	// Apply sorting with optimized indexes and performance hints
	if (options.sortBy) {
		const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
		const sortObj = { [options.sortBy]: sortOrder };

		// Add secondary sort for consistent pagination
		if (options.sortBy !== '_id') {
			sortObj._id = 1;
		}

		carQuery = carQuery.sort(sortObj);

		// Use specific index hints for better performance
		if (options.sortBy === 'dailyRate') {
			carQuery = carQuery.hint({
				isActive: 1,
				availabilityStatus: 1,
				dailyRate: 1,
			});
		} else if (options.sortBy === 'createdAt') {
			carQuery = carQuery.hint({ isActive: 1, createdAt: -1, _id: 1 });
		} else if (options.sortBy === 'year') {
			carQuery = carQuery.hint({ year: -1, dailyRate: 1 });
		}
	} else {
		// Default sort by creation date (newest first) with _id as secondary
		carQuery = carQuery.sort({ createdAt: -1, _id: 1 });
		carQuery = carQuery.hint({ isActive: 1, createdAt: -1, _id: 1 });
	}

	// Apply pagination with performance optimizations
	if (options.limit) {
		const limit = parseInt(options.limit);
		// Cap limit to prevent performance issues
		carQuery = carQuery.limit(Math.min(limit, 50));
	}

	if (options.skip) {
		carQuery = carQuery.skip(parseInt(options.skip));
	}

	// Use allowDiskUse for large result sets
	if (options.skip > 1000) {
		carQuery = carQuery.allowDiskUse(true);
	}

	return carQuery.exec();
};

/**
 * Find a single car by ID
 * @param {string} carId - Car ID
 * @returns {Promise<Object|null>} Car document or null
 */
const findCarById = (carId) => {
	return Car.findOne({ _id: carId, isActive: true }).populate(
		'createdBy',
		'name emailId',
	);
};

/**
 * Create a new car
 * @param {Object} carData - Car data
 * @returns {Promise<Object>} Created car document
 */
const createCar = (carData) => {
	return Car.create(carData);
};

/**
 * Update a car by ID
 * @param {string} carId - Car ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated car document or null
 */
const updateCar = (carId, updateData) => {
	return Car.findOneAndUpdate({ _id: carId, isActive: true }, updateData, {
		new: true,
		runValidators: true,
	}).populate('createdBy', 'name emailId');
};

/**
 * Soft delete a car by setting isActive to false
 * @param {string} carId - Car ID
 * @returns {Promise<Object|null>} Updated car document or null
 */
const softDeleteCar = (carId) => {
	return Car.findOneAndUpdate(
		{ _id: carId, isActive: true },
		{ isActive: false },
		{ new: true },
	);
};

/**
 * Hard delete a car (permanently remove from database)
 * @param {string} carId - Car ID
 * @returns {Promise<Object|null>} Deleted car document or null
 */
const deleteCar = (carId) => {
	return Car.findByIdAndDelete(carId);
};

/**
 * Count cars with optional filtering (enhanced for pagination performance)
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} Count of matching cars
 */
const countCars = async (filters = {}) => {
	const query = buildQuery(filters);

	// Use estimatedDocumentCount for better performance when no filters
	if (Object.keys(query).length === 1 && query.isActive === true) {
		return Car.estimatedDocumentCount();
	}

	// For simple availability queries, use optimized counting
	if (
		Object.keys(query).length === 2 &&
		query.isActive === true &&
		query.availabilityStatus
	) {
		return Car.countDocuments(query)
			.hint({ isActive: 1, availabilityStatus: 1 })
			.exec();
	}

	// Use countDocuments with hint for better performance on indexed fields
	return Car.countDocuments(query)
		.hint({ isActive: 1, availabilityStatus: 1 })
		.maxTimeMS(5000) // Prevent long-running count queries
		.exec();
};

/**
 * Search cars using text search - Enhanced for performance
 * @param {string} searchTerm - Search term
 * @param {Object} additionalFilters - Additional filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching car documents
 */
const searchCars = async (searchTerm, additionalFilters = {}, options = {}) => {
	const query = {
		$text: { $search: searchTerm },
		...buildQuery(additionalFilters),
	};

	let carQuery = Car.find(query, { score: { $meta: 'textScore' } })
		.select('-__v -createdBy') // Exclude unnecessary fields
		.lean(); // Use lean for better performance

	// Sort by text score for relevance with performance optimization
	if (!options.sortBy || options.sortBy === 'relevance') {
		carQuery = carQuery.sort({ score: { $meta: 'textScore' }, _id: 1 });
	} else {
		// Apply additional sorting if specified
		const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
		carQuery = carQuery.sort({
			score: { $meta: 'textScore' },
			[options.sortBy]: sortOrder,
			_id: 1,
		});
	}

	// Apply pagination with performance limits
	if (options.limit) {
		const limit = parseInt(options.limit);
		carQuery = carQuery.limit(Math.min(limit, 50)); // Cap at 50 for performance
	}

	if (options.skip) {
		carQuery = carQuery.skip(parseInt(options.skip));
	}

	// Use hint for text search optimization and set timeout
	carQuery = carQuery.hint({ '$**': 'text' }).maxTimeMS(10000); // 10 second timeout for text searches

	return carQuery.exec();
};

/**
 * Find cars by availability status
 * @param {string} status - Availability status
 * @returns {Promise<Array>} Array of car documents
 */
const findCarsByAvailability = (status) => {
	return Car.find({
		availabilityStatus: status,
		isActive: true,
	}).populate('createdBy', 'name emailId');
};

/**
 * Find cars by price range with performance optimization
 * @param {number} minPrice - Minimum daily rate
 * @param {number} maxPrice - Maximum daily rate
 * @returns {Promise<Array>} Array of car documents
 */
const findCarsByPriceRange = (minPrice, maxPrice) => {
	const query = { isActive: true };

	if (minPrice !== undefined) {
		query.dailyRate = { $gte: minPrice };
	}

	if (maxPrice !== undefined) {
		query.dailyRate = { ...query.dailyRate, $lte: maxPrice };
	}

	return Car.find(query)
		.select('-__v -createdBy')
		.lean()
		.hint({ isActive: 1, availabilityStatus: 1, dailyRate: 1 })
		.populate('createdBy', 'name emailId');
};

/**
 * Batch find cars by IDs for performance optimization
 * @param {string[]} carIds - Array of car IDs
 * @returns {Promise<Array>} Array of car documents
 */
const findCarsByIds = (carIds) => {
	if (!Array.isArray(carIds) || carIds.length === 0) {
		return Promise.resolve([]);
	}

	return Car.find({
		_id: { $in: carIds },
		isActive: true,
	})
		.select('-__v -createdBy')
		.lean()
		.hint({ _id: 1 })
		.exec();
};

/**
 * Get aggregated car statistics for performance monitoring
 * @returns {Promise<Object>} Aggregated statistics
 */
const getCarStatistics = async () => {
	const pipeline = [
		{ $match: { isActive: true } },
		{
			$group: {
				_id: null,
				totalCars: { $sum: 1 },
				availableCars: {
					$sum: {
						$cond: [
							{ $eq: ['$availabilityStatus', 'Available'] },
							1,
							0,
						],
					},
				},
				averageRate: { $avg: '$dailyRate' },
				minRate: { $min: '$dailyRate' },
				maxRate: { $max: '$dailyRate' },
				fuelTypes: { $addToSet: '$fuelType' },
				transmissionTypes: { $addToSet: '$transmission' },
			},
		},
	];

	const result = await Car.aggregate(pipeline).exec();
	return result[0] || {};
};

/**
 * Build MongoDB query from filter parameters with performance optimizations
 * @param {Object} filters - Filter criteria
 * @returns {Object} MongoDB query object
 */
const buildQuery = (filters) => {
	const query = { isActive: true }; // Always filter out soft-deleted cars

	// Search query (for make, model, or general search) - optimized for performance
	if (filters.searchQuery) {
		const searchTerm = filters.searchQuery.trim();
		if (searchTerm.length > 0) {
			// Use case-insensitive regex with performance optimization
			const searchRegex = new RegExp(
				searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
				'i',
			);
			query.$or = [
				{ make: searchRegex },
				{ model: searchRegex },
				{ description: searchRegex },
			];
		}
	}

	// Price range filters with validation
	if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
		query.dailyRate = {};
		if (filters.priceMin !== undefined) {
			const minPrice = parseFloat(filters.priceMin);
			if (!isNaN(minPrice) && minPrice >= 0) {
				query.dailyRate.$gte = minPrice;
			}
		}
		if (filters.priceMax !== undefined) {
			const maxPrice = parseFloat(filters.priceMax);
			if (!isNaN(maxPrice) && maxPrice >= 0) {
				query.dailyRate.$lte = maxPrice;
			}
		}
	}

	// Fuel type filter with array support
	if (filters.fuelType) {
		if (Array.isArray(filters.fuelType)) {
			// Filter out empty values and validate
			const validFuelTypes = filters.fuelType.filter(
				(type) =>
					type &&
					['Gasoline', 'Diesel', 'Electric', 'Hybrid'].includes(type),
			);
			if (validFuelTypes.length > 0) {
				query.fuelType = { $in: validFuelTypes };
			}
		} else if (
			['Gasoline', 'Diesel', 'Electric', 'Hybrid'].includes(
				filters.fuelType,
			)
		) {
			query.fuelType = filters.fuelType;
		}
	}

	// Transmission filter with validation
	if (
		filters.transmission &&
		['Manual', 'Automatic'].includes(filters.transmission)
	) {
		query.transmission = filters.transmission;
	}

	// Minimum seating capacity with validation
	if (filters.minSeating) {
		const minSeating = parseInt(filters.minSeating);
		if (!isNaN(minSeating) && minSeating > 0) {
			query.seatingCapacity = { $gte: minSeating };
		}
	}

	// Availability status filter with validation
	if (
		filters.availabilityStatus &&
		['Available', 'Rented', 'Maintenance'].includes(
			filters.availabilityStatus,
		)
	) {
		query.availabilityStatus = filters.availabilityStatus;
	}

	// Year filter with validation
	if (filters.year) {
		const year = parseInt(filters.year);
		if (
			!isNaN(year) &&
			year >= 1900 &&
			year <= new Date().getFullYear() + 1
		) {
			query.year = year;
		}
	}

	// Make filter with performance optimization
	if (filters.make && filters.make.trim().length > 0) {
		const makeTerm = filters.make
			.trim()
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		query.make = new RegExp(makeTerm, 'i');
	}

	// Model filter with performance optimization
	if (filters.model && filters.model.trim().length > 0) {
		const modelTerm = filters.model
			.trim()
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		query.model = new RegExp(modelTerm, 'i');
	}

	return query;
};

module.exports = {
	findCars,
	findCarById,
	createCar,
	updateCar,
	softDeleteCar,
	deleteCar,
	countCars,
	searchCars,
	findCarsByAvailability,
	findCarsByPriceRange,
	findCarsByIds,
	getCarStatistics,
	buildQuery,
};
