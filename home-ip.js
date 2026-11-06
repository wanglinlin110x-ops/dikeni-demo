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
  const firstFrame = video.poster;
  const finalFrame = new URL('assets/ip-intro-final-frame.webp', document.baseURI).href;
  const showPoster = () => { delete video.dataset.frameReady; };
  video.addEventListener('playing', () => {
    const ready = () => { if (!video.paused && !video.ended) video.dataset.frameReady = 'true'; };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(ready);
    else ready();
  });
  // Retain the decoded final frame and keep the same frame underneath it in case
  // Safari releases the video surface after playback ends. Never fall back to frame 1.
  video.addEventListener('ended', () => {
    video.pause();
    video.dataset.frameReady = 'true';
    poster.src = finalFrame;
  });
  for (const name of ['error', 'emptied']) video.addEventListener(name, showPoster);
  let pending = false;
  function playEntry() {
    pending = false;
    poster.src = firstFrame;
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
