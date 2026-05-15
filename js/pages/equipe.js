import { mountLayout } from '../components/layout.js';
import {
  getConstructor,
  getConstructorResults,
  getConstructorStandings,
  getConstructorDrivers,
  getConstructorCareerWins,
} from '../api/jolpica.js';
import { teamTheme, teamInitials } from '../data/teams.js';
import {
  nationalityToFlagUrl,
  nationalityToCountry,
  formatShortDate,
} from '../utils/format.js';
import { getTeamImage, getDriverImage, teamLogoSvg, driverAvatarSvg } from '../api/images.js';

mountLayout();

const SEASON = new Date().getFullYear();
const params = new URLSearchParams(window.location.search);
const teamId = params.get('id');

if (!teamId) {
  document.getElementById('team-root').innerHTML = `
    <div class="container section">
      <div class="empty-state">
        <h3>Equipe não informada</h3>
        <p><a class="btn btn-ghost" href="./equipes.html">Voltar para a lista</a></p>
      </div>
    </div>
  `;
} else {
  loadTeam();
}

async function loadTeam() {
  const root = document.getElementById('team-root');
  try {
    const [team, standings, results, drivers] = await Promise.all([
      getConstructor(teamId),
      getConstructorStandings(SEASON).catch(() => []),
      getConstructorResults(teamId, SEASON).catch(() => []),
      getConstructorDrivers(teamId, SEASON).catch(() => []),
    ]);

    if (!team) {
      root.innerHTML = `<div class="container section"><div class="empty-state"><h3>Equipe não encontrada</h3></div></div>`;
      return;
    }

    const standingRow = standings.find((r) => r.Constructor.constructorId === teamId);
    const theme = teamTheme(team.constructorId);
    const flag = nationalityToFlagUrl(team.nationality);
    const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';

    root.innerHTML = `
      <header class="profile-hero" style="--team-color: ${theme.color}; --team-color-dim: ${theme.colorDim};">
        <div class="container">
          <div class="profile-hero__grid">
            <div>
              <span class="profile-hero__eyebrow">${flagHtml} ${nationalityToCountry(team.nationality)}</span>
              <h1 class="profile-hero__title"><strong>${team.name}</strong></h1>
              <div class="profile-hero__meta">
                ${standingRow ? `<div>Posição<strong>P${standingRow.position}</strong></div>` : ''}
                ${standingRow ? `<div>Pontos<strong>${standingRow.points}</strong></div>` : ''}
                ${standingRow ? `<div>Vitórias ${SEASON}<strong>${standingRow.wins}</strong></div>` : ''}
              </div>
            </div>
            <div class="team-card__logo" id="team-logo" style="width: 140px; height: 140px; font-size: var(--fs-3xl); border-width: 3px;">
              <img src="${teamLogoSvg(team, theme.color)}" alt="${team.name}" loading="eager">
            </div>
          </div>
        </div>
      </header>

      <section class="section">
        <div class="container">
          <header class="section-title"><h2>Estatísticas</h2></header>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-card__label">Pontos ${SEASON}</div><div class="stat-card__value">${standingRow?.points ?? '—'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Vitórias ${SEASON}</div><div class="stat-card__value">${standingRow?.wins ?? '—'}</div></div>
            <div class="stat-card"><div class="stat-card__label">Vitórias na história</div><div class="stat-card__value" data-stat="career-wins"><span class="loading"></span></div></div>
            <div class="stat-card"><div class="stat-card__label">Pilotos ${SEASON}</div><div class="stat-card__value">${drivers.length || '—'}</div></div>
          </div>
        </div>
      </section>

      ${drivers.length ? `
      <section class="section" style="padding-top: 0;">
        <div class="container">
          <header class="section-title"><h2>Pilotos</h2></header>
          <div class="standings-preview">
            ${drivers.map((d) => {
              const dflag = nationalityToFlagUrl(d.nationality);
              const dflagHtml = dflag ? `<img class="flag" src="${dflag}" alt="" loading="lazy" width="28" height="20">` : '';
              const davatar = driverAvatarSvg(d, theme.color);
              return `
                <a class="card" href="./piloto.html?id=${d.driverId}" style="padding: var(--space-5); display: flex; align-items: center; gap: var(--space-4); --team-color: ${theme.color};" data-team-driver="${d.driverId}">
                  <img class="avatar avatar-lg" src="${davatar}" alt="" data-fallback="${davatar}" loading="lazy">
                  <div style="flex: 1;">
                    <div style="font-family: var(--font-display); font-weight: var(--fw-bold); color: var(--color-text-primary);">${d.givenName} ${d.familyName}</div>
                    <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-1); font-size: var(--fs-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">${dflagHtml} ${nationalityToCountry(d.nationality)}</div>
                  </div>
                  <span class="driver-number" style="color: ${theme.color};">#${d.permanentNumber ?? '—'}</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </section>` : ''}

      <section class="section" style="padding-top: 0;">
        <div class="container">
          <header class="section-title"><h2>Resultados ${SEASON}</h2></header>
          ${renderResults(results)}
        </div>
      </section>
    `;

    getTeamImage(team).then((src) => {
      if (!src) return;
      const img = document.querySelector('#team-logo img');
      if (img) { img.src = src; img.classList.add('team-logo--real'); }
    });

    drivers.forEach((d) => {
      getDriverImage(d).then((src) => {
        if (!src) return;
        const img = document.querySelector(`[data-team-driver="${d.driverId}"] img`);
        if (img) img.src = src;
      });
    });

    getConstructorCareerWins(teamId).then((w) => {
      const el = document.querySelector('[data-stat="career-wins"]');
      if (el) el.textContent = w ?? '—';
    }).catch(() => {
      const el = document.querySelector('[data-stat="career-wins"]');
      if (el) el.textContent = '—';
    });
  } catch (err) {
    root.innerHTML = `<div class="container section"><div class="error-message">Falha ao carregar equipe: ${err.message}</div></div>`;
  }
}

function renderResults(races) {
  if (!races.length) return `<div class="empty-state"><h3>Sem resultados ainda</h3></div>`;
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Etapa</th><th>GP</th><th>Data</th><th>Resultado da equipe</th></tr></thead>
        <tbody>
          ${races.map((r) => {
            const lines = (r.Results ?? []).map((res) =>
              `<div style="font-size: var(--fs-sm);"><strong>P${res.position}</strong> · ${res.Driver.givenName.charAt(0)}. ${res.Driver.familyName} <span class="text-muted">(${res.points} pts)</span></div>`
            ).join('') || '—';
            return `
              <tr>
                <td class="text-mono">${r.round}</td>
                <td><strong>${r.raceName}</strong></td>
                <td>${formatShortDate(r.date)}</td>
                <td>${lines}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
