import Login from '../components/Login';
import Signup from '../components/SignUp';
import AdminDashboard from '../pages/AdminDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import CarListingsPage from '../pages/CarListingsPage';
import CarDetailsPage from '../pages/CarDetailsPage';
import AdminRoute from '../components/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const AppRoutes = () => {
	const { isAuthenticated, isAdmin, loading } = useAuthContext();

	// Show loading while checking authentication
	if (loading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<Routes>
			{/* Public routes */}
			<Route
				path='/'
				element={
					isAuthenticated ? (
						<Navigate
							to={isAdmin ? '/admin' : '/customer'}
							replace
						/>
					) : (
						<Login />
					)
				}
			/>
			<Route
				path='/signup'
				element={
					isAuthenticated ? (
						<Navigate
							to={isAdmin ? '/admin' : '/customer'}
							replace
						/>
					) : (
						<Signup />
					)
				}
			/>

			{/* Admin routes */}
			<Route
				path='/admin'
				element={
					<AdminRoute>
						<AdminDashboard />
					</AdminRoute>
				}
			/>

			{/* Customer routes */}
			<Route
				path='/customer'
				element={
					<ProtectedRoute requireAuth={true}>
						<CustomerDashboard />
					</ProtectedRoute>
				}
			/>

			{/* Car browsing routes - accessible to all users (authenticated and unauthenticated) */}
			<Route
				path='/cars'
				element={
					<ProtectedRoute requireAuth={false}>
						<CarListingsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/cars/:carId'
				element={
					<ProtectedRoute requireAuth={false}>
						<CarDetailsPage />
					</ProtectedRoute>
				}
			/>

			{/* Catch all route */}
			<Route
				path='*'
				element={
					<Navigate
						to={
							isAuthenticated
								? isAdmin
									? '/admin'
									: '/customer'
								: '/'
						}
						replace
					/>
				}
			/>
		</Routes>
	);
};

export default AppRoutes;
