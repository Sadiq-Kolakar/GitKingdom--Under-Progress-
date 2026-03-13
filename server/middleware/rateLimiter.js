const rateLimit = require('express-rate-limit');

// Simple rate limiter to guard against exhausting Github API Limits
// This will return 429 Too Many Requests if the limit is exceeded
const githubRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 4800, // Slightly under 5000 to be safe
  message: {
    error: 'Too many requests from this IP to Github API, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  githubRateLimiter,
};
