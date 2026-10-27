// Desktop previews retain the original canvas size, even in a narrow or touch-capable panel.
// Phone layout is a device choice, never inferred from the preview window's width.
(() => {
  const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.userAgentData?.mobile === true;
  document.documentElement.classList.toggle('mobile-layout', mobileDevice);
  const root = document.documentElement;
  const mobile = mobileDevice && innerWidth <= 900;
  const outerWidth = mobile ? root.clientWidth : 375;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
  root.append(probe);
  const insets = getComputedStyle(probe);
  const width = outerWidth - (mobile ? parseFloat(insets.paddingLeft) + parseFloat(insets.paddingRight) : 0);
  probe.remove();
  const height = mobile ? innerHeight : 812;
  root.style.setProperty('--safe-top', `calc(env(safe-area-inset-top, 0px) * ${750 / width})`);
  root.style.setProperty('--safe-bottom', `calc(var(--native-safe-bottom) * ${750 / width})`);
  root.style.setProperty('--voice-tap-target', `${44 * 750 / width}px`);
  root.style.setProperty('--initial-zoom', String(width / 750));
  root.style.setProperty('--initial-width', `${outerWidth}px`);
  root.style.setProperty('--initial-height', `${height * 750 / width}px`);
  document.documentElement.classList.toggle('standalone-layout', navigator.standalone === true || matchMedia('(display-mode: standalone)').matches);
  let startupDeadline;
  window.DemoStartup = {
    watch() {
      startupDeadline = setTimeout(() => {
        if (root.classList.contains('demo-ready')) return;
        const toast = document.querySelector('.toast');
        if (toast) { toast.textContent = '页面加载较慢，请稍候或刷新重试'; toast.classList.add('visible'); }
      }, 6000);
    },
    ready() {
      clearTimeout(startupDeadline);
      root.classList.add('demo-ready');
      const screen = document.querySelector('.design-screen');
      if (screen?.hasAttribute('data-startup-inert')) { screen.inert = false; screen.removeAttribute('data-startup-inert'); }
      const toast = document.querySelector('.toast');
      if (toast?.textContent === '页面加载较慢，请稍候或刷新重试') toast.classList.remove('visible');
    },
  };
})();
