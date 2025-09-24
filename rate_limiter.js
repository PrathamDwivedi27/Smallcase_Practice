// In-memory store for requests. In a real app, you'd use Redis or a database.
const userRequests = new Map();

// --- Configuration ---
const REQUEST_LIMIT = 10; // Max requests per user
const WINDOW_SECONDS = 60; // In seconds

const rateLimiter = (req, res, next) => {
    // Use the user's IP address as a unique identifier.
    // In a real app, you might use a user ID from an authenticated session.
    const ip = req.ip;

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

    // Check if the user is already in our map
    if (!userRequests.has(ip)) {
        // This is the user's first request in a long time.
        userRequests.set(ip, {
            count: 1,
            startTime: currentTime,
        });
        return next();
    }

    const userData = userRequests.get(ip);
    const timeElapsed = currentTime - userData.startTime;

    // Check if the window has expired
    if (timeElapsed > WINDOW_SECONDS) {
        // New window, so reset the counter and start time
        userData.count = 1;
        userData.startTime = currentTime;
        userRequests.set(ip, userData);
        return next();
    }

    // We are still within the same window
    userData.count++;

    // Check if the user has exceeded the request limit
    if (userData.count > REQUEST_LIMIT) {
        return res.status(429).json({
            message: `Too many requests. Please try again in ${WINDOW_SECONDS - timeElapsed} seconds.`,
        });
    }

    // Update the user's data and allow the request
    userRequests.set(ip, userData);
    next();
};

module.exports = rateLimiter;
