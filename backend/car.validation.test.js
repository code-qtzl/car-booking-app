const mongoose = require('mongoose');
const fc = require('fast-check');
const Car = require('./model/car.model');

// Global counter to ensure unique license plates across all test runs
let globalTestCounter = 0;

describe('Car Data Validation Property Tests', () => {
	beforeAll(async () => {
		// Connect to test database
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect(
				process.env.MONGODB_URI ||
					'mongodb://localhost:27017/car-rental-test',
			);
		}
	});

	afterAll(async () => {
		// Clean up and close connection
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		// Clear the cars collection before each test and reset indexes
		await Car.deleteMany({});
		// Also drop and recreate indexes to ensure clean state
		try {
			await Car.collection.dropIndexes();
			await Car.createIndexes();
		} catch (error) {
			// Ignore errors if indexes don't exist yet
		}
		// Reset global counter
		globalTestCounter = 0;
	});

	// Generator for valid car data
	const validCarArbitrary = fc.record({
		make: fc
			.string({ minLength: 1, maxLength: 50 })
			.filter((s) => s.trim().length > 0),
		model: fc
			.string({ minLength: 1, maxLength: 50 })
			.filter((s) => s.trim().length > 0),
		year: fc.integer({ min: 1900, max: new Date().getFullYear() + 1 }),
		dailyRate: fc.float({
			min: Math.fround(0.01),
			max: Math.fround(10000),
			noNaN: true,
		}),
		fuelType: fc.constantFrom('Gasoline', 'Diesel', 'Electric', 'Hybrid'),
		transmission: fc.constantFrom('Manual', 'Automatic'),
		seatingCapacity: fc.integer({ min: 1, max: 50 }),
		features: fc.array(
			fc
				.string({ minLength: 1, maxLength: 100 })
				.filter((s) => s.trim().length > 0),
			{ maxLength: 20 },
		),
		images: fc.array(
			fc
				.string({ minLength: 1, maxLength: 200 })
				.filter((s) => s.trim().length > 0),
			{ maxLength: 10 },
		),
		availabilityStatus: fc.constantFrom(
			'Available',
			'Rented',
			'Maintenance',
		),
		description: fc.option(fc.string({ maxLength: 1000 })),
		licensePlate: fc
			.string({ minLength: 3, maxLength: 10 })
			.map((s) => s.toUpperCase().replace(/[^A-Z0-9\-\s]/g, 'A'))
			.filter((s) => s.trim().length >= 3),
		createdBy: fc.constant(new mongoose.Types.ObjectId()),
		isActive: fc.boolean(),
	});

	// Generator for invalid car data (missing required fields)
	const invalidCarArbitrary = fc.record(
		{
			make: fc.option(fc.string()),
			model: fc.option(fc.string()),
			year: fc.option(
				fc.oneof(
					fc.integer({ max: 1899 }), // Too old
					fc.integer({ min: new Date().getFullYear() + 2 }), // Too far in future
					fc.string(), // Wrong type
				),
			),
			dailyRate: fc.option(
				fc.oneof(
					fc.float({ max: Math.fround(-0.01) }), // Negative
					fc.string(), // Wrong type
					fc.constant(NaN),
				),
			),
			fuelType: fc.option(
				fc.oneof(
					fc
						.string()
						.filter(
							(s) =>
								![
									'Gasoline',
									'Diesel',
									'Electric',
									'Hybrid',
								].includes(s),
						),
					fc.integer(),
				),
			),
			transmission: fc.option(
				fc.oneof(
					fc
						.string()
						.filter((s) => !['Manual', 'Automatic'].includes(s)),
					fc.integer(),
				),
			),
			seatingCapacity: fc.option(
				fc.oneof(
					fc.integer({ max: 0 }), // Too small
					fc.integer({ min: 51 }), // Too large
					fc.string(),
				),
			),
			licensePlate: fc.option(fc.string()),
			createdBy: fc.option(fc.oneof(fc.string(), fc.constant(null))),
		},
		{ requiredKeys: [] },
	); // No required keys to ensure some fields are missing

	test('Property 7: Valid car data should be saved successfully', async () => {
		await fc.assert(
			fc.asyncProperty(validCarArbitrary, async (carData) => {
				// Generate truly unique license plate using process ID and high-resolution time
				const processId = process.pid.toString().slice(-3);
				const hrTime = process.hrtime.bigint().toString().slice(-8);
				const uniqueId =
					`${processId}${hrTime}${++globalTestCounter}`.slice(-10);
				carData.licensePlate = `T${uniqueId}`.substr(0, 10);

				const car = new Car(carData);

				// Validation should pass
				const validationError = car.validateSync();
				expect(validationError).toBeFalsy();

				// Should be able to save to database
				const savedCar = await car.save();
				expect(savedCar._id).toBeDefined();
				expect(savedCar.make).toBe(carData.make);
				expect(savedCar.model).toBe(carData.model);
				expect(savedCar.year).toBe(carData.year);
				expect(savedCar.dailyRate).toBe(carData.dailyRate);
				expect(savedCar.licensePlate).toBe(
					carData.licensePlate.toUpperCase(),
				);

				// Should be retrievable from database
				const retrievedCar = await Car.findById(savedCar._id);
				expect(retrievedCar).toBeTruthy();
				expect(retrievedCar.make).toBe(carData.make);
			}),
			{ numRuns: 10 },
		);
	});

	test('Property 7: Invalid car data should be rejected with appropriate error messages', async () => {
		await fc.assert(
			fc.asyncProperty(invalidCarArbitrary, async (carData) => {
				const car = new Car(carData);

				// Should either fail validation or fail to save
				let hasValidationError = false;
				let hasSaveError = false;

				const validationError = car.validateSync();
				if (validationError) {
					hasValidationError = true;
					expect(validationError.errors).toBeDefined();
					expect(
						Object.keys(validationError.errors).length,
					).toBeGreaterThan(0);
				}

				if (!hasValidationError) {
					try {
						await car.save();
					} catch (saveError) {
						hasSaveError = true;
						expect(saveError).toBeDefined();
					}
				}

				// At least one type of error should occur for invalid data
				expect(hasValidationError || hasSaveError).toBe(true);
			}),
			{ numRuns: 10 },
		);
	});

	test('Property 7: License plate uniqueness should be enforced', async () => {
		const licensePlate = 'TEST123';
		const baseCarData = {
			make: 'Toyota',
			model: 'Camry',
			year: 2023,
			dailyRate: 50.0,
			fuelType: 'Gasoline',
			transmission: 'Automatic',
			seatingCapacity: 5,
			licensePlate: licensePlate,
			createdBy: new mongoose.Types.ObjectId(),
		};

		// First car should save successfully
		const firstCar = new Car(baseCarData);
		await firstCar.save();

		// Second car with same license plate should fail
		const secondCar = new Car({ ...baseCarData, make: 'Honda' });

		await expect(secondCar.save()).rejects.toThrow();
	});

	test('Property 7: Required field validation messages should be descriptive', async () => {
		const emptyCar = new Car({});
		const validationError = emptyCar.validateSync();

		expect(validationError).toBeTruthy();
		expect(validationError.errors.make).toBeDefined();
		expect(validationError.errors.make.message).toBe('Make is required');
		expect(validationError.errors.model).toBeDefined();
		expect(validationError.errors.model.message).toBe('Model is required');
		expect(validationError.errors.year).toBeDefined();
		expect(validationError.errors.year.message).toBe('Year is required');
		expect(validationError.errors.dailyRate).toBeDefined();
		expect(validationError.errors.dailyRate.message).toBe(
			'Daily rate is required',
		);
	});

	test('Property 7: Enum validation should provide clear error messages', async () => {
		const carWithInvalidEnum = new Car({
			make: 'Toyota',
			model: 'Camry',
			year: 2023,
			dailyRate: 50.0,
			fuelType: 'InvalidFuel',
			transmission: 'InvalidTransmission',
			seatingCapacity: 5,
			licensePlate: 'TEST123',
			createdBy: new mongoose.Types.ObjectId(),
		});

		const validationError = carWithInvalidEnum.validateSync();

		expect(validationError).toBeTruthy();
		expect(validationError.errors.fuelType).toBeDefined();
		expect(validationError.errors.fuelType.message).toContain(
			'Fuel type must be one of',
		);
		expect(validationError.errors.transmission).toBeDefined();
		expect(validationError.errors.transmission.message).toContain(
			'Transmission must be either',
		);
	});
});
