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
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data?.version === 1 && Array.isArray(data.sessions)) {
        data.sessions = data.sessions.filter(s => typeof s.id === 'string' && Array.isArray(s.messages) && s.context && typeof s.context === 'object');
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
    return { version: 1, activeId: null, sessions: [] };
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
      this.bindAnswerContext();
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
      const voice = options.source === 'voice' ? window.VoiceUnderstanding?.understand(text, this.session.context) : null;
      const response = attachments.length ? {
        kind: 'answer', title: '附件已收到', paragraphs: [`已添加${attachments.length}个附件。`, '当前暂不支持自动解读附件内容；你可以把需要处理的文字粘贴到输入框中继续提问。'],
        context: { ...this.session.context, pending: null, journey: null, lastIntent: 'attachment' }, sources: [], followups: [],
      } : DemoChat.reply(voice?.query || text, this.session.context);
      this.session.messages.forEach(message => { if (message.reply?.kind === 'clarify') message.resolved = true; });
      this.session.messages.push({ id: id(), role: 'user', text, ...(voice ? { inputSource: 'voice', voice } : {}), ...(attachments.length ? { attachments } : {}) });
      const directVoice = window.VoiceUnderstanding?.canAnswerDirectly(voice, response);
      const message = { id: id(), role: 'assistant', reply: response, state: 'pending', ...(voice ? { voiceReply: true } : {}),
        ...(!attachments.length && !response.homeReply && !directVoice && window.DemoUnderstanding?.enabled ? { modelRequest: { text, context: previous.context } } : {}) };
      this.session.messages.push(message);
      this.session.context = response.context;
      if (this.session.title === '新对话') this.session.title = (text || attachments[0]?.name || '附件消息').slice(0, 26);
      this.session.updated = Date.now();
      this.stickToBottom = true;
      if (!this.persist()) { this.session = previous; return false; }
      this.render(); this.finish(message); return true;
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
        if (block.element.matches('.chat-answer-actions[data-current="false"]')) block.element.hidden = true;
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
      this.closeAnswerContext?.();
      const anchor = !this.stickToBottom && this.scroller ? [...this.host.querySelectorAll('[data-message-id]')].find(node => node.getBoundingClientRect().bottom > this.scroller.getBoundingClientRect().top) : null;
      const anchorId = anchor?.dataset.messageId, anchorTop = anchor?.getBoundingClientRect().top;
      const last = this.session.messages.at(-1);
      this.host.innerHTML = this.session.messages.length ? this.session.messages.map(message => {
        if (message.role === 'user') return `<div class="chat-user" data-input-source="${message.inputSource === 'voice' ? 'voice' : 'text'}" data-message-id="${escape(message.id)}">${message.attachments?.length ? `<div class="chat-user-attachments">${message.attachments.map(file => `<button type="button" data-chat-action="attachment" data-attachment-id="${escape(file.id)}" aria-label="下载附件：${escape(file.name)}">${file.type?.startsWith('image/') ? `<img data-attachment-id="${escape(file.id)}" alt="${escape(file.name)}">` : '<img src="assets/attachment-file.svg" alt="">'}<span>${escape(file.name)}</span></button>`).join('')}</div>` : ''}${message.text ? `<p>${escape(message.text)}</p>` : ''}</div>`;
        if (message.state === 'pending') return `${message.regeneration ? `<div class="chat-response" data-message-id="${escape(message.id)}">${this.renderReply(message)}</div>` : ''}<div class="thinking-status" role="status"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>正在思考...</span></div>`;
        return `<div class="chat-response" data-message-id="${escape(message.id)}" data-generation-state="${escape(message.state)}">${this.renderReply(message)}${last === message && message.state === 'complete' && !message.reply.unavailable && message.reply.followups?.length ? `<section class="followup-section"><h2>推荐追问</h2><div class="followup-options">${message.reply.followups.map(text => `<button data-chat-action="followup">${escape(text)}</button>`).join('')}</div></section>` : ''}</div>`;
      }).join('') : '<p class="chat-empty">开始一段新对话。你可以查询销量、对比车型，或整理客户跟进。</p>';
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
      return `<article tabindex="0" aria-haspopup="dialog" class="chat-answer${r.unavailable ? ' chat-answer-unavailable' : ''}${r.profile ? ' chat-answer-champion' : ''}${r.chart?.labels.every(text => /^\d+月$/.test(text)) ? ' chat-answer-trend' : ''}" data-name="Article">
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
        ${r.rows && !r.profile ? `<div class="chat-table-wrap"><table><thead><tr>${r.headers.map(text => `<th>${escape(text)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(row => `<tr>${row.map(text => `<td>${/^[-+]?\d+(?:[,.]\d+)*%?$/.test(String(text)) ? `<strong>${escape(text)}</strong>` : emphasisMarkup(text, r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
        ${r.sources.length ? `<section class="chat-source-disclosure"><button type="button" class="chat-sources" data-chat-action="sources" aria-controls="sources-${escape(message.id)}" aria-expanded="${this.expandedSources.has(message.id)}"><span><img src="assets/cff1a.svg" alt="">数据来源·${r.sources.length}项</span><span><span class="source-toggle-label">${this.expandedSources.has(message.id) ? '收起' : '展开'}</span><img src="assets/289e6.svg" alt=""></span></button><ol class="chat-source-content" id="sources-${escape(message.id)}" ${this.expandedSources.has(message.id) ? '' : 'hidden'}>${r.sources.map((source, i) => `<li><h3>${String(i + 1).padStart(2, '0')} · ${escape(source.title)}</h3>${source.description.split('。').filter(Boolean).map(line => `<p>${escape(line)}</p>`).join('')}<p>数据更新时间：${escape(source.updated)}</p>${source.url ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">查看公开来源 ↗</a>` : ''}</li>`).join('')}</ol></section>` : ''}
        <div class="chat-answer-actions" data-name="AnswerActions" data-current="${message === this.session.messages.at(-1)}" ${message === this.session.messages.at(-1) ? '' : 'hidden'}>
          <button data-chat-action="copy" aria-label="复制回答"><img src="assets/conversation-1dd93.svg" alt=""></button>
          <button data-chat-action="like" aria-label="赞同回答" aria-pressed="${Boolean(message.liked)}"><img src="assets/${message.liked ? 'feedback-selected.svg' : 'conversation-47792.svg'}" alt=""></button>
          <button data-chat-action="dislike" aria-label="不满意" aria-pressed="${Boolean(message.disliked)}"><img src="assets/${message.disliked ? 'feedback-selected.svg' : 'conversation-47792.svg'}" alt=""></button>
          <button data-chat-action="share" aria-label="分享回答"><img src="assets/conversation-f917c.svg" alt=""></button>
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
    bindAnswerContext() {
      let press;
      const clear = () => { clearTimeout(press?.timer); press = undefined; };
      const sourceFor = target => target.closest('.chat-source-disclosure');
      const articleFor = target => sourceFor(target) ? null : target.closest('article.chat-answer');
      ['selectstart', 'contextmenu', 'dragstart'].forEach(name => this.host.addEventListener(name, event => {
        if (sourceFor(event.target)) event.preventDefault();
      }));
      this.host.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary || event.target.closest('button,a,input,textarea')) return;
        const article = articleFor(event.target); if (!article) return;
        clear(); const current = { x: event.clientX, y: event.clientY };
        press = current;
        current.timer = setTimeout(() => {
          if (press === current && article.isConnected && !document.hidden) this.openAnswerContext(article, { x: current.x, y: current.y, held: true });
        }, 450);
      });
      this.host.addEventListener('pointermove', event => { if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) clear(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(name => this.host.addEventListener(name, clear));
      this.scroller?.addEventListener('scroll', clear, { passive: true });
      this.host.addEventListener('contextmenu', event => {
        const article = articleFor(event.target); if (!article || event.target.closest('button,a')) return;
        event.preventDefault(); clear(); this.openAnswerContext(article, { x: event.clientX, y: event.clientY });
      });
      this.host.addEventListener('keydown', event => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
          const article = articleFor(event.target); if (!article) return;
          event.preventDefault(); this.openAnswerContext(article);
        }
      });
      document.addEventListener('keydown', event => {
        if (!this.answerContext) return;
        if (event.key === 'Escape') { event.preventDefault(); this.closeAnswerContext(); }
        else if (event.key === 'Tab') {
          const controls = [...this.answerContext.view.querySelectorAll('button:not(:disabled)')];
          const first = controls[0], last = controls.at(-1);
          if (event.shiftKey && (document.activeElement === first || document.activeElement === this.answerContext.view.querySelector('[role="dialog"]'))) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      });
      document.addEventListener('demo-back', event => { if (this.answerContext) { event.preventDefault(); this.closeAnswerContext(); } });
      const reposition = () => requestAnimationFrame(() => this.positionAnswerContext());
      window.addEventListener('resize', reposition); window.visualViewport?.addEventListener('resize', reposition);
      window.addEventListener('pagehide', () => { clear(); this.closeAnswerContext(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
    }
    openAnswerContext(article, origin) {
      const id = article.closest('[data-message-id]')?.dataset.messageId;
      const message = this.session.messages.find(item => item.id === id);
      if (message?.state !== 'complete' || this.answerContext?.id === id) return;
      this.closeAnswerContext();
      const view = document.createElement('section'); view.className = 'answer-context';
      view.innerHTML = `<button class="answer-context-veil" aria-label="关闭回答操作"></button><div class="answer-context-panel" role="dialog" aria-modal="true" aria-label="回答操作" tabindex="-1"><div class="answer-context-primary"></div><div class="answer-context-feedback"></div></div>`;
      const labels = { copy: '复制', share: '分享', regenerate: '重新生成', like: message.liked ? '取消赞同' : '赞同', dislike: message.disliked ? '修改不满意反馈' : '不满意' };
      for (const action of ['copy', 'share', 'regenerate', 'like', 'dislike']) {
        const original = article.querySelector(`.chat-answer-actions [data-chat-action="${action}"]`);
        if (!original) continue;
        const control = document.createElement('button'); control.dataset.answerAction = action;
        control.setAttribute('aria-label', original.getAttribute('aria-label'));
        if (original.hasAttribute('aria-pressed')) control.setAttribute('aria-pressed', original.getAttribute('aria-pressed'));
        control.disabled = original.disabled;
        const image = original.querySelector('img').cloneNode(true), label = document.createElement('span'); label.textContent = labels[action];
        control.append(image, label); view.querySelector(action === 'like' || action === 'dislike' ? '.answer-context-feedback' : '.answer-context-primary').append(control);
        control.addEventListener('click', () => {
          this.closeAnswerContext();
          // Reuse the card's handlers and state, including hidden historical actions.
          original.click();
        });
      }
      const screen = this.host.closest('.design-screen');
      const blocked = [screen.firstElementChild, document.querySelector('.demo-nav'), document.querySelector('.nav-toggle')].filter(Boolean).map(node => ({ node, inert: node.inert }));
      blocked.forEach(({ node }) => { node.inert = true; });
      this.answerContext = { view, article, id, origin, blocked, suppressRelease: Boolean(origin?.held) };
      // The release of the opening hold must not click the newly appeared menu.
      view.addEventListener('pointerdown', () => { if (this.answerContext) this.answerContext.suppressRelease = false; });
      view.addEventListener('click', event => {
        if (this.answerContext?.suppressRelease) {
          this.answerContext.suppressRelease = false;
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }, true);
      document.getSelection()?.removeAllRanges(); document.activeElement?.blur(); screen.append(view);
      this.positionAnswerContext();
      DemoMotion.animate(view.querySelector('.answer-context-panel'), [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)' }], 140);
      view.querySelector('.answer-context-veil').addEventListener('click', () => this.closeAnswerContext());
      view.querySelector('[role="dialog"]').focus({ preventScroll: true });
    }
    positionAnswerContext() {
      const context = this.answerContext; if (!context) return;
      const screen = this.host.closest('.design-screen'), rect = screen.getBoundingClientRect(), scale = rect.width / screen.offsetWidth;
      const panel = context.view.querySelector('[role="dialog"]');
      const header = screen.querySelector('[data-name="Header"]').getBoundingClientRect();
      const top = Math.max(24, (header.bottom - rect.top) / scale + 16);
      const bottom = document.documentElement.classList.contains('mobile-layout') ? 24 : 88;
      panel.style.setProperty('--answer-target', `${44 / scale}px`);
      panel.style.maxHeight = `${Math.max(80, rect.height / scale - top - bottom)}px`;
      const source = context.article.getBoundingClientRect();
      const x = ((context.origin?.x ?? source.right) - rect.left) / scale;
      const y = ((context.origin?.y ?? source.top) - rect.top) / scale;
      panel.style.left = `${Math.max(24, Math.min(x - panel.offsetWidth / 2, screen.offsetWidth - panel.offsetWidth - 24))}px`;
      panel.style.top = `${Math.max(top, Math.min(y - panel.offsetHeight / 4, rect.height / scale - panel.offsetHeight - bottom))}px`;
    }
    closeAnswerContext() {
      const context = this.answerContext; if (!context) return;
      context.view.remove(); context.blocked.forEach(({ node, inert }) => { node.inert = inert; });
      if (context.article.isConnected) context.article.focus({ preventScroll: true });
      this.answerContext = undefined;
    }
    async action(event) {
      const button = event.target.closest('[data-chat-action]');
      if (!button || button.matches(':disabled')) return;
      const message = this.session.messages.find(m => m.id === button.closest('[data-message-id]')?.dataset.messageId);
      const action = button.dataset.chatAction;
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
        const context = preceding.findLast(item => item.role === 'assistant')?.reply.context || {};
        message.regeneration = { original: { reply: message.reply, state: message.state, ...(message.progress !== undefined ? { progress: message.progress } : {}) }, nextReply: question.attachments?.length ? { ...message.reply, context: { ...context, pending: null, journey: null, lastIntent: 'attachment' } } : question.dialogueUnderstanding && window.DemoUnderstanding ? DemoUnderstanding.reply(question.dialogueUnderstanding, context) : DemoChat.reply(question.inputSource === 'voice' ? question.voice?.query || question.text : question.text, context) };
        if (!question.attachments?.length && !message.regeneration.nextReply.homeReply && !question.dialogueUnderstanding && window.DemoUnderstanding?.enabled) message.modelRequest = { text: question.text, context };
        message.state = 'pending'; delete message.progress;
        this.session.updated = Date.now();
        this.persist(); this.render(); this.finish(message);
      }
    }
  }
  return Conversation;
})();
