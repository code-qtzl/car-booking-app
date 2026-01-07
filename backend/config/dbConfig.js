const mongoose = require('mongoose');

let env = require('dotenv');
env.config();

// Enhanced MongoDB connection with performance optimizations
const connectDB = async () => {
	try {
		// Enhanced connection options for better performance
		const connectionOptions = {
			// Connection pool settings for better performance
			maxPoolSize: 10, // Maintain up to 10 socket connections
			serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			bufferMaxEntries: 0, // Disable mongoose buffering
			bufferCommands: false, // Disable mongoose buffering

			// Performance optimizations
			maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
			compressors: 'zlib', // Enable compression for better network performance

			// Monitoring and debugging
			monitorCommands: process.env.NODE_ENV === 'development',
		};

		await mongoose.connect(process.env.MONGO_URL, connectionOptions);

		console.log('MongoDB Connected with performance optimizations');

		// Set up connection event listeners for monitoring
		mongoose.connection.on('connected', () => {
			console.log('Mongoose connected to MongoDB');
		});

		mongoose.connection.on('error', (err) => {
			console.error('Mongoose connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			console.log('Mongoose disconnected from MongoDB');
		});

		// Graceful shutdown
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			console.log('MongoDB connection closed through app termination');
			process.exit(0);
		});
	} catch (error) {
		console.error('DB Connection Failed', error);
		process.exit(1);
	}
};

// Function to create additional performance indexes
const createPerformanceIndexes = async () => {
	try {
		const Car = require('../model/car.model');

		// Create additional compound indexes for common query patterns
		await Car.collection.createIndex(
			{ isActive: 1, availabilityStatus: 1, dailyRate: 1, createdAt: -1 },
			{
				name: 'performance_listing_index',
				background: true,
			},
		);

		await Car.collection.createIndex(
			{
				isActive: 1,
				fuelType: 1,
				transmission: 1,
				seatingCapacity: 1,
				dailyRate: 1,
			},
			{
				name: 'performance_filter_index',
				background: true,
			},
		);

		await Car.collection.createIndex(
			{ isActive: 1, make: 1, model: 1, year: -1 },
			{
				name: 'performance_search_index',
				background: true,
			},
		);

		// Partial index for available cars only (most common query)
		await Car.collection.createIndex(
			{ dailyRate: 1, createdAt: -1 },
			{
				name: 'available_cars_index',
				partialFilterExpression: {
					isActive: true,
					availabilityStatus: 'Available',
				},
				background: true,
			},
		);

		console.log('Performance indexes created successfully');
	} catch (error) {
		console.error('Error creating performance indexes:', error);
	}
};

module.exports = { connectDB, createPerformanceIndexes };
