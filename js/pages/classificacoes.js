import { mountLayout } from '../components/layout.js';
import { getDriverStandings, getConstructorStandings } from '../api/jolpica.js';
import { teamTheme } from '../data/teams.js';
import { nationalityToFlagUrl } from '../utils/format.js';
import { getDriverImage, getTeamImage, driverAvatarSvg, teamLogoSvg } from '../api/images.js';
import { observeReveals, reducedMotion } from '../components/animations.js';

mountLayout();

function applyRowStagger(panel) {
  if (reducedMotion) return;
  const rows = panel.querySelectorAll('.data-table tbody tr');
  rows.forEach((tr, i) => {
    tr.style.opacity = '0';
    tr.style.transform = 'translateX(-12px)';
    tr.style.transition = `opacity 480ms var(--ease-out-expo) ${i * 30}ms, transform 480ms var(--ease-out-expo) ${i * 30}ms, background var(--dur-fast) var(--ease-out-quart)`;
    requestAnimationFrame(() => {
      tr.style.opacity = '';
      tr.style.transform = '';
    });
  });
}

const SEASON = new Date().getFullYear();

function medalClass(pos) {
  return ['gold', 'silver', 'bronze'][parseInt(pos, 10) - 1] || '';
}

function renderDrivers(rows) {
  if (!rows.length) return `<div class="empty-state"><h3>Sem dados</h3><p>Classificação ainda não disponível para ${SEASON}.</p></div>`;
  return `
    <div class="table-wrap">
      <table class="data-table" aria-label="Classificação de pilotos">
        <thead>
          <tr>
            <th style="width: 80px;">Pos</th>
            <th>Piloto</th>
            <th>Equipe</th>
            <th class="text-center">Vit.</th>
            <th class="text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const d = row.Driver;
            const team = row.Constructors?.[0];
            const theme = teamTheme(team?.constructorId);
            const flag = nationalityToFlagUrl(d.nationality);
            const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
            const driverHref = `./piloto.html?id=${d.driverId}`;
            const avatar = driverAvatarSvg(d, theme.color);
            return `
              <tr style="--team-color: ${theme.color};">
                <td><span class="position-pill ${medalClass(row.position)}">${row.position}</span></td>
                <td>
                  <a href="${driverHref}" class="avatar-stack">
                    <img class="avatar" src="${avatar}" data-driver-avatar="${d.driverId}" alt="" loading="lazy" style="--team-color: ${theme.color};">
                    ${flagHtml}
                    <strong style="color: var(--color-text-primary);">${d.givenName} ${d.familyName}</strong>
                    <span style="color: var(--color-text-muted); font-family: var(--font-mono); font-size: var(--fs-sm);">#${d.permanentNumber ?? ''}</span>
                  </a>
                </td>
                <td>
                  <span class="standings-row__team">${team?.name ?? '—'}</span>
                </td>
                <td class="text-center text-mono">${row.wins}</td>
                <td class="text-right"><strong style="font-family: var(--font-display); font-weight: var(--fw-black); font-size: var(--fs-lg);">${row.points}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderConstructors(rows) {
  if (!rows.length) return `<div class="empty-state"><h3>Sem dados</h3><p>Classificação ainda não disponível para ${SEASON}.</p></div>`;
  return `
    <div class="table-wrap">
      <table class="data-table" aria-label="Classificação de construtores">
        <thead>
          <tr>
            <th style="width: 80px;">Pos</th>
            <th>Equipe</th>
            <th>Nacionalidade</th>
            <th class="text-center">Vit.</th>
            <th class="text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const team = row.Constructor;
            const theme = teamTheme(team?.constructorId);
            const flag = nationalityToFlagUrl(team?.nationality);
            const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
            const teamHref = `./equipe.html?id=${team.constructorId}`;
            const logo = teamLogoSvg(team, theme.color);
            return `
              <tr style="--team-color: ${theme.color};">
                <td><span class="position-pill ${medalClass(row.position)}">${row.position}</span></td>
                <td>
                  <a href="${teamHref}" class="avatar-stack">
                    <img class="team-logo-avatar" src="${logo}" data-team-logo="${team.constructorId}" alt="" loading="lazy" style="--team-color: ${theme.color};">
                    <span class="standings-row__team" style="color: var(--color-text-primary);">${team?.name ?? '—'}</span>
                  </a>
                </td>
                <td><span class="avatar-stack">${flagHtml}<span class="text-muted text-uppercase" style="font-size: var(--fs-xs);">${team?.nationality ?? ''}</span></span></td>
                <td class="text-center text-mono">${row.wins}</td>
                <td class="text-right"><strong style="font-family: var(--font-display); font-weight: var(--fw-black); font-size: var(--fs-lg);">${row.points}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function load() {
  const tabs = document.getElementById('standings-tabs');
  const panel = document.getElementById('standings-panel');

  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'construtores' ? 'constructors' : 'drivers';

  function switchTo(tab) {
    tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    panel.classList.add('panel-fade-out');
    setTimeout(() => panel.classList.remove('panel-fade-out'), 220);
    panel.innerHTML = `<div class="loading-block"><span class="loading"></span> Carregando…</div>`;
    if (tab === 'drivers') {
      getDriverStandings(SEASON)
        .then((rows) => {
          panel.innerHTML = renderDrivers(rows);
          applyRowStagger(panel);
          rows.forEach((row) => {
            getDriverImage(row.Driver).then((src) => {
              if (!src) return;
              const img = panel.querySelector(`[data-driver-avatar="${row.Driver.driverId}"]`);
              if (img) img.src = src;
            });
          });
        })
        .catch((err) => { panel.innerHTML = `<div class="error-message">${err.message}</div>`; });
    } else {
      getConstructorStandings(SEASON)
        .then((rows) => {
          panel.innerHTML = renderConstructors(rows);
          applyRowStagger(panel);
          rows.forEach((row) => {
            getTeamImage(row.Constructor).then((src) => {
              if (!src) return;
              const img = panel.querySelector(`[data-team-logo="${row.Constructor.constructorId}"]`);
              if (img) { img.src = src; img.classList.add('team-logo-avatar--real'); }
            });
          });
        })
        .catch((err) => { panel.innerHTML = `<div class="error-message">${err.message}</div>`; });
    }
  }

  tabs.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTo(btn.dataset.tab));
  });

  switchTo(initialTab);
}

load();
