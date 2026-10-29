// Replay once on every home entry, including back/forward cache restoration.
(() => {
  const video = document.querySelector('.ip-intro-video');
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = false;
  // Keep a real image below the video: iOS may discard the video surface when
  // autoplay is blocked or decoding fails. Successful playback keeps its last frame.
  const poster = video.parentElement.querySelector('.ip-intro-fallback') || new Image();
  poster.className = 'ip-intro-fallback'; poster.alt = '';
  poster.setAttribute('aria-hidden', 'true');
  if (!poster.getAttribute('src')) poster.src = video.poster;
  if (!poster.isConnected) video.before(poster); video.parentElement.classList.add('ip-has-fallback');
  const showPoster = () => { delete video.dataset.frameReady; };
  video.addEventListener('playing', () => {
    const ready = () => { if (!video.paused && !video.ended) video.dataset.frameReady = 'true'; };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(ready);
    else ready();
  });
  // Do not swap to the poster on ended: retain the decoded final video frame.
  for (const name of ['error', 'emptied']) video.addEventListener(name, showPoster);
  let pending = false;
  function playEntry() {
    pending = false;
    showPoster();
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
