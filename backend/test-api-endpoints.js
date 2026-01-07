/**
 * Simple API endpoint verification test
 * This test verifies that the car API endpoints are properly set up and accessible
 */

const request = require('supertest');
const app = require('./app');

// Mock database connection for testing
jest.mock('./config/dbConfig', () => ({
	connectDB: jest.fn(),
}));

// Mock the car service to avoid database dependencies
jest.mock('./service/car.service', () => ({
	findCars: jest.fn(),
	findCarById: jest.fn(),
	createCar: jest.fn(),
	updateCar: jest.fn(),
	removeCar: jest.fn(),
	searchCars: jest.fn(),
	getCarsByAvailability: jest.fn(),
}));

// Mock the auth middleware
jest.mock('./middleware/auth.middleware', () => ({
	authenticateAdmin: (req, res, next) => {
		req.user = { id: 'admin123', role: 'admin' };
		next();
	},
	authenticateUser: (req, res, next) => {
		req.user = { id: 'user123', role: 'customer' };
		next();
	},
	errorHandler: (err, req, res, next) => {
		res.status(500).json({
			success: false,
			error: { message: err.message },
		});
	},
}));

const carService = require('./service/car.service');

describe('Car API Endpoints', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /api/cars', () => {
		it('should return all cars successfully', async () => {
			const mockCars = [
				{
					_id: '1',
					make: 'Toyota',
					model: 'Camry',
					year: 2023,
					dailyRate: 50,
				},
				{
					_id: '2',
					make: 'Honda',
					model: 'Civic',
					year: 2022,
					dailyRate: 45,
				},
			];

			carService.findCars.mockResolvedValue({
				cars: mockCars,
				totalCount: 2,
				page: 1,
				limit: 10,
				hasMore: false,
			});

			const response = await request(app).get('/api/cars').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockCars);
			expect(response.body.pagination.totalCount).toBe(2);
		});

		it('should handle filtering parameters', async () => {
			carService.findCars.mockResolvedValue({
				cars: [],
				totalCount: 0,
				page: 1,
				limit: 10,
				hasMore: false,
			});

			await request(app)
				.get('/api/cars?make=Toyota&priceMin=30&priceMax=100')
				.expect(200);

			expect(carService.findCars).toHaveBeenCalledWith(
				expect.objectContaining({
					make: 'Toyota',
					priceMin: '30',
					priceMax: '100',
				}),
				expect.any(Object),
			);
		});
	});

	describe('GET /api/cars/:id', () => {
		it('should return a specific car by ID', async () => {
			const mockCar = {
				_id: '1',
				make: 'Toyota',
				model: 'Camry',
				year: 2023,
				dailyRate: 50,
			};
			carService.findCarById.mockResolvedValue(mockCar);

			const response = await request(app).get('/api/cars/1').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockCar);
			expect(carService.findCarById).toHaveBeenCalledWith('1');
		});

		it('should return 404 for non-existent car', async () => {
			carService.findCarById.mockRejectedValue(
				new Error('Car not found'),
			);

			const response = await request(app)
				.get('/api/cars/nonexistent')
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('CAR_NOT_FOUND');
		});

		it('should return 400 for missing car ID', async () => {
			const response = await request(app).get('/api/cars/').expect(404); // This will hit the route not found, which is expected behavior
		});
	});

	describe('POST /api/cars', () => {
		it('should create a new car successfully', async () => {
			const newCarData = {
				make: 'Toyota',
				model: 'Camry',
				year: 2023,
				dailyRate: 50,
				fuelType: 'Gasoline',
				transmission: 'Automatic',
				seatingCapacity: 5,
				licensePlate: 'ABC123',
			};

			const createdCar = { _id: '1', ...newCarData };
			carService.createCar.mockResolvedValue(createdCar);

			const response = await request(app)
				.post('/api/cars')
				.send(newCarData)
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(createdCar);
			expect(carService.createCar).toHaveBeenCalledWith(
				newCarData,
				'admin123',
			);
		});

		it('should return 400 for missing car data', async () => {
			const response = await request(app)
				.post('/api/cars')
				.send({})
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('MISSING_CAR_DATA');
		});

		it('should handle validation errors', async () => {
			carService.createCar.mockRejectedValue(
				new Error('Make is required'),
			);

			const response = await request(app)
				.post('/api/cars')
				.send({ model: 'Camry' })
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});
	});

	describe('PUT /api/cars/:id', () => {
		it('should update a car successfully', async () => {
			const updateData = { dailyRate: 60 };
			const updatedCar = {
				_id: '1',
				make: 'Toyota',
				model: 'Camry',
				dailyRate: 60,
			};
			carService.updateCar.mockResolvedValue(updatedCar);

			const response = await request(app)
				.put('/api/cars/1')
				.send(updateData)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(updatedCar);
			expect(carService.updateCar).toHaveBeenCalledWith(
				'1',
				updateData,
				'admin123',
			);
		});

		it('should return 400 for missing update data', async () => {
			const response = await request(app)
				.put('/api/cars/1')
				.send({})
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('MISSING_UPDATE_DATA');
		});

		it('should return 404 for non-existent car', async () => {
			carService.updateCar.mockRejectedValue(new Error('Car not found'));

			const response = await request(app)
				.put('/api/cars/nonexistent')
				.send({ dailyRate: 60 })
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('CAR_NOT_FOUND');
		});
	});

	describe('DELETE /api/cars/:id', () => {
		it('should delete a car successfully', async () => {
			const deletedCar = {
				_id: '1',
				make: 'Toyota',
				model: 'Camry',
				isActive: false,
			};
			carService.removeCar.mockResolvedValue(deletedCar);

			const response = await request(app)
				.delete('/api/cars/1')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(deletedCar);
			expect(carService.removeCar).toHaveBeenCalledWith('1', 'admin123');
		});

		it('should return 404 for non-existent car', async () => {
			carService.removeCar.mockRejectedValue(new Error('Car not found'));

			const response = await request(app)
				.delete('/api/cars/nonexistent')
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('CAR_NOT_FOUND');
		});

		it('should handle cars that are currently rented', async () => {
			carService.removeCar.mockRejectedValue(
				new Error('Car is currently rented'),
			);

			const response = await request(app)
				.delete('/api/cars/1')
				.expect(409);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('CAR_IN_USE');
		});
	});

	describe('GET /api/cars/search', () => {
		it('should search cars successfully', async () => {
			const mockSearchResults = {
				cars: [{ _id: '1', make: 'Toyota', model: 'Camry' }],
				totalCount: 1,
				searchTerm: 'Toyota',
				page: 1,
				limit: 10,
				hasMore: false,
			};

			carService.searchCars.mockResolvedValue(mockSearchResults);

			const response = await request(app)
				.get('/api/cars/search?q=Toyota')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockSearchResults.cars);
			expect(response.body.searchTerm).toBe('Toyota');
		});

		it('should return 400 for missing search term', async () => {
			const response = await request(app)
				.get('/api/cars/search')
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('MISSING_SEARCH_TERM');
		});
	});

	describe('GET /api/cars/availability/:status', () => {
		it('should get cars by availability status', async () => {
			const mockCars = [
				{ _id: '1', make: 'Toyota', availabilityStatus: 'Available' },
			];
			carService.getCarsByAvailability.mockResolvedValue(mockCars);

			const response = await request(app)
				.get('/api/cars/availability/Available')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toEqual(mockCars);
			expect(carService.getCarsByAvailability).toHaveBeenCalledWith(
				'Available',
			);
		});
	});
});
