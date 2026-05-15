const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let revealObserver = null;

function ensureRevealObserver() {
  if (revealObserver) return revealObserver;
  if (typeof IntersectionObserver === 'undefined') return null;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay ?? '0', 10);
        if (delay > 0) {
          setTimeout(() => el.classList.add('is-visible'), delay);
        } else {
          el.classList.add('is-visible');
        }
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  return revealObserver;
}

export function observeReveals(root = document) {
  if (prefersReducedMotion) {
    root.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }
  const obs = ensureRevealObserver();
  if (!obs) {
    root.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }
  root.querySelectorAll('[data-reveal]').forEach((el) => obs.observe(el));
  root.querySelectorAll('[data-reveal-stagger]').forEach((el) => {
    Array.from(el.children).forEach((child, i) => {
      child.style.setProperty('--stagger-index', String(i));
    });
    obs.observe(el);
  });
}

export function attachCardHoverTracking(root = document) {
  if (prefersReducedMotion) return;
  const cards = root.querySelectorAll('.card');
  cards.forEach((card) => {
    if (card.dataset.hoverTracked === '1') return;
    card.dataset.hoverTracked = '1';
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
}

export function countUp(el, target, { duration = 1400, suffix = '', formatter } = {}) {
  if (!el) return;
  const numericTarget = Number(target);
  if (!Number.isFinite(numericTarget)) {
    el.textContent = String(target);
    return;
  }
  if (prefersReducedMotion) {
    el.textContent = formatter ? formatter(numericTarget) : `${numericTarget}${suffix}`;
    return;
  }
  el.classList.add('count-up');
  const start = performance.now();
  const startVal = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const value = Math.round(startVal + (numericTarget - startVal) * ease(progress));
    el.textContent = formatter ? formatter(value) : `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function observeCountUp(el, target, opts = {}) {
  if (!el) return;
  if (typeof IntersectionObserver === 'undefined') {
    countUp(el, target, opts);
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(el, target, opts);
        obs.disconnect();
      });
    },
    { threshold: 0.4 }
  );
  obs.observe(el);
}

export function attachPageTransitions() {
  if (prefersReducedMotion) return;

  document.body.classList.add('page-transition-enter');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove('page-transition-enter');
    });
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;
    if (href.startsWith('#')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try {
      url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
    } catch {
      return;
    }
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    e.preventDefault();
    document.body.classList.add('page-transition-leave');
    setTimeout(() => {
      window.location.assign(a.href);
    }, 220);
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.classList.remove('page-transition-leave');
      document.body.classList.add('page-transition-enter');
      requestAnimationFrame(() => {
        document.body.classList.remove('page-transition-enter');
      });
    }
  });
}

export function initAnimations() {
  observeReveals();
  attachCardHoverTracking();
  attachPageTransitions();

  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (
          node.hasAttribute?.('data-reveal') ||
          node.hasAttribute?.('data-reveal-stagger') ||
          node.querySelector?.('[data-reveal], [data-reveal-stagger]')
        ) {
          observeReveals(node);
        }
        if (node.classList?.contains('card') || node.querySelector?.('.card')) {
          attachCardHoverTracking(node);
        }
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

export const reducedMotion = prefersReducedMotion;
