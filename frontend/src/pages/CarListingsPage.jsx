import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import CarListings from '../components/CarListings';
import SearchFilters from '../components/SearchFilters';
import '../styles/CarListingsPage.css';

const CarListingsPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isAuthenticated, user, logout } = useAuthContext();
	const [filters, setFilters] = useState({});
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('make');

	// Initialize state from URL parameters
	useEffect(() => {
		const urlSearch = searchParams.get('search') || '';
		const urlSortBy = searchParams.get('sortBy') || 'make';

		// Build filters from URL parameters
		const urlFilters = {};
		const priceMin = searchParams.get('priceMin');
		const priceMax = searchParams.get('priceMax');
		const fuelTypes = searchParams.getAll('fuelType');
		const transmission = searchParams.get('transmission');
		const minSeating = searchParams.get('minSeating');

		if (priceMin) urlFilters.priceMin = parseFloat(priceMin);
		if (priceMax) urlFilters.priceMax = parseFloat(priceMax);
		if (fuelTypes.length > 0) urlFilters.fuelType = fuelTypes;
		if (transmission) urlFilters.transmission = transmission;
		if (minSeating) urlFilters.minSeating = parseInt(minSeating);

		setSearchQuery(urlSearch);
		setFilters(urlFilters);
		setSortBy(urlSortBy);
	}, [searchParams]);

	const handleFilterChange = (newFilters) => {
		setFilters(newFilters);
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
	};

	const handleSortChange = (newSortBy) => {
		setSortBy(newSortBy);
	};

	const handleLogout = () => {
		logout();
		navigate('/');
	};

	return (
		<div className='car-listings-page'>
			<header className='page-header'>
				<div className='header-content'>
					<div className='header-text'>
						<h1>Available Cars</h1>
						<p>Browse our selection of rental vehicles</p>
					</div>
					{isAuthenticated && (
						<div className='header-actions'>
							<span className='user-email'>{user?.emailId}</span>
							<button
								onClick={handleLogout}
								className='logout-btn'
							>
								Logout
							</button>
						</div>
					)}
				</div>
			</header>

			<main className='page-content'>
				<SearchFilters
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onSortChange={handleSortChange}
					initialFilters={filters}
					initialSearchQuery={searchQuery}
				/>

				<CarListings
					filters={filters}
					searchQuery={searchQuery}
					sortBy={sortBy}
				/>
			</main>
		</div>
	);
};

export default CarListingsPage;
