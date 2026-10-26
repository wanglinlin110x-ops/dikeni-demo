// Desktop previews retain the original canvas size, even in a narrow or touch-capable panel.
// Phone layout is a device choice, never inferred from the preview window's width.
(() => {
  const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.userAgentData?.mobile === true;
  document.documentElement.classList.toggle('mobile-layout', mobileDevice);
  document.documentElement.classList.toggle('standalone-layout', navigator.standalone === true || matchMedia('(display-mode: standalone)').matches);
})();
