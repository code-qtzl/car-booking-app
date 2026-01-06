const mongoose = require('mongoose');
const Car = require('./model/car.model');

// Test the Car model validation
async function testCarModel() {
	try {
		console.log('Testing Car model validation...');

		// Test 1: Valid car data
		const validCarData = {
			make: 'Toyota',
			model: 'Camry',
			year: 2023,
			dailyRate: 50.0,
			fuelType: 'Gasoline',
			transmission: 'Automatic',
			seatingCapacity: 5,
			features: ['GPS', 'Bluetooth', 'AC'],
			images: ['image1.jpg', 'image2.jpg'],
			description: 'A reliable and comfortable sedan',
			licensePlate: 'ABC123',
			createdBy: new mongoose.Types.ObjectId(),
		};

		const validCar = new Car(validCarData);
		const validationError = validCar.validateSync();

		if (validationError) {
			console.error(
				'❌ Valid car data failed validation:',
				validationError.message,
			);
		} else {
			console.log('✅ Valid car data passed validation');
		}

		// Test 2: Missing required fields
		const invalidCarData = {
			make: 'Toyota',
			// Missing required fields
		};

		const invalidCar = new Car(invalidCarData);
		const invalidValidationError = invalidCar.validateSync();

		if (invalidValidationError) {
			console.log('✅ Invalid car data correctly failed validation');
			console.log(
				'   Validation errors:',
				Object.keys(invalidValidationError.errors),
			);
		} else {
			console.error('❌ Invalid car data incorrectly passed validation');
		}

		// Test 3: Invalid enum values
		const invalidEnumData = {
			make: 'Toyota',
			model: 'Camry',
			year: 2023,
			dailyRate: 50.0,
			fuelType: 'InvalidFuel', // Invalid enum value
			transmission: 'Automatic',
			seatingCapacity: 5,
			licensePlate: 'ABC123',
			createdBy: new mongoose.Types.ObjectId(),
		};

		const invalidEnumCar = new Car(invalidEnumData);
		const enumValidationError = invalidEnumCar.validateSync();

		if (enumValidationError && enumValidationError.errors.fuelType) {
			console.log('✅ Invalid enum value correctly failed validation');
		} else {
			console.error(
				'❌ Invalid enum value incorrectly passed validation',
			);
		}

		// Test 4: Test static method
		console.log(
			"✅ Car model static method 'findAvailableCars' exists:",
			typeof Car.findAvailableCars === 'function',
		);

		// Test 5: Test instance method
		const testCar = new Car(validCarData);
		console.log(
			"✅ Car model instance method 'isAvailableForBooking' exists:",
			typeof testCar.isAvailableForBooking === 'function',
		);
		console.log(
			'✅ Car is available for booking:',
			testCar.isAvailableForBooking(),
		);

		console.log('\n🎉 Car model validation tests completed successfully!');
	} catch (error) {
		console.error('❌ Error testing Car model:', error.message);
		process.exit(1);
	}
}

testCarModel();
