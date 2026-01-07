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

				// Verify admin access with the backend
				try {
					const response = await fetch('/api/cars/admin/cache/stats', {
						method: 'GET',
						headers: {
							'x-user-id': userId,
							'Content-Type': 'application/json',
						},
					});

					if (response.ok) {
						// If the admin endpoint is accessible, user is admin
						setIsAdmin(true);
					} else if (response.status === 403) {
						// Forbidden - not an admin
						setIsAdmin(false);
					} else {
						// Other errors - fall back to stored role
						setIsAdmin(userRole === 'admin');
					}
				} catch (error) {
					// Network error - fall back to stored role
					console.warn('Could not verify admin access with server, using stored role');
					setIsAdmin(userRole === 'admin');
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

export default AdminRoute;
