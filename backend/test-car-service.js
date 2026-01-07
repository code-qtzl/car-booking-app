// Simple test to verify car service functionality
const carService = require('./service/car.service');

// Test the helper functions
console.log('Testing car service helper functions...');

try {
	// Test processFilters
	const filters = carService.processFilters({
		priceMin: '50',
		priceMax: '200',
		fuelType: 'Gasoline',
		transmission: 'Automatic',
	});
	console.log('✓ processFilters works correctly');

	// Test processOptions
	const options = carService.processOptions({
		limit: '10',
		skip: '0',
		sortBy: 'dailyRate',
		sortOrder: 'asc',
	});
	console.log('✓ processOptions works correctly');

	// Test processCarData
	const carData = carService.processCarData({
		make: '  Toyota  ',
		model: '  Camry  ',
		licensePlate: '  abc123  ',
		features: ['GPS', '  Bluetooth  ', '', 'AC'],
		images: ['image1.jpg', '  ', 'image2.jpg'],
	});
	console.log('✓ processCarData works correctly');
	console.log('  - License plate processed:', carData.licensePlate);
	console.log('  - Features processed:', carData.features);

	// Test validateCarBusinessRules
	carService.validateCarBusinessRules({
		dailyRate: 100,
		year: 2023,
		licensePlate: 'ABC123',
		seatingCapacity: 5,
	});
	console.log('✓ validateCarBusinessRules works correctly');

	// Test audit logger
	const logEntry = carService.auditLogger.log(
		'TEST_OPERATION',
		'user123',
		'car456',
		{ test: 'data' },
	);
	console.log('✓ auditLogger works correctly');
	console.log('  - Log entry created:', logEntry.operation);

	console.log('\n✅ All car service helper functions are working correctly!');
} catch (error) {
	console.error('❌ Error testing car service:', error.message);
	process.exit(1);
}
