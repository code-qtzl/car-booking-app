const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/cars');
fs.ensureDirSync(uploadsDir);

// Configure multer storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		// Generate unique filename with timestamp and original extension
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const extension = path.extname(file.originalname);
		cb(null, 'car-' + uniqueSuffix + extension);
	},
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
	// Check if file is an image
	if (file.mimetype.startsWith('image/')) {
		// Allowed image types
		const allowedTypes = [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/webp',
		];

		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new Error(
					'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
				),
				false,
			);
		}
	} else {
		cb(new Error('Only image files are allowed.'), false);
	}
};

// Configure multer with options
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
		files: 10, // Maximum 10 files per upload
	},
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple image upload
const uploadMultiple = upload.array('images', 10);

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				success: false,
				error: {
					code: 'FILE_TOO_LARGE',
					message: 'File size exceeds 5MB limit',
				},
			});
		} else if (error.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({
				success: false,
				error: {
					code: 'TOO_MANY_FILES',
					message: 'Maximum 10 files allowed per upload',
				},
			});
		} else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
			return res.status(400).json({
				success: false,
				error: {
					code: 'UNEXPECTED_FIELD',
					message: 'Unexpected file field',
				},
			});
		}
	} else if (
		error.message.includes('Invalid file type') ||
		error.message.includes('Only image files')
	) {
		return res.status(400).json({
			success: false,
			error: {
				code: 'INVALID_FILE_TYPE',
				message: error.message,
			},
		});
	}

	// Pass other errors to the next error handler
	next(error);
};

module.exports = {
	uploadSingle,
	uploadMultiple,
	handleUploadError,
	uploadsDir,
};
