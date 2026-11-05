(() => {
  const content = document.querySelector('#library-content'), tabs = [...document.querySelectorAll('[data-kind]')];
  const input = document.querySelector('.library-search-form input'), clear = document.querySelector('.library-search-clear'), status = document.querySelector('.library-search-status');
  let kind = location.hash === '#files' ? 'files' : 'images';
  input.value = new URLSearchParams(location.search).get('q') || '';
  const samples = [
    {name:'本月销冠资料.webp',key:'champion-current',title:'本月销冠资料',past:false},
    {name:'上月销冠趋势.webp',key:'champion-previous',title:'上月销冠趋势',past:true},
    {name:'本月车型交付对比.webp',key:'model-deliveries',title:'本月车型交付对比'},
    {name:'门店客户试驾.webp',key:'test-drive',title:'门店客户试驾'},
    {name:'客户试驾跟进清单.webp',key:'followup-checklist',title:'客户试驾跟进清单'},
  ].map(item=>({...item,url:`assets/library-samples/${item.key}.webp`,thumbnail:`assets/library-samples/${item.key}-thumb.webp`}));
  const back = document.querySelector('.library-back'), previous = sessionStorage.getItem('demo-library-return');
  back.href = 'index.html#sidebar-library';
  if (['index.html','input.html','conversation.html'].includes(previous)) back.href = previous + '#sidebar-library';
  const node = (tag, className, text) => {const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el};
  function message(title, detail) {const p=node('p','library-message');p.append(node('strong','',title),document.createTextNode(detail));content.append(p)}
  function openChat(item,button,locate = false) {
    button.disabled=true;
    try {
      if(locate){const existing=ChatConversations.list().find(session=>session.messages.some(message=>message.reply?.libraryImage?.src===item.url));if(existing){ChatConversations.activate(existing.id);location.assign('conversation.html#library-image-'+item.key);return}}
      let question=item.past?'上月销冠是谁？查看相关资料图片':'本月销冠是谁？查看相关资料图片';
      let reply=DemoChat.reply(item.past?'上个月销冠是谁？':'本月销售冠军是谁？');
      if(item.key==='model-deliveries'){question='本月主要卖什么车？查看车型交付对比';reply=DemoChat.reply('主要卖什么车？',reply.context)}
      if(['test-drive','followup-checklist'].includes(item.key)){
        const drive=item.key==='test-drive';question=drive?'安排客户试驾前要确认什么？':'试驾后的客户跟进清单怎么做？';
        reply={kind:'answer',homeReply:true,homeReplyVersion:2,title:drive?'试驾前先确认客户需求':'客户试驾跟进清单',paragraphs:drive?['先确认客户的预算、用车需求和重点关注配置，再约定试驾时间与路线。','围绕客户在意的空间、乘坐感受和驾驶体验进行介绍，试驾后及时整理反馈。']:['1. 确认预算与用车需求','2. 记录试驾关注点','3. 发送配置与费用清单','4. 约定下次回访时间'],context:{lastIntent:'home-library-materials',homeScenario:{key:'library-materials'}},sources:[],followups:[]};
      }
      reply.libraryImage={src:item.url,name:item.title};
      const session=ChatConversations.create(reply.context,{requireSave:true});session.title=question;session.messages=[{id:crypto.randomUUID(),role:'user',text:question},{id:crypto.randomUUID(),role:'assistant',state:'complete',reply}];
      if(!ChatConversations.save(session))throw Error('storage');
      sessionStorage.removeItem('demo-pending-message');sessionStorage.removeItem('demo-current-message');location.assign('conversation.html'+(locate?'#library-image-'+item.key:''));
    } catch {button.disabled=false;status.textContent='暂时无法打开对话，请重试。'}
  }
  const stateKey='demo-library-images-v1:'+DemoAccess.storageScope;
  let state={pinned:[],deleted:[]};
  try {const saved=JSON.parse(localStorage.getItem(stateKey));if(saved)for(const key of ['pinned','deleted'])if(Array.isArray(saved[key]))state[key]=saved[key].filter(value=>samples.some(item=>item.key===value))} catch {}
  const dialog=node('dialog','library-image-menu');dialog.setAttribute('aria-label','图片操作');
  dialog.innerHTML='<button type="button" data-image-action="locate"><img src="assets/history-menu-share.svg" alt=""><span>定位到聊天</span></button><button type="button" data-image-action="pin"><img src="assets/history-menu-top.svg" alt=""><span>置顶</span></button><button type="button" data-image-action="download"><img src="assets/library-download.svg" alt=""><span>下载</span></button><button type="button" data-image-action="delete"><img src="assets/history-menu-trash.svg" alt=""><span>删除</span></button>';
  document.querySelector('.library-shell').append(dialog);
  const toast=node('div','library-action-toast');toast.setAttribute('role','status');toast.hidden=true;document.body.append(toast);
  let activeItem,activeButton,press,toastTimer;
  function notify(text,undo){clearTimeout(toastTimer);toast.replaceChildren(document.createTextNode(text));if(undo){const button=node('button','', '撤销');button.type='button';button.onclick=()=>{undo();toast.hidden=true};toast.append(button)}toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,5000)}
  function store(next){try{localStorage.setItem(stateKey,JSON.stringify(next));state=next;return true}catch{notify('保存失败，请重试');return false}}
  function cancelPress(){if(press)clearTimeout(press.timer);press=undefined}
  function closeMenu(){if(dialog.open)dialog.close();activeItem=undefined;activeButton=undefined}
  function showMenu(item,button){cancelPress();activeItem=item;activeButton=button;window.getSelection()?.removeAllRanges();dialog.querySelector('[data-image-action="pin"] span').textContent=state.pinned.includes(item.key)?'取消置顶':'置顶';dialog.showModal();const shell=document.querySelector('.library-shell').getBoundingClientRect(),rect=button.getBoundingClientRect();const width=Math.min(260,shell.width-32);dialog.style.width=width+'px';const bounds=dialog.getBoundingClientRect();dialog.style.left=Math.max(shell.left+16,Math.min(rect.left,shell.right-width-16))+'px';dialog.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-bounds.height-16))+'px'}
  function bindMenu(item,button){let suppressClick=false;
    button.onclick=event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return}openChat(item,button)};
    button.onpointerdown=event=>{if(event.button!==0||!event.isPrimary)return;cancelPress();suppressClick=false;const timer=setTimeout(()=>{suppressClick=true;showMenu(item,button)},450);press={timer,x:event.clientX,y:event.clientY,pointerId:event.pointerId}};
    button.onpointermove=event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancelPress()};
    button.oncontextmenu=event=>{event.preventDefault();suppressClick=true;if(!dialog.open)showMenu(item,button)};
    button.onkeydown=event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();showMenu(item,button)}};
    button.style.touchAction='pan-y';button.dataset.imageKey=item.key;
  }
  dialog.onclick=event=>{const button=event.target.closest('[data-image-action]');if(!button){const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeMenu();return}const item=activeItem,trigger=activeButton;if(!item)return;const action=button.dataset.imageAction;closeMenu();
    if(action==='locate'){openChat(item,trigger,true);return}
    if(action==='download'){const a=document.createElement('a');a.href=item.url;a.download=item.name;document.body.append(a);a.click();a.remove();return}
    if(action==='pin'){const pinned=state.pinned.includes(item.key)?state.pinned.filter(key=>key!==item.key):[item.key,...state.pinned];if(store({...state,pinned})){render();notify(pinned.includes(item.key)?'已置顶':'已取消置顶')}return}
    if(action==='delete'&&store({...state,deleted:[...state.deleted,item.key]})){render();notify('已从资料库删除',()=>{if(store({...state,deleted:state.deleted.filter(key=>key!==item.key)}))render()})}
  };
  dialog.addEventListener('close',()=>{activeItem=undefined;activeButton=undefined});
  document.addEventListener('pointerup',cancelPress);document.addEventListener('pointercancel',cancelPress);content.addEventListener('scroll',cancelPress,{passive:true});window.addEventListener('resize',()=>{cancelPress();closeMenu()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPress();closeMenu()}});window.addEventListener('pagehide',()=>{cancelPress();closeMenu();clearTimeout(toastTimer)});
  function render() {
    cancelPress();closeMenu();content.replaceChildren();content.setAttribute('aria-labelledby',kind+'-tab');content.setAttribute('aria-busy','false');
    for(const tab of tabs){const active=tab.dataset.kind===kind;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1}
    const query=input.value.trim();clear.hidden=!query;
    if(kind==='files'){status.textContent='';message('还没有文件','');return}
    const rows=samples.filter(item=>!state.deleted.includes(item.key)&&(!query||`${item.title} ${item.name}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>{const rank=item=>state.pinned.includes(item.key)?state.pinned.indexOf(item.key):-1;return(rank(a)<0?999:rank(a))-(rank(b)<0?999:rank(b))});
    status.textContent=query?`找到${rows.length}张图片`:'';
    if(!rows.length){message('没有找到相关图片','换个关键词试试');return}
    const grid=node('div','library-grid');
    for(const item of rows){const button=node('button','library-image');button.type='button';button.setAttribute('aria-label',`打开对话：${item.title}`);const image=node('img','');image.src=item.thumbnail;image.alt=item.title;image.loading='lazy';image.decoding='async';button.append(image);if(state.pinned.includes(item.key))button.append(node('span','library-pinned-badge','置顶'));bindMenu(item,button);grid.append(button)}content.append(grid);
  }
  function update(){const url=new URL(location.href);if(input.value.trim())url.searchParams.set('q',input.value.trim());else url.searchParams.delete('q');url.hash=kind;history.replaceState(null,'',url);render()}
  document.querySelector('form').onsubmit=e=>{e.preventDefault();input.blur();update()};input.oninput=update;clear.onclick=()=>{input.value='';update();input.focus()};
  for(const tab of tabs){tab.onclick=()=>{kind=tab.dataset.kind;update()};tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:tabs.find(t=>t!==tab);next.focus();kind=next.dataset.kind;update()}}}
  render();
})();
