import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import useFormValidation from '../hooks/useFormValidation';
import {
	formatErrorMessage,
	extractValidationErrors,
	isValidationError,
} from '../utils/networkUtils';
import '../styles/ErrorHandling.css';

const CarForm = ({ car, mode, onSubmit, onCancel }) => {
	const initialValues = {
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
	};

	// Enhanced validation rules
	const validationRules = {
		make: {
			required: 'Make is required',
			type: 'string',
			minLength: 1,
			maxLength: 50,
			minLengthMessage: 'Make must be at least 1 character',
			maxLengthMessage: 'Make cannot exceed 50 characters',
		},
		model: {
			required: 'Model is required',
			type: 'string',
			minLength: 1,
			maxLength: 50,
			minLengthMessage: 'Model must be at least 1 character',
			maxLengthMessage: 'Model cannot exceed 50 characters',
		},
		year: {
			required: 'Year is required',
			type: 'number',
			min: 2000,
			max: new Date().getFullYear() + 1,
			minMessage: 'Rental cars must be from year 2000 or later',
			maxMessage: 'Car year cannot be more than one year in the future',
		},
		dailyRate: {
			required: 'Daily rate is required',
			type: 'number',
			min: 0.01,
			max: 10000,
			minMessage: 'Daily rate must be greater than 0',
			maxMessage: 'Daily rate cannot exceed $10,000',
		},
		licensePlate: {
			required: 'License plate is required',
			type: 'string',
			minLength: 3,
			maxLength: 10,
			pattern: '^[A-Z0-9\\-\\s]+$',
			minLengthMessage: 'License plate must be at least 3 characters',
			maxLengthMessage: 'License plate cannot exceed 10 characters',
			patternMessage:
				'License plate can only contain letters, numbers, hyphens, and spaces',
		},
		seatingCapacity: {
			required: 'Seating capacity is required',
			type: 'number',
			min: 1,
			max: 15,
			minMessage: 'Seating capacity must be at least 1',
			maxMessage: 'Rental cars cannot have more than 15 seats',
		},
		description: {
			type: 'string',
			maxLength: 1000,
			maxLengthMessage: 'Description cannot exceed 1000 characters',
		},
	};

	const {
		values,
		errors,
		touched,
		isValid,
		isValidating,
		handleChange,
		handleBlur,
		validate,
		reset,
		setServerErrors,
		getFieldProps,
		getFieldError,
		hasFieldError,
		setValues,
	} = useFormValidation(initialValues, validationRules, {
		validateOnChange: true,
		validateOnBlur: true,
		debounceMs: 300,
	});

	const [loading, setLoading] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [newFeature, setNewFeature] = useState('');

	// Populate form with car data when editing
	useEffect(() => {
		if (car && mode === 'edit') {
			const carData = {
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
			};
			setValues(carData);
		}
	}, [car, mode, setValues]);

	const handleInputChange = (fieldName, value) => {
		// Convert value based on field type
		let processedValue = value;
		if (
			fieldName === 'year' ||
			fieldName === 'dailyRate' ||
			fieldName === 'seatingCapacity'
		) {
			processedValue = value === '' ? '' : parseFloat(value) || '';
		}
		if (fieldName === 'licensePlate') {
			processedValue = value.toUpperCase();
		}

		handleChange(fieldName, processedValue);
	};

	const handleAddFeature = () => {
		if (newFeature.trim() && !values.features.includes(newFeature.trim())) {
			const updatedFeatures = [...values.features, newFeature.trim()];
			handleChange('features', updatedFeatures);
			setNewFeature('');
		}
	};

	const handleRemoveFeature = (featureToRemove) => {
		const updatedFeatures = values.features.filter(
			(feature) => feature !== featureToRemove,
		);
		handleChange('features', updatedFeatures);
	};

	const handleImagesChange = (images) => {
		handleChange('images', images);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate form
		if (!validate()) {
			setSubmitError('Please fix the errors above before submitting.');
			return;
		}

		setLoading(true);
		setSubmitError('');

		try {
			await onSubmit(values);
		} catch (err) {
			console.error('Form submission error:', err);

			// Handle validation errors from server
			if (isValidationError(err)) {
				const serverErrors = extractValidationErrors(err);
				setServerErrors(serverErrors);
				setSubmitError(
					'Please fix the validation errors and try again.',
				);
			} else {
				// Handle other errors
				const errorMessage = formatErrorMessage(err);
				setSubmitError(errorMessage);
			}
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

			{submitError && <div className='error-message'>{submitError}</div>}

			<div className='form-grid'>
				<div className='form-group'>
					<label htmlFor='make'>Make *</label>
					<input
						type='text'
						id='make'
						name='make'
						value={values.make}
						onChange={(e) =>
							handleInputChange('make', e.target.value)
						}
						onBlur={() => handleBlur('make')}
						className={hasFieldError('make') ? 'error' : ''}
						placeholder='e.g., Toyota'
					/>
					{getFieldError('make') && (
						<span className='error-text'>
							{getFieldError('make')}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='model'>Model *</label>
					<input
						type='text'
						id='model'
						name='model'
						value={values.model}
						onChange={(e) =>
							handleInputChange('model', e.target.value)
						}
						onBlur={() => handleBlur('model')}
						className={hasFieldError('model') ? 'error' : ''}
						placeholder='e.g., Camry'
					/>
					{getFieldError('model') && (
						<span className='error-text'>
							{getFieldError('model')}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='year'>Year *</label>
					<input
						type='number'
						id='year'
						name='year'
						value={values.year}
						onChange={(e) =>
							handleInputChange('year', e.target.value)
						}
						onBlur={() => handleBlur('year')}
						className={hasFieldError('year') ? 'error' : ''}
						min='2000'
						max={new Date().getFullYear() + 1}
					/>
					{getFieldError('year') && (
						<span className='error-text'>
							{getFieldError('year')}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='dailyRate'>Daily Rate ($) *</label>
					<input
						type='number'
						id='dailyRate'
						name='dailyRate'
						value={values.dailyRate}
						onChange={(e) =>
							handleInputChange('dailyRate', e.target.value)
						}
						onBlur={() => handleBlur('dailyRate')}
						className={hasFieldError('dailyRate') ? 'error' : ''}
						min='0'
						max='10000'
						step='0.01'
						placeholder='e.g., 50.00'
					/>
					{getFieldError('dailyRate') && (
						<span className='error-text'>
							{getFieldError('dailyRate')}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='fuelType'>Fuel Type</label>
					<select
						id='fuelType'
						name='fuelType'
						value={values.fuelType}
						onChange={(e) =>
							handleInputChange('fuelType', e.target.value)
						}
						onBlur={() => handleBlur('fuelType')}
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
						value={values.transmission}
						onChange={(e) =>
							handleInputChange('transmission', e.target.value)
						}
						onBlur={() => handleBlur('transmission')}
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
						value={values.seatingCapacity}
						onChange={(e) =>
							handleInputChange('seatingCapacity', e.target.value)
						}
						onBlur={() => handleBlur('seatingCapacity')}
						className={
							hasFieldError('seatingCapacity') ? 'error' : ''
						}
						min='1'
						max='15'
					/>
					{getFieldError('seatingCapacity') && (
						<span className='error-text'>
							{getFieldError('seatingCapacity')}
						</span>
					)}
				</div>

				<div className='form-group'>
					<label htmlFor='licensePlate'>License Plate *</label>
					<input
						type='text'
						id='licensePlate'
						name='licensePlate'
						value={values.licensePlate}
						onChange={(e) =>
							handleInputChange('licensePlate', e.target.value)
						}
						onBlur={() => handleBlur('licensePlate')}
						className={hasFieldError('licensePlate') ? 'error' : ''}
						placeholder='e.g., ABC123'
						maxLength='10'
					/>
					{getFieldError('licensePlate') && (
						<span className='error-text'>
							{getFieldError('licensePlate')}
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
						value={values.availabilityStatus}
						onChange={(e) =>
							handleInputChange(
								'availabilityStatus',
								e.target.value,
							)
						}
						onBlur={() => handleBlur('availabilityStatus')}
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
					value={values.description}
					onChange={(e) =>
						handleInputChange('description', e.target.value)
					}
					onBlur={() => handleBlur('description')}
					className={hasFieldError('description') ? 'error' : ''}
					rows='3'
					placeholder='Optional description of the car...'
					maxLength='1000'
				/>
				{getFieldError('description') && (
					<span className='error-text'>
						{getFieldError('description')}
					</span>
				)}
				<small className='char-count'>
					{values.description.length}/1000 characters
				</small>
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
					{values.features.map((feature, index) => (
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
					images={values.images}
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
					disabled={loading || isValidating || !isValid}
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
