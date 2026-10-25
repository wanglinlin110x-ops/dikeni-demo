(() => {
  const nav = document.querySelector('.demo-nav');
  document.querySelector('.nav-toggle').addEventListener('click', () => nav.classList.toggle('open'));
  function fit() {
    const mobile = matchMedia('(max-width: 900px) and (pointer: coarse)').matches;
    const shell = document.querySelector('.screen-shell');
    const insets = getComputedStyle(shell);
    const horizontalInset = mobile ? parseFloat(insets.paddingLeft) + parseFloat(insets.paddingRight) : 0;
    const verticalInset = mobile ? parseFloat(insets.paddingTop) + parseFloat(insets.paddingBottom) : 0;
    const mobileWidth = document.documentElement.clientWidth;
    const width = mobile ? mobileWidth - horizontalInset : Math.min(innerWidth, 375);
    const viewportHeight = window.visualViewport?.height || innerHeight;
    const height = mobile ? Math.max(1, Math.min(innerHeight, viewportHeight) - verticalInset) : Math.min(812, viewportHeight - (innerWidth > 900 ? 48 : 0));
    const screen = document.querySelector('.design-screen');
    screen.style.zoom = String(width / 750);
    screen.style.setProperty('--canvas-height', `${height * 750 / width}px`);
    shell.style.width = `${mobile ? mobileWidth : width}px`;
  }
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
})();
