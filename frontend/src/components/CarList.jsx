import React, { useState } from 'react';

const CarList = ({ cars, onEdit, onDelete }) => {
	const [sortBy, setSortBy] = useState('make');
	const [sortOrder, setSortOrder] = useState('asc');
	const [filterStatus, setFilterStatus] = useState('all');

	// Filter cars by status
	const filteredCars = cars.filter((car) => {
		if (filterStatus === 'all') return true;
		return car.availabilityStatus === filterStatus;
	});

	// Sort cars
	const sortedCars = [...filteredCars].sort((a, b) => {
		let aValue = a[sortBy];
		let bValue = b[sortBy];

		// Handle string comparison
		if (typeof aValue === 'string') {
			aValue = aValue.toLowerCase();
			bValue = bValue.toLowerCase();
		}

		if (sortOrder === 'asc') {
			return aValue > bValue ? 1 : -1;
		} else {
			return aValue < bValue ? 1 : -1;
		}
	});

	const handleSort = (field) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortOrder('asc');
		}
	};

	const getSortIcon = (field) => {
		if (sortBy !== field) return '↕️';
		return sortOrder === 'asc' ? '↑' : '↓';
	};

	const getStatusBadgeClass = (status) => {
		switch (status) {
			case 'Available':
				return 'status-available';
			case 'Rented':
				return 'status-rented';
			case 'Maintenance':
				return 'status-maintenance';
			default:
				return 'status-default';
		}
	};

	if (cars.length === 0) {
		return (
			<div className='car-list-empty'>
				<p>No cars found. Add your first car to get started.</p>
			</div>
		);
	}

	return (
		<div className='car-list'>
			<div className='list-controls'>
				<div className='filter-controls'>
					<label htmlFor='statusFilter'>Filter by Status:</label>
					<select
						id='statusFilter'
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value='all'>All Status</option>
						<option value='Available'>Available</option>
						<option value='Rented'>Rented</option>
						<option value='Maintenance'>Maintenance</option>
					</select>
				</div>
				<div className='results-count'>
					Showing {sortedCars.length} of {cars.length} cars
				</div>
			</div>

			<div className='car-table-container'>
				<table className='car-table'>
					<thead>
						<tr>
							<th
								onClick={() => handleSort('make')}
								className='sortable'
							>
								Make {getSortIcon('make')}
							</th>
							<th
								onClick={() => handleSort('model')}
								className='sortable'
							>
								Model {getSortIcon('model')}
							</th>
							<th
								onClick={() => handleSort('year')}
								className='sortable'
							>
								Year {getSortIcon('year')}
							</th>
							<th
								onClick={() => handleSort('dailyRate')}
								className='sortable'
							>
								Daily Rate {getSortIcon('dailyRate')}
							</th>
							<th>Fuel Type</th>
							<th>Transmission</th>
							<th>Seats</th>
							<th
								onClick={() => handleSort('availabilityStatus')}
								className='sortable'
							>
								Status {getSortIcon('availabilityStatus')}
							</th>
							<th>License Plate</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{sortedCars.map((car) => (
							<tr key={car._id}>
								<td>{car.make}</td>
								<td>{car.model}</td>
								<td>{car.year}</td>
								<td>${car.dailyRate}</td>
								<td>{car.fuelType}</td>
								<td>{car.transmission}</td>
								<td>{car.seatingCapacity}</td>
								<td>
									<span
										className={`status-badge ${getStatusBadgeClass(
											car.availabilityStatus,
										)}`}
									>
										{car.availabilityStatus}
									</span>
								</td>
								<td>{car.licensePlate}</td>
								<td>
									<div className='action-buttons'>
										<button
											className='btn btn-sm btn-secondary'
											onClick={() => onEdit(car)}
											title='Edit car'
										>
											Edit
										</button>
										<button
											className='btn btn-sm btn-danger'
											onClick={() => onDelete(car._id)}
											title='Delete car'
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default CarList;
