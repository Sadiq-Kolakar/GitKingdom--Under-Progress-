export function generateLore(kingdom) {
  if (!kingdom || !kingdom.githubData) {
    return "An uncharted kingdom shrouded in mystery. Little is known of this domain.";
  }

  const { username, characterClass, githubData } = kingdom;
  const { primaryLanguage, totalCommits, repoCount, accountCreatedAt, pinnedRepos, topRepos } = githubData;

  const year = accountCreatedAt ? new Date(accountCreatedAt).getFullYear() : 'an unknown era';
  const lang = primaryLanguage || 'the arcane arts';
  
  let chronicleName = 'the unnamed chronicle';
  if (pinnedRepos && pinnedRepos.length > 0 && pinnedRepos[0].name) {
    chronicleName = pinnedRepos[0].name;
  } else if (topRepos && topRepos.length > 0 && topRepos[0].name) {
    chronicleName = topRepos[0].name;
  }

  const charClass = characterClass || 'Wandering Scholar';
  const commits = totalCommits !== undefined ? totalCommits : 0;
  const repos = repoCount !== undefined ? repoCount : 0;

  return `The Kingdom of ${username}, founded in the age of ${year}, is known for its mastery of ${lang} and its legendary chronicle ${chronicleName}. Its ${charClass}s have fought ${commits} battles in service of the crown, and their ${repos} chronicles are studied by scholars across the realm.`;
}
