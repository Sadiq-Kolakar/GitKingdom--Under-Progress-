const express = require('express');
const router = express.Router();
const { githubRateLimiter } = require('../middleware/rateLimiter');
const githubService = require('../services/githubService');

// GET /api/github/:username → proxied + cached GitHub data
router.get('/:username', githubRateLimiter, async (req, res) => {
  const { username } = req.params;
  
  try {
    const data = await githubService.getPublicGithubProfile(username);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch github data' });
  }
});

module.exports = router;
