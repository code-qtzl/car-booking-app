import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import CarListings from '../components/CarListings';
import SearchFilters from '../components/SearchFilters';
import '../styles/CustomerDashboard.css';

function CustomerDashboard() {
	const navigate = useNavigate();
	const { user, logout, isAuthenticated } = useAuthContext();
	const [filters, setFilters] = useState({});
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('make');

	// Redirect if not authenticated
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login');
		}
	}, [isAuthenticated, navigate]);

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	const handleFilterChange = (newFilters) => {
		console.log('Filter change:', newFilters);
		setFilters(newFilters);
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
	};

	const handleSortChange = (newSortBy) => {
		setSortBy(newSortBy);
	};

	if (!isAuthenticated) {
		return (
			<div className='loading-container'>
				<div className='loading-spinner'>
					<div className='spinner'></div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='customer-dashboard'>
			{/* Header with user info and logout */}
			<header className='dashboard-header'>
				<div className='header-content'>
					<div className='user-info'>
						<h1>Welcome, {user?.emailId || 'Customer'}!</h1>
						<p>Browse and explore our available rental cars</p>
					</div>
					<div className='header-actions'>
						<button
							onClick={handleLogout}
							className='logout-btn'
							title='Logout'
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			{/* Navigation */}
			<nav className='dashboard-nav'>
				<div className='nav-content'>
					<Link to='/cars' className='nav-link active'>
						Browse Cars
					</Link>
					<Link to='/profile' className='nav-link'>
						My Profile
					</Link>
				</div>
			</nav>

			{/* Main content */}
			<main className='dashboard-main'>
				<div className='dashboard-content'>
					{/* Search and Filters Section */}
					<section className='search-section'>
						<h2>Find Your Perfect Car</h2>
						<SearchFilters
							onFilterChange={handleFilterChange}
							onSearch={handleSearch}
							onSortChange={handleSortChange}
							initialFilters={filters}
							initialSearchQuery={searchQuery}
							currentSort={sortBy}
						/>
					</section>

					{/* Car Listings Section */}
					<section className='listings-section'>
						<CarListings
							filters={filters}
							searchQuery={searchQuery}
							sortBy={sortBy}
						/>
					</section>
				</div>
			</main>
		</div>
	);
}

export default CustomerDashboard;
