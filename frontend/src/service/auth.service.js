/**
 * Authentication service for managing user sessions and auth state
 */

export const authService = {
	/**
	 * Check if user is currently authenticated
	 */
	isAuthenticated() {
		return !!localStorage.getItem('userId');
	},

	/**
	 * Check if current user is an admin
	 */
	isAdmin() {
		const userRole = localStorage.getItem('userRole');
		return userRole === 'admin';
	},

	/**
	 * Get current user information
	 */
	getCurrentUser() {
		const userId = localStorage.getItem('userId');
		const userEmail = localStorage.getItem('userEmail');
		const userRole = localStorage.getItem('userRole');
		const userType = localStorage.getItem('userType');

		if (!userId) {
			return null;
		}

		return {
			id: userId,
			email: userEmail,
			role: userRole,
			type: userType,
		};
	},

	/**
	 * Store user session data after successful login
	 */
	setUserSession(user) {
		localStorage.setItem('userId', user.emailId || user.email);
		localStorage.setItem('userEmail', user.emailId || user.email);
		localStorage.setItem(
			'userRole',
			user.typeOfUser === 'ADMIN' ? 'admin' : 'customer',
		);
		localStorage.setItem('userType', user.typeOfUser);
		localStorage.setItem('sessionTimestamp', Date.now().toString());
	},

	/**
	 * Clear user session data (logout)
	 */
	clearUserSession() {
		localStorage.removeItem('userId');
		localStorage.removeItem('userEmail');
		localStorage.removeItem('userRole');
		localStorage.removeItem('userType');
		localStorage.removeItem('sessionTimestamp');
	},

	/**
	 * Get authentication headers for API requests
	 */
	getAuthHeaders() {
		const userId = localStorage.getItem('userId');
		if (!userId) {
			return {};
		}

		return {
			'x-user-id': userId,
			'Content-Type': 'application/json',
		};
	},

	/**
	 * Logout user and redirect to login page
	 */
	logout() {
		this.clearUserSession();
		window.location.href = '/';
	},

	/**
	 * Check if user session is valid by validating with backend
	 */
	async validateSession() {
		if (!this.isAuthenticated()) {
			return false;
		}

		// Check session age (expire after 24 hours)
		const sessionTimestamp = localStorage.getItem('sessionTimestamp');
		if (sessionTimestamp) {
			const sessionAge = Date.now() - parseInt(sessionTimestamp);
			const maxAge = 24 * 60 * 60 * 1000; // 24 hours

			if (sessionAge > maxAge) {
				this.clearUserSession();
				return false;
			}
		}

		try {
			// Use the new validation endpoint
			const response = await fetch(
				'http://localhost:5000/api/login/validate-session',
				{
					method: 'GET',
					headers: this.getAuthHeaders(),
				},
			);

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.user) {
					// Update session with fresh user data
					this.setUserSession(data.user);
					return true;
				}
			}

			// Session is invalid, clear it
			this.clearUserSession();
			return false;
		} catch (error) {
			console.warn('Session validation failed:', error);
			// On network error, assume session is still valid but don't refresh
			return true;
		}
	},

	/**
	 * Get user profile from backend
	 */
	async getUserProfile() {
		if (!this.isAuthenticated()) {
			throw new Error('User not authenticated');
		}

		try {
			const response = await fetch(
				'http://localhost:5000/api/login/profile',
				{
					method: 'GET',
					headers: this.getAuthHeaders(),
				},
			);

			if (!response.ok) {
				if (response.status === 401) {
					this.clearUserSession();
					throw new Error('Session expired');
				}
				throw new Error('Failed to fetch user profile');
			}

			const data = await response.json();
			if (data.success) {
				return data.data;
			}

			throw new Error(data.error?.message || 'Failed to fetch profile');
		} catch (error) {
			console.error('Error fetching user profile:', error);
			throw error;
		}
	},

	/**
	 * Refresh session timestamp to extend session
	 */
	refreshSession() {
		if (this.isAuthenticated()) {
			localStorage.setItem('sessionTimestamp', Date.now().toString());
		}
	},

	/**
	 * Check if user has permission for admin operations
	 */
	async hasAdminAccess() {
		if (!this.isAdmin()) {
			return false;
		}

		// Validate session first
		const isValid = await this.validateSession();
		if (!isValid) {
			return false;
		}

		try {
			// Test admin access with a simple admin endpoint
			const response = await fetch(
				'http://localhost:5000/api/cars/admin/cache/stats',
				{
					method: 'GET',
					headers: this.getAuthHeaders(),
				},
			);

			return response.ok;
		} catch (error) {
			console.warn('Admin access check failed:', error);
			// Fall back to stored role on network error
			return this.isAdmin();
		}
	},

	/**
	 * Enhanced session management for car browsing
	 * Allows both authenticated and unauthenticated access
	 */
	async initializeSession() {
		if (this.isAuthenticated()) {
			// Validate existing session
			const isValid = await this.validateSession();
			if (!isValid) {
				console.log('Session expired, cleared local storage');
			}
			return isValid;
		}
		return false; // No session to initialize
	},
};

export default authService;
