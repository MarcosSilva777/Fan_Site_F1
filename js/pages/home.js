import { mountLayout } from '../components/layout.js';
import {
  getNextRace,
  getDriverStandings,
  getConstructorStandings,
  getSeasonRaces,
} from '../api/jolpica.js';
import {
  combineDateTime,
  timeUntil,
  formatDate,
  formatTime,
  pad,
  countryToFlagUrl,
} from '../utils/format.js';
import { teamTheme } from '../data/teams.js';

mountLayout();

const SEASON = new Date().getFullYear();

async function resolveNextRace() {
  try {
    const next = await getNextRace();
    if (next) return next;
  } catch {
    // fallback abaixo
  }
  try {
    const races = await getSeasonRaces(SEASON);
    const now = Date.now();
    return races.find((r) => {
      const start = combineDateTime(r.date, r.time);
      return start && start.getTime() > now;
    }) ?? null;
  } catch {
    return null;
  }
}

function renderNextRace(container, race) {
  if (!race) {
    container.innerHTML = `
      <div class="next-race">
        <div class="empty-state">
          <h3>Sem corrida programada</h3>
          <p>Não encontramos uma próxima corrida no calendário atual.</p>
        </div>
      </div>
    `;
    return;
  }

  const start = combineDateTime(race.date, race.time);
  const flag = countryToFlagUrl(race.Circuit?.Location?.country);
  const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';

  container.innerHTML = `
    <article class="next-race">
      <header class="next-race__header">
        <span class="badge badge-upcoming">Próxima corrida</span>
        <span class="next-race__round">Etapa ${race.round} • ${race.season}</span>
      </header>
      <h3 class="next-race__title">${race.raceName}</h3>
      <p class="next-race__circuit">
        ${flagHtml}
        <span>${race.Circuit?.circuitName ?? ''} — ${race.Circuit?.Location?.locality ?? ''}, ${race.Circuit?.Location?.country ?? ''}</span>
      </p>
      <p class="text-secondary" style="margin-top: var(--space-3); font-size: var(--fs-sm);">
        ${formatDate(race.date)}${race.time ? ` · ${formatTime(race.date, race.time)}` : ''}
      </p>
      <div class="countdown" id="countdown" data-target="${start ? start.toISOString() : ''}" role="timer" aria-live="polite">
        ${renderCountdownCells(timeUntil(start))}
      </div>
    </article>
  `;

  if (start) startCountdown(container.querySelector('#countdown'), start);
}

function renderCountdownCells(t) {
  return `
    <div class="countdown__cell"><span class="countdown__value">${pad(t.days, 3)}</span><span class="countdown__label">Dias</span></div>
    <div class="countdown__cell"><span class="countdown__value">${pad(t.hours)}</span><span class="countdown__label">Horas</span></div>
    <div class="countdown__cell"><span class="countdown__value">${pad(t.minutes)}</span><span class="countdown__label">Min</span></div>
    <div class="countdown__cell"><span class="countdown__value">${pad(t.seconds)}</span><span class="countdown__label">Seg</span></div>
  `;
}

function startCountdown(node, target) {
  if (!node) return;
  const tick = () => {
    const t = timeUntil(target);
    node.innerHTML = renderCountdownCells(t);
    if (t.isPast) clearInterval(timer);
  };
  const timer = setInterval(tick, 1000);
}

function renderDriverStandings(container, standings) {
  if (!standings.length) {
    container.innerHTML = '<p class="empty-state">Classificação ainda não disponível.</p>';
    return;
  }
  const top3 = standings.slice(0, 3);
  container.innerHTML = top3
    .map((row) => {
      const driver = row.Driver;
      const team = row.Constructors?.[0];
      const theme = teamTheme(team?.constructorId);
      const medal = ['gold', 'silver', 'bronze'][parseInt(row.position, 10) - 1] || '';
      return `
        <div class="standings-preview__row" style="--team-color: ${theme.color};">
          <span class="position-pill ${medal}">${row.position}</span>
          <div>
            <div class="standings-preview__name">${driver.givenName} ${driver.familyName}</div>
            <div class="standings-preview__team">${team?.name ?? ''}</div>
          </div>
          <span class="standings-preview__points">${row.points}<small style="font-size:.6em; color: var(--color-text-muted);"> PTS</small></span>
        </div>
      `;
    })
    .join('');
}

function renderConstructorStandings(container, standings) {
  if (!standings.length) {
    container.innerHTML = '<p class="empty-state">Classificação ainda não disponível.</p>';
    return;
  }
  const top3 = standings.slice(0, 3);
  container.innerHTML = top3
    .map((row) => {
      const team = row.Constructor;
      const theme = teamTheme(team?.constructorId);
      const medal = ['gold', 'silver', 'bronze'][parseInt(row.position, 10) - 1] || '';
      return `
        <div class="standings-preview__row" style="--team-color: ${theme.color};">
          <span class="position-pill ${medal}">${row.position}</span>
          <div>
            <div class="standings-preview__name">${team?.name ?? ''}</div>
            <div class="standings-preview__team">${team?.nationality ?? ''}</div>
          </div>
          <span class="standings-preview__points">${row.points}<small style="font-size:.6em; color: var(--color-text-muted);"> PTS</small></span>
        </div>
      `;
    })
    .join('');
}

async function loadHome() {
  const nextRaceEl = document.getElementById('next-race');
  const driversEl = document.getElementById('drivers-top');
  const teamsEl = document.getElementById('constructors-top');

  resolveNextRace().then((race) => renderNextRace(nextRaceEl, race));

  getDriverStandings(SEASON)
    .then((s) => renderDriverStandings(driversEl, s))
    .catch(() => {
      driversEl.innerHTML = '<p class="error-message">Não foi possível carregar a classificação.</p>';
    });

  getConstructorStandings(SEASON)
    .then((s) => renderConstructorStandings(teamsEl, s))
    .catch(() => {
      teamsEl.innerHTML = '<p class="error-message">Não foi possível carregar a classificação.</p>';
    });
}

loadHome();
