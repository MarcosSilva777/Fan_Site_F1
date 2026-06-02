import {
  getLatestSession,
  getDriversForSession,
  getPositionsForSession,
} from '../api/openf1.js';

const POLL_INTERVAL = 12000;
const GRACE_MS = 1000 * 60 * 10;

let pollTimer = null;

function isLive(session) {
  if (!session?.date_start || !session?.date_end) return false;
  const now = Date.now();
  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();
  return now >= start - GRACE_MS && now <= end + GRACE_MS;
}

function teamColour(hex) {
  if (!hex) return 'var(--color-f1-red)';
  return `#${hex.replace('#', '')}`;
}

function renderRows(positions, driverByNumber) {
  return positions
    .slice(0, 20)
    .map((pos) => {
      const d = driverByNumber.get(pos.driver_number);
      const color = teamColour(d?.team_colour);
      const acronym = d?.name_acronym ?? pos.driver_number;
      const name = d?.full_name ?? `#${pos.driver_number}`;
      return `
        <li class="live-widget__row" style="--team-color: ${color};">
          <span class="live-widget__pos">${pos.position ?? '–'}</span>
          <span class="live-widget__acr">${acronym}</span>
          <span class="live-widget__name">${name}</span>
        </li>
      `;
    })
    .join('');
}

function shell(session, rowsHtml) {
  const label = session.session_name ?? session.session_type ?? 'Sessão';
  const place = session.country_name ?? session.location ?? '';
  return `
    <div class="container">
      <div class="live-widget" role="region" aria-label="Tempo real">
        <div class="live-widget__head">
          <span class="badge badge-live">Ao vivo</span>
          <span class="live-widget__session">${label}${place ? ` · ${place}` : ''}</span>
        </div>
        <ol class="live-widget__list">${rowsHtml}</ol>
      </div>
    </div>
  `;
}

async function refresh(target, session, driverByNumber) {
  try {
    const positions = await getPositionsForSession(session.session_key);
    if (!positions.length) return;
    const list = target.querySelector('.live-widget__list');
    if (list) list.innerHTML = renderRows(positions, driverByNumber);
  } catch {
    // mantém últimas posições conhecidas
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export async function mountLiveWidget(target, { onLive } = {}) {
  if (!target) return false;

  let session;
  try {
    session = await getLatestSession();
  } catch {
    return false;
  }

  if (!session || !isLive(session)) return false;

  let drivers = [];
  try {
    drivers = await getDriversForSession(session.session_key);
  } catch {
    drivers = [];
  }
  const driverByNumber = new Map(
    (Array.isArray(drivers) ? drivers : []).map((d) => [d.driver_number, d])
  );

  let positions = [];
  try {
    positions = await getPositionsForSession(session.session_key);
  } catch {
    positions = [];
  }

  target.innerHTML = shell(session, renderRows(positions, driverByNumber));
  if (typeof onLive === 'function') onLive(session);

  stopPolling();
  pollTimer = setInterval(() => refresh(target, session, driverByNumber), POLL_INTERVAL);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPolling();
  });
  window.addEventListener('pagehide', stopPolling);

  return true;
}
