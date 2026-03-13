const mongoose = require('mongoose');

const GithubDataSchema = new mongoose.Schema({
  repoCount: Number,
  totalCommits: Number,
  primaryLanguage: String,
  languages: [String],
  pinnedRepos: [Object],
  topRepos: [Object],
  stars: Number,
  accountCreatedAt: Date,
  collaborators: [String],
  lastRefreshed: Date,
}, { _id: false });

const KingdomSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  isSeeded: {
    type: Boolean,
    default: false,
  },
  isNPC: {
    type: Boolean,
    default: false,
  },
  isClaimed: {
    type: Boolean,
    default: false,
  },
  position: {
    x: Number,
    y: Number,
  },
  size: Number,
  terrain: String,
  activityState: {
    type: String,
    enum: ['active', 'idle', 'quiet', 'dormant'],
  },
  characterClass: String,
  level: Number,
  githubData: GithubDataSchema,
  lore: String,
  claimedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Kingdom', KingdomSchema);
