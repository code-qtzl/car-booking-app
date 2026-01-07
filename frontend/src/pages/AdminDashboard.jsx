import React, { useState, useEffect } from 'react';
import AdminCarManagement from '../components/AdminCarManagement';

function AdminDashboard() {
	const [activeTab, setActiveTab] = useState('cars');
	const [userRole, setUserRole] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is admin
		const checkAdminAccess = () => {
			const userId = localStorage.getItem('userId');
			const userRole = localStorage.getItem('userRole');

			if (!userId || userRole !== 'admin') {
				// Redirect to login if not admin
				window.location.href = '/';
				return;
			}

			setUserRole(userRole);
			setLoading(false);
		};

		checkAdminAccess();
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('userId');
		localStorage.removeItem('userRole');
		window.location.href = '/';
	};

	if (loading) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>Loading admin dashboard...</p>
			</div>
		);
	}

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
			<nav
				style={{
					backgroundColor: '#343a40',
					color: 'white',
					padding: '15px 20px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
				<button
					onClick={handleLogout}
					style={{
						backgroundColor: '#dc3545',
						color: 'white',
						border: 'none',
						padding: '8px 16px',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Logout
				</button>
			</nav>

			<div style={{ display: 'flex' }}>
				<aside
					style={{
						width: '250px',
						backgroundColor: 'white',
						minHeight: 'calc(100vh - 70px)',
						borderRight: '1px solid #dee2e6',
						padding: '20px 0',
					}}
				>
					<nav>
						<ul
							style={{ listStyle: 'none', padding: 0, margin: 0 }}
						>
							<li>
								<button
									onClick={() => setActiveTab('cars')}
									style={{
										width: '100%',
										padding: '15px 20px',
										border: 'none',
										backgroundColor:
											activeTab === 'cars'
												? '#007bff'
												: 'transparent',
										color:
											activeTab === 'cars'
												? 'white'
												: '#333',
										textAlign: 'left',
										cursor: 'pointer',
										fontSize: '16px',
									}}
								>
									Car Management
								</button>
							</li>
							<li>
								<button
									onClick={() => setActiveTab('users')}
									style={{
										width: '100%',
										padding: '15px 20px',
										border: 'none',
										backgroundColor:
											activeTab === 'users'
												? '#007bff'
												: 'transparent',
										color:
											activeTab === 'users'
												? 'white'
												: '#333',
										textAlign: 'left',
										cursor: 'pointer',
										fontSize: '16px',
									}}
								>
									User Management
								</button>
							</li>
							<li>
								<button
									onClick={() => setActiveTab('reports')}
									style={{
										width: '100%',
										padding: '15px 20px',
										border: 'none',
										backgroundColor:
											activeTab === 'reports'
												? '#007bff'
												: 'transparent',
										color:
											activeTab === 'reports'
												? 'white'
												: '#333',
										textAlign: 'left',
										cursor: 'pointer',
										fontSize: '16px',
									}}
								>
									Reports
								</button>
							</li>
						</ul>
					</nav>
				</aside>

				<main style={{ flex: 1, padding: '20px' }}>
					{activeTab === 'cars' && <AdminCarManagement />}
					{activeTab === 'users' && (
						<div>
							<h2>User Management</h2>
							<p>User management functionality coming soon...</p>
						</div>
					)}
					{activeTab === 'reports' && (
						<div>
							<h2>Reports</h2>
							<p>Reports functionality coming soon...</p>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

export default AdminDashboard;
