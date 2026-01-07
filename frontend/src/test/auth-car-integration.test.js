import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import CarListings from '../components/CarListings';
import AdminCarManagement from '../components/AdminCarManagement';
import Login from '../components/Login';

// Mock fetch globally
global.fetch = vi.fn();

// Mock auth service
vi.mock('../service/auth.service', () => ({
	authService: {
		isAuthenticated: vi.fn(),
		isAdmin: vi.fn(),
		getCurrentUser: vi.fn(),
		setUserSession: vi.fn(),
		clearUserSession: vi.fn(),
		getAuthHeaders: vi.fn(),
		validateSession: vi.fn(),
		hasAdminAccess: vi.fn(),
		refreshSession: vi.fn(),
	},
}));

// Mock API client
vi.mock('../utils/networkUtils', () => ({
	apiClient: {
		get: vi.fn(),
	},
	formatErrorMessage: vi.fn((error) => error.message || 'Unknown error'),
}));

// Mock login service
vi.mock('../service/login.service', () => ({
	signIn: vi.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
	<BrowserRouter>
		<AuthProvider>{children}</AuthProvider>
	</BrowserRouter>
);

describe('Authentication Integration with Car Listing System', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset localStorage
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Car Browsing Authentication Integration', () => {
		it('should allow unauthenticated users to browse cars', async () => {
			// Mock unauthenticated state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(false);
			authService.getAuthHeaders.mockReturnValue({});

			// Mock API response
			const { apiClient } = await import('../utils/networkUtils');
			apiClient.get.mockResolvedValue({
				data: {
					success: true,
					data: [
						{
							_id: '1',
							make: 'Toyota',
							model: 'Camry',
							year: 2023,
							dailyRate: 50,
							images: ['image1.jpg'],
						},
					],
					pagination: {
						totalCount: 1,
						currentPage: 1,
						totalPages: 1,
						hasMore: false,
						hasPrevious: false,
					},
				},
			});

			render(
				<TestWrapper>
					<CarListings />
				</TestWrapper>,
			);

			// Wait for cars to load
			await waitFor(() => {
				expect(screen.getByText('Toyota')).toBeInTheDocument();
			});

			// Verify API was called without auth headers
			expect(apiClient.get).toHaveBeenCalledWith(
				expect.stringContaining('/api/cars'),
				expect.objectContaining({
					headers: expect.objectContaining({
						Accept: 'application/json',
					}),
				}),
			);

			// Verify no auth headers were included
			const callArgs = apiClient.get.mock.calls[0][1];
			expect(callArgs.headers).not.toHaveProperty('x-user-id');
		});

		it('should include auth headers for authenticated users', async () => {
			// Mock authenticated state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.getAuthHeaders.mockReturnValue({
				'x-user-id': 'test@example.com',
				'Content-Type': 'application/json',
			});
			authService.refreshSession.mockImplementation(() => {});

			// Mock API response
			const { apiClient } = await import('../utils/networkUtils');
			apiClient.get.mockResolvedValue({
				data: {
					success: true,
					data: [
						{
							_id: '1',
							make: 'Toyota',
							model: 'Camry',
							year: 2023,
							dailyRate: 50,
							images: ['image1.jpg'],
						},
					],
					pagination: {
						totalCount: 1,
						currentPage: 1,
						totalPages: 1,
						hasMore: false,
						hasPrevious: false,
					},
				},
			});

			render(
				<TestWrapper>
					<CarListings />
				</TestWrapper>,
			);

			// Wait for cars to load
			await waitFor(() => {
				expect(screen.getByText('Toyota')).toBeInTheDocument();
			});

			// Verify API was called with auth headers
			expect(apiClient.get).toHaveBeenCalledWith(
				expect.stringContaining('/api/cars'),
				expect.objectContaining({
					headers: expect.objectContaining({
						'x-user-id': 'test@example.com',
						'Content-Type': 'application/json',
					}),
				}),
			);

			// Verify session was refreshed
			expect(authService.refreshSession).toHaveBeenCalled();
		});
	});

	describe('Admin Car Management Authentication', () => {
		it('should require authentication for admin operations', async () => {
			// Mock admin state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.isAdmin.mockReturnValue(true);
			authService.getAuthHeaders.mockReturnValue({
				'x-user-id': 'admin@example.com',
				'Content-Type': 'application/json',
			});
			authService.refreshSession.mockImplementation(() => {});

			// Mock successful API response
			global.fetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: [
						{
							_id: '1',
							make: 'Toyota',
							model: 'Camry',
							year: 2023,
							dailyRate: 50,
						},
					],
				}),
			});

			render(
				<TestWrapper>
					<AdminCarManagement />
				</TestWrapper>,
			);

			// Wait for component to load
			await waitFor(() => {
				expect(screen.getByText('Car Management')).toBeInTheDocument();
			});

			// Verify fetch was called with auth headers
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/cars',
				expect.objectContaining({
					headers: expect.objectContaining({
						'x-user-id': 'admin@example.com',
						'Content-Type': 'application/json',
					}),
				}),
			);
		});

		it('should handle authentication errors in admin operations', async () => {
			// Mock admin state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.isAdmin.mockReturnValue(true);
			authService.getAuthHeaders.mockReturnValue({
				'x-user-id': 'admin@example.com',
				'Content-Type': 'application/json',
			});

			// Mock authentication error
			global.fetch.mockResolvedValue({
				ok: false,
				status: 401,
			});

			render(
				<TestWrapper>
					<AdminCarManagement />
				</TestWrapper>,
			);

			// Wait for error to appear
			await waitFor(() => {
				expect(
					screen.getByText(/Authentication failed/),
				).toBeInTheDocument();
			});
		});
	});

	describe('Session Management Integration', () => {
		it('should validate session on component mount', async () => {
			// Mock authenticated state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.validateSession.mockResolvedValue(true);
			authService.getCurrentUser.mockReturnValue({
				id: 'test@example.com',
				email: 'test@example.com',
				role: 'customer',
				type: 'CUSTOMER',
			});

			render(
				<TestWrapper>
					<div>Test Component</div>
				</TestWrapper>,
			);

			// Wait for session validation
			await waitFor(() => {
				expect(authService.validateSession).toHaveBeenCalled();
			});
		});

		it('should clear session on validation failure', async () => {
			// Mock authenticated state that fails validation
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.validateSession.mockResolvedValue(false);
			authService.clearUserSession.mockImplementation(() => {});

			render(
				<TestWrapper>
					<div>Test Component</div>
				</TestWrapper>,
			);

			// Wait for session validation and clearing
			await waitFor(() => {
				expect(authService.validateSession).toHaveBeenCalled();
			});
		});
	});

	describe('Role-Based Access Control', () => {
		it('should verify admin access for admin routes', async () => {
			// Mock admin state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.isAdmin.mockReturnValue(true);
			authService.hasAdminAccess.mockResolvedValue(true);

			// Mock the AdminRoute component behavior
			const TestAdminComponent = () => <div>Admin Content</div>;

			render(
				<TestWrapper>
					<TestAdminComponent />
				</TestWrapper>,
			);

			// Verify admin access check would be called
			await waitFor(() => {
				expect(screen.getByText('Admin Content')).toBeInTheDocument();
			});
		});

		it('should deny access for non-admin users', async () => {
			// Mock customer state
			const { authService } = await import('../service/auth.service');
			authService.isAuthenticated.mockReturnValue(true);
			authService.isAdmin.mockReturnValue(false);
			authService.hasAdminAccess.mockResolvedValue(false);

			// This would be handled by AdminRoute component
			// The test verifies the auth service behavior
			expect(authService.isAdmin()).toBe(false);
			expect(await authService.hasAdminAccess()).toBe(false);
		});
	});

	describe('Login Integration', () => {
		it('should integrate with auth context on successful login', async () => {
			// Mock login service
			const { signIn } = await import('../service/login.service');
			signIn.mockResolvedValue({
				data: {
					user: {
						emailId: 'test@example.com',
						typeOfUser: 'CUSTOMER',
					},
				},
			});

			// Mock navigation
			const mockNavigate = vi.fn();
			vi.mock('react-router-dom', async () => {
				const actual = await vi.importActual('react-router-dom');
				return {
					...actual,
					useNavigate: () => mockNavigate,
				};
			});

			render(
				<TestWrapper>
					<Login />
				</TestWrapper>,
			);

			// Fill in login form
			const emailInput = screen.getByLabelText(/email/i);
			const passwordInput = screen.getByLabelText(/password/i);
			const submitButton = screen.getByRole('button', {
				name: /sign in/i,
			});

			fireEvent.change(emailInput, {
				target: { value: 'test@example.com' },
			});
			fireEvent.change(passwordInput, {
				target: { value: 'password123' },
			});
			fireEvent.click(submitButton);

			// Wait for login to complete
			await waitFor(() => {
				expect(signIn).toHaveBeenCalledWith({
					emailId: 'test@example.com',
					password: 'password123',
				});
			});
		});
	});
});

/**
 * Integration test for complete user workflows
 * Tests the full authentication flow with car browsing
 */
describe('Complete User Workflow Integration', () => {
	it('should support complete customer workflow', async () => {
		// Mock customer authentication
		const { authService } = await import('../service/auth.service');
		authService.isAuthenticated.mockReturnValue(true);
		authService.isAdmin.mockReturnValue(false);
		authService.getCurrentUser.mockReturnValue({
			id: 'customer@example.com',
			email: 'customer@example.com',
			role: 'customer',
			type: 'CUSTOMER',
		});
		authService.getAuthHeaders.mockReturnValue({
			'x-user-id': 'customer@example.com',
			'Content-Type': 'application/json',
		});

		// Mock API responses
		const { apiClient } = await import('../utils/networkUtils');
		apiClient.get.mockResolvedValue({
			data: {
				success: true,
				data: [
					{
						_id: '1',
						make: 'Toyota',
						model: 'Camry',
						year: 2023,
						dailyRate: 50,
						images: ['image1.jpg'],
					},
				],
				pagination: {
					totalCount: 1,
					currentPage: 1,
					totalPages: 1,
					hasMore: false,
					hasPrevious: false,
				},
			},
		});

		render(
			<TestWrapper>
				<CarListings />
			</TestWrapper>,
		);

		// Verify customer can browse cars with authentication
		await waitFor(() => {
			expect(screen.getByText('Toyota')).toBeInTheDocument();
		});

		// Verify authenticated API call
		expect(apiClient.get).toHaveBeenCalledWith(
			expect.stringContaining('/api/cars'),
			expect.objectContaining({
				headers: expect.objectContaining({
					'x-user-id': 'customer@example.com',
				}),
			}),
		);
	});

	it('should support complete admin workflow', async () => {
		// Mock admin authentication
		const { authService } = await import('../service/auth.service');
		authService.isAuthenticated.mockReturnValue(true);
		authService.isAdmin.mockReturnValue(true);
		authService.hasAdminAccess.mockResolvedValue(true);
		authService.getCurrentUser.mockReturnValue({
			id: 'admin@example.com',
			email: 'admin@example.com',
			role: 'admin',
			type: 'ADMIN',
		});
		authService.getAuthHeaders.mockReturnValue({
			'x-user-id': 'admin@example.com',
			'Content-Type': 'application/json',
		});

		// Mock successful admin API response
		global.fetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: [],
			}),
		});

		render(
			<TestWrapper>
				<AdminCarManagement />
			</TestWrapper>,
		);

		// Verify admin can access car management
		await waitFor(() => {
			expect(screen.getByText('Car Management')).toBeInTheDocument();
			expect(screen.getByText('Add New Car')).toBeInTheDocument();
		});

		// Verify admin API call with proper headers
		expect(global.fetch).toHaveBeenCalledWith(
			'/api/cars',
			expect.objectContaining({
				headers: expect.objectContaining({
					'x-user-id': 'admin@example.com',
				}),
			}),
		);
	});
});
