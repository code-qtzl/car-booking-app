const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB, createPerformanceIndexes } = require('./config/dbConfig');

// Initialize database connection and performance optimizations
const initializeDatabase = async () => {
	await connectDB(); // Connect to database

	// Create performance indexes after connection is established
	setTimeout(async () => {
		await createPerformanceIndexes();
	}, 2000); // Wait 2 seconds for connection to stabilize
};

initializeDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(
		`Server running on port ${PORT} with performance optimizations`,
	);
});
