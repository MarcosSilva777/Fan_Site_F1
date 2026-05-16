export const TEAM_THEME = {
  mclaren: {
    color: '#ff8000',
    colorDim: 'rgba(255, 128, 0, 0.18)',
    cssVar: '--team-mclaren',
  },
  ferrari: {
    color: '#dc0000',
    colorDim: 'rgba(220, 0, 0, 0.2)',
    cssVar: '--team-ferrari',
  },
  mercedes: {
    color: '#27f4d2',
    colorDim: 'rgba(39, 244, 210, 0.15)',
    cssVar: '--team-mercedes',
  },
  red_bull: {
    color: '#3671c6',
    colorDim: 'rgba(54, 113, 198, 0.2)',
    cssVar: '--team-redbull',
  },
  aston_martin: {
    color: '#229971',
    colorDim: 'rgba(34, 153, 113, 0.18)',
    cssVar: '--team-aston',
  },
  williams: {
    color: '#64c4ff',
    colorDim: 'rgba(100, 196, 255, 0.18)',
    cssVar: '--team-williams',
  },
  rb: {
    color: '#6692ff',
    colorDim: 'rgba(102, 146, 255, 0.18)',
    cssVar: '--team-rb',
  },
  alphatauri: {
    color: '#6692ff',
    colorDim: 'rgba(102, 146, 255, 0.18)',
    cssVar: '--team-rb',
  },
  audi: {
    color: '#bb0a14',
    colorDim: 'rgba(187, 10, 20, 0.18)',
    cssVar: '--team-audi',
  },
  sauber: {
    color: '#bb0a14',
    colorDim: 'rgba(187, 10, 20, 0.18)',
    cssVar: '--team-audi',
  },
  alpine: {
    color: '#00a1e8',
    colorDim: 'rgba(0, 161, 232, 0.18)',
    cssVar: '--team-alpine',
  },
  haas: {
    color: '#b6babd',
    colorDim: 'rgba(182, 186, 189, 0.15)',
    cssVar: '--team-haas',
  },
  cadillac: {
    color: '#c0c0c0',
    colorDim: 'rgba(192, 192, 192, 0.15)',
    cssVar: '--team-cadillac',
  },
};

export function teamTheme(constructorId) {
  if (!constructorId) return { color: '#7a7a85', colorDim: 'rgba(122, 122, 133, 0.15)' };
  const id = constructorId.toLowerCase();
  if (TEAM_THEME[id]) return TEAM_THEME[id];
  const matchKey = Object.keys(TEAM_THEME).find((k) => id.includes(k));
  if (matchKey) return TEAM_THEME[matchKey];
  return { color: '#7a7a85', colorDim: 'rgba(122, 122, 133, 0.15)' };
}

export function teamShortName(name) {
  if (!name) return '';
  return name
    .replace(/Formula One Team|Racing Team|F1 Team|Honda RBPT|Mercedes-AMG Petronas/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function teamInitials(name) {
  if (!name) return 'F1';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}
