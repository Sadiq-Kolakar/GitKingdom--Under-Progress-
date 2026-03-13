const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Kingdom = require('../models/Kingdom');
const User = require('../models/User');
const kingdomBuilder = require('../services/kingdomBuilder');
const githubService = require('../services/githubService');

// GET /api/kingdoms → all kingdoms (position + fog state only, no heavy data)
router.get('/', async (req, res) => {
  try {
    // Return minimal data for map rendering, sorting to find Hall of Legends easily
    const kingdoms = await Kingdom.find({})
      .select('username position isClaimed activityState level size terrain _id')
      .sort({ level: -1 }) // level represents totalCommits capped usually, but gives a good pre-sort
      .lean();
      
    // Mark top 3 as Hall of Legends
    let legendsCount = 0;
    kingdoms.forEach(k => {
       if (legendsCount < 3 && k.isClaimed && !k.isNPC) {
         k.isHallOfLegends = true;
         legendsCount++;
       } else {
         k.isHallOfLegends = false;
       }
    });

    res.json(kingdoms);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching kingdoms' });
  }
});

// GET /api/kingdoms/:username → full kingdom data for parchment panel
router.get('/:username', async (req, res) => {
  try {
    const kingdom = await Kingdom.findOne({ username: req.params.username });
    if (!kingdom) {
      return res.status(404).json({ error: 'Kingdom not found' });
    }
    res.json(kingdom);
  } catch (err) {
    res.status(500).json({ error: 'Server error getting kingdom' });
  }
});

// POST /api/kingdoms/claim → claim a kingdom (auth required)
router.post('/claim', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (user.hasClaimed) {
      return res.status(400).json({ error: 'User has already claimed a kingdom' });
    }

    const { placeInFrontier } = require('../services/placementEngine');
    
    // Instead of taking position from req.body, use placement engine
    const position = await placeInFrontier();

    const accessToken = githubService.decryptToken(user.accessToken);
    const githubData = await githubService.fetchFullGithubData(user.username, accessToken);
    
    let kingdom = existing;
    if (!kingdom) {
      kingdom = new Kingdom({
        username: user.username,
        position,
      });
    } else {
      kingdom.username = user.username;
    }

    kingdom.isClaimed = true;
    kingdom.claimedAt = Date.now();
    kingdom.githubData = githubData;
    
    // Apply stats to generate kingdom traits
    const builtKingdom = kingdomBuilder.build(kingdom, githubData);
    
    await builtKingdom.save();

    user.hasClaimed = true;
    user.claimedAt = Date.now();
    await user.save();

    res.json(builtKingdom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error claiming kingdom' });
  }
});

// PUT /api/kingdoms/refresh → refresh GitHub data (24hr cooldown, auth required)
router.put('/refresh', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const kingdom = await Kingdom.findOne({ username: user.username });
    
    if (!kingdom || !kingdom.isClaimed) {
      return res.status(404).json({ error: 'No claimed kingdom found' });
    }

    const lastRefreshed = kingdom.githubData && kingdom.githubData.lastRefreshed;
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    
    if (lastRefreshed && (Date.now() - new Date(lastRefreshed).getTime()) < cooldown) {
      return res.status(429).json({ error: 'Refresh is on cooldown (24hr)' });
    }

    const accessToken = githubService.decryptToken(user.accessToken);
    const githubData = await githubService.fetchFullGithubData(user.username, accessToken);
    
    kingdom.githubData = githubData;
    kingdom.githubData.lastRefreshed = Date.now();
    
    // Re-evaluate based on new stats
    const updatedKingdom = kingdomBuilder.build(kingdom, githubData);
    await updatedKingdom.save();

    res.json(updatedKingdom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error refreshing kingdom' });
  }
});

module.exports = router;
