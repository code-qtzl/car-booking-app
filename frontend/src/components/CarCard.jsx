import { useState, useRef, useEffect } from 'react';

const CarCard = ({ car, onClick }) => {
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const cardRef = useRef(null);
	const imageRef = useRef(null);

	// Enhanced Intersection Observer for lazy loading optimization with better performance
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{
				rootMargin: '150px', // Increased for better UX - start loading earlier
				threshold: 0.1,
			},
		);

		if (cardRef.current) {
			observer.observe(cardRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// Enhanced preloading strategy for better performance
	useEffect(() => {
		if (imageLoaded && car.images && car.images.length > 1) {
			// Preload next 2 images for better performance
			const imagesToPreload = car.images.slice(1, 3);
			imagesToPreload.forEach((imageSrc, index) => {
				const img = new Image();
				img.src = imageSrc;
				// Add to browser cache with low priority
				img.loading = 'lazy';
				img.decoding = 'async';
			});
		}
	}, [imageLoaded, car.images]);

	const handleImageError = () => {
		setImageError(true);
		// Enhanced fallback strategy - try loading alternative images
		if (car.images && car.images.length > 1 && imageRef.current) {
			const currentSrc = imageRef.current.src;
			const currentIndex = car.images.findIndex((img) =>
				currentSrc.includes(img),
			);

			// Try next available image
			if (currentIndex !== -1 && currentIndex < car.images.length - 1) {
				imageRef.current.src = car.images[currentIndex + 1];
				setImageError(false);
			} else if (currentIndex === -1 && car.images.length > 0) {
				// If current image not found in array, try first image
				imageRef.current.src = car.images[0];
				setImageError(false);
			}
		}
	};

	const handleImageLoad = () => {
		setImageLoaded(true);
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
			ref={cardRef}
			className='car-card'
			onClick={handleCardClick}
			style={{ cursor: 'pointer' }}
		>
			<div className='car-image-container'>
				{!imageError && car.images && car.images.length > 0 ? (
					<>
						{/* Enhanced placeholder with skeleton animation */}
						{!imageLoaded && (
							<div className='car-image-placeholder loading'>
								<div className='image-skeleton'></div>
								<div className='loading-text'>Loading...</div>
							</div>
						)}
						{/* Enhanced image loading with performance optimizations */}
						{isVisible && (
							<img
								ref={imageRef}
								src={car.images[0]}
								alt={`${car.make} ${car.model}`}
								onError={handleImageError}
								onLoad={handleImageLoad}
								loading='lazy'
								decoding='async'
								fetchpriority='low' // Lower priority for better performance
								style={{
									opacity: imageLoaded ? 1 : 0,
									transition: 'opacity 0.3s ease',
									willChange: imageLoaded
										? 'auto'
										: 'opacity', // Optimize for transitions
								}}
							/>
						)}
					</>
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
