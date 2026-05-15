import { mountLayout } from '../components/layout.js';
import { getConstructorStandings, getConstructors } from '../api/jolpica.js';
import { teamTheme, teamInitials } from '../data/teams.js';
import { nationalityToFlagUrl, nationalityToCountry } from '../utils/format.js';
import { getTeamImage, teamLogoSvg } from '../api/images.js';

mountLayout();

const SEASON = new Date().getFullYear();

function buildCard({ team, position, points, wins }) {
  const theme = teamTheme(team.constructorId);
  const flag = nationalityToFlagUrl(team.nationality);
  const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
  const fallback = teamLogoSvg(team, theme.color);
  return `
    <a class="card team-card" href="./equipe.html?id=${team.constructorId}" style="--team-color: ${theme.color};" data-team-id="${team.constructorId}">
      <div class="card-team-bar"></div>
      <div class="team-card__header">
        <div class="team-card__logo" aria-hidden="true">
          <img src="${fallback}" alt="" data-fallback="${fallback}" loading="lazy">
        </div>
        <div>
          <h3 class="team-card__name">${team.name}</h3>
          <div class="team-card__nationality">${flagHtml ? `<span style="display:inline-flex; align-items:center; gap: var(--space-2);">${flagHtml} ${nationalityToCountry(team.nationality)}</span>` : nationalityToCountry(team.nationality)}</div>
        </div>
      </div>
      <dl style="display: flex; flex-direction: column; margin-top: var(--space-4);">
        ${position ? `<div class="team-card__stat"><dt>Posição</dt><dd>P${position}</dd></div>` : ''}
        ${points !== null && points !== undefined ? `<div class="team-card__stat"><dt>Pontos</dt><dd>${points}</dd></div>` : ''}
        ${wins !== null && wins !== undefined ? `<div class="team-card__stat"><dt>Vitórias</dt><dd>${wins}</dd></div>` : ''}
      </dl>
    </a>
  `;
}

async function hydrateTeamLogos(cards) {
  const tasks = cards.map(async ({ team }) => {
    try {
      const url = await getTeamImage(team);
      if (!url) return;
      const img = document.querySelector(`.team-card[data-team-id="${team.constructorId}"] .team-card__logo img`);
      if (img) { img.src = url; img.classList.add('team-logo--real'); }
    } catch {
      // mantém fallback
    }
  });
  await Promise.allSettled(tasks);
}

async function load() {
  const grid = document.getElementById('teams-grid');
  try {
    let cards = [];
    try {
      const standings = await getConstructorStandings(SEASON);
      if (standings.length) {
        cards = standings.map((row) => ({
          team: row.Constructor,
          position: row.position,
          points: row.points,
          wins: row.wins,
        }));
      }
    } catch {
      // fallback abaixo
    }

    if (!cards.length) {
      const teams = await getConstructors(SEASON);
      cards = teams.map((t) => ({ team: t, position: null, points: null, wins: null }));
    }

    if (!cards.length) {
      grid.innerHTML = `<div class="empty-state"><h3>Nenhuma equipe encontrada</h3></div>`;
      return;
    }

    grid.innerHTML = cards.map(buildCard).join('');
    hydrateTeamLogos(cards);
  } catch (err) {
    grid.innerHTML = `<div class="error-message">Falha ao carregar equipes: ${err.message}</div>`;
  }
}

load();
