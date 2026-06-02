import { mountLayout } from '../components/layout.js';
import { getDriverStandings, getDrivers } from '../api/jolpica.js';
import { teamTheme } from '../data/teams.js';
import { nationalityToFlagUrl, nationalityToCountry } from '../utils/format.js';
import { getDriverImage, driverAvatarSvg } from '../api/images.js';
import { observeReveals, attachCardHoverTracking } from '../components/animations.js';

mountLayout();

const SEASON = new Date().getFullYear();

function buildCard({ driver, team, position, points }) {
  const theme = teamTheme(team?.constructorId);
  const flag = nationalityToFlagUrl(driver.nationality);
  const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';
  const number = driver.permanentNumber ?? '00';
  const fallback = driverAvatarSvg(driver, theme.color);

  return `
    <a class="card driver-card" href="./piloto.html?id=${driver.driverId}" style="--team-color: ${theme.color};" data-driver-id="${driver.driverId}" data-reveal="up">
      <div class="card-team-bar"></div>
      <img class="driver-card__photo" src="${fallback}" data-fallback="${fallback}" alt="" loading="lazy">
      <div class="driver-card__bg-number" aria-hidden="true">${number}</div>
      <div class="driver-card__content">
        ${position ? `<span class="badge">P${position} • ${points} pts</span>` : ''}
        <h3 class="driver-card__name">
          <span>${driver.givenName}</span>
          <strong>${driver.familyName}</strong>
        </h3>
        <span class="driver-card__team">${team?.name ?? 'Equipe a definir'}</span>
        <p class="driver-card__country">${flagHtml}<span>${nationalityToCountry(driver.nationality)}</span></p>
      </div>
    </a>
  `;
}

async function hydrateDriverPhotos(cards) {
  const tasks = cards.map(async ({ driver }) => {
    try {
      const url = await getDriverImage(driver);
      if (!url) return;
      const card = document.querySelector(`.driver-card[data-driver-id="${driver.driverId}"] .driver-card__photo`);
      if (card) card.src = url;
    } catch {
      // mantém fallback
    }
  });
  await Promise.allSettled(tasks);
}

async function load() {
  const grid = document.getElementById('drivers-grid');

  try {
    let cards = [];
    try {
      const standings = await getDriverStandings(SEASON);
      if (standings.length) {
        cards = standings.map((row) => ({
          driver: row.Driver,
          team: row.Constructors?.[0],
          position: row.position,
          points: row.points,
        }));
      }
    } catch {
      // fallback abaixo
    }

    if (!cards.length) {
      const drivers = await getDrivers(SEASON);
      cards = drivers.map((d) => ({ driver: d, team: null, position: null, points: null }));
    }

    if (!cards.length) {
      grid.innerHTML = `<div class="empty-state"><h3>Nenhum piloto encontrado</h3><p>Tente novamente em alguns instantes.</p></div>`;
      return;
    }

    grid.innerHTML = cards
      .map((c, i) => buildCard(c).replace('data-reveal="up"', `data-reveal="up" data-reveal-delay="${i * 50}"`))
      .join('');
    observeReveals(grid);
    attachCardHoverTracking(grid);
    hydrateDriverPhotos(cards);
  } catch {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Não foi possível carregar os pilotos</h3>
        <p>Os dados estão indisponíveis no momento. Tente novamente em instantes.</p>
        <button class="btn btn-ghost" type="button" onclick="window.location.reload()">Tentar de novo</button>
      </div>
    `;
  }
}

load();
