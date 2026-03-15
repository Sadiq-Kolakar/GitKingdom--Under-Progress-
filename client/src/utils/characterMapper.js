export const CHARACTER_MAP = {
  'javascript': 'Illusionist',
  'typescript': 'Illusionist',
  'python': 'Alchemist',
  'c++': 'Blacksmith',
  'c': 'Blacksmith',
  'java': 'Scholar',
  'rust': 'Warlord',
  'go': 'Ranger',
  'river': 'Merchant Lord',
  'fog_highlands': 'Sorcerer',
  'default': 'Wandering Scholar'
};

export function getCharacterClass(primaryLanguage, terrain) {
  if (terrain === 'river') return 'Merchant Lord';
  if (terrain === 'fog_highlands') return 'Sorcerer';

  if (!primaryLanguage) return 'Wandering Scholar';

  const lang = primaryLanguage.toLowerCase();
  if (lang === 'javascript' || lang === 'typescript') return 'Illusionist';
  if (lang === 'python') return 'Alchemist';
  if (lang === 'c++' || lang === 'c') return 'Blacksmith';
  if (lang === 'java') return 'Scholar';
  if (lang === 'rust') return 'Warlord';
  if (lang === 'go') return 'Ranger';

  return 'Wandering Scholar';
}
