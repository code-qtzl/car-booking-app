import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SearchFilters from './SearchFilters';

// Mock the useSearchParams hook
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom');
	return {
		...actual,
		useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
	};
});

// Wrapper component for router context
const RouterWrapper = ({ children }) => (
	<BrowserRouter>{children}</BrowserRouter>
);

describe('SearchFilters Component', () => {
	const mockOnFilterChange = vi.fn();
	const mockOnSearch = vi.fn();
	const mockOnSortChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders search input and filters toggle', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		expect(
			screen.getByPlaceholderText(/search by make, model, or year/i),
		).toBeInTheDocument();
		expect(screen.getByText(/filters/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
	});

	test('calls onSearch when search input changes', async () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		const searchInput = screen.getByPlaceholderText(
			/search by make, model, or year/i,
		);
		fireEvent.change(searchInput, { target: { value: 'toyota' } });

		// Wait for debounced search
		await waitFor(
			() => {
				expect(mockOnSearch).toHaveBeenCalledWith('toyota');
			},
			{ timeout: 500 },
		);
	});

	test('shows advanced filters when toggle is clicked', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		const filtersToggle = screen.getByText(/filters/i);
		fireEvent.click(filtersToggle);

		expect(screen.getByText(/price range/i)).toBeInTheDocument();
		expect(screen.getByText(/fuel type/i)).toBeInTheDocument();
		expect(screen.getByText(/transmission/i)).toBeInTheDocument();
	});

	test('calls onFilterChange when price filters are applied', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		// Open advanced filters
		const filtersToggle = screen.getByText(/filters/i);
		fireEvent.click(filtersToggle);

		// Set minimum price
		const minPriceInput = screen.getByPlaceholderText(/min/i);
		fireEvent.change(minPriceInput, { target: { value: '50' } });

		expect(mockOnFilterChange).toHaveBeenCalledWith({
			priceMin: 50,
		});
	});

	test('calls onSortChange when sort option changes', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		const sortSelect = screen.getByDisplayValue(/make/i);
		fireEvent.change(sortSelect, { target: { value: 'price' } });

		expect(mockOnSortChange).toHaveBeenCalledWith('price');
	});

	test('resets all filters when clear button is clicked', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
					initialSearchQuery='toyota'
					initialFilters={{ priceMin: 50 }}
				/>
			</RouterWrapper>,
		);

		// Open advanced filters to see reset button
		const filtersToggle = screen.getByText(/filters/i);
		fireEvent.click(filtersToggle);

		const resetButton = screen.getByText(/clear all filters/i);
		fireEvent.click(resetButton);

		expect(mockOnSearch).toHaveBeenCalledWith('');
		expect(mockOnFilterChange).toHaveBeenCalledWith({});
		expect(mockOnSortChange).toHaveBeenCalledWith('make');
	});

	test('handles fuel type filter selection', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		// Open advanced filters
		const filtersToggle = screen.getByText(/filters/i);
		fireEvent.click(filtersToggle);

		// Select gasoline fuel type
		const gasolineCheckbox = screen.getByLabelText(/gasoline/i);
		fireEvent.click(gasolineCheckbox);

		expect(mockOnFilterChange).toHaveBeenCalledWith({
			fuelType: ['Gasoline'],
		});
	});

	test('handles transmission filter selection', () => {
		render(
			<RouterWrapper>
				<SearchFilters
					onFilterChange={mockOnFilterChange}
					onSearch={mockOnSearch}
					onSortChange={mockOnSortChange}
				/>
			</RouterWrapper>,
		);

		// Open advanced filters
		const filtersToggle = screen.getByText(/filters/i);
		fireEvent.click(filtersToggle);

		// Select automatic transmission
		const transmissionSelect = screen.getByDisplayValue(/any/i);
		fireEvent.change(transmissionSelect, {
			target: { value: 'Automatic' },
		});

		expect(mockOnFilterChange).toHaveBeenCalledWith({
			transmission: 'Automatic',
		});
	});
});
