import { mountLayout } from '../components/layout.js';
import { getCalendar } from '../api/f1.js';
import {
  combineDateTime,
  formatDay,
  formatMonth,
  formatTime,
  countryToFlagUrl,
} from '../utils/format.js';
import { observeReveals, attachCardHoverTracking, reducedMotion } from '../components/animations.js';

mountLayout();

const SEASON = new Date().getFullYear();

function buildRaceCard(race, status) {
  const start = combineDateTime(race.date, race.time);
  const flag = countryToFlagUrl(race.Circuit?.Location?.country);
  const flagHtml = flag ? `<img class="flag" src="${flag}" alt="" loading="lazy" width="28" height="20">` : '';

  const badge = status === 'next'
    ? '<span class="badge badge-upcoming">Próxima</span>'
    : status === 'done'
    ? '<span class="badge badge-success">Realizada</span>'
    : '<span class="badge">Agendada</span>';

  const detailHref = `./gp.html?season=${race.season}&round=${race.round}`;

  return `
    <a class="card race-card" href="${detailHref}" data-month="${start ? start.getMonth() : ''}" data-reveal="up" data-status="${status}">
      <div class="race-card__round">
        <span>Etapa ${race.round}</span>
        ${badge}
      </div>
      <div class="race-card__country">
        ${flagHtml}
        <span>${race.Circuit?.Location?.country ?? ''}</span>
      </div>
      <h3 class="race-card__title">${race.raceName}</h3>
      <p class="race-card__circuit">${race.Circuit?.circuitName ?? ''}${race.Circuit?.Location?.locality ? ` · ${race.Circuit.Location.locality}` : ''}</p>
      <div class="race-card__date">
        <div>
          <span class="race-card__day">${formatDay(race.date)}</span>
          <span class="race-card__month" style="display: block;">${formatMonth(race.date)}</span>
        </div>
        <span class="text-muted text-mono" style="font-size: var(--fs-sm);">${race.time ? formatTime(race.date, race.time) : ''}</span>
      </div>
    </a>
  `;
}

function classifyRaces(races) {
  const now = Date.now();
  let nextIdx = -1;
  for (let i = 0; i < races.length; i++) {
    const start = combineDateTime(races[i].date, races[i].time);
    if (start && start.getTime() > now) { nextIdx = i; break; }
  }
  return races.map((r, i) => {
    if (i === nextIdx) return { race: r, status: 'next' };
    if (nextIdx === -1 || i < nextIdx) return { race: r, status: 'done' };
    return { race: r, status: 'upcoming' };
  });
}

function renderFilter(container, races, onChange) {
  const months = new Set();
  races.forEach((r) => {
    const start = combineDateTime(r.date, r.time);
    if (start) months.add(start.getMonth());
  });

  const monthNames = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];
  const sortedMonths = Array.from(months).sort((a, b) => a - b);

  container.innerHTML = `
    <div class="tabs" role="tablist" aria-label="Filtro por mês">
      <button class="tab" role="tab" aria-selected="true" data-month="all">Todos</button>
      ${sortedMonths.map((m) => `<button class="tab" role="tab" aria-selected="false" data-month="${m}">${monthNames[m]}</button>`).join('')}
    </div>
  `;

  container.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      onChange(btn.dataset.month);
    });
  });
}

async function load() {
  const grid = document.getElementById('calendar-grid');
  const filterHost = document.getElementById('calendar-filter');

  try {
    const races = await getCalendar(SEASON);
    if (!races.length) {
      grid.innerHTML = `<div class="empty-state"><h3>Nenhuma corrida encontrada</h3><p>Tente novamente em alguns instantes.</p></div>`;
      return;
    }

    const classified = classifyRaces(races);
    const html = classified
      .map(({ race, status }, i) =>
        buildRaceCard(race, status).replace('data-reveal="up"', `data-reveal="up" data-reveal-delay="${i * 40}"`)
      )
      .join('');
    grid.innerHTML = html;
    observeReveals(grid);
    attachCardHoverTracking(grid);

    renderFilter(filterHost, races, (selected) => {
      grid.querySelectorAll('.race-card').forEach((card) => {
        const matches = selected === 'all' || card.dataset.month === selected;
        if (reducedMotion) {
          card.style.display = matches ? '' : 'none';
          return;
        }
        if (matches) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '';
            card.style.transform = '';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.94)';
          setTimeout(() => { card.style.display = 'none'; }, 240);
        }
      });
    });
  } catch {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Não foi possível carregar o calendário</h3>
        <p>Os dados estão indisponíveis no momento. Tente novamente em instantes.</p>
        <button class="btn btn-ghost" type="button" onclick="window.location.reload()">Tentar de novo</button>
      </div>
    `;
  }
}

load();
