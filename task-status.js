/* Browser-local demo jobs use wall-clock deadlines so navigation does not restart them. */
window.DemoTaskStatus = (() => {
  let live;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function question(message,chat) { return chat.session.messages.slice(0,chat.session.messages.indexOf(message)).findLast(item=>item.role==='user'); }
  // Resolve from the actual reply/context, so short follow-ups and references retain their subject.
  function profile(message,chat) {
    const reply=message.regeneration?.nextReply||message.reply||{},context=reply.context||{};
    const user=question(message,chat),text=user?.voice?.query||user?.text||'';
    const home=context.homeScenario||{},intent=context.journey?.stage||context.lastIntent||'';
    const subject=String(reply.title||'').replace(/·V\d+$/,'').slice(0,36);
    const result=(key,labels)=>({key,labels});
    if(user?.attachments?.length||intent==='attachment')return result('attachment',['正在确认已添加的附件...','正在整理附件说明...','正在组织回复...']);
    const file=reply.libraryFiles?.find(item=>item.document?.kind==='sales-analysis');
    const salesDocument=Boolean(file||reply.salesAnalysis||context.artifact&&/方程豹.*钛7/.test(reply.title||''));
    if(salesDocument){
      if(/未产生新版本|已经在文档中/.test(reply.title||''))return result('sales-document-check',['正在核对当前文档与补充要求...','正在比对已有分析内容...','正在整理核对结果...']);
      if(/标题|名称|命名/.test(text))return result('sales-document-edit',['正在确认销量文档的标题修改要求...','正在调整文档标题并保留正文...','正在整理新版本与来源信息...']);
      if(/按.*回答|根据.*回答|回答.*文档|补到文档|合并|整合/.test(text))return result('sales-document-edit',['正在确认引用的回答与文档版本...','正在整理需要补入文档的分析...','正在合并内容并核对重复信息...','正在整理新版本与历史记录...']);
      if(/解读|总结|结论|趋势|精简|压缩/.test(text))return result('sales-document-analysis',['正在理解销量分析要求...','正在对比月度销量与环比变化...','正在整理趋势解读与统计边界...','正在组织分析回复与文档版本...']);
      if(/环比|增量|增速/.test(text))return result('sales-document-analysis',['正在确认环比分析的统计口径...','正在整理各月零售销量...','正在计算环比增量与增速...','正在整理分析表格与文档版本...']);
      if(file?.version===1)return result('sales-document-create',['正在确认钛7的年份与零售统计口径...','正在整理2026年月度零售销量...','正在按月份组织销量表格...','正在整理首版分析文档...']);
      return result('sales-document-edit',['正在确认销量文档与修改要求...','正在调整对应的文档内容...','正在整理新版本并保留历史版本...']);
    }
    if(reply.artifactReply||context.artifact&&/文档|修改|补充|完善|版本/.test(text+subject))return result('document',[reply.artifactReply?(reply.libraryFiles?.[0]?.version===1?'正在整理文档内容...':'正在根据修改要求更新文档...'):'正在核对文档与修改要求...','正在整理文档版本信息...','正在组织文档回复...']);
    if(reply.kind==='clarify')return result('clarify',['正在理解问题与已有条件...','正在确认需要补充的信息...','正在整理确认问题...']);
    if(reply.unavailable||intent==='unavailable')return result('unavailable',['正在确认问题的回答范围...','正在整理可提供的帮助...','正在组织回复...']);
    if(/无权|权限|未授权/.test(subject))return result('permission',['正在确认资料的访问范围...','正在整理权限说明...','正在组织回复...']);
    if(home.key==='weather')return result('weather',['正在理解天气与出行问题...','正在整理已有天气说明与出行建议...','正在组织回答...']);
    if(home.key==='store')return result('store',/排名/.test(subject)?['正在确认门店与统计范围...','正在整理门店交付排名...','正在组织排名回答...']:['正在确认门店归属问题...','正在整理门店组织与区域信息...','正在组织归属说明...']);
    if(home.key==='orders')return result('orders',['正在确认订单统计范围...','正在整理订单、目标与缺口...','正在组织目标完成情况...']);
    if(home.key==='materials')return result('materials',['正在确认材料与申请要求...','正在整理所需材料和注意事项...','正在组织材料说明...']);
    if(home.key==='policy'||/knowledge|policy/.test(intent))return result('policy',['正在理解权益与适用条件...','正在整理相关权益与适用规则...','正在核对条件与注意事项...','正在组织回答...']);
    if(/objection|followup/.test(intent)||context.salesContext||context.followupExample)return result('customer',['正在理解客户情况与沟通需求...','正在整理顾虑与跟进要点...','正在组织沟通建议...']);
    const section=home.section||intent;
    if(section==='trend'||home.key==='brandTrend'||/近期交付表现|销量趋势/.test(subject))return result('trend',['正在理解销量趋势问题...','正在整理对应时段的销量数据...','正在对比月度变化与增长趋势...','正在汇总趋势分析要点...','正在组织图表与回答...']);
    if(/distribution|models/.test(section)||/主销车型|车型销量|车型交付|动力结构|配置差异/.test(subject))return result('models',['正在确认车型与比较范围...','正在整理车型数据与差异...','正在组织车型说明...']);
    if(/profile|tenure|hometown|personal/.test(section)||/人员资料|入职|籍贯|任职|门店信息/.test(subject))return result('profile',['正在确认所询问的人员...','正在整理对应的人员与任职资料...','正在组织资料说明...']);
    if(/target|progress|gap|conversion|average|growth|sales/.test(section)||/完成情况|转化率|平均|增长/.test(subject))return result('metrics',['正在确认统计对象与口径...','正在整理交付、目标及相关指标...','正在组织数据分析...']);
    if(/learning|checklist/.test(section)||/销售做法|试行清单|跟进清单/.test(subject))return result('learning',['正在理解复盘与跟进需求...','正在整理可参考的做法与步骤...','正在组织建议与清单...']);
    if(home.person||/rank|runnerup/.test(section)||/销冠|冠军|第一|第二名/.test(subject))return result('rank',['正在理解排名问题与统计范围...','正在整理对应月份的交付排名...','正在核对人物与交付信息...','正在组织排名回答...']);
    if(reply.libraryImages?.length||reply.libraryFiles?.length)return result('materials-result',['正在理解资料需求...','正在整理相关内容与产出资料...','正在组织回答与资料...']);
    // Other supported scenarios use their own answer topic instead of pretending to query a service.
    return result('topic',['正在理解'+(user?.reference?'引用内容与当前问题':'你的问题')+'...',subject?'正在整理“'+subject+'”相关内容...':'正在整理当前问题的相关内容...','正在组织回答...']);
  }
  function ensure(message,chat) {
    if(message.taskStatus?.version===3&&(message.taskStatus.profileRevision===2||message.demoScenario))return message.taskStatus;
    const selected=profile(message,chat),text=question(message,chat)?.text||'';
    const trend=/近\s*[6六]\s*个?月.*(?:销量|趋势)|近.*销量趋势/.test(text);
    const duration=message.voiceReply?0:selected.key.startsWith('sales-document')?3200:message.reply?.artifactReply?550:trend?50000:selected.key==='policy'?16000:selected.key==='rank'?12000:8500;
    const labels=message.regeneration?selected.labels.map((label,i)=>i===0?(selected.key.startsWith('sales-document')?label.replace(/^正在/,'正在重新'):'正在重新整理'+(selected.key==='document'?'文档修改要求':'当前问题与已有条件')+'...'):label):selected.labels;
    const t=message.taskStatus?.version===3?message.taskStatus:{version:3,startedAt:Date.now(),duration,unread:false};
    Object.assign(t,{profileRevision:2,category:selected.key,labels,at:labels.map((_,i)=>Math.round(t.duration*i/labels.length))});
    return message.taskStatus=t;
  }
  const definitions={
    timeout:{title:'门店目标统计超时',text:'该店本月目标完成情况未能在规定时间内汇总，本次查询已停止。请重新汇总。',delay:12000,label:'正在汇总门店本月目标...'},
    offline:{title:'网络连接已断开',text:'当前设备无法连接网络，本次回答已中断。已生成的内容会保留，请恢复网络后重试。',label:'正在连接服务...'},
    service:{title:'门店排名服务暂不可用',text:'销售排名服务暂时无法返回该店销售顾问的交付排名，本次查询未完成。请稍后重试。',delay:6500,label:'正在查询该店销售排名...'},
    empty:{title:'未收到区域归属说明',text:'门店档案查询已结束，但未返回可展示的区域归属详细说明。本次查询未完成，请重新查询。',delay:5500,label:'正在获取区域归属说明...'}
  };
  const scenarios=[
    {type:'timeout',text:'该店本月目标完成情况',query:'该店本月目标完成情况',labels:['正在确认当前门店...','正在汇总本月订单与目标...','正在等待目标统计结果...'],at:[0,1800,6500],retry:'正在重新汇总门店目标...'},
    {type:'service',text:'该店销售排名',query:'该店销售排名',labels:['正在确认门店排名范围...','正在查询销售顾问交付排名...'],at:[0,1800],retry:'正在重新查询门店排名...'},
    {type:'empty',text:'查看该店区域归属的详细说明',query:'查看该店区域归属的详细说明',labels:['正在定位门店组织档案...','正在获取区域归属详细说明...'],at:[0,1400],retry:'正在重新获取区域归属说明...'}
  ];
  function configure(message,chat){
    const preceding=chat.session.messages.slice(0,chat.session.messages.indexOf(message)),root=preceding.findLast(m=>m.role==='assistant'&&m.state==='complete'&&m.reply?.context?.homeScenario?.key==='store'&&m.reply.title==='当前门店的区域归属');
    if(!root)return;
    const text=String(question(message,chat)?.text||'').replace(/[\s，,。？?！!]/g,'');
    const scenario=scenarios.find(item=>item.text===text);if(!scenario)return;
    message.demoScenario={type:scenario.type,query:scenario.query,context:structuredClone(root.reply.context),retried:false,retry:scenario.retry};
    message.reply=DemoChat.reply(scenario.query,root.reply.context);message.reply.followups=[scenario.type==='timeout'?'该店销售排名':scenario.type==='service'?'查看该店区域归属的详细说明':'近6个月销量趋势'];
    delete message.modelRequest;
    Object.assign(message.taskStatus,{duration:definitions[scenario.type].delay,at:scenario.at,labels:scenario.labels});
  }
  function intercept(chat,message){const scenario=message.demoScenario;if(scenario&&!scenario.retried){fail(chat,message,scenario.type);return true;}return false;}
  function viewing(chat) {return live===chat&&!chat.suspended&&document.visibilityState==='visible'&&!document.querySelector('.ui-overlay:not([hidden])');}
  function render(message,chat) {
    if(message.state!=='pending')return '';
    const t=ensure(message,chat),elapsed=Date.now()-t.startedAt;
    const label=t.labels[t.at.reduce((last,at,i)=>elapsed>=at?i:last,0)];
    return `<div class="thinking-status" data-task-id="${escape(message.id)}" role="status" aria-live="polite" aria-atomic="true"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${label}</span></div>`;
  }
  function delay(message,chat) {const t=ensure(message,chat);return Math.max(0,t.startedAt+t.duration-Date.now());}
  function complete(chat,message) {if(message.taskStatus){message.taskStatus.unread=!viewing(chat);message.taskStatus.completedAt=Date.now();}}
  function reconcile(data) {
    let changed=false;
    for(const session of data.sessions){
      for(const message of session.messages){
        const t=message.taskStatus;if(t?.version!==3)continue;
        if(window.navigator?.onLine===false&&['pending','streaming'].includes(message.state)){setFailure(message,'offline');changed=true;continue;}
        const owned=live&&!live.suspended&&live.session.id===session.id;
        if(!owned&&!message.modelRequest&&['pending','streaming'].includes(message.state)&&Date.now()>=t.startedAt+t.duration){
          if(message.demoScenario&&!message.demoScenario.retried){setFailure(message,message.demoScenario.type);changed=true;continue;}
          if(message.regeneration){message.reply=message.regeneration.nextReply;delete message.regeneration;delete message.liked;delete message.disliked;delete message.feedback;delete message.feedbackDraft;}
          message.state='complete';delete message.progress;delete message.modelRequest;
          t.unread=true;t.completedAt=t.startedAt+t.duration;
          if(session.messages.at(-1)===message)session.context=message.reply.context;
          changed=true;
        }
        if(owned&&message.state==='complete'&&t.unread&&viewing(live)){
          t.unread=false;const actual=live.session.messages.find(item=>item.id===message.id);if(actual?.taskStatus)actual.taskStatus.unread=false;changed=true;
        }
      }
    }
    return changed;
  }
  function decorate(session,button) {
    const running=session.messages.some(m=>['pending','streaming'].includes(m.state));
    const unread=!running&&session.messages.some(m=>m.state==='complete'&&m.taskStatus?.unread);
    let badge=button.querySelector('.history-task-badge');
    const failed=['failed','interrupted'].includes(session.messages.at(-1)?.state);
    const state=running?'running':failed?'failed':unread?'unread':'';
    if(!state){badge?.remove();button.setAttribute('aria-label',session.title);return;}
    if(!badge){badge=document.createElement('span');badge.className='history-task-badge';button.append(badge);}
    if(badge.dataset.state!==state){badge.dataset.state=state;badge.className='history-task-badge '+(running?'history-task-running':failed?'history-task-failed':'history-task-unread');badge.innerHTML=running?'<i aria-hidden="true"></i><span>进行中</span>':failed?'未完成':'';badge.setAttribute('aria-hidden','true');}
    button.setAttribute('aria-label',session.title+(running?'，正在进行中':failed?'，回答未完成':'，有未读回答'));
  }
  function poll() {
    if(!window.ChatConversations)return;
    if(document.hidden)return;
    const sessions=ChatConversations.list();
    document.querySelectorAll('.history-recent[data-session-id],.history-main[data-session-id]').forEach(button=>{const session=sessions.find(s=>s.id===button.dataset.sessionId);if(session)decorate(session,button);});
  }
  function start(chat,message) {
    ensure(message,chat);clearInterval(chat.taskTimer);
    chat.taskTimer=setInterval(()=>{
      if(message.state!=='pending'||chat.suspended){clearInterval(chat.taskTimer);return;}
      if(window.navigator?.onLine===false){fail(chat,message,'offline');return;}
      const node=[...chat.host.querySelectorAll('[data-task-id]')].find(item=>item.dataset.taskId===message.id);
      const t=message.taskStatus,elapsed=Date.now()-t.startedAt;
      const label=t.labels[t.at.reduce((last,at,i)=>elapsed>=at?i:last,0)];
      if(node?.lastElementChild&&node.lastElementChild.textContent!==label)node.lastElementChild.textContent=label;
    },250);
  }
  function setFailure(message,type){message.state='failed';message.failure={type,...definitions[type]};delete message.modelRequest;if(message.taskStatus){message.taskStatus.unread=false;message.taskStatus.failedAt=Date.now();}}
  function fail(chat,message,type){if(!['pending','streaming'].includes(message.state))return;clearTimeout(chat.timer);clearInterval(chat.taskTimer);chat.modelRun?.controller.abort();chat.modelRun=null;setFailure(message,type);chat.persist();chat.render();chat.onBusy(false);}
  function renderFailure(message,chat){
    const f=message.failure||definitions.service;
    const type=f.type||'service';
    const severity='error';
    const symbol=type==='timeout'?'<path d="M12 7.5V12l3 1.5"/>':'<path d="M12 7.5v5M12 16v.01"/>';
    const icon=`<svg class="response-failure-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/>${symbol}</svg>`;
    const retryIcon='<svg class="response-retry-icon" width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13.5 6a5.5 5.5 0 1 0 0 4"/><path d="M13.5 2.5V6H10"/></svg>';
    const retryLabel=type==='timeout'?'重新汇总':type==='empty'?'重新查询':'重试';
    return `<div class="chat-response" data-message-id="${escape(message.id)}" data-generation-state="failed">${message.progress>0?chat.renderReply(message):''}<section class="response-failure" data-severity="${severity}" role="status"><div class="response-failure-heading">${icon}<p class="response-failure-title">${escape(f.title)}</p></div><div class="response-failure-content"><p class="response-failure-description">${escape(f.text)}</p><button type="button" data-task-retry="${escape(message.id)}">${retryIcon}<span>${retryLabel}</span></button></div></section></div>`;
  }


  function attach(chat){live=chat;chat.host.addEventListener('click',event=>{const button=event.target.closest('[data-task-retry]');if(!button||chat.busy)return;const message=chat.session.messages.find(m=>m.id===button.dataset.taskRetry);if(!message||message.state!=='failed')return;if(navigator.onLine===false){chat.onError('请恢复网络后重试');return;}delete message.failure;delete message.progress;delete message.taskStatus;message.state='pending';if(message.demoScenario)message.demoScenario.retried=true;ensure(message,chat);if(message.demoScenario){Object.assign(message.taskStatus,{duration:2600,at:[0,900,1900],labels:[message.demoScenario.retry,'正在整理查询结果...','正在组织回答...']});}else message.taskStatus.duration=0;chat.persist();chat.render();chat.finish(message);});}
  window.addEventListener('offline',()=>{const message=live?.session.messages.find(m=>['pending','streaming'].includes(m.state));if(message&&!live.suspended)fail(live,message,'offline');});
  setInterval(poll,500);
  return {render,start,ensure,delay,complete,reconcile,decorate,attach,fail,renderFailure,configure,intercept};
})();
