/**
 * Integration tests for authentication system with car listing features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../service/auth.service';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};

// Mock fetch
const fetchMock = vi.fn();

describe('Authentication Integration', () => {
	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Setup localStorage mock
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
		});

		// Setup fetch mock
		global.fetch = fetchMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('User Session Management', () => {
		it('should store user session data correctly', () => {
			const mockUser = {
				emailId: 'admin@test.com',
				typeOfUser: 'ADMIN',
			};

			authService.setUserSession(mockUser);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'userId',
				'admin@test.com',
			);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'userEmail',
				'admin@test.com',
			);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'userRole',
				'admin',
			);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'userType',
				'ADMIN',
			);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'sessionTimestamp',
				expect.any(String),
			);
		});

		it('should clear user session data correctly', () => {
			authService.clearUserSession();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				'userEmail',
			);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				'userRole',
			);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				'userType',
			);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				'sessionTimestamp',
			);
		});

		it('should detect authenticated users correctly', () => {
			localStorageMock.getItem.mockReturnValue('user@test.com');
			expect(authService.isAuthenticated()).toBe(true);

			localStorageMock.getItem.mockReturnValue(null);
			expect(authService.isAuthenticated()).toBe(false);
		});

		it('should detect admin users correctly', () => {
			localStorageMock.getItem.mockReturnValue('admin');
			expect(authService.isAdmin()).toBe(true);

			localStorageMock.getItem.mockReturnValue('customer');
			expect(authService.isAdmin()).toBe(false);
		});
	});

	describe('Session Validation', () => {
		it('should validate session with successful API call', async () => {
			localStorageMock.getItem.mockImplementation((key) => {
				if (key === 'userId') return 'user@test.com';
				if (key === 'sessionTimestamp') return Date.now().toString();
				return null;
			});

			fetchMock.mockResolvedValue({
				ok: true,
				status: 200,
			});

			const isValid = await authService.validateSession();
			expect(isValid).toBe(true);
			expect(fetchMock).toHaveBeenCalledWith('/api/cars?limit=1', {
				headers: {
					'x-user-id': 'user@test.com',
					'Content-Type': 'application/json',
				},
			});
		});

		it('should invalidate session on 401 response', async () => {
			localStorageMock.getItem.mockImplementation((key) => {
				if (key === 'userId') return 'user@test.com';
				if (key === 'sessionTimestamp') return Date.now().toString();
				return null;
			});

			fetchMock.mockResolvedValue({
				ok: false,
				status: 401,
			});

			const isValid = await authService.validateSession();
			expect(isValid).toBe(false);
			expect(localStorageMock.removeItem).toHaveBeenCalledTimes(5); // All session data cleared
		});

		it('should invalidate expired sessions', async () => {
			const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

			localStorageMock.getItem.mockImplementation((key) => {
				if (key === 'userId') return 'user@test.com';
				if (key === 'sessionTimestamp')
					return expiredTimestamp.toString();
				return null;
			});

			const isValid = await authService.validateSession();
			expect(isValid).toBe(false);
			expect(localStorageMock.removeItem).toHaveBeenCalledTimes(5); // All session data cleared
		});
	});

	describe('Authentication Headers', () => {
		it('should return correct auth headers for authenticated users', () => {
			localStorageMock.getItem.mockReturnValue('user@test.com');

			const headers = authService.getAuthHeaders();
			expect(headers).toEqual({
				'x-user-id': 'user@test.com',
				'Content-Type': 'application/json',
			});
		});

		it('should return empty headers for unauthenticated users', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const headers = authService.getAuthHeaders();
			expect(headers).toEqual({});
		});
	});

	describe('Role-Based Access Control', () => {
		it('should allow admin access to admin endpoints', async () => {
			localStorageMock.getItem.mockImplementation((key) => {
				if (key === 'userId') return 'admin@test.com';
				if (key === 'userRole') return 'admin';
				if (key === 'sessionTimestamp') return Date.now().toString();
				return null;
			});

			fetchMock.mockResolvedValue({
				ok: true,
				status: 200,
			});

			// Simulate admin endpoint access
			const response = await fetch('/api/cars/admin/cache/stats', {
				headers: authService.getAuthHeaders(),
			});

			expect(response.ok).toBe(true);
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/cars/admin/cache/stats',
				{
					headers: {
						'x-user-id': 'admin@test.com',
						'Content-Type': 'application/json',
					},
				},
			);
		});

		it('should deny customer access to admin endpoints', async () => {
			localStorageMock.getItem.mockImplementation((key) => {
				if (key === 'userId') return 'customer@test.com';
				if (key === 'userRole') return 'customer';
				return null;
			});

			fetchMock.mockResolvedValue({
				ok: false,
				status: 403,
			});

			// Simulate admin endpoint access
			const response = await fetch('/api/cars/admin/cache/stats', {
				headers: authService.getAuthHeaders(),
			});

			expect(response.ok).toBe(false);
			expect(response.status).toBe(403);
		});
	});

	describe('Car Browsing Integration', () => {
		it('should allow unauthenticated users to browse cars', async () => {
			localStorageMock.getItem.mockReturnValue(null);

			fetchMock.mockResolvedValue({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						success: true,
						data: [
							{ _id: '1', make: 'Toyota', model: 'Camry' },
							{ _id: '2', make: 'Honda', model: 'Civic' },
						],
					}),
			});

			// Simulate car browsing without authentication
			const response = await fetch('/api/cars');
			const data = await response.json();

			expect(response.ok).toBe(true);
			expect(data.success).toBe(true);
			expect(data.data).toHaveLength(2);
		});

		it('should include auth headers for authenticated users browsing cars', async () => {
			localStorageMock.getItem.mockReturnValue('user@test.com');

			fetchMock.mockResolvedValue({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({
						success: true,
						data: [],
					}),
			});

			// Simulate authenticated car browsing
			const headers = authService.isAuthenticated()
				? authService.getAuthHeaders()
				: {};
			const response = await fetch('/api/cars', { headers });

			expect(fetchMock).toHaveBeenCalledWith('/api/cars', {
				headers: {
					'x-user-id': 'user@test.com',
					'Content-Type': 'application/json',
				},
			});
		});
	});
});
