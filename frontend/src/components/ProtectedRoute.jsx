import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true }) => {
	const { isAuthenticated, loading } = useAuthContext();

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
