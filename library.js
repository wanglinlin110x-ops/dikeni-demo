(() => {
  const content = document.querySelector('#library-content'), tabs = [...document.querySelectorAll('[data-kind]')];
  const input = document.querySelector('.library-search-form input'), clear = document.querySelector('.library-search-clear'), status = document.querySelector('.library-search-status');
  let kind = location.hash === '#files' ? 'files' : 'images';
  input.value = new URLSearchParams(location.search).get('q') || '';
  const legacySamples = [
    {name:'本月销冠资料.webp',key:'champion-current',title:'本月销冠资料',past:false},
    {name:'上月销冠趋势.webp',key:'champion-previous',title:'上月销冠趋势',past:true},
    {name:'本月车型交付对比.webp',key:'model-deliveries',title:'本月车型交付对比'},
    {name:'门店客户试驾.webp',key:'test-drive',title:'门店客户试驾'},
    {name:'客户试驾跟进清单.webp',key:'followup-checklist',title:'客户试驾跟进清单'},
  ].map(item=>({...item,legacy:true,url:`assets/library-samples/${item.key}.webp`,thumbnail:`assets/library-samples/${item.key}-thumb.webp`}));
  const materials = [
  {
    "key": "material-01",
    "name": "方程豹豹5，探索日常.webp",
    "title": "方程豹豹5，探索日常",
    "url": "assets/library-materials/material-01.webp",
    "thumbnail": "assets/library-materials/material-01-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  },
  {
    "key": "material-02",
    "name": "方程豹豹5，驶向辽阔.webp",
    "title": "方程豹豹5，驶向辽阔",
    "url": "assets/library-materials/material-02.webp",
    "thumbnail": "assets/library-materials/material-02-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  },
  {
    "key": "material-03",
    "name": "比亚迪上半年销量答卷-1.webp",
    "title": "比亚迪上半年销量答卷-1",
    "url": "assets/library-materials/material-03.webp",
    "thumbnail": "assets/library-materials/material-03-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年上半年比亚迪新能源汽车累计销量214.60万辆。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-04",
    "name": "比亚迪六月乘用车销量海报-4.webp",
    "title": "比亚迪六月乘用车销量海报-4",
    "url": "assets/library-materials/material-04.webp",
    "thumbnail": "assets/library-materials/material-04-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年6月比亚迪乘用车销量结构：纯电20.69万辆，插电混动17.07万辆。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势 乘用车 纯电 插混 动力"
  },
  {
    "key": "material-05",
    "name": "比亚迪六月销量主视觉-3.webp",
    "title": "比亚迪六月销量主视觉-3",
    "url": "assets/library-materials/material-05.webp",
    "thumbnail": "assets/library-materials/material-05-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年6月比亚迪新能源汽车销量38.26万辆。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-06",
    "name": "比亚迪新能源销量增长-2.webp",
    "title": "比亚迪新能源销量增长-2",
    "url": "assets/library-materials/material-06.webp",
    "thumbnail": "assets/library-materials/material-06-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年上半年比亚迪新能源汽车累计销量同比增长33.04%。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-07",
    "name": "比亚迪汉试驾跟进清单-2.webp",
    "title": "比亚迪汉试驾跟进清单-2",
    "url": "assets/library-materials/material-07.webp",
    "thumbnail": "assets/library-materials/material-07-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "比亚迪汉试驾后应该怎么跟进？",
    "heading": "试驾后的客户跟进清单",
    "paragraphs": [
      "记录客户信息与试驾反馈，确认用车需求，解答疑虑，再沟通购车方案并约定下次跟进时间。"
    ],
    "tags": "比亚迪 汉 客户 试驾 跟进 清单"
  },
  {
    "key": "material-08",
    "name": "比亚迪汉试驾跟进清单-3.webp",
    "title": "比亚迪汉试驾跟进清单-3",
    "url": "assets/library-materials/material-08.webp",
    "thumbnail": "assets/library-materials/material-08-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "比亚迪汉试驾后应该怎么跟进？",
    "heading": "试驾后的客户跟进清单",
    "paragraphs": [
      "记录客户信息与试驾反馈，确认用车需求，解答疑虑，再沟通购车方案并约定下次跟进时间。"
    ],
    "tags": "比亚迪 汉 客户 试驾 跟进 清单"
  },
  {
    "key": "material-09",
    "name": "比亚迪试驾跟进清单-1.webp",
    "title": "比亚迪试驾跟进清单-1",
    "url": "assets/library-materials/material-09.webp",
    "thumbnail": "assets/library-materials/material-09-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "客户试驾后应该怎么跟进？",
    "heading": "试驾后的客户跟进清单",
    "paragraphs": [
      "记录客户信息与试驾反馈，确认用车需求，解答疑虑，再沟通购车方案并约定下次跟进时间。"
    ],
    "tags": "比亚迪 汉 客户 试驾 跟进 清单"
  },
  {
    "key": "material-10",
    "name": "比亚迪试驾跟进清单-4.webp",
    "title": "比亚迪试驾跟进清单-4",
    "url": "assets/library-materials/material-10.webp",
    "thumbnail": "assets/library-materials/material-10-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "客户试驾后应该怎么跟进？",
    "heading": "试驾后的客户跟进清单",
    "paragraphs": [
      "记录客户信息与试驾反馈，确认用车需求，解答疑虑，再沟通购车方案并约定下次跟进时间。"
    ],
    "tags": "比亚迪 汉 客户 试驾 跟进 清单"
  },
  {
    "key": "material-11",
    "name": "销冠宣传海报·1.webp",
    "title": "销冠宣传海报·1",
    "url": "assets/library-materials/material-11.webp",
    "thumbnail": "assets/library-materials/material-11-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "查看销冠宣传海报",
    "heading": "销售冠军宣传海报",
    "paragraphs": [
      "这张销售冠军主题海报可用于门店荣誉展示和团队激励。"
    ],
    "tags": "销冠 销售冠军 冠军 荣誉 人物 海报"
  },
  {
    "key": "material-12",
    "name": "销冠宣传海报·2.webp",
    "title": "销冠宣传海报·2",
    "url": "assets/library-materials/material-12.webp",
    "thumbnail": "assets/library-materials/material-12-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "本月汉的销冠是谁？",
    "heading": "本月汉车型销冠：陈宇",
    "paragraphs": [
      "截至10月29日，深圳南山王朝旗舰店汉车型销售冠军是陈宇，累计交付18辆，领先第二名4辆。月度目标15辆，完成率120%。"
    ],
    "tags": "销冠 销售冠军 冠军 荣誉 人物 海报 汉 陈宇"
  },
  {
    "key": "material-13",
    "name": "销冠宣传海报·3.webp",
    "title": "销冠宣传海报·3",
    "url": "assets/library-materials/material-13.webp",
    "thumbnail": "assets/library-materials/material-13-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "查看销冠宣传海报",
    "heading": "销售冠军宣传海报",
    "paragraphs": [
      "这张销售冠军主题海报可用于门店荣誉展示和团队激励。"
    ],
    "tags": "销冠 销售冠军 冠军 荣誉 人物 海报"
  },
  {
    "key": "material-14",
    "name": "销冠宣传海报·4.webp",
    "title": "销冠宣传海报·4",
    "url": "assets/library-materials/material-14.webp",
    "thumbnail": "assets/library-materials/material-14-thumb.webp",
    "width": 1086,
    "height": 1448,
    "question": "查看销冠宣传海报",
    "heading": "销售冠军宣传海报",
    "paragraphs": [
      "这张销售冠军主题海报可用于门店荣誉展示和团队激励。"
    ],
    "tags": "销冠 销售冠军 冠军 荣誉 人物 海报"
  },
  {
    "key": "material-15",
    "name": "汽车销量趋势_01.webp",
    "title": "汽车销量趋势_01",
    "url": "assets/library-materials/material-15.webp",
    "thumbnail": "assets/library-materials/material-15-thumb.webp",
    "width": 1600,
    "height": 1067,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年1月至6月比亚迪新能源汽车月度销量走势，6月为38.26万辆。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-16",
    "name": "汽车销量趋势_02.webp",
    "title": "汽车销量趋势_02",
    "url": "assets/library-materials/material-16.webp",
    "thumbnail": "assets/library-materials/material-16-thumb.webp",
    "width": 1600,
    "height": 1067,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年上半年比亚迪新能源汽车累计销量214.60万辆，以及逐月销量分布。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-17",
    "name": "汽车销量趋势_03.webp",
    "title": "汽车销量趋势_03",
    "url": "assets/library-materials/material-17.webp",
    "thumbnail": "assets/library-materials/material-17-thumb.webp",
    "width": 1600,
    "height": 1067,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年与2024年上半年比亚迪新能源汽车月度销量对比。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势"
  },
  {
    "key": "material-18",
    "name": "汽车销量趋势_04.webp",
    "title": "汽车销量趋势_04",
    "url": "assets/library-materials/material-18.webp",
    "thumbnail": "assets/library-materials/material-18-thumb.webp",
    "width": 1600,
    "height": 1067,
    "question": "查看2025年上半年比亚迪销量资料",
    "heading": "2025年比亚迪销量资料",
    "paragraphs": [
      "图中展示2025年上半年比亚迪乘用车动力结构；6月纯电20.69万辆、插电混动17.07万辆，合计37.76万辆。",
      "这是图片所标注的历史统计周期，可结合图中口径查看。"
    ],
    "tags": "2025 比亚迪 销量 上半年 六月 新能源 历史 趋势 乘用车 纯电 插混 动力"
  },
  {
    "key": "material-19",
    "name": "豹5向野而行-2.webp",
    "title": "豹5向野而行-2",
    "url": "assets/library-materials/material-19.webp",
    "thumbnail": "assets/library-materials/material-19-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  },
  {
    "key": "material-20",
    "name": "豹5城市探索-3.webp",
    "title": "豹5城市探索-3",
    "url": "assets/library-materials/material-20.webp",
    "thumbnail": "assets/library-materials/material-20-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  },
  {
    "key": "material-21",
    "name": "豹5，心向旷野-4.webp",
    "title": "豹5，心向旷野-4",
    "url": "assets/library-materials/material-21.webp",
    "thumbnail": "assets/library-materials/material-21-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  },
  {
    "key": "material-22",
    "name": "雾蓝山境中的方程豹豹5.webp",
    "title": "雾蓝山境中的方程豹豹5",
    "url": "assets/library-materials/material-22.webp",
    "thumbnail": "assets/library-materials/material-22-thumb.webp",
    "width": 1600,
    "height": 900,
    "question": "查看方程豹豹5的车型宣传图片",
    "heading": "方程豹豹5宣传资料",
    "paragraphs": [
      "这张图片展示了方程豹豹5的外观及场景氛围，可用于车型介绍和客户沟通。"
    ],
    "tags": "方程豹 豹5 车型 城市 户外 宣传"
  }
];
  const samples=[...materials,...legacySamples,...(window.ConversationMaterials?.catalog||[])];
  const conversationId=new URLSearchParams(location.search).get('conversation');
  const sessions=ChatConversations.list();
  const currentSession=sessions.find(s=>s.id===conversationId);
  const references=new Map();
  for(const session of sessions)for(const message of session.messages){
    const add=(key)=>{if(!references.has(key))references.set(key,[]);references.get(key).push({sessionId:session.id,messageId:message.id})};
    const output=message.role==='assistant'&&message.state==='complete'?message.reply:null;
    for(const file of output?.libraryFiles||[]){if(samples.some(item=>item.key===file.key))add(file.key)}
    const image=output?.libraryImage;
    if(image){
      let sample=samples.find(item=>item.url===image.src);
      if(!sample&&/^assets\/(?:conversation-materials\/zhou-champion\.svg|album-samples\/IMG_\d+\.PNG|library-samples\/[a-z-]+\.webp)$/.test(image.src)){
        sample={key:image.key||'image:'+image.src,title:image.name||'对话图片',name:image.name||'对话图片',url:image.src,thumbnail:image.src,width:image.width||720,height:image.height||720,type:'image/'+(image.src.endsWith('.svg')?'svg+xml':'webp')};samples.push(sample);
      }
      if(sample){
        if(!references.has(sample.key)||session.id===conversationId)sample.title=image.name||sample.title;
        sample.tags=[sample.tags||'',session.title,output.title,image.name].filter(Boolean).join(' ');add(sample.key);
      }
    }
    for(const file of message.attachments||[]){const key='attachment:'+file.id;add(key);if(!samples.some(item=>item.key===key))samples.push({...file,key,title:file.name,attachmentId:file.id,type:file.type||'application/octet-stream'})}
  }
  const recordMode=Boolean(conversationId);
  if(recordMode){document.title='聊天记录 · 迪客牛仔';document.querySelector('h1').textContent='聊天记录';input.setAttribute('aria-label','搜索本对话资料')}
  const back = document.querySelector('.library-back'), previous = sessionStorage.getItem('demo-library-return');
  back.href = 'index.html#sidebar-library';
  if (['index.html','input.html','conversation.html'].includes(previous)) back.href = previous + '#sidebar-library';
  if(recordMode)back.href='conversation.html#resume-chat-'+encodeURIComponent(conversationId);
  const node = (tag, className, text) => {const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el};
  function message(title, detail) {const p=node('p','library-message');p.append(node('strong','',title),document.createTextNode(detail));content.append(p)}
  function openChat(item,button){
    const refs=references.get(item.key)||[],ref=refs.find(record=>record.sessionId===conversationId)||refs[0];
    if(!ref){status.textContent='原对话暂时无法定位';return}
    ChatConversations.activate(ref.sessionId);
    location.assign('conversation.html#message-'+encodeURIComponent(ref.messageId));
  }
  const stateKey='demo-library-images-v1:'+DemoAccess.storageScope;
  let state={pinned:[],deleted:[]};
  try {const saved=JSON.parse(localStorage.getItem(stateKey));if(saved)for(const key of ['pinned','deleted'])if(Array.isArray(saved[key]))state[key]=saved[key].filter(value=>typeof value==='string')} catch {}
  const orderKey='demo-library-order-v2:'+DemoAccess.storageScope;
  let order=[];
  try{const saved=JSON.parse(sessionStorage.getItem(orderKey));if(Array.isArray(saved))order=saved.filter(key=>materials.some(item=>item.key===key))}catch{}
  if(order.length!==materials.length||new Set(order).size!==materials.length){
    order=materials.map(item=>item.key);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
    try{sessionStorage.setItem(orderKey,JSON.stringify(order))}catch{}
  }
  const orderRank=new Map(order.map((key,index)=>[key,index]));
  const dialog=node('dialog','library-image-menu');dialog.setAttribute('aria-label','资料操作');
  dialog.innerHTML='<button type="button" data-image-action="locate"><img src="assets/history-menu-share.svg" alt=""><span>定位到聊天</span></button><button type="button" data-image-action="pin"><img src="assets/history-menu-top.svg" alt=""><span>置顶</span></button><button type="button" data-image-action="download"><img src="assets/library-download.svg" alt=""><span>下载</span></button><button type="button" data-image-action="delete"><img src="assets/history-menu-trash.svg" alt=""><span>删除</span></button>';
  document.querySelector('.library-shell').append(dialog);
  const toast=node('div','library-action-toast');toast.setAttribute('role','status');toast.hidden=true;document.body.append(toast);
  let activeItem,activeButton,press,toastTimer;
  function notify(text,undo){clearTimeout(toastTimer);toast.replaceChildren(document.createTextNode(text));if(undo){const button=node('button','', '撤销');button.type='button';button.onclick=()=>{undo();toast.hidden=true};toast.append(button)}toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,5000)}
  function store(next){try{localStorage.setItem(stateKey,JSON.stringify(next));state=next;return true}catch{notify('保存失败，请重试');return false}}
  function cancelPress(){if(press)clearTimeout(press.timer);press=undefined}
  function clearMenuFocus(){dialog.querySelector('.library-menu-focus')?.remove()}
  function closeMenu(){if(dialog.open)dialog.close();clearMenuFocus();activeItem=undefined;activeButton=undefined}
  function showMenu(item,button){cancelPress();activeItem=item;activeButton=button;window.getSelection()?.removeAllRanges();dialog.querySelector('[data-image-action="pin"] span').textContent=state.pinned.includes(item.key)?'取消置顶':'置顶';clearMenuFocus();if(button.matches('.library-image')){const image=button.querySelector('img'),rect=button.getBoundingClientRect();if(image){const focus=image.cloneNode();focus.className='library-menu-focus';focus.setAttribute('aria-hidden','true');Object.assign(focus.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});dialog.append(focus)}}dialog.showModal();const shell=document.querySelector('.library-shell').getBoundingClientRect(),rect=button.getBoundingClientRect();const width=Math.min(260,shell.width-32);dialog.style.width=width+'px';const bounds=dialog.getBoundingClientRect();dialog.style.left=Math.max(shell.left+16,Math.min(rect.left,shell.right-width-16))+'px';dialog.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-bounds.height-16))+'px'}
  const preview=node('dialog','materials-preview');preview.setAttribute('aria-label','资料预览');preview.innerHTML='<header><h2></h2><button type="button" class="materials-close" aria-label="关闭预览">×</button></header><div class="materials-preview-body"></div><button type="button" class="materials-download">下载</button>';
  const imageActions=node('footer','materials-image-actions');
  imageActions.innerHTML='<button type="button" data-preview-action="delete"><span><img src="assets/preview-delete.svg" alt=""></span>删除</button><button type="button" data-preview-action="share"><span><img src="assets/preview-share.svg" alt=""></span>分享</button><button type="button" data-preview-action="download"><span><img src="assets/preview-download.svg" alt=""></span>下载</button><button type="button" data-preview-action="locate"><span><img src="assets/preview-locate.svg" alt=""></span>定位到聊天</button>';
  preview.append(imageActions);
  preview.querySelector('.materials-close').innerHTML='<img src="assets/preview-close.svg" alt="">';
  function fitPreview(){if(!preview.classList.contains('materials-image-preview')){preview.style.removeProperty('left');preview.style.removeProperty('width');return}const rect=document.querySelector('.library-shell').getBoundingClientRect();preview.style.left=rect.left+'px';preview.style.width=rect.width+'px'}
  window.addEventListener('resize',()=>{if(preview.open)fitPreview()});
  imageActions.onclick=async event=>{
    const button=event.target.closest('[data-preview-action]');if(!button||!previewItem)return;
    const item=previewItem,action=button.dataset.previewAction;
    if(action==='download'){download(item);return}
    if(action==='share'){
      try{let blob;if(item.attachmentId){const stored=await AttachmentStorage.get(item.attachmentId);if(!stored)throw Error('missing');blob=stored.blob}else{const response=await fetch(item.url);if(!response.ok)throw Error('missing');blob=await response.blob()}
        const file=new File([blob],item.name,{type:blob.type||'image/webp'});
        if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:item.title})}else if(navigator.share){await navigator.share({title:item.title,url:new URL(item.url,location.href).href})}else{notify('当前浏览器不支持分享，可下载图片后分享')}
      }catch(error){if(error.name!=='AbortError')notify('暂时无法分享，可下载图片后分享')}return;
    }
    activeItem=item;activeButton=button;dialog.querySelector('[data-image-action="'+action+'"]').click();
  };
  document.querySelector('.library-shell').append(preview);let previewItem,previewToken=0;const objectURLs=[],previewURLs=[],thumbnailURLs=new Map();
  async function download(item){if(item.attachmentId){try{await AttachmentStorage.download(item.attachmentId)}catch{notify('文件暂时无法下载，请重新添加')}return}const a=document.createElement('a');a.href=item.url;a.download=item.name;document.body.append(a);a.click();a.remove()}
  async function openPreview(item){previewItem=item;const token=++previewToken;const body=preview.querySelector('.materials-preview-body');body.replaceChildren();preview.querySelector('h2').textContent=item.title;preview.classList.toggle('materials-image-preview',!item.type||item.type.startsWith('image/'));fitPreview();preview.showModal();
    try{let blob;if(item.attachmentId){const file=await AttachmentStorage.get(item.attachmentId);if(token!==previewToken||!preview.open)return;if(!file)throw Error('missing');blob=file.blob}
      const url=blob?URL.createObjectURL(blob):item.url;if(blob)previewURLs.push(url);
      if(!item.type||item.type.startsWith('image/')){const image=node('img','');image.src=url;image.alt=item.title;body.append(image)}
      else if(item.type==='application/pdf'){const frame=node('iframe','');frame.title=item.title;frame.src=url;body.append(frame)}
      else if(/\.(txt|csv|md|json)$/i.test(item.name)){if(!blob){const response=await fetch(item.url);if(!response.ok)throw Error('missing');blob=await response.blob()}if(blob.size>=2000000)throw Error('large');const text=await blob.text();if(token===previewToken&&preview.open)body.append(node('pre','',text))}
      else body.append(node('p','library-message','暂不支持预览此文件，可下载后查看。'));
    }catch{if(token===previewToken)body.append(node('p','library-message','资料暂时无法读取，请重新添加。'))}}
  preview.querySelector('.materials-close').onclick=()=>preview.close();preview.querySelector('.materials-download').onclick=()=>download(previewItem);
  preview.addEventListener('close',()=>{previewToken++;previewItem=undefined;previewURLs.splice(0).forEach(url=>URL.revokeObjectURL(url))});
  preview.addEventListener('click',event=>{if(event.target===preview){const r=preview.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)preview.close()}});
  function bindMenu(item,button){let suppressClick=false;
    button.onclick=event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return}if(item.key!=='customer-followup')openPreview(item)};
    button.onpointerdown=event=>{if(event.button!==0||!event.isPrimary)return;cancelPress();suppressClick=false;const timer=setTimeout(()=>{suppressClick=true;showMenu(item,button)},450);press={timer,x:event.clientX,y:event.clientY,pointerId:event.pointerId}};
    button.onpointermove=event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancelPress()};
    button.oncontextmenu=event=>{event.preventDefault();suppressClick=true;if(!dialog.open)showMenu(item,button)};
    button.onkeydown=event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();showMenu(item,button)}};
    button.style.touchAction='pan-y';button.dataset.imageKey=item.key;
  }
  dialog.onclick=event=>{const button=event.target.closest('[data-image-action]');if(!button){const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeMenu();return}const item=activeItem,trigger=activeButton;if(!item)return;const action=button.dataset.imageAction;closeMenu();
    if(action==='locate'){openChat(item,trigger,true);return}
    if(action==='download'){download(item);return}
    if(action==='pin'){const pinned=state.pinned.includes(item.key)?state.pinned.filter(key=>key!==item.key):[item.key,...state.pinned];if(store({...state,pinned})){render();notify(pinned.includes(item.key)?'已置顶':'已取消置顶')}return}
    if(action==='delete'&&store({...state,deleted:[...state.deleted,item.key]})){render();notify('已从资料库删除',()=>{if(store({...state,deleted:state.deleted.filter(key=>key!==item.key)}))render()})}
  };
  dialog.addEventListener('close',()=>{clearMenuFocus();activeItem=undefined;activeButton=undefined});
  document.addEventListener('pointerup',cancelPress);document.addEventListener('pointercancel',cancelPress);content.addEventListener('scroll',cancelPress,{passive:true});window.addEventListener('resize',()=>{cancelPress();closeMenu()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPress();closeMenu()}});window.addEventListener('pagehide',event=>{cancelPress();closeMenu();if(preview.open)preview.close();clearTimeout(toastTimer);if(!event.persisted)objectURLs.forEach(url=>URL.revokeObjectURL(url));sessionStorage.setItem('demo-materials-scroll:'+location.pathname+location.search+location.hash,String(content.scrollTop))});
  let masonryFrame;
  function layoutImages(){
    cancelAnimationFrame(masonryFrame);
    masonryFrame=requestAnimationFrame(()=>{
      const grid=content.querySelector('.library-grid');if(!grid)return;
      const gap=12,width=(grid.clientWidth-gap)/2;if(width<=0)return;
      const heights=[0,0];
      for(const button of grid.children){
        const image=button.querySelector('img');
        const imageWidth=Number(image.getAttribute('width'))||image.naturalWidth||1;
        const imageHeight=Number(image.getAttribute('height'))||image.naturalHeight||1;
        const column=heights[0]<=heights[1]?0:1,height=width*imageHeight/imageWidth;
        button.style.left=(column*(width+gap))+'px';button.style.top=heights[column]+'px';
        button.style.height=height+'px';heights[column]+=height+gap;
      }
      grid.style.height=Math.max(0,Math.max(...heights)-gap)+'px';
    });
  }
  // Keep DOM/search order intact; position each item in the shorter column.
  content.addEventListener('load',layoutImages,true);
  let masonryWidth;
  const masonryObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==masonryWidth){masonryWidth=width;layoutImages()}});
  masonryObserver.observe(content);
  function render() {
    cancelPress();closeMenu();if(preview.open)preview.close();content.replaceChildren();content.setAttribute('aria-labelledby',kind+'-tab');content.setAttribute('aria-busy','false');
    for(const tab of tabs){const active=tab.dataset.kind===kind;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1}
    const query=input.value.trim();clear.hidden=!query;
    const rows=samples.filter(item=>references.has(item.key)&&(kind==='images'?(!item.type||item.type.startsWith('image/')):Boolean(item.type&&!item.type.startsWith('image/')))&&(!recordMode||(currentSession&&references.get(item.key)?.some(ref=>ref.sessionId===conversationId)))&&!state.deleted.includes(item.key)&&(!query||`${item.title} ${item.name} ${item.tags||''}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>{const rank=item=>state.pinned.includes(item.key)?state.pinned.indexOf(item.key):-1;return(rank(a)<0?999:rank(a))-(rank(b)<0?999:rank(b))||(orderRank.get(a.key)??999)-(orderRank.get(b.key)??999)});
    status.textContent=query?`找到${rows.length}项资料`:'';
    if(!rows.length){message(query?'没有找到相关资料':kind==='images'?'还没有图片':'还没有文件',query?'换个关键词试试':'');return}
    const grid=node('div',kind==='images'?'library-grid':'library-files');
    for(const item of rows){const button=node('button',kind==='images'?'library-image':'library-file');button.type='button';button.setAttribute('aria-label',item.key==='customer-followup'?item.title:`预览：${item.title}`);const image=node('img','');image.src=kind==='files'?'assets/library-document.svg':item.thumbnail||'assets/attachment-album.svg';image.alt=kind==='images'?item.title:'';image.loading='lazy';image.decoding='async';if(kind==='images'&&item.width&&item.height){image.width=item.width;image.height=item.height}if(kind==='files'){const info=node('span','library-file-info');info.append(node('span','library-file-name',item.title),node('span','library-file-meta',`${item.name.split('.').pop().toUpperCase()} · ${Math.max(1,Math.round(item.size/1024))}KB`));button.append(image,info)}else{button.append(image);if(item.attachmentId)AttachmentStorage.get(item.attachmentId).then(file=>{if(file&&image.isConnected){if(!thumbnailURLs.has(item.key)){const url=URL.createObjectURL(file.blob);objectURLs.push(url);thumbnailURLs.set(item.key,url)}image.src=thumbnailURLs.get(item.key)}}).catch(()=>image.alt='图片暂时无法读取')}if(state.pinned.includes(item.key))button.append(node('span','library-pinned-badge','置顶'));bindMenu(item,button);grid.append(button)}content.append(grid);layoutImages();
  }
  function update(){const url=new URL(location.href);if(input.value.trim())url.searchParams.set('q',input.value.trim());else url.searchParams.delete('q');url.hash=kind;history.replaceState(null,'',url);render()}
  document.querySelector('form').onsubmit=e=>{e.preventDefault();input.blur();update()};input.oninput=update;clear.onclick=()=>{input.value='';update();input.focus()};
  for(const tab of tabs){tab.onclick=()=>{kind=tab.dataset.kind;update()};tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:tabs.find(t=>t!==tab);next.focus();kind=next.dataset.kind;update()}}}
  function syncState(){try{const saved=JSON.parse(localStorage.getItem(stateKey));if(saved&&Array.isArray(saved.pinned)&&Array.isArray(saved.deleted)){const scroll=content.scrollTop;state=saved;render();content.scrollTop=scroll}}catch{}}
  window.addEventListener('pageshow',event=>{if(event.persisted)syncState()});window.addEventListener('storage',event=>{if(event.key===stateKey)syncState()});
  render();const requested=new URLSearchParams(location.search).get('preview');if(requested){const item=samples.find(item=>item.key===requested);if(item&&references.has(item.key)&&item.key!=='customer-followup'&&(!recordMode||references.get(item.key)?.some(ref=>ref.sessionId===conversationId)))openPreview(item)}requestAnimationFrame(()=>{content.scrollTop=Number(sessionStorage.getItem('demo-materials-scroll:'+location.pathname+location.search+location.hash))||0});
})();
