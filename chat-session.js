window.ChatConversations = (() => {
  const defaultScope = encodeURIComponent(JSON.stringify(['general_manager', ['hometown', 'joinedAt'], ['*']]));
  const key = window.DemoAccess?.storageScope === defaultScope ? 'dick-cowboy-conversations-v1' : `dick-cowboy-conversations-v1:${window.DemoAccess?.storageScope || 'guest'}`;
  const id = () => crypto.randomUUID();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
        data.sessions.forEach(session => session.messages.forEach(message => {
          if (message.reply) message.reply = DemoChat.normalizeReply(message.reply);
        }));
        return data;
      }
    } catch { /* A missing or damaged cache starts a fresh session. */ }
    return { version: 1, activeId: null, sessions: [] };
  }
  function write(data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { return false; }
  }
  function create(context = {}) {
    const data = read(), session = { id: id(), title: '新对话', updated: Date.now(), messages: [], context };
    data.sessions.push(session); data.activeId = session.id; write(data); return session;
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
    static create(context) { return create(context); }
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
      const pending = this.session.messages.find(m => ['pending', 'streaming'].includes(m.state));
      if (pending) {
        if (pending.state === 'streaming') { this.onBusy(true); this.stream(pending); }
        else this.finish(pending, 450);
      }
      window.addEventListener('pagehide', () => { clearTimeout(this.timer); if (this.busy) this.persist(); });
    }
    get busy() { return this.session.messages.some(m => ['pending', 'streaming'].includes(m.state)); }
    persist() { if (!save(this.session)) this.onError('浏览器存储空间不足，当前对话暂时无法持久保存'); }
    enqueue(text) { if (this.busy) this.queue.push(text); else this.submit(text); }
    submit(text) {
      text = text.trim();
      if (!text || this.busy) return false;
      this.session.messages.forEach(message => { if (message.reply?.kind === 'clarify') message.resolved = true; });
      const response = DemoChat.reply(text, this.session.context);
      this.session.messages.push({ id: id(), role: 'user', text });
      const message = { id: id(), role: 'assistant', reply: response, state: 'pending' };
      this.session.messages.push(message);
      this.session.context = response.context;
      if (this.session.title === '新对话') this.session.title = text.slice(0, 26);
      this.session.updated = Date.now();
      this.stickToBottom = true;
      this.persist(); this.render(); this.finish(message); return true;
    }
    finish(message, delay = 550 + Math.random() * 300) {
      this.onBusy(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
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
      const blocks = [...content.children].map(element => {
        const text = /^(H2|P|LEGEND)$/.test(element.tagName) ? element.textContent : null;
        if (text !== null) element.replaceChildren(document.createTextNode(''));
        element.hidden = true;
        return { element, text, units: text === null ? 1 : Math.max(1, Array.from(text).length) };
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
          block.element.firstChild.data = Array.from(block.text).slice(0, visible).join('');
          if (visible > 0) lastText = block.element;
        } else if (visible && wasHidden && cursor) block.element.classList.add('stream-reveal');
        remaining -= block.units;
      }
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
        let chunk = currentBlock.text === null ? 1 : Math.min(3 + Math.floor(Math.random() * 3), blockRemaining);
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
          : /[，、：]$/.test(shown) ? 110 + Math.random() * 50 : 80 + Math.random() * 35;
        this.timer = setTimeout(tick, pause);
      };
      tick();
    }
    stop() {
      const message = this.session.messages.find(m => ['pending', 'streaming'].includes(m.state));
      if (!message) return;
      clearTimeout(this.timer);
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
        if (message.role === 'user') return `<div class="chat-user" data-message-id="${escape(message.id)}"><p>${escape(message.text)}</p></div>`;
        if (message.state === 'pending') return `${message.regeneration ? `<div class="chat-response" data-message-id="${escape(message.id)}">${this.renderReply(message)}</div>` : ''}<div class="thinking-status" role="status"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>正在思考...</span></div>`;
        return `<div class="chat-response" data-message-id="${escape(message.id)}" data-generation-state="${escape(message.state)}">${this.renderReply(message)}${last === message && message.state === 'complete' && message.reply.followups?.length ? `<section class="followup-section"><h2>推荐追问</h2><div class="followup-options">${message.reply.followups.map(text => `<button data-chat-action="followup">${escape(text)}</button>`).join('')}</div></section>` : ''}</div>`;
      }).join('') : '<p class="chat-empty">开始一段新对话。你可以查询销量、对比车型，或整理客户跟进。</p>';
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
      if (!chart.labels.every(text => /^\d+月$/.test(text))) return `<section class="chat-chart chat-bar"><div class="chat-bars" role="img" aria-label="${label}">${chart.values.map((value, i) => `<div class="chat-chart-column"><span>${escape(value)}辆</span><i style="height:${Math.max(6, value / Math.max(...chart.values) * 180)}px"></i><small>${escape(chart.labels[i])}</small></div>`).join('')}</div></section>`;
      const max = Math.max(1, ...chart.values), rawStep = max / 4;
      const magnitude = 10 ** Math.floor(Math.log10(rawStep));
      const step = [1, 2, 5, 10].find(value => value >= rawStep / magnitude) * magnitude, ceiling = step * 4;
      const plotTop = 33.61, plotBottom = 525.61;
      const points = chart.values.map((value, i) => [43 + i * 600 / Math.max(1, chart.values.length - 1), plotBottom - value / ceiling * 492]);
      const curve = points.map(([x, y], i) => {
        if (!i) return `M ${x} ${y}`;
        const [previousX, previousY] = points[i - 1], middleX = (previousX + x) / 2;
        return `C ${middleX} ${previousY} ${middleX} ${y} ${x} ${y}`;
      }).join(' ');
      const last = points.at(-1);
      return `<section class="chat-chart chat-trend"><h3>近${chart.labels.length}个月销量趋势</h3><svg viewBox="0 0 651 580" role="img" aria-label="${label}">
        <image class="trend-grid" href="assets/trend-grid.svg" x="43" y="32.91" width="595" height="493.4"/>
        ${Array.from({ length: 5 }, (_, i) => `<text class="trend-y-label" x="36" y="${plotTop + i * 123}" text-anchor="end" dominant-baseline="middle">${(ceiling - step * i).toFixed(0)}</text>`).join('')}
        <path class="trend-curve" d="${curve}" fill="none" stroke="#00b5c7" stroke-width="2.4"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="8" fill="#00b5c7"/>
        ${chart.labels.map((text, i) => `<text class="trend-x-label" x="${43 + i * 595 / Math.max(1, chart.labels.length - 1)}" y="547.61" text-anchor="${i === 0 ? 'start' : i === chart.labels.length - 1 ? 'end' : 'middle'}" dominant-baseline="middle">${escape(text)}</text>`).join('')}
      </svg></section>`;
    }
    renderReply(message) {
      const r = DemoChat.normalizeReply(message.reply);
      if (r.kind === 'clarify') return `<form class="clarification-card" data-clarification="${escape(message.id)}">
        <fieldset ${message.resolved ? 'disabled' : ''}><legend>${escape(r.question)}</legend><p class="clarification-hint">${escape(r.multiple ? '请选择两款车型，选满后自动发送；也可以直接输入需要对比的车型。' : r.hint)}</p>
        <div class="clarification-options">${r.options.map(text => `<button type="button" data-chat-action="select" aria-pressed="false">${escape(text)}</button>`).join('')}</div>
        ${message.resolved ? '<p class="clarification-resolved">已补充 / 已继续对话</p>' : ''}</fieldset></form>`;
      return `<article class="chat-answer${r.profile ? ' chat-answer-champion' : ''}${r.chart?.labels.every(text => /^\d+月$/.test(text)) ? ' chat-answer-trend' : ''}" data-name="Article">
        ${r.profile ? `<header class="chat-champion-profile">${r.profile.avatar ? `<img class="chat-champion-avatar" src="${escape(r.profile.avatar)}" alt="${escape(r.profile.name)}头像">` : `<span class="chat-champion-avatar chat-avatar-initial" aria-hidden="true">${escape(r.profile.name.slice(0, 1))}</span>`}<div><h2>${escape(r.profile.name)}</h2><div class="chat-champion-tags"><span><img src="assets/8e521.svg" alt="">${escape(r.profile.badge)}</span><span>${escape(r.profile.store)}</span></div>${r.profile.role ? `<p class="chat-person-role">${escape(r.profile.role)}${r.profile.tenure ? ` · 入职约${escape(r.profile.tenure)}` : ''}</p>` : ''}</div></header>` : `<h2>${escape(r.title)}</h2>`}
        ${r.paragraphs.map(text => `<p class="chat-paragraph">${escape(text)}</p>`).join('')}
        ${r.profile?.fields?.length ? `<dl class="chat-person-facts">${r.profile.fields.map(field => `<div><dt>${escape(field.label)}</dt><dd>${escape(field.value)}</dd></div>`).join('')}</dl>` : ''}
        ${r.metrics?.length ? `<div class="chat-metrics">${r.metrics.map(([value, label]) => `<div><strong${/^[+-]?\d+(?:\.\d+)?%$/.test(String(value)) ? ' class="metric-percentage"' : ''}>${metricMarkup(value)}</strong><span>${escape(r.chart?.labels.every(text => /^\d+月$/.test(text)) ? label.replace('6个月累计（辆）', '累计销量').replace('月均销量（辆）', '月均销量') : label)}</span></div>`).join('')}</div>` : ''}
        ${r.chart ? this.renderChart(message) : ''}
        ${r.chart?.note ? `<p class="chat-paragraph">${escape(r.chart.note)}</p>` : ''}
        ${r.rows && !r.profile ? `<div class="chat-table-wrap"><table><thead><tr>${r.headers.map(text => `<th>${escape(text)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(row => `<tr>${row.map(text => `<td>${escape(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
        ${r.sources.length ? `<section class="chat-source-disclosure"><button class="chat-sources" data-chat-action="sources" aria-controls="sources-${escape(message.id)}" aria-expanded="${this.expandedSources.has(message.id)}"><span><img src="assets/cff1a.svg" alt="">数据来源·${r.sources.length}项</span><span><span class="source-toggle-label">${this.expandedSources.has(message.id) ? '收起' : '展开'}</span><img src="assets/289e6.svg" alt=""></span></button><ol class="chat-source-content" id="sources-${escape(message.id)}" ${this.expandedSources.has(message.id) ? '' : 'hidden'}>${r.sources.map((source, i) => `<li><h3>${String(i + 1).padStart(2, '0')} · ${escape(source.title)}</h3>${source.description.split('。').filter(Boolean).map(line => `<p>${escape(line)}</p>`).join('')}<p>数据更新时间：${escape(source.updated)}</p></li>`).join('')}</ol></section>` : ''}
        <div class="chat-answer-actions" data-name="AnswerActions">
          <button data-chat-action="copy" aria-label="复制回答"><img src="assets/96cd7.svg" alt=""></button>
          <button data-chat-action="like" aria-label="赞同回答" aria-pressed="${Boolean(message.liked)}"><img src="assets/${message.liked ? '5eff6' : '6f511'}.svg" alt=""></button>
          <button data-chat-action="dislike" aria-label="不满意" aria-pressed="${Boolean(message.disliked)}"><img src="assets/${message.disliked ? '5eff6' : '6f511'}.svg" alt=""></button>
          <button data-chat-action="share" aria-label="分享回答"><img src="assets/31ba3.svg" alt=""></button>
          <button data-chat-action="regenerate" aria-label="重新生成回答" ${this.busy ? 'disabled' : ''}><img src="assets/be1d6.svg" alt=""></button>
        </div>
      </article>`;
    }
    async action(event) {
      const button = event.target.closest('[data-chat-action]');
      if (!button || button.matches(':disabled')) return;
      const message = this.session.messages.find(m => m.id === button.closest('[data-message-id]')?.dataset.messageId);
      const action = button.dataset.chatAction;
      if (action === 'followup') this.submit(button.textContent);
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
        list.getAnimations().forEach(animation => animation.cancel());
        list.hidden = false;
        const height = list.scrollHeight;
        const style = getComputedStyle(list);
        const margin = style.marginTop, padding = style.paddingTop;
        const buttonTop = button.getBoundingClientRect().top;
        const viewportTop = this.scroller?.getBoundingClientRect().top;
        if (!expanded && buttonTop < viewportTop) {
          const zoom = parseFloat(getComputedStyle(document.querySelector('.design-screen')).zoom) || 1;
          this.scroller.scrollTop += (buttonTop - viewportTop) / zoom;
        }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) list.hidden = !expanded;
        else {
          list.style.overflow = 'hidden';
          const animation = list.animate([
            { height: expanded ? '0px' : `${height}px`, marginTop: expanded ? '0px' : margin, paddingTop: expanded ? '0px' : padding, opacity: expanded ? 0 : 1 },
            { height: expanded ? `${height}px` : '0px', marginTop: expanded ? margin : '0px', paddingTop: expanded ? padding : '0px', opacity: expanded ? 1 : 0 },
          ], { duration: 200, easing: 'ease-out' });
          animation.onfinish = () => { list.hidden = !expanded; list.style.overflow = ''; };
        }
        this.stickToBottom = false;
      }
      else if (action === 'copy') {
        try { await navigator.clipboard.writeText(button.closest('article').innerText); this.onError('已复制回答'); }
        catch { this.onError('当前浏览器未开放剪贴板权限'); }
      } else if (action === 'like' || action === 'dislike') {
        const field = action === 'like' ? 'liked' : 'disliked';
        message[field] = !message[field];
        if (message[field]) message[action === 'like' ? 'disliked' : 'liked'] = false;
        for (const kind of ['like', 'dislike']) {
          const control = button.parentElement.querySelector(`[data-chat-action="${kind}"]`);
          const selected = Boolean(message[kind === 'like' ? 'liked' : 'disliked']);
          control.setAttribute('aria-pressed', String(selected));
          control.querySelector('img').src = `assets/${selected ? '5eff6' : '6f511'}.svg`;
        }
        this.persist();
        if (message[field]) {
          button.classList.remove('feedback-pop');
          void button.offsetWidth;
          button.classList.add('feedback-pop');
          button.addEventListener('animationend', () => button.classList.remove('feedback-pop'), { once: true });
          if (action === 'dislike') this.onFeedback?.(message, button);
        }
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
        message.regeneration = { original: { reply: message.reply, state: message.state, ...(message.progress !== undefined ? { progress: message.progress } : {}) }, nextReply: DemoChat.reply(question.text, context) };
        message.state = 'pending'; delete message.progress;
        this.session.updated = Date.now();
        this.persist(); this.render(); this.finish(message);
      }
    }
  }
  return Conversation;
})();
