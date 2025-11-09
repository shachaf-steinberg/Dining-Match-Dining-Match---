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

// Helper function to get the day of the week from a date string
function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(date + 'T00:00:00Z');
    return daysOfWeek[d.getUTCDay()]; // getUTCDay() returns 0-6 for day of week, not getUTCDate()
}

// Checks if restaurant is open at a given time
function isRestaurantOpen(restaurant, date, time) {
    // 1. Check data
    if (!restaurant.openingHours) {
        return false; 
    }
    const dayName = getDayOfWeek(date);
    const hoursToday = restaurant.openingHours[dayName];
    
    // If the restaurant is closed, return false
    if (!hoursToday || hoursToday.closed) { 
        return false;
    }

    const openTime = hoursToday.open;  
    const closeTime = hoursToday.close; 

    // 3. Handle case of crossing over (closing before opening, e.g. 22:00 to 02:00)
    if (closeTime < openTime) { 
        // פתוח לפני חצות או אחרי חצות
        return time >= openTime || time < closeTime;
    }

    // 4. Regular check (same day)
    // must be less than close time
    return time >= openTime && time < closeTime; 
}

function isOnBudget(restaurant, budget) {
    // Check both price_range (backend format) and priceRange (frontend format)
    return (restaurant.price_range || restaurant.priceRange) === budget;
}

/**
 * Helper Function: Validate Date Format and Check if Not in Past
 * 
 * Validates that the date is in YYYY-MM-DD format and is not in the past.
 * 
 * @param {string} dateString - Date string to validate (expected format: YYYY-MM-DD)
 * @returns {Object} - { isValid: boolean, error?: string }
 */
function validateDate(dateString) {
    // Check format: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return {
            isValid: false,
            error: 'Date must be in YYYY-MM-DD format'
        };
    }
    
    // Parse the date
    const date = new Date(dateString + 'T00:00:00Z');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return {
            isValid: false,
            error: 'Invalid date'
        };
    }
    
    // Check if date is in the past (compare only dates, not time)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const inputDate = new Date(dateString + 'T00:00:00Z');
    inputDate.setUTCHours(0, 0, 0, 0);
    
    if (inputDate < today) {
        return {
            isValid: false,
            error: 'Date cannot be in the past'
        };
    }
    
    return { isValid: true };
}


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
        maxGuests: 60,
        currGuests: 0,
        openingHours: {
            "Monday": { open: "12:00", close: "23:00" },
            "Tuesday": { open: "12:00", close: "23:00" },
            "Wednesday": { open: "12:00", close: "23:00" },
            "Thursday": { open: "12:00", close: "23:00" },
            "Friday": { open: "12:00", close: "23:00" },
            "Saturday": { closed: true },
            "Sunday": { closed: true }
        }
    },
    {
        id: 2,
        name: "Mama Roma",
        cuisine: "Italian",
        address: "Ben Yehuda 45, Jerusalem",
        rating: 4.5,
        price_range: "$$",
        maxGuests: 80,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "18:00", close: "00:00" },
            "Monday": { open: "18:00", close: "00:00" },
            "Tuesday": { open: "18:00", close: "00:00" },
            "Wednesday": { open: "18:00", close: "00:00" },
            "Thursday": { open: "18:00", close: "00:00" },
            "Friday": { open: "18:00", close: "00:00" },
            "Saturday": { open: "18:00", close: "00:00" }
        }
    },
    {
        id: 3,
        name: "Shakshuka House",
        cuisine: "Middle Eastern",
        address: "Rothschild Blvd 23, Tel Aviv",
        rating: 4.6,
        price_range: "$",
        maxGuests: 100,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "08:00", close: "22:00" },
            "Monday": { open: "08:00", close: "22:00" },
            "Tuesday": { open: "08:00", close: "22:00" },
            "Wednesday": { open: "08:00", close: "22:00" },
            "Thursday": { open: "08:00", close: "22:00" },
            "Friday": { open: "08:00", close: "22:00" },
            "Saturday": { open: "08:00", close: "22:00" }
        }
    },
    {
        id: 4,
        name: "Sushi Bar",
        cuisine: "Japanese",
        address: "Dizengoff St 88, Tel Aviv",
        rating: 4.7,
        price_range: "$$$",
        maxGuests: 50,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "18:00", close: "23:00" },
            "Monday": { open: "18:00", close: "23:00" },
            "Tuesday": { open: "18:00", close: "23:00" },
            "Wednesday": { open: "18:00", close: "23:00" },
            "Thursday": { open: "18:00", close: "23:00" },
            "Friday": { open: "12:00", close: "16:00" },
            "Saturday": { closed: true }
        }
    },
    {
        id: 5,
        name: "Hummus Eliyahu",
        cuisine: "Middle Eastern",
        address: "Ben Yehuda St 3, Jerusalem",
        rating: 4.9,
        price_range: "$",
        maxGuests: 40,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "10:00", close: "20:00" },
            "Monday": { open: "10:00", close: "20:00" },
            "Tuesday": { open: "10:00", close: "20:00" },
            "Wednesday": { open: "10:00", close: "20:00" },
            "Thursday": { open: "10:00", close: "20:00" },
            "Friday": { open: "10:00", close: "20:00" },
            "Saturday": { open: "10:00", close: "20:00" }
        }
    },
    {
        id: 6,
        name: "La Gare",
        cuisine: "French",
        address: "King George St 19, Tel Aviv",
        rating: 4.4,
        price_range: "$$$$",
        maxGuests: 40,
        currGuests: 0,
        openingHours: {
            "Monday": { open: "19:00", close: "23:30" },
            "Tuesday": { open: "19:00", close: "23:30" },
            "Wednesday": { open: "19:00", close: "23:30" },
            "Thursday": { open: "19:00", close: "23:30" },
            "Friday": { open: "19:00", close: "23:30" },
            "Saturday": { open: "19:00", close: "23:30" },
            "Sunday": { closed: true }
        }
    },
    {
        id: 7,
        name: "Taizu",
        cuisine: "Asian Fusion",
        address: "HaArba'a St 23, Tel Aviv",
        rating: 4.8,
        price_range: "$$$",
        maxGuests: 70,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "19:00", close: "00:00" },
            "Monday": { open: "19:00", close: "00:00" },
            "Tuesday": { open: "19:00", close: "00:00" },
            "Wednesday": { open: "19:00", close: "00:00" },
            "Thursday": { open: "19:00", close: "00:00" },
            "Friday": { open: "12:00", close: "16:00" },
            "Saturday": { closed: true }
        }
    },
    {
        id: 8,
        name: "Max Brenner",
        cuisine: "Dessert",
        address: "Ben Yehuda St 50, Tel Aviv",
        rating: 4.3,
        price_range: "$$",
        maxGuests: 90,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "10:00", close: "23:00" },
            "Monday": { open: "10:00", close: "23:00" },
            "Tuesday": { open: "10:00", close: "23:00" },
            "Wednesday": { open: "10:00", close: "23:00" },
            "Thursday": { open: "10:00", close: "23:00" },
            "Friday": { open: "10:00", close: "23:00" },
            "Saturday": { open: "10:00", close: "01:00" }
        }
    },
    {
        id: 9,
        name: "Landwer Cafe",
        cuisine: "Cafe",
        address: "Rothschild Blvd 45, Tel Aviv",
        rating: 4.2,
        price_range: "$$",
        maxGuests: 120,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "07:00", close: "23:00" },
            "Monday": { open: "07:00", close: "23:00" },
            "Tuesday": { open: "07:00", close: "23:00" },
            "Wednesday": { open: "07:00", close: "23:00" },
            "Thursday": { open: "07:00", close: "23:00" },
            "Friday": { open: "07:00", close: "23:00" },
            "Saturday": { open: "07:00", close: "23:00" }
        }
    },
    {
        id: 10,
        name: "Machneyuda",
        cuisine: "Israeli",
        address: "Beit Ya'akov St 10, Jerusalem",
        rating: 4.9,
        price_range: "$$$",
        maxGuests: 45,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "19:00", close: "00:00" },
            "Monday": { open: "19:00", close: "00:00" },
            "Tuesday": { open: "19:00", close: "00:00" },
            "Wednesday": { open: "19:00", close: "00:00" },
            "Thursday": { open: "19:00", close: "00:00" },
            "Friday": { closed: true },
            "Saturday": { closed: true }
        }
    },
    {
        id: 11,
        name: "Burgerim",
        cuisine: "American",
        address: "Dizengoff Center, Tel Aviv",
        rating: 4.1,
        price_range: "$",
        maxGuests: 110,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "11:00", close: "23:00" },
            "Monday": { open: "11:00", close: "23:00" },
            "Tuesday": { open: "11:00", close: "23:00" },
            "Wednesday": { open: "11:00", close: "23:00" },
            "Thursday": { open: "11:00", close: "23:00" },
            "Friday": { open: "11:00", close: "23:00" },
            "Saturday": { open: "11:00", close: "23:00" }
        }
    },
    {
        id: 12,
        name: "Cafe Joe",
        cuisine: "Cafe",
        address: "Ben Gurion Blvd 1, Herzliya",
        rating: 4.5,
        price_range: "$$",
        maxGuests: 85,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "08:00", close: "22:00" },
            "Monday": { open: "08:00", close: "22:00" },
            "Tuesday": { open: "08:00", close: "22:00" },
            "Wednesday": { open: "08:00", close: "22:00" },
            "Thursday": { open: "08:00", close: "22:00" },
            "Friday": { open: "08:00", close: "22:00" },
            "Saturday": { open: "08:00", close: "22:00" }
        }
    },
    {
        id: 13,
        name: "Yakimono",
        cuisine: "Japanese",
        address: "HaArba'a St 8, Tel Aviv",
        rating: 4.6,
        price_range: "$$$",
        maxGuests: 55,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "18:00", close: "23:00" },
            "Monday": { open: "18:00", close: "23:00" },
            "Tuesday": { open: "18:00", close: "23:00" },
            "Wednesday": { open: "18:00", close: "23:00" },
            "Thursday": { open: "18:00", close: "23:00" },
            "Friday": { closed: true },
            "Saturday": { closed: true }
        }
    },
    {
        id: 14,
        name: "Abu Hassan",
        cuisine: "Middle Eastern",
        address: "Dolphin St 1, Jaffa",
        rating: 4.8,
        price_range: "$",
        maxGuests: 35,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "08:00", close: "16:00" },
            "Monday": { open: "08:00", close: "16:00" },
            "Tuesday": { open: "08:00", close: "16:00" },
            "Wednesday": { open: "08:00", close: "16:00" },
            "Thursday": { open: "08:00", close: "16:00" },
            "Friday": { open: "08:00", close: "16:00" },
            "Saturday": { open: "08:00", close: "16:00" }
        }
    },
    {
        id: 15,
        name: "The Eucalyptus",
        cuisine: "Israeli",
        address: "Hativat Yerushalayim St 14, Jerusalem",
        rating: 4.7,
        price_range: "$$$",
        maxGuests: 65,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "12:00", close: "23:00" },
            "Monday": { open: "12:00", close: "23:00" },
            "Tuesday": { open: "12:00", close: "23:00" },
            "Wednesday": { open: "12:00", close: "23:00" },
            "Thursday": { open: "12:00", close: "23:00" },
            "Friday": { closed: true },
            "Saturday": { closed: true }
        }
    },
    {
        id: 16,
        name: "Cafe Noir",
        cuisine: "French",
        address: "Ahad Ha'Am St 43, Tel Aviv",
        rating: 4.4,
        price_range: "$$",
        maxGuests: 75,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "08:00", close: "01:00" },
            "Monday": { open: "08:00", close: "01:00" },
            "Tuesday": { open: "08:00", close: "01:00" },
            "Wednesday": { open: "08:00", close: "01:00" },
            "Thursday": { open: "08:00", close: "01:00" },
            "Friday": { open: "08:00", close: "01:00" },
            "Saturday": { open: "08:00", close: "01:00" }
        }
    },
    {
        id: 17,
        name: "Roladin",
        cuisine: "Bakery",
        address: "Dizengoff St 50, Tel Aviv",
        rating: 4.3,
        price_range: "$",
        maxGuests: 50,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "07:00", close: "22:00" },
            "Monday": { open: "07:00", close: "22:00" },
            "Tuesday": { open: "07:00", close: "22:00" },
            "Wednesday": { open: "07:00", close: "22:00" },
            "Thursday": { open: "07:00", close: "22:00" },
            "Friday": { open: "07:00", close: "22:00" },
            "Saturday": { open: "07:00", close: "22:00" }
        }
    },
    {
        id: 18,
        name: "Herbert Samuel",
        cuisine: "Seafood",
        address: "Kaufmann St 6, Tel Aviv",
        rating: 4.8,
        price_range: "$$$$",
        maxGuests: 50,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "19:00", close: "23:00" },
            "Monday": { open: "19:00", close: "23:00" },
            "Tuesday": { open: "19:00", close: "23:00" },
            "Wednesday": { open: "19:00", close: "23:00" },
            "Thursday": { open: "19:00", close: "23:00" },
            "Friday": { open: "12:00", close: "16:00" },
            "Saturday": { closed: true }
        }
    },
    {
        id: 19,
        name: "Cafe Xoho",
        cuisine: "Cafe",
        address: "Gordon St 8, Tel Aviv",
        rating: 4.5,
        price_range: "$$",
        maxGuests: 60,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "07:30", close: "18:00" },
            "Monday": { open: "07:30", close: "18:00" },
            "Tuesday": { open: "07:30", close: "18:00" },
            "Wednesday": { open: "07:30", close: "18:00" },
            "Thursday": { open: "07:30", close: "18:00" },
            "Friday": { open: "07:30", close: "18:00" },
            "Saturday": { open: "07:30", close: "18:00" }
        }
    },
    {
        id: 20,
        name: "Tandoori",
        cuisine: "Indian",
        address: "Ben Yehuda St 30, Tel Aviv",
        rating: 4.6,
        price_range: "$$",
        maxGuests: 70,
        currGuests: 0,
        openingHours: {
            "Sunday": { open: "12:00", close: "23:00" },
            "Monday": { open: "12:00", close: "23:00" },
            "Tuesday": { open: "12:00", close: "23:00" },
            "Wednesday": { open: "12:00", close: "23:00" },
            "Thursday": { open: "12:00", close: "23:00" },
            "Friday": { open: "12:00", close: "23:00" },
            "Saturday": { open: "12:00", close: "23:00" }
        }
    }
];

/**
 * Helper Function: Parse Address String to Structured Format
 * 
 * Converts address string like "HaNamal St 12, Tel Aviv" to structured format
 * { street: "HaNamal St", number: "12", city: "Tel Aviv" }
 */
function parseAddress(addressString) {
    // Try to extract street number and city
    const parts = addressString.split(',').map(s => s.trim());
    if (parts.length >= 2) {
        const city = parts[parts.length - 1];
        const streetPart = parts.slice(0, -1).join(', ');
        // Try to extract number from street part
        const numberMatch = streetPart.match(/(\d+)/);
        const number = numberMatch ? numberMatch[1] : '';
        const street = streetPart.replace(/\d+/g, '').trim();
        return { street, number, city };
    }
    // Fallback: if no comma, try to extract number
    const numberMatch = addressString.match(/(\d+)/);
    const number = numberMatch ? numberMatch[1] : '';
    const street = addressString.replace(/\d+/g, '').trim();
    return { street, number, city: '' };
}

/**
 * Helper Function: Parse Hours String to Structured Format
 * 
 * Converts hours string like "Mon-Fri: 12:00-23:00" to structured openingHours object
 */
function parseOpeningHours(hoursString) {
    const openingHours = {};
    
    // Handle "Daily" case
    if (hoursString.toLowerCase().includes('daily')) {
        const timeMatch = hoursString.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (timeMatch) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            days.forEach(day => {
                openingHours[day] = {
                    open: timeMatch[1],
                    close: timeMatch[2],
                    closed: false
                };
            });
        }
        return openingHours;
    }
    
    // Handle day ranges like "Mon-Fri"
    const dayRanges = hoursString.split(',').map(s => s.trim());
    const dayMap = {
        'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
        'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
    };
    
    dayRanges.forEach(range => {
        const timeMatch = range.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!timeMatch) return;
        
        const dayPart = range.split(':')[0].trim();
        const days = [];
        
        if (dayPart.includes('-')) {
            const [start, end] = dayPart.split('-').map(d => d.trim());
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const startIdx = dayNames.findIndex(d => d.startsWith(dayMap[start] || start));
            const endIdx = dayNames.findIndex(d => d.startsWith(dayMap[end] || end));
            if (startIdx !== -1 && endIdx !== -1) {
                for (let i = startIdx; i <= endIdx; i++) {
                    days.push(dayNames[i]);
                }
            }
        } else {
            const dayName = dayMap[dayPart] || dayPart;
            if (dayName) days.push(dayName);
        }
        
        days.forEach(day => {
            openingHours[day] = {
                open: timeMatch[1],
                close: timeMatch[2],
                closed: false
            };
        });
    });
    
    // Set other days as closed
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    allDays.forEach(day => {
        if (!openingHours[day]) {
            openingHours[day] = { closed: true };
        }
    });
    
    return openingHours;
}

/**
 * Helper Function: Transform Restaurant Data to Frontend Format
 * 
 * Converts backend format to match frontend Restaurant interface
 */
function transformRestaurantToFrontendFormat(restaurant) {
    return {
        id: String(restaurant.id),
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: typeof restaurant.address === 'string' 
            ? parseAddress(restaurant.address)
            : restaurant.address,
        rating: restaurant.rating,
        priceRange: restaurant.price_range || restaurant.priceRange,
        imageUrl: restaurant.imageUrl,
        phoneNumber: restaurant.phoneNumber,
        website: restaurant.website,
        description: restaurant.description,
        openingHours: restaurant.openingHours 
            ? restaurant.openingHours 
            : (restaurant.hours_of_operation 
                ? parseOpeningHours(restaurant.hours_of_operation)
                : undefined),
        dietaryOptions: restaurant.dietaryOptions,
        features: restaurant.features,
        maxGuests: restaurant.maxGuests || 50, // Default to 50 if not set
        currGuests: restaurant.currGuests || 0 // Default to 0 if not set
    };
}

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
    return Math.max(...restaurantsData.map(r => typeof r.id === 'string' ? parseInt(r.id) : r.id)) + 1;
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
    
    // Address can be either string or object (frontend format)
    if (!restaurant.address) {
        errors.push('Address is required');
    } else if (typeof restaurant.address === 'string' && restaurant.address.trim().length === 0) {
        errors.push('Address must be a non-empty string');
    } else if (typeof restaurant.address === 'object') {
        // Validate structured address format
        if (!restaurant.address.street || typeof restaurant.address.street !== 'string') {
            errors.push('Address street is required');
        }
        if (!restaurant.address.city || typeof restaurant.address.city !== 'string') {
            errors.push('Address city is required');
        }
    }
    
    if (restaurant.rating !== undefined && restaurant.rating !== null) {
        const rating = parseFloat(restaurant.rating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.push('Rating must be a number between 0 and 5');
        }
    }
    
    // Accept both price_range (backend) and priceRange (frontend)
    const priceRange = restaurant.priceRange || restaurant.price_range;
    if (priceRange && typeof priceRange !== 'string') {
        errors.push('Price range must be a string');
    }
    if (priceRange && !['$', '$$', '$$$', '$$$$'].includes(priceRange)) {
        errors.push('Price range must be one of: $, $$, $$$, $$$$');
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
        let filteredData = restaurantsData;
        
        // 1. Extract search parameters from query string
        const { cuisine, date, time, budget, location, rating, numGuests } = req.query;
        
        // 2. Filter by cuisine type
        if (cuisine) {
            filteredData = filteredData.filter(restaurant => 
                restaurant.cuisine.toLowerCase().includes(cuisine.toLowerCase())
            );
        }
        
        // 3. Filter by availability (date and time) - critical filter
        if (date && time) {
            // Validate date format and check if not in past
            const dateValidation = validateDate(date);
            if (!dateValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: dateValidation.error
                });
            }
            
            filteredData = filteredData.filter(restaurant => 
                isRestaurantOpen(restaurant, date, time)
            );
        }
        
        // 4. Filter by budget/price range
        if (budget) {
            filteredData = filteredData.filter(restaurant => 
                isOnBudget(restaurant, budget)
            );
        }
        
        // 5. Filter by location (city)
        if (location) {
            filteredData = filteredData.filter(restaurant => {
                const address = typeof restaurant.address === 'string' 
                    ? restaurant.address 
                    : `${restaurant.address.street} ${restaurant.address.number}, ${restaurant.address.city}`;
                return address.toLowerCase().includes(location.toLowerCase());
            });
        }
        
        // 6. Filter by minimum rating
        if (rating) {
            const minRating = parseFloat(rating);
            if (!isNaN(minRating)) {
                filteredData = filteredData.filter(restaurant => 
                    restaurant.rating && restaurant.rating >= minRating
                );
            }
        }
        
        // 7. Filter by number of guests (capacity check)
        if (numGuests) {
            const requestedGuests = parseInt(numGuests);
            if (!isNaN(requestedGuests) && requestedGuests > 0) {
                filteredData = filteredData.filter(restaurant => {
                    const maxGuests = restaurant.maxGuests || 50;
                    const currGuests = restaurant.currGuests || 0;
                    const availableCapacity = maxGuests - currGuests;
                    return availableCapacity >= requestedGuests;
                });
            }
        }
        
        // Transform data to match frontend format
        const transformedData = filteredData.map(restaurant => 
            transformRestaurantToFrontendFormat(restaurant)
        );
        
        res.status(200).json({
            success: true,
            count: transformedData.length,
            data: transformedData
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
        
        const restaurant = restaurantsData.find(r => 
            (typeof r.id === 'string' ? parseInt(r.id) : r.id) === id
        );
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: `Restaurant with ID ${id} not found`
            });
        }
        
        // Transform data to match frontend format
        const transformedRestaurant = transformRestaurantToFrontendFormat(restaurant);
        
        res.status(200).json({
            success: true,
            data: transformedRestaurant
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
        
        // Create new restaurant - accept both frontend and backend formats
        const newRestaurant = {
            id: getNextId(),
            name: req.body.name.trim(),
            cuisine: req.body.cuisine.trim(),
            address: typeof req.body.address === 'object' 
                ? req.body.address 
                : req.body.address.trim(),
            rating: req.body.rating ? parseFloat(req.body.rating) : null,
            price_range: req.body.priceRange || req.body.price_range || null,
            hours_of_operation: req.body.openingHours 
                ? null // Will be converted from openingHours if needed
                : req.body.hours_of_operation || null,
            openingHours: req.body.openingHours || null,
            imageUrl: req.body.imageUrl || null,
            phoneNumber: req.body.phoneNumber || null,
            website: req.body.website || null,
            description: req.body.description || null,
            dietaryOptions: req.body.dietaryOptions || null,
            features: req.body.features || null
        };
        
        restaurantsData.push(newRestaurant);
        
        // Transform to frontend format for response
        const transformedRestaurant = transformRestaurantToFrontendFormat(newRestaurant);
        
        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: transformedRestaurant
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
        
        const restaurantIndex = restaurantsData.findIndex(r => 
            (typeof r.id === 'string' ? parseInt(r.id) : r.id) === id
        );
        
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
        
        // Update restaurant - handle both frontend and backend formats
        const updateData = {
            ...req.body,
            id: id // Ensure ID cannot be changed
        };
        
        // Convert frontend format to backend format if needed
        if (req.body.priceRange && !req.body.price_range) {
            updateData.price_range = req.body.priceRange;
        }
        if (req.body.openingHours && !req.body.hours_of_operation) {
            // Keep openingHours for transformation
            updateData.openingHours = req.body.openingHours;
        }
        
        restaurantsData[restaurantIndex] = {
            ...restaurantsData[restaurantIndex],
            ...updateData
        };
        
        // Transform to frontend format for response
        const transformedRestaurant = transformRestaurantToFrontendFormat(restaurantsData[restaurantIndex]);
        
        res.status(200).json({
            success: true,
            message: 'Restaurant updated successfully',
            data: transformedRestaurant
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
        
        const restaurantIndex = restaurantsData.findIndex(r => 
            (typeof r.id === 'string' ? parseInt(r.id) : r.id) === id
        );
        
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

/**
 * POST /api/reservations
 * 
 * Creates a new reservation and updates the restaurant's current guest count.
 * 
 * REQUEST BODY:
 * {
 *   restaurantId: number,
 *   date: string (YYYY-MM-DD),
 *   time: string (HH:MM),
 *   numGuests: number
 * }
 * 
 * RETURNS: Reservation confirmation
 * STATUS: 201 if created, 400 if validation fails, 404 if restaurant not found
 */
app.post('/api/reservations', (req, res) => {
    try {
        const { restaurantId, date, time, numGuests } = req.body;
        
        // Validate required fields
        if (!restaurantId || !date || !time || !numGuests) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: restaurantId, date, time, and numGuests are required'
            });
        }
        
        // Validate date format and check if not in past
        const dateValidation = validateDate(date);
        if (!dateValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: dateValidation.error
            });
        }
        
        // Validate numGuests
        const guests = parseInt(numGuests);
        if (isNaN(guests) || guests <= 0) {
            return res.status(400).json({
                success: false,
                message: 'numGuests must be a positive number'
            });
        }
        
        // Find restaurant
        const restaurantIdNum = parseInt(restaurantId);
        if (isNaN(restaurantIdNum)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }
        
        const restaurantIndex = restaurantsData.findIndex(r => 
            (typeof r.id === 'string' ? parseInt(r.id) : r.id) === restaurantIdNum
        );
        
        if (restaurantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Restaurant with ID ${restaurantId} not found`
            });
        }
        
        const restaurant = restaurantsData[restaurantIndex];
        
        // Check if restaurant is open at the requested date and time
        if (!isRestaurantOpen(restaurant, date, time)) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant is not open at the requested date and time'
            });
        }
        
        // Check capacity
        const maxGuests = restaurant.maxGuests || 50;
        const currGuests = restaurant.currGuests || 0;
        const availableCapacity = maxGuests - currGuests;
        
        if (guests > availableCapacity) {
            return res.status(400).json({
                success: false,
                message: `Not enough capacity. Available: ${availableCapacity}, Requested: ${guests}`
            });
        }
        
        // Update current guests count
        restaurantsData[restaurantIndex].currGuests = (restaurant.currGuests || 0) + guests;
        
        // Transform restaurant data for response
        const updatedRestaurant = transformRestaurantToFrontendFormat(restaurantsData[restaurantIndex]);
        
        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: {
                restaurantId: restaurantIdNum,
                date,
                time,
                numGuests: guests,
                restaurant: updatedRestaurant
            }
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating reservation'
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
            'DELETE /api/restaurants/:id',
            'POST /api/reservations'
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
    console.log(`   - POST   /api/reservations`);
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
