const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  avatarUrl: String,
  accessToken: String, // Stored encrypted
  hasClaimed: {
    type: Boolean,
    default: false,
  },
  claimedAt: Date,
  visitHistory: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
