import { getCache, setCache } from '../utils/cache.js';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const TTL_SHORT = 1000 * 60 * 15;
const TTL_LONG = 1000 * 60 * 60 * 6;

async function request(path, { ttl = TTL_LONG } = {}) {
  const cacheKey = `jolpica::${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Jolpica API ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, ttl);
  return data;
}

function currentSeason() {
  return new Date().getFullYear();
}

export async function getSeasonRaces(season = currentSeason()) {
  const data = await request(`/${season}.json?limit=100`, { ttl: TTL_LONG });
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getDriverStandings(season = currentSeason()) {
  const data = await request(`/${season}/driverstandings.json?limit=100`, { ttl: TTL_SHORT });
  const lists = data?.MRData?.StandingsTable?.StandingsLists ?? [];
  return lists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(season = currentSeason()) {
  const data = await request(`/${season}/constructorstandings.json?limit=100`, { ttl: TTL_SHORT });
  const lists = data?.MRData?.StandingsTable?.StandingsLists ?? [];
  return lists[0]?.ConstructorStandings ?? [];
}

export async function getDrivers(season = currentSeason()) {
  const data = await request(`/${season}/drivers.json?limit=100`, { ttl: TTL_LONG });
  return data?.MRData?.DriverTable?.Drivers ?? [];
}

export async function getConstructors(season = currentSeason()) {
  const data = await request(`/${season}/constructors.json?limit=100`, { ttl: TTL_LONG });
  return data?.MRData?.ConstructorTable?.Constructors ?? [];
}

export async function getDriver(driverId) {
  const data = await request(`/drivers/${driverId}.json`, { ttl: TTL_LONG });
  return data?.MRData?.DriverTable?.Drivers?.[0] ?? null;
}

export async function getDriverResults(driverId, season = currentSeason()) {
  const data = await request(`/${season}/drivers/${driverId}/results.json?limit=100`, { ttl: TTL_SHORT });
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getDriverCareerWins(driverId) {
  const data = await request(`/drivers/${driverId}/results/1.json?limit=1`, { ttl: TTL_LONG });
  return parseInt(data?.MRData?.total ?? '0', 10);
}

export async function getDriverCareerPodiums(driverId) {
  const [p1, p2, p3] = await Promise.all([
    request(`/drivers/${driverId}/results/1.json?limit=1`, { ttl: TTL_LONG }),
    request(`/drivers/${driverId}/results/2.json?limit=1`, { ttl: TTL_LONG }),
    request(`/drivers/${driverId}/results/3.json?limit=1`, { ttl: TTL_LONG }),
  ]);
  return (
    parseInt(p1?.MRData?.total ?? '0', 10) +
    parseInt(p2?.MRData?.total ?? '0', 10) +
    parseInt(p3?.MRData?.total ?? '0', 10)
  );
}

export async function getDriverCareerPoles(driverId) {
  const data = await request(`/drivers/${driverId}/qualifying/1.json?limit=1`, { ttl: TTL_LONG });
  return parseInt(data?.MRData?.total ?? '0', 10);
}

export async function getDriverCareerStarts(driverId) {
  const data = await request(`/drivers/${driverId}/results.json?limit=1`, { ttl: TTL_LONG });
  return parseInt(data?.MRData?.total ?? '0', 10);
}

export async function getConstructor(constructorId) {
  const data = await request(`/constructors/${constructorId}.json`, { ttl: TTL_LONG });
  return data?.MRData?.ConstructorTable?.Constructors?.[0] ?? null;
}

export async function getConstructorResults(constructorId, season = currentSeason()) {
  const data = await request(`/${season}/constructors/${constructorId}/results.json?limit=100`, { ttl: TTL_SHORT });
  return data?.MRData?.RaceTable?.Races ?? [];
}

export async function getConstructorDrivers(constructorId, season = currentSeason()) {
  const data = await request(`/${season}/constructors/${constructorId}/drivers.json`, { ttl: TTL_LONG });
  return data?.MRData?.DriverTable?.Drivers ?? [];
}

export async function getConstructorCareerWins(constructorId) {
  const data = await request(`/constructors/${constructorId}/results/1.json?limit=1`, { ttl: TTL_LONG });
  return parseInt(data?.MRData?.total ?? '0', 10);
}

export async function getRaceResults(season, round) {
  const data = await request(`/${season}/${round}/results.json?limit=100`, { ttl: TTL_SHORT });
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getRaceQualifying(season, round) {
  const data = await request(`/${season}/${round}/qualifying.json?limit=100`, { ttl: TTL_SHORT });
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getRaceSprint(season, round) {
  try {
    const data = await request(`/${season}/${round}/sprint.json?limit=100`, { ttl: TTL_SHORT });
    return data?.MRData?.RaceTable?.Races?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getRace(season, round) {
  const data = await request(`/${season}/${round}.json`, { ttl: TTL_LONG });
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getLastRaceResults() {
  const data = await request(`/current/last/results.json`, { ttl: TTL_SHORT });
  return data?.MRData?.RaceTable?.Races?.[0] ?? null;
}

export async function getNextRace() {
  try {
    const data = await request(`/current/next.json`, { ttl: TTL_SHORT });
    return data?.MRData?.RaceTable?.Races?.[0] ?? null;
  } catch {
    return null;
  }
}
