import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
	const { isAuthenticated, isAdmin, loading, checkAdminAccess } =
		useAuthContext();
	const [hasAdminAccess, setHasAdminAccess] = useState(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		const verifyAdminAccess = async () => {
			try {
				if (!isAuthenticated || !isAdmin) {
					setHasAdminAccess(false);
					setChecking(false);
					return;
				}

				// Verify admin access with backend
				const hasAccess = await checkAdminAccess();
				setHasAdminAccess(hasAccess);
			} catch (error) {
				console.error('Error verifying admin access:', error);
				setHasAdminAccess(false);
			} finally {
				setChecking(false);
			}
		};

		if (!loading) {
			verifyAdminAccess();
		}
	}, [isAuthenticated, isAdmin, loading, checkAdminAccess]);

	if (loading || checking) {
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

	if (!hasAdminAccess) {
		return <Navigate to='/' replace />;
	}

	return children;
};

export default AdminRoute;
