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
	},

	/**
	 * Clear user session data (logout)
	 */
	clearUserSession() {
		localStorage.removeItem('userId');
		localStorage.removeItem('userEmail');
		localStorage.removeItem('userRole');
		localStorage.removeItem('userType');
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
	 * Check if user session is valid by making a test API call
	 */
	async validateSession() {
		if (!this.isAuthenticated()) {
			return false;
		}

		try {
			// Make a simple API call to validate the session
			const response = await fetch('/api/cars?limit=1', {
				headers: this.getAuthHeaders(),
			});

			if (response.status === 401) {
				// Session is invalid, clear it
				this.clearUserSession();
				return false;
			}

			return response.ok;
		} catch (error) {
			console.warn('Session validation failed:', error);
			return true; // Assume valid if network error
		}
	},
};

export default authService;
