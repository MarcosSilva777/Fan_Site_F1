import { mountLayout } from '../components/layout.js';
import {
  getDriver,
  getDriverResults,
  getDriverStandings,
  getDriverCareerWins,
  getDriverCareerPodiums,
  getDriverCareerPoles,
  getDriverCareerStarts,
} from '../api/jolpica.js';
import { teamTheme } from '../data/teams.js';
import {
  nationalityToFlagUrl,
  nationalityToCountry,
  formatDate,
  formatShortDate,
} from '../utils/format.js';
import { getDriverImage, driverAvatarSvg } from '../api/images.js';
import { observeReveals, observeCountUp, countUp, reducedMotion } from '../components/animations.js';
import { loadGsap } from '../components/gsap-loader.js';

mountLayout();

async function animateProfileHero() {
  if (reducedMotion) return;
  try {
    const { gsap } = await loadGsap({ withScrollTrigger: false });
    if (!gsap) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.profile-hero__eyebrow', { y: 20, opacity: 0, duration: 0.7 })
      .from('.profile-hero__title', { y: 36, opacity: 0, duration: 1.0, filter: 'blur(10px)' }, '-=0.4')
      .from('.profile-hero__meta > *', { y: 14, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.6')
      .from('.profile-hero__photo', { scale: 0.85, opacity: 0, duration: 1.1, ease: 'expo.out' }, '-=0.9');
  } catch {}
}

const SEASON = new Date().getFullYear();
const params = new URLSearchParams(window.location.search);
const driverId = params.get('id');

if (!driverId) {
  document.getElementById('driver-root').innerHTML = `
    <div class="container section">
      <div class="empty-state">
        <h3>Piloto não informado</h3>
        <p><a class="btn btn-ghost" href="./pilotos.html">Voltar para a lista</a></p>
      </div>
    </div>
  `;
} else {
  loadDriver();
}

function birthAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

async function loadDriver() {
  const root = document.getElementById('driver-root');
  try {
    const [driver, standings, results] = await Promise.all([
      getDriver(driverId),
      getDriverStandings(SEASON).catch(() => []),
      getDriverResults(driverId, SEASON).catch(() => []),
    ]);

    if (!driver) {
      root.innerHTML = `<div class="container section"><div class="empty-state"><h3>Piloto não encontrado</h3></div></div>`;
      return;
    }

    const standingRow = standings.find((r) => r.Driver.driverId === driverId);
    const team = standingRow?.Constructors?.[0];
    const theme = teamTheme(team?.constructorId);
    const flag = nationalityToFlagUrl(driver.nationality);
    const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
    const age = birthAge(driver.dateOfBirth);

    root.innerHTML = `
      <header class="profile-hero" style="--team-color: ${theme.color}; --team-color-dim: ${theme.colorDim};">
        <div class="container">
          <div class="profile-hero__grid">
            <div>
              <span class="profile-hero__eyebrow">${flagHtml} ${nationalityToCountry(driver.nationality)}${team ? ` · ${team.name}` : ''}</span>
              <h1 class="profile-hero__title">
                <span>${driver.givenName}</span>
                <strong>${driver.familyName}</strong>
              </h1>
              <div class="profile-hero__meta">
                ${standingRow ? `<div>Posição<strong>P${standingRow.position} (${standingRow.points} pts)</strong></div>` : ''}
                ${age ? `<div>Idade<strong>${age} anos</strong></div>` : ''}
                <div>Nascimento<strong>${formatDate(driver.dateOfBirth, { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                ${driver.code ? `<div>Código<strong>${driver.code}</strong></div>` : ''}
              </div>
            </div>
            <figure class="profile-hero__photo" style="--team-color: ${theme.color};">
              <img id="driver-photo" src="${driverAvatarSvg(driver, theme.color)}" alt="${driver.givenName} ${driver.familyName}" loading="eager">
              <div class="profile-hero__photo-frame"></div>
              ${driver.permanentNumber ? `<span class="profile-hero__photo-number">#${driver.permanentNumber}</span>` : ''}
            </figure>
          </div>
        </div>
      </header>

      <section class="section">
        <div class="container">
          <header class="section-title"><h2>Estatísticas</h2></header>
          <div id="driver-stats" class="stats-grid" data-reveal-stagger>
            <div class="stat-card"><div class="stat-card__label">Pontos ${SEASON}</div><div class="stat-card__value" data-season-count="${standingRow?.points ?? ''}">${standingRow?.points ?? '—'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Vitórias ${SEASON}</div><div class="stat-card__value" data-season-count="${standingRow?.wins ?? ''}">${standingRow?.wins ?? '—'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Vitórias na carreira</div><div class="stat-card__value" data-stat="wins"><span class="loading"></span></div></div>
            <div class="stat-card"><div class="stat-card__label">Pódios na carreira</div><div class="stat-card__value" data-stat="podiums"><span class="loading"></span></div></div>
            <div class="stat-card"><div class="stat-card__label">Pole positions</div><div class="stat-card__value" data-stat="poles"><span class="loading"></span></div></div>
            <div class="stat-card"><div class="stat-card__label">GPs disputados</div><div class="stat-card__value" data-stat="starts"><span class="loading"></span></div></div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top: 0;">
        <div class="container">
          <header class="section-title"><h2>Resultados ${SEASON}</h2></header>
          <div id="driver-results">
            ${renderResultsTable(results)}
          </div>
        </div>
      </section>
    `;

    getDriverImage(driver).then((src) => {
      const photo = document.getElementById('driver-photo');
      if (photo && src) photo.src = src;
    });

    Promise.all([
      getDriverCareerWins(driverId).catch(() => null),
      getDriverCareerPodiums(driverId).catch(() => null),
      getDriverCareerPoles(driverId).catch(() => null),
      getDriverCareerStarts(driverId).catch(() => null),
    ]).then(([w, p, q, s]) => {
      const set = (k, v) => {
        const el = document.querySelector(`[data-stat="${k}"]`);
        if (!el) return;
        if (v === null || v === undefined) { el.textContent = '—'; return; }
        countUp(el, v, { duration: 1200 });
      };
      set('wins', w);
      set('podiums', p);
      set('poles', q);
      set('starts', s);
    });

    document.querySelectorAll('[data-season-count]').forEach((el) => {
      const v = Number(el.dataset.seasonCount);
      if (Number.isFinite(v)) observeCountUp(el, v, { duration: 1000 });
    });

    observeReveals(root);
    animateProfileHero();
  } catch (err) {
    root.innerHTML = `<div class="container section"><div class="error-message">Falha ao carregar piloto: ${err.message}</div></div>`;
  }
}

function renderResultsTable(races) {
  if (!races.length) return `<div class="empty-state"><h3>Sem resultados ainda</h3><p>Esta temporada ainda não tem corridas disputadas.</p></div>`;
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Etapa</th><th>GP</th><th>Data</th><th class="text-center">Grid</th><th class="text-center">Pos</th><th class="text-right">Pts</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${races.map((r) => {
            const result = r.Results?.[0];
            const pos = result?.position ?? '—';
            return `
              <tr>
                <td class="text-mono">${r.round}</td>
                <td><strong>${r.raceName}</strong></td>
                <td>${formatShortDate(r.date)}</td>
                <td class="text-center text-mono">${result?.grid ?? '—'}</td>
                <td class="text-center"><strong>${pos}</strong></td>
                <td class="text-right text-mono">${result?.points ?? '0'}</td>
                <td class="text-muted" style="font-size: var(--fs-xs); text-transform: uppercase;">${result?.status ?? ''}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
