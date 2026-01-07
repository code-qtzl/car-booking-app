/**
 * API configuration for the frontend application
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
	// In development, use localhost
	if (import.meta.env.DEV) {
		return 'http://localhost:5000';
	}

	// In production, you might use a different URL
	// return 'https://your-production-api.com';

	// For now, default to localhost
	return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
	// Auth endpoints
	LOGIN: '/api/login/signin',
	SIGNUP: '/api/login/signup',
	VALIDATE_SESSION: '/api/login/validate-session',
	PROFILE: '/api/login/profile',

	// Car endpoints
	CARS: '/api/cars',
	CAR_SEARCH: '/api/cars/search',
	CAR_BY_ID: (id) => `/api/cars/${id}`,
	CAR_IMAGES: (id) => `/api/cars/${id}/images`,
	CAR_BY_AVAILABILITY: (status) => `/api/cars/availability/${status}`,

	// Admin endpoints
	ADMIN_CACHE_STATS: '/api/cars/admin/cache/stats',
};

export default {
	API_BASE_URL,
	API_ENDPOINTS,
};
