import Login from '../components/Login';
import Signup from '../components/SignUp';
import AdminDashboard from '../pages/AdminDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import CarListingsPage from '../pages/CarListingsPage';
import CarDetailsPage from '../pages/CarDetailsPage';
import AdminRoute from '../components/AdminRoute';
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
			<Route path='/customer' element={<CustomerDashboard />} />
			<Route path='/cars' element={<CarListingsPage />} />
			<Route path='/cars/:carId' element={<CarDetailsPage />} />
		</Routes>
	);
};

export default AppRoutes;
