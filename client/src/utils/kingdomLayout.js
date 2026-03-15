export function generateBuildingLayout(repos) {
  if (!repos || !Array.isArray(repos) || repos.length === 0) {
    return [];
  }

  // Sort repos by (stargazerCount * 2 + commitCount) descending
  const sortedRepos = [...repos].sort((a, b) => {
    const starA = a.stargazerCount || a.stars || 0;
    const commitA = a.commitCount || a.commits || 0;
    const scoreA = (starA * 2) + commitA;

    const starB = b.stargazerCount || b.stars || 0;
    const commitB = b.commitCount || b.commits || 0;
    const scoreB = (starB * 2) + commitB;

    return scoreB - scoreA;
  });

  // Take only the top 8 — never more
  const topRepos = sortedRepos.slice(0, 8);

  const BUILDING_TYPES = [
    'castle',
    'library',
    'smithy',
    'watchtower',
    'market',
    'tavern',
    'temple',
    'ruins'
  ];

  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const total = topRepos.length;

  return topRepos.map((repo, index) => {
    let buildingType = BUILDING_TYPES[index] || 'ruins';

    // If a repo's last push date is older than 12 months -> force type to 'ruins'
    const lastUpdate = new Date(repo.updatedAt || repo.pushedAt || repo.created_at || new Date());
    if ((now - lastUpdate.getTime()) > oneYearInMs) {
      buildingType = 'ruins';
    }

    // Spread buildings in a rough circle around center
    const angle = (index / total) * 2 * Math.PI;
    const x = Math.round(Math.cos(angle) * 40);
    const y = Math.round(Math.sin(angle) * 40);

    return {
      type: buildingType,
      repoName: repo.name || repo.repoName || 'unnamed_repo',
      x,
      y
    };
  });
}
