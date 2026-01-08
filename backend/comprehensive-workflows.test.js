/**
 * Comprehensive integration tests for full user workflows
 * Tests complete end-to-end scenarios from user perspective
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./model/user.model');
const Car = require('./model/car.model');
const fs = require('fs');
const path = require('path');

// Test database connection
const MONGODB_URI =
	process.env.MONGODB_TEST_URI ||
	'mongodb://localhost:27017/car_rental_workflow_test';

describe('Comprehensive User Workflows', () => {
	let testCustomer;
	let testAdmin;
	let testCars = [];
	let uploadedImages = [];

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(MONGODB_URI);

		// Clear test data
		await User.deleteMany({});
		await Car.deleteMany({});

		// Create test users
		testCustomer = await User.create({
			emailId: 'customer@workflow.com',
			password: 'hashedpassword123',
			typeOfUser: 'CUSTOMER',
		});

		testAdmin = await User.create({
			emailId: 'admin@workflow.com',
			password: 'hashedpassword123',
			typeOfUser: 'ADMIN',
		});

		// Create test cars with variety for comprehensive testing
		const carData = [
			{
				make: 'Toyota',
				model: 'Camry',
				year: 2023,
				dailyRate: 75,
				fuelType: 'Gasoline',
				transmission: 'Automatic',
				seatingCapacity: 5,
				licensePlate: 'WF001',
				availabilityStatus: 'Available',
				features: ['GPS', 'Bluetooth', 'AC'],
				description: 'Comfortable sedan for city driving',
				isActive: true,
				createdBy: testAdmin._id,
			},
			{
				make: 'Honda',
				model: 'Civic',
				year: 2022,
				dailyRate: 65,
				fuelType: 'Gasoline',
				transmission: 'Manual',
				seatingCapacity: 5,
				licensePlate: 'WF002',
				availabilityStatus: 'Available',
				features: ['Bluetooth', 'AC'],
				description: 'Fuel-efficient compact car',
				isActive: true,
				createdBy: testAdmin._id,
			},
			{
				make: 'Tesla',
				model: 'Model 3',
				year: 2023,
				dailyRate: 120,
				fuelType: 'Electric',
				transmission: 'Automatic',
				seatingCapacity: 5,
				licensePlate: 'WF003',
				availabilityStatus: 'Available',
				features: ['GPS', 'Bluetooth', 'AC', 'Autopilot'],
				description: 'Premium electric vehicle',
				isActive: true,
				createdBy: testAdmin._id,
			},
			{
				make: 'Ford',
				model: 'Explorer',
				year: 2021,
				dailyRate: 95,
				fuelType: 'Gasoline',
				transmission: 'Automatic',
				seatingCapacity: 7,
				licensePlate: 'WF004',
				availabilityStatus: 'Rented',
				features: ['GPS', 'Bluetooth', 'AC', '4WD'],
				description: 'Spacious SUV for families',
				isActive: true,
				createdBy: testAdmin._id,
			},
			{
				make: 'BMW',
				model: 'X5',
				year: 2023,
				dailyRate: 150,
				fuelType: 'Gasoline',
				transmission: 'Automatic',
				seatingCapacity: 5,
				licensePlate: 'WF005',
				availabilityStatus: 'Maintenance',
				features: ['GPS', 'Bluetooth', 'AC', 'Leather', 'Sunroof'],
				description: 'Luxury SUV with premium features',
				isActive: true,
				createdBy: testAdmin._id,
			},
		];

		testCars = await Car.insertMany(carData);
	});

	afterAll(async () => {
		// Clean up uploaded test images
		uploadedImages.forEach((filename) => {
			const imagePath = path.join(__dirname, 'uploads', 'cars', filename);
			if (fs.existsSync(imagePath)) {
				fs.unlinkSync(imagePath);
			}
		});

		// Clean up test data
		await User.deleteMany({});
		await Car.deleteMany({});
		await mongoose.connection.close();
	});

	describe('Customer Car Browsing Workflow', () => {
		it('should complete full car browsing workflow without authentication', async () => {
			// Step 1: Browse all available cars
			const browseResponse = await request(app)
				.get('/api/cars')
				.expect(200);

			expect(browseResponse.body.success).toBe(true);
			expect(browseResponse.body.data).toBeInstanceOf(Array);
			expect(browseResponse.body.data.length).toBeGreaterThan(0);
			expect(browseResponse.body.pagination).toBeDefined();

			// Verify only active cars are returned
			browseResponse.body.data.forEach((car) => {
				expect(car.isActive).toBe(true);
			});

			// Step 2: Search for specific cars
			const searchResponse = await request(app)
				.get('/api/cars/search?q=Toyota')
				.expect(200);

			expect(searchResponse.body.success).toBe(true);
			expect(searchResponse.body.data).toBeInstanceOf(Array);
			expect(searchResponse.body.searchTerm).toBe('Toyota');

			// Verify search results contain Toyota
			const toyotaCar = searchResponse.body.data.find(
				(car) => car.make === 'Toyota',
			);
			expect(toyotaCar).toBeDefined();

			// Step 3: Filter cars by price range
			const filterResponse = await request(app)
				.get('/api/cars?priceMin=60&priceMax=100')
				.expect(200);

			expect(filterResponse.body.success).toBe(true);
			filterResponse.body.data.forEach((car) => {
				expect(car.dailyRate).toBeGreaterThanOrEqual(60);
				expect(car.dailyRate).toBeLessThanOrEqual(100);
			});

			// Step 4: View car details
			const carId = browseResponse.body.data[0]._id;
			const detailResponse = await request(app)
				.get(`/api/cars/${carId}`)
				.expect(200);

			expect(detailResponse.body.success).toBe(true);
			expect(detailResponse.body.data._id).toBe(carId);
			expect(detailResponse.body.data.make).toBeDefined();
			expect(detailResponse.body.data.model).toBeDefined();
			expect(detailResponse.body.data.dailyRate).toBeDefined();

			// Step 5: Filter by availability status
			const availableResponse = await request(app)
				.get('/api/cars/availability/Available')
				.expect(200);

			expect(availableResponse.body.success).toBe(true);
			availableResponse.body.data.forEach((car) => {
				expect(car.availabilityStatus).toBe('Available');
			});
		});

		it('should handle advanced filtering combinations', async () => {
			// Test multiple filters simultaneously
			const response = await request(app)
				.get(
					'/api/cars?fuelType=Gasoline&transmission=Automatic&minSeating=5&sortBy=dailyRate&sortOrder=asc',
				)
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify all filters are applied
			response.body.data.forEach((car) => {
				expect(car.fuelType).toBe('Gasoline');
				expect(car.transmission).toBe('Automatic');
				expect(car.seatingCapacity).toBeGreaterThanOrEqual(5);
			});

			// Verify sorting (prices should be in ascending order)
			for (let i = 1; i < response.body.data.length; i++) {
				expect(response.body.data[i].dailyRate).toBeGreaterThanOrEqual(
					response.body.data[i - 1].dailyRate,
				);
			}
		});

		it('should handle pagination correctly', async () => {
			// Test first page
			const page1Response = await request(app)
				.get('/api/cars?limit=2&skip=0')
				.expect(200);

			expect(page1Response.body.success).toBe(true);
			expect(page1Response.body.data.length).toBeLessThanOrEqual(2);
			expect(page1Response.body.pagination.currentPage).toBe(1);

			// Test second page if there are enough cars
			if (page1Response.body.pagination.hasMore) {
				const page2Response = await request(app)
					.get('/api/cars?limit=2&skip=2')
					.expect(200);

				expect(page2Response.body.success).toBe(true);
				expect(page2Response.body.pagination.currentPage).toBe(2);

				// Verify different cars on different pages
				const page1Ids = page1Response.body.data.map((car) => car._id);
				const page2Ids = page2Response.body.data.map((car) => car._id);
				const overlap = page1Ids.filter((id) => page2Ids.includes(id));
				expect(overlap.length).toBe(0);
			}
		});
	});

	describe('Authenticated Customer Workflow', () => {
		it('should provide enhanced experience for authenticated customers', async () => {
			// Browse cars with authentication
			const response = await request(app)
				.get('/api/cars')
				.set('x-user-id', testCustomer.emailId)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeInstanceOf(Array);

			// Verify session validation works
			const sessionResponse = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', testCustomer.emailId)
				.expect(200);

			expect(sessionResponse.body.success).toBe(true);
			expect(sessionResponse.body.user.emailId).toBe(
				testCustomer.emailId,
			);
			expect(sessionResponse.body.user.role).toBe('customer');

			// Get user profile
			const profileResponse = await request(app)
				.get('/api/login/profile')
				.set('x-user-id', testCustomer.emailId)
				.expect(200);

			expect(profileResponse.body.success).toBe(true);
			expect(profileResponse.body.data.emailId).toBe(
				testCustomer.emailId,
			);
		});
	});

	describe('Admin Car Management Workflow', () => {
		it('should complete full admin car management workflow', async () => {
			// Step 1: Admin authentication and session validation
			const sessionResponse = await request(app)
				.get('/api/login/validate-session')
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			expect(sessionResponse.body.success).toBe(true);
			expect(sessionResponse.body.user.role).toBe('admin');

			// Step 2: Create a new car
			const newCarData = {
				make: 'Nissan',
				model: 'Altima',
				year: 2023,
				dailyRate: 70,
				fuelType: 'Gasoline',
				transmission: 'Automatic',
				seatingCapacity: 5,
				licensePlate: 'WF006',
				availabilityStatus: 'Available',
				features: ['GPS', 'Bluetooth'],
				description: 'Reliable mid-size sedan',
			};

			const createResponse = await request(app)
				.post('/api/cars')
				.set('x-user-id', testAdmin.emailId)
				.send(newCarData)
				.expect(201);

			expect(createResponse.body.success).toBe(true);
			expect(createResponse.body.data.make).toBe('Nissan');
			expect(createResponse.body.data.createdBy).toBe(
				testAdmin._id.toString(),
			);

			const createdCarId = createResponse.body.data._id;

			// Step 3: Update the car
			const updateData = {
				dailyRate: 75,
				features: ['GPS', 'Bluetooth', 'AC'],
				description: 'Updated reliable mid-size sedan with AC',
			};

			const updateResponse = await request(app)
				.put(`/api/cars/${createdCarId}`)
				.set('x-user-id', testAdmin.emailId)
				.send(updateData)
				.expect(200);

			expect(updateResponse.body.success).toBe(true);
			expect(updateResponse.body.data.dailyRate).toBe(75);
			expect(updateResponse.body.data.features).toContain('AC');

			// Step 4: Verify the car appears in public listings
			const publicResponse = await request(app)
				.get('/api/cars')
				.expect(200);

			const createdCar = publicResponse.body.data.find(
				(car) => car._id === createdCarId,
			);
			expect(createdCar).toBeDefined();
			expect(createdCar.dailyRate).toBe(75);

			// Step 5: Create a test image file for upload
			const testImagePath = path.join(__dirname, 'test-image.jpg');
			const testImageBuffer = Buffer.from('fake-image-data');
			fs.writeFileSync(testImagePath, testImageBuffer);

			// Step 6: Upload images to the car
			const uploadResponse = await request(app)
				.post(`/api/cars/${createdCarId}/images`)
				.set('x-user-id', testAdmin.emailId)
				.attach('images', testImagePath)
				.expect(200);

			expect(uploadResponse.body.success).toBe(true);
			expect(
				uploadResponse.body.data.uploadedImages.count,
			).toBeGreaterThan(0);
			expect(uploadResponse.body.data.car.images.length).toBeGreaterThan(
				0,
			);

			// Track uploaded images for cleanup
			uploadedImages.push(
				...uploadResponse.body.data.uploadedImages.urls.map((url) =>
					path.basename(url),
				),
			);

			// Clean up test image file
			fs.unlinkSync(testImagePath);

			// Step 7: Delete specific images
			const imageUrls = uploadResponse.body.data.car.images;
			const deleteImagesResponse = await request(app)
				.delete(`/api/cars/${createdCarId}/images`)
				.set('x-user-id', testAdmin.emailId)
				.send({ imageUrls: [imageUrls[0]] })
				.expect(200);

			expect(deleteImagesResponse.body.success).toBe(true);
			expect(deleteImagesResponse.body.data.deletedImages.count).toBe(1);

			// Step 8: Soft delete the car
			const deleteResponse = await request(app)
				.delete(`/api/cars/${createdCarId}`)
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			expect(deleteResponse.body.success).toBe(true);
			expect(deleteResponse.body.message).toBe(
				'Car removed successfully',
			);

			// Step 9: Verify car is no longer in public listings
			const finalPublicResponse = await request(app)
				.get('/api/cars')
				.expect(200);

			const deletedCar = finalPublicResponse.body.data.find(
				(car) => car._id === createdCarId,
			);
			expect(deletedCar).toBeUndefined();
		});

		it('should handle admin cache statistics', async () => {
			const response = await request(app)
				.get('/api/cars/admin/cache/stats')
				.set('x-user-id', testAdmin.emailId)
				.expect(200);

			// Should return cache statistics
			expect(response.body).toBeDefined();
		});
	});

	describe('Error Handling Workflows', () => {
		it('should handle authentication errors gracefully', async () => {
			// Try to create car without authentication
			const response = await request(app)
				.post('/api/cars')
				.send({
					make: 'Test',
					model: 'Car',
					year: 2023,
					dailyRate: 50,
					fuelType: 'Gasoline',
					transmission: 'Automatic',
					seatingCapacity: 5,
					licensePlate: 'ERROR001',
				})
				.expect(401);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
		});

		it('should handle validation errors properly', async () => {
			// Try to create car with invalid data
			const response = await request(app)
				.post('/api/cars')
				.set('x-user-id', testAdmin.emailId)
				.send({
					make: '', // Invalid: empty make
					model: 'Test',
					year: 'invalid', // Invalid: non-numeric year
					dailyRate: -50, // Invalid: negative rate
				})
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('VALIDATION_ERROR');
		});

		it('should handle not found errors', async () => {
			const response = await request(app)
				.get('/api/cars/nonexistent-id')
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.error.code).toBe('CAR_NOT_FOUND');
		});
	});

	describe('Performance and Load Testing', () => {
		it('should handle concurrent requests efficiently', async () => {
			const startTime = Date.now();

			// Create 20 concurrent requests
			const requests = [];
			for (let i = 0; i < 20; i++) {
				requests.push(request(app).get('/api/cars'));
			}

			const responses = await Promise.all(requests);
			const endTime = Date.now();
			const duration = endTime - startTime;

			// All requests should succeed
			responses.forEach((response) => {
				expect(response.status).toBe(200);
				expect(response.body.success).toBe(true);
			});

			// Should complete within reasonable time
			expect(duration).toBeLessThan(3000); // 3 seconds for 20 requests
		});

		it('should handle mixed authenticated and unauthenticated requests', async () => {
			const requests = [];

			// Mix of different request types
			for (let i = 0; i < 15; i++) {
				if (i % 3 === 0) {
					// Unauthenticated request
					requests.push(request(app).get('/api/cars'));
				} else if (i % 3 === 1) {
					// Customer request
					requests.push(
						request(app)
							.get('/api/cars')
							.set('x-user-id', testCustomer.emailId),
					);
				} else {
					// Admin request
					requests.push(
						request(app)
							.get('/api/cars/admin/cache/stats')
							.set('x-user-id', testAdmin.emailId),
					);
				}
			}

			const responses = await Promise.all(requests);

			// Verify appropriate responses
			responses.forEach((response, index) => {
				if (index % 3 === 2) {
					// Admin requests should succeed
					expect(response.status).toBe(200);
				} else {
					// Public requests should succeed
					expect(response.status).toBe(200);
					expect(response.body.success).toBe(true);
				}
			});
		});
	});

	describe('Search and Filter Integration', () => {
		it('should handle complex search and filter combinations', async () => {
			// Test search with multiple filters
			const response = await request(app)
				.get(
					'/api/cars/search?q=Toyota&priceMin=50&priceMax=100&fuelType=Gasoline&transmission=Automatic',
				)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.searchTerm).toBe('Toyota');

			// Verify filters are applied to search results
			response.body.data.forEach((car) => {
				expect(car.dailyRate).toBeGreaterThanOrEqual(50);
				expect(car.dailyRate).toBeLessThanOrEqual(100);
				expect(car.fuelType).toBe('Gasoline');
				expect(car.transmission).toBe('Automatic');
			});
		});

		it('should handle edge cases in search and filtering', async () => {
			// Test search with no results
			const noResultsResponse = await request(app)
				.get('/api/cars/search?q=NonexistentBrand')
				.expect(200);

			expect(noResultsResponse.body.success).toBe(true);
			expect(noResultsResponse.body.data).toEqual([]);

			// Test filter with no matches
			const noMatchResponse = await request(app)
				.get('/api/cars?priceMin=1000&priceMax=2000')
				.expect(200);

			expect(noMatchResponse.body.success).toBe(true);
			expect(noMatchResponse.body.data).toEqual([]);

			// Test invalid filter values
			const invalidFilterResponse = await request(app)
				.get('/api/cars?priceMin=invalid&priceMax=also-invalid')
				.expect(200);

			expect(invalidFilterResponse.body.success).toBe(true);
			// Should ignore invalid filters and return all cars
		});
	});

	describe('Image Handling Workflow', () => {
		it('should handle image serving and caching', async () => {
			// First, upload an image to get a valid filename
			const testImagePath = path.join(__dirname, 'test-serve-image.jpg');
			const testImageBuffer = Buffer.from('test-image-for-serving');
			fs.writeFileSync(testImagePath, testImageBuffer);

			const uploadResponse = await request(app)
				.post(`/api/cars/${testCars[0]._id}/images`)
				.set('x-user-id', testAdmin.emailId)
				.attach('images', testImagePath)
				.expect(200);

			const imageUrl = uploadResponse.body.data.uploadedImages.urls[0];
			const filename = path.basename(imageUrl);

			// Track for cleanup
			uploadedImages.push(filename);

			// Test serving the image
			const serveResponse = await request(app)
				.get(`/api/cars/images/${filename}`)
				.expect(200);

			expect(serveResponse.headers['content-type']).toMatch(/image/);
			expect(serveResponse.headers['cache-control']).toContain('public');

			// Clean up test image file
			fs.unlinkSync(testImagePath);

			// Test serving non-existent image
			const notFoundResponse = await request(app)
				.get('/api/cars/images/nonexistent.jpg')
				.expect(404);

			expect(notFoundResponse.body.success).toBe(false);
			expect(notFoundResponse.body.error.code).toBe('IMAGE_NOT_FOUND');
		});
	});
});

console.log('Comprehensive workflow tests completed');
