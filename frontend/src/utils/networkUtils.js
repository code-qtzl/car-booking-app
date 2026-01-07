import axios from 'axios';

/**
 * Network utility functions for error handling and retry mechanisms
 */

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
	maxRetries: 3,
	retryDelay: 1000, // 1 second
	retryDelayMultiplier: 2, // Exponential backoff
	retryableStatusCodes: [408, 429, 500, 502, 503, 504],
	retryableErrors: ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'],
};

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @param {Object} config - Retry configuration
 * @returns {boolean} Whether the error is retryable
 */
const isRetryableError = (error, config = DEFAULT_RETRY_CONFIG) => {
	// Network errors (no response)
	if (!error.response) {
		// Check for specific error codes
		if (error.code && config.retryableErrors.includes(error.code)) {
			return true;
		}
		// Timeout errors
		if (error.message && error.message.toLowerCase().includes('timeout')) {
			return true;
		}
		// Network errors
		if (error.message && error.message.toLowerCase().includes('network')) {
			return true;
		}
		return false;
	}

	// HTTP status code errors
	const status = error.response.status;
	return config.retryableStatusCodes.includes(status);
};

/**
 * Calculate retry delay with exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
const calculateRetryDelay = (attempt, config = DEFAULT_RETRY_CONFIG) => {
	const delay =
		config.retryDelay * Math.pow(config.retryDelayMultiplier, attempt);
	// Add jitter to prevent thundering herd
	const jitter = Math.random() * 0.1 * delay;
	return Math.floor(delay + jitter);
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise} Promise that resolves with the function result
 */
const retryWithBackoff = async (fn, config = DEFAULT_RETRY_CONFIG) => {
	let lastError;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Don't retry on the last attempt
			if (attempt === config.maxRetries) {
				break;
			}

			// Check if error is retryable
			if (!isRetryableError(error, config)) {
				break;
			}

			// Calculate delay and wait
			const delay = calculateRetryDelay(attempt, config);
			console.warn(
				`Request failed (attempt ${attempt + 1}/${
					config.maxRetries + 1
				}), retrying in ${delay}ms:`,
				error.message,
			);
			await sleep(delay);
		}
	}

	throw lastError;
};

/**
 * Create an axios instance with retry interceptors
 * @param {Object} axiosConfig - Axios configuration
 * @param {Object} retryConfig - Retry configuration
 * @returns {Object} Configured axios instance
 */
const createAxiosWithRetry = (
	axiosConfig = {},
	retryConfig = DEFAULT_RETRY_CONFIG,
) => {
	const instance = axios.create({
		timeout: 10000, // 10 second timeout
		...axiosConfig,
	});

	// Request interceptor for logging
	instance.interceptors.request.use(
		(config) => {
			console.debug(
				'Making request:',
				config.method?.toUpperCase(),
				config.url,
			);
			return config;
		},
		(error) => {
			console.error('Request error:', error);
			return Promise.reject(error);
		},
	);

	// Response interceptor for retry logic
	instance.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			const config = error.config;

			// Initialize retry count if not present
			if (!config.__retryCount) {
				config.__retryCount = 0;
			}

			// Check if we should retry
			if (
				config.__retryCount < retryConfig.maxRetries &&
				isRetryableError(error, retryConfig)
			) {
				config.__retryCount++;

				const delay = calculateRetryDelay(
					config.__retryCount - 1,
					retryConfig,
				);
				console.warn(
					`Request failed (attempt ${config.__retryCount}/${
						retryConfig.maxRetries + 1
					}), retrying in ${delay}ms:`,
					error.message,
				);

				await sleep(delay);
				return instance(config);
			}

			return Promise.reject(error);
		},
	);

	return instance;
};

/**
 * Format error message for user display
 * @param {Error} error - The error to format
 * @returns {string} User-friendly error message
 */
const formatErrorMessage = (error) => {
	// Network errors (no response)
	if (!error.response) {
		if (
			error.code === 'ECONNABORTED' ||
			error.message.includes('timeout')
		) {
			return 'Request timed out. Please check your internet connection and try again.';
		}
		if (
			error.code === 'ENOTFOUND' ||
			error.message.includes('Network Error')
		) {
			return 'Unable to connect to the server. Please check your internet connection.';
		}
		return 'A network error occurred. Please try again.';
	}

	// HTTP errors with response
	const status = error.response.status;
	const data = error.response.data;

	// Use server-provided error message if available
	if (data && data.error && data.error.message) {
		return data.error.message;
	}

	// Default messages based on status code
	switch (status) {
		case 400:
			return 'Invalid request. Please check your input and try again.';
		case 401:
			return 'Authentication required. Please log in and try again.';
		case 403:
			return 'You do not have permission to perform this action.';
		case 404:
			return 'The requested resource was not found.';
		case 409:
			return 'A conflict occurred. The resource may already exist.';
		case 429:
			return 'Too many requests. Please wait a moment and try again.';
		case 500:
			return 'A server error occurred. Please try again later.';
		case 502:
		case 503:
		case 504:
			return 'The server is temporarily unavailable. Please try again later.';
		default:
			return `An error occurred (${status}). Please try again.`;
	}
};

/**
 * Extract validation errors from server response
 * @param {Error} error - The error to extract validation errors from
 * @returns {Object} Object containing field-specific validation errors
 */
const extractValidationErrors = (error) => {
	if (!error.response || !error.response.data) {
		return {};
	}

	const data = error.response.data;

	// Check for validation error structure
	if (
		data.error &&
		data.error.code === 'VALIDATION_ERROR' &&
		data.error.details
	) {
		return data.error.details;
	}

	return {};
};

/**
 * Check if error is a validation error
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is a validation error
 */
const isValidationError = (error) => {
	return (
		error.response &&
		error.response.status === 400 &&
		error.response.data &&
		error.response.data.error &&
		error.response.data.error.code === 'VALIDATION_ERROR'
	);
};

// Create default axios instance with retry
const apiClient = createAxiosWithRetry();

export {
	retryWithBackoff,
	createAxiosWithRetry,
	formatErrorMessage,
	extractValidationErrors,
	isValidationError,
	isRetryableError,
	calculateRetryDelay,
	apiClient,
	DEFAULT_RETRY_CONFIG,
};
