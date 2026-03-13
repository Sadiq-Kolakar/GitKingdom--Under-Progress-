const express = require('express');
const router = express.Router();
const Kingdom = require('../models/Kingdom');

// GET /api/users/search?q= → search kingdoms by username
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Find kingdoms whose username matches the query regex
    const kingdoms = await Kingdom.find({
      username: { $regex: new RegExp(q, 'i') }
    }).select('username position level characterClass avatarUrl');

    res.json(kingdoms);
  } catch (err) {
    res.status(500).json({ error: 'Server error searching users' });
  }
});

module.exports = router;
