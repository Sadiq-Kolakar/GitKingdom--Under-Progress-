const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const githubService = require('../services/githubService');

// POST /api/auth/github → redirect to GitHub OAuth
router.get('/github', (req, res) => {
  const { state } = req.query;
  // scopes: read:user public_repo ONLY (strictly requested!)
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.CLIENT_URL}/api/auth/callback&scope=read:user public_repo&state=${state}`;
  res.redirect(redirectUri);
});

// GET /api/auth/callback → exchange code, issue JWT
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  try {
    const accessToken = await githubService.exchangeCodeForToken(code);
    const githubUser = await githubService.getGithubUserProfile(accessToken);
    
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (!user) {
      user = new User({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accessToken: githubService.encryptToken(accessToken),
      });
      await user.save();
    } else {
      user.accessToken = githubService.encryptToken(accessToken);
      await user.save();
    }

    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect to frontend with token in query param
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OAuth Callback Failed' });
  }
});

// GET /api/auth/me → get current user from JWT
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-accessToken');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
