export const TERRAIN_MAP = {
  javascript: 'coastal',
  typescript: 'coastal',
  python: 'mystic_forest',
  'c++': 'mountain',
  c: 'mountain',
  java: 'plains',
  rust: 'volcanic',
  go: 'tundra',
  river: 'river',
  default: 'frontier'
};

export function getTerrainType(languages) {
  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    return 'frontier';
  }

  const langsLower = languages.map(lang => lang.toLowerCase());
  const primaryLanguage = langsLower[0];

  if (langsLower.includes('javascript') || langsLower.includes('typescript')) {
    return 'coastal';
  }
  
  if (primaryLanguage === 'python') return 'mystic_forest';
  if (primaryLanguage === 'c++' || primaryLanguage === 'c') return 'mountain';
  if (primaryLanguage === 'java') return 'plains';
  if (primaryLanguage === 'rust') return 'volcanic';
  if (primaryLanguage === 'go') return 'tundra';
  
  if (languages.length >= 2) {
    return 'river';
  }

  return 'frontier';
}
