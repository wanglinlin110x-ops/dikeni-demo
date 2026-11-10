window.ChatConversations = (() => {
  const defaultScope = encodeURIComponent(JSON.stringify(['general_manager', ['hometown', 'joinedAt'], ['*']]));
  const key = window.DemoAccess?.storageScope === defaultScope ? 'dick-cowboy-conversations-v1' : `dick-cowboy-conversations-v1:${window.DemoAccess?.storageScope || 'guest'}`;
  const id = () => crypto.randomUUID();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Presentation only: wrap exact ranges without rewriting or trusting HTML in a reply.
  function emphasisMarkup(value, reply = {}, action = false) {
    const text = String(value ?? ''), ranges = [];
    const add = (start, end) => { if (end > start) ranges.push([start, end]); };
    const terms = [reply.profile?.name, reply.profile?.store, '王小迪', '李明轩', '陈思雨', '王浩',
      ...((reply.chart && !reply.chart.labels.every(label => /^\d+月$/.test(label))) ? reply.chart.labels : [])].filter(Boolean);
    for (const term of new Set(terms)) {
      let at = text.indexOf(term);
      while (at !== -1) { add(at, at + term.length); at = text.indexOf(term, at + term.length); }
    }
    for (const pattern of [/[+-]?\d+(?:,\d{3})*(?:\.\d+)?(?:%|辆|台|万元|元|条)/g,
      /稳步增长|持续增长|连续增长|创近[^，。；\n]{0,15}新高|领先第二名\d+辆/g]) {
      for (const match of text.matchAll(pattern)) add(match.index, match.index + match[0].length);
    }
    if (action) {
      const lead = text.match(/^[^，。；\n]{1,28}[，。；]/);
      if (lead) add(0, lead[0].length - 1);
    }
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const range of ranges) {
      const previous = merged.at(-1);
      if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
      else merged.push([...range]);
    }
    let offset = 0, markup = '';
    for (const [start, end] of merged) { markup += escape(text.slice(offset, start)) + '<strong>' + escape(text.slice(start, end)) + '</strong>'; offset = end; }
    return markup + escape(text.slice(offset));
  }
  function paragraphMarkup(paragraphs, reply) {
    const markup = [];
    let items = [];
    const flush = () => {
      if (items.length) { markup.push(`<ul class="chat-answer-list">${items.join('')}</ul>`); items = []; }
    };
    for (const paragraph of paragraphs) {
      const match = String(paragraph).match(/^\s*(?:\d+[.、．)]|[•●-])\s+([\s\S]+)$/);
      if (!match) { flush(); markup.push(`<p class="chat-paragraph">${emphasisMarkup(paragraph, reply)}</p>`); continue; }
      const text = match[1], split = text.search(/[：:，,。！？?]/);
      const boundary = split > 0 && split <= 36 ? split + (/[：:]/.test(text[split]) ? 1 : 0) : 0;
      const body = boundary ? `<strong>${escape(text.slice(0, boundary))}</strong>${emphasisMarkup(text.slice(boundary), reply, true)}` : emphasisMarkup(text, reply, true);
      items.push(`<li class="chat-paragraph">${body}</li>`);
    }
    flush(); return markup.join('');
  }
  const metricLabelMarkup = value => String(value).split(/(\d+日)/).map(part => /^\d+日$/.test(part) ? `<span class="metric-label-token">${escape(part)}</span>` : escape(part)).join('');
  const metricMarkup = value => {
    const percent = String(value).match(/^([+-]?)(\d+(?:\.\d+)?)(%)$/);
    if (!percent) return escape(value);
    return `${percent[1] ? `<span class="metric-symbol">${escape(percent[1])}</span>` : ''}<span class="metric-digits">${escape(percent[2])}</span><span class="metric-symbol">%</span>`;
  };
  function quoteAnswer(text,reference,context){
    if(reference&&/哪个.*(?:多|高)|哪种.*(?:多|高)|谁.*更多/.test(text)){
      const reply=reference.reply,chart=reply.chart;
      const pairs=chart&&chart.labels.length>1?chart.labels.map((label,i)=>[label,chart.values[i]]):(reply.metrics||[]).filter(([value,label])=>/^\d+$/.test(value)&&/交付.*辆/.test(label)).map(([value,label])=>[label.replace(/交付.*$/,''),Number(value)]);
      if(pairs.length>1&&pairs.every(pair=>Number.isFinite(pair[1]))){const sorted=[...pairs].sort((a,b)=>b[1]-a[1]);return{kind:'answer',homeReply:true,homeReplyVersion:2,title:'根据引用内容进行对比',paragraphs:[`${sorted[0][0]}更多，为${sorted[0][1]}辆，比${sorted[1][0]}多${sorted[0][1]-sorted[1][1]}辆。`],context:structuredClone(context),sources:[],followups:[]}}
    }
    return DemoChat.reply(text,context);
  }
  function initializeHistory(data){
    if(data.initialHistoryVersion===1||!window.ConversationMaterials?.initialSessions)return data;
    const comparable=text=>String(text||'').replace(/[\s？?，,。！!]/g,'');
    const entries=ConversationMaterials.initialSessions().filter(entry=>!(data.deletedIds||[]).includes(entry.id)&&!data.sessions.some(session=>session.id===entry.id||comparable(session.messages.find(message=>message.role==='user')?.text)===comparable(entry.title)));
    const next={...data,sessions:[...data.sessions,...entries],initialHistoryVersion:1};
    try{localStorage.setItem(key,JSON.stringify(next));return next}catch{return data}
  }
  function read() {
    try {
      let data = JSON.parse(localStorage.getItem(key));
      if (data?.version === 1 && Array.isArray(data.sessions)) {
        data.sessions = data.sessions.filter(s => typeof s.id === 'string' && Array.isArray(s.messages) && s.context && typeof s.context === 'object');
        if(!data.materialsFlowRepairVersion&&window.ConversationMaterials){
          const repair=ConversationMaterials.repairGeneratedSessions(data);
          if(repair.changed){try{
            const backupKey=key+'-before-materials-flow-repair-v1';
            if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify(data));
            repair.data.materialsFlowRepairVersion=1;localStorage.setItem(key,JSON.stringify(repair.data));data=repair.data;
          }catch{/* Keep all history if a backup cannot be saved. */}}
        }
        data=initializeHistory(data);
        data.sessions.forEach(session => {
          session.messages.forEach(message => {
            if (message.reply) message.reply = DemoChat.normalizeReply(message.reply);
            const feedback = message.feedbackDraft || message.feedback;
            message.disliked = !message.liked && Boolean(feedback?.reasons?.length || feedback?.comment?.trim());
          });
          // A migrated ranking may have a new winner; followups must use the displayed identity.
          const last = session.messages.at(-1);
          if (last?.state === 'complete' && last.reply?.context?.lastIntent === 'rank') session.context = { ...last.reply.context };
        });
        return data;
      }
    } catch { /* A missing or damaged cache starts a fresh session. */ }
    return initializeHistory({ version: 1, activeId: null, sessions: [] });
  }
  function write(data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { return false; }
  }
  function create(context = {}, requireSave = false) {
    const data = read(), session = { id: id(), title: '新对话', updated: Date.now(), messages: [], context };
    data.sessions.push(session); data.activeId = session.id; const saved = write(data); if (!saved && requireSave) throw new Error('conversation-storage'); return session;
  }
  function current() {
    const data = read(); return data.sessions.find(s => s.id === data.activeId) || create();
  }
  function save(session) {
    const data = read();
    if (data.deletedIds?.includes(session.id)) return true;
    const index = data.sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      const stored = data.sessions[index];
      session.pinned = Boolean(stored.pinned);
      if (stored.customTitle) { session.customTitle = stored.customTitle; session.title = stored.customTitle; }
      data.sessions[index] = session;
    } else data.sessions.push(session);
    data.activeId ||= session.id; return write(data);
  }
  class Conversation {
    static save(session) { return save(session); }
    static get storageKey() { return key; }
    static list() { return read().sessions.filter(s => s.messages.length).sort((a, b) => b.updated - a.updated); }
    static create(context, options = {}) { return create(context, options.requireSave); }
    static activate(sessionId) { const data = read(); if (data.sessions.some(s => s.id === sessionId)) { data.activeId = sessionId; write(data); } }
    static update(sessionId, patch) {
      const data = read(), session = data.sessions.find(item => item.id === sessionId);
      if (!session) return false;
      if (typeof patch.pinned === 'boolean') session.pinned = patch.pinned;
      if (typeof patch.title === 'string' && patch.title.trim()) session.title = session.customTitle = patch.title.trim().slice(0, 60);
      return write(data);
    }
    static remove(sessionId) {
      const data = read();
      data.sessions = data.sessions.filter(session => session.id !== sessionId);
      data.deletedIds = [...new Set([...(data.deletedIds || []), sessionId])];
      if (data.activeId === sessionId) data.activeId = data.sessions.filter(s => s.messages.length).sort((a, b) => b.updated - a.updated)[0]?.id || null;
      return write(data);
    }
    static branch(sessionId,messageId){
      const data=read(),source=data.sessions.find(session=>session.id===sessionId);
      const index=source?.messages.findIndex(message=>message.id===messageId)??-1;
      if(index<0||source.messages[index].role!=='assistant'||source.messages[index].state!=='complete')throw Error('branch-message');
      const rootSessionId=source.branch?.rootSessionId||source.id,baseTitle=source.branch?.baseTitle||source.title;
      const number=(data.branchCounts?.[rootSessionId]||data.sessions.filter(session=>session.branch?.rootSessionId===rootSessionId).length)+1;
      const messages=source.messages.slice(0,index+1).map(message=>{
        const copied={id:id(),role:message.role,origin:structuredClone(message.origin||{sessionId:source.id,messageId:message.id})};
        for(const key of ['text','reply','attachments','inputSource','resolved','reference'])if(message[key]!==undefined)copied[key]=structuredClone(message[key]);
        if(message.role==='assistant'){copied.state=message.state==='interrupted'?'interrupted':'complete';if(copied.state==='interrupted')copied.progress=message.progress||0}
        return copied;
      });
      const branchId=id(),mapping=new Map(source.messages.slice(0,index+1).map((message,i)=>[message.id,messages[i].id]));
      for(const message of messages)if(message.reference?.sessionId===source.id&&mapping.has(message.reference.messageId)){message.reference.sessionId=branchId;message.reference.messageId=mapping.get(message.reference.messageId)}
      const session={id:branchId,title:baseTitle+'（分支'+(number===1?'':number)+'）',updated:Date.now(),messages,context:structuredClone(messages.at(-1).reply.context||{}),branch:{sourceSessionId:source.id,sourceMessageId:messageId,sourceTitle:source.title,rootSessionId,baseTitle,cutMessageId:messages.at(-1).id}};
      data.sessions.push(session);data.activeId=session.id;data.branchCounts={...data.branchCounts,[rootSessionId]:number};
      if(!write(data))throw Error('branch-storage');
      return session;
    }
    static activeId() { return read().activeId; }
    constructor({ host, onBusy, onSources, onError, onFeedback }) {
      Object.assign(this, { host, onBusy, onSources, onError, onFeedback });
      this.session = current();
      this.queue = [];
      this.expandedSources = new Set();
      this.stickToBottom = true;
      this.scroller = host.closest('[data-name="Body"]');
      this.scroller?.addEventListener('wheel', event => { if (event.deltaY < 0) this.stickToBottom = false; }, { passive: true });
      this.scroller?.addEventListener('touchstart', event => { this.touchY = event.touches[0].clientY; }, { passive: true });
      this.scroller?.addEventListener('touchmove', event => { if (event.touches[0].clientY > this.touchY) this.stickToBottom = false; this.touchY = event.touches[0].clientY; }, { passive: true });
      this.scroller?.addEventListener('scroll', () => {
        this.stickToBottom = this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight < 100;
      });
      this.render();
      host.addEventListener('click', event => this.action(event));
      this.setupReplyTools();
      this.setupTurnNavigation();
      this.resumeGeneration();
      window.addEventListener('pagehide', () => { this.suspended = true; clearTimeout(this.timer); this.modelRun?.controller.abort(); if (this.busy) this.persist(); });
      window.addEventListener('pageshow', event => {
        if (event.persisted && this.suspended) { this.suspended = false; this.resumeGeneration(); }
      });
    }
    resumeGeneration() {
      clearTimeout(this.timer);
      const pending = this.session.messages.find(m => ['pending', 'streaming'].includes(m.state));
      if (!pending) { this.onBusy(false); return; }
      if (pending.state === 'streaming') { this.onBusy(true); this.stream(pending); }
      else this.finish(pending, 450);
    }
    get busy() { return this.session.messages.some(m => ['pending', 'streaming'].includes(m.state)); }
    openEvidence(message, trigger, full = false) {
      const reply = DemoChat.normalizeReply(message.reply);
      const citation = reply.citations?.find(item => item.id === trigger.dataset.evidenceId && item.docKey === trigger.dataset.documentKey);
      if (!citation) return this.onError('当前权限下无法查看这项依据');
      const document = window.SalesDialogue?.getEvidence(citation.id, full, citation.docKey);
      if (!document) return this.onError('当前权限下无法查看这项依据');
      if (!this.evidenceOverlay) {
        const overlay = window.document.createElement('div');
        overlay.className = 'ui-overlay knowledge-overlay'; overlay.hidden = true;
        overlay.innerHTML = '<button class="overlay-backdrop" data-evidence-action="close" aria-label="关闭原文依据遮罩"></button><aside class="source-sheet knowledge-sheet" role="dialog" aria-modal="true" aria-labelledby="knowledge-evidence-title" tabindex="-1"><i class="source-handle" aria-hidden="true"></i><header class="source-header"><h2 id="knowledge-evidence-title">原文依据</h2><button class="source-close" data-evidence-action="close" aria-label="关闭原文依据">×</button></header><div class="source-scroll knowledge-document"></div></aside>';
        this.host.closest('.design-screen').append(overlay);
        overlay.addEventListener('click', event => {
          const action = event.target.closest('[data-evidence-action]')?.dataset.evidenceAction;
          if (action === 'close') this.closeEvidence();
          if (action === 'full') this.openEvidence(this.evidenceMessage, this.evidenceTrigger, true);
        });
        window.document.addEventListener('keydown', event => {
          if (overlay.hidden) return;
          if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.closeEvidence(); }
          if (event.key === 'Tab') {
            const controls = [...overlay.querySelectorAll('button')].filter(node => node.getClientRects().length);
            const first = controls[1], last = controls.at(-1), focused = window.document.activeElement;
            if (event.shiftKey && (focused === first || focused === overlay.querySelector('aside'))) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && focused === last) { event.preventDefault(); first?.focus(); }
          }
        }, true);
        window.document.addEventListener('demo-back', event => {
          if (!overlay.hidden) { event.preventDefault(); this.closeEvidence(); }
        });
        this.evidenceOverlay = overlay;
      }
      const overlay = this.evidenceOverlay;
      this.evidenceMessage = message; this.evidenceTrigger = trigger;
      this.evidenceScrollTop ??= this.scroller?.scrollTop;
      if (overlay.hidden) {
        this.evidenceInert = [...new Set([...overlay.parentElement.children, ...window.document.querySelectorAll('.demo-nav,.nav-toggle')])].filter(node => node !== overlay).map(node => [node, node.inert]);
        this.evidenceInert.forEach(([node]) => { node.inert = true; });
      }
      overlay.querySelector('#knowledge-evidence-title').textContent = full ? '完整知识资料' : '原文依据';
      const body = overlay.querySelector('.knowledge-document');
      body.innerHTML = `<h3>${escape(document.title)}</h3><p class="knowledge-tag">${escape(document.id)}</p><dl class="knowledge-metadata">${[['版本', document.version], ['审核状态', document.status], ['有效期', `${document.starts}—${document.ends}`], ['适用范围', document.scope], ['资料来源', document.origin]].map(([key,value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>${document.parts.map(part => `<section class="knowledge-part${part.id === document.selected ? ' knowledge-part-selected' : ''}" data-section="${escape(part.id)}"><h4>${escape(part.title)}</h4><blockquote>${escape(part.text)}</blockquote></section>`).join('')}${full ? '' : '<button class="knowledge-full" data-evidence-action="full">查看完整资料</button>'}`;
      overlay.hidden = false;
      const selected = body.querySelector('.knowledge-part-selected');
      body.scrollTop = full && selected ? Math.max(0, selected.offsetTop - body.offsetTop - 16) : 0;
      if (!full) overlay.querySelector('aside').focus({ preventScroll: true });
      this.stickToBottom = false;
    }
    closeEvidence() {
      if (!this.evidenceOverlay || this.evidenceOverlay.hidden) return;
      this.evidenceOverlay.hidden = true;
      this.evidenceInert?.forEach(([node, inert]) => { node.inert = inert; });
      if (this.scroller && this.evidenceScrollTop !== undefined) this.scroller.scrollTop = this.evidenceScrollTop;
      this.evidenceScrollTop = undefined;
      if (this.evidenceTrigger?.isConnected) this.evidenceTrigger.focus({ preventScroll: true });
    }
    persist() { const saved = save(this.session); if (!saved) this.onError('浏览器存储不可用或空间不足，内容未能保存'); return saved; }
    enqueue(text) { if (this.busy) this.queue.push(text); else this.submit(text); }
    submit(text, attachments = [], options = {}) {
      text = text.trim();
      if ((!text && !attachments.length) || this.busy) return false;
      const previous = structuredClone(this.session);
      const voice = options.source === 'voice' ? window.VoiceUnderstanding?.understand(text, this.quoteDraft?.context||this.session.context) : null;
      const reference=this.quoteDraft?structuredClone(this.quoteDraft):null;
      const responseContext=reference?.context||this.session.context;
      const response = attachments.length ? {
        kind: 'answer', title: '附件已收到', paragraphs: [`已添加${attachments.length}个附件。`, '当前暂不支持自动解读附件内容；你可以把需要处理的文字粘贴到输入框中继续提问。'],
        context: { ...this.session.context, pending: null, journey: null, lastIntent: 'attachment' }, sources: [], followups: [],
      } : quoteAnswer(voice?.query || text,reference,responseContext);
      this.session.messages.forEach(message => { if (message.reply?.kind === 'clarify') message.resolved = true; });
      this.session.messages.push({ id: id(), role: 'user', text, ...(reference?{reference}:{}), ...(voice ? { inputSource: 'voice', voice } : {}), ...(attachments.length ? { attachments } : {}) });
      const directVoice = window.VoiceUnderstanding?.canAnswerDirectly(voice, response);
      const message = { id: id(), role: 'assistant', reply: response, state: 'pending', ...(voice ? { voiceReply: true } : {}),
        ...(!attachments.length && !response.homeReply && !directVoice && window.DemoUnderstanding?.enabled ? { modelRequest: { text, context: responseContext, ...(reference?{reference}:{} ) } } : {}) };
      this.session.messages.push(message);
      this.session.context = response.context;
      if (this.session.title === '新对话') this.session.title = (text || attachments[0]?.name || '附件消息').slice(0, 26);
      this.session.updated = Date.now();
      this.stickToBottom = true;
      if (!this.persist()) { this.session = previous; return false; }
      this.setQuote(null);this.render(); this.finish(message); return true;
    }
    finish(message, delay = message.voiceReply ? 0 : 550 + Math.random() * 300) {
      this.onBusy(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(async () => {
        if (message.modelRequest && window.DemoUnderstanding?.enabled) {
          const run = { controller: new AbortController(), message };
          this.modelRun = run;
          const timeout = setTimeout(() => { run.timedOut = true; run.controller.abort(); }, 20000);
          try {
            const request = message.modelRequest;
            const result = await DemoUnderstanding.resolve(request.text, request.context, run.controller.signal);
            if (this.modelRun !== run || this.suspended || message.state !== 'pending') return;
            const interpreted = DemoUnderstanding.reply(result, request.context);
            if (message.regeneration) message.regeneration.nextReply = interpreted; else message.reply = interpreted;
            const index = this.session.messages.indexOf(message);
            const question = this.session.messages.slice(0, index).findLast(item => item.role === 'user');
            if (question) question.dialogueUnderstanding = result;
            this.session.context = interpreted.context;
            delete message.modelRequest;
          } catch {
            if (this.modelRun !== run || this.suspended || message.state !== 'pending' || run.controller.signal.aborted && !run.timedOut) return;
            delete message.modelRequest;
            this.onError('本地模型暂未响应，已使用原有演示规则处理');
          } finally {
            clearTimeout(timeout);
            if (this.modelRun === run) this.modelRun = null;
          }
        }
        if (message.regeneration) message.reply = message.regeneration.nextReply;
        message.state = 'streaming'; message.progress = 0;
        this.persist(); this.render(); this.stream(message);
      }, delay);
    }
    scrollToLatest() {
      if (!this.stickToBottom || !this.scroller) return;
      requestAnimationFrame(() => {
        if (this.stickToBottom) this.scroller.scrollTop = this.scroller.scrollHeight;
      });
    }
    prepare(message) {
      const node = this.host.querySelector(`[data-message-id="${message.id}"]`);
      const content = node?.querySelector('article, fieldset');
      if (!content) return [];
      const elements = [...content.children].flatMap(element => element.matches('.chat-answer-list') ? [...element.children] : [element]);
      const blocks = elements.map(element => {
        const text = /^(H2|P|LEGEND|LI)$/.test(element.tagName) ? element.textContent : null;
        const parts = [];
        if (text !== null) {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode, characters = Array.from(node.data);
            parts.push({ node, characters }); node.data = '';
          }
        }
        element.hidden = true;
        return { element, text, parts, units: text === null ? 1 : Math.max(1, Array.from(text).length) };
      });
      node.querySelectorAll('button').forEach(button => { button.disabled = true; });
      this.applyProgress(blocks, message.progress || 0, message.state === 'streaming');
      if (message.state === 'interrupted') {
        const stopped = document.createElement('p');
        stopped.className = 'generation-stopped'; stopped.textContent = '已停止生成';
        node.append(stopped);
        if (!message.progress) node.querySelector('article, form').hidden = true;
      }
      return blocks;
    }
    applyProgress(blocks, progress, cursor) {
      this.cursor?.remove();
      let remaining = progress, lastText;
      for (const block of blocks) {
        const visible = Math.min(block.units, Math.max(0, remaining));
        const wasHidden = block.element.hidden;
        block.element.hidden = visible === 0;
        if (block.text !== null) {
          let characters = visible;
          for (const part of block.parts) {
            part.node.data = part.characters.slice(0, Math.max(0, characters)).join('');
            characters -= part.characters.length;
          }
          if (visible > 0) lastText = block.element;
        } else if (visible && wasHidden && cursor) block.element.classList.add('stream-reveal');
        if(block.element.matches('.chat-answer-actions'))block.element.hidden=true;
        remaining -= block.units;
      }
      const lists = new Set(blocks.map(block => block.element.closest('.chat-answer-list')).filter(Boolean));
      lists.forEach(list => { list.hidden = [...list.children].every(item => item.hidden); });
      if (cursor && lastText) {
        this.cursor = document.createElement('span');
        this.cursor.className = 'streaming-cursor'; this.cursor.setAttribute('aria-hidden', 'true');
        lastText.append(this.cursor);
      }
    }
    stream(message) {
      const blocks = this.plans.get(message.id) || this.prepare(message);
      const total = blocks.reduce((sum, block) => sum + block.units, 0);
      const tick = () => {
        if (message.state !== 'streaming') return;
        let offset = 0;
        const currentBlock = blocks.find(block => { offset += block.units; return offset > (message.progress || 0); });
        if (!currentBlock) {
          message.state = 'complete'; delete message.progress;
          if (message.regeneration) {
            delete message.regeneration;
            delete message.liked; delete message.disliked; delete message.feedback; delete message.feedbackDraft;
            if (this.session.messages.at(-1) === message) this.session.context = message.reply.context;
          }
          this.persist(); this.render(); this.onBusy(false);
          if (this.queue.length) this.submit(this.queue.shift());
          return;
        }
        const blockRemaining = offset - (message.progress || 0);
        let chunk = currentBlock.text === null ? 1 : Math.min((message.voiceReply ? 8 : 3) + Math.floor(Math.random() * 3), blockRemaining);
        if (currentBlock.text !== null) {
          const upcoming = Array.from(currentBlock.text).slice(currentBlock.units - blockRemaining, currentBlock.units - blockRemaining + chunk);
          const punctuation = upcoming.findIndex(char => /[。！？；，、：]/.test(char));
          if (punctuation >= 0) chunk = punctuation + 1;
        }
        message.progress = Math.min(total, (message.progress || 0) + chunk);
        this.applyProgress(blocks, message.progress, true);
        this.scrollToLatest();
        if (!this.lastSavedAt || performance.now() - this.lastSavedAt > 250) { this.persist(); this.lastSavedAt = performance.now(); }
        const shown = currentBlock.text === null ? '' : Array.from(currentBlock.text).slice(0, currentBlock.units - (offset - message.progress)).join('');
        const boundary = message.progress === offset;
        const pause = currentBlock.text === null ? 220 + Math.random() * 110
          : boundary ? 280 + Math.random() * 150
          : /[。！？；]$/.test(shown) ? 160 + Math.random() * 90
          : /[，、：]$/.test(shown) ? 110 + Math.random() * 50 : (message.voiceReply ? 40 : 80) + Math.random() * 35;
        this.timer = setTimeout(tick, pause);
      };
      tick();
    }
    stop() {
      const message = this.session.messages.find(m => ['pending', 'streaming'].includes(m.state));
      if (!message) return;
      clearTimeout(this.timer);
      this.modelRun?.controller.abort(); this.modelRun = null;
      if (message.modelRequest && !message.regeneration) {
        delete message.modelRequest;
        const previousContext = this.session.messages.slice(0, this.session.messages.indexOf(message)).findLast(item => item.role === 'assistant')?.reply.context || {};
        message.reply = { kind: 'answer', title: '已停止处理', paragraphs: [], context: { ...previousContext, lastIntent: 'interrupted' }, sources: [], followups: [] };
        this.session.context = previousContext;
      }
      if (message.regeneration) {
        const original = message.regeneration.original;
        delete message.regeneration; Object.assign(message, original);
        if (original.progress === undefined) delete message.progress;
      } else { message.state = 'interrupted'; message.progress ||= 0; }
      this.persist(); this.render(); this.onBusy(false);
    }
    render() {
      const anchor = !this.stickToBottom && this.scroller ? [...this.host.querySelectorAll('[data-message-id]')].find(node => node.getBoundingClientRect().bottom > this.scroller.getBoundingClientRect().top) : null;
      const anchorId = anchor?.dataset.messageId, anchorTop = anchor?.getBoundingClientRect().top;
      const last = this.session.messages.at(-1);
      this.host.innerHTML = this.session.messages.length ? this.session.messages.map(message => {
        if (message.role === 'user') return `<div class="chat-user" data-input-source="${message.inputSource === 'voice' ? 'voice' : 'text'}" data-message-id="${escape(message.id)}">${message.attachments?.length ? `<div class="chat-user-attachments">${message.attachments.map(file => `<button type="button" data-chat-action="attachment" data-attachment-id="${escape(file.id)}" aria-label="下载附件：${escape(file.name)}">${file.type?.startsWith('image/') ? `<img data-attachment-id="${escape(file.id)}" alt="${escape(file.name)}">` : '<img src="assets/attachment-file.svg" alt="">'}<span>${escape(file.name)}</span></button>`).join('')}</div>` : ''}${message.reference?`<button type="button" class="chat-message-reference" data-chat-action="quote-source" aria-label="查看引用的回复"><span>${escape(message.reference.title)}</span><small>${escape(message.reference.text)}</small></button>`:''}${message.text ? `<p>${escape(message.text)}</p>` : ''}</div>`;
        if (message.state === 'pending') return `${message.regeneration ? `<div class="chat-response" data-message-id="${escape(message.id)}">${this.renderReply(message)}</div>` : ''}<div class="thinking-status" role="status"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>正在思考...</span></div>`;
        return `<div class="chat-response" data-message-id="${escape(message.id)}" data-generation-state="${escape(message.state)}">${this.renderReply(message)}${last === message && message.state === 'complete' && !message.reply.unavailable && message.reply.followups?.length ? `<section class="followup-section"><h2>推荐追问</h2><div class="followup-options">${message.reply.followups.map(text => `<button data-chat-action="followup">${escape(text)}</button>`).join('')}</div></section>` : ''}</div>`;
      }).join('') : '<p class="chat-empty">开始一段新对话。你可以查询销量、对比车型，或整理客户跟进。</p>';
      if(this.session.branch){
        const target=this.host.querySelector(`[data-message-id="${this.session.branch.cutMessageId}"]`);
        if(target){
          const branch=this.session.branch,source=Conversation.list().find(session=>session.id===branch.sourceSessionId),title=source?.title||branch.sourceTitle||branch.baseTitle||'原对话';
          const href='conversation.html?session='+encodeURIComponent(branch.sourceSessionId)+'#message-'+encodeURIComponent(branch.sourceMessageId);
          const notice=document.createElement('div');notice.className='chat-branch-notice';notice.innerHTML=`<div class="chat-branch-divider"><span class="chat-branch-label"><span>分支来自：</span><a data-chat-action="branch-source" href="${escape(href)}" title="${escape(title)}">${escape(title)}</a></span></div>`;target.after(notice);
        }
      }
      const heading=document.querySelector('.s52');if(heading)heading.textContent='迪客牛仔';
      window.AttachmentStorage?.hydrate(this.host);
      this.host.setAttribute('aria-busy', String(this.busy));
      this.plans = new Map();
      this.session.messages.filter(message => ['streaming', 'interrupted'].includes(message.state)).forEach(message => {
        this.plans.set(message.id, this.prepare(message));
      });
      if (anchorId) {
        const replacement = this.host.querySelector(`[data-message-id="${anchorId}"]`);
        if (replacement) this.scroller.scrollTop += (replacement.getBoundingClientRect().top - anchorTop) / (parseFloat(getComputedStyle(document.querySelector('.design-screen')).zoom) || 1);
      }
      this.scrollToLatest();
      this.turnEntries=null;
      this.syncTurnNavigation?.();
    }
    renderChart(message) {
      const { chart } = message.reply;
      const label = escape(chart.labels.map((text, i) => text + ' ' + chart.values[i] + '辆').join('，'));
      if (chart.type === 'horizontal' || !chart.labels.every(text => /^\d+月$/.test(text))) {
        const horizontal = chart.type === 'horizontal';
        const max = Math.max(1, ...chart.values);
        return `<section class="chat-chart chat-horizontal${horizontal ? '' : ' chat-bar'}">${horizontal ? `<h3>${escape(chart.title || '车型交付分布')}</h3>` : ''}<div class="${horizontal ? 'chat-horizontal-rows' : 'chat-bars'}" role="img" aria-label="${label}">${chart.values.map((value, i) => `<div class="chat-horizontal-row${horizontal ? '' : ' chat-chart-column'}${i === chart.highlight ? ' is-highlight' : ''}"><span>${escape(chart.labels[i])}</span><div class="chat-horizontal-track"><i style="width:${value / max * 70}%"></i></div><strong>${escape(value)}辆${horizontal && chart.total ? `<small>${(value / chart.total * 100).toFixed(1)}%</small>` : ''}</strong></div>`).join('')}</div></section>`;
      }
      const max = Math.max(1, ...chart.values), rawStep = max / 4;
      const magnitude = 10 ** Math.floor(Math.log10(rawStep));
      const step = [1, 2, 5, 10].find(value => value >= rawStep / magnitude) * magnitude, ceiling = step * 4;
      const plotTop = 33.61, plotBottom = 525.61;
      const points = chart.values.map((value, i) => [43 + i * 595 / Math.max(1, chart.values.length - 1), plotBottom - value / ceiling * 492]);
      const curve = points.map(([x, y], i) => {
        if (!i) return `M ${x} ${y}`;
        const [previousX, previousY] = points[i - 1], middleX = (previousX + x) / 2;
        return `C ${middleX} ${previousY} ${middleX} ${y} ${x} ${y}`;
      }).join(' ');
      const last = points.at(-1);
      return `<section class="chat-chart chat-trend"><h3>${escape(chart.title || `近${chart.labels.length}个月销量趋势`)}</h3><svg viewBox="0 0 651 600" role="img" aria-label="${label}">
        <image class="trend-grid" href="assets/reply-trend-grid.svg" x="43" y="32.91" width="595" height="493.4"/>
        ${Array.from({ length: 5 }, (_, i) => `<text class="trend-y-label" x="36" y="${plotTop + i * 123}" text-anchor="end" dominant-baseline="middle">${(ceiling - step * i).toFixed(0)}</text>`).join('')}
        <path class="trend-curve" d="${curve}" fill="none" stroke="#07b1c7" stroke-width="2.4"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="8" fill="#07b1c7"/>
        ${chart.labels.map((text, i) => `<text class="trend-x-label" x="${43 + i * 595 / Math.max(1, chart.labels.length - 1)}" y="547.61" text-anchor="${i === 0 ? 'start' : i === chart.labels.length - 1 ? 'end' : 'middle'}" dominant-baseline="middle">${escape(text)}</text>`).join('')}
      </svg></section>`;
    }
    renderReply(message) {
      const r = DemoChat.normalizeReply(message.reply);
      if (r.kind === 'clarify') return `<form class="clarification-card" data-clarification="${escape(message.id)}">
        <fieldset ${message.resolved ? 'disabled' : ''}><legend>${escape(r.question)}</legend><p class="clarification-hint">${escape(r.multiple ? '请选择两款车型，选满后自动发送；也可以直接输入需要对比的车型。' : r.hint)}</p>
        <div class="clarification-options">${r.options.map(text => `<button type="button" data-chat-action="select" aria-pressed="false">${escape(text)}</button>`).join('')}</div>
        ${message.resolved ? '<p class="clarification-resolved">已补充 / 已继续对话</p>' : ''}</fieldset></form>`;
      return `<article tabindex="0" class="chat-answer${r.context?.homeScenario?.key==='hanChampion'?' chat-answer-han':''}${r.unavailable ? ' chat-answer-unavailable' : ''}${r.profile ? ' chat-answer-champion' : ''}${r.chart?.labels.every(text => /^\d+月$/.test(text)) ? ' chat-answer-trend' : ''}" data-name="Article">
        ${r.profile ? `<header class="chat-champion-profile">${r.profile.avatar ? `<img class="chat-champion-avatar" src="${escape(r.profile.avatar)}" alt="${escape(r.profile.name)}头像">` : `<span class="chat-champion-avatar chat-avatar-initial avatar-tone-${Number.isInteger(r.profile.avatarTone) && r.profile.avatarTone >= 0 && r.profile.avatarTone < 6 ? r.profile.avatarTone : 0}" aria-hidden="true">${escape((r.profile.name || '访').slice(0, 1))}</span>`}<div class="chat-profile-info"><div class="chat-profile-heading"><h2>${escape(r.profile.name)}</h2><span class="chat-profile-badge"><img src="assets/conversation-d3bb4.svg" alt="">${escape(r.profile.badge)}</span></div><p class="chat-profile-store">${escape(r.profile.store)}</p>${r.profile.role && r.profile.role !== '销售顾问' ? `<p class="chat-person-role">${escape(r.profile.role)}${r.profile.tenure ? ` · 入职约${escape(r.profile.tenure)}` : ''}</p>` : ''}</div></header>` : `<h2>${escape(r.title)}</h2>`}
        ${paragraphMarkup(r.paragraphs, r)}

        ${r.unavailable && message === this.session.messages.at(-1) ? `<div class="followup-options unavailable-options" aria-label="可以尝试的问题">${r.followups.map(text => `<button data-chat-action="followup">${escape(text)}</button>`).join('')}</div>` : ''}
        ${r.contextLabel ? `<p class="chat-answer-note">${escape(r.contextLabel)}</p>` : ''}
        ${r.rationale ? `<p class="chat-answer-note">${escape(r.rationale)}</p>` : ''}
        ${r.quote ? `<section class="chat-script">${r.quoteLabel ? `<h3>${escape(r.quoteLabel)}</h3>` : ''}<blockquote>${emphasisMarkup(r.quote, r, true)}</blockquote><button class="chat-copy-script" data-chat-action="copy-script"><img src="assets/96cd7.svg" alt="">复制话术</button></section>` : ''}
        ${r.citations?.length ? `<div class="chat-citations">${r.citations.map(citation => `<button class="chat-citation" data-chat-action="citation" data-evidence-id="${escape(citation.id)}" data-document-key="${escape(citation.docKey)}"><img src="assets/cff1a.svg" alt=""><span>[${escape(citation.number)}] ${escape(citation.label)}</span><span aria-hidden="true">›</span></button>`).join('')}</div>` : ''}
        ${r.afterCitation ? `<p class="chat-paragraph">${emphasisMarkup(r.afterCitation, r)}</p>` : ''}
        ${r.quoteNote ? `<p class="chat-answer-note">${escape(r.quoteNote)}</p>` : ''}
        ${r.nextStep ? `<section class="chat-next-step"><h3>下一步</h3><p class="chat-paragraph">${emphasisMarkup(r.nextStep, r, true)}</p></section>` : ''}
        ${r.notice ? `<p class="chat-answer-note">${escape(r.notice)}</p>` : ''}
        ${r.profile?.fields?.length ? `<dl class="chat-person-facts">${r.profile.fields.map(field => `<div><dt>${escape(field.label)}</dt><dd>${escape(field.value)}</dd></div>`).join('')}</dl>` : ''}
        ${r.progressCard ? `<section class="chat-target-progress" aria-label="${escape(r.progressCard.label)}"><div><strong>${escape((r.progressCard.value / r.progressCard.target * 100).toFixed(1))}%</strong><span>${escape(r.progressCard.label)}</span></div><progress max="${escape(r.progressCard.target)}" value="${escape(Math.min(r.progressCard.value,r.progressCard.target))}">${escape(r.progressCard.value)} / ${escape(r.progressCard.target)}</progress><p>目标 ${escape(r.progressCard.target)} · 已完成 ${escape(r.progressCard.value)} · ${r.progressCard.value >= r.progressCard.target ? '超出' : '缺口'} ${escape(Math.abs(r.progressCard.target-r.progressCard.value))}</p></section>` : ''}
        ${r.metrics?.length ? `<div class="chat-metrics">${r.metrics.map(([value, label]) => `<div data-metric-kind="${/环比|增长|差值/.test(label) ? 'change' : 'value'}"><strong${/^[+-]?\d+(?:\.\d+)?%$/.test(String(value)) ? ' class="metric-percentage"' : ''}>${metricMarkup(value)}</strong><span>${metricLabelMarkup(r.chart?.labels.every(text => /^\d+月$/.test(text)) ? label.replace('6个月累计（辆）', '累计销量').replace('月均销量（辆）', '月均销量').replace(/（辆）$/, '') : label)}</span></div>`).join('')}</div>` : ''}
        ${r.chart ? this.renderChart(message) : ''}
        ${r.chart?.note ? `<p class="chat-paragraph">${emphasisMarkup(r.chart.note, r)}</p>` : ''}
        ${r.libraryImage && /^assets\/(?:conversation-materials\/zhou-champion\.svg|library-materials\/material-\d{2}\.webp|album-samples\/IMG_\d+\.PNG|library-samples\/(?:champion-current|champion-previous|model-deliveries|test-drive|followup-checklist)\.webp)$/.test(r.libraryImage.src) ? `<figure class="chat-library-image"><button type="button" data-chat-action="material-preview" data-material-key="${escape(r.libraryImage.key||r.libraryImage.src.split('/').pop().replace(/\.\w+$/,''))}" aria-label="查看图片：${escape(r.libraryImage.name)}"><img width="${Number.isFinite(r.libraryImage.width)&&r.libraryImage.width>0?r.libraryImage.width:720}" height="${Number.isFinite(r.libraryImage.height)&&r.libraryImage.height>0?r.libraryImage.height:720}" src="${escape(r.libraryImage.src)}" alt="${escape(r.libraryImage.name)}" loading="eager" decoding="async"></button><figcaption>${escape(r.libraryImage.name)}</figcaption></figure>` : ''}
        ${r.libraryFiles?.length ? `<div class="chat-reply-files">${r.libraryFiles.filter(file=>/^assets\/conversation-materials\/[a-z-]+\.(pdf|csv)$/.test(file.url)).map(file=>`<button type="button" data-chat-action="material-preview" data-material-key="${escape(file.key)}" aria-label="查看文件：${escape(file.name)}"><img src="assets/library-document.svg" alt=""><span><strong>${escape(file.name)}</strong><small>${escape(file.name.split('.').pop().toUpperCase())} · ${Math.max(1,Math.round(file.size/1024))}KB</small></span><img src="assets/library-chevron.svg" alt=""></button>`).join('')}</div>` : ''}
        ${r.rows && !r.profile ? `<div class="chat-table-wrap"><table><thead><tr>${r.headers.map(text => `<th>${escape(text)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(row => `<tr>${row.map(text => `<td>${/^[-+]?\d+(?:[,.]\d+)*%?$/.test(String(text)) ? `<strong>${escape(text)}</strong>` : emphasisMarkup(text, r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
        ${r.sources.length ? `<section class="chat-source-disclosure"><button type="button" class="chat-sources" data-chat-action="sources" aria-controls="sources-${escape(message.id)}" aria-expanded="${this.expandedSources.has(message.id)}"><span><img src="assets/cff1a.svg" alt="">数据来源·${r.sources.length}项</span><span><span class="source-toggle-label">${this.expandedSources.has(message.id) ? '收起' : '展开'}</span><img src="assets/289e6.svg" alt=""></span></button><ol class="chat-source-content" id="sources-${escape(message.id)}" ${this.expandedSources.has(message.id) ? '' : 'hidden'}>${r.sources.map((source, i) => `<li><h3>${String(i + 1).padStart(2, '0')} · ${escape(source.title)}</h3>${source.description.split('。').filter(Boolean).map(line => `<p>${escape(line)}</p>`).join('')}<p>数据更新时间：${escape(source.updated)}</p>${source.url ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">查看公开来源 ↗</a>` : ''}</li>`).join('')}</ol></section>` : ''}
        <div class="chat-answer-actions" data-name="AnswerActions" data-current="${message === this.session.messages.at(-1)}" ${message.state==='complete'?'':'hidden'}>
          <button data-chat-action="copy" aria-label="复制回答"><img src="assets/conversation-1dd93.svg" alt=""></button>
          <button data-chat-action="like" aria-label="赞同回答" aria-pressed="${Boolean(message.liked)}"><img src="assets/${message.liked ? 'feedback-selected.svg' : 'conversation-47792.svg'}" alt=""></button>
          <button data-chat-action="dislike" aria-label="不满意" aria-pressed="${Boolean(message.disliked)}"><img src="assets/${message.disliked ? 'feedback-selected.svg' : 'conversation-47792.svg'}" alt=""></button>
          <button data-chat-action="share" aria-label="分享回答"><img src="assets/conversation-f917c.svg" alt=""></button>
          <button data-chat-action="more" aria-label="更多操作" aria-haspopup="dialog" aria-expanded="false"><img src="assets/reply-more.svg" alt=""></button>
          <button data-chat-action="regenerate" aria-label="重新生成回答" ${this.busy ? 'disabled' : ''}><img src="assets/conversation-0a9d0.svg" alt=""></button>
        </div>
      </article>`;
    }
    updateFeedbackIcons(message, animate) {
      const article = this.host.querySelector(`[data-message-id="${message.id}"] article`);
      for (const kind of ['like', 'dislike']) {
        const control = article?.querySelector(`[data-chat-action="${kind}"]`);
        if (!control) continue;
        const selected = Boolean(message[kind === 'like' ? 'liked' : 'disliked']);
        control.setAttribute('aria-pressed', String(selected));
        control.querySelector('img').src = `assets/${selected ? 'feedback-selected.svg' : 'conversation-47792.svg'}`;
        control.classList.remove('feedback-pop');
        if (selected && animate === kind) {
          void control.offsetWidth; control.classList.add('feedback-pop');
          control.addEventListener('animationend', () => control.classList.remove('feedback-pop'), { once: true });
        }
      }
    }
    setFeedbackDraft(message, draft, restoreLike = false) {
      const selected = Boolean(draft.reasons.length || draft.comment.trim());
      const wasSelected = Boolean(message.disliked);
      message.disliked = selected;
      message.liked = selected ? false : restoreLike;
      if (selected) message.feedbackDraft = draft;
      else { delete message.feedbackDraft; delete message.feedback; }
      this.updateFeedbackIcons(message, selected && !wasSelected ? 'dislike' : null);
      this.persist();
    }
    setupTurnNavigation(){
      const screen=this.host.closest('.design-screen');
      this.turnRail=document.createElement('button');this.turnRail.type='button';this.turnRail.className='turn-navigation';this.turnRail.hidden=true;
      this.turnRail.setAttribute('aria-label','浏览当前对话');this.turnRail.setAttribute('aria-expanded','false');screen.append(this.turnRail);
      this.turnPreview=document.createElement('button');this.turnPreview.type='button';this.turnPreview.className='turn-preview';this.turnPreview.hidden=true;this.turnPreview.setAttribute('aria-label','定位到预览对话');this.turnPreview.innerHTML='<strong></strong><span></span>';screen.append(this.turnPreview);
      const close=()=>{this.turnGesture=null;this.turnPreview.hidden=true;this.turnRail.classList.remove('is-scrubbing');this.turnRail.setAttribute('aria-expanded','false');this.paintTurnMarks(this.turnActive||0)};
      this.closeTurnPreview=close;
      const select=y=>{
        const marks=[...this.turnRail.children];if(!marks.length)return;
        const closest=marks.reduce((best,n)=>Math.abs(n.getBoundingClientRect().top+n.getBoundingClientRect().height/2-y)<Math.abs(best.getBoundingClientRect().top+best.getBoundingClientRect().height/2-y)?n:best);
        const entries=this.turnEntries||[],count=entries.length,rect=this.turnRail.getBoundingClientRect(),index=count<=16?Number(closest.dataset.turnIndex):Math.max(0,Math.min(count-1,Math.round((y-rect.top-16*rect.width/64)/Math.max(1,rect.height-32*rect.width/64)*(count-1))));
        this.previewTurn(index);
      };
      this.turnRail.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||this.turnRail.hidden)return;e.preventDefault();this.turnGesture={id:e.pointerId,y:e.clientY,moved:false};this.turnRail.setPointerCapture(e.pointerId)});
      this.turnRail.addEventListener('pointermove',e=>{const g=this.turnGesture;if(!g||g.id!==e.pointerId)return;if(Math.abs(e.clientY-g.y)>6)g.moved=true;if(g.moved)select(e.clientY)});
      this.turnRail.addEventListener('pointerup',e=>{const g=this.turnGesture;if(!g||g.id!==e.pointerId)return;const id=this.turnPreview.dataset.turnId;this.turnGesture=null;close();if(g.moved&&id)this.locateTurn(id)});
      this.turnRail.addEventListener('pointercancel',close);this.turnRail.addEventListener('lostpointercapture',()=>{if(this.turnGesture)close()});
      this.turnRail.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='Enter'&&!this.turnPreview.hidden){const id=this.turnPreview.dataset.turnId;close();this.locateTurn(id)}else this.previewTurn(Math.max(0,Math.min((this.turnEntries?.length||1)-1,(this.turnPreview.hidden?this.turnActive:this.turnPreviewIndex)+(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0))))}else if(e.key==='Escape')close()});
      this.turnPreview.onclick=()=>{const id=this.turnPreview.dataset.turnId;close();this.locateTurn(id)};
      document.addEventListener('pointerdown',e=>{if(!this.turnRail.contains(e.target)&&!this.turnPreview.contains(e.target))close()},{capture:true});
      let frame;const update=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;this.syncTurnNavigation()})};
      const readingKey='demo-turn-reading-'+this.session.id;let savedReading;try{savedReading=JSON.parse(sessionStorage.getItem(readingKey))}catch{}
      this.scroller?.addEventListener('scroll',()=>{try{sessionStorage.setItem(readingKey,JSON.stringify({scroll:this.scroller.scrollTop}))}catch{}update()},{passive:true});
      if(savedReading&&Number.isFinite(savedReading.scroll)&&!location.hash)requestAnimationFrame(()=>requestAnimationFrame(()=>{this.stickToBottom=false;this.scroller.scrollTop=savedReading.scroll;update()}));
      this.scroller?.addEventListener('wheel',close,{passive:true});
      window.addEventListener('resize',()=>{close();update()});window.addEventListener('pagehide',close);
      document.addEventListener('focusin',update);document.addEventListener('focusout',update);document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
      new MutationObserver(update).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});this.syncTurnNavigation();
    }
    paintTurnMarks(index){
      const marks=[...this.turnRail.children];if(!marks.length)return;
      const nearest=marks.reduce((best,n)=>Math.abs(Number(n.dataset.turnIndex)-index)<Math.abs(Number(best.dataset.turnIndex)-index)?n:best);
      for(const mark of marks){const selected=mark===nearest,neighbor=Math.abs(marks.indexOf(mark)-marks.indexOf(nearest))===1;if(mark.classList.contains('is-current')!==selected)mark.classList.toggle('is-current',selected);if(mark.classList.contains('is-neighbor')!==neighbor)mark.classList.toggle('is-neighbor',neighbor)}
    }
    previewTurn(index){
      const entry=this.turnEntries?.[index];if(!entry)return;
      this.turnRail.classList.add('is-scrubbing');
      this.turnPreviewIndex=index;this.turnPreview.dataset.turnId=entry.id;
      this.turnPreview.querySelector('strong').textContent=entry.title;this.turnPreview.querySelector('span').textContent=entry.summary||'点击查看这一轮对话';
      this.turnPreview.hidden=false;this.turnRail.setAttribute('aria-expanded','true');this.paintTurnMarks(index);
      const screen=this.host.closest('.design-screen'),rect=screen.getBoundingClientRect(),zoom=rect.width/750,marks=[...this.turnRail.children],mark=marks.reduce((best,n)=>Math.abs(Number(n.dataset.turnIndex)-index)<Math.abs(Number(best.dataset.turnIndex)-index)?n:best),r=mark.getBoundingClientRect();
      const heading=screen.querySelector('.s51')?.getBoundingClientRect(),composer=document.querySelector('.s36')?.getBoundingClientRect(),height=this.turnPreview.getBoundingClientRect().height;
      const min=(heading?.bottom||rect.top)+16*zoom,max=(composer?.top||rect.bottom)-height-20*zoom;
      this.turnPreview.style.top=(Math.max(min,Math.min(r.top+r.height/2-height/2,max))-rect.top)/zoom+'px';
    }
    syncTurnNavigation(){
      if(!this.turnRail)return;
      const screen=this.host.closest('.design-screen'),messages=this.session.messages,turns=messages.filter(m=>m.role==='user');
      const blocked=screen.matches('.home-keyboard,.voice-review')||Boolean(screen.querySelector('.ui-overlay:not([hidden]),.voice-panel:not([hidden]),.voice-compact:not([hidden])'))||Boolean(document.querySelector('dialog[open]'))||Boolean(document.activeElement?.matches('input,textarea'));
      const hidden=turns.length<4||blocked;if(this.turnRail.hidden!==hidden)this.turnRail.hidden=hidden;if(hidden&&!this.turnPreview.hidden)this.closeTurnPreview();
      const zoom=screen.getBoundingClientRect().width/750,heading=screen.querySelector('.s51')?.getBoundingClientRect(),top=(heading?.bottom||screen.getBoundingClientRect().top)+32*zoom;
      let active=0;turns.forEach((m,i)=>{const n=this.host.querySelector(`[data-message-id="${m.id}"]`);if(n?.getBoundingClientRect().top<=top)active=i});if(this.scroller&&this.scroller.scrollHeight-this.scroller.scrollTop-this.scroller.clientHeight<20)active=turns.length-1;this.turnActive=active;
      this.turnEntries=this.turnEntries||turns.map(m=>{const index=messages.indexOf(m),next=messages.slice(index+1).find(n=>n.role==='user'),end=next?messages.indexOf(next):messages.length,reply=messages.slice(index+1,end).find(n=>n.role==='assistant'&&n.state==='complete')?.reply;return{id:m.id,title:m.text||'附件提问',summary:reply?[...(reply.paragraphs||[]),reply.quote||reply.question||''].filter(Boolean).join('')||reply.title||'': '回复生成中…'}});
      const count=Math.min(16,turns.length),indices=Array.from({length:count},(_,i)=>Math.round(i*(turns.length-1)/Math.max(1,count-1))),signature=indices.join(',');
      if(this.turnRail.dataset.turns!==signature){this.turnRail.dataset.turns=signature;this.turnRail.innerHTML=indices.map(i=>`<i data-turn-index="${i}"></i>`).join('')}
      if(this.turnPreview.hidden)this.paintTurnMarks(active);
    }
    locateTurn(id){
      const question=this.host.querySelector(`[data-message-id="${id}"]`);if(!question)return;
      this.stickToBottom=false;const screen=this.host.closest('.design-screen'),zoom=screen.getBoundingClientRect().width/750,header=screen.querySelector('.s51')?.getBoundingClientRect();
      this.scroller.scrollTop+=(question.getBoundingClientRect().top-(header?.bottom||screen.getBoundingClientRect().top)-24*zoom)/zoom;
      this.syncTurnNavigation();
    }
    setupReplyTools(){
      this.moreMenu=document.createElement('dialog');this.moreMenu.className='reply-more-menu';this.moreMenu.setAttribute('aria-label','回复更多操作');
      this.moreMenu.innerHTML='<div class="reply-more-content"><div class="history-context-actions reply-more-actions"><button type="button" data-chat-action="branch"><span>创建分支</span><img src="assets/reply-create-branch-v2.svg" alt=""></button><button type="button" data-chat-action="reference"><span>引用</span><img src="assets/reply-reference.svg" alt=""></button></div></div>';
      document.body.append(this.moreMenu);this.moreMenu.addEventListener('click',event=>{if(event.target.closest('[data-chat-action]'))this.action(event);else if(event.target===this.moreMenu)this.closeReplyMenu()});
      this.moreMenu.addEventListener('close',()=>{this.moreTrigger?.setAttribute('aria-expanded','false');this.moreMessageId=null});
      this.quoteCard=document.createElement('div');this.quoteCard.className='composer-quote';this.quoteCard.hidden=true;
      this.quoteCard.innerHTML='<span class="composer-quote-line"></span><button type="button" class="composer-quote-text" aria-label="查看引用的回复"></button><button type="button" class="composer-quote-remove" aria-label="取消引用"><img src="assets/quote-close.svg" alt=""></button>';
      const composer=document.querySelector('.s36');composer.parentElement.append(this.quoteCard);
      this.quoteCard.querySelector('.composer-quote-remove').onclick=()=>this.setQuote(null);this.quoteCard.querySelector('.composer-quote-text').onclick=()=>this.locateQuote(this.quoteDraft);
      window.addEventListener('resize',()=>this.closeReplyMenu());window.addEventListener('pagehide',()=>this.closeReplyMenu());
    }
    closeReplyMenu(){if(this.moreMenu?.open)this.moreMenu.close();this.moreTrigger?.setAttribute('aria-expanded','false')}
    openReplyMenu(message,button){
      this.closeReplyMenu();this.moreMessageId=message.id;this.moreTrigger=button;button.setAttribute('aria-expanded','true');this.moreMenu.showModal();
      const screen=this.host.closest('.design-screen'),canvas=screen.getBoundingClientRect(),zoom=canvas.width/750,rect=button.getBoundingClientRect();
      const content=this.moreMenu.querySelector('.reply-more-content');content.style.zoom=zoom;content.style.width='360px';content.style.setProperty('--context-target',44/zoom+'px');this.moreMenu.style.width=360*zoom+'px';
      const bounds=this.moreMenu.getBoundingClientRect(),gap=12*zoom;
      const left=Math.max(canvas.left+24*zoom,Math.min(rect.left,canvas.right-bounds.width-24*zoom)-32*zoom);
      const top=Math.max(12,rect.top-bounds.height-gap);
      content.style.transformOrigin='bottom left';
      this.moreMenu.style.left=left+'px';this.moreMenu.style.top=top+'px';
      DemoMotion.animate(content,[{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}],150);
    }
    setQuote(reference){
      this.quoteDraft=reference;this.quoteCard.hidden=!reference;document.querySelector('.design-screen').classList.toggle('has-quote',Boolean(reference));
      const text=this.quoteCard.querySelector('.composer-quote-text');text.textContent=reference?.text||'';text.title=reference?.text||'';
    }
    locateQuote(reference){
      const target=reference&&this.host.querySelector(`[data-message-id="${reference.messageId}"] article`);
      if(!target){this.onError('引用的回复暂时无法定位，已保留引用内容');return}this.host.querySelectorAll('.material-located').forEach(node=>node.classList.remove('material-located'));target.scrollIntoView({block:'center',behavior:'instant'});target.classList.add('material-located');setTimeout(()=>target.classList.remove('material-located'),1600);
    }
    async action(event) {
      const button = event.target.closest('[data-chat-action]');
      if (!button || button.matches(':disabled')) return;
      const message = this.session.messages.find(m => m.id === (button.closest('[data-message-id]')?.dataset.messageId||this.moreMessageId));
      const action = button.dataset.chatAction;
      if(action==='more'){if(message?.state==='complete')this.openReplyMenu(message,button);return}
      if(action==='reference'){
        if(message?.state!=='complete')return;this.closeReplyMenu();document.dispatchEvent(new CustomEvent('demo-quote-select'));
        const reply=structuredClone(message.reply);this.setQuote({sessionId:this.session.id,messageId:message.id,title:reply.title||'历史回复',text:(reply.paragraphs||[]).join('\n')||reply.title,context:structuredClone(reply.context||{}),reply});
        const input=document.querySelector('.message-input');input.focus({preventScroll:true});this.stickToBottom=true;this.scrollToLatest();return;
      }
      if(action==='quote-source'){this.locateQuote(message?.reference);return}
      if(action==='branch'){
        if(this.branchCreating||message?.state!=='complete')return;
        this.branchCreating=true;button.disabled=true;this.closeReplyMenu();
        try{const branch=Conversation.branch(this.session.id,message.id);for(const key of ['demo-pending-message','demo-pending-attachments','demo-pending-input-source'])sessionStorage.removeItem(key);await DemoMotion.navigate('conversation.html?branch='+encodeURIComponent(branch.id)+'#message-'+branch.branch.cutMessageId)}
        catch{this.branchCreating=false;button.disabled=false;this.onError('分支创建失败，请重试')}
        return;
      }
      if(action==='branch-source'){
        event.preventDefault();const source=this.session.branch;
        if(!source||!Conversation.list().some(session=>session.id===source.sourceSessionId)){this.onError('来源对话已删除，当前分支仍可继续聊天');return}
        Conversation.activate(source.sourceSessionId);await DemoMotion.navigate(button.href);return;
      }
      if(action==='material-preview'){location.assign('library.html?conversation='+encodeURIComponent(this.session.id)+'&preview='+encodeURIComponent(button.dataset.materialKey)+(button.closest('.chat-reply-files')?'#files':'#images'));return}
      if (action === 'attachment') {
        try { await AttachmentStorage.download(button.dataset.attachmentId); } catch { this.onError('附件暂时无法打开，请重新添加'); }
      } else if (action === 'followup') this.submit(button.textContent);
      else if (action === 'citation') this.openEvidence(message, button);
      else if (action === 'copy-script') {
        const reply = DemoChat.normalizeReply(message.reply);
        if (!reply.quote) return this.onError('当前权限下无法复制这段话术');
        try { await navigator.clipboard.writeText(reply.quote); this.onError('已复制话术'); }
        catch { this.onError('当前浏览器未开放剪贴板权限'); }
      }
      else if (action === 'select') {
        if (this.busy) return;
        const form = button.closest('form'), multiple = message.reply.multiple;
        if (!multiple) { this.submit(button.textContent); return; }
        button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
        const selected = [...form.querySelectorAll('[aria-pressed="true"]')].map(b => b.textContent);
        if (selected.length === 2) this.submit(selected.join('、'));
      }
      else if (action === 'sources') {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        if (expanded) this.expandedSources.add(message.id); else this.expandedSources.delete(message.id);
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('.source-toggle-label').textContent = expanded ? '收起' : '展开';
        const list = button.nextElementSibling;
        const currentStyle = getComputedStyle(list);
        const current = list.hidden ? { height: '0px', marginTop: '0px', paddingTop: '0px', opacity: 0 } : {
          height: currentStyle.height, marginTop: currentStyle.marginTop,
          paddingTop: currentStyle.paddingTop, opacity: currentStyle.opacity,
        };
        // Capture the visible frame before cancelling, so repeated taps reverse smoothly.
        list.getAnimations().forEach(animation => { animation.onfinish = null; animation.cancel(); });
        list.hidden = false;
        const style = getComputedStyle(list);
        const target = expanded ? { height: `${list.offsetHeight}px`, marginTop: style.marginTop, paddingTop: style.paddingTop, opacity: 1 }
          : { height: '0px', marginTop: '0px', paddingTop: '0px', opacity: 0 };
        this.stickToBottom = false;
        const buttonTop = button.getBoundingClientRect().top;
        const viewportTop = this.scroller?.getBoundingClientRect().top;
        if (!expanded && buttonTop < viewportTop) {
          const zoom = parseFloat(getComputedStyle(document.querySelector('.design-screen')).zoom) || 1;
          this.scroller.scrollTop += (buttonTop - viewportTop) / zoom;
        }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          list.hidden = !expanded; list.style.overflow = ''; list.sourceAnimation = null;
        } else {
          list.style.overflow = 'hidden';
          const animation = list.animate([current, target], { duration: 200, easing: 'ease-out' });
          list.sourceAnimation = animation;
          animation.onfinish = () => {
            if (list.sourceAnimation !== animation) return;
            list.hidden = button.getAttribute('aria-expanded') !== 'true';
            list.style.overflow = ''; list.sourceAnimation = null;
          };
        }
      }
      else if (action === 'copy') {
        try { await navigator.clipboard.writeText(button.closest('article').innerText); this.onError('已复制回答'); }
        catch { this.onError('当前浏览器未开放剪贴板权限'); }
      } else if (action === 'like') {
        message.liked = !message.liked;
        if (message.liked) {
          message.disliked = false;
          delete message.feedback; delete message.feedbackDraft;
        }
        this.updateFeedbackIcons(message, message.liked ? 'like' : null);
        this.persist();
        if (button.closest('.chat-answer-actions').hidden) this.onError(message.liked ? '已赞同这条回答' : '已取消赞同');
      } else if (action === 'dislike') {
        // Opening the form alone is not negative feedback.
        this.onFeedback?.(message, button.closest('.chat-answer-actions').hidden ? button.closest('article') : button);
      } else if (action === 'share') {
        const data = { title: message.reply.title, text: button.closest('article').innerText };
        try {
          if (navigator.share && (!navigator.canShare || navigator.canShare(data))) await navigator.share(data);
          else { await navigator.clipboard.writeText(data.text); this.onError('回答内容已复制，可粘贴分享'); }
        } catch (error) {
          if (error.name !== 'AbortError') this.onError('分享未完成，请使用复制按钮分享回答');
        }
      } else if (action === 'regenerate') {
        if (this.busy) return;
        const index = this.session.messages.indexOf(message);
        const preceding = this.session.messages.slice(0, index);
        const question = preceding.findLast(item => item.role === 'user');
        if (!question) return;
        const context = question.reference?.context||preceding.findLast(item => item.role === 'assistant')?.reply.context || {};
        message.regeneration = { original: { reply: message.reply, state: message.state, ...(message.progress !== undefined ? { progress: message.progress } : {}) }, nextReply: question.attachments?.length ? { ...message.reply, context: { ...context, pending: null, journey: null, lastIntent: 'attachment' } } : question.dialogueUnderstanding && window.DemoUnderstanding ? DemoUnderstanding.reply(question.dialogueUnderstanding, context) : quoteAnswer(question.inputSource === 'voice' ? question.voice?.query || question.text : question.text,question.reference,context) };
        if (!question.attachments?.length && !message.regeneration.nextReply.homeReply && !question.dialogueUnderstanding && window.DemoUnderstanding?.enabled) message.modelRequest = { text: question.text, context };
        message.state = 'pending'; delete message.progress;
        this.session.updated = Date.now();
        this.persist(); this.render(); this.finish(message);
      }
    }
  }
  read();
  return Conversation;
})();
