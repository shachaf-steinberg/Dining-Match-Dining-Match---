/**
 * ===================================================================================
 * Dining Match Backend Server
 * ===================================================================================
 * 
 * A RESTful API server built with Express.js for the Dining Match application.
 * This server provides endpoints for managing restaurant data.
 * 
 * @author Dining Match Team
 * @version 2.0.0
 * ===================================================================================
 */

// ===================================================================================
// 1. DEPENDENCIES AND INITIALIZATION
// ===================================================================================

const express = require('express');
const cors = require('cors');
const app = express();

// Use environment variable for port (for production flexibility) or default to 3001
// This allows deployment platforms (Heroku, Railway, etc.) to set their own port
const PORT = process.env.PORT || 3001;

// ===================================================================================
// 2. MIDDLEWARE CONFIGURATION
// ===================================================================================

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * WHY THIS CHANGE: The original implementation used cors() with default settings,
 * which allows ALL origins. In production, this is a security risk.
 * 
 * IMPROVEMENTS:
 * - Explicitly configure allowed origins (can be updated for production)
 * - Allow credentials if needed in future
 * - Better security posture
 */
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // In production, set this to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false // Set to true if you need cookies/auth headers
};
app.use(cors(corsOptions));

/**
 * JSON Body Parser Middleware
 * 
 * Parses incoming JSON payloads in request bodies.
 * The limit parameter prevents abuse from large payloads.
 */
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size for security

/**
 * URL-Encoded Body Parser Middleware
 * 
 * Parses URL-encoded form data (e.g., from HTML forms).
 * Extended: true allows parsing of rich objects and arrays.
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request Logging Middleware
 * 
 * WHY THIS CHANGE: The original code had no logging, making debugging difficult.
 * 
 * This middleware logs all incoming requests with method, URL, timestamp, and IP.
 * Useful for monitoring and debugging in development.
 */
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next(); // Continue to next middleware/route handler
});

// ===================================================================================
// 3. DATA STORAGE (MOCK DATABASE)
// ===================================================================================

/**
 * Mock Restaurant Data
 * 
 * This is a static array that simulates a database.
 * In a production application, you would replace this with:
 * - MongoDB (with Mongoose)
 * - PostgreSQL (with pg or Sequelize)
 * - MySQL (with mysql2 or Sequelize)
 * - Or any other database solution
 * 
 * TODO: Replace with actual database integration
 */
let restaurantsData = [
    {
        id: 1,
        name: "Chef Yam",
        cuisine: "Seafood",
        address: "HaNamal St 12, Tel Aviv",
        rating: 4.8,
        price_range: "$$$",
        hours_of_operation: "Mon-Fri: 12:00-23:00"
    },
    {
        id: 2,
        name: "Mama Roma",
        cuisine: "Italian",
        address: "Ben Yehuda 45, Jerusalem",
        rating: 4.5,
        price_range: "$$",
        hours_of_operation: "Daily: 18:00-00:00"
    }
    // Add more mock restaurants here as needed
];

/**
 * Helper Function: Generate Next ID
 * 
 * WHY THIS CHANGE: Needed for POST requests to create new restaurants.
 * In a real database, the ID would be auto-generated.
 * 
 * Finds the highest ID in the array and returns the next available ID.
 */
function getNextId() {
    if (restaurantsData.length === 0) return 1;
    return Math.max(...restaurantsData.map(r => r.id)) + 1;
}

/**
 * Helper Function: Validate Restaurant Data
 * 
 * WHY THIS CHANGE: Input validation is crucial for data integrity and security.
 * Prevents invalid or malicious data from being stored.
 * 
 * @param {Object} restaurant - Restaurant object to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateRestaurant(restaurant) {
    const errors = [];
    
    if (!restaurant.name || typeof restaurant.name !== 'string' || restaurant.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }
    
    if (!restaurant.cuisine || typeof restaurant.cuisine !== 'string' || restaurant.cuisine.trim().length === 0) {
        errors.push('Cuisine is required and must be a non-empty string');
    }
    
    if (!restaurant.address || typeof restaurant.address !== 'string' || restaurant.address.trim().length === 0) {
        errors.push('Address is required and must be a non-empty string');
    }
    
    if (restaurant.rating !== undefined) {
        const rating = parseFloat(restaurant.rating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.push('Rating must be a number between 0 and 5');
        }
    }
    
    if (restaurant.price_range && typeof restaurant.price_range !== 'string') {
        errors.push('Price range must be a string');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// ===================================================================================
// 4. API ENDPOINTS
// ===================================================================================

/**
 * GET /api/health
 * 
 * WHY THIS CHANGE: Health check endpoints are essential for:
 * - Monitoring service status
 * - Load balancers to check if server is alive
 * - Deployment platforms to verify successful deployment
 * 
 * Returns server status and basic information.
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/restaurants
 * 
 * RETURNS: Array of all restaurants
 * 
 * IMPROVEMENTS:
 * - Changed route to /api/restaurants for better REST API conventions
 * - Added error handling
 * - Returns proper HTTP status codes
 * - Can filter by cuisine via query parameter (future enhancement ready)
 */
app.get('/api/restaurants', (req, res) => {
    try {
        // Optional: Filter by cuisine if query parameter is provided
        let filteredData = restaurantsData;
        
        if (req.query.cuisine) {
            filteredData = restaurantsData.filter(restaurant => 
                restaurant.cuisine.toLowerCase().includes(req.query.cuisine.toLowerCase())
            );
        }
        
        res.status(200).json({
            success: true,
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurants'
        });
    }
});

/**
 * GET /api/restaurants/:id
 * 
 * WHY THIS CHANGE: RESTful API best practice - individual resource retrieval.
 * 
 * RETURNS: Single restaurant by ID
 * STATUS: 200 if found, 404 if not found
 */
app.get('/api/restaurants/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }
        
        const restaurant = restaurantsData.find(r => r.id === id);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: `Restaurant with ID ${id} not found`
            });
        }
        
        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurant'
        });
    }
});

/**
 * POST /api/restaurants
 * 
 * WHY THIS CHANGE: Allows creating new restaurants (CRUD - Create operation).
 * 
 * CREATES: New restaurant
 * RETURNS: Created restaurant with assigned ID
 * STATUS: 201 if created, 400 if validation fails
 */
app.post('/api/restaurants', (req, res) => {
    try {
        // Validate input data
        const validation = validateRestaurant(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }
        
        // Create new restaurant
        const newRestaurant = {
            id: getNextId(),
            name: req.body.name.trim(),
            cuisine: req.body.cuisine.trim(),
            address: req.body.address.trim(),
            rating: req.body.rating ? parseFloat(req.body.rating) : null,
            price_range: req.body.price_range || null,
            hours_of_operation: req.body.hours_of_operation || null
        };
        
        restaurantsData.push(newRestaurant);
        
        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: newRestaurant
        });
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating restaurant'
        });
    }
});

/**
 * PUT /api/restaurants/:id
 * 
 * WHY THIS CHANGE: Allows updating existing restaurants (CRUD - Update operation).
 * 
 * UPDATES: Restaurant by ID
 * RETURNS: Updated restaurant
 * STATUS: 200 if updated, 404 if not found, 400 if validation fails
 */
app.put('/api/restaurants/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }
        
        const restaurantIndex = restaurantsData.findIndex(r => r.id === id);
        
        if (restaurantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Restaurant with ID ${id} not found`
            });
        }
        
        // Validate input data
        const validation = validateRestaurant(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }
        
        // Update restaurant
        restaurantsData[restaurantIndex] = {
            ...restaurantsData[restaurantIndex],
            ...req.body,
            id: id // Ensure ID cannot be changed
        };
        
        res.status(200).json({
            success: true,
            message: 'Restaurant updated successfully',
            data: restaurantsData[restaurantIndex]
        });
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating restaurant'
        });
    }
});

/**
 * DELETE /api/restaurants/:id
 * 
 * WHY THIS CHANGE: Allows deleting restaurants (CRUD - Delete operation).
 * 
 * DELETES: Restaurant by ID
 * RETURNS: Success message
 * STATUS: 200 if deleted, 404 if not found
 */
app.delete('/api/restaurants/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }
        
        const restaurantIndex = restaurantsData.findIndex(r => r.id === id);
        
        if (restaurantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Restaurant with ID ${id} not found`
            });
        }
        
        restaurantsData.splice(restaurantIndex, 1);
        
        res.status(200).json({
            success: true,
            message: `Restaurant with ID ${id} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting restaurant'
        });
    }
});

// ===================================================================================
// 5. ERROR HANDLING MIDDLEWARE
// ===================================================================================

/**
 * 404 Not Found Handler
 * 
 * WHY THIS CHANGE: The original code had no 404 handling.
 * This middleware catches all unmatched routes and returns a proper 404 response.
 * 
 * IMPORTANT: This must be placed AFTER all route definitions.
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: [
            'GET /api/health',
            'GET /api/restaurants',
            'GET /api/restaurants/:id',
            'POST /api/restaurants',
            'PUT /api/restaurants/:id',
            'DELETE /api/restaurants/:id'
        ]
    });
});

/**
 * Global Error Handler Middleware
 * 
 * WHY THIS CHANGE: The original code had no error handling.
 * This middleware catches any unhandled errors and returns a proper error response.
 * 
 * IMPORTANT: This must be placed AFTER all route definitions and 404 handler.
 */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===================================================================================
// 6. SERVER INITIALIZATION
// ===================================================================================

/**
 * Start the Express server
 * 
 * IMPROVEMENTS:
 * - Better error handling for server startup
 * - More informative startup messages
 * - Graceful shutdown handling (for production)
 */
const server = app.listen(PORT, () => {
    console.log('================================================');
    console.log('🍽️  Dining Match Backend Server');
    console.log('================================================');
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API Endpoints:`);
    console.log(`   - GET    /api/health`);
    console.log(`   - GET    /api/restaurants`);
    console.log(`   - GET    /api/restaurants/:id`);
    console.log(`   - POST   /api/restaurants`);
    console.log(`   - PUT    /api/restaurants/:id`);
    console.log(`   - DELETE /api/restaurants/:id`);
    console.log('================================================');
});

/**
 * Graceful Shutdown Handler
 * 
 * WHY THIS CHANGE: Allows the server to shut down gracefully in production.
 * Important for deployment platforms and preventing data loss.
 * 
 * Handles SIGTERM (termination signal) and SIGINT (Ctrl+C) for clean shutdown.
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Export the app for testing purposes (if needed)
module.exports = app;
