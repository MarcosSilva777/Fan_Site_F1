let currentLevel = 'ok';
let bannerEl = null;

const LEVELS = { ok: 0, stale: 1, down: 2 };

const MESSAGES = {
  stale: {
    icon: '⚠️',
    text: 'Alguns dados podem estar desatualizados — a fonte oficial (Jolpica F1) está instável no momento. Mostrando as últimas informações disponíveis.',
  },
  down: {
    icon: '🔌',
    text: 'Parte dos dados está temporariamente indisponível porque a fonte oficial (Jolpica F1) está fora do ar. Calendário e dados ao vivo seguem funcionando. Tente novamente mais tarde.',
  },
};

function ensureBanner() {
  if (bannerEl) return bannerEl;
  bannerEl = document.createElement('div');
  bannerEl.className = 'data-banner';
  bannerEl.setAttribute('role', 'status');
  bannerEl.setAttribute('aria-live', 'polite');
  bannerEl.hidden = true;
  document.body.prepend(bannerEl);
  return bannerEl;
}

function paint() {
  const el = ensureBanner();
  if (currentLevel === 'ok') {
    el.hidden = true;
    el.classList.remove('is-visible');
    return;
  }
  const msg = MESSAGES[currentLevel];
  el.dataset.level = currentLevel;
  el.innerHTML = `
    <div class="container data-banner__inner">
      <span class="data-banner__icon" aria-hidden="true">${msg.icon}</span>
      <span class="data-banner__text">${msg.text}</span>
      <button class="data-banner__close" type="button" aria-label="Fechar aviso">&times;</button>
    </div>
  `;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  el.querySelector('.data-banner__close')?.addEventListener('click', () => {
    el.classList.remove('is-visible');
    setTimeout(() => { el.hidden = true; }, 300);
  });
}

export function reportDataStatus(level) {
  if (!(level in LEVELS)) return;
  // Mantém sempre o estado mais grave observado na sessão da página.
  if (LEVELS[level] <= LEVELS[currentLevel]) return;
  currentLevel = level;
  if (typeof document !== 'undefined') {
    if (document.body) paint();
    else document.addEventListener('DOMContentLoaded', paint, { once: true });
  }
}
