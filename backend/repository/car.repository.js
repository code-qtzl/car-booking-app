const Car = require('../model/car.model');

/**
 * Find all cars with optional filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (sort, limit, skip)
 * @returns {Promise<Array>} Array of car documents
 */
const findCars = async (filters = {}, options = {}) => {
	const query = buildQuery(filters);

	let carQuery = Car.find(query);

	// Apply sorting
	if (options.sortBy) {
		const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
		const sortObj = { [options.sortBy]: sortOrder };
		carQuery = carQuery.sort(sortObj);
	} else {
		// Default sort by creation date (newest first)
		carQuery = carQuery.sort({ createdAt: -1 });
	}

	// Apply pagination
	if (options.limit) {
		carQuery = carQuery.limit(parseInt(options.limit));
	}

	if (options.skip) {
		carQuery = carQuery.skip(parseInt(options.skip));
	}

	return carQuery.populate('createdBy', 'name emailId');
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
 * Count cars with optional filtering
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} Count of matching cars
 */
const countCars = (filters = {}) => {
	const query = buildQuery(filters);
	return Car.countDocuments(query);
};

/**
 * Search cars using text search
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

	let carQuery = Car.find(query, { score: { $meta: 'textScore' } });

	// Sort by text score for relevance
	carQuery = carQuery.sort({ score: { $meta: 'textScore' } });

	// Apply additional sorting if specified
	if (options.sortBy && options.sortBy !== 'relevance') {
		const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
		carQuery = carQuery.sort({ [options.sortBy]: sortOrder });
	}

	// Apply pagination
	if (options.limit) {
		carQuery = carQuery.limit(parseInt(options.limit));
	}

	if (options.skip) {
		carQuery = carQuery.skip(parseInt(options.skip));
	}

	return carQuery.populate('createdBy', 'name emailId');
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
 * Find cars by price range
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

	return Car.find(query).populate('createdBy', 'name emailId');
};

/**
 * Build MongoDB query from filter parameters
 * @param {Object} filters - Filter criteria
 * @returns {Object} MongoDB query object
 */
const buildQuery = (filters) => {
	const query = { isActive: true }; // Always filter out soft-deleted cars

	// Search query (for make, model, or general search)
	if (filters.searchQuery) {
		const searchRegex = new RegExp(filters.searchQuery, 'i');
		query.$or = [
			{ make: searchRegex },
			{ model: searchRegex },
			{ description: searchRegex },
		];
	}

	// Price range filters
	if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
		query.dailyRate = {};
		if (filters.priceMin !== undefined) {
			query.dailyRate.$gte = parseFloat(filters.priceMin);
		}
		if (filters.priceMax !== undefined) {
			query.dailyRate.$lte = parseFloat(filters.priceMax);
		}
	}

	// Fuel type filter
	if (filters.fuelType) {
		if (Array.isArray(filters.fuelType)) {
			query.fuelType = { $in: filters.fuelType };
		} else {
			query.fuelType = filters.fuelType;
		}
	}

	// Transmission filter
	if (filters.transmission) {
		query.transmission = filters.transmission;
	}

	// Minimum seating capacity
	if (filters.minSeating) {
		query.seatingCapacity = { $gte: parseInt(filters.minSeating) };
	}

	// Availability status filter
	if (filters.availabilityStatus) {
		query.availabilityStatus = filters.availabilityStatus;
	}

	// Year filter
	if (filters.year) {
		query.year = parseInt(filters.year);
	}

	// Make filter
	if (filters.make) {
		query.make = new RegExp(filters.make, 'i');
	}

	// Model filter
	if (filters.model) {
		query.model = new RegExp(filters.model, 'i');
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
	buildQuery,
};
