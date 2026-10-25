(() => {
  const nav = document.querySelector('.demo-nav');
  document.querySelector('.nav-toggle').addEventListener('click', () => nav.classList.toggle('open'));
  function fit() {
    const mobile = matchMedia('(max-width: 900px) and (pointer: coarse)').matches;
    const shell = document.querySelector('.screen-shell');
    const insets = getComputedStyle(shell);
    const horizontalInset = mobile ? parseFloat(insets.paddingLeft) + parseFloat(insets.paddingRight) : 0;
    
    const viewport = window.visualViewport;
    const occlusion = mobile && viewport ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
    document.documentElement.style.setProperty('--viewport-occlusion', `${occlusion}px`);
    shell.style.position = mobile ? 'relative' : '';
    shell.style.top = mobile ? `${viewport?.offsetTop || 0}px` : '';
    const mobileWidth = document.documentElement.clientWidth;
    const width = mobile ? mobileWidth - horizontalInset : Math.min(innerWidth, 375);
    const viewportHeight = window.visualViewport?.height || innerHeight;
    const height = mobile ? Math.max(1, Math.min(innerHeight, viewportHeight)) : Math.min(812, viewportHeight - (innerWidth > 900 ? 48 : 0));
    const screen = document.querySelector('.design-screen');
    screen.style.zoom = String(width / 750);
    screen.style.setProperty('--canvas-height', `${height * 750 / width}px`);
    shell.style.width = `${mobile ? mobileWidth : width}px`;
    const canvas = document.querySelector('.design-screen');
    canvas.style.setProperty('--safe-top', `calc(env(safe-area-inset-top, 0px) * ${750 / width})`);
    canvas.style.setProperty('--safe-bottom', `calc(var(--native-safe-bottom) * ${750 / width})`);
  }
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('scroll', fit);
})();
