/**
 * Integration tests for authentication system with car listing functionality
 * Tests the complete authentication flow from middleware to controllers
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./model/user.model');
const Car = require('./model/car.model');

// Test database connection
const MONGODB_URI =
	process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/car_rental_test';

describe('Authentication Integration Tests', () => {
	let testUser;
	let testAdmin;
	let testCar;

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(MONGODB_URI);

		// Clear test data
		await User.deleteMany({});
		await Car.deleteMany({});
	});

	beforeEach(async () => {
		// Create test users
		testUser = await User.create({
			emailId: 'customer@test.com',
			password: 'hashedpassword123',
			typeOfUser: 'CUSTOMER',
		});

		testAdmin = await User.create({
			emailId: 'admin@test.com',
			password: 'hashedpassword123',
			typeOfUser: 'ADMIN',
		});

		// Create test car
		testCar = await Car.create({
			make: 'Toyota',
			model: 'Camry',
			year: 2023,
			dailyRate: 50,
			fuelType: 'Gasoline',
			transmission: 'Automatic',
			seatingCapacity: 5,
			licensePlate: 'TEST123',
			availabilityStatus: 'Available',
			isActive: true,
			createdBy: testAdmin._id,
		});
	});

	afterEach(async () => {
		// Clean up test data
		await User.deleteMany({});
		await Car.deleteMany({});
	});

	afterAll(async () => {
		await mongoose.connection.close();
	});

	describe('Public Car Browsing (No Authentication Required)', () => {
		it('should allow unauthenticated access to car listings', async () => {
			const response = await request(app).get('/api/cars').expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0].make).toBe('Toyota');
		});

		it('should allow unauthenticated access to car details', async () => {
			const response = await request(app)
				.get(`/api/cars/${testCar._id}`)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.make).toBe('Toyota');
			expect(response.body.data.model).toBe('Camry');
		});

		it('should allow unauthenticated car search', async () => {
			const response = await request(app)
				.get('/api/cars/search?q=Toyota')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
		});
	});

	describe('Authenticated Car Browsing', () => {
		it('should accept valid user authentication headers', async () => {
			const response = await request(app)
				.get('/api/cars')
				.set('x-user-id', testUser.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);
		});

		it('should handle invalid user authentication gracefully', async () => {
			const response = await request(app)
				.get('/api/cars')
				.set('x-user-id', 'nonexistent@test.com')
				.expect(200); // Should still work for public endpoints

			expect(response.body.success).toBe(true);
		});
	});

	describe('Admin Authentication for Car Management', () => {
		it('should allow admin to create cars', async () => {
			const newCar = {
				make: 'Honda',
				model: 'Civic',
				year: 2023,
				dailyRate: 45,
				fuelType: 'Gasoline',
				transmission: 'Manual',
				seatingCapacity: 5,
				licensePlate: 'ADMIN123',
				availabilityStatus: 'Available',
			};

			const response = await request(app)
				.post('/api/cars')
				.set('x-user-id', testAdmin.emailId)
				.send(newCar)
				.expect(201);

			expect(response.body.success).toBe(true);
			expect(response.body.data.make).toBe('Honda');
			expect(response.body.data.createdBy).toBe(testAdmin._id.toString());
		});

		it('should reject car creation without authentication', async () => {
			const newCar = {
				make: 'Honda',
				model: 'Civic',
				year: 2023,
				dailyRate: 45,
				fuelType: 'Gasoline',
				transmission: 'Manual',
				seatingCapacity: 5,
				licensePlate: 'NOAUTH123',
				availabilityStatus: 'Available',
			};

			const response = await request(app)
				.post('/api/cars')
				.send(newCar)
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});

		it('should reject car creation from non-admin users', async () => {
			const newCar = {
				make: 'Honda',
				model: 'Civic',
				year: 2023,
				dailyRate: 45,
				fuelType: 'Gasoline',
				transmission: 'Manual',
				seatingCapacity: 5,
				licensePlate: 'CUSTOMER123',
				availabilityStatus: 'Available',
			};

			const response = await request(app)
				.post('/api/cars')
				.set('x-user-id', testUser.emailId)
				.send(newCar)
				.expect(403);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
		});

		it('should allow admin to update cars', async () => {
			const updateData = {
				dailyRate: 55,
				availabilityStatus: 'Maintenance',
			};

			const response = await request(app)
				.put(`/api/cars/${testCar._id}`)
				.set('x-user-id', testAdmin.emailId)
				.send(updateData)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.dailyRate).toBe(55);
			expect(response.body.data.availabilityStatus).toBe('Maintenance');
		});

		it('should reject car updates from non-admin users', async () => {
			const updateData = {
				dailyRate: 55,
			};

			const response = await request(app)
				.put(`/api/cars/${testCar._id}`)
				.set('x-user-id', testUser.emailId)
				.send(updateData)
				.expect(403);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
		});

		it('should allow admin to delete cars', async () => {
			const response = await request(app)
				.delete(`/api/cars/${testCar._id}`)
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('Car removed successfully');
		});

		it('should reject car deletion from non-admin users', async () => {
			const response = await request(app)
				.delete(`/api/cars/${testCar._id}`)
				.set('x-user-id', testUser.emailId)
				.expect(403);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
		});
	});

	describe('Session Validation Endpoints', () => {
		it('should validate user session successfully', async () => {
			const response = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', testUser.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.user.emailId).toBe(testUser.emailId);
			expect(response.body.user.role).toBe('customer');
		});

		it('should validate admin session successfully', async () => {
			const response = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.user.emailId).toBe(testAdmin.emailId);
			expect(response.body.user.role).toBe('admin');
		});

		it('should reject session validation without authentication', async () => {
			const response = await request(app)
				.get('/api/login/validate-session')
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});

		it('should reject session validation with invalid user', async () => {
			const response = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', 'invalid@test.com')
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('INVALID_USER');
		});
	});

	describe('User Profile Endpoints', () => {
		it('should return user profile for authenticated user', async () => {
			const response = await request(app)
				.get('/api/login/profile')
				.set('x-user-id', testUser.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.emailId).toBe(testUser.emailId);
			expect(response.body.data.role).toBe('customer');
			expect(response.body.data.typeOfUser).toBe('CUSTOMER');
		});

		it('should return admin profile for authenticated admin', async () => {
			const response = await request(app)
				.get('/api/login/profile')
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data.emailId).toBe(testAdmin.emailId);
			expect(response.body.data.role).toBe('admin');
			expect(response.body.data.typeOfUser).toBe('ADMIN');
		});

		it('should reject profile request without authentication', async () => {
			const response = await request(app)
				.get('/api/login/profile')
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});
	});

	describe('Role-Based Access Control Integration', () => {
		it('should enforce admin-only access to cache stats', async () => {
			const response = await request(app)
				.get('/api/cars/admin/cache/stats')
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			// Should return cache stats for admin
			expect(response.body).toBeDefined();
		});

		it('should reject cache stats access for regular users', async () => {
			const response = await request(app)
				.get('/api/cars/admin/cache/stats')
				.set('x-user-id', testUser.emailId)
				.expect(403);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
		});

		it('should reject cache stats access without authentication', async () => {
			const response = await request(app)
				.get('/api/cars/admin/cache/stats')
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});
	});

	describe('Error Handling Integration', () => {
		it('should handle authentication middleware errors gracefully', async () => {
			// Test with malformed user ID
			const response = await request(app)
				.post('/api/cars')
				.set('x-user-id', '') // Empty user ID
				.send({
					make: 'Test',
					model: 'Car',
					year: 2023,
					dailyRate: 50,
					fuelType: 'Gasoline',
					transmission: 'Automatic',
					seatingCapacity: 5,
					licensePlate: 'ERROR123',
					availabilityStatus: 'Available',
				})
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});

		it('should handle database errors in authentication', async () => {
			// Close database connection to simulate error
			await mongoose.connection.close();

			const response = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', testUser.emailId)
				.expect(500);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');

			// Reconnect for other tests
			await mongoose.connect(MONGODB_URI);
		});
	});
});

/**
 * Performance and Load Testing for Authentication Integration
 */
describe('Authentication Performance Tests', () => {
	let testUsers = [];
	let testCars = [];

	beforeAll(async () => {
		// Create multiple test users and cars for load testing
		const userPromises = [];
		const carPromises = [];

		for (let i = 0; i < 10; i++) {
			userPromises.push(
				User.create({
					emailId: `user${i}@test.com`,
					password: 'hashedpassword123',
					typeOfUser: i < 2 ? 'ADMIN' : 'CUSTOMER',
				}),
			);
		}

		testUsers = await Promise.all(userPromises);

		for (let i = 0; i < 20; i++) {
			carPromises.push(
				Car.create({
					make: `Make${i}`,
					model: `Model${i}`,
					year: 2020 + (i % 4),
					dailyRate: 40 + (i % 20),
					fuelType: i % 2 === 0 ? 'Gasoline' : 'Electric',
					transmission: i % 2 === 0 ? 'Automatic' : 'Manual',
					seatingCapacity: 4 + (i % 3),
					licensePlate: `PERF${i.toString().padStart(3, '0')}`,
					availabilityStatus: 'Available',
					isActive: true,
					createdBy: testUsers[0]._id,
				}),
			);
		}

		testCars = await Promise.all(carPromises);
	});

	afterAll(async () => {
		await User.deleteMany({});
		await Car.deleteMany({});
	});

	it('should handle concurrent authenticated requests efficiently', async () => {
		const startTime = Date.now();

		// Create 50 concurrent requests with different users
		const requests = [];
		for (let i = 0; i < 50; i++) {
			const userIndex = i % testUsers.length;
			requests.push(
				request(app)
					.get('/api/cars')
					.set('x-user-id', testUsers[userIndex].emailId),
			);
		}

		const responses = await Promise.all(requests);
		const endTime = Date.now();
		const duration = endTime - startTime;

		// All requests should succeed
		responses.forEach((response) => {
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
		});

		// Should complete within reasonable time (adjust based on system)
		expect(duration).toBeLessThan(5000); // 5 seconds for 50 requests
	});

	it('should handle mixed authenticated and unauthenticated requests', async () => {
		const requests = [];

		// Mix of authenticated and unauthenticated requests
		for (let i = 0; i < 30; i++) {
			if (i % 3 === 0) {
				// Unauthenticated request
				requests.push(request(app).get('/api/cars'));
			} else {
				// Authenticated request
				const userIndex = i % testUsers.length;
				requests.push(
					request(app)
						.get('/api/cars')
						.set('x-user-id', testUsers[userIndex].emailId),
				);
			}
		}

		const responses = await Promise.all(requests);

		// All requests should succeed
		responses.forEach((response) => {
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
		});
	});
});

console.log('Authentication integration tests completed');
