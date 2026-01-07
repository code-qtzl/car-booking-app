import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';

const CarForm = ({ car, mode, onSubmit, onCancel }) => {
	const [formData, setFormData] = useState({
		make: '',
		model: '',
		year: new Date().getFullYear(),
		dailyRate: '',
		fuelType: 'Gasoline',
		transmission: 'Automatic',
		seatingCapacity: 5,
		features: [],
		description: '',
		licensePlate: '',
		availabilityStatus: 'Available',
		images: [],
	});

	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [newFeature, setNewFeature] = useState('');

	// Populate form with car data when editing
	useEffect(() => {
		if (car && mode === 'edit') {
			setFormData({
				make: car.make || '',
				model: car.model || '',
				year: car.year || new Date().getFullYear(),
				dailyRate: car.dailyRate || '',
				fuelType: car.fuelType || 'Gasoline',
				transmission: car.transmission || 'Automatic',
				seatingCapacity: car.seatingCapacity || 5,
				features: car.features || [],
				description: car.description || '',
				licensePlate: car.licensePlate || '',
				availabilityStatus: car.availabilityStatus || 'Available',
				images: car.images || [],
			});
		}
	}, [car, mode]);

	const handleInputChange = (e) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'number' ? parseFloat(value) || '' : value,
		}));

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: '',
			}));
		}
	};

	const handleAddFeature = () => {
		if (
			newFeature.trim() &&
			!formData.features.includes(newFeature.trim())
		) {
			setFormData((prev) => ({
				...prev,
				features: [...prev.features, newFeature.trim()],
			}));
			setNewFeature('');
		}
	};

	const handleRemoveFeature = (featureToRemove) => {
		setFormData((prev) => ({
			...prev,
			features: prev.features.filter(
				(feature) => feature !== featureToRemove,
			),
		}));
	};

	const handleImagesChange = (images) => {
		setFormData((prev) => ({
			...prev,
			images,
		}));
	};

	const validateForm = () => {
		const newErrors = {};

		// Required fields validation
		if (!formData.make.trim()) newErrors.make = 'Make is required';
		if (!formData.model.trim()) newErrors.model = 'Model is required';
		if (!formData.year) newErrors.year = 'Year is required';
		if (!formData.dailyRate) newErrors.dailyRate = 'Daily rate is required';
		if (!formData.licensePlate.trim())
			newErrors.licensePlate = 'License plate is required';

		// Business rules validation
		const currentYear = new Date().getFullYear();
		if (formData.year < 2000) {
			newErrors.year = 'Rental cars must be from year 2000 or later';
		}
		if (formData.year > currentYear + 1) {
			newErrors.year =
				'Car year cannot be more than one year in the future';
		}

		if (formData.dailyRate <= 0) {
			newErrors.dailyRate = 'Daily rate must be greater than 0';
		}
		if (formData.dailyRate > 10000) {
			newErrors.dailyRate = 'Daily rate cannot exceed $10,000';
		}

		if (formData.seatingCapacity < 1) {
			newErrors.seatingCapacity = 'Seating capacity must be at least 1';
		}
		if (formData.seatingCapacity > 15) {
			newErrors.seatingCapacity =
				'Rental cars cannot have more than 15 seats';
		}

		if (
			formData.licensePlate.length < 3 ||
			formData.licensePlate.length > 10
		) {
			newErrors.licensePlate =
				'License plate must be between 3 and 10 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		setErrors({});

		try {
			await onSubmit(formData);
		} catch (err) {
			setErrors({ submit: err.message });
		} finally {
			setLoading(false);
		}
	};

	const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
	const transmissionTypes = ['Manual', 'Automatic'];
	const availabilityStatuses = ['Available', 'Rented', 'Maintenance'];

	return (
		<form className='car-form' onSubmit={handleSubmit}>
			<div className='form-header'>
				<h3>{mode === 'add' ? 'Add New Car' : 'Edit Car'}</h3>
				<button type='button' className='close-btn' onClick={onCancel}>
					×
				</button>
			</div>

			{errors.submit && (
				<div className='error-message'>{errors.submit}</div>
			)}

			<div className='form-grid'>
				<div className='form-group'>
					<label htmlFor='make'>Make *</label>
					<input
						type='text'
						id='make'
						name='make'
						value={formData.make}
						onChange={handleInputChange}
						className={errors.make ? 'error' : ''}
						placeholder='e.g., Toyota'
					/>
					{errors.make && (
						<span className='error-text'>{errors.make}</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='model'>Model *</label>
					<input
						type='text'
						id='model'
						name='model'
						value={formData.model}
						onChange={handleInputChange}
						className={errors.model ? 'error' : ''}
						placeholder='e.g., Camry'
					/>
					{errors.model && (
						<span className='error-text'>{errors.model}</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='year'>Year *</label>
					<input
						type='number'
						id='year'
						name='year'
						value={formData.year}
						onChange={handleInputChange}
						className={errors.year ? 'error' : ''}
						min='2000'
						max={new Date().getFullYear() + 1}
					/>
					{errors.year && (
						<span className='error-text'>{errors.year}</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='dailyRate'>Daily Rate ($) *</label>
					<input
						type='number'
						id='dailyRate'
						name='dailyRate'
						value={formData.dailyRate}
						onChange={handleInputChange}
						className={errors.dailyRate ? 'error' : ''}
						min='0'
						max='10000'
						step='0.01'
						placeholder='e.g., 50.00'
					/>
					{errors.dailyRate && (
						<span className='error-text'>{errors.dailyRate}</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='fuelType'>Fuel Type</label>
					<select
						id='fuelType'
						name='fuelType'
						value={formData.fuelType}
						onChange={handleInputChange}
					>
						{fuelTypes.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>

				<div className='form-group'>
					<label htmlFor='transmission'>Transmission</label>
					<select
						id='transmission'
						name='transmission'
						value={formData.transmission}
						onChange={handleInputChange}
					>
						{transmissionTypes.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>

				<div className='form-group'>
					<label htmlFor='seatingCapacity'>Seating Capacity</label>
					<input
						type='number'
						id='seatingCapacity'
						name='seatingCapacity'
						value={formData.seatingCapacity}
						onChange={handleInputChange}
						className={errors.seatingCapacity ? 'error' : ''}
						min='1'
						max='15'
					/>
					{errors.seatingCapacity && (
						<span className='error-text'>
							{errors.seatingCapacity}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='licensePlate'>License Plate *</label>
					<input
						type='text'
						id='licensePlate'
						name='licensePlate'
						value={formData.licensePlate}
						onChange={handleInputChange}
						className={errors.licensePlate ? 'error' : ''}
						placeholder='e.g., ABC123'
						maxLength='10'
					/>
					{errors.licensePlate && (
						<span className='error-text'>
							{errors.licensePlate}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='availabilityStatus'>
						Availability Status
					</label>
					<select
						id='availabilityStatus'
						name='availabilityStatus'
						value={formData.availabilityStatus}
						onChange={handleInputChange}
					>
						{availabilityStatuses.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className='form-group full-width'>
				<label htmlFor='description'>Description</label>
				<textarea
					id='description'
					name='description'
					value={formData.description}
					onChange={handleInputChange}
					rows='3'
					placeholder='Optional description of the car...'
				/>
			</div>

			<div className='form-group full-width'>
				<label>Features</label>
				<div className='features-input'>
					<input
						type='text'
						value={newFeature}
						onChange={(e) => setNewFeature(e.target.value)}
						placeholder='Add a feature (e.g., GPS, Bluetooth)'
						onKeyPress={(e) =>
							e.key === 'Enter' &&
							(e.preventDefault(), handleAddFeature())
						}
					/>
					<button type='button' onClick={handleAddFeature}>
						Add
					</button>
				</div>
				<div className='features-list'>
					{formData.features.map((feature, index) => (
						<span key={index} className='feature-tag'>
							{feature}
							<button
								type='button'
								onClick={() => handleRemoveFeature(feature)}
								className='remove-feature'
							>
								×
							</button>
						</span>
					))}
				</div>
			</div>

			<div className='form-group full-width'>
				<label>Car Images</label>
				<ImageUpload
					images={formData.images}
					onImagesChange={handleImagesChange}
					carId={car?._id}
				/>
			</div>

			<div className='form-actions'>
				<button type='button' onClick={onCancel} disabled={loading}>
					Cancel
				</button>
				<button
					type='submit'
					className='btn-primary'
					disabled={loading}
				>
					{loading
						? 'Saving...'
						: mode === 'add'
						? 'Add Car'
						: 'Update Car'}
				</button>
			</div>
		</form>
	);
};

export default CarForm;
