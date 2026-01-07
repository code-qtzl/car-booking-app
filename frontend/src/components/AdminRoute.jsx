import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
	const [isAdmin, setIsAdmin] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAdminAccess = async () => {
			try {
				const userId = localStorage.getItem('userId');
				const userRole = localStorage.getItem('userRole');

				if (!userId) {
					setIsAdmin(false);
					setLoading(false);
					return;
				}

				// In a real application, you would verify the token with the server
				// For now, we'll trust the stored role
				if (userRole === 'admin') {
					setIsAdmin(true);
				} else {
					setIsAdmin(false);
				}
			} catch (error) {
				console.error('Error checking admin access:', error);
				setIsAdmin(false);
			} finally {
				setLoading(false);
			}
		};

		checkAdminAccess();
	}, []);

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
				<p>Verifying admin access...</p>
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to='/' replace />;
	}

	return children;
};

export default AdminRoute;
