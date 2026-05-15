const LOCALE = 'pt-BR';
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...opts,
  }).format(date);
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function formatDay(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).getDate().toString().padStart(2, '0');
}

export function formatMonth(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat(LOCALE, { month: 'short' })
    .format(new Date(dateStr))
    .toUpperCase()
    .replace('.', '');
}

export function formatTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '—';
  const iso = `${dateStr}T${timeStr}`;
  const date = new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(date);
}

export function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return new Date(`${dateStr}T00:00:00Z`);
  return new Date(`${dateStr}T${timeStr}`);
}

export function timeUntil(targetDate) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const now = Date.now();
  const target = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
  const diff = target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

export function pad(n, size = 2) {
  return String(n).padStart(size, '0');
}

export function nationalityToCountry(nat) {
  const map = {
    British: 'Reino Unido',
    Dutch: 'Holanda',
    German: 'Alemanha',
    Spanish: 'Espanha',
    French: 'França',
    Italian: 'Itália',
    Mexican: 'México',
    Australian: 'Austrália',
    Monégasque: 'Mônaco',
    Monegasque: 'Mônaco',
    Finnish: 'Finlândia',
    Danish: 'Dinamarca',
    Japanese: 'Japão',
    Canadian: 'Canadá',
    Thai: 'Tailândia',
    Chinese: 'China',
    American: 'Estados Unidos',
    Brazilian: 'Brasil',
    'New Zealander': 'Nova Zelândia',
    'New Zealand': 'Nova Zelândia',
    Argentine: 'Argentina',
    Argentinian: 'Argentina',
    Swiss: 'Suíça',
    Belgian: 'Bélgica',
    Austrian: 'Áustria',
    Russian: 'Rússia',
    Polish: 'Polônia',
    Swedish: 'Suécia',
    Indian: 'Índia',
    Venezuelan: 'Venezuela',
    Colombian: 'Colômbia',
    Portuguese: 'Portugal',
    Hungarian: 'Hungria',
    Czech: 'República Tcheca',
    Irish: 'Irlanda',
    Norwegian: 'Noruega',
    Indonesian: 'Indonésia',
  };
  return map[nat] || nat;
}

const NAT_TO_ISO2 = {
  British: 'gb', Dutch: 'nl', German: 'de', Spanish: 'es', French: 'fr',
  Italian: 'it', Mexican: 'mx', Australian: 'au', Monégasque: 'mc', Monegasque: 'mc',
  Finnish: 'fi', Danish: 'dk', Japanese: 'jp', Canadian: 'ca', Thai: 'th',
  Chinese: 'cn', American: 'us', Brazilian: 'br', 'New Zealander': 'nz',
  'New Zealand': 'nz', Argentine: 'ar', Argentinian: 'ar', Swiss: 'ch',
  Belgian: 'be', Austrian: 'at', Russian: 'ru', Polish: 'pl', Swedish: 'se',
  Indian: 'in', Venezuelan: 've', Colombian: 'co', Portuguese: 'pt',
  Hungarian: 'hu', Czech: 'cz', Irish: 'ie', Norwegian: 'no', Indonesian: 'id',
};

const COUNTRY_TO_ISO2 = {
  UK: 'gb', UAE: 'ae', USA: 'us', Bahrain: 'bh', 'Saudi Arabia': 'sa',
  Australia: 'au', Japan: 'jp', China: 'cn', Italy: 'it', Monaco: 'mc',
  Spain: 'es', Canada: 'ca', Austria: 'at', France: 'fr', Hungary: 'hu',
  Belgium: 'be', Netherlands: 'nl', Azerbaijan: 'az', Singapore: 'sg',
  Russia: 'ru', Turkey: 'tr', Brazil: 'br', Qatar: 'qa', Mexico: 'mx',
  Germany: 'de', Korea: 'kr', 'South Korea': 'kr', Malaysia: 'my',
  India: 'in', Portugal: 'pt', Argentina: 'ar', 'United States': 'us',
  Vietnam: 'vn', Sweden: 'se',
};

export function nationalityToFlagUrl(nat) {
  const code = NAT_TO_ISO2[nat];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function countryToFlagUrl(country) {
  const code = COUNTRY_TO_ISO2[country] || country?.toLowerCase().slice(0, 2);
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function shortName(givenName, familyName) {
  if (!familyName) return givenName || '';
  if (!givenName) return familyName;
  return `${givenName.charAt(0)}. ${familyName}`;
}

export function initials(givenName, familyName) {
  return `${givenName?.charAt(0) || ''}${familyName?.charAt(0) || ''}`.toUpperCase();
}
