import { useState } from 'react';

const CarCard = ({ car, onClick }) => {
	const [imageError, setImageError] = useState(false);

	const handleImageError = () => {
		setImageError(true);
	};

	const handleCardClick = () => {
		if (onClick) {
			onClick(car._id);
		}
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

	return (
		<article
			className='car-card'
			onClick={handleCardClick}
			style={{ cursor: 'pointer' }}
		>
			<div className='car-image-container'>
				{!imageError && car.images && car.images.length > 0 ? (
					<img
						src={car.images[0]}
						alt={`${car.make} ${car.model}`}
						onError={handleImageError}
						loading='lazy'
					/>
				) : (
					<div className='car-image-placeholder'>
						<span>No Image Available</span>
					</div>
				)}
				<div className='availability-badge'>
					{getAvailabilityBadge(car.availabilityStatus)}
				</div>
			</div>

			<div className='car-info'>
				<h3>
					{car.make} {car.model}
				</h3>
				<p className='car-year'>{car.year}</p>
				<div className='car-details'>
					<span className='fuel-type'>{car.fuelType}</span>
					<span className='transmission'>{car.transmission}</span>
					<span className='seating'>{car.seatingCapacity} seats</span>
				</div>
				<div className='car-price'>
					<strong>{formatPrice(car.dailyRate)}/day</strong>
				</div>
			</div>
		</article>
	);
};

export default CarCard;
