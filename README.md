# Capstone Car Booking App

A full-stack web application for car booking and management, built as a capstone project.

## Project Overview

This application consists of a backend API built with Node.js and Express, and a frontend built with React and Vite. It allows users to browse, book, and manage cars, with separate dashboards for customers and administrators.

## Tech Stack

### Backend

-   **Node.js** - JavaScript runtime
-   **Express.js** - Web framework for Node.js
-   **MongoDB** - NoSQL database
-   **Mongoose** - MongoDB object modeling
-   **bcrypt** - Password hashing
-   **multer** - File upload handling
-   **helmet** - Security middleware
-   **express-rate-limit** - Rate limiting
-   **express-validator** - Input validation
-   **Jest** - Testing framework
-   **supertest** - API testing

### Frontend

-   **React 19** - UI library
-   **Vite** - Build tool and dev server
-   **Redux Toolkit** - State management
-   **React Router** - Client-side routing
-   **Axios** - HTTP client
-   **PicoCSS** - Minimal CSS framework
-   **Vitest** - Testing framework
-   **Testing Library** - React testing utilities
-   **ESLint** - Linting

## Prerequisites

-   Node.js (version 16 or higher)
-   npm or yarn
-   MongoDB database (local or cloud instance like MongoDB Atlas)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/code-qtzl/car-booking-app
    cd car-booking-app
    ```

2. Install all dependencies:

    ```bash
    npm run install:all
    ```

3. Set up environment variables:
    - Create a `.env` file in the `backend` directory
    - Add the following variables:
        ```
        MONGO_URL=your_mongodb_connection_string
        PORT=5000
        JWT_SECRET=your_jwt_secret
        ```

## Running the Application

### Development Mode

1. Start the backend server:

    ```bash
    cd backend
    npm run server
    ```

    The backend will run on `http://localhost:5000`

2. In a new terminal, start the frontend:
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will run on `http://localhost:5173`

### Production Build

1. Build the frontend:

    ```bash
    cd frontend
    npm run build
    ```

2. The built files will be in `frontend/dist/`

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Frontend Tests with UI

```bash
cd frontend
npm run test:ui
```

## Project Structure

```
capstone-car-booking-app/
├── backend/                 # Express.js API server
│   ├── config/             # Database and configuration
│   ├── controller/         # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── model/              # Mongoose models
│   ├── repository/         # Data access layer
│   ├── router/             # API routes
│   ├── service/            # Business logic
│   └── uploads/            # File uploads
├── frontend/               # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── service/        # API services
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   └── test/               # Test files
└── package.json            # Root package scripts
```

## Features

-   User authentication and authorization
-   Car listings with image uploads
-   Search and filtering
-   Admin dashboard for car management
-   Customer dashboard
-   Responsive design
-   API documentation

## License

This project is licensed under the ISC License.
