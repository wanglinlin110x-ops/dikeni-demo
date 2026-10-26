// Replay once on every home entry, including back/forward cache restoration.
(() => {
  const video = document.querySelector('.ip-intro-video');
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = false;
  let pending = false;
  function playEntry() {
    pending = false;
    video.currentTime = 0;
    video.play().catch(() => { pending = true; });
  }
  // pageshow fires once for a new page and again when restoring a cached page.
  window.addEventListener('pageshow', playEntry);
  window.addEventListener('pagehide', () => { pending = false; video.pause(); });
  // A browser/low-power autoplay restriction must not leave a permanently still IP.
  document.addEventListener('pointerdown', () => {
    if (pending && !document.hidden) { pending = false; video.play().catch(() => { pending = true; }); }
  }, { passive: true });
})();
