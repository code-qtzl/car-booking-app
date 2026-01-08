# Car Listing and Browsing API Documentation

## Overview

The Car Listing and Browsing API provides endpoints for managing and browsing rental car inventory. The API supports both public browsing capabilities and administrative management functions with role-based access control.

**Base URL**: `/api/cars`
**Authentication**: Header-based authentication using `x-user-id`
**Response Format**: JSON

## Authentication

### Public Endpoints

-   Car browsing, searching, and detail viewing are available without authentication
-   Optional authentication provides enhanced features and personalization

### Admin Endpoints

-   Car management operations require admin authentication
-   Admin users must include `x-user-id` header with valid admin email

### Authentication Headers

```
x-user-id: admin@example.com
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...} // Optional additional error details
  }
}
```

## Endpoints

### 1. Get All Cars

**GET** `/api/cars`

Retrieve a paginated list of available cars with optional filtering and sorting.

#### Query Parameters

| Parameter      | Type     | Description                | Example               |
| -------------- | -------- | -------------------------- | --------------------- |
| `search`       | string   | Search term for make/model | `toyota`              |
| `priceMin`     | number   | Minimum daily rate         | `50`                  |
| `priceMax`     | number   | Maximum daily rate         | `200`                 |
| `fuelType`     | string[] | Filter by fuel type        | `Gasoline,Electric`   |
| `transmission` | string   | Filter by transmission     | `Automatic`           |
| `minSeating`   | number   | Minimum seating capacity   | `5`                   |
| `status`       | string   | Availability status        | `Available`           |
| `make`         | string   | Filter by car make         | `Toyota`              |
| `model`        | string   | Filter by car model        | `Camry`               |
| `year`         | number   | Filter by year             | `2023`                |
| `sortBy`       | string   | Sort field                 | `make,dailyRate,year` |
| `sortOrder`    | string   | Sort direction             | `asc,desc`            |
| `limit`        | number   | Results per page (max 50)  | `12`                  |
| `skip`         | number   | Results to skip            | `0`                   |

#### Response

```json
{
	"success": true,
	"data": [
		{
			"_id": "car_id",
			"make": "Toyota",
			"model": "Camry",
			"year": 2023,
			"dailyRate": 75,
			"fuelType": "Gasoline",
			"transmission": "Automatic",
			"seatingCapacity": 5,
			"features": ["GPS", "Bluetooth", "AC"],
			"images": ["/api/cars/images/image1.jpg"],
			"availabilityStatus": "Available",
			"description": "Comfortable sedan perfect for city driving",
			"licensePlate": "ABC123"
		}
	],
	"pagination": {
		"totalCount": 25,
		"currentPage": 1,
		"totalPages": 3,
		"limit": 12,
		"hasMore": true,
		"hasPrevious": false
	}
}
```

#### Status Codes

-   `200` - Success
-   `400` - Invalid query parameters

---

### 2. Get Car by ID

**GET** `/api/cars/:id`

Retrieve detailed information about a specific car.

#### Path Parameters

-   `id` (string, required) - Car ID

#### Response

```json
{
	"success": true,
	"data": {
		"_id": "car_id",
		"make": "Toyota",
		"model": "Camry",
		"year": 2023,
		"dailyRate": 75,
		"fuelType": "Gasoline",
		"transmission": "Automatic",
		"seatingCapacity": 5,
		"features": ["GPS", "Bluetooth", "AC"],
		"images": [
			"/api/cars/images/image1.jpg",
			"/api/cars/images/image2.jpg"
		],
		"availabilityStatus": "Available",
		"description": "Comfortable sedan perfect for city driving",
		"licensePlate": "ABC123",
		"createdAt": "2023-01-01T00:00:00.000Z",
		"updatedAt": "2023-01-01T00:00:00.000Z"
	}
}
```

#### Status Codes

-   `200` - Success
-   `400` - Invalid car ID
-   `404` - Car not found

---

### 3. Search Cars

**GET** `/api/cars/search`

Search cars using text query with optional filtering.

#### Query Parameters

| Parameter       | Type     | Required | Description                     |
| --------------- | -------- | -------- | ------------------------------- |
| `q` or `search` | string   | Yes      | Search term                     |
| `priceMin`      | number   | No       | Minimum daily rate              |
| `priceMax`      | number   | No       | Maximum daily rate              |
| `fuelType`      | string[] | No       | Filter by fuel type             |
| `transmission`  | string   | No       | Filter by transmission          |
| `minSeating`    | number   | No       | Minimum seating capacity        |
| `status`        | string   | No       | Availability status             |
| `sortBy`        | string   | No       | Sort field (default: relevance) |
| `sortOrder`     | string   | No       | Sort direction                  |
| `limit`         | number   | No       | Results per page                |
| `skip`          | number   | No       | Results to skip                 |

#### Response

```json
{
  "success": true,
  "data": [...], // Array of car objects
  "searchTerm": "toyota",
  "pagination": {
    "totalCount": 5,
    "page": 1,
    "limit": 12,
    "hasMore": false
  }
}
```

#### Status Codes

-   `200` - Success
-   `400` - Missing search term

---

### 4. Get Cars by Availability

**GET** `/api/cars/availability/:status`

Get cars filtered by availability status.

#### Path Parameters

-   `status` (string, required) - Availability status (`Available`, `Rented`, `Maintenance`)

#### Response

```json
{
  "success": true,
  "data": [...], // Array of car objects
  "count": 10
}
```

#### Status Codes

-   `200` - Success
-   `400` - Invalid status parameter

---

### 5. Create Car (Admin Only)

**POST** `/api/cars`

Create a new car listing.

#### Headers

-   `x-user-id` (required) - Admin user email

#### Request Body

```json
{
	"make": "Toyota",
	"model": "Camry",
	"year": 2023,
	"dailyRate": 75,
	"fuelType": "Gasoline",
	"transmission": "Automatic",
	"seatingCapacity": 5,
	"features": ["GPS", "Bluetooth", "AC"],
	"availabilityStatus": "Available",
	"description": "Comfortable sedan perfect for city driving",
	"licensePlate": "ABC123"
}
```

#### Required Fields

-   `make`, `model`, `year`, `dailyRate`, `fuelType`, `transmission`, `seatingCapacity`, `licensePlate`

#### Response

```json
{
	"success": true,
	"message": "Car created successfully",
	"data": {
		"_id": "new_car_id",
		// ... car object with all fields
		"createdBy": "admin_user_id",
		"createdAt": "2023-01-01T00:00:00.000Z"
	}
}
```

#### Status Codes

-   `201` - Created successfully
-   `400` - Validation error
-   `401` - Authentication required
-   `403` - Admin access required
-   `409` - Duplicate license plate

---

### 6. Update Car (Admin Only)

**PUT** `/api/cars/:id`

Update an existing car listing.

#### Headers

-   `x-user-id` (required) - Admin user email

#### Path Parameters

-   `id` (string, required) - Car ID

#### Request Body

Any subset of car fields to update.

#### Response

```json
{
	"success": true,
	"message": "Car updated successfully",
	"data": {
		// ... updated car object
		"updatedAt": "2023-01-01T00:00:00.000Z"
	}
}
```

#### Status Codes

-   `200` - Updated successfully
-   `400` - Validation error or missing data
-   `401` - Authentication required
-   `403` - Admin access required
-   `404` - Car not found
-   `409` - Duplicate license plate

---

### 7. Delete Car (Admin Only)

**DELETE** `/api/cars/:id`

Soft delete a car listing (marks as inactive).

#### Headers

-   `x-user-id` (required) - Admin user email

#### Path Parameters

-   `id` (string, required) - Car ID

#### Response

```json
{
	"success": true,
	"message": "Car removed successfully",
	"data": {
		// ... car object with isActive: false
	}
}
```

#### Status Codes

-   `200` - Deleted successfully
-   `400` - Invalid car ID
-   `401` - Authentication required
-   `403` - Admin access required
-   `404` - Car not found
-   `409` - Car currently in use

---

### 8. Upload Car Images (Admin Only)

**POST** `/api/cars/:carId/images`

Upload images for a specific car.

#### Headers

-   `x-user-id` (required) - Admin user email
-   `Content-Type: multipart/form-data`

#### Path Parameters

-   `carId` (string, required) - Car ID

#### Request Body

-   Form data with image files (field name: `images`)
-   Supported formats: JPG, JPEG, PNG, WebP
-   Maximum file size: 5MB per image
-   Maximum files: 10 per request

#### Response

```json
{
	"success": true,
	"message": "Images uploaded successfully",
	"data": {
		"car": {
			// ... updated car object with new image URLs
		},
		"uploadedImages": {
			"count": 3,
			"urls": [
				"/api/cars/images/image1.jpg",
				"/api/cars/images/image2.jpg",
				"/api/cars/images/image3.jpg"
			]
		}
	}
}
```

#### Status Codes

-   `200` - Images uploaded successfully
-   `400` - No files uploaded or invalid car ID
-   `401` - Authentication required
-   `403` - Admin access required
-   `404` - Car not found
-   `413` - File too large
-   `415` - Unsupported file type

---

### 9. Serve Car Image

**GET** `/api/cars/images/:filename`

Serve a car image file.

#### Path Parameters

-   `filename` (string, required) - Image filename

#### Response

-   Binary image data with appropriate Content-Type header
-   Cached for 1 year for performance

#### Status Codes

-   `200` - Image served successfully
-   `400` - Missing filename
-   `404` - Image not found
-   `500` - Server error

---

### 10. Delete Car Images (Admin Only)

**DELETE** `/api/cars/:carId/images`

Delete specific images from a car listing.

#### Headers

-   `x-user-id` (required) - Admin user email

#### Path Parameters

-   `carId` (string, required) - Car ID

#### Request Body

```json
{
	"imageUrls": ["/api/cars/images/image1.jpg", "/api/cars/images/image2.jpg"]
}
```

#### Response

```json
{
	"success": true,
	"message": "Images deleted successfully",
	"data": {
		"car": {
			// ... updated car object without deleted images
		},
		"deletedImages": {
			"count": 2,
			"failed": 0
		}
	}
}
```

#### Status Codes

-   `200` - Images deleted successfully
-   `400` - Missing car ID or image URLs
-   `401` - Authentication required
-   `403` - Admin access required
-   `404` - Car not found

---

### 11. Get Cache Statistics (Admin Only)

**GET** `/api/cars/admin/cache/stats`

Get caching performance statistics.

#### Headers

-   `x-user-id` (required) - Admin user email

#### Response

```json
{
	"success": true,
	"data": {
		"hitRate": 0.85,
		"totalRequests": 1000,
		"cacheHits": 850,
		"cacheMisses": 150,
		"cacheSize": "2.5MB",
		"topCachedEndpoints": [
			{ "endpoint": "/api/cars", "hits": 400 },
			{ "endpoint": "/api/cars/search", "hits": 250 }
		]
	}
}
```

#### Status Codes

-   `200` - Statistics retrieved successfully
-   `401` - Authentication required
-   `403` - Admin access required

## Error Codes

| Code                      | Description                                |
| ------------------------- | ------------------------------------------ |
| `FETCH_CARS_ERROR`        | General error fetching cars                |
| `CAR_NOT_FOUND`           | Requested car does not exist               |
| `MISSING_CAR_ID`          | Car ID parameter is required               |
| `CREATE_CAR_ERROR`        | General error creating car                 |
| `UPDATE_CAR_ERROR`        | General error updating car                 |
| `DELETE_CAR_ERROR`        | General error deleting car                 |
| `VALIDATION_ERROR`        | Request data validation failed             |
| `DUPLICATE_ERROR`         | Duplicate license plate or unique field    |
| `AUTHENTICATION_REQUIRED` | Valid authentication is required           |
| `ADMIN_ACCESS_REQUIRED`   | Admin privileges are required              |
| `MISSING_SEARCH_TERM`     | Search term is required                    |
| `MISSING_STATUS`          | Availability status is required            |
| `NO_FILES_UPLOADED`       | No image files were provided               |
| `UPLOAD_ERROR`            | Error uploading images                     |
| `IMAGE_NOT_FOUND`         | Requested image does not exist             |
| `SERVE_IMAGE_ERROR`       | Error serving image file                   |
| `DELETE_IMAGES_ERROR`     | Error deleting images                      |
| `CAR_IN_USE`              | Cannot delete car that is currently rented |

## Rate Limiting

API endpoints are protected by rate limiting to ensure fair usage:

-   **Public endpoints**: 100 requests per 15 minutes per IP
-   **Admin endpoints**: 200 requests per 15 minutes per user
-   **Image upload**: 20 requests per 15 minutes per user
-   **Search endpoints**: 50 requests per 15 minutes per IP

Rate limit headers are included in responses:

-   `X-RateLimit-Limit`: Request limit per window
-   `X-RateLimit-Remaining`: Requests remaining in current window
-   `X-RateLimit-Reset`: Time when the rate limit resets

## Caching

The API implements intelligent caching for performance:

-   **Car listings**: Cached for 10 minutes
-   **Car details**: Cached for 10 minutes
-   **Search results**: Cached for 5 minutes
-   **Images**: Cached for 24 hours
-   **Availability status**: Cached for 5 minutes

Cache is automatically invalidated when car data is modified through admin operations.

## Security Features

-   **Input validation**: All request data is validated against schemas
-   **SQL injection protection**: Parameterized queries and ORM usage
-   **XSS protection**: Output encoding for user-generated content
-   **File upload security**: File type and size validation
-   **Rate limiting**: Protection against abuse and DoS attacks
-   **CORS configuration**: Controlled cross-origin access
-   **Error sanitization**: Generic error messages to prevent information disclosure

## Examples

### Fetch Cars with Filters

```bash
curl -X GET "http://localhost:5000/api/cars?priceMin=50&priceMax=150&fuelType=Gasoline&transmission=Automatic&sortBy=dailyRate&sortOrder=asc&limit=10"
```

### Search Cars

```bash
curl -X GET "http://localhost:5000/api/cars/search?q=toyota&priceMax=100"
```

### Create Car (Admin)

```bash
curl -X POST "http://localhost:5000/api/cars" \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin@example.com" \
  -d '{
    "make": "Honda",
    "model": "Civic",
    "year": 2023,
    "dailyRate": 65,
    "fuelType": "Gasoline",
    "transmission": "Manual",
    "seatingCapacity": 5,
    "licensePlate": "XYZ789",
    "availabilityStatus": "Available"
  }'
```

### Upload Car Images (Admin)

```bash
curl -X POST "http://localhost:5000/api/cars/car_id/images" \
  -H "x-user-id: admin@example.com" \
  -F "images=@car1.jpg" \
  -F "images=@car2.jpg"
```
