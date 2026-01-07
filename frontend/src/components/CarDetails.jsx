import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, formatErrorMessage } from '../utils/networkUtils';
import '../styles/CarDetails.css';

const CarDetails = () => {
	const { carId } = useParams();
	const navigate = useNavigate();
	const [car, setCar] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedImage, setSelectedImage] = useState(0);

	useEffect(() => {
		if (carId) {
			fetchCarDetails();
		}
	}, [carId]);

	const fetchCarDetails = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiClient.get(`/api/cars/${carId}`);

			if (response.data.success) {
				setCar(response.data.data);
				setSelectedImage(0); // Reset to first image
			} else {
				throw new Error(
					response.data.message || 'Failed to fetch car details',
				);
			}
		} catch (err) {
			console.error('Error fetching car details:', err);
			const errorMessage = formatErrorMessage(err);
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleImageSelect = (index) => {
		setSelectedImage(index);
	};

	const handleBackToListings = () => {
		navigate('/cars');
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(price);
	};

	const getAvailabilityBadge = (status) => {
		const statusColors = {
			Available: 'success',
			Rented: 'warning',
			Maintenance: 'danger',
		};

		return (
			<span
				className={`badge badge-${statusColors[status] || 'secondary'}`}
			>
				{status}
			</span>
		);
	};

	if (loading) {
		return (
			<div className='car-details-page'>
				<div className='loading-container'>
					<div
						className='loading-spinner'
						aria-label='Loading car details'
					>
						<div className='spinner'></div>
						<p>Loading car details...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='car-details-page'>
				<div className='error-container'>
					<div className='error-message'>
						<h3>Unable to load car details</h3>
						<p>{error}</p>
						<div className='error-actions'>
							<button
								onClick={fetchCarDetails}
								className='retry-button'
							>
								Try Again
							</button>
							<button
								onClick={handleBackToListings}
								className='back-button'
							>
								Back to Listings
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!car) {
		return (
			<div className='car-details-page'>
				<div className='error-container'>
					<div className='error-message'>
						<h3>Car not found</h3>
						<p>The requested car could not be found.</p>
						<button
							onClick={handleBackToListings}
							className='back-button'
						>
							Back to Listings
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='car-details-page'>
			<div className='car-details-container'>
				{/* Navigation */}
				<div className='details-navigation'>
					<button
						onClick={handleBackToListings}
						className='back-link'
					>
						← Back to Car Listings
					</button>
				</div>

				{/* Car Details Header */}
				<div className='car-details-header'>
					<h1>
						{car.make} {car.model}
					</h1>
					<div className='car-meta'>
						<span className='car-year'>{car.year}</span>
						<div className='availability-status'>
							{getAvailabilityBadge(car.availabilityStatus)}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='car-details-content'>
					{/* Image Gallery */}
					<div className='image-gallery'>
						<div className='main-image'>
							{car.images && car.images.length > 0 ? (
								<img
									src={car.images[selectedImage]}
									alt={`${car.make} ${car.model} - Image ${
										selectedImage + 1
									}`}
									onError={(e) => {
										e.target.src = '/placeholder-car.jpg';
									}}
								/>
							) : (
								<div className='image-placeholder'>
									<span>No Images Available</span>
								</div>
							)}
						</div>

						{/* Image Thumbnails */}
						{car.images && car.images.length > 1 && (
							<div className='image-thumbnails'>
								{car.images.map((image, index) => (
									<button
										key={index}
										className={`thumbnail ${
											index === selectedImage
												? 'active'
												: ''
										}`}
										onClick={() => handleImageSelect(index)}
									>
										<img
											src={image}
											alt={`${car.make} ${
												car.model
											} - Thumbnail ${index + 1}`}
											onError={(e) => {
												e.target.src =
													'/placeholder-car.jpg';
											}}
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Car Information */}
					<div className='car-information'>
						{/* Pricing */}
						<div className='pricing-section'>
							<div className='daily-rate'>
								<span className='price'>
									{formatPrice(car.dailyRate)}
								</span>
								<span className='period'>per day</span>
							</div>
						</div>

						{/* Specifications */}
						<div className='specifications'>
							<h3>Specifications</h3>
							<div className='spec-grid'>
								<div className='spec-item'>
									<span className='spec-label'>
										Fuel Type
									</span>
									<span className='spec-value'>
										{car.fuelType}
									</span>
								</div>
								<div className='spec-item'>
									<span className='spec-label'>
										Transmission
									</span>
									<span className='spec-value'>
										{car.transmission}
									</span>
								</div>
								<div className='spec-item'>
									<span className='spec-label'>
										Seating Capacity
									</span>
									<span className='spec-value'>
										{car.seatingCapacity} passengers
									</span>
								</div>
								{car.licensePlate && (
									<div className='spec-item'>
										<span className='spec-label'>
											License Plate
										</span>
										<span className='spec-value'>
											{car.licensePlate}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Features */}
						{car.features && car.features.length > 0 && (
							<div className='features-section'>
								<h3>Features</h3>
								<div className='features-list'>
									{car.features.map((feature, index) => (
										<span
											key={index}
											className='feature-tag'
										>
											{feature}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Description */}
						{car.description && (
							<div className='description-section'>
								<h3>Description</h3>
								<p className='car-description'>
									{car.description}
								</p>
							</div>
						)}

						{/* Action Buttons */}
						<div className='action-buttons'>
							{car.availabilityStatus === 'Available' ? (
								<button className='book-button primary'>
									Book This Car
								</button>
							) : (
								<button
									className='book-button disabled'
									disabled
								>
									Currently Unavailable
								</button>
							)}
							<button
								onClick={handleBackToListings}
								className='back-button secondary'
							>
								View Other Cars
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CarDetails;
