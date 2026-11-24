// Reading size uses the shared preference; the remaining settings stay presentation-only.
(() => {
  const back=document.querySelector('.settings-back');
  let returnURL=new URL('index.html#sidebar-settings',location.href);
  try{const saved=sessionStorage.getItem('demo-settings-return'),url=new URL(saved||'index.html',location.href);if(url.origin===location.origin&&/\/(?:index|input|conversation)\.html$/.test(url.pathname)){url.hash='sidebar-settings';returnURL=url}}catch{}
  back.href=returnURL.href;
  DemoFontSize.updateButtons();
  let timer;
  document.querySelectorAll('[data-font-size-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const large=button.dataset.fontSizeToggle==='large';
    if(large===DemoFontSize.isLarge())return;
    DemoFontSize.toggle();
    try{if(localStorage.getItem('demo-font-size')!==(large?'large':'standard'))throw Error()}catch{
      const toast=document.querySelector('.toast');clearTimeout(timer);toast.textContent='字号设置未能保存，已在当前页应用';toast.classList.add('visible');timer=setTimeout(()=>toast.classList.remove('visible'),2400);
    }
  }));
  window.addEventListener('pagehide',()=>clearTimeout(timer));
})();
