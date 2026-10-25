// Shared, short transitions for the existing multipage demo.
window.DemoMotion = (() => {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = (element, frames, duration, easing = 'cubic-bezier(.2,.8,.2,1)', fill = 'none') => {
    if (!element || reduced() || !element.animate) return Promise.resolve();
    return element.animate(frames, { duration, easing, fill }).finished.catch(() => {});
  };
  // Desktop preview chrome lives outside every animated page and overlay.
  // Real phones hide these mock bars and use the shell's native safe-area insets.
  const screen = document.querySelector('.design-screen');
  const chrome = document.createElement('div');
  chrome.className = 'system-chrome';
  chrome.setAttribute('aria-hidden', 'true');
  for (const selector of ['[data-name="Status Bar/Light"], .wb-status', '[data-name="Home Indicator/Dark"], .wb-home-indicator']) {
    const bar = screen?.querySelector(selector);
    if (!bar) continue;
    const top = bar.matches('[data-name="Status Bar/Light"], .wb-status');
    const slot = document.createElement('div');
    slot.className = top ? 'system-status-slot' : 'system-home-slot';
    slot.setAttribute('aria-hidden', 'true');
    // Keep the space occupied by bars that originally participated in layout.
    if (getComputedStyle(bar).position !== 'absolute') bar.before(slot);
    bar.classList.add(top ? 'system-status-bar' : 'system-home-bar');
    chrome.append(bar);
  }
  if (chrome.childElementCount) screen.append(chrome);
  const scene = () => document.querySelector('.design-screen > :first-child');
  const level = pathname => /workbench\.html$/.test(pathname) ? 0 : /(?:index|input)\.html$/.test(pathname) ? 1 : 2;
  const storageKey = 'demo-page-transition';
  let navigating = false;
  async function navigate(href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) { location.href = url.href; return; }
    if (navigating) return;
    navigating = true;
    const mode = level(location.pathname) === 0 && level(url.pathname) === 1 ? 'assistant-open'
      : level(location.pathname) > 0 && level(url.pathname) === 0 ? 'assistant-close' : 'page';
    try { sessionStorage.setItem(storageKey, JSON.stringify({ pathname: url.pathname, mode, at: Date.now() })); } catch { /* Navigation still works without storage. */ }
    if (mode === 'assistant-close') {
      await animate(scene(), [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], 200, 'cubic-bezier(.4,0,1,1)', 'forwards');

    }
    location.href = url.href;
  }
  function enter() {
    navigating = false;
    let transition;
    try { transition = JSON.parse(sessionStorage.getItem(storageKey)); sessionStorage.removeItem(storageKey); } catch { /* Direct visits stay still. */ }
    if (transition?.pathname === location.pathname && Date.now() - transition.at < 10000) {
      if (transition.mode === 'assistant-open') {
        animate(scene(), [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], 220, 'cubic-bezier(.16,1,.3,1)');

      }
    }
  }
  function overlay(element, open) {
    const panel = element.querySelector('[role="dialog"]');
    const backdrop = element.querySelector('.overlay-backdrop');
    const history = element.classList.contains('history-overlay');
    const current = panel ? getComputedStyle(panel).transform : 'none';
    const opacity = backdrop ? getComputedStyle(backdrop).opacity : '1';
    [panel, backdrop].forEach(node => node?.getAnimations().forEach(animation => animation.cancel()));
    const offscreen = history ? 'translateX(-100%)' : 'translateY(100%)';
    return Promise.all([
      animate(panel, open ? [{ transform: offscreen }, { transform: 'translate(0)' }] : [{ transform: current }, { transform: offscreen }], open ? 260 : 200, open ? undefined : 'cubic-bezier(.4,0,1,1)'),
      animate(backdrop, open ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity }, { opacity: 0 }], open ? 220 : 200),
    ]);
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href);
    if (url.origin === location.origin && /\.html$/.test(url.pathname)) { event.preventDefault(); navigate(url.href); }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { navigating = false; scene()?.getAnimations().forEach(animation => animation.cancel()); } });
  enter();
  return { navigate, overlay, animate };
})();
