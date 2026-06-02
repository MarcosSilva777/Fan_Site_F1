import { mountLayout } from '../components/layout.js';
import {
  getDriverStandings,
  getDrivers,
  getDriver,
  getDriverCareerWins,
  getDriverCareerPodiums,
  getDriverCareerPoles,
  getDriverCareerStarts,
} from '../api/jolpica.js';
import { teamTheme } from '../data/teams.js';
import { nationalityToFlagUrl, nationalityToCountry } from '../utils/format.js';
import { getDriverImage, driverAvatarSvg } from '../api/images.js';
import { observeReveals, countUp, reducedMotion } from '../components/animations.js';

mountLayout();

const SEASON = new Date().getFullYear();

let driverIndex = [];

function pickersHtml(selectedA, selectedB) {
  const options = (selected) =>
    driverIndex
      .map(
        (d) =>
          `<option value="${d.driverId}" ${d.driverId === selected ? 'selected' : ''}>${d.label}</option>`
      )
      .join('');

  return `
    <div class="compare-picker">
      <label for="compare-a">Piloto A</label>
      <select id="compare-a" class="compare-select">
        <option value="">Selecione…</option>
        ${options(selectedA)}
      </select>
    </div>
    <div class="compare-vs" aria-hidden="true">VS</div>
    <div class="compare-picker">
      <label for="compare-b">Piloto B</label>
      <select id="compare-b" class="compare-select">
        <option value="">Selecione…</option>
        ${options(selectedB)}
      </select>
    </div>
  `;
}

async function loadDriverIndex() {
  // Se houver erro de rede, ele propaga (sem segunda chamada à mesma API fora).
  // Só busca a lista de pilotos como fallback quando standings vier vazio
  // sem erro — caso típico do começo de temporada.
  const standings = await getDriverStandings(SEASON);
  if (standings.length) {
    return standings.map((row) => ({
      driverId: row.Driver.driverId,
      label: `${row.Driver.givenName} ${row.Driver.familyName}`,
      standing: row,
    }));
  }
  const drivers = await getDrivers(SEASON);
  return drivers.map((d) => ({
    driverId: d.driverId,
    label: `${d.givenName} ${d.familyName}`,
    standing: null,
  }));
}

async function fetchDriverData(driverId) {
  const entry = driverIndex.find((d) => d.driverId === driverId);
  const [driver, wins, podiums, poles, starts] = await Promise.all([
    getDriver(driverId).catch(() => null),
    getDriverCareerWins(driverId).catch(() => null),
    getDriverCareerPodiums(driverId).catch(() => null),
    getDriverCareerPoles(driverId).catch(() => null),
    getDriverCareerStarts(driverId).catch(() => null),
  ]);

  const standing = entry?.standing ?? null;
  const team = standing?.Constructors?.[0] ?? null;

  return {
    driver,
    team,
    theme: teamTheme(team?.constructorId),
    position: standing?.position ?? null,
    points: standing?.points != null ? Number(standing.points) : null,
    seasonWins: standing?.wins != null ? Number(standing.wins) : null,
    careerWins: wins,
    careerPodiums: podiums,
    careerPoles: poles,
    careerStarts: starts,
  };
}

const ROWS = [
  { key: 'position', label: 'Posição 2026', better: 'lower', prefix: 'P' },
  { key: 'points', label: 'Pontos 2026', better: 'higher' },
  { key: 'seasonWins', label: 'Vitórias 2026', better: 'higher' },
  { key: 'careerWins', label: 'Vitórias (carreira)', better: 'higher' },
  { key: 'careerPodiums', label: 'Pódios (carreira)', better: 'higher' },
  { key: 'careerPoles', label: 'Poles (carreira)', better: 'higher' },
  { key: 'careerStarts', label: 'GPs disputados', better: 'higher' },
];

function columnHeader(data, side) {
  if (!data?.driver) {
    return `<div class="compare-col__head"><p class="empty-state">Piloto indisponível.</p></div>`;
  }
  const { driver, team, theme } = data;
  const flag = nationalityToFlagUrl(driver.nationality);
  const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
  const avatar = driverAvatarSvg(driver, theme.color);

  return `
    <div class="compare-col__head" style="--team-color: ${theme.color};">
      <div class="card-team-bar"></div>
      <img class="compare-col__photo" src="${avatar}" data-compare-photo="${side}" alt="" loading="lazy">
      <h3 class="compare-col__name">
        <span>${driver.givenName}</span><strong>${driver.familyName}</strong>
      </h3>
      <p class="compare-col__team">${team?.name ?? 'Equipe a definir'}</p>
      <p class="compare-col__country">${flagHtml}<span>${nationalityToCountry(driver.nationality)}</span></p>
    </div>
  `;
}

function statValue(value, prefix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${prefix}${value}`;
}

function winnerSide(a, b, better) {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a === b) return 'tie';
  if (better === 'lower') return a < b ? 'a' : 'b';
  return a > b ? 'a' : 'b';
}

function renderComparison(root, dataA, dataB) {
  const rowsHtml = ROWS.map((row) => {
    const a = dataA?.[row.key] ?? null;
    const b = dataB?.[row.key] ?? null;
    const winner = winnerSide(a, b, row.better);
    return `
      <div class="compare-stat" data-reveal="up">
        <div class="compare-stat__cell compare-stat__cell--a ${winner === 'a' ? 'is-winner' : ''}">
          <span data-count-target="${a ?? ''}">${statValue(a, row.prefix ?? '')}</span>
        </div>
        <div class="compare-stat__label">${row.label}</div>
        <div class="compare-stat__cell compare-stat__cell--b ${winner === 'b' ? 'is-winner' : ''}">
          <span data-count-target="${b ?? ''}">${statValue(b, row.prefix ?? '')}</span>
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="compare-grid">
      <div class="compare-col compare-col--a">${columnHeader(dataA, 'a')}</div>
      <div class="compare-col compare-col--b">${columnHeader(dataB, 'b')}</div>
    </div>
    <div class="compare-stats">${rowsHtml}</div>
  `;

  hydratePhoto(root, 'a', dataA);
  hydratePhoto(root, 'b', dataB);
  animateStats(root);
  observeReveals(root);
}

function hydratePhoto(root, side, data) {
  if (!data?.driver) return;
  getDriverImage(data.driver).then((src) => {
    if (!src) return;
    const img = root.querySelector(`[data-compare-photo="${side}"]`);
    if (img) img.src = src;
  });
}

function animateStats(root) {
  root.querySelectorAll('[data-count-target]').forEach((el) => {
    const raw = el.dataset.countTarget;
    if (raw === '' ) return;
    const target = Number(raw);
    if (!Number.isFinite(target)) return;
    const prefix = el.textContent.startsWith('P') ? 'P' : '';
    if (reducedMotion) {
      el.textContent = `${prefix}${target}`;
      return;
    }
    countUp(el, target, { duration: 1100, formatter: (v) => `${prefix}${v}` });
  });
}

function updateUrl(a, b) {
  const url = new URL(window.location.href);
  if (a) url.searchParams.set('a', a); else url.searchParams.delete('a');
  if (b) url.searchParams.set('b', b); else url.searchParams.delete('b');
  window.history.replaceState({}, '', url);
}

async function runComparison(root) {
  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  const a = selA.value;
  const b = selB.value;
  updateUrl(a, b);

  if (!a || !b) {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Escolha dois pilotos</h3>
        <p>Selecione um piloto em cada lado para ver a comparação.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `<div class="loading-block"><span class="loading"></span> Comparando…</div>`;

  try {
    const [dataA, dataB] = await Promise.all([fetchDriverData(a), fetchDriverData(b)]);
    renderComparison(root, dataA, dataB);
  } catch {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Não foi possível comparar agora</h3>
        <p>Os dados estão indisponíveis no momento. Tente novamente em instantes.</p>
        <button class="btn btn-ghost" type="button" onclick="window.location.reload()">Tentar de novo</button>
      </div>
    `;
  }
}

async function init() {
  const pickers = document.getElementById('compare-pickers');
  const root = document.getElementById('compare-root');

  try {
    driverIndex = await loadDriverIndex();
  } catch {
    pickers.innerHTML = `
      <div class="empty-state">
        <h3>Não foi possível carregar os pilotos</h3>
        <p>Tente novamente em instantes.</p>
        <button class="btn btn-ghost" type="button" onclick="window.location.reload()">Tentar de novo</button>
      </div>
    `;
    return;
  }

  if (!driverIndex.length) {
    pickers.innerHTML = `<div class="empty-state"><h3>Nenhum piloto disponível</h3></div>`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const presetA = params.get('a') ?? '';
  const presetB = params.get('b') ?? '';

  pickers.innerHTML = pickersHtml(presetA, presetB);

  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  selA.addEventListener('change', () => runComparison(root));
  selB.addEventListener('change', () => runComparison(root));

  runComparison(root);
}

init();
