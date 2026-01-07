const mongoose = require('mongoose');
mongoose.pluralize(false);

const carSchema = new mongoose.Schema(
	{
		make: {
			type: String,
			required: [true, 'Make is required'],
			trim: true,
			maxlength: [50, 'Make cannot exceed 50 characters'],
		},
		model: {
			type: String,
			required: [true, 'Model is required'],
			trim: true,
			maxlength: [50, 'Model cannot exceed 50 characters'],
		},
		year: {
			type: Number,
			required: [true, 'Year is required'],
			min: [1900, 'Year must be 1900 or later'],
			max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
		},
		dailyRate: {
			type: Number,
			required: [true, 'Daily rate is required'],
			min: [0, 'Daily rate must be a positive number'],
		},
		fuelType: {
			type: String,
			required: [true, 'Fuel type is required'],
			enum: {
				values: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
				message:
					'Fuel type must be one of: Gasoline, Diesel, Electric, Hybrid',
			},
		},
		transmission: {
			type: String,
			required: [true, 'Transmission is required'],
			enum: {
				values: ['Manual', 'Automatic'],
				message: 'Transmission must be either Manual or Automatic',
			},
		},
		seatingCapacity: {
			type: Number,
			required: [true, 'Seating capacity is required'],
			min: [1, 'Seating capacity must be at least 1'],
			max: [50, 'Seating capacity cannot exceed 50'],
		},
		features: {
			type: [String],
			default: [],
			validate: {
				validator: function (features) {
					return features.every(
						(feature) =>
							typeof feature === 'string' &&
							feature.trim().length > 0,
					);
				},
				message: 'All features must be non-empty strings',
			},
		},
		images: {
			type: [String],
			default: [],
			validate: {
				validator: function (images) {
					return images.every(
						(image) =>
							typeof image === 'string' &&
							image.trim().length > 0,
					);
				},
				message: 'All image URLs must be non-empty strings',
			},
		},
		availabilityStatus: {
			type: String,
			required: [true, 'Availability status is required'],
			enum: {
				values: ['Available', 'Rented', 'Maintenance'],
				message:
					'Availability status must be one of: Available, Rented, Maintenance',
			},
			default: 'Available',
		},
		description: {
			type: String,
			trim: true,
			maxlength: [1000, 'Description cannot exceed 1000 characters'],
		},
		licensePlate: {
			type: String,
			required: [true, 'License plate is required'],
			unique: true,
			trim: true,
			uppercase: true,
			match: [
				/^[A-Z0-9\-\s]+$/,
				'License plate can only contain letters, numbers, hyphens, and spaces',
			],
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Created by user is required'],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		// Add indexes for performance optimization on searchable fields
		index: {
			make: 1,
			model: 1,
			year: 1,
			dailyRate: 1,
			fuelType: 1,
			transmission: 1,
			availabilityStatus: 1,
			isActive: 1,
		},
	},
);

// Create compound indexes for common search patterns and performance optimization
carSchema.index({ make: 1, model: 1 });
carSchema.index({ dailyRate: 1, availabilityStatus: 1 });
carSchema.index({ fuelType: 1, transmission: 1 });
carSchema.index({ isActive: 1, availabilityStatus: 1 });
carSchema.index({ createdAt: -1 }); // For default sorting
carSchema.index({ year: -1, dailyRate: 1 }); // For year and price sorting
carSchema.index({ seatingCapacity: 1, fuelType: 1 }); // For capacity and fuel filtering

// Additional performance optimization indexes
carSchema.index({ isActive: 1, availabilityStatus: 1, dailyRate: 1 }); // For filtered listings with price sorting
carSchema.index({ isActive: 1, make: 1, model: 1 }); // For make/model searches
carSchema.index({
	isActive: 1,
	fuelType: 1,
	transmission: 1,
	seatingCapacity: 1,
}); // For multi-filter queries
carSchema.index({ isActive: 1, createdAt: -1, _id: 1 }); // For consistent pagination
carSchema.index({ availabilityStatus: 1, dailyRate: 1, createdAt: -1 }); // For available cars sorted by price/date

// Text index for search functionality
carSchema.index({
	make: 'text',
	model: 'text',
	description: 'text',
});

// Sparse index for optional fields that are frequently queried
// Note: licensePlate already has unique: true in schema definition, so we don't need a separate index

// Custom validation for year to ensure it's reasonable
carSchema.pre('validate', function (next) {
	if (this.year && this.year > new Date().getFullYear() + 1) {
		this.invalidate(
			'year',
			'Year cannot be more than one year in the future',
		);
	}
	if (typeof next === 'function') {
		next();
	}
});

// Ensure license plate is unique and properly formatted
carSchema.pre('save', function (next) {
	if (this.licensePlate) {
		this.licensePlate = this.licensePlate.toUpperCase().trim();
	}
	if (typeof next === 'function') {
		next();
	}
});

module.exports = mongoose.model('Car', carSchema);
