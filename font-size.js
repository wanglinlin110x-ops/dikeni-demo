// Shared reading preference; the 750px design canvas keeps its existing scale.
window.DemoFontSize = (() => {
  const key = 'demo-font-size';
  const read = () => { try { return localStorage.getItem(key) === 'large'; } catch { return false; } };
  const isLarge = () => document.documentElement.classList.contains('font-large');
  function updateButtons() {
    document.querySelectorAll('[data-font-size-toggle]').forEach(button => {
      const large = button.dataset.fontSizeToggle === 'large';
      button.setAttribute('aria-label', large ? '大字' : '标准');
      button.setAttribute('aria-pressed', String(large === isLarge()));
    });
  }
  function updateTargets() {
    const canvas = document.querySelector('.design-screen');
    if (canvas) canvas.style.setProperty('--tap-target', `${44 * 750 / canvas.getBoundingClientRect().width}px`);
  }
  function apply(large) {
    const canvas = document.querySelector('.design-screen');
    const zoom = canvas ? canvas.getBoundingClientRect().width / 750 : 1;
    const positions = [...document.querySelectorAll('.s10,.s49,.history-content,.source-scroll,.feedback-sheet,.wb-content')]
      .filter(node => node.getClientRects().length && node.scrollHeight > node.clientHeight)
      .map(node => {
        const top = Math.max(node.getBoundingClientRect().top, node.querySelector('[data-name="Header"]')?.getBoundingClientRect().bottom || 0);
        const anchor = [...node.querySelectorAll('.chat-user p,.chat-paragraph,.chat-metrics,.chat-trend,.followup-options button,.history-recent,.wb-card,[data-name="Section"],.source-list li')]
          .find(child => child.getBoundingClientRect().bottom > top);
        return { node, anchor, top: anchor?.getBoundingClientRect().top, scrollTop: node.scrollTop,
          atEnd: node.scrollHeight - node.clientHeight - node.scrollTop < 2 };
      });
    document.documentElement.classList.toggle('font-large', large);
    updateButtons(); updateTargets();
    for (const p of positions) {
      if (p.atEnd) p.node.scrollTop = p.node.scrollHeight;
      else if (p.anchor) p.node.scrollTop += (p.anchor.getBoundingClientRect().top - p.top) / zoom;
      else p.node.scrollTop = p.scrollTop;
    }
    document.dispatchEvent(new Event('demo-font-change'));
  }
  function toggle() {
    const large = !isLarge();
    try { localStorage.setItem(key, large ? 'large' : 'standard'); } catch { /* Still apply within the current page. */ }
    apply(large);
  }
  apply(read());
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) apply(read()); });
  window.addEventListener('resize', () => requestAnimationFrame(updateTargets));
  requestAnimationFrame(updateTargets);
  return { toggle, isLarge, updateButtons };
})();
