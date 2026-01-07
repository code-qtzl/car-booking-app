import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CarCard from './CarCard';
import axios from 'axios';

const CarListings = ({ filters = {}, searchQuery = '', sortBy = 'make' }) => {
	const navigate = useNavigate();
	const [cars, setCars] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

	useEffect(() => {
		fetchCars();
	}, [filters, searchQuery, sortBy, currentPage]);

	const fetchCars = async () => {
		try {
			setLoading(true);
			setError(null);

			// Build query parameters
			const params = new URLSearchParams();

			if (searchQuery) {
				params.append('search', searchQuery);
			}

			if (filters.priceMin) {
				params.append('priceMin', filters.priceMin);
			}

			if (filters.priceMax) {
				params.append('priceMax', filters.priceMax);
			}

			if (filters.fuelType && filters.fuelType.length > 0) {
				filters.fuelType.forEach((fuel) =>
					params.append('fuelType', fuel),
				);
			}

			if (filters.transmission) {
				params.append('transmission', filters.transmission);
			}

			if (filters.minSeating) {
				params.append('minSeating', filters.minSeating);
			}

			// Map frontend sort values to backend format
			const sortMapping = {
				make: { sortBy: 'make', sortOrder: 'asc' },
				price: { sortBy: 'dailyRate', sortOrder: 'asc' },
				priceDesc: { sortBy: 'dailyRate', sortOrder: 'desc' },
				year: { sortBy: 'year', sortOrder: 'desc' },
				yearDesc: { sortBy: 'year', sortOrder: 'asc' },
			};

			const sortConfig = sortMapping[sortBy] || {
				sortBy: 'make',
				sortOrder: 'asc',
			};
			params.append('sortBy', sortConfig.sortBy);
			params.append('sortOrder', sortConfig.sortOrder);

			const limit = 12;
			params.append('limit', limit);
			params.append('skip', (currentPage - 1) * limit);

			const response = await axios.get(`/api/cars?${params.toString()}`);

			if (response.data.success) {
				setCars(response.data.data || []);
			} else {
				throw new Error(
					response.data.message || 'Failed to fetch cars',
				);
			}
		} catch (err) {
			console.error('Error fetching cars:', err);
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load cars',
			);
			setCars([]);
		} finally {
			setLoading(false);
		}
	};

	const handleCarClick = (carId) => {
		// Navigate to car details
		navigate(`/cars/${carId}`);
	};

	const handleFilterChange = (newFilters) => {
		// This will be called by parent component when filters change
		setCurrentPage(1); // Reset to first page when filters change
	};

	const handleSearch = (query) => {
		// This will be called by parent component when search changes
		setCurrentPage(1); // Reset to first page when search changes
	};

	if (loading) {
		return (
			<div className='loading-container'>
				<div className='loading-spinner' aria-label='Loading cars'>
					<div className='spinner'></div>
					<p>Loading available cars...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='error-container'>
				<div className='error-message'>
					<h3>Unable to load cars</h3>
					<p>{error}</p>
					<button onClick={fetchCars} className='retry-button'>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (cars.length === 0) {
		return (
			<div className='empty-state'>
				<div className='empty-message'>
					<h3>No cars available</h3>
					<p>
						{searchQuery || Object.keys(filters).length > 0
							? 'No cars match your current search criteria. Try adjusting your filters.'
							: 'There are currently no vehicles available for rental.'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='car-listings'>
			<div className='listings-header'>
				<div className='results-info'>
					<span>
						{cars.length} car{cars.length !== 1 ? 's' : ''}{' '}
						available
					</span>
				</div>

				<div className='view-controls'>
					<button
						className={`view-toggle ${
							viewMode === 'grid' ? 'active' : ''
						}`}
						onClick={() => setViewMode('grid')}
						aria-label='Grid view'
					>
						⊞
					</button>
					<button
						className={`view-toggle ${
							viewMode === 'list' ? 'active' : ''
						}`}
						onClick={() => setViewMode('list')}
						aria-label='List view'
					>
						☰
					</button>
				</div>
			</div>

			<div className={`cars-container ${viewMode}-view`}>
				{cars.map((car) => (
					<CarCard key={car._id} car={car} onClick={handleCarClick} />
				))}
			</div>

			{/* Pagination placeholder - will be implemented in future task */}
			<div className='pagination-container'>
				{/* Pagination controls will be added in task 9 */}
			</div>
		</div>
	);
};

export default CarListings;
