import { mountLayout } from '../components/layout.js';
import {
  getRace,
  getRaceResults,
  getRaceQualifying,
  getRaceSprint,
} from '../api/jolpica.js';
import { getCircuitInfo } from '../api/f1.js';
import { teamTheme } from '../data/teams.js';
import {
  combineDateTime,
  formatDate,
  formatTime,
  countryToFlagUrl,
} from '../utils/format.js';
import { getDriverImage, driverAvatarSvg, pictureFor } from '../api/images.js';
import { observeReveals, reducedMotion } from '../components/animations.js';

mountLayout();

function applyRowStagger(panel) {
  if (reducedMotion) return;
  const rows = panel.querySelectorAll('.data-table tbody tr');
  rows.forEach((tr, i) => {
    tr.style.opacity = '0';
    tr.style.transform = 'translateX(-12px)';
    tr.style.transition = `opacity 480ms var(--ease-out-expo) ${i * 25}ms, transform 480ms var(--ease-out-expo) ${i * 25}ms, background var(--dur-fast) var(--ease-out-quart)`;
    requestAnimationFrame(() => {
      tr.style.opacity = '';
      tr.style.transform = '';
    });
  });
}

const params = new URLSearchParams(window.location.search);
const season = params.get('season');
const round = params.get('round');

if (!season || !round) {
  document.getElementById('gp-root').innerHTML = `
    <div class="container section">
      <div class="empty-state">
        <h3>GP não informado</h3>
        <p><a class="btn btn-ghost" href="./calendario.html">Voltar para o calendário</a></p>
      </div>
    </div>
  `;
} else {
  loadGP();
}

function medalClass(pos) {
  return ['gold', 'silver', 'bronze'][parseInt(pos, 10) - 1] || '';
}

function circuitTypeLabel(type) {
  if (!type) return null;
  const map = { Permanent: 'Permanente', Street: 'De rua', Race: 'Permanente' };
  return map[type] ?? type;
}

async function loadCircuit(race) {
  const mapHost = document.getElementById('circuit-map-host');
  const infoGrid = document.getElementById('gp-info-grid');
  if (!mapHost && !infoGrid) return;

  let info = null;
  try {
    info = await getCircuitInfo({
      season: race.season,
      round: race.round,
      jolpicaCircuit: race.Circuit,
    });
  } catch {
    return;
  }
  if (!info) return;

  if (mapHost && info.circuit_image) {
    const fallback = info.circuit_image;
    mapHost.innerHTML = `
      <figure class="circuit-map" data-reveal="up">
        ${pictureFor(info.circuit_image, fallback, `Traçado do circuito ${info.circuit_short_name ?? race.Circuit?.circuitName ?? ''}`, 'circuit-map__img')}
        <figcaption>${race.Circuit?.circuitName ?? info.circuit_short_name ?? ''}</figcaption>
      </figure>
    `;
    observeReveals(mapHost);
  }

  if (infoGrid) {
    const extras = [];
    const typeLabel = circuitTypeLabel(info.circuit_type);
    if (typeLabel) {
      extras.push(
        `<div class="stat-card"><div class="stat-card__label">Tipo de circuito</div><div class="stat-card__value" style="font-size: var(--fs-lg);">${typeLabel}</div></div>`
      );
    }
    if (info.gmt_offset) {
      const gmt = info.gmt_offset.replace(/:00$/, '');
      extras.push(
        `<div class="stat-card"><div class="stat-card__label">Fuso (GMT)</div><div class="stat-card__value" style="font-size: var(--fs-lg);">${gmt}</div></div>`
      );
    }
    if (extras.length) {
      infoGrid.insertAdjacentHTML('beforeend', extras.join(''));
      observeReveals(infoGrid);
    }
  }
}

async function loadGP() {
  const root = document.getElementById('gp-root');
  try {
    const [base, results, qualifying, sprint] = await Promise.all([
      getRace(season, round),
      getRaceResults(season, round).catch(() => null),
      getRaceQualifying(season, round).catch(() => null),
      getRaceSprint(season, round).catch(() => null),
    ]);

    const race = results || qualifying || sprint || base;
    if (!race) {
      root.innerHTML = `<div class="container section"><div class="empty-state"><h3>GP não encontrado</h3></div></div>`;
      return;
    }

    const start = combineDateTime(race.date, race.time);
    const flag = countryToFlagUrl(race.Circuit?.Location?.country);
    const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
    const isPast = start && start.getTime() < Date.now();

    document.title = `${race.raceName} — F1 Fan Site`;

    root.innerHTML = `
      <header class="page-header">
        <div class="container">
          <span class="page-header__eyebrow">Etapa ${race.round} · Temporada ${race.season}</span>
          <h1>${race.raceName}</h1>
          <p class="page-header__lead" style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
            ${flagHtml}
            <span>${race.Circuit?.circuitName ?? ''} — ${race.Circuit?.Location?.locality ?? ''}, ${race.Circuit?.Location?.country ?? ''}</span>
          </p>
        </div>
      </header>

      <section class="section" style="padding-top: var(--space-10);">
        <div class="container">
          <div id="circuit-map-host"></div>

          <div class="gp-info-grid" id="gp-info-grid" data-reveal-stagger>
            <div class="stat-card"><div class="stat-card__label">Data</div><div class="stat-card__value" style="font-size: var(--fs-lg);">${formatDate(race.date)}</div></div>
            <div class="stat-card"><div class="stat-card__label">Horário (corrida)</div><div class="stat-card__value" style="font-size: var(--fs-lg);">${race.time ? formatTime(race.date, race.time) : '—'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Status</div><div class="stat-card__value" style="font-size: var(--fs-lg);">${isPast ? 'Realizada' : 'Programada'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Circuito</div><div class="stat-card__value" style="font-size: var(--fs-lg); line-height: 1.2;">${race.Circuit?.Location?.locality ?? '—'}</div></div>
          </div>

          <div id="gp-tabs" class="tabs" role="tablist" aria-label="Sessões" style="margin-bottom: var(--space-8); flex-wrap: wrap;">
            ${results?.Results?.length ? `<button class="tab" role="tab" aria-selected="true" data-tab="race">Corrida</button>` : ''}
            ${qualifying?.QualifyingResults?.length ? `<button class="tab" role="tab" aria-selected="${!results?.Results?.length}" data-tab="qualifying">Qualificação</button>` : ''}
            ${sprint?.SprintResults?.length ? `<button class="tab" role="tab" aria-selected="false" data-tab="sprint">Sprint</button>` : ''}
          </div>

          <div id="gp-panel">
            ${(!results?.Results?.length && !qualifying?.QualifyingResults?.length && !sprint?.SprintResults?.length)
              ? `<div class="empty-state"><h3>Resultados ainda não disponíveis</h3><p>Esta corrida ainda não foi disputada ou os dados ainda não foram publicados.</p></div>`
              : ''}
          </div>
        </div>
      </section>
    `;

    const tabs = document.getElementById('gp-tabs');
    const panel = document.getElementById('gp-panel');

    function renderTab(name) {
      tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
      panel.classList.add('panel-fade-out');
      setTimeout(() => panel.classList.remove('panel-fade-out'), 220);
      let drivers = [];
      if (name === 'race' && results?.Results?.length) {
        panel.innerHTML = renderRaceResults(results.Results);
        drivers = results.Results.map((r) => r.Driver);
      }
      if (name === 'qualifying' && qualifying?.QualifyingResults?.length) {
        panel.innerHTML = renderQualifying(qualifying.QualifyingResults);
        drivers = qualifying.QualifyingResults.map((r) => r.Driver);
      }
      if (name === 'sprint' && sprint?.SprintResults?.length) {
        panel.innerHTML = renderSprint(sprint.SprintResults);
        drivers = sprint.SprintResults.map((r) => r.Driver);
      }
      applyRowStagger(panel);
      drivers.forEach((d) => {
        getDriverImage(d).then((src) => {
          if (!src) return;
          panel.querySelectorAll(`[data-driver-avatar="${d.driverId}"]`).forEach((img) => { img.src = src; });
        });
      });
    }

    tabs.querySelectorAll('.tab').forEach((btn) => btn.addEventListener('click', () => renderTab(btn.dataset.tab)));
    const initial = tabs.querySelector('[aria-selected="true"]');
    if (initial) renderTab(initial.dataset.tab);

    loadCircuit(race);

    observeReveals(root);
  } catch {
    root.innerHTML = `
      <div class="container section">
        <div class="empty-state">
          <h3>Não foi possível carregar o GP</h3>
          <p>Os dados estão indisponíveis no momento. Tente novamente em instantes.</p>
          <a class="btn btn-ghost" href="./calendario.html">Voltar para o calendário</a>
        </div>
      </div>
    `;
  }
}

function renderRaceResults(rows) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Pos</th><th>Piloto</th><th>Equipe</th><th class="text-center">Grid</th><th class="text-center">Voltas</th><th>Tempo / Status</th><th class="text-right">Pts</th></tr>
        </thead>
        <tbody>
          ${rows.map((res) => {
            const team = res.Constructor;
            const theme = teamTheme(team?.constructorId);
            const avatar = driverAvatarSvg(res.Driver, theme.color);
            return `
              <tr style="--team-color: ${theme.color};">
                <td><span class="position-pill ${medalClass(res.position)}">${res.position}</span></td>
                <td>
                  <a href="./piloto.html?id=${res.Driver.driverId}" class="avatar-stack" style="color: var(--color-text-primary); font-weight: var(--fw-bold);">
                    <img class="avatar avatar-sm" src="${avatar}" data-driver-avatar="${res.Driver.driverId}" alt="" loading="lazy" style="--team-color: ${theme.color};">
                    <span>${res.Driver.givenName} ${res.Driver.familyName}</span>
                    <span class="text-muted text-mono" style="font-size: var(--fs-xs);">#${res.number}</span>
                  </a>
                </td>
                <td><span class="standings-row__team">${team?.name ?? ''}</span></td>
                <td class="text-center text-mono">${res.grid}</td>
                <td class="text-center text-mono">${res.laps}</td>
                <td class="text-mono" style="font-size: var(--fs-sm);">${res.Time?.time ?? res.status ?? '—'}</td>
                <td class="text-right"><strong style="font-family: var(--font-display); font-weight: var(--fw-black);">${res.points}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderQualifying(rows) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Pos</th><th>Piloto</th><th>Equipe</th><th class="text-mono text-center">Q1</th><th class="text-mono text-center">Q2</th><th class="text-mono text-center">Q3</th></tr>
        </thead>
        <tbody>
          ${rows.map((res) => {
            const team = res.Constructor;
            const theme = teamTheme(team?.constructorId);
            const avatar = driverAvatarSvg(res.Driver, theme.color);
            return `
              <tr style="--team-color: ${theme.color};">
                <td><span class="position-pill ${medalClass(res.position)}">${res.position}</span></td>
                <td>
                  <a href="./piloto.html?id=${res.Driver.driverId}" class="avatar-stack" style="color: var(--color-text-primary); font-weight: var(--fw-bold);">
                    <img class="avatar avatar-sm" src="${avatar}" data-driver-avatar="${res.Driver.driverId}" alt="" loading="lazy" style="--team-color: ${theme.color};">
                    <span>${res.Driver.givenName} ${res.Driver.familyName}</span>
                  </a>
                </td>
                <td><span class="standings-row__team">${team?.name ?? ''}</span></td>
                <td class="text-mono text-center">${res.Q1 ?? '—'}</td>
                <td class="text-mono text-center">${res.Q2 ?? '—'}</td>
                <td class="text-mono text-center">${res.Q3 ?? '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSprint(rows) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Pos</th><th>Piloto</th><th>Equipe</th><th class="text-center">Grid</th><th class="text-center">Voltas</th><th>Tempo / Status</th><th class="text-right">Pts</th></tr>
        </thead>
        <tbody>
          ${rows.map((res) => {
            const team = res.Constructor;
            const theme = teamTheme(team?.constructorId);
            const avatar = driverAvatarSvg(res.Driver, theme.color);
            return `
              <tr style="--team-color: ${theme.color};">
                <td><span class="position-pill ${medalClass(res.position)}">${res.position}</span></td>
                <td>
                  <a href="./piloto.html?id=${res.Driver.driverId}" class="avatar-stack" style="color: var(--color-text-primary); font-weight: var(--fw-bold);">
                    <img class="avatar avatar-sm" src="${avatar}" data-driver-avatar="${res.Driver.driverId}" alt="" loading="lazy" style="--team-color: ${theme.color};">
                    <span>${res.Driver.givenName} ${res.Driver.familyName}</span>
                  </a>
                </td>
                <td><span class="standings-row__team">${team?.name ?? ''}</span></td>
                <td class="text-center text-mono">${res.grid}</td>
                <td class="text-center text-mono">${res.laps}</td>
                <td class="text-mono" style="font-size: var(--fs-sm);">${res.Time?.time ?? res.status ?? '—'}</td>
                <td class="text-right"><strong>${res.points}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
