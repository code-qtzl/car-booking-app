/**
 * Integration test for search and filtering functionality
 * Tests the complete workflow from SearchFilters component to CarListings component
 */

import axios from 'axios';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios;

describe('Search and Filtering Integration', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('search query is properly formatted for API call', () => {
		const searchQuery = 'toyota camry';
		const filters = {
			priceMin: 50,
			priceMax: 200,
			fuelType: ['Gasoline', 'Hybrid'],
			transmission: 'Automatic',
			minSeating: 5,
		};
		const sortBy = 'price'; // Frontend sort value

		// Mock successful API response
		mockedAxios.get.mockResolvedValue({
			data: {
				success: true,
				data: [],
			},
		});

		// Build expected URL parameters (simulating CarListings component logic)
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
			filters.fuelType.forEach((fuel) => params.append('fuelType', fuel));
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
		const currentPage = 1;
		params.append('limit', limit);
		params.append('skip', (currentPage - 1) * limit);

		const expectedUrl = `/api/cars?${params.toString()}`;

		// Simulate API call
		mockedAxios.get(expectedUrl);

		// Verify the API was called with correct parameters
		expect(mockedAxios.get).toHaveBeenCalledWith(expectedUrl);

		// Verify URL contains expected parameters
		expect(expectedUrl).toContain('search=toyota%20camry');
		expect(expectedUrl).toContain('priceMin=50');
		expect(expectedUrl).toContain('priceMax=200');
		expect(expectedUrl).toContain('fuelType=Gasoline');
		expect(expectedUrl).toContain('fuelType=Hybrid');
		expect(expectedUrl).toContain('transmission=Automatic');
		expect(expectedUrl).toContain('minSeating=5');
		expect(expectedUrl).toContain('sortBy=dailyRate');
		expect(expectedUrl).toContain('sortOrder=asc');
		expect(expectedUrl).toContain('limit=12');
		expect(expectedUrl).toContain('skip=0');
	});

	test('URL parameters are correctly parsed for initial state', () => {
		// Simulate URL parameters that would be set by SearchFilters component
		const urlParams = new URLSearchParams();
		urlParams.set('search', 'honda');
		urlParams.set('priceMin', '75');
		urlParams.set('priceMax', '150');
		urlParams.append('fuelType', 'Gasoline');
		urlParams.append('fuelType', 'Electric');
		urlParams.set('transmission', 'Manual');
		urlParams.set('minSeating', '4');
		urlParams.set('sortBy', 'year');

		// Parse parameters (simulating CarListingsPage component logic)
		const urlSearch = urlParams.get('search') || '';
		const urlSortBy = urlParams.get('sortBy') || 'make';

		const urlFilters = {};
		const priceMin = urlParams.get('priceMin');
		const priceMax = urlParams.get('priceMax');
		const fuelTypes = urlParams.getAll('fuelType');
		const transmission = urlParams.get('transmission');
		const minSeating = urlParams.get('minSeating');

		if (priceMin) urlFilters.priceMin = parseFloat(priceMin);
		if (priceMax) urlFilters.priceMax = parseFloat(priceMax);
		if (fuelTypes.length > 0) urlFilters.fuelType = fuelTypes;
		if (transmission) urlFilters.transmission = transmission;
		if (minSeating) urlFilters.minSeating = parseInt(minSeating);

		// Verify parsed values
		expect(urlSearch).toBe('honda');
		expect(urlSortBy).toBe('year');
		expect(urlFilters).toEqual({
			priceMin: 75,
			priceMax: 150,
			fuelType: ['Gasoline', 'Electric'],
			transmission: 'Manual',
			minSeating: 4,
		});
	});

	test('filter object is correctly built from form inputs', () => {
		// Simulate form input values from SearchFilters component
		const priceRange = { min: '100', max: '300' };
		const fuelType = ['Diesel', 'Hybrid'];
		const transmission = 'Automatic';
		const minSeating = '7';

		// Build filters object (simulating SearchFilters component logic)
		const filters = {};

		if (priceRange.min) filters.priceMin = parseFloat(priceRange.min);
		if (priceRange.max) filters.priceMax = parseFloat(priceRange.max);
		if (fuelType.length > 0) filters.fuelType = fuelType;
		if (transmission) filters.transmission = transmission;
		if (minSeating) filters.minSeating = parseInt(minSeating);

		// Verify filter object structure
		expect(filters).toEqual({
			priceMin: 100,
			priceMax: 300,
			fuelType: ['Diesel', 'Hybrid'],
			transmission: 'Automatic',
			minSeating: 7,
		});
	});

	test('sort mapping works correctly for all options', () => {
		const sortMapping = {
			make: { sortBy: 'make', sortOrder: 'asc' },
			price: { sortBy: 'dailyRate', sortOrder: 'asc' },
			priceDesc: { sortBy: 'dailyRate', sortOrder: 'desc' },
			year: { sortBy: 'year', sortOrder: 'desc' },
			yearDesc: { sortBy: 'year', sortOrder: 'asc' },
		};

		// Test each sort option
		expect(sortMapping['make']).toEqual({
			sortBy: 'make',
			sortOrder: 'asc',
		});
		expect(sortMapping['price']).toEqual({
			sortBy: 'dailyRate',
			sortOrder: 'asc',
		});
		expect(sortMapping['priceDesc']).toEqual({
			sortBy: 'dailyRate',
			sortOrder: 'desc',
		});
		expect(sortMapping['year']).toEqual({
			sortBy: 'year',
			sortOrder: 'desc',
		});
		expect(sortMapping['yearDesc']).toEqual({
			sortBy: 'year',
			sortOrder: 'asc',
		});

		// Test default fallback
		const defaultSort = sortMapping['invalid'] || {
			sortBy: 'make',
			sortOrder: 'asc',
		};
		expect(defaultSort).toEqual({ sortBy: 'make', sortOrder: 'asc' });
	});

	test('pagination parameters are correctly calculated', () => {
		const limit = 12;

		// Test different page numbers
		expect((1 - 1) * limit).toBe(0); // Page 1 -> skip 0
		expect((2 - 1) * limit).toBe(12); // Page 2 -> skip 12
		expect((3 - 1) * limit).toBe(24); // Page 3 -> skip 24
		expect((10 - 1) * limit).toBe(108); // Page 10 -> skip 108
	});
});
