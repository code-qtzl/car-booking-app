import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchFilters = ({
	onFilterChange,
	onSearch,
	onSortChange,
	initialFilters = {},
	initialSearchQuery = '',
}) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// State for all filter options
	const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
	const [priceRange, setPriceRange] = useState({
		min: initialFilters.priceMin || '',
		max: initialFilters.priceMax || '',
	});
	const [fuelType, setFuelType] = useState(initialFilters.fuelType || []);
	const [transmission, setTransmission] = useState(
		initialFilters.transmission || '',
	);
	const [minSeating, setMinSeating] = useState(
		initialFilters.minSeating || '',
	);
	const [sortBy, setSortBy] = useState('make');
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

	// Available filter options
	const fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
	const transmissionOptions = ['Manual', 'Automatic'];
	const seatingOptions = [2, 4, 5, 7, 8];
	const sortOptions = [
		{ value: 'make', label: 'Make' },
		{ value: 'price', label: 'Price (Low to High)' },
		{ value: 'priceDesc', label: 'Price (High to Low)' },
		{ value: 'year', label: 'Year (Newest)' },
		{ value: 'yearDesc', label: 'Year (Oldest)' },
	];

	// Initialize from URL parameters on component mount
	useEffect(() => {
		const urlSearch = searchParams.get('search') || '';
		const urlPriceMin = searchParams.get('priceMin') || '';
		const urlPriceMax = searchParams.get('priceMax') || '';
		const urlFuelType = searchParams.getAll('fuelType') || [];
		const urlTransmission = searchParams.get('transmission') || '';
		const urlMinSeating = searchParams.get('minSeating') || '';
		const urlSortBy = searchParams.get('sortBy') || 'make';

		setSearchTerm(urlSearch);
		setPriceRange({ min: urlPriceMin, max: urlPriceMax });
		setFuelType(urlFuelType);
		setTransmission(urlTransmission);
		setMinSeating(urlMinSeating);
		setSortBy(urlSortBy);

		// Check if advanced filters are being used
		if (
			urlPriceMin ||
			urlPriceMax ||
			urlFuelType.length > 0 ||
			urlTransmission ||
			urlMinSeating
		) {
			setShowAdvancedFilters(true);
		}
	}, [searchParams]);

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce((term) => {
			onSearch(term);
			updateUrlParams({ search: term });
		}, 300),
		[onSearch],
	);

	// Handle search input change
	const handleSearchChange = (e) => {
		const value = e.target.value;
		setSearchTerm(value);
		debouncedSearch(value);
	};

	// Handle filter changes
	const handlePriceChange = (type, value) => {
		const newPriceRange = { ...priceRange, [type]: value };
		setPriceRange(newPriceRange);

		const filters = buildFiltersObject(
			newPriceRange,
			fuelType,
			transmission,
			minSeating,
		);
		onFilterChange(filters);
		updateUrlParams({
			priceMin: newPriceRange.min,
			priceMax: newPriceRange.max,
		});
	};

	const handleFuelTypeChange = (fuel) => {
		const newFuelType = fuelType.includes(fuel)
			? fuelType.filter((f) => f !== fuel)
			: [...fuelType, fuel];

		setFuelType(newFuelType);

		const filters = buildFiltersObject(
			priceRange,
			newFuelType,
			transmission,
			minSeating,
		);
		onFilterChange(filters);
		updateUrlParams({ fuelType: newFuelType });
	};

	const handleTransmissionChange = (value) => {
		setTransmission(value);

		const filters = buildFiltersObject(
			priceRange,
			fuelType,
			value,
			minSeating,
		);
		onFilterChange(filters);
		updateUrlParams({ transmission: value });
	};

	const handleSeatingChange = (value) => {
		setMinSeating(value);

		const filters = buildFiltersObject(
			priceRange,
			fuelType,
			transmission,
			value,
		);
		onFilterChange(filters);
		updateUrlParams({ minSeating: value });
	};

	const handleSortChange = (value) => {
		setSortBy(value);
		// Call parent component's sort change handler
		if (onSortChange) {
			onSortChange(value);
		}
		updateUrlParams({ sortBy: value });
	};

	// Build filters object for parent component
	const buildFiltersObject = (
		priceRange,
		fuelType,
		transmission,
		minSeating,
	) => {
		const filters = {};

		if (priceRange.min) filters.priceMin = parseFloat(priceRange.min);
		if (priceRange.max) filters.priceMax = parseFloat(priceRange.max);
		if (fuelType.length > 0) filters.fuelType = fuelType;
		if (transmission) filters.transmission = transmission;
		if (minSeating) filters.minSeating = parseInt(minSeating);

		return filters;
	};

	// Update URL parameters
	const updateUrlParams = (updates) => {
		const newParams = new URLSearchParams(searchParams);

		Object.entries(updates).forEach(([key, value]) => {
			if (key === 'fuelType' && Array.isArray(value)) {
				// Handle array values for fuel type
				newParams.delete('fuelType');
				value.forEach((fuel) => newParams.append('fuelType', fuel));
			} else if (value === '' || value === null || value === undefined) {
				newParams.delete(key);
			} else {
				newParams.set(key, value);
			}
		});

		setSearchParams(newParams);
	};

	// Reset all filters
	const handleResetFilters = () => {
		setSearchTerm('');
		setPriceRange({ min: '', max: '' });
		setFuelType([]);
		setTransmission('');
		setMinSeating('');
		setSortBy('make');
		setShowAdvancedFilters(false);

		// Clear URL parameters
		setSearchParams({});

		// Reset parent component state
		onSearch('');
		onFilterChange({});
		if (onSortChange) {
			onSortChange('make');
		}
	};

	// Clear search only
	const handleClearSearch = () => {
		setSearchTerm('');
		onSearch('');
		updateUrlParams({ search: '' });
	};

	// Check if any filters are active
	const hasActiveFilters = () => {
		return (
			searchTerm ||
			priceRange.min ||
			priceRange.max ||
			fuelType.length > 0 ||
			transmission ||
			minSeating
		);
	};

	return (
		<div className='search-filters'>
			{/* Main Search Bar */}
			<div className='search-bar'>
				<div className='search-input-container'>
					<input
						type='text'
						placeholder='Search by make, model, or year...'
						value={searchTerm}
						onChange={handleSearchChange}
						className='search-input'
						aria-label='Search cars'
					/>
					{searchTerm && (
						<button
							type='button'
							onClick={handleClearSearch}
							className='clear-search-btn'
							aria-label='Clear search'
						>
							×
						</button>
					)}
				</div>

				<button
					type='button'
					onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
					className={`filters-toggle ${
						showAdvancedFilters ? 'active' : ''
					}`}
					aria-label='Toggle advanced filters'
				>
					Filters{' '}
					{hasActiveFilters() && (
						<span className='filter-count'>●</span>
					)}
				</button>
			</div>

			{/* Advanced Filters Panel */}
			{showAdvancedFilters && (
				<div className='advanced-filters'>
					<div className='filters-grid'>
						{/* Price Range */}
						<div className='filter-group'>
							<label className='filter-label'>
								Price Range (per day)
							</label>
							<div className='price-inputs'>
								<input
									type='number'
									placeholder='Min'
									value={priceRange.min}
									onChange={(e) =>
										handlePriceChange('min', e.target.value)
									}
									className='price-input'
									min='0'
									step='10'
								/>
								<span className='price-separator'>to</span>
								<input
									type='number'
									placeholder='Max'
									value={priceRange.max}
									onChange={(e) =>
										handlePriceChange('max', e.target.value)
									}
									className='price-input'
									min='0'
									step='10'
								/>
							</div>
						</div>

						{/* Fuel Type */}
						<div className='filter-group'>
							<label className='filter-label'>Fuel Type</label>
							<div className='checkbox-group'>
								{fuelTypeOptions.map((fuel) => (
									<label
										key={fuel}
										className='checkbox-label'
									>
										<input
											type='checkbox'
											checked={fuelType.includes(fuel)}
											onChange={() =>
												handleFuelTypeChange(fuel)
											}
											className='checkbox-input'
										/>
										<span className='checkbox-text'>
											{fuel}
										</span>
									</label>
								))}
							</div>
						</div>

						{/* Transmission */}
						<div className='filter-group'>
							<label className='filter-label'>Transmission</label>
							<select
								value={transmission}
								onChange={(e) =>
									handleTransmissionChange(e.target.value)
								}
								className='filter-select'
							>
								<option value=''>Any</option>
								{transmissionOptions.map((trans) => (
									<option key={trans} value={trans}>
										{trans}
									</option>
								))}
							</select>
						</div>

						{/* Minimum Seating */}
						<div className='filter-group'>
							<label className='filter-label'>
								Minimum Seating
							</label>
							<select
								value={minSeating}
								onChange={(e) =>
									handleSeatingChange(e.target.value)
								}
								className='filter-select'
							>
								<option value=''>Any</option>
								{seatingOptions.map((seats) => (
									<option key={seats} value={seats}>
										{seats}+ seats
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Filter Actions */}
					<div className='filter-actions'>
						{hasActiveFilters() && (
							<button
								type='button'
								onClick={handleResetFilters}
								className='reset-filters-btn'
							>
								Clear All Filters
							</button>
						)}
					</div>
				</div>
			)}

			{/* Sort Controls */}
			<div className='sort-controls'>
				<label htmlFor='sort-select' className='sort-label'>
					Sort by:
				</label>
				<select
					id='sort-select'
					value={sortBy}
					onChange={(e) => handleSortChange(e.target.value)}
					className='sort-select'
				>
					{sortOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

// Debounce utility function
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export default SearchFilters;
