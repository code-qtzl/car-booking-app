import Login from '../components/Login';
import Signup from '../components/SignUp';
import AdminDashboard from '../pages/AdminDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import CarListingsPage from '../pages/CarListingsPage';
import CarDetailsPage from '../pages/CarDetailsPage';
import AdminRoute from '../components/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute';
import { Route, Routes } from 'react-router-dom';

const AppRoutes = () => {
	return (
		<Routes>
			<Route path='/' element={<Login />} />
			<Route path='/signup' element={<Signup />} />
			<Route
				path='/admin'
				element={
					<AdminRoute>
						<AdminDashboard />
					</AdminRoute>
				}
			/>
			<Route 
				path='/customer' 
				element={
					<ProtectedRoute requireAuth={true}>
						<CustomerDashboard />
					</ProtectedRoute>
				} 
			/>
			{/* Car browsing routes - accessible to all authenticated users */}
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
		</Routes>
	);
};

export default AppRoutes;

export default AppRoutes;
