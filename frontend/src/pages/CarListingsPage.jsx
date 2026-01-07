import { useState } from 'react';
import CarListings from '../components/CarListings';

const CarListingsPage = () => {
	const [filters, setFilters] = useState({});
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('make');

	const handleFilterChange = (newFilters) => {
		setFilters(newFilters);
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
	};

	const handleSortChange = (newSortBy) => {
		setSortBy(newSortBy);
	};

	return (
		<div className='car-listings-page'>
			<header className='page-header'>
				<h1>Available Cars</h1>
				<p>Browse our selection of rental vehicles</p>
			</header>

			<main className='page-content'>
				{/* Search and filters will be implemented in task 8 */}
				<div className='search-filters-placeholder'>
					<div className='basic-search'>
						<input
							type='text'
							placeholder='Search by make or model...'
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							className='search-input'
						/>
					</div>

					<div className='basic-sort'>
						<select
							value={sortBy}
							onChange={(e) => handleSortChange(e.target.value)}
							className='sort-select'
						>
							<option value='make'>Sort by Make</option>
							<option value='price'>Sort by Price</option>
							<option value='year'>Sort by Year</option>
						</select>
					</div>
				</div>

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
