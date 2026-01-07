/**
 * Enhanced in-memory cache middleware for API responses with performance optimizations
 * In production, this would be replaced with Redis or similar
 */

class SimpleCache {
	constructor(maxSize = 200, ttl = 600000) {
		// 10 minutes TTL for better performance
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttl = ttl;
		this.hitCount = 0;
		this.missCount = 0;
		this.lastCleanup = Date.now();
		this.cleanupInterval = 300000; // Clean up every 5 minutes
	}

	get(key) {
		// Perform periodic cleanup for better performance
		this.performPeriodicCleanup();

		const item = this.cache.get(key);
		if (!item) {
			this.missCount++;
			return null;
		}

		// Check if item has expired
		if (Date.now() > item.expiry) {
			this.cache.delete(key);
			this.missCount++;
			return null;
		}

		// Update access time for LRU-like behavior
		item.lastAccessed = Date.now();
		this.hitCount++;
		return item.data;
	}

	set(key, data) {
		// Perform periodic cleanup
		this.performPeriodicCleanup();

		// Remove oldest items if cache is full (LRU eviction)
		if (this.cache.size >= this.maxSize) {
			this.evictOldestEntries(Math.floor(this.maxSize * 0.2)); // Remove 20% of entries
		}

		this.cache.set(key, {
			data,
			expiry: Date.now() + this.ttl,
			lastAccessed: Date.now(),
			createdAt: Date.now(),
		});
	}

	// Enhanced cleanup method for better performance
	performPeriodicCleanup() {
		const now = Date.now();
		if (now - this.lastCleanup < this.cleanupInterval) {
			return;
		}

		// Remove expired entries
		for (const [key, item] of this.cache.entries()) {
			if (now > item.expiry) {
				this.cache.delete(key);
			}
		}

		this.lastCleanup = now;
	}

	// LRU eviction for better cache performance
	evictOldestEntries(count) {
		const entries = Array.from(this.cache.entries())
			.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
			.slice(0, count);

		entries.forEach(([key]) => this.cache.delete(key));
	}

	// Get cache statistics for monitoring
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			hitCount: this.hitCount,
			missCount: this.missCount,
			hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
		};
	}

	clear() {
		this.cache.clear();
		this.hitCount = 0;
		this.missCount = 0;
	}

	delete(key) {
		return this.cache.delete(key);
	}

	size() {
		return this.cache.size;
	}

	// Enhanced cache key generation for better performance
	static generateCacheKey(req) {
		const { originalUrl, query } = req;

		// Sort query parameters for consistent cache keys
		const sortedQuery = Object.keys(query)
			.sort()
			.reduce((result, key) => {
				result[key] = query[key];
				return result;
			}, {});

		return `${originalUrl}?${JSON.stringify(sortedQuery)}`;
	}
}

// Create cache instance with enhanced performance settings
const apiCache = new SimpleCache(200, 600000); // 200 items, 10 minutes TTL

/**
 * Enhanced cache middleware for GET requests with performance optimizations
 * @param {number} ttl - Time to live in milliseconds (optional)
 * @param {boolean} varyByUser - Whether to include user ID in cache key (optional)
 */
const cacheMiddleware = (ttl, varyByUser = false) => {
	return (req, res, next) => {
		// Only cache GET requests
		if (req.method !== 'GET') {
			return next();
		}

		// Create enhanced cache key
		let cacheKey = SimpleCache.generateCacheKey(req);

		// Include user ID for user-specific caching if needed
		if (varyByUser && req.user && req.user.id) {
			cacheKey = `user:${req.user.id}:${cacheKey}`;
		}

		// Try to get cached response
		const cachedResponse = apiCache.get(cacheKey);
		if (cachedResponse) {
			// Set enhanced cache headers
			res.set({
				'X-Cache': 'HIT',
				'Cache-Control': 'public, max-age=600', // 10 minutes
				ETag: `"${Buffer.from(cacheKey).toString('base64')}"`,
				Vary: varyByUser ? 'Authorization' : undefined,
			});
			return res.json(cachedResponse);
		}

		// Store original res.json method
		const originalJson = res.json;

		// Override res.json to cache the response
		res.json = function (data) {
			// Only cache successful responses with data
			if (res.statusCode === 200 && data && data.success && data.data) {
				// Don't cache empty results or error responses
				if (Array.isArray(data.data) && data.data.length === 0) {
					// Cache empty results for shorter time
					const shortTtl = ttl ? Math.min(ttl, 60000) : 60000; // 1 minute max
					const tempCache = new SimpleCache(50, shortTtl);
					tempCache.set(cacheKey, data);
				} else {
					apiCache.set(cacheKey, data);
				}
			}

			// Set enhanced cache headers
			res.set({
				'X-Cache': 'MISS',
				'Cache-Control': 'public, max-age=600',
				ETag: `"${Buffer.from(cacheKey).toString('base64')}"`,
				Vary: varyByUser ? 'Authorization' : undefined,
			});

			// Call original json method
			return originalJson.call(this, data);
		};

		next();
	};
};

/**
 * Enhanced middleware to clear cache when data is modified
 * @param {string[]} patterns - URL patterns to clear from cache
 * @param {boolean} clearAll - Whether to clear all cache entries
 */
const clearCacheMiddleware = (patterns = [], clearAll = false) => {
	return (req, res, next) => {
		// Store original methods
		const originalJson = res.json;
		const originalSend = res.send;

		// Override response methods to clear cache on successful modifications
		const clearCacheOnSuccess = function (data) {
			// Clear cache if the operation was successful
			if (res.statusCode >= 200 && res.statusCode < 300) {
				if (clearAll || patterns.length === 0) {
					// Clear all cache if no patterns specified or clearAll is true
					apiCache.clear();
					console.log(
						'[CACHE] Cleared all cache entries due to data modification',
					);
				} else {
					// Clear cache entries matching patterns
					let clearedCount = 0;
					for (const [key] of apiCache.cache) {
						if (patterns.some((pattern) => key.includes(pattern))) {
							apiCache.delete(key);
							clearedCount++;
						}
					}
					console.log(
						`[CACHE] Cleared ${clearedCount} cache entries matching patterns: ${patterns.join(
							', ',
						)}`,
					);
				}
			}
		};

		res.json = function (data) {
			clearCacheOnSuccess();
			return originalJson.call(this, data);
		};

		res.send = function (data) {
			clearCacheOnSuccess();
			return originalSend.call(this, data);
		};

		next();
	};
};

/**
 * Middleware to provide cache statistics endpoint
 */
const cacheStatsMiddleware = (req, res) => {
	const stats = apiCache.getStats();
	res.json({
		success: true,
		data: {
			cache: stats,
			uptime: process.uptime(),
			memory: process.memoryUsage(),
		},
	});
};

module.exports = {
	cacheMiddleware,
	clearCacheMiddleware,
	cacheStatsMiddleware,
	apiCache,
	SimpleCache,
};
