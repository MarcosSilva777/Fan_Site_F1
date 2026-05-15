const GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
const SCROLL_TRIGGER_CDN =
  'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js';

let gsapPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing && existing.dataset.loaded === '1') return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.src = src;
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
}

export function loadGsap({ withScrollTrigger = true } = {}) {
  if (gsapPromise) return gsapPromise;
  gsapPromise = (async () => {
    await loadScript(GSAP_CDN);
    if (withScrollTrigger) {
      await loadScript(SCROLL_TRIGGER_CDN);
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
    }
    return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger };
  })();
  return gsapPromise;
}
