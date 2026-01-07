import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAuthentication = () => {
			try {
				const userId = localStorage.getItem('userId');
				const userRole = localStorage.getItem('userRole');

				if (requireAuth) {
					// Route requires authentication
					setIsAuthenticated(!!userId);
				} else {
					// Route doesn't require authentication (like public car browsing)
					setIsAuthenticated(true);
				}
			} catch (error) {
				console.error('Error checking authentication:', error);
				setIsAuthenticated(false);
			} finally {
				setLoading(false);
			}
		};

		checkAuthentication();
	}, [requireAuth]);

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

	if (requireAuth && !isAuthenticated) {
		return <Navigate to='/' replace />;
	}

	return children;
};

export default ProtectedRoute;
