const express = require('express');
const userRoutes = require('./router/user.router');
const carRoutes = require('./router/car.router');
const { errorHandler } = require('./middleware/auth.middleware');
const { enhancedErrorHandler } = require('./middleware/validation.middleware');

const app = express();
// adding the middleware

// CORS middleware
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS',
	);
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id',
	);
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
});

app.use(express.json());

// providing main path
app.use('/api/login', userRoutes);
app.use('/api/cars', carRoutes);

// Error handling middleware (should be last)
app.use(enhancedErrorHandler);

module.exports = app;
