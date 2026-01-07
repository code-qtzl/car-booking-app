const fs = require('fs-extra');
const path = require('path');

class ImageService {
	constructor() {
		this.uploadsDir = path.join(__dirname, '../uploads/cars');
		this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';

		// Ensure uploads directory exists
		fs.ensureDirSync(this.uploadsDir);
	}

	/**
	 * Generate image URL from filename
	 * @param {string} filename - The image filename
	 * @returns {string} - Full URL to the image
	 */
	generateImageUrl(filename) {
		if (!filename) return null;
		return `${this.baseUrl}/api/cars/images/${filename}`;
	}

	/**
	 * Generate image URLs from array of filenames
	 * @param {string[]} filenames - Array of image filenames
	 * @returns {string[]} - Array of full URLs to the images
	 */
	generateImageUrls(filenames) {
		if (!Array.isArray(filenames)) return [];
		return filenames.map((filename) => this.generateImageUrl(filename));
	}

	/**
	 * Save uploaded files and return their information
	 * @param {Object|Object[]} files - Uploaded file(s) from multer
	 * @returns {Object} - Object containing filenames and URLs
	 */
	processUploadedFiles(files) {
		if (!files) {
			return { filenames: [], urls: [] };
		}

		// Handle single file
		if (!Array.isArray(files)) {
			files = [files];
		}

		const filenames = files.map((file) => file.filename);
		const urls = this.generateImageUrls(filenames);

		return {
			filenames,
			urls,
			count: filenames.length,
		};
	}

	/**
	 * Delete image file from storage
	 * @param {string} filename - The image filename to delete
	 * @returns {Promise<boolean>} - Success status
	 */
	async deleteImage(filename) {
		try {
			if (!filename) return false;

			const filePath = path.join(this.uploadsDir, filename);

			// Check if file exists before attempting to delete
			if (await fs.pathExists(filePath)) {
				await fs.remove(filePath);
				return true;
			}

			return false;
		} catch (error) {
			console.error('Error deleting image:', error);
			return false;
		}
	}

	/**
	 * Delete multiple image files from storage
	 * @param {string[]} filenames - Array of image filenames to delete
	 * @returns {Promise<Object>} - Object with success count and failed files
	 */
	async deleteImages(filenames) {
		if (!Array.isArray(filenames)) {
			filenames = [filenames];
		}

		const results = {
			deleted: 0,
			failed: [],
		};

		for (const filename of filenames) {
			const success = await this.deleteImage(filename);
			if (success) {
				results.deleted++;
			} else {
				results.failed.push(filename);
			}
		}

		return results;
	}

	/**
	 * Get image file path for serving
	 * @param {string} filename - The image filename
	 * @returns {string} - Full file path
	 */
	getImagePath(filename) {
		return path.join(this.uploadsDir, filename);
	}

	/**
	 * Check if image file exists
	 * @param {string} filename - The image filename
	 * @returns {Promise<boolean>} - Whether file exists
	 */
	async imageExists(filename) {
		try {
			const filePath = this.getImagePath(filename);
			return await fs.pathExists(filePath);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Validate image file
	 * @param {string} filename - The image filename
	 * @returns {Promise<Object>} - Validation result
	 */
	async validateImage(filename) {
		try {
			const filePath = this.getImagePath(filename);
			const exists = await fs.pathExists(filePath);

			if (!exists) {
				return {
					valid: false,
					error: 'Image file not found',
				};
			}

			const stats = await fs.stat(filePath);

			return {
				valid: true,
				size: stats.size,
				path: filePath,
			};
		} catch (error) {
			return {
				valid: false,
				error: error.message,
			};
		}
	}

	/**
	 * Extract filename from URL
	 * @param {string} url - Image URL
	 * @returns {string|null} - Extracted filename or null
	 */
	extractFilenameFromUrl(url) {
		if (!url || typeof url !== 'string') return null;

		// Extract filename from URL pattern: /api/cars/images/filename.ext
		const match = url.match(/\/api\/cars\/images\/(.+)$/);
		return match ? match[1] : null;
	}

	/**
	 * Extract filenames from array of URLs
	 * @param {string[]} urls - Array of image URLs
	 * @returns {string[]} - Array of extracted filenames
	 */
	extractFilenamesFromUrls(urls) {
		if (!Array.isArray(urls)) return [];

		return urls
			.map((url) => this.extractFilenameFromUrl(url))
			.filter((filename) => filename !== null);
	}
}

module.exports = new ImageService();
