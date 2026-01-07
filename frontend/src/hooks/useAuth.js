import { useState, useEffect, useCallback } from 'react';
import { authService } from '../service/auth.service';

/**
 * Custom hook for authentication state management
 * Provides centralized auth state and session management
 */
export const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [sessionChecked, setSessionChecked] = useState(false);

	// Initialize authentication state
	const initializeAuth = useCallback(async () => {
		try {
			setLoading(true);

			// Check if user has stored session
			if (authService.isAuthenticated()) {
				// Validate session with backend
				const isValid = await authService.validateSession();

				if (isValid) {
					const currentUser = authService.getCurrentUser();
					setUser(currentUser);
					setIsAuthenticated(true);
					setIsAdmin(authService.isAdmin());
				} else {
					// Session invalid, clear state
					setUser(null);
					setIsAuthenticated(false);
					setIsAdmin(false);
				}
			} else {
				// No stored session
				setUser(null);
				setIsAuthenticated(false);
				setIsAdmin(false);
			}
		} catch (error) {
			console.error('Error initializing auth:', error);
			// On error, clear auth state
			setUser(null);
			setIsAuthenticated(false);
			setIsAdmin(false);
		} finally {
			setLoading(false);
			setSessionChecked(true);
		}
	}, []);

	// Initialize on mount
	useEffect(() => {
		initializeAuth();
	}, [initializeAuth]);

	// Login function
	const login = useCallback((userData) => {
		authService.setUserSession(userData);
		const currentUser = authService.getCurrentUser();
		setUser(currentUser);
		setIsAuthenticated(true);
		setIsAdmin(authService.isAdmin());
	}, []);

	// Logout function
	const logout = useCallback(() => {
		authService.clearUserSession();
		setUser(null);
		setIsAuthenticated(false);
		setIsAdmin(false);
	}, []);

	// Refresh session
	const refreshSession = useCallback(() => {
		if (isAuthenticated) {
			authService.refreshSession();
		}
	}, [isAuthenticated]);

	// Check admin access
	const checkAdminAccess = useCallback(async () => {
		if (!isAuthenticated || !isAdmin) {
			return false;
		}

		try {
			return await authService.hasAdminAccess();
		} catch (error) {
			console.error('Error checking admin access:', error);
			return false;
		}
	}, [isAuthenticated, isAdmin]);

	// Get auth headers for API calls
	const getAuthHeaders = useCallback(() => {
		return authService.getAuthHeaders();
	}, []);

	return {
		// State
		isAuthenticated,
		isAdmin,
		user,
		loading,
		sessionChecked,

		// Actions
		login,
		logout,
		refreshSession,
		checkAdminAccess,
		getAuthHeaders,
		initializeAuth,
	};
};

export default useAuth;
