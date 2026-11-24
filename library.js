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
  let sessions=ChatConversations.list();
  let currentSession=sessions.find(s=>s.id===conversationId);
  const references=new Map();
  function refreshOutputs(){
    sessions=ChatConversations.list();currentSession=sessions.find(s=>s.id===conversationId);references.clear();
  for(const session of sessions)for(const message of session.messages){
    const add=(key)=>{if(!references.has(key))references.set(key,[]);references.get(key).push({sessionId:session.id,messageId:message.id,inherited:Boolean(message.origin)})};
    const output=message.role==='assistant'&&message.state==='complete'?message.reply:null;
    for(const file of output?.libraryFiles||[]){let sample=samples.find(item=>item.key===file.key);if(!sample&&(file.document&&file.artifactId||/^assets\/conversation-materials\/[a-z0-9-]+\.(pdf|csv)$/.test(file.url))){sample={...file};samples.push(sample)}if(sample){Object.assign(sample,{...file,summary:(output.paragraphs||[])[0]||''});add(file.key)}}
    const image=output?.libraryImage;
    if(image){
      let sample=samples.find(item=>item.url===image.src);
      if(!sample&&/^assets\/(?:conversation-materials\/zhou-champion\.svg|album-samples\/IMG_\d+\.PNG|library-samples\/[a-z-]+\.webp)$/.test(image.src)){
        sample={key:image.key||'image:'+image.src,title:image.name||'对话图片',name:image.name||'对话图片',url:image.src,thumbnail:image.src,width:image.width||720,height:image.height||720,type:'image/'+(image.src.endsWith('.svg')?'svg+xml':'webp')};samples.push(sample);
      }
      if(sample){
        if(!references.has(sample.key)||session.id===conversationId)sample.title=image.name||sample.title;
        sample.version=image.version||1;sample.createdAt=image.createdAt||message.createdAt;sample.artifactId=image.artifactId;sample.tags=[sample.tags||'',session.title,output.title,image.name].filter(Boolean).join(' ');add(sample.key);
      }
    }
    for(const file of message.attachments||[]){const key='attachment:'+file.id;add(key);if(!samples.some(item=>item.key===key))samples.push({...file,key,title:file.name,attachmentId:file.id,type:file.type||'application/octet-stream'})}
  }
  }
  refreshOutputs();
  // Title-only display samples; they do not pretend to be generated chat attachments.
  const titleSamples=[
    ['汉车型客户试驾接待与需求确认指南','doc','application/msword'],
    ['本月销售冠军经验复盘与团队分享','pdf','application/pdf'],
    ['客户异议处理与常用沟通话术','md','text/markdown'],
    ['王朝网重点车型配置对比与推荐要点','doc','application/msword'],
    ['门店周度销售总结与下周跟进计划','pdf','application/pdf'],
    ['客户意向分级与回访记录规范','md','text/markdown']
  ].map(([title,extension,type],index)=>({key:'file-title-sample-'+index,title,name:title+'.'+extension,type,presentationOnly:true,version:1,createdAt:`2026-11-23T10:${String(30-index*5).padStart(2,'0')}:00+08:00`}));
  samples.push(...titleSamples);
  function fileSummary(item){
    if(item.document){const steps=item.document.rows.map(row=>row[0]).join('、'),fields=item.document.headers.slice(2);return steps+(fields.length?'；包含'+fields.join('、'):'')}
    return item.summary||'';
  }
  function sourceTitle(item){const refs=references.get(item.key)||[],ref=refs.find(r=>r.sessionId===conversationId)||refs.findLast(r=>!r.inherited)||refs[0];return sessions.find(session=>session.id===ref?.sessionId)?.title||''}
  function searchText(item){if(!item.type||item.type.startsWith('image/'))return[item.title,item.name,item.tags].filter(Boolean).join(' ').toLowerCase();return[item.title,item.name,item.tags,fileSummary(item),sourceTitle(item),...(item.document?.headers||[]),...(item.document?.rows||[]).flat()].filter(Boolean).join(' ').toLowerCase()}
  const recordMode=Boolean(conversationId);
  if(recordMode){document.title='聊天记录 · 迪客牛仔';document.querySelector('h1').textContent='聊天记录';input.setAttribute('aria-label','搜索本对话资料')}
  const back = document.querySelector('.library-back'), previous = sessionStorage.getItem('demo-library-return');
  back.href = 'index.html#sidebar-library';
  if (['index.html','input.html','conversation.html'].includes(previous)) back.href = previous + '#sidebar-library';
  if(recordMode)back.href='conversation.html#resume-chat-'+encodeURIComponent(conversationId);
  const readerParams=new URLSearchParams(location.search);
  let documentReturnURL,documentReturnHistory=false;
  if(readerParams.get('from')==='chat'){
    try{const target=new URL(readerParams.get('returnTo')||back.href,location.href);if(target.origin===location.origin&&target.pathname.endsWith('/conversation.html')){
      documentReturnURL=target.pathname+target.search+target.hash;
      const referrer=document.referrer?new URL(document.referrer):null;
      documentReturnHistory=history.state?.readerReturnURL===documentReturnURL||Boolean(referrer&&referrer.origin===target.origin&&referrer.pathname===target.pathname&&referrer.search===target.search);
    }}catch{}
  }
  let readerDepth=history.state?.readerDepth||0;
  const readerHistoryState=extra=>({...history.state,...extra,...(documentReturnURL?{readerReturnURL:documentReturnURL,readerDepth}:{} )});
  if(documentReturnURL)history.replaceState(readerHistoryState({}), '',location.href);
  const node = (tag, className, text) => {const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el};
  function message(title, detail) {const p=node('p','library-message');p.append(node('strong','',title),document.createTextNode(detail));content.append(p)}
  function openChat(item,button){
    if(state.deleted.includes(item.key)){notify('这个版本已删除');return}
    const refs=references.get(item.key)||[],ref=refs.find(record=>record.sessionId===conversationId)||refs.findLast(record=>!record.inherited)||refs[0];
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
  const fileMenu=node('dialog','file-action-menu');fileMenu.setAttribute('aria-label','文件操作');
  fileMenu.innerHTML='<div class="file-menu-content"><div class="file-menu-preview"><img src="assets/library-document.svg" alt=""><div><strong></strong><p></p><small></small></div></div><div class="file-menu-actions"></div></div>';
  const fileActions=[['copy','复制文档','96cd7.svg'],['versions','历史版本','conversation-1dd93.svg'],['edit','基于此版修改','history-menu-edit.svg'],['locate','定位到聊天','preview-locate.svg'],['pin','置顶','history-menu-top.svg'],['download','下载','library-download.svg'],['delete','删除','history-menu-trash.svg']];
  for(const[action,label,icon]of fileActions){const button=node('button',''),image=node('img','');button.type='button';button.dataset.imageAction=action;image.src='assets/'+icon;image.alt='';button.append(image,node('span','',label));fileMenu.querySelector('.file-menu-actions').append(button)}
  document.querySelector('.library-shell').append(fileMenu);let fileOpeningGesture=false;
  function fileIcon(item){
    const extension=(item.name||'').split('.').pop().toLowerCase();
    if(extension==='pdf'||item.type==='application/pdf')return 'assets/file-format-pdf.svg';
    if(['doc','docx'].includes(extension)||/word/.test(item.type||''))return 'assets/file-format-doc.svg';
    if(['md','markdown'].includes(extension)||item.type==='text/markdown')return 'assets/file-format-markdown.svg';
    return 'assets/library-document.svg';
  }
  const readerDocumentTitle=item=>String(item.document?.title||item.title||'').replace(/（零售口径，市场常用上牌\/零售数据）$/, '');
  const displayFileName=item=>item.name.replace(/_V\d+(?=\.[^.]+$)/,'');
  const latestFile=item=>item.artifactId&&versionsOf(item).find(file=>!ArtifactVersions.isDeleted(file))?.key===item.key;
  const fileLine=item=>item.presentationOnly?`${item.name.split('.').pop().toUpperCase()==='MD'?'Markdown':item.name.split('.').pop().toUpperCase()} · ${ArtifactVersions.formatTime(item.createdAt)}`:`V${item.version||1}${latestFile(item)?' · 最新':''}${item.createdAt?' · '+ArtifactVersions.formatTime(item.createdAt):''}`;
  function showFileMenu(item,button){
    fileMenu.classList.remove('file-menu-from-reader');activeItem=item;activeButton=button;const info=fileMenu.querySelector('.file-menu-preview');info.querySelector('img').src=fileIcon(item);info.querySelector('strong').textContent=displayFileName(item);info.querySelector('p').textContent=fileLine(item);info.querySelector('small').textContent=[item.name.split('.').pop().toUpperCase(),item.size?Math.max(1,Math.round(item.size/1024))+'KB':'',item.baseVersion?'基于V'+item.baseVersion+'修改':''].filter(Boolean).join(' · ');
    fileMenu.querySelector('[data-image-action="pin"] span').textContent=state.pinned.includes(item.artifactId||item.key)?'取消置顶':'置顶';for(const action of ['versions','edit'])fileMenu.querySelector(`[data-image-action="${action}"]`).hidden=!item.artifactId;
    const shell=document.querySelector('.library-shell').getBoundingClientRect(),rect=button.getBoundingClientRect();fileMenu.style.width=Math.min(360,shell.width-32)+'px';if(!fileMenu.open)fileMenu.showModal();const bounds=fileMenu.getBoundingClientRect();fileMenu.style.left=Math.max(shell.left+16,Math.min(rect.left,shell.right-bounds.width-16))+'px';fileMenu.style.top=Math.max(16,Math.min(rect.top,innerHeight-bounds.height-16))+'px';
  }

  const toast=node('div','library-action-toast');toast.setAttribute('role','status');toast.hidden=true;document.body.append(toast);
  let activeItem,activeButton,press,toastTimer;
  function notify(text,undo){([...document.querySelectorAll('dialog[open]')].at(-1)||document.body).append(toast);clearTimeout(toastTimer);toast.replaceChildren(document.createTextNode(text));if(undo){const button=node('button','', '撤销');button.type='button';button.onclick=()=>{undo();toast.hidden=true};toast.append(button)}toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,5000)}
  function store(next){try{localStorage.setItem(stateKey,JSON.stringify(next));state=next;return true}catch{notify('保存失败，请重试');return false}}
  function cancelPress(){if(press)clearTimeout(press.timer);press=undefined}
  function clearMenuFocus(){dialog.querySelector('.library-menu-focus')?.remove()}
  function closeMenu(){activeButton?.resetMaterialPress?.();if(dialog.open)dialog.close();if(fileMenu.open)fileMenu.close();clearMenuFocus();activeItem=undefined;activeButton=undefined}
  function showMenu(item,button){cancelPress();if(item.type&&!item.type.startsWith('image/')){window.getSelection()?.removeAllRanges();showFileMenu(item,button);return}activeItem=item;activeButton=button;window.getSelection()?.removeAllRanges();dialog.querySelector('[data-image-action="pin"] span').textContent=state.pinned.includes(item.artifactId||item.key)?'取消置顶':'置顶';clearMenuFocus();if(button.matches('.library-image')){const image=button.querySelector('img'),rect=button.getBoundingClientRect();if(image){const focus=image.cloneNode();focus.className='library-menu-focus';focus.setAttribute('aria-hidden','true');Object.assign(focus.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});dialog.append(focus)}}dialog.showModal();const shell=document.querySelector('.library-shell').getBoundingClientRect(),rect=button.getBoundingClientRect();const width=Math.min(260,shell.width-32);dialog.style.width=width+'px';const bounds=dialog.getBoundingClientRect();dialog.style.left=Math.max(shell.left+16,Math.min(rect.left,shell.right-width-16))+'px';dialog.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-bounds.height-16))+'px'}
  const preview=node('dialog','materials-preview');preview.setAttribute('aria-label','资料预览');preview.innerHTML='<header><h2></h2><button type="button" class="materials-close" aria-label="关闭预览">×</button></header><div class="materials-preview-body"></div><button type="button" class="materials-download">下载</button>';
  const fileStatus=document.querySelector('.library-status').cloneNode(true);fileStatus.classList.add('file-page-status');preview.prepend(fileStatus);
  const imageActions=node('footer','materials-image-actions');
  imageActions.innerHTML='<button type="button" data-preview-action="delete"><span><img src="assets/preview-delete.svg" alt=""></span>删除</button><button type="button" data-preview-action="share"><span><img src="assets/preview-share.svg" alt=""></span>分享</button><button type="button" data-preview-action="download"><span><img src="assets/preview-download.svg" alt=""></span>下载</button><button type="button" data-preview-action="locate"><span><img src="assets/preview-locate.svg" alt=""></span>定位到聊天</button>';
  preview.append(imageActions);
  const versionTools=node('div','materials-version-tools');versionTools.innerHTML='<p></p><div><button type="button" data-version-tool="versions">历史版本</button><button type="button" data-version-tool="edit">基于此版修改</button><button type="button" data-version-tool="locate">定位到聊天</button></div>';preview.querySelector('header').after(versionTools);
  versionTools.onclick=event=>{const action=event.target.closest('[data-version-tool]')?.dataset.versionTool,item=previewItem;if(!action||!item)return;if(action==='versions'){returnVersionsItem=undefined;versionsReaderOrigin=item;showVersions(item)}if(action==='edit')editVersion(item);if(action==='locate')openChat(item)};

  preview.querySelector('.materials-close').innerHTML='<img src="assets/preview-close.svg" alt="">';
  const readerMore=node('button','materials-reader-more');readerMore.type='button';readerMore.setAttribute('aria-label','文件更多操作');readerMore.setAttribute('aria-haspopup','dialog');readerMore.innerHTML='<img src="assets/reply-more.svg" alt="">';preview.querySelector('header').append(readerMore);
  const readerCopy=node('button','materials-reader-copy'),readerDownload=node('button','materials-reader-download');readerCopy.type=readerDownload.type='button';readerCopy.setAttribute('aria-label','复制文档');readerDownload.setAttribute('aria-label','下载文档');readerCopy.innerHTML='<img src="assets/96cd7.svg" alt="">';readerDownload.innerHTML='<img src="assets/preview-download.svg" alt="">';preview.querySelector('header').append(readerCopy,readerDownload);
  readerCopy.onclick=async()=>{if(!previewItem)return;const d=previewItem.document,text=d?documentCopyText(previewItem):previewItem.title;try{await navigator.clipboard.writeText(text);notify('已复制文档')}catch{notify('复制未完成，请重试')}};readerDownload.onclick=()=>previewItem&&download(previewItem);
  const editFooter=node('footer','reader-edit-footer'),editCanvas=node('div','reader-edit-canvas composer-attachments'),editForm=node('form','s36 reader-edit-form');
  editForm.innerHTML='<div class="s39" data-name="Text Input - 文档修改"><input class="message-input" type="text" placeholder="说明要修改的内容…" aria-label="文档修改要求" maxlength="1000"></div><button class="s41" type="submit" aria-label="提交文档修改" disabled><span class="s42"><span class="s43"><img class="s4" src="assets/composer-send-disabled.svg" alt=""></span></span></button>';
  editCanvas.append(editForm);editFooter.append(editCanvas);preview.append(editFooter);const editInput=editForm.querySelector('input'),editSend=editForm.querySelector('button'),editDrafts=new Map();let editingDocument=false;
  // Keep document editing text-only; reuse the chat field and send component without adding capabilities.
  preview.querySelector('header').classList.add('reader-header-canvas','s51');
  const readerBack=preview.querySelector('.materials-close');readerBack.classList.add('s53');readerBack.innerHTML='<span class="s16"><img class="s4" src="assets/document-close.svg" alt=""></span>';
  function fitReader(){const shell=document.querySelector('.library-shell'),scale=shell.clientWidth/750;preview.style.setProperty('--reader-scale',scale);const mobile=matchMedia('(max-width:600px) and (pointer:coarse)').matches;preview.style.setProperty('--reader-footer-height',((mobile?142:210)*scale)+'px')}
  new ResizeObserver(fitReader).observe(document.querySelector('.library-shell'));fitReader();
  const updateEditSend=()=>{editSend.disabled=editingDocument||!editInput.value.trim();editSend.classList.toggle('is-send-ready',!editSend.disabled);editSend.style.setProperty('--send-color',editSend.disabled?'#ddd':'#07B1C7');editSend.querySelector('img').src=editSend.disabled?'assets/composer-send-disabled.svg':'assets/composer-send-enabled.svg'};
  editInput.oninput=()=>{if(previewItem)editDrafts.set(previewItem.key,editInput.value);updateEditSend()};
  editForm.onsubmit=event=>{event.preventDefault();if(editingDocument||!previewItem||!editInput.value.trim())return;editingDocument=true;updateEditSend();const key=previewItem.key;if(!editVersion(previewItem,editInput.value.trim())){editingDocument=false;updateEditSend()}else{editDrafts.delete(key);editInput.value='';editInput.blur()}};
  window.addEventListener('pageshow',()=>{editingDocument=false;updateEditSend()});
  let readerEdited=false;

  readerMore.onclick=()=>{if(!previewItem)return;showFileMenu(previewItem,readerMore);fileMenu.classList.add('file-menu-from-reader');const shell=document.querySelector('.library-shell').getBoundingClientRect(),anchor=readerMore.getBoundingClientRect();fileMenu.style.setProperty('--file-menu-scale',shell.width/750);fileMenu.style.width=Math.min(520*shell.width/750,shell.width-32)+'px';const bounds=fileMenu.getBoundingClientRect();fileMenu.style.left=shell.right-bounds.width-16+'px';fileMenu.style.top=Math.max(16,Math.min(anchor.bottom+8,innerHeight-bounds.height-16))+'px'};

  function fitPreview(){if(!preview.classList.contains('materials-image-preview')){preview.style.removeProperty('left');preview.style.removeProperty('width');return}const rect=document.querySelector('.library-shell').getBoundingClientRect();preview.style.left=rect.left+'px';preview.style.width=rect.width+'px'}
  window.addEventListener('resize',()=>{if(preview.open)fitPreview()});
  imageActions.onclick=async event=>{
    const button=event.target.closest('[data-preview-action]');if(!button||!previewItem)return;
    const item=previewItem,action=button.dataset.previewAction;
    if(action==='download'){download(item);return}
    if(action==='share'){
      try{let blob;if(item.document){blob=await ArtifactVersions.blob(item);}else if(item.attachmentId){const stored=await AttachmentStorage.get(item.attachmentId);if(!stored)throw Error('missing');blob=stored.blob}else{const response=await fetch(item.url);if(!response.ok)throw Error('missing');blob=await response.blob()}
        const file=new File([blob],item.name,{type:blob.type||'image/webp'});
        if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:item.title})}else if(navigator.share){await navigator.share({title:item.title,url:new URL(item.url,location.href).href})}else{notify('当前浏览器不支持分享，可下载图片后分享')}
      }catch(error){if(error.name!=='AbortError')notify('暂时无法分享，可下载图片后分享')}return;
    }
    activeItem=item;activeButton=button;dialog.querySelector('[data-image-action="'+action+'"]').click();
  };
  document.querySelector('.library-shell').append(preview);let previewItem,previewToken=0;const objectURLs=[],previewURLs=[],thumbnailURLs=new Map();
  async function download(item){if(item.document){try{const blob=await ArtifactVersions.blob(item),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=item.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch{notify('文件生成失败，请重试')}return}if(item.attachmentId){try{await AttachmentStorage.download(item.attachmentId)}catch{notify('文件暂时无法下载，请重新添加')}return}const a=document.createElement('a');a.href=item.url;a.download=item.name;document.body.append(a);a.click();a.remove()}
  function documentSectionsHTML(sections,escape){return(sections||[]).map(section=>`<section><h2>${escape(section.title)}</h2>${(section.paragraphs||[]).map(text=>`<p>${escape(text)}</p>`).join('')}${section.items?.length?`<ul>${section.items.map(text=>`<li>${escape(text)}</li>`).join('')}</ul>`:''}${section.rows?.length?`<div class="table"><table><thead><tr>${(section.headers||[]).map(text=>`<th>${escape(text)}</th>`).join('')}</tr></thead><tbody>${section.rows.map(row=>`<tr>${row.map(text=>`<td>${escape(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}</section>`).join('')}
  function documentCopyText(item){const doc=item.document;return[readerDocumentTitle(item),doc.intro||'',...doc.rows.map(row=>row.map((value,i)=>doc.headers[i]+'：'+value).join('；')),doc.summary||'',...(doc.sections||[]).flatMap(section=>[section.title,...(section.paragraphs||[]),...(section.items||[]),...(section.rows||[]).map(row=>row.join('；'))])].filter(Boolean).join('\n')}
  function salesPreviewHTML(item){
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),d=item.document;
    return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:20px 16px 32px;background:#fff;color:#101210;font:16px/1.75 Arial,"PingFang SC",sans-serif}h1{font-size:24px;line-height:1.5;margin:0 0 18px;font-weight:600;overflow-wrap:anywhere}.meta{font-size:12px;line-height:20px;color:#999;margin-bottom:22px}blockquote{margin:0 0 20px;padding-left:12px;border-left:2px solid #ededf0;color:#777;font-size:14px}.table{overflow-x:auto}table{border-collapse:collapse;min-width:0;width:100%;font-size:14px;line-height:24px;text-align:left;table-layout:fixed}th,td{overflow-wrap:anywhere}th:first-child{width:48px}th,td{padding:10px 6px;border-bottom:1px solid #ededf0;vertical-align:top}th{font-weight:500;color:#777}h2{font-size:18px;margin:24px 0 12px}p{margin:0 0 14px}</style><body><h1>${esc(readerDocumentTitle(item))}</h1><div class="meta">陈志远 · V${item.version} · ${esc(ArtifactVersions.formatTime(item.createdAt))}修改</div><blockquote>${esc(d.intro)}</blockquote><div class="table"><table><thead><tr>${d.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${d.summary?`<h2>简要总结</h2><p>${esc(d.summary)}</p>`:''}${documentSectionsHTML(d.sections,esc)}</body></html>`;
  }
  function documentPreviewHTML(item){
    if(item.document.kind==='sales-analysis')return salesPreviewHTML(item);
    const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const doc=item.document,sections=doc.rows.map((row,index)=>`<section><h2>${String(index+1).padStart(2,'0')} ${escape(row[0])}</h2><dl>${row.slice(1).map((value,column)=>`<div><dt>${escape(doc.headers[column+1])}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></section>`).join('');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:20px 16px;background:#fff;color:#101210;font:16px/1.75 Arial,"PingFang SC",sans-serif}h1{font-size:18px;line-height:26px;margin:0 0 8px;font-weight:600}.meta{font-size:12px;color:#999;margin:0 0 20px}section{margin:0 0 20px}h2{font-size:16px;line-height:28px;margin:0 0 10px;color:#101210;font-weight:600}dl{margin:0}dl>div{display:block;margin:8px 0;overflow-wrap:anywhere}dt{display:inline;color:#101210;font-size:16px}dt::after{content:"："}dd{display:inline;margin:0;overflow-wrap:anywhere}.note{font-size:12px;line-height:20px;color:#999;margin:8px 0;overflow-wrap:anywhere}</style></head><body><h1>${escape(doc.title)}</h1><p class="meta">V${item.version} · ${escape(ArtifactVersions.formatTime(item.createdAt))}${item.baseVersion?' · 基于V'+item.baseVersion+'修改':''}</p>${sections}${documentSectionsHTML(doc.sections,escape)}${(doc.notes||[]).map(note=>`<p class="note">${escape(note)}</p>`).join('')}</body></html>`;
  }
  let fileSurfaceInert;
  async function openPreview(item,recordHistory=true){previewItem=item;editFooter.hidden=!item.document;readerCopy.disabled=!item.document;editInput.value=editDrafts.get(item.key)||'';updateEditSend();const token=++previewToken;const body=preview.querySelector('.materials-preview-body');body.replaceChildren();preview.querySelector('h2').textContent=readerDocumentTitle(item)+' · V'+(item.version||1);preview.classList.toggle('materials-image-preview',!item.type||item.type.startsWith('image/'));versionTools.hidden=!item.artifactId;versionTools.querySelector('p').textContent=`V${item.version||1} · ${item.createdAt?ArtifactVersions.formatTime(item.createdAt):''}${item.baseVersion?' · 基于V'+item.baseVersion+'修改':''}`;const isFile=Boolean(item.type&&!item.type.startsWith('image/'));preview.classList.toggle('materials-file-page',isFile);preview.setAttribute('role',isFile?'region':'dialog');preview.setAttribute('aria-label',isFile?'文件内容':'资料预览');const close=preview.querySelector('.materials-close');close.setAttribute('aria-label',isFile?'关闭文档':'关闭预览');close.querySelector('img').src=isFile?'assets/document-close.svg':'assets/preview-close.svg';fitPreview();if(isFile){if(!fileSurfaceInert)fileSurfaceInert=[...document.querySelector('.library-shell').children].filter(n=>n!==preview&&!n.matches('dialog')).map(n=>[n,n.inert]);fileSurfaceInert.forEach(([n])=>n.inert=true);preview.show();if(recordHistory){const url=new URL(location.href);url.searchParams.set('preview',item.key);readerDepth++;history.pushState(readerHistoryState({filePreview:true}), '',url)}else{const url=new URL(location.href);url.searchParams.set('preview',item.key);history.replaceState(readerHistoryState({filePreview:false}), '',url)}}else preview.showModal();
    try{let blob;if(item.document){const frame=node('iframe','materials-document-frame');frame.title=readerDocumentTitle(item)+' V'+item.version;frame.setAttribute('sandbox','');frame.srcdoc=documentPreviewHTML(item);body.append(frame);return}else if(item.attachmentId){const file=await AttachmentStorage.get(item.attachmentId);if(token!==previewToken||!preview.open)return;if(!file)throw Error('missing');blob=file.blob}
      const url=blob?URL.createObjectURL(blob):item.url;if(blob)previewURLs.push(url);
      if(!item.type||item.type.startsWith('image/')){const image=node('img','');image.src=url;image.alt=item.title;body.append(image)}
      else if(item.type==='application/pdf'){const frame=node('iframe','');frame.title=item.title;frame.src=url;body.append(frame)}
      else if(/\.(txt|csv|md|json)$/i.test(item.name)){if(!blob){const response=await fetch(item.url);if(!response.ok)throw Error('missing');blob=await response.blob()}if(blob.size>=2000000)throw Error('large');const text=await blob.text();if(token===previewToken&&preview.open)body.append(node('pre','',text))}
      else body.append(node('p','library-message','暂不支持预览此文件，可下载后查看。'));
    }catch{if(token===previewToken)body.append(node('p','library-message','资料暂时无法读取，请重新添加。'))}}
  preview.querySelector('.materials-close').onclick=()=>{
    const isFile=preview.classList.contains('materials-file-page'),fromVersions=Boolean(returnVersionsItem),unwind=isFile&&history.state?.filePreview;
    preview.close();
    if(isFile&&documentReturnURL&&!fromVersions){if(documentReturnHistory&&history.length>readerDepth+1)history.go(-(readerDepth+1));else location.replace(documentReturnURL);return}
    if(unwind){readerDepth=Math.max(0,readerDepth-1);history.back()}
  };
  window.addEventListener('popstate',event=>{readerDepth=event.state?.readerDepth||0;if(preview.open&&preview.classList.contains('materials-file-page')){closeMenu();preview.close()}});preview.querySelector('.materials-download').onclick=()=>download(previewItem);
  preview.addEventListener('close',()=>{fileSurfaceInert?.forEach(([n,inert])=>n.inert=inert);fileSurfaceInert=undefined;if(preview.classList.contains('materials-file-page')){const url=new URL(location.href);url.searchParams.delete('preview');history.replaceState(readerHistoryState({filePreview:false}),'',url)}previewToken++;previewItem=undefined;previewURLs.splice(0).forEach(url=>URL.revokeObjectURL(url));if(readerEdited){const origin=returnVersionsItem;readerEdited=false;render();returnVersionsItem=origin}if(returnVersionsItem){const item=returnVersionsItem;returnVersionsItem=undefined;if(versionsReaderOrigin)openPreview(versionsReaderOrigin,false);showVersions(item)}});
  preview.addEventListener('click',event=>{if(event.target===preview){const r=preview.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)preview.close()}});
  function bindMenu(item,button,onOpen=()=>openPreview(item)){let suppressClick=false;if(item.type&&!item.type.startsWith('image/'))button.resetMaterialPress=()=>{suppressClick=false};
    button.onclick=event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return}onOpen()};
    button.onpointerdown=event=>{if(event.button!==0||!event.isPrimary)return;cancelPress();suppressClick=false;const timer=setTimeout(()=>{suppressClick=true;showMenu(item,button);fileOpeningGesture=fileMenu.open},450);press={timer,x:event.clientX,y:event.clientY,pointerId:event.pointerId}};
    button.onpointermove=event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancelPress()};
    button.oncontextmenu=event=>{event.preventDefault();suppressClick=true;if(!dialog.open&&!fileMenu.open)showMenu(item,button)};
    button.onkeydown=event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();showMenu(item,button)}};
    button.style.touchAction='pan-y';button.dataset.imageKey=item.key;
  }
  function handleMaterialAction(event){const button=event.target.closest('[data-image-action]');if(!button){const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeMenu();return}const item=activeItem,trigger=activeButton;if(!item)return;const action=button.dataset.imageAction;closeMenu();
    if(action==='copy'){readerCopy.click();return}
    if(action==='versions'){if(preview.open&&preview.classList.contains('materials-file-page')){returnVersionsItem=undefined;versionsReaderOrigin=item}showVersions(item);return}
    if(action==='edit'){editVersion(item);return}
    if(action==='versions'){if(preview.open&&preview.classList.contains('materials-file-page')){returnVersionsItem=undefined;versionsReaderOrigin=item}showVersions(item);return}
    if(action==='edit'){editVersion(item);return}
    if(action==='locate'){openChat(item,trigger,true);return}
    if(action==='download'){download(item);return}
    if(action==='pin'){if(versionsDialog.open)versionsDialog.close();const groupKey=item.artifactId||item.key;const pinned=state.pinned.includes(groupKey)?state.pinned.filter(key=>key!==groupKey):[groupKey,...state.pinned];if(store({...state,pinned})){render();notify(pinned.includes(groupKey)?'已置顶':'已取消置顶')}return}
    if(action==='delete'&&item.artifactId){showDelete(item);return}
    if(action==='delete'&&store({...state,deleted:[...state.deleted,item.key]})){render();notify('已从资料库删除',()=>{if(store({...state,deleted:state.deleted.filter(key=>key!==item.key)}))render()})}
  };
  dialog.onclick=handleMaterialAction;
  fileMenu.addEventListener('pointerdown',()=>{fileOpeningGesture=false});
  fileMenu.onclick=event=>{if(fileOpeningGesture){fileOpeningGesture=false;event.preventDefault();return}if(event.target.closest('[data-image-action]'))handleMaterialAction(event);else if(event.target===fileMenu){const r=fileMenu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMenu()}};
  fileMenu.addEventListener('close',()=>{if(!fileMenu.open){activeButton?.resetMaterialPress?.();activeItem=undefined;activeButton=undefined}});
  dialog.addEventListener('close',()=>{clearMenuFocus();activeItem=undefined;activeButton=undefined});
  document.addEventListener('pointerup',cancelPress);document.addEventListener('pointercancel',cancelPress);content.addEventListener('scroll',cancelPress,{passive:true});window.addEventListener('resize',()=>{cancelPress();closeMenu()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPress();closeMenu()}});window.addEventListener('pagehide',event=>{cancelPress();closeMenu();if(preview.open)preview.close();clearTimeout(toastTimer);if(!event.persisted)objectURLs.forEach(url=>URL.revokeObjectURL(url));sessionStorage.setItem('demo-materials-scroll:'+location.pathname+location.search+location.hash,String(content.scrollTop))});
  const versionsDialog=node('dialog','materials-versions');versionsDialog.setAttribute('aria-label','历史版本');versionsDialog.innerHTML='<header><h2>历史版本</h2><button type="button" aria-label="关闭历史版本"><img src="assets/ab4c6.svg" alt=""></button></header><p class="materials-version-document"></p><div class="materials-version-list"></div>';document.querySelector('.library-shell').append(versionsDialog);
  let returnVersionsItem,versionsReaderOrigin;const versionScrolls=new Map();
  const closeVersions=()=>{if(versionsDialog.dataset.artifactId)versionScrolls.set(versionsDialog.dataset.artifactId,versionsDialog.querySelector('.materials-version-list').scrollTop);versionsDialog.close();if(versionsReaderOrigin){const item=versionsReaderOrigin;versionsReaderOrigin=undefined;if(!preview.open||previewItem?.key!==item.key)openPreview(item,false)}};
  versionsDialog.querySelector('header button').onclick=closeVersions;
  versionsDialog.addEventListener('cancel',event=>{event.preventDefault();closeVersions()});
  const versionsOf=item=>samples.filter(file=>file.artifactId===item.artifactId&&references.has(file.key)&&(!recordMode||references.get(file.key).some(ref=>ref.sessionId===conversationId))).sort((a,b)=>b.version-a.version);
  function editVersion(item,request){
    if(state.deleted.includes(item.key)){notify('这个版本已删除');return}
    const refs=references.get(item.key)||[],ref=refs.find(r=>r.sessionId===conversationId)||refs.findLast(r=>!r.inherited)||refs[0];
    if(!ref){notify('原对话已不可用');return}
    try{sessionStorage.setItem('demo-artifact-edit',JSON.stringify({...ref,key:item.key,...(request?{request}:{})}))}catch{notify('暂时无法引用此版本，请重试');return}
    ChatConversations.activate(ref.sessionId);location.assign('conversation.html?session='+encodeURIComponent(ref.sessionId));return true;
  }
  function fitVersions(){const rect=document.querySelector('.library-shell').getBoundingClientRect(),bottom=Math.min(rect.bottom,innerHeight),available=Math.max(120,bottom-Math.max(0,rect.top)-24);versionsDialog.style.setProperty('--versions-scale',rect.width/750);versionsDialog.style.width=rect.width+'px';versionsDialog.style.maxHeight=Math.min(rect.height*.72,available)+'px';versionsDialog.style.left=rect.left+'px';versionsDialog.style.top=Math.max(Math.max(0,rect.top),bottom-versionsDialog.getBoundingClientRect().height)+'px'}
  window.addEventListener('resize',()=>{if(versionsDialog.open){fitVersions();requestAnimationFrame(fitVersions)}});
  function showVersions(item){
    refreshOutputs();
    const list=versionsDialog.querySelector('.materials-version-list');list.replaceChildren();const versions=versionsOf(item),latest=versions.find(f=>!state.deleted.includes(f.key));
    versionsDialog.dataset.artifactId=item.artifactId;const documentLabel=versionsDialog.querySelector('.materials-version-document');documentLabel.textContent=readerDocumentTitle(item);documentLabel.title=documentLabel.textContent;
    for(const file of versions){
      const row=node('section','materials-version-row'),deleted=ArtifactVersions.isDeleted(file),open=node('button','materials-version-open'),image=node('img',''),info=node('span','materials-version-info');image.src=fileIcon(file);image.alt='';open.type='button';open.disabled=deleted;open.setAttribute('aria-label',`预览：${file.title} V${file.version}`);const heading=node('span','materials-version-heading');heading.append(node('strong','',displayFileName(file)),node('span','file-version-badge'+(file.key===latest?.key?' is-latest':''),'V'+file.version));info.append(heading,node('small','',deleted?'已删除':fileLine(file).replace(/^V\d+ · /,'')));open.append(image,info);row.append(open);
      if(file.key===previewItem?.key)open.setAttribute('aria-current','true');if(!deleted)bindMenu(file,open,()=>{versionScrolls.set(item.artifactId,list.scrollTop);versionsDialog.close();returnVersionsItem=item;openPreview(file,false)});list.append(row);
    }
    fitVersions();const opening=!versionsDialog.open;if(opening)versionsDialog.showModal();fitVersions();list.scrollTop=versionScrolls.get(item.artifactId)||0;if(opening&&!matchMedia('(prefers-reduced-motion:reduce)').matches)versionsDialog.animate([{transform:'translateY(24px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:180,easing:'ease-out'});
  }
  const deleteDialog=node('dialog','materials-delete');deleteDialog.setAttribute('aria-label','删除成果');deleteDialog.innerHTML='<h2>删除成果</h2><p></p><button type="button" data-delete-scope="version"></button><button type="button" data-delete-scope="all">删除全部版本</button><button type="button" data-delete-scope="cancel">取消</button>';document.querySelector('.library-shell').append(deleteDialog);let deleteItem;
  function showDelete(item){deleteItem=item;deleteDialog.querySelector('p').textContent=item.title+' · V'+item.version;deleteDialog.querySelector('[data-delete-scope="version"]').textContent='仅删除V'+item.version;deleteDialog.showModal()}
  deleteDialog.onclick=event=>{const scope=event.target.closest('[data-delete-scope]')?.dataset.deleteScope;if(!scope)return;if(scope==='cancel'){deleteDialog.close();return}const item=deleteItem,keys=scope==='all'?versionsOf(item).map(f=>f.key):[item.key],previous=[...state.deleted];if(!store({...state,deleted:[...new Set([...state.deleted,...keys])]}))return;deleteDialog.close();returnVersionsItem=undefined;if(versionsDialog.open)versionsDialog.close();render();notify(scope==='all'?'已删除全部版本':'已删除V'+item.version,()=>{if(store({...state,deleted:previous}))render()})};
  for(const modal of [versionsDialog,deleteDialog])modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){if(modal===versionsDialog)closeVersions();else modal.close()}});
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
    cancelPress();closeMenu();returnVersionsItem=undefined;if(preview.open)preview.close();content.replaceChildren();content.setAttribute('aria-labelledby',kind+'-tab');content.setAttribute('aria-busy','false');
    for(const tab of tabs){const active=tab.dataset.kind===kind;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;const keys=samples.filter(item=>inScope(item)&&(tab.dataset.kind==='images'?(!item.type||item.type.startsWith('image/')):Boolean(item.type&&!item.type.startsWith('image/')))).map(item=>item.artifactId||item.key);let count=tab.querySelector('.library-tab-count');if(!count){count=node('span','library-tab-count');count.setAttribute('aria-hidden','true');tab.append(count)}count.textContent=new Set(keys).size}
    const query=input.value.trim();clear.hidden=!query;
    if(recordMode&&!currentSession){status.textContent='';message('这条对话暂时无法读取','请从最近对话重新打开。');return}
    const eligible=samples.filter(item=>inScope(item)&&(kind==='images'?(!item.type||item.type.startsWith('image/')):Boolean(item.type&&!item.type.startsWith('image/')))&&(!query||searchText(item).includes(query.toLowerCase()))).sort((a,b)=>{const rank=item=>state.pinned.includes(item.artifactId||item.key)?state.pinned.indexOf(item.artifactId||item.key):-1;return(rank(a)<0?999:rank(a))-(rank(b)<0?999:rank(b))||(orderRank.get(a.key)??999)-(orderRank.get(b.key)??999)});
    const groups=new Map();for(const item of eligible){const key=item.artifactId||item.key;const old=groups.get(key);if(!old||(item.version||1)>(old.version||1))groups.set(key,item)}const rows=[...groups.values()].sort((a,b)=>Number(state.pinned.includes(b.artifactId||b.key))-Number(state.pinned.includes(a.artifactId||a.key))||Number(b.artifactId==='demo-customer-followup')-Number(a.artifactId==='demo-customer-followup'));
    status.textContent=query?`找到${rows.length}项资料`:'';
    if(!rows.length){message(query?'没有找到相关资料':kind==='images'?'还没有图片':recordMode?'本对话暂无可用文件':'还没有文件',query?'换个关键词试试':kind==='files'&&recordMode?'已删除或尚未生成的文件不会在此展示。':'');return}
    const grid=node('div',kind==='images'?'library-grid':'library-files');
    for(const item of rows){const button=node(item.presentationOnly?'div':'button',kind==='images'?'library-image':'library-file');button.type='button';button.setAttribute('aria-label',`预览：${item.title}`);const image=node('img','');image.src=kind==='files'?fileIcon(item):item.thumbnail||'assets/attachment-album.svg';image.alt=kind==='images'?item.title:'';image.loading='lazy';image.decoding='async';if(kind==='images'&&item.width&&item.height){image.width=item.width;image.height=item.height}if(kind==='files'){const info=node('span','library-file-info');info.append(node('span','library-file-name',displayFileName(item)),node('span','library-file-meta',fileLine(item)));button.append(image,info)}else{button.append(image);if(item.attachmentId)AttachmentStorage.get(item.attachmentId).then(file=>{if(file&&image.isConnected){if(!thumbnailURLs.has(item.key)){const url=URL.createObjectURL(file.blob);objectURLs.push(url);thumbnailURLs.set(item.key,url)}image.src=thumbnailURLs.get(item.key)}}).catch(()=>image.alt='图片暂时无法读取')}if(state.pinned.includes(item.artifactId||item.key))button.append(node('span','library-pinned-badge','置顶'));if(!item.presentationOnly)bindMenu(item,button);else{button.setAttribute('aria-label','文件：'+item.title);button.classList.add('library-title-sample')}if(item.artifactId&&kind==='files'){const wrapper=node('div','library-artifact-group');wrapper.append(button);grid.append(wrapper)}else grid.append(button)}content.append(grid);layoutImages();
  }
  function update(){const url=new URL(location.href);if(input.value.trim())url.searchParams.set('q',input.value.trim());else url.searchParams.delete('q');url.hash=kind;history.replaceState(null,'',url);render()}
  document.querySelector('form').onsubmit=e=>{e.preventDefault();input.blur();update()};input.oninput=update;clear.onclick=()=>{input.value='';update();input.focus()};
  for(const tab of tabs){tab.onclick=()=>{kind=tab.dataset.kind;update()};tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:tabs.find(t=>t!==tab);next.focus();kind=next.dataset.kind;update()}}}
  function syncState(){refreshOutputs();try{const saved=JSON.parse(localStorage.getItem(stateKey));if(saved&&Array.isArray(saved.pinned)&&Array.isArray(saved.deleted))state=saved;const scroll=content.scrollTop;render();content.scrollTop=scroll}catch{}}
  window.addEventListener('pageshow',event=>{if(event.persisted)syncState()});window.addEventListener('storage',event=>{if(event.key===stateKey||event.key===ChatConversations.storageKey)syncState()});
  function inScope(item){if(item.presentationOnly)return !window.DemoLocalData?.isCleared()&&(!recordMode||Boolean(currentSession&&conversationId==='initial-history-followup-versions-v1'));return references.has(item.key)&&(!recordMode||(currentSession&&references.get(item.key).some(ref=>ref.sessionId===conversationId)))&&!ArtifactVersions.isDeleted(item)}
  if(!['#images','#files'].includes(location.hash)){
    const available=samples.filter(inScope),hasImages=available.some(item=>!item.type||item.type.startsWith('image/')),hasFiles=available.some(item=>item.type&&!item.type.startsWith('image/'));
    if(!hasImages&&hasFiles)kind='files';
  }
  render();const requestedVersions=new URLSearchParams(location.search).get('versions');if(requestedVersions){const item=samples.find(f=>f.key===requestedVersions);if(item&&references.has(item.key)&&item.artifactId)showVersions(item)}const requested=new URLSearchParams(location.search).get('preview');if(requested){const item=samples.find(item=>item.key===requested);if(item&&!state.deleted.includes(item.key)&&references.has(item.key)&&(!recordMode||references.get(item.key)?.some(ref=>ref.sessionId===conversationId)))openPreview(item,false)}requestAnimationFrame(()=>{content.scrollTop=Number(sessionStorage.getItem('demo-materials-scroll:'+location.pathname+location.search+location.hash))||0});
})();
