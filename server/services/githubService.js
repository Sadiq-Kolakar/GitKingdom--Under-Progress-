const axios = require('axios');
const crypto = require('crypto');

// Encrypt/Decrypt setup
const ENCRYPTION_KEY = process.env.JWT_SECRET ? process.env.JWT_SECRET.padEnd(32, '0').substring(0, 32) : 'mysecretkey123456789012345678901'; // 32 chars
const IV_LENGTH = 16;

const encryptToken = (text) => {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decryptToken = (text) => {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const exchangeCodeForToken = async (code) => {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );
  return response.data.access_token;
};

const getGithubUserProfile = async (token) => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${token}` },
    });
    return response.data;
  } catch (err) {
    if (err.response && [403, 429].includes(err.response.status)) {
      throw new Error('RATE_LIMIT');
    }
    throw err;
  }
};

const fetchFullGithubData = async (username, token) => {
  const headers = { Authorization: `token ${token}` };

  try {
    // 1. GET /users/:username
    const userRes = await axios.get(`https://api.github.com/users/${username}`, { headers });
    const userData = userRes.data;

    // 2. GET /users/:username/repos
    const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    const repos = reposRes.data;

    let totalCommits = 0;
    const languagesSet = new Set();
    const topRepos = repos.sort((a, b) => (b.stargazers_count * 2) - (a.stargazers_count * 2)).slice(0, 8);
    
    // Determine the user's primary language based on the most frequent language across their repos
    let langCounts = {};
    for (const repo of repos) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        languagesSet.add(repo.language);
      }
    }
    const primaryLanguage = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a])[0] || 'Unknown';

    // 3. GET /repos/:owner/:repo/stats/participation and GET /repos/:owner/:repo/languages
    // Only doing this for the top 8 to avoid hitting rate limits too aggressively
    for (let repo of topRepos) {
      try {
        const statsRes = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/stats/participation`, { headers });
        if (statsRes.data && statsRes.data.owner) {
          totalCommits += statsRes.data.owner.reduce((a, b) => a + b, 0); // sum of last 52 weeks
        }

        const langRes = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/languages`, { headers });
        if (langRes.data) {
          Object.keys(langRes.data).forEach(lang => languagesSet.add(lang));
        }
      } catch (e) {
        // Stats can sometimes return 202 or 204 or 403, just skip and continue
        console.warn(`Could not fetch stats/languages for ${repo.name}`);
      }
    }

    // 4. GraphQL for pinned repos
    let pinnedRepos = [];
    try {
      const graphqlQuery = `
        query($username: String!) {
          user(login: $username) {
            pinnedItems(first: 6, types: REPOSITORY) {
              nodes {
                ... on Repository {
                  name
                  description
                  stargazerCount
                  primaryLanguage { name }
                }
              }
            }
          }
        }
      `;
      const gqlRes = await axios.post('https://api.github.com/graphql', {
        query: graphqlQuery,
        variables: { username }
      }, { headers });

      if (gqlRes.data && gqlRes.data.data && gqlRes.data.data.user) {
        pinnedRepos = gqlRes.data.data.user.pinnedItems.nodes.map(node => ({
          name: node.name,
          description: node.description,
          stars: node.stargazerCount,
          language: node.primaryLanguage ? node.primaryLanguage.name : null
        }));
      }
    } catch (e) {
      console.warn("Could not fetch pinned repos", e);
    }

    const stars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

    return {
      repoCount: userData.public_repos,
      totalCommits,
      primaryLanguage,
      languages: Array.from(languagesSet),
      pinnedRepos,
      topRepos: topRepos.map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        description: r.description,
        updatedAt: r.updated_at
      })),
      stars,
      accountCreatedAt: userData.created_at,
      collaborators: [], // skipping for simplicity
      lastRefreshed: Date.now(),
    };
  } catch (err) {
    if (err.response && [403, 429].includes(err.response.status)) {
      throw new Error('RATE_LIMIT');
    }
    throw err;
  }
};

const getPublicGithubProfile = async (username) => {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    return response.data;
  } catch (err) {
    if (err.response && [403, 429].includes(err.response.status)) {
      throw new Error('RATE_LIMIT');
    }
    throw err;
  }
};

module.exports = {
  encryptToken,
  decryptToken,
  exchangeCodeForToken,
  getGithubUserProfile,
  fetchFullGithubData,
  getPublicGithubProfile,
};
