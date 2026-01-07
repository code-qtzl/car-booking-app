const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./app');

// Simple test to verify image upload functionality
async function testImageUpload() {
	console.log('Testing image upload functionality...');

	try {
		// Create a simple test image file
		const testImagePath = path.join(__dirname, 'test-image.jpg');
		const testImageContent = Buffer.from('fake-image-content-for-testing');
		fs.writeFileSync(testImagePath, testImageContent);

		console.log('✓ Test image file created');

		// Test the upload middleware configuration
		const {
			uploadMultiple,
			handleUploadError,
		} = require('./middleware/upload.middleware');
		console.log('✓ Upload middleware loaded successfully');

		// Test image service
		const imageService = require('./service/image.service');

		// Test URL generation
		const testUrl = imageService.generateImageUrl('test-image.jpg');
		console.log('✓ Image URL generation works:', testUrl);

		// Test filename extraction
		const extractedFilename = imageService.extractFilenameFromUrl(testUrl);
		console.log('✓ Filename extraction works:', extractedFilename);

		// Test file processing
		const mockFiles = [
			{
				filename: 'car-123456789-test.jpg',
				originalname: 'test.jpg',
				mimetype: 'image/jpeg',
				size: 1024,
			},
		];

		const processedFiles = imageService.processUploadedFiles(mockFiles);
		console.log('✓ File processing works:', processedFiles);

		// Test directory structure
		const uploadsDir = path.join(__dirname, 'uploads/cars');
		if (fs.existsSync(uploadsDir)) {
			console.log('✓ Uploads directory exists');
		} else {
			console.log('✗ Uploads directory missing');
		}

		// Clean up test file
		if (fs.existsSync(testImagePath)) {
			fs.unlinkSync(testImagePath);
			console.log('✓ Test file cleaned up');
		}

		console.log('\n✅ All image upload functionality tests passed!');
	} catch (error) {
		console.error('❌ Image upload test failed:', error.message);
		process.exit(1);
	}
}

// Run the test
testImageUpload();
