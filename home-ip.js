// One silent intro for each tool visit; internal navigation never restarts it.
(() => {
  const key = 'demo-ip-intro-played';
  const read = () => { try { return sessionStorage.getItem(key) === '1'; } catch { return true; } };
  const mark = () => { try { sessionStorage.setItem(key, '1'); } catch { /* Keep the still when storage is unavailable. */ } };
  const reset = () => { try { sessionStorage.removeItem(key); } catch { /* Nothing to reset. */ } };
  if (document.body.dataset.page === 'workbench') {
    reset();
    window.addEventListener('pageshow', reset);
    return;
  }
  const video = document.querySelector('.ip-intro-video');
  if (!video) return;
  const still = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
  video.muted = true;
  video.playsInline = true;
  video.loop = false;
  if (!read()) {
    mark();
    video.src = video.dataset.src;
    video.play().catch(still);
  }
  window.addEventListener('pagehide', still);
  window.addEventListener('pageshow', event => { if (event.persisted) still(); });
})();
