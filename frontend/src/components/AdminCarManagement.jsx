import React, { useState, useEffect } from 'react';
import CarForm from './CarForm';
import CarList from './CarList';
import '../styles/AdminCarManagement.css';

const AdminCarManagement = () => {
	const [cars, setCars] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [selectedCar, setSelectedCar] = useState(null);
	const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

	// Fetch all cars on component mount
	useEffect(() => {
		fetchCars();
	}, []);

	const fetchCars = async () => {
		try {
			setLoading(true);
			setError(null);

			const userId = localStorage.getItem('userId');
			if (!userId) {
				throw new Error('Authentication required');
			}

			const response = await fetch('/api/cars', {
				headers: {
					'x-user-id': userId,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error(
						'Authentication failed. Please log in again.',
					);
				}
				throw new Error('Failed to fetch cars');
			}

			const data = await response.json();
			setCars(data.data || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCar = () => {
		setSelectedCar(null);
		setFormMode('add');
		setShowForm(true);
	};

	const handleEditCar = (car) => {
		setSelectedCar(car);
		setFormMode('edit');
		setShowForm(true);
	};

	const handleDeleteCar = async (carId) => {
		if (!window.confirm('Are you sure you want to delete this car?')) {
			return;
		}

		try {
			const userId = localStorage.getItem('userId');
			if (!userId) {
				throw new Error('Authentication required');
			}

			const response = await fetch(`/api/cars/${carId}`, {
				method: 'DELETE',
				headers: {
					'x-user-id': userId,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error(
						'Authentication failed. Please log in again.',
					);
				} else if (response.status === 403) {
					throw new Error(
						'Admin access required for this operation.',
					);
				}
				throw new Error('Failed to delete car');
			}

			// Remove car from local state
			setCars(cars.filter((car) => car._id !== carId));
		} catch (err) {
			setError(err.message);
		}
	};

	const handleFormSubmit = async (carData) => {
		try {
			const userId = localStorage.getItem('userId');
			if (!userId) {
				throw new Error('Authentication required');
			}

			const url =
				formMode === 'add'
					? '/api/cars'
					: `/api/cars/${selectedCar._id}`;
			const method = formMode === 'add' ? 'POST' : 'PUT';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': userId,
				},
				body: JSON.stringify(carData),
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error(
						'Authentication failed. Please log in again.',
					);
				} else if (response.status === 403) {
					throw new Error(
						'Admin access required for this operation.',
					);
				}
				const errorData = await response.json();
				throw new Error(
					errorData.error?.message || 'Failed to save car',
				);
			}

			const result = await response.json();

			if (formMode === 'add') {
				setCars([...cars, result.data]);
			} else {
				setCars(
					cars.map((car) =>
						car._id === selectedCar._id ? result.data : car,
					),
				);
			}

			setShowForm(false);
			setSelectedCar(null);
		} catch (err) {
			throw err; // Let the form handle the error display
		}
	};

	const handleFormCancel = () => {
		setShowForm(false);
		setSelectedCar(null);
	};

	if (loading) {
		return (
			<div className='admin-car-management'>
				<div className='loading'>Loading cars...</div>
			</div>
		);
	}

	return (
		<div className='admin-car-management'>
			<div className='admin-header'>
				<h2>Car Management</h2>
				<button className='btn btn-primary' onClick={handleAddCar}>
					Add New Car
				</button>
			</div>

			{error && <div className='error-message'>{error}</div>}

			{showForm && (
				<div className='form-overlay'>
					<div className='form-container'>
						<CarForm
							car={selectedCar}
							mode={formMode}
							onSubmit={handleFormSubmit}
							onCancel={handleFormCancel}
						/>
					</div>
				</div>
			)}

			<CarList
				cars={cars}
				onEdit={handleEditCar}
				onDelete={handleDeleteCar}
			/>
		</div>
	);
};

export default AdminCarManagement;
