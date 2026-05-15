const NAV_ITEMS = [
  { href: '/index.html', label: 'Início', match: ['/', '/index.html'] },
  { href: '/pages/calendario.html', label: 'Calendário', match: ['/pages/calendario.html'] },
  { href: '/pages/classificacoes.html', label: 'Classificações', match: ['/pages/classificacoes.html'] },
  { href: '/pages/pilotos.html', label: 'Pilotos', match: ['/pages/pilotos.html', '/pages/piloto.html'] },
  { href: '/pages/equipes.html', label: 'Equipes', match: ['/pages/equipes.html', '/pages/equipe.html'] },
];

function currentPath() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path;
}

function isActive(item) {
  const path = currentPath();
  return item.match.some((m) => {
    const cleaned = m.replace(/\/$/, '') || '/';
    return cleaned === path || (cleaned !== '/' && path.endsWith(cleaned));
  });
}

function buildHref(href) {
  const inPages = window.location.pathname.includes('/pages/');
  if (!inPages) {
    return href.startsWith('/') ? '.' + href : href;
  }
  if (href === '/index.html') return '../index.html';
  if (href.startsWith('/pages/')) return '.' + href.replace('/pages', '');
  return href;
}

export function renderHeader() {
  const headerHost = document.getElementById('site-header');
  if (!headerHost) return;

  const links = NAV_ITEMS.map((item) => {
    const href = buildHref(item.href);
    const active = isActive(item) ? 'aria-current="page"' : '';
    return `<a class="nav__link" href="${href}" ${active}>${item.label}</a>`;
  }).join('');

  const mobileLinks = NAV_ITEMS.map((item) => {
    const href = buildHref(item.href);
    const active = isActive(item) ? 'aria-current="page"' : '';
    return `<a class="mobile-nav__link" href="${href}" ${active}>${item.label}</a>`;
  }).join('');

  const homeHref = buildHref('/index.html');

  headerHost.innerHTML = `
    <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="brand" href="${homeHref}" aria-label="F1 Fan Site - Página inicial">
          <span class="brand__logo" aria-hidden="true">F1</span>
          <span><span class="brand__name">FAN</span><span class="brand__accent">SITE</span></span>
        </a>
        <nav class="nav" aria-label="Navegação principal">${links}</nav>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Abrir menu">
          <span class="nav-toggle__icon" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>
    </header>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Navegação móvel">${mobileLinks}</nav>
  `;

  const toggle = headerHost.querySelector('.nav-toggle');
  const mobileNav = headerHost.querySelector('.mobile-nav');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? 'Abrir menu' : 'Fechar menu');
    mobileNav.classList.toggle('is-open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  mobileNav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
    })
  );
}

export function renderFooter() {
  const footerHost = document.getElementById('site-footer');
  if (!footerHost) return;
  const year = new Date().getFullYear();

  footerHost.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a class="brand" href="${buildHref('/index.html')}">
              <span class="brand__logo" aria-hidden="true">F1</span>
              <span><span class="brand__name">FAN</span><span class="brand__accent">SITE</span></span>
            </a>
            <p>O fan site definitivo de Fórmula 1: calendário em tempo real, classificações atualizadas, perfis completos de pilotos e equipes. Feito por fãs, para fãs.</p>
          </div>
          <div>
            <h4 class="site-footer__title">Navegação</h4>
            <ul class="site-footer__list">
              ${NAV_ITEMS.map((item) => `<li><a href="${buildHref(item.href)}">${item.label}</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="site-footer__title">Dados</h4>
            <ul class="site-footer__list">
              <li><a href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noopener">Jolpica F1 API</a></li>
              <li><a href="https://openf1.org/" target="_blank" rel="noopener">OpenF1 API</a></li>
              <li><a href="https://flagcdn.com/" target="_blank" rel="noopener">FlagCDN</a></li>
            </ul>
          </div>
        </div>
        <div class="site-footer__bottom">
          <span>&copy; ${year} F1 Fan Site. Projeto não oficial e sem fins lucrativos.</span>
          <span>Fórmula 1, F1 e marcas relacionadas pertencem à Formula One Licensing BV.</span>
        </div>
      </div>
    </footer>
  `;
}

export function mountLayout() {
  renderHeader();
  renderFooter();
}
