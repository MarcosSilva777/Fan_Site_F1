import { getCache, setCache } from '../utils/cache.js';

const SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const TTL = 1000 * 60 * 60 * 24 * 7;

const TEAM_WIKI_TITLE = {
  ferrari: 'Scuderia_Ferrari',
  mclaren: 'McLaren',
  mercedes: 'Mercedes-Benz_in_Formula_One',
  red_bull: 'Red_Bull_Racing',
  redbull: 'Red_Bull_Racing',
  aston_martin: 'Aston_Martin_in_Formula_One',
  williams: 'Williams_Racing',
  rb: 'Racing_Bulls',
  alphatauri: 'Racing_Bulls',
  audi: 'Audi_F1_Team',
  sauber: 'Sauber_Motorsport',
  alpine: 'Alpine_F1_Team',
  haas: 'Haas_F1_Team',
  cadillac: 'Cadillac_F1_Team',
};

const DRIVER_WIKI_TITLE = {
  antonelli: 'Kimi_Antonelli',
  bortoleto: 'Gabriel_Bortoleto',
  hadjar: 'Isack_Hadjar',
  bearman: 'Oliver_Bearman',
  lawson: 'Liam_Lawson',
  colapinto: 'Franco_Colapinto',
  lindblad: 'Arvid_Lindblad',
};

function titleFromWikiUrl(url) {
  if (!url) return null;
  const m = url.match(/wikipedia\.org\/wiki\/(.+?)(?:#|$)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchSummary(title) {
  const cacheKey = `wiki::${title}`;
  const cached = getCache(cacheKey);
  if (cached !== null) return cached;
  try {
    const res = await fetch(`${SUMMARY_URL}${encodeURIComponent(title)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      setCache(cacheKey, { thumb: null }, TTL);
      return { thumb: null };
    }
    const data = await res.json();
    const value = {
      thumb: data?.thumbnail?.source ?? null,
      original: data?.originalimage?.source ?? null,
    };
    setCache(cacheKey, value, TTL);
    return value;
  } catch {
    return { thumb: null };
  }
}

export async function getDriverImage(driver) {
  if (!driver) return null;
  const overrideTitle = DRIVER_WIKI_TITLE[driver.driverId];
  const titles = [];
  if (overrideTitle) titles.push(overrideTitle);
  const fromUrl = titleFromWikiUrl(driver.url);
  if (fromUrl && !titles.includes(fromUrl)) titles.push(fromUrl);
  if (driver.givenName && driver.familyName) {
    const guess = `${driver.givenName} ${driver.familyName}`.replace(/\s+/g, '_');
    if (!titles.includes(guess)) titles.push(guess);
  }
  for (const t of titles) {
    const summary = await fetchSummary(t);
    if (summary.thumb) return summary.thumb;
  }
  return null;
}

export async function getTeamImage(team) {
  if (!team) return null;
  const overrideTitle = TEAM_WIKI_TITLE[team.constructorId];
  const titles = [];
  if (overrideTitle) titles.push(overrideTitle);
  const fromUrl = titleFromWikiUrl(team.url);
  if (fromUrl && !titles.includes(fromUrl)) titles.push(fromUrl);
  for (const t of titles) {
    const summary = await fetchSummary(t);
    if (summary.thumb) return summary.thumb;
  }
  return null;
}

export function driverInitials(driver) {
  if (!driver) return '?';
  return `${driver.givenName?.charAt(0) ?? ''}${driver.familyName?.charAt(0) ?? ''}`.toUpperCase();
}

export function driverAvatarSvg(driver, color = '#e10600') {
  const initials = driverInitials(driver);
  const number = driver?.permanentNumber ?? '';
  const safeColor = color.replace('#', '%23');
  return `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="#15151e"/>
  <rect width="200" height="200" fill="url(#g)"/>
  <text x="100" y="115" text-anchor="middle" font-family="'Titillium Web', Arial, sans-serif" font-weight="900" font-size="92" fill="white" letter-spacing="-3">${initials}</text>
  ${number ? `<text x="190" y="190" text-anchor="end" font-family="'Titillium Web', Arial, sans-serif" font-weight="900" font-size="36" fill="white" opacity="0.55">#${number}</text>` : ''}
</svg>`.trim()).replace(/'/g, '%27')}`;
}

export function teamLogoSvg(team, color = '#e10600') {
  const initials = (team?.name ?? 'F1')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="20" fill="#0a0a0a"/>
  <rect x="6" y="6" width="188" height="188" rx="14" fill="none" stroke="${color}" stroke-width="4"/>
  <text x="100" y="125" text-anchor="middle" font-family="'Titillium Web', Arial, sans-serif" font-weight="900" font-size="78" fill="${color}" letter-spacing="-2">${initials}</text>
</svg>`.trim())}`;
}

export function pictureFor(src, fallback, alt = '', extraClass = '') {
  const safeSrc = src ?? fallback;
  return `<img class="${extraClass}" src="${safeSrc}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">`;
}
