import React, { useState, useRef } from 'react';

const ImageUpload = ({ images, onImagesChange, carId }) => {
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);
	const fileInputRef = useRef(null);

	const handleFileSelect = async (e) => {
		const files = Array.from(e.target.files);
		if (files.length === 0) return;

		// Validate files
		const validFiles = [];
		const errors = [];

		files.forEach((file) => {
			// Check file type
			if (!file.type.startsWith('image/')) {
				errors.push(`${file.name} is not an image file`);
				return;
			}

			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				errors.push(`${file.name} is too large (max 5MB)`);
				return;
			}

			validFiles.push(file);
		});

		if (errors.length > 0) {
			setUploadError(errors.join(', '));
			return;
		}

		if (carId) {
			// If we have a carId, upload to server
			await uploadToServer(validFiles);
		} else {
			// If no carId (new car), convert to base64 for preview
			await convertToBase64(validFiles);
		}

		// Clear the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const uploadToServer = async (files) => {
		setUploading(true);
		setUploadError(null);

		try {
			const formData = new FormData();
			files.forEach((file) => {
				formData.append('images', file);
			});

			const response = await fetch(`/api/cars/${carId}/images`, {
				method: 'POST',
				headers: {
					'x-user-id': localStorage.getItem('userId'),
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Upload failed');
			}

			const result = await response.json();
			const newImages = result.data.uploadedImages.urls;

			// Update images list
			onImagesChange([...images, ...newImages]);
		} catch (err) {
			setUploadError(err.message);
		} finally {
			setUploading(false);
		}
	};

	const convertToBase64 = async (files) => {
		setUploading(true);
		setUploadError(null);

		try {
			const base64Images = await Promise.all(
				files.map((file) => {
					return new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(reader.result);
						reader.onerror = reject;
						reader.readAsDataURL(file);
					});
				}),
			);

			// Update images list with base64 data
			onImagesChange([...images, ...base64Images]);
		} catch (err) {
			setUploadError('Failed to process images');
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveImage = async (imageUrl, index) => {
		if (carId && !imageUrl.startsWith('data:')) {
			// Remove from server
			try {
				const response = await fetch(`/api/cars/${carId}/images`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						'x-user-id': localStorage.getItem('userId'),
					},
					body: JSON.stringify({ imageUrls: [imageUrl] }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error?.message || 'Failed to delete image',
					);
				}
			} catch (err) {
				setUploadError(err.message);
				return;
			}
		}

		// Remove from local state
		const newImages = images.filter((_, i) => i !== index);
		onImagesChange(newImages);
	};

	const triggerFileSelect = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className='image-upload'>
			<input
				ref={fileInputRef}
				type='file'
				multiple
				accept='image/*'
				onChange={handleFileSelect}
				style={{ display: 'none' }}
			/>

			<div className='upload-area'>
				<button
					type='button'
					className='upload-btn'
					onClick={triggerFileSelect}
					disabled={uploading}
				>
					{uploading ? 'Uploading...' : 'Select Images'}
				</button>
				<p className='upload-hint'>
					Select multiple images (JPG, PNG, WebP). Max 5MB per image.
				</p>
			</div>

			{uploadError && <div className='error-message'>{uploadError}</div>}

			{images.length > 0 && (
				<div className='image-preview-grid'>
					{images.map((imageUrl, index) => (
						<div key={index} className='image-preview-item'>
							<img
								src={imageUrl}
								alt={`Car image ${index + 1}`}
								className='preview-image'
							/>
							<button
								type='button'
								className='remove-image-btn'
								onClick={() =>
									handleRemoveImage(imageUrl, index)
								}
								title='Remove image'
							>
								×
							</button>
						</div>
					))}
				</div>
			)}

			{images.length === 0 && (
				<div className='no-images'>
					<p>No images uploaded yet</p>
				</div>
			)}
		</div>
	);
};

export default ImageUpload;
