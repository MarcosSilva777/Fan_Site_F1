import {
  getSeasonRaces,
  getNextRace as getJolpicaNextRace,
} from './jolpica.js';
import {
  getMeetingsByYear,
  getSessionsByYear,
} from './openf1.js';

function splitDateTime(iso) {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  const date = d.toISOString().slice(0, 10);
  const time = `${d.toISOString().slice(11, 19)}Z`;
  return { date, time };
}

function meetingToRace(meeting, raceSession, season, round) {
  const source = raceSession?.date_start ?? meeting.date_start;
  const { date, time } = splitDateTime(source);

  return {
    season: String(season),
    round: String(round),
    raceName: meeting.meeting_name ?? meeting.meeting_official_name ?? 'Grande Prêmio',
    date,
    time,
    Circuit: {
      circuitId: `openf1:${meeting.circuit_key}`,
      circuitName: meeting.circuit_short_name ?? meeting.location ?? '',
      Location: {
        locality: meeting.location ?? '',
        country: meeting.country_name ?? '',
      },
    },
    _source: 'openf1',
  };
}

async function buildCalendarFromOpenF1(season) {
  const [meetings, sessions] = await Promise.all([
    getMeetingsByYear(season),
    getSessionsByYear(season).catch(() => []),
  ]);

  if (!Array.isArray(meetings) || !meetings.length) return [];

  const raceSessionByMeeting = new Map();
  const cancelledMeetings = new Set();
  for (const s of Array.isArray(sessions) ? sessions : []) {
    if (s.session_type === 'Race' || s.session_name === 'Race') {
      if (s.is_cancelled) {
        cancelledMeetings.add(s.meeting_key);
        continue;
      }
      raceSessionByMeeting.set(s.meeting_key, s);
    }
  }

  const valid = meetings
    .filter((m) => m.meeting_name?.toLowerCase() !== 'pre-season testing')
    .filter((m) => !cancelledMeetings.has(m.meeting_key))
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

  return valid.map((m, i) =>
    meetingToRace(m, raceSessionByMeeting.get(m.meeting_key), season, i + 1)
  );
}

export async function getCalendarWithSource(season) {
  try {
    const races = await getSeasonRaces(season);
    if (races.length) return { races, source: 'jolpica' };
  } catch {
    // cai pro fallback
  }

  try {
    const races = await buildCalendarFromOpenF1(season);
    if (races.length) return { races, source: 'openf1' };
  } catch {
    // sem dados
  }

  return { races: [], source: 'none' };
}

export async function getCalendar(season) {
  const { races } = await getCalendarWithSource(season);
  return races;
}

export async function getNextRace(season) {
  try {
    const next = await getJolpicaNextRace();
    if (next) return next;
  } catch {
    // cai pro fallback
  }

  const races = await getCalendar(season);
  const now = Date.now();
  return (
    races.find((r) => {
      if (!r.date) return false;
      const start = new Date(r.time ? `${r.date}T${r.time}` : `${r.date}T00:00:00Z`);
      return start.getTime() > now;
    }) ?? null
  );
}

function normalize(value) {
  return (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export async function getCircuitInfo({ season, round, jolpicaCircuit } = {}) {
  let meetings;
  try {
    meetings = await getMeetingsByYear(season);
  } catch {
    return null;
  }
  if (!Array.isArray(meetings) || !meetings.length) return null;

  const ordered = meetings
    .filter((m) => m.meeting_name?.toLowerCase() !== 'pre-season testing')
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

  const country = normalize(jolpicaCircuit?.Location?.country);
  const name = normalize(jolpicaCircuit?.circuitName);
  const locality = normalize(jolpicaCircuit?.Location?.locality);

  let match = null;

  // 1) País é o critério mais confiável: a numeração de round da OpenF1
  //    diverge da Jolpica quando há etapas canceladas no calendário.
  if (country) {
    const byCountry = ordered.filter((m) => normalize(m.country_name) === country);
    if (byCountry.length === 1) {
      match = byCountry[0];
    } else if (byCountry.length > 1) {
      // Mesmo país com mais de uma etapa (ex.: 2 GPs nos EUA): desempata por nome/localidade.
      match =
        byCountry.find((m) => {
          const shortName = normalize(m.circuit_short_name);
          const loc = normalize(m.location);
          return (
            (name && (shortName.includes(name) || name.includes(shortName))) ||
            (locality && (loc.includes(locality) || locality.includes(loc)))
          );
        }) ?? null;
    }
  }

  // 2) Fallback por nome/localidade quando o país não bastou.
  if (!match && (name || locality)) {
    match = ordered.find((m) => {
      const shortName = normalize(m.circuit_short_name);
      const loc = normalize(m.location);
      return (
        (name && (shortName.includes(name) || name.includes(shortName))) ||
        (locality && (loc.includes(locality) || locality.includes(loc)))
      );
    }) ?? null;
  }

  // 3) Último recurso: índice de round (aproximado).
  if (!match) {
    const roundIdx = Number(round) - 1;
    if (Number.isInteger(roundIdx) && roundIdx >= 0 && roundIdx < ordered.length) {
      match = ordered[roundIdx];
    }
  }

  if (!match) return null;

  return {
    circuit_image: match.circuit_image ?? null,
    circuit_type: match.circuit_type ?? null,
    gmt_offset: match.gmt_offset ?? null,
    country_flag: match.country_flag ?? null,
    circuit_short_name: match.circuit_short_name ?? null,
    circuit_info_url: match.circuit_info_url ?? null,
  };
}
