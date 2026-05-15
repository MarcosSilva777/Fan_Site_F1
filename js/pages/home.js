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
import { observeReveals, observeCountUp, reducedMotion } from '../components/animations.js';
import { loadGsap } from '../components/gsap-loader.js';

mountLayout();

function revealHero() {
  const content = document.querySelector('.hero__content');
  if (content) content.classList.add('hero-ready');
}

async function animateHero() {
  revealHero();
  if (reducedMotion) return;
  try {
    const { gsap } = await loadGsap({ withScrollTrigger: false });
    if (!gsap) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__eyebrow', { y: 24, opacity: 0, duration: 0.9, immediateRender: false })
      .from('.hero__title', { y: 40, opacity: 0, duration: 1.1, filter: 'blur(12px)', immediateRender: false }, '-=0.65')
      .from('.hero__lead', { y: 24, opacity: 0, duration: 0.9, immediateRender: false }, '-=0.7')
      .from('.hero__cta > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.12, immediateRender: false }, '-=0.5');
  } catch {}
}

animateHero();

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
    <div class="countdown__cell"><span class="countdown__value" data-cd="days">${pad(t.days, 3)}</span><span class="countdown__label">Dias</span></div>
    <div class="countdown__cell"><span class="countdown__value" data-cd="hours">${pad(t.hours)}</span><span class="countdown__label">Horas</span></div>
    <div class="countdown__cell"><span class="countdown__value" data-cd="minutes">${pad(t.minutes)}</span><span class="countdown__label">Min</span></div>
    <div class="countdown__cell"><span class="countdown__value" data-cd="seconds">${pad(t.seconds)}</span><span class="countdown__label">Seg</span></div>
  `;
}

function startCountdown(node, target) {
  if (!node) return;
  const lastValues = { days: null, hours: null, minutes: null, seconds: null };
  const updateCell = (key, newValue, digits = 2) => {
    const cell = node.querySelector(`[data-cd="${key}"]`);
    if (!cell) return;
    const display = pad(newValue, digits);
    if (lastValues[key] === display) return;
    lastValues[key] = display;
    if (reducedMotion) {
      cell.textContent = display;
      return;
    }
    cell.classList.remove('countdown__value--tick');
    void cell.offsetWidth;
    cell.textContent = display;
    cell.classList.add('countdown__value--tick');
  };
  const tick = () => {
    const t = timeUntil(target);
    updateCell('days', t.days, 3);
    updateCell('hours', t.hours);
    updateCell('minutes', t.minutes);
    updateCell('seconds', t.seconds);
    if (t.isPast) clearInterval(timer);
  };
  tick();
  const timer = setInterval(tick, 1000);
}

function renderDriverStandings(container, standings) {
  if (!standings.length) {
    container.innerHTML = '<p class="empty-state">Classificação ainda não disponível.</p>';
    return;
  }
  const top3 = standings.slice(0, 3);
  container.innerHTML = top3
    .map((row, i) => {
      const driver = row.Driver;
      const team = row.Constructors?.[0];
      const theme = teamTheme(team?.constructorId);
      const medal = ['gold', 'silver', 'bronze'][parseInt(row.position, 10) - 1] || '';
      return `
        <div class="standings-preview__row" style="--team-color: ${theme.color}; --stagger-index: ${i};" data-reveal="up">
          <span class="position-pill ${medal}">${row.position}</span>
          <div>
            <div class="standings-preview__name">${driver.givenName} ${driver.familyName}</div>
            <div class="standings-preview__team">${team?.name ?? ''}</div>
          </div>
          <span class="standings-preview__points"><span data-points-target="${row.points}">0</span><small style="font-size:.6em; color: var(--color-text-muted);"> PTS</small></span>
        </div>
      `;
    })
    .join('');
  hookCountUpPoints(container);
  observeReveals(container);
}

function renderConstructorStandings(container, standings) {
  if (!standings.length) {
    container.innerHTML = '<p class="empty-state">Classificação ainda não disponível.</p>';
    return;
  }
  const top3 = standings.slice(0, 3);
  container.innerHTML = top3
    .map((row, i) => {
      const team = row.Constructor;
      const theme = teamTheme(team?.constructorId);
      const medal = ['gold', 'silver', 'bronze'][parseInt(row.position, 10) - 1] || '';
      return `
        <div class="standings-preview__row" style="--team-color: ${theme.color}; --stagger-index: ${i};" data-reveal="up">
          <span class="position-pill ${medal}">${row.position}</span>
          <div>
            <div class="standings-preview__name">${team?.name ?? ''}</div>
            <div class="standings-preview__team">${team?.nationality ?? ''}</div>
          </div>
          <span class="standings-preview__points"><span data-points-target="${row.points}">0</span><small style="font-size:.6em; color: var(--color-text-muted);"> PTS</small></span>
        </div>
      `;
    })
    .join('');
  hookCountUpPoints(container);
  observeReveals(container);
}

function hookCountUpPoints(container) {
  container.querySelectorAll('[data-points-target]').forEach((el) => {
    const target = Number(el.dataset.pointsTarget);
    if (Number.isFinite(target)) observeCountUp(el, target, { duration: 1500 });
  });
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
