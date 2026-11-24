/* Versioned conversation outputs. Each completed revision keeps its own immutable snapshot. */
window.ArtifactVersions=(()=>{
  const seedSizes={"assets/conversation-materials/customer-followup-v1.pdf":67744,"assets/conversation-materials/customer-followup-v2.pdf":95881,"assets/conversation-materials/customer-followup-v3.pdf":108239};
  const formatTime=value=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
  const rows=[['需求确认','确认预算、通勤路线与补能条件'],['试驾反馈','记录满意点及待确认问题'],['方案沟通','发送对应配置、费用和权益说明'],['约定跟进','确认下次联系时间与具体待办']];
  function salesDocument(base,request){
    const values=[11693,14187,14201,15360,16820,17540,18760,20140,21580],doc=structuredClone(base||{kind:'sales-analysis',title:'方程豹钛7 2026年月度零售销量&环比分析（零售口径，市场常用上牌/零售数据）',intro:'统计范围：2026年2月至10月。环比增速=（本月销量−上月销量）÷上月销量×100%。',headers:['月份','零售销量（辆）'],rows:values.map((v,i)=>[(i+2)+'月',String(v)]),notes:[]});
    if(/环比|增量|增长率/.test(request)&&doc.headers.length<4){doc.headers.push('环比增量（辆）','环比增速');doc.rows.forEach((r,i)=>r.push(i?'+'+(values[i]-values[i-1]):'—',i?'+'+((values[i]-values[i-1])/values[i-1]*100).toFixed(1)+'%':'—'))}
    if(/解读|总结|分析/.test(request)&&doc.headers.length>=4&&!doc.headers.includes('简要解读')){doc.headers.push('简要解读');doc.rows.forEach((r,i)=>r.push(['春节月份，零售基数偏低','节后需求回暖，销量回升','与上月基本持平','到店与试驾转化提升','交付节奏改善','稳步增长','暑期需求延续','旺季需求释放','延续增长趋势'][i]))}
    if(/总结|结论|精简|压缩/.test(request))doc.summary='2月至10月销量整体上升；3月环比回升明显，4月趋稳，后续保持增长。应结合到店、试驾与交付节奏进一步分析。';
    if(/精简|压缩|简洁/.test(request))doc.summary='2月至10月销量总体上升，3月回暖明显、4月趋稳，后续持续增长。';
    return doc;
  }
  function documentFor(base,request){
    if(base?.kind==='sales-analysis'||/方程豹|钛7|月度零售/.test(request))return salesDocument(base,request);
    const doc=structuredClone(base||{title:'客户跟进清单',headers:['环节','跟进重点'],rows,notes:[]});
    const additions=[['负责人',()=> '陈宇'],['完成时间',i=>['当天10:00','当天12:00','当天17:00','次日10:00'][i]],['意向等级',i=>['A级','A级','B级','A级'][i]]];
    for(const [label,value]of additions){
      if(new RegExp('(?:删除|去掉|移除).*'+label).test(request)){const i=doc.headers.indexOf(label);if(i>=0){doc.headers.splice(i,1);doc.rows.forEach(row=>row.splice(i,1))}}
      else if(request.includes(label)&&!doc.headers.includes(label)){doc.headers.push(label);doc.rows.forEach((row,i)=>row.push(value(i)))}
    }
    if(/细化.*时间|时间.*细化/.test(request)&&doc.headers.includes('完成时间')){const column=doc.headers.indexOf('完成时间');doc.rows.forEach((row,i)=>row[column]=['11月20日10:00前','11月20日12:00前','11月20日17:00前','11月21日10:00前'][i])}
    const owner=request.match(/负责人(?:改成|改为|调整为|设为|为)([\u4e00-\u9fa5]{2,4})(?=$|[，。；、\s])/);if(owner&&doc.headers.includes('负责人'))doc.rows.forEach(row=>row[doc.headers.indexOf('负责人')]=owner[1]);
    if(request&&!/^(?:帮我|请)?整理一份客户跟进清单$/.test(request))doc.notes=[...doc.notes,'本次调整：'+request];
    return doc;
  }
  // Presentation is derived from each immutable document, never from another version.
  function salesPresentation(file){
    const doc=file.document,values=doc.rows.map(row=>Number(row[1])),total=values.reduce((sum,value)=>sum+value,0),first=values[0],last=values.at(-1),months=doc.rows.map(row=>row[0]);
    const rate=(current,previous)=>((current-previous)/previous*100).toFixed(1),hasChange=doc.headers.includes('环比增速'),hasSummary=doc.headers.includes('简要解读');
    if(!values.length||!values.every(Number.isFinite)||first<=0)return{};
    const sections=[{title:'整体趋势总结',paragraphs:[`统计区间累计零售${total}辆，月均${(total/values.length).toFixed(1)}辆。${months.at(-1)}为${last}辆，较${months[0]}增长${rate(last,first)}%。`],items:[]}];
    if(hasChange){
      const changes=values.slice(1).map((value,i)=>({month:months[i+1],value,previous:values[i],growth:(value-values[i])/values[i]*100})),peak=changes.reduce((a,b)=>a.growth>=b.growth?a:b);
      sections[0].items.push(`${peak.month}回升最明显：较上月增加${peak.value-peak.previous}辆，环比增长${peak.growth.toFixed(1)}%。`,`${months.at(-1)}最新完整月：零售${last}辆，较上月增加${last-values.at(-2)}辆，环比增长${rate(last,values.at(-2))}%。`);
    }
    if(hasSummary){
      sections[0].items.push('3月至4月：3月增长较快，4月基本持平，不能把单月高增速直接外推为全年趋势。','5月至10月：月度零售量连续增加，后续应结合订单转化与交付节奏判断增长能否延续。');
      sections.push({title:'如何理解这些变化',paragraphs:['先看销量规模，再看环比增速，最后核对变化原因。销量增加是结果，是否由促销、版本上新或供给改善带动，需要额外资料支持。'],items:['低基数影响：较低的上月销量会放大当月环比，需同时看增量。','增长原因：到店、试驾、订单和交付数据可辅助验证，不能只凭销量表下结论。']});
    }
    sections.push({title:'统计口径与注意事项',paragraphs:[],items:['统一口径：只比较同一零售口径的数据，不与批发量、订单量或其他口径直接混用。','时间范围：本次仅包含2026年2月至10月，缺少1月基数，2月环比记为“—”；11月尚未结束，12月不纳入。',...(hasSummary?['年份对比：2025年上市爬坡期与2026年销售阶段不同，需确认上市时间和完整月份后再比较。']:[])]});
    if(doc.sections?.length){const merged=mergeSections({sections},doc.sections);sections.splice(0,sections.length,...merged.sections)}
    return{salesReplyCopyVersion:1,...(hasSummary?{followups:['精简为三条结论','补充数据口径说明']}:{}),title:`方程豹钛7 2026年月度零售销量${hasChange?'与环比分析':''}`,paragraphs:[hasSummary?'已补充月度解读和整体趋势。下面按销量变化、可能原因与统计边界分别说明，完整内容保存在V'+file.version+'文档中。':hasChange?'在上一版销量表中补充环比增量和环比增速，便于同时观察增长规模与变化速度。':'先整理2026年2月至10月的月度零售销量，按月份顺序展示；后续可以继续补充环比和趋势分析。'],salesAnalysis:{scope:['统计范围：2026年2月至10月；单位：辆。','环比增速=（本月销量−上月销量）÷上月销量×100%。'],sections,closing:hasSummary?'已将这次分析保存为新版本，之前的版本仍可在文件的“历史版本”中查看。':'已保留这一版结果，可以继续补充分析，不覆盖当前文档。'}};
  }
  function replyFor(file){return{kind:'answer',homeReply:true,homeReplyVersion:2,artifactReply:true,title:file.title+'·V'+file.version,paragraphs:[file.version===1?'已整理月度零售销量，生成首版分析文档。':`已基于V${file.baseVersion}完成调整，生成V${file.version}，原版本继续保留。`],headers:file.document.headers,rows:file.document.rows,libraryFiles:[file],sources:[],followups:file.document.kind==='sales-analysis'?(file.version===1?['补充环比增量和环比增速']:['补充月度解读和总结']):(file.version===1?['增加负责人和完成时间']:['完善跟进要求']),context:{lastIntent:'artifact-edit',artifact:{id:file.artifactId,key:file.key,version:file.version}},...(file.document.kind==='sales-analysis'?salesPresentation(file):{})}}
  function fileFor(artifactId,version,document,createdAt,baseVersion){
    const file={key:artifactId+'-v'+version,artifactId,version,createdAt,baseVersion,title:document.title,name:document.title+'_V'+version+'.pdf',type:'application/pdf',document:structuredClone(document)};
    file.size=0;return file;
  }
  function seedSession(){
    const artifactId='demo-customer-followup',questions=['整理方程豹钛7 2026年月度零售销量','补充环比增量和环比增速','补充月度解读和总结'];let doc;
    const messages=questions.flatMap((text,i)=>{doc=documentFor(doc,text);const createdAt=`2026-11-23T10:${String(i*5).padStart(2,'0')}:00+08:00`,file=fileFor(artifactId,i+1,doc,createdAt,i||null,true);file.url=`assets/conversation-materials/customer-followup-v${i+1}.pdf`;file.size=0;return[{id:`artifact-demo-u${i+1}`,role:'user',text,createdAt},{id:`artifact-demo-a${i+1}`,role:'assistant',state:'complete',createdAt,reply:replyFor(file)}]});
    return{id:'initial-history-followup-versions-v1',title:questions[0],initialHistoryEntry:true,documentDemoTopic:3,updated:Date.now()-500,messages,context:messages.at(-1).reply.context};
  }
  function recoverHistory(data){
    const id='initial-history-followup-versions-v1';if(data.deletedIds?.includes(id))return{data,changed:false};
    const existing=data.sessions.find(session=>session.id===id),seed=seedSession();
    if(!existing)return{data:{...data,sessions:[...data.sessions,seed]},changed:true};
    if(!existing.initialHistoryEntry)return{data,changed:false};
    if(existing.documentDemoTopic!==3){const extra=existing.messages.filter(m=>!/^artifact-demo-[ua][123]$/.test(m.id));const next={...existing,title:seed.title,documentDemoTopic:3,messages:[...seed.messages,...extra],context:extra.at(-1)?.reply?.context||seed.context};return{data:{...data,sessions:data.sessions.map(s=>s.id===id?next:s)},changed:true}}
    if(!existing.messages.length)return{data:{...data,sessions:data.sessions.map(session=>session.id===id?{...seed,...existing,messages:seed.messages,context:seed.context}:session)},changed:true};
    let repaired;for(const source of seed.messages.filter(message=>message.role==='assistant')){
      const target=existing.messages.find(message=>message.id===source.id&&message.role==='assistant'&&message.state==='complete');
      if(target?.reply?.context?.artifact?.id!=='demo-customer-followup')continue;
      const expected=source.reply.libraryFiles[0],files=target.reply.libraryFiles||[];
      const snapshot=files.find(file=>file.key===expected.key&&file.artifactId===expected.artifactId&&file.version===expected.version&&file.type==='application/pdf'&&file.document?.headers?.length&&file.document?.rows?.length);
      if(snapshot?.document.kind==='sales-analysis'&&target.reply.salesReplyCopyVersion!==1){
        repaired??=structuredClone(existing);Object.assign(repaired.messages.find(message=>message.id===source.id).reply,salesPresentation(snapshot));
      }
      if(snapshot)continue;
      repaired??=structuredClone(existing);const message=repaired.messages.find(message=>message.id===source.id);message.reply.artifactReply=true;message.reply.libraryFiles=[...(message.reply.libraryFiles||[]).filter(file=>file.key!==expected.key),structuredClone(expected)];if(expected.document.kind==='sales-analysis')Object.assign(message.reply,salesPresentation(expected));
    }
    return repaired?{data:{...data,sessions:data.sessions.map(session=>session.id===id?repaired:session)},changed:true}:{data,changed:false};
  }
  const mergeReplyRequest=text=>/(回答|回复|分析|结论|上面|上述|刚才|前面|这些|这段|你说|建议|解读)/.test(text)&&/(补|完善|整合|合并|写|加|更新|纳入|放|填|整理|融合|同步)/.test(text);
  function replySections(reply){
    if(!reply||reply.unavailable||reply.kind==='clarify')return[];
    const sections=reply.salesAnalysis?.sections?.map(section=>structuredClone(section))||[];
    if(!sections.length){
      const paragraphs=(reply.paragraphs||[]).filter(text=>String(text).trim()&&!(reply.artifactReply&&/^已.*(?:整理|生成|基于|保存|完成调整)/.test(text)));
      if(reply.quote)paragraphs.push(reply.quote);
      if(reply.nextStep)paragraphs.push(reply.nextStep);
      for(const [value,label] of reply.metrics||[])paragraphs.push(label+'：'+value);
      if(paragraphs.length||reply.rows?.length)sections.push({title:reply.title||'补充说明',paragraphs,items:[],...(reply.rows?.length?{headers:structuredClone(reply.headers),rows:structuredClone(reply.rows)}:{})});
    }
    return sections;
  }
  function mergeSections(document,sections){
    const doc=structuredClone(document);doc.sections??=[];
    const same=(a,b)=>String(a).replace(/\s/g,'')===String(b).replace(/\s/g,'');
    for(const section of sections){
      const existing=doc.sections.find(item=>same(item.title,section.title));
      if(!existing){doc.sections.push(structuredClone(section));continue}
      for(const key of ['paragraphs','items']){existing[key]??=[];for(const text of section[key]||[])if(!existing[key].some(old=>same(old,text)))existing[key].push(text)}
      if(section.rows?.length&&!existing.rows?.length){existing.headers=structuredClone(section.headers);existing.rows=structuredClone(section.rows)}
    }
    return doc;
  }
  function editDocument(base,text){
    let doc=documentFor(base,text);
    const rename=text.match(/标题(?:改为|改成|调整为|设为)[：:\s]*[“「"]?(.+?)[”」"]?[。！!]*$/);
    if(rename)doc.title=rename[1].replace(/[”」"]$/,'').trim();
    else if(/标题/.test(text)&&/去掉|删除|移除/.test(text)){
      const quoted=text.match(/[“「"]([^”」"]+)[”」"]/);
      if(quoted)doc.title=doc.title.replace(quoted[1],'').trim();
      else if(/（|\(|括号|零售口径|市场常用/.test(text))doc.title=doc.title.replace(/[（(][^）)]*[）)]/g,'').trim();
    }
    const addition=text.match(/(?:补充|增加|加上|加|添加|写入|写)(?:一句|一段|说明|内容|备注)?[：:]\s*(.+)$/)||text.match(/(?:补充|增加|加上|加入|添加|加|写入|写)(?:一句|一段|说明|内容|备注)[：:\s“「"]*(.+?)[”」"]?$/);
    if(addition)doc=mergeSections(doc,[{title:'补充说明',paragraphs:[addition[1].trim()],items:[]}]);
    if(base.kind==='sales-analysis'&&/补充|增加|完善|优化|更新/.test(text)){
      const sections=salesPresentation({document:base,version:1}).salesAnalysis?.sections||[];
      const selected=/风险|注意|口径/.test(text)?sections.filter(s=>/注意/.test(s.title)):/完善|优化/.test(text)?sections:[];
      if(selected.length)doc=mergeSections(doc,selected);
    }
    return doc;
  }
  function resolve(text,context,session,reference){
    const files=session.messages.filter(m=>m.role==='assistant'&&m.state==='complete').flatMap(m=>m.reply?.libraryFiles||[]).filter(f=>f.artifactId&&f.document);
    const selected=context?.artifact,mergeRequested=mergeReplyRequest(text),editWords=/(?:增加|补充|补上|补全|加上|加入|加进|加一句|加一段|加个|添加|删除|删掉|去掉|移除|优化|调整|修改|改一下|改下|改成|改为|细化|精简|压缩|完善|重新生成|更新|写入)/.test(text),newDocument=/新建|另(?:外)?(?:一份|一个)|新的文档|重新创建/.test(text);
    const base=selected?(files.find(f=>selected.key&&f.key===selected.key)||files.find(f=>f.artifactId===selected.id&&f.version===selected.version)):!newDocument&&(mergeRequested||editWords)?files.at(-1):null;
    const initial=/方程豹.*(?:钛7|零售)|钛7.*(?:销量|分析)/.test(text)||/^(?:请|帮我|请帮我)?(?:整理|生成|制作)(?:一份|个)?(?:陈宇的)?客户(?:试驾)?跟进清单[。！!？?]*$/.test(text);
    const modify=base&&!newDocument&&(reference?.artifactEdit||mergeRequested||editWords);
    if(selected&&!base&&!newDocument)return{kind:'answer',homeReply:true,homeReplyVersion:2,title:'这个版本暂时不可用',paragraphs:['请重新选择要修改的文档版本，不会自动替换成其他版本。'],sources:[],followups:[],context};
    if(!initial&&!modify)return null;
    if(modify&&isDeleted(base))return{kind:'answer',homeReply:true,homeReplyVersion:2,title:'这个版本已删除',paragraphs:['请选择仍然可用的版本后继续修改。'],sources:[],followups:[],context};
    const artifactId=modify?base.artifactId:'followup-'+crypto.randomUUID();
    const stored=window.ChatConversations?.list?.()||[],issued=[...files,...stored.flatMap(s=>s.messages.filter(m=>m.role==='assistant'&&['complete','pending','streaming'].includes(m.state)).flatMap(m=>m.reply?.libraryFiles||[]))];
    const version=modify?Math.max(0,...issued.filter(f=>f.artifactId===artifactId&&Number.isInteger(f.version)).map(f=>f.version))+1:1;
    if(modify&&mergeRequested){
      const quoted=reference&&!reference.artifactEdit?reference.reply:null;
      const source=quoted||session.messages.findLast(message=>message.role==='assistant'&&message.state==='complete'&&!message.reply?.unavailable&&(message.reply?.context?.artifact?.id===base.artifactId||message.reply?.libraryFiles?.some(file=>file.artifactId===base.artifactId)))?.reply;
      const sections=replySections(source),unchanged=(title,paragraph)=>({kind:'answer',homeReply:true,homeReplyVersion:2,title,paragraphs:[paragraph],sources:[],followups:[],context:{...context,artifact:{id:base.artifactId,key:base.key,version:base.version}}});
      if(!sections.length)return unchanged('需要补充哪条回答？','请引用需要写入文档的回答后继续，我会将相关内容补充到新版本。');
      const document=mergeSections(base.document,sections);
      // Extend matching rows with missing columns without replacing the selected version's data.
      if(source.headers?.length&&source.rows?.length&&document.rows.every(row=>source.rows.some(other=>String(other[0])===String(row[0])&&String(other[1])===String(row[1])))){
        for(const [column,label] of source.headers.entries())if(!document.headers.includes(label)){
          document.headers.push(label);for(const row of document.rows)row.push(source.rows.find(other=>String(other[0])===String(row[0]))[column]);
        }
      }
      if(JSON.stringify(document)===JSON.stringify(base.document))return unchanged('这些内容已经在文档中',`相关分析已包含在V${base.version}中，无需重复补充，当前版本保持不变。`);
      const reply=replyFor(fileFor(artifactId,version,document,new Date().toISOString(),base.version));
      reply.paragraphs=[`已将相关回答中的${sections.map(section=>'“'+section.title+'”').join('、')}补充到文档正文，生成V${version}，原有版本继续保留。`];
      return reply;
    }
    const document=modify?editDocument(base.document,text):documentFor(null,text);
    if(modify&&JSON.stringify(document)===JSON.stringify(base.document)&&!/重新生成/.test(text))return{kind:'answer',homeReply:true,homeReplyVersion:2,title:'当前文档未产生新版本',paragraphs:['这次要求没有改变文档内容。请说明具体要修改的标题、字段，或用“补充：…”提供新增内容。'],sources:[],followups:[],context:{...context,artifact:{id:base.artifactId,key:base.key,version:base.version}}};
    return replyFor(fileFor(artifactId,version,document,new Date().toISOString(),modify?base.version:null));
  }
  function stamp(session){for(const message of session.messages){if(message.role!=='assistant'||!message.reply)continue;const time=message.createdAt||new Date(session.updated||Date.now()).toISOString();message.createdAt=time;
    for(const item of [...(message.reply.libraryFiles||[]),...(message.reply.libraryImage?[message.reply.libraryImage]:[])]){
      item.version??=1;item.createdAt??=time;
      if(item.key==='customer-followup'&&!item.artifactId){item.legacyKey=item.key;item.artifactId='customer-followup-'+session.id;item.key=item.artifactId+'-v1';item.document=documentFor(null,'');item.title='客户试驾跟进清单'}
      if(item.document&&item.artifactId){message.reply.artifactReply=true;message.reply.context={...message.reply.context,artifact:{id:item.artifactId,key:item.key,version:item.version}}}
    }
  }
    const last=session.messages.at(-1);if(last?.reply?.artifactReply)session.context={...session.context,artifact:last.reply.context.artifact};return session;
  }
  const stateKey=()=> 'demo-library-images-v1:'+DemoAccess.storageScope;
  function isDeleted(item){try{return JSON.parse(localStorage.getItem(stateKey())||'{}').deleted?.some(key=>key===item.key||key===item.legacyKey)||false}catch{return false}}
  // Render a portable PDF with the device's Chinese font; each revision is self-contained.
  async function blob(file){
    const doc=file.document,pages=[];let canvas,ctx,y;
    const nextPage=()=>{canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,595,842);ctx.fillStyle='#07b1c7';ctx.fillRect(0,0,595,8);y=56;pages.push(canvas)};nextPage();
    const line=(text,size=12,color='#202828')=>{let chunk='';const draw=()=>{if(y+size>790)nextPage();ctx.font=`${size}px Arial,"PingFang SC",sans-serif`;ctx.fillStyle=color;ctx.fillText(chunk,42,y);y+=size+13;chunk=''};for(const char of String(text)){ctx.font=`${size}px Arial,"PingFang SC",sans-serif`;if(ctx.measureText(chunk+char).width>510)draw();chunk+=char}draw()};
    line(doc.title,23);line(`V${file.version} · ${formatTime(file.createdAt)}${file.baseVersion?' · 基于V'+file.baseVersion+'修改':''}`,11,'#777');y+=14;
    if(doc.intro)line(doc.intro,12);
    doc.rows.forEach((row,i)=>{line(`${String(i+1).padStart(2,'0')} ${row[0]}`,15,'#009fb4');row.slice(1).forEach((value,j)=>line(doc.headers[j+1]+'：'+value));y+=12});
    if(doc.summary){line('简要总结',15);line(doc.summary)}
    for(const section of doc.sections||[]){line(section.title,15);for(const paragraph of section.paragraphs||[])line(paragraph);for(const item of section.items||[])line('• '+item);for(const row of section.rows||[])line(row.map((value,i)=>(section.headers?.[i]||'')+'：'+value).join('；'));y+=12}
    for(const note of doc.notes||[])line(note,11,'#777');
    const enc=new TextEncoder(),objects=[enc.encode('<< /Type /Catalog /Pages 2 0 R >>'),null],kids=[];
    const join=parts=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out};
    for(const image of pages){const page=objects.length+1,picture=page+1,content=page+2,jpeg=Uint8Array.from(atob(image.toDataURL('image/jpeg',.88).split(',')[1]),c=>c.charCodeAt(0)),commands='q 595 0 0 842 0 0 cm /I Do Q';kids.push(page+' 0 R');objects.push(enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /I ${picture} 0 R >> >> /Contents ${content} 0 R >>`),join([enc.encode(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,enc.encode('\nendstream')]),enc.encode(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`))}
    objects[1]=enc.encode(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`);const parts=[enc.encode('%PDF-1.4\n')],offsets=[0];let offset=parts[0].length;objects.forEach((obj,i)=>{offsets.push(offset);const part=join([enc.encode(`${i+1} 0 obj\n`),obj,enc.encode('\nendobj\n')]);parts.push(part);offset+=part.length});parts.push(enc.encode(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`));return new Blob(parts,{type:'application/pdf'});
  }
  return{formatTime,seedSession,recoverHistory,resolve,stamp,isDeleted,blob};
})();
