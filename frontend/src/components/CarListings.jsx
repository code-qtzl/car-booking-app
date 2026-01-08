import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CarCard from './CarCard';
import { apiClient, formatErrorMessage } from '../utils/networkUtils';
import { useAuthContext } from '../contexts/AuthContext';

const CarListings = ({ filters = {}, searchQuery = '', sortBy = 'make' }) => {
	const navigate = useNavigate();
	const { getAuthHeaders, refreshSession, isAuthenticated } =
		useAuthContext();
	const [cars, setCars] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState({
		totalCount: 0,
		totalPages: 0,
		currentPage: 1,
		hasMore: false,
		hasPrevious: false,
	});
	const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
	const [scrollMode, setScrollMode] = useState('pagination'); // 'pagination' or 'infinite'
	const [loadingMore, setLoadingMore] = useState(false);

	// Enhanced cache for API responses to improve performance with better memory management
	const [responseCache, setResponseCache] = useState(new Map());
	const cacheRef = useRef(new Map()); // Use ref to prevent unnecessary re-renders

	// Ref for infinite scroll
	const loadMoreRef = useRef(null);
	const isInitialLoad = useRef(true);

	// Enhanced cache management with size limits, TTL, and LRU eviction
	const manageCacheSize = useCallback((cache) => {
		const maxCacheSize = 100; // Increased for better performance
		const maxAge = 10 * 60 * 1000; // 10 minutes TTL
		const now = Date.now();

		// Remove expired entries first
		for (const [key, value] of cache.entries()) {
			if (now - value.timestamp > maxAge) {
				cache.delete(key);
			}
		}

		// If still over limit, remove oldest entries (LRU)
		if (cache.size >= maxCacheSize) {
			const entries = Array.from(cache.entries())
				.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
				.slice(0, Math.floor(maxCacheSize * 0.3)); // Remove 30% of entries

			entries.forEach(([key]) => cache.delete(key));
		}

		return cache;
	}, []);

	useEffect(() => {
		if (isInitialLoad.current) {
			fetchCars(true);
			isInitialLoad.current = false;
		} else {
			fetchCars(true);
		}
	}, [filters, searchQuery, sortBy]);

	useEffect(() => {
		if (scrollMode === 'pagination') {
			fetchCars(true);
		}
	}, [currentPage, scrollMode]);

	// Infinite scroll observer
	useEffect(() => {
		if (scrollMode !== 'infinite' || !loadMoreRef.current) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (
					entry.isIntersecting &&
					pagination.hasMore &&
					!loadingMore
				) {
					loadMoreCars();
				}
			},
			{
				rootMargin: '200px',
				threshold: 0.1,
			},
		);

		observer.observe(loadMoreRef.current);

		return () => observer.disconnect();
	}, [scrollMode, pagination.hasMore, loadingMore]);

	const fetchCars = async (resetList = false) => {
		try {
			setLoading(resetList);
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

			const pageToFetch = resetList ? 1 : currentPage;
			params.append('skip', (pageToFetch - 1) * limit);

			const queryString = params.toString();
			console.log('Making API call to:', `/api/cars?${queryString}`);
			console.log('Filters:', filters);

			// Enhanced cache key with better collision avoidance
			const cacheKey = `cars-${queryString}-${pageToFetch}`;

			// Check cache first for performance optimization with TTL
			const cachedEntry = cacheRef.current.get(cacheKey);
			if (cachedEntry) {
				const now = Date.now();
				const maxAge = 5 * 60 * 1000; // 5 minutes TTL

				if (now - cachedEntry.timestamp < maxAge) {
					// Update last accessed time for LRU
					cachedEntry.lastAccessed = now;

					if (resetList || scrollMode === 'pagination') {
						setCars(cachedEntry.data || []);
					} else {
						setCars((prev) => [
							...prev,
							...(cachedEntry.data || []),
						]);
					}
					setPagination(cachedEntry.pagination || {});
					setLoading(false);
					return;
				} else {
					// Remove expired entry
					cacheRef.current.delete(cacheKey);
				}
			}

			// Prepare headers - include auth headers if user is authenticated
			const headers = {
				Accept: 'application/json',
				'Cache-Control': 'max-age=300', // Request 5 minute cache
				...(isAuthenticated ? getAuthHeaders() : {}),
			};

			const response = await apiClient.get(`/api/cars?${queryString}`, {
				// Enhanced request configuration for better performance
				timeout: 10000, // 10 second timeout
				headers,
			});

			console.log('API Response:', response.data);

			if (response.data.success) {
				const responseData = {
					data: response.data.data || [],
					pagination: response.data.pagination || {},
					timestamp: Date.now(),
					lastAccessed: Date.now(),
				};

				if (resetList || scrollMode === 'pagination') {
					setCars(responseData.data);
				} else {
					setCars((prev) => [...prev, ...responseData.data]);
				}
				setPagination(responseData.pagination);

				// Enhanced cache management with performance optimization
				cacheRef.current = manageCacheSize(cacheRef.current);
				cacheRef.current.set(cacheKey, responseData);

				// Refresh session if authenticated
				if (isAuthenticated) {
					refreshSession();
				}
			} else {
				throw new Error(
					response.data.message || 'Failed to fetch cars',
				);
			}
		} catch (err) {
			console.error('Error fetching cars:', err);
			console.error('Error details:', {
				message: err.message,
				response: err.response,
				status: err.response?.status,
				data: err.response?.data,
			});
			const errorMessage = formatErrorMessage(err);
			setError(errorMessage);
			if (resetList) {
				setCars([]);
				setPagination({
					totalCount: 0,
					totalPages: 0,
					currentPage: 1,
					hasMore: false,
					hasPrevious: false,
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const loadMoreCars = async () => {
		if (loadingMore || !pagination.hasMore) return;

		setLoadingMore(true);
		const nextPage = Math.floor(cars.length / 12) + 1;

		try {
			// Build query parameters for next page
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
			params.append('skip', (nextPage - 1) * limit);

			const queryString = params.toString();

			// Enhanced cache key for load more operations
			const cacheKey = `cars-${queryString}-${nextPage}`;

			// Check cache first with TTL
			const cachedEntry = cacheRef.current.get(cacheKey);
			if (cachedEntry) {
				const now = Date.now();
				const maxAge = 5 * 60 * 1000; // 5 minutes TTL

				if (now - cachedEntry.timestamp < maxAge) {
					cachedEntry.lastAccessed = now;
					setCars((prev) => [...prev, ...(cachedEntry.data || [])]);
					setPagination(cachedEntry.pagination || {});
					setLoadingMore(false);
					return;
				} else {
					cacheRef.current.delete(cacheKey);
				}
			}

			// Prepare headers - include auth headers if user is authenticated
			const headers = {
				Accept: 'application/json',
				'Cache-Control': 'max-age=300',
				...(isAuthenticated ? getAuthHeaders() : {}),
			};

			const response = await apiClient.get(`/api/cars?${queryString}`, {
				timeout: 10000,
				headers,
			});

			if (response.data.success) {
				const responseData = {
					data: response.data.data || [],
					pagination: response.data.pagination || {},
					timestamp: Date.now(),
					lastAccessed: Date.now(),
				};

				setCars((prev) => [...prev, ...responseData.data]);
				setPagination(responseData.pagination);

				// Cache the response with enhanced management
				cacheRef.current = manageCacheSize(cacheRef.current);
				cacheRef.current.set(cacheKey, responseData);

				// Refresh session if authenticated
				if (isAuthenticated) {
					refreshSession();
				}
			}
		} catch (err) {
			console.error('Error loading more cars:', err);
			const errorMessage = formatErrorMessage(err);
			setError(errorMessage);
		} finally {
			setLoadingMore(false);
		}
	};

	const handleCarClick = (carId) => {
		// Navigate to car details
		navigate(`/cars/${carId}`);
	};

	const handleFilterChange = (newFilters) => {
		// This will be called by parent component when filters change
		setCurrentPage(1); // Reset to first page when filters change
		cacheRef.current.clear(); // Clear cache when filters change for fresh data
		setCars([]); // Clear current cars for fresh load
	};

	const handleSearch = (query) => {
		// This will be called by parent component when search changes
		setCurrentPage(1); // Reset to first page when search changes
		cacheRef.current.clear(); // Clear cache when search changes for fresh data
		setCars([]); // Clear current cars for fresh load
	};

	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= pagination.totalPages) {
			setCurrentPage(newPage);
			// Scroll to top when changing pages
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleScrollModeChange = (mode) => {
		setScrollMode(mode);
		setCurrentPage(1);
		setCars([]);
		cacheRef.current.clear(); // Clear cache for fresh data
		fetchCars(true);
	};

	const renderPagination = () => {
		if (scrollMode === 'infinite' || pagination.totalPages <= 1)
			return null;

		const pages = [];
		const currentPage = pagination.currentPage;
		const totalPages = pagination.totalPages;

		// Calculate page range to show
		let startPage = Math.max(1, currentPage - 2);
		let endPage = Math.min(totalPages, currentPage + 2);

		// Adjust range if we're near the beginning or end
		if (currentPage <= 3) {
			endPage = Math.min(5, totalPages);
		}
		if (currentPage >= totalPages - 2) {
			startPage = Math.max(1, totalPages - 4);
		}

		// Previous button
		pages.push(
			<button
				key='prev'
				className={`pagination-btn ${
					!pagination.hasPrevious ? 'disabled' : ''
				}`}
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={!pagination.hasPrevious}
			>
				‹ Previous
			</button>,
		);

		// First page and ellipsis
		if (startPage > 1) {
			pages.push(
				<button
					key={1}
					className='pagination-btn'
					onClick={() => handlePageChange(1)}
				>
					1
				</button>,
			);
			if (startPage > 2) {
				pages.push(
					<span key='ellipsis1' className='pagination-ellipsis'>
						...
					</span>,
				);
			}
		}

		// Page numbers
		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<button
					key={i}
					className={`pagination-btn ${
						i === currentPage ? 'active' : ''
					}`}
					onClick={() => handlePageChange(i)}
				>
					{i}
				</button>,
			);
		}

		// Last page and ellipsis
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push(
					<span key='ellipsis2' className='pagination-ellipsis'>
						...
					</span>,
				);
			}
			pages.push(
				<button
					key={totalPages}
					className='pagination-btn'
					onClick={() => handlePageChange(totalPages)}
				>
					{totalPages}
				</button>,
			);
		}

		// Next button
		pages.push(
			<button
				key='next'
				className={`pagination-btn ${
					!pagination.hasMore ? 'disabled' : ''
				}`}
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={!pagination.hasMore}
			>
				Next ›
			</button>,
		);

		return (
			<div className='pagination-container'>
				<div className='pagination-info'>
					Showing {(currentPage - 1) * 12 + 1} to{' '}
					{Math.min(currentPage * 12, pagination.totalCount)} of{' '}
					{pagination.totalCount} cars
				</div>
				<div className='pagination-controls'>{pages}</div>
			</div>
		);
	};

	const renderInfiniteScrollLoader = () => {
		if (scrollMode !== 'infinite' || !pagination.hasMore) return null;

		return (
			<div ref={loadMoreRef} className='infinite-scroll-loader'>
				{loadingMore && (
					<div className='loading-spinner'>
						<div className='spinner'></div>
						<p>Loading more cars...</p>
					</div>
				)}
			</div>
		);
	};

	if (loading && cars.length === 0) {
		return (
			<div className='loading-container'>
				<div
					className='loading-spinner'
					data-testid='loading-indicator'
					aria-label='Loading cars'
				>
					<div className='spinner'></div>
					<p>Loading available cars...</p>
				</div>
			</div>
		);
	}

	if (error && cars.length === 0) {
		return (
			<div className='error-container'>
				<div className='error-message'>
					<h3>Unable to load cars</h3>
					<p>{error}</p>
					<button
						onClick={() => fetchCars(true)}
						className='retry-button'
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (cars.length === 0 && !loading) {
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
		<div className='car-listings' data-testid='car-listings-container'>
			<div className='listings-header'>
				<div className='results-info'>
					<span>
						{pagination.totalCount} car
						{pagination.totalCount !== 1 ? 's' : ''} available
					</span>
				</div>

				<div className='listings-controls'>
					<div className='scroll-mode-controls'>
						<button
							className={`mode-toggle ${
								scrollMode === 'pagination' ? 'active' : ''
							}`}
							onClick={() => handleScrollModeChange('pagination')}
							title='Pagination mode'
						>
							Pages
						</button>
						<button
							className={`mode-toggle ${
								scrollMode === 'infinite' ? 'active' : ''
							}`}
							onClick={() => handleScrollModeChange('infinite')}
							title='Infinite scroll mode'
						>
							Scroll
						</button>
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
			</div>

			<div
				className={`cars-container car-listings-grid ${viewMode}-view`}
				data-testid='car-listings-grid'
			>
				{cars.map((car) => (
					<CarCard key={car._id} car={car} onClick={handleCarClick} />
				))}
			</div>

			{renderPagination()}
			{renderInfiniteScrollLoader()}
		</div>
	);
};

export default CarListings;
