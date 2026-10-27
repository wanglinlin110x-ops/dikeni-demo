(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const nav = $('.demo-nav');
  const page = document.body.dataset.page;
  const isChatFlow = ['index', 'input', 'conversation'].includes(page);
  let chat;
  let attachments;
  let thinking = false;
  let activeOverlay;
  let overlayTrigger;
  let navigatingToChat = false;
  let feedbackMessage;
  let feedbackPreviousLike = false;
  let historyContext;
  const voiceInput = $('[data-name^="Text Input"]') ? new VoiceInput({
    root: $('.design-screen'), onSubmit: submitMessage, onError: toast, onStateChange: updateSend,
    onRecover: text => {
      const input = $('.message-input');
      if (input) { input.value = [input.value.trim(), text].filter(Boolean).join(' '); updateSend(); if (voiceInput?.mode !== 'compact' || voiceInput.restoreKeyboard) input.focus(); }
    },
    onBeforeStart: () => { attachments?.close(false); if (chat?.busy) chat.stop(); },
  }) : null;
  if (isChatFlow) {
    setupOverlays();
    const sizeSwitch = $('.font-size-switch');
    if (page === 'conversation') $('[data-name="Header"]').append(sizeSwitch);
    else sizeSwitch?.remove();
  }
  const activeLink = $(`a[href="${page}.html"]`, nav);
  activeLink?.setAttribute('aria-current', 'page');
  let toastTimer;
  function toast(message) {
    $('.toast').textContent = message;
    $('.toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('.toast').classList.remove('visible'), 2400);
  }
  function interactive(element, action, label) {
    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    if (label) element.setAttribute('aria-label', label);
    element.addEventListener('click', action);
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(event); }
    });
  }
  $('.nav-toggle').onclick = () => nav.classList.toggle('open');
  $$('[data-name^="Button -"]').forEach(button => {
    const name = button.dataset.name;
    if (name.endsWith(':align')) return;
    interactive(button, async () => {
      if (/菜单/.test(name) && isChatFlow) openOverlay('history', button);
      else if (/更多|回答选项/.test(name)) nav.classList.toggle('open');
      else if (/返回/.test(name)) DemoMotion.back();
      else if (/发送/.test(name)) send();
      else if (/滚动/.test(name)) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      else if (/复制/.test(name)) {
        try { await navigator.clipboard.writeText(button.closest('[data-name="Article"]')?.innerText || $('.design-screen').innerText); toast('已复制回答'); }
        catch { toast('当前浏览器未开放剪贴板权限'); }
      } else if (/不赞同|赞同/.test(name)) {
        const selected = button.classList.toggle('feedback-active');
        button.setAttribute('aria-pressed', String(selected));
        const icon = button.querySelector('img');
        if (icon) { icon.dataset.defaultSrc ||= icon.getAttribute('src'); icon.src = selected ? 'assets/5eff6.svg' : icon.dataset.defaultSrc; }
        toast(selected ? '已记录反馈' : '已取消反馈');
      }
      else if (/语音/.test(name)) {
        if (voiceInput) voiceInput.toggle();
        else toast('当前页面没有消息输入框');
      }
      else if (/附件/.test(name)) toast('附件功能将在后续版本接入');
      else if (/重新生成/.test(name)) toast('当前为预置回答，暂不支持重新生成');
      else if (/分享/.test(name)) toast('分享功能将在后续版本接入');
    }, name.replace('Button - ', ''));
  });
  if (voiceInput) {
    const microphone = $('[data-name="Button - 语音输入"]');
    microphone?.addEventListener('pointerdown', event => {
      voiceInput.restoreKeyboard = document.activeElement?.classList.contains('message-input');
      if (voiceInput.mode === 'compact') event.preventDefault();
    });
    voiceInput.bindPressGesture(microphone);
    voiceInput.bindModeSwitch($('[data-name="Button - 发送消息"], [data-name="Button - 发送"]'),
      () => !thinking && !chat?.busy && !activeOverlay && !navigatingToChat,
      mode => { syncVoiceComposer(); toast(mode === 'compact' ? '已切换为备选语音样式' : '已恢复当前语音样式'); });
  }
  document.addEventListener('demo-back', event => {
    if (voiceInput?.active) { event.preventDefault(); voiceInput.cancel(false); }
    else if (attachments && !attachments.panel.hidden) { event.preventDefault(); attachments.close(); }
    else if (activeOverlay) { event.preventDefault(); if (historyContext) closeHistoryContext(); else closeOverlay(); }
  });
  if (isChatFlow) {
    const screen = $('.design-screen');
    let swipe;
    screen.addEventListener('touchstart', event => {
      swipe = undefined;
      if (event.touches.length !== 1 || activeOverlay || voiceInput?.active || event.target.closest('input,textarea,button,a,[role="button"]')) return;
      const touch = event.touches[0];
      swipe = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    screen.addEventListener('touchmove', event => {
      if (!swipe || event.touches.length !== 1) { swipe = undefined; return; }
      const dx = event.touches[0].clientX - swipe.x;
      const dy = event.touches[0].clientY - swipe.y;
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { swipe = undefined; return; }
      if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.5 && (dx < 0 || page === 'index' || dx > 0 && swipe.x < 32)) event.preventDefault();
    }, { passive: false });
    screen.addEventListener('touchend', event => {
      const start = swipe; swipe = undefined;
      if (!start || !event.changedTouches.length || activeOverlay || voiceInput?.active) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) openOverlay('history', $('[data-name="Button - 打开菜单"]'));
      else if (dx > 0 && start.x < 32) DemoMotion.back();
    }, { passive: true });
    screen.addEventListener('touchcancel', () => { swipe = undefined; }, { passive: true });
  }
  $$('[data-name^="Text Input"]').forEach(wrapper => {
    const original = wrapper.textContent.trim();
    const input = document.createElement(voiceInput?.mode === 'compact' ? 'textarea' : 'input');
    input.className = 'message-input';
    input.setAttribute('aria-label', '发送消息');
    input.setAttribute('inputmode', 'text');
    input.setAttribute('enterkeyhint', 'send');
    input.autocomplete = 'off';
    input.placeholder = original === '本月' ? '发消息或按住说话...' : original;
    input.value = original === '本月' ? original : '';
    wrapper.replaceChildren(input);
    bindMessageInput(input);
  });
  if (isChatFlow) attachments = new ComposerAttachments({ root: $('.design-screen'), onChange: updateSend, onError: toast, onOpen: () => voiceInput?.cancel(false) });
  function bindMessageInput(input) {
    if (input.tagName === 'TEXTAREA') input.rows = 1;
    voiceInput?.bindComposerHold(input);
    input.addEventListener('input', updateSend);
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing && !event.shiftKey) { event.preventDefault(); if (!chat?.busy) send(); } });
  }
  function syncVoiceComposer() {
    const input = $('.message-input');
    if (!input) return;
    const tag = voiceInput.mode === 'compact' ? 'TEXTAREA' : 'INPUT';
    if (input.tagName !== tag) {
      const replacement = document.createElement(tag.toLowerCase());
      for (const attr of input.attributes) replacement.setAttribute(attr.name, attr.value);
      replacement.value = input.value;
      input.replaceWith(replacement);
      bindMessageInput(replacement);
    }
    updateSend();
  }
  function updateSend() {
    const input = $('.message-input');
    const button = $('[data-name="Button - 发送消息"], [data-name="Button - 发送"]');
    $('.design-screen')?.classList.toggle('voice-review', voiceInput?.mode === 'compact' && Boolean(input?.value.trim()));
    const enabled = Boolean(input?.value.trim() || attachments?.items.length) && !thinking && !voiceInput?.active && !attachments?.pending;
    if (button) {
      button.classList.toggle('is-stop', thinking);
      button.setAttribute('aria-label', thinking ? '停止生成' : '发送消息');
      button.classList.toggle('is-send-ready', enabled);
      button.style.backgroundColor = thinking ? '#07B1C7' : button.closest('.composer-attachments') ? 'transparent' : enabled ? '#07B1C7' : '#ddd';
      button.style.setProperty('--send-color', enabled ? '#07B1C7' : '#ddd');
      const icon = $('.s43 img', button);
      const asset = enabled ? 'assets/composer-send-enabled.svg' : 'assets/composer-send-disabled.svg';
      if (icon && icon.getAttribute('src') !== asset) icon.src = asset;
      button.setAttribute('aria-disabled', String(!enabled && !thinking));
    }
  }
  function send() {
    const input = $('.message-input');
    if (chat?.busy) { chat.stop(); return; }
    if (voiceInput?.active) return;
    submitMessage(input?.value || '');
  }
  function submitMessage(text) {
    const message = text.trim();
    if ((!message && !attachments?.items.length) || thinking || navigatingToChat || attachments?.pending) return;
    const files = attachments?.items.map(item => ({ ...item })) || [];
    voiceInput?.cancel(false);
    const input = $('.message-input');
    input?.blur();
    if (page === 'conversation') {
      if (chat.submit(message, files)) { input.value = ''; attachments?.clear(); updateSend(); }
    } else {
      navigatingToChat = true;
      if (['index', 'input'].includes(page)) ChatConversations.create();
      else if (['answer', 'trend', 'analysis'].includes(page)) ChatConversations.create({ network: 'wangchao', personId: 'dynasty-li', period: '2026年10月', scope: '全国门店', lastIntent: 'rank' });
      sessionStorage.setItem('demo-pending-message', message);
      sessionStorage.setItem('demo-pending-attachments', JSON.stringify(files));
      attachments?.clear();
      DemoMotion.navigate('conversation.html');
    }
  }
  updateSend();
  function updateSuggestionIcon(button) {
    const icon = $('.s29', button);
    if (!icon) return;
    const text = button.textContent.trim();
    // Icon names refer to the supplied Figma 41:13116 minimal outlined library.
    // Specific intents precede generic sales/customer terms.
    const iconFiles = {"User": "simple-a1133.svg", "LineChart": "simple-2983b.svg", "Car": "simple-b9004.svg", "Comment": "simple-a9335.svg", "Gift": "simple-e214c.svg", "BarChart": "simple-4fbb9.svg", "CheckList": "simple-3c9e5.svg", "Shop": "simple-b91a8.svg", "FileText": "simple-0a943.svg", "Layers": "simple-68f3a.svg", "Bulb": "simple-6f2be.svg", "Search": "simple-cd5bc.svg", "PieChart": "simple-b72aa.svg", "Sliders": "simple-faed8.svg"};
    const rules = [
      [/材料|跟进|记录|进展|示例/, 'FileText'],
      [/趋势|增长走势|近.*个月/, 'LineChart'],
      [/经验|方法|技巧/, 'Bulb'],
      [/冠军|销冠|最好|TOP\s*1|第一/i, 'User'],
      [/完成率|成交率|转化率/, 'CheckList'],
      [/占比|分布|结构/, 'PieChart'],
      [/配置|核心.*差异/, 'Sliders'],
      [/竞品|前脸/, 'Search'],
      [/库存|现车/, 'Layers'],
      [/门店|区域|战区/, 'Shop'],
      [/置换|补贴|权益|优惠|金融/, 'Gift'],
      [/车型|动力|Z9|N9|同价位/, 'Car'],
      [/销量|订单|交付|复盘/, 'BarChart'],
      [/客户|异议|有点贵|怎么接|话术/, 'Comment'],
    ];
    const name = rules.find(([pattern]) => pattern.test(text))?.[1] || 'Comment';
    icon.classList.remove('suggestion-emoji'); icon.classList.add('suggestion-icon');
    delete icon.dataset.emoji; icon.dataset.icon = name;
    icon.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img'); image.alt = '';
    image.src = `assets/${iconFiles[name]}`;
    icon.replaceChildren(image);
  }
  $$('[data-name="Section - 推荐问题"] .s28').forEach(updateSuggestionIcon);
  const championSuggestion = '本月销售冠军是谁？';
  const suggestionPool = [
    championSuggestion, '上月王朝网华南销冠是谁？', '本月 Z9 和 N9 销量对比', '客户说有点贵，怎么接？', '置换权益和金融优惠能叠加吗？',
    '本月销量复盘', '本月订单目标完成率是多少？', '本月订单量（分车型）', '上月销量怎么样？',
    '近6个月销量趋势', '各动力形式销量占比', '推荐几款同价位车型', '看看竞品新前脸',
    '门店区域归属查询', '置换补贴需要哪些材料？', '车型核心配置差异', '库存深度是什么意思？',
  ];
  const shuffle = items => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  };
  const homeQuestions = $$('[data-name="Section - 推荐问题"] .s28');
  const setQuestion = (button, text) => {
    const label = $('[data-name="Text"] p', button) || $('[data-name="Text"]', button) || [...button.children].find(child => child.textContent.trim());
    if (label && text) { button.dataset.question = text; label.textContent = window.DemoText?.format(text) || text; updateSuggestionIcon(button); }
  };
  if (homeQuestions.length) {
    let firstEntry = true;
    try {
      firstEntry = sessionStorage.getItem('demo-home-recommendations-seen') !== '1';
      sessionStorage.setItem('demo-home-recommendations-seen', '1');
    } catch { /* A restricted browser still supports random refreshes. */ }
    const initial = firstEntry ? [championSuggestion, ...shuffle(suggestionPool.filter(text => text !== championSuggestion)).slice(0, homeQuestions.length - 1)] : shuffle(suggestionPool).slice(0, homeQuestions.length);
    homeQuestions.forEach((button, index) => setQuestion(button, initial[index]));
  }
  const initialSuggestions = homeQuestions.map(item => item.dataset.question || item.textContent.trim());
  let unseenSuggestions = shuffle(suggestionPool.filter(text => !initialSuggestions.includes(text)));
  const routes = text => /增长|原因|成交|经验/.test(text) ? 'analysis.html' : /趋势|6个月|6 个月/.test(text) ? 'trend.html' : 'conversation.html';
  $$('[data-name="Button"]').forEach(button => {
    const text = button.textContent.trim();
    if (text === '换一换') interactive(button, () => {
      const container = $('[data-name="Section - 推荐问题"] [data-name="Container"]');
      if (!container) return;
      const buttons = $$('[data-name="Button"]', container);
      const visible = buttons.map(item => item.dataset.question || item.textContent.trim());
      const count = buttons.length;
      if (unseenSuggestions.length < count) {
        unseenSuggestions.push(...shuffle(suggestionPool.filter(text => !visible.includes(text) && !unseenSuggestions.includes(text))));
      }
      const next = unseenSuggestions.splice(0, count);
      buttons.forEach((item, index) => setQuestion(item, next[index]));
    });
    else if (text === '确定' || text === '跳过') interactive(button, () => toast(text === '确定' ? '已选择对比范围' : '已跳过范围选择'));
    else if (text === '重新生成') interactive(button, () => toast('当前为预置回答，暂不支持重新生成'));
    else if (!['图表', '表格'].includes(text)) interactive(button, () => {
      if (isChatFlow || ['answer', 'trend', 'analysis'].includes(page)) {
        submitMessage(button.textContent.trim());
      } else DemoMotion.navigate(routes(button.textContent.trim()));
    });
  });
  $$('[data-name="Field Set"]').forEach(field => {
    const options = $$('[data-name="Text"]', field).filter(element => ['全国门店', '粤桂琼战区', '腾势坪山4S店'].includes(element.textContent.trim()));
    options.forEach((option, index) => {
      option.setAttribute('aria-pressed', String(index === 0));
      interactive(option, () => options.forEach(item => { const selected = item === option; item.classList.toggle('selected-option', selected); item.setAttribute('aria-pressed', String(selected)); }));
    });
  });
  const chart = $('[data-node-id="1:117"]');
  if (chart) {
    const original = chart.innerHTML;
    const tabs = $$('[data-name="Button"]').filter(button => ['图表', '表格'].includes(button.textContent.trim()));
    tabs.forEach(tab => interactive(tab, () => {
      const isTable = tab.textContent.trim() === '表格';
      chart.innerHTML = isTable ? '<table class="inline-table"><thead><tr><th>车型</th><th>销量</th><th>占比</th></tr></thead><tbody><tr><td>汉 DM-i</td><td>19辆</td><td>50.0%</td></tr><tr><td>宋 PLUS DM-i</td><td>11辆</td><td>28.9%</td></tr><tr><td>秦 PLUS DM-i</td><td>6辆</td><td>15.8%</td></tr><tr><td>其他</td><td>2辆</td><td>5.3%</td></tr></tbody></table>' : original;
      DemoMotion.animate(chart, [{ opacity: .4 }, { opacity: 1 }], 180);
      tabs.forEach(item => { item.style.backgroundColor = item === tab ? '#efedf2' : 'transparent'; item.setAttribute('aria-pressed', String(item === tab)); });
    }));
  }
  $$('[data-name="Sources"]').forEach(source => {
    if (page === 'conversation') {
      source.setAttribute('aria-haspopup', 'dialog');
      source.setAttribute('aria-expanded', 'false');
      interactive(source, () => openOverlay('sources', source), '展开数据来源');
    } else interactive(source, () => toast('当前为设计示例，数据来源尚未接入'));
  });
  function setupOverlays() {
    const host = $('.design-screen');
    const history = document.createElement('div');
    history.className = 'ui-overlay history-overlay';
    history.dataset.overlay = 'history';
    history.hidden = true;
    history.innerHTML = `<button class="overlay-backdrop" aria-label="关闭侧边栏"></button>
      <aside class="history-panel" role="dialog" aria-modal="true" aria-labelledby="history-title" tabindex="-1">
        <div class="history-content">
          <header class="history-account"><img class="history-avatar" src="assets/account-chen-zhiyuan.png?v=20261027-small" alt="陈志远头像"><h2 id="history-title">陈志远</h2><div class="font-size-switch" role="group" aria-label="阅读字号"><button class="font-size-option" type="button" data-font-size-toggle="standard" aria-pressed="true">标准</button><button class="font-size-option" type="button" data-font-size-toggle="large" aria-pressed="false">大字</button></div></header>
          <nav class="history-list" aria-label="对话列表">
            <h3>置顶</h3><button class="history-main"><img src="assets/f56ba.png" alt="">主对话</button>
            <div class="history-pinned-list"></div><h3 class="history-recent-title">最近</h3>

          </nav>
        </div>
        <div class="history-footer"><button class="history-new"><img src="assets/151b1.svg" alt="">新建对话</button></div>
      </aside><div class="overlay-status" aria-hidden="true"></div><div class="overlay-home-indicator" aria-hidden="true"></div>`;
    const feedback = document.createElement('div');
    feedback.className = 'ui-overlay feedback-overlay';
    feedback.dataset.overlay = 'feedback';
    feedback.hidden = true;
    feedback.innerHTML = `<button class="overlay-backdrop" aria-label="关闭回答反馈遮罩"></button>
      <form class="feedback-sheet" role="dialog" aria-modal="true" aria-labelledby="feedback-title" tabindex="-1">
        <header class="feedback-header"><h2 id="feedback-title">回答反馈</h2><button class="feedback-close" type="button" aria-label="关闭回答反馈"><img src="assets/ab4c6.svg" alt=""></button></header>
        <p class="feedback-prompt">哪里需要改进？请选择原因或补充说明。</p>
        <div class="feedback-reasons" aria-label="反馈原因">${['没有解决问题', '回答不相关', '信息不准确', '格式有问题', '内容不当'].map(reason => `<button type="button" aria-pressed="false">${reason}</button>`).join('')}</div>
        <textarea class="feedback-comment" aria-label="其他原因或补充说明" placeholder="其他原因或补充说明" maxlength="1000"></textarea>
        <button class="feedback-submit" type="submit" disabled>提交反馈</button>
      </form>`;
    const context = document.createElement('section');
    context.className = 'history-context'; context.hidden = true;
    context.innerHTML = `<button class="history-context-veil" aria-label="关闭对话操作"></button>
      <div class="history-context-panel" role="dialog" aria-modal="true" aria-label="对话操作" tabindex="-1">
        <div class="history-context-preview"><img src="assets/f56ba.png" alt=""><span></span></div>
        <div class="history-context-actions">
          <button data-history-action="pin"><span>置顶</span><img src="assets/history-pin.svg" alt=""></button>
          <button data-history-action="rename"><span>编辑对话名称</span><img src="assets/history-edit.svg" alt=""></button>
          <button data-history-action="share"><span>分享对话</span><img src="assets/31ba3.svg" alt=""></button>
          <button data-history-action="delete"><span>从对话列表删除</span><img src="assets/history-trash.svg" alt=""></button>
        </div>
        <form class="history-rename" hidden><label for="history-title-input">编辑对话名称</label><input id="history-title-input" aria-label="对话名称" maxlength="60" autocomplete="off"><div><button type="button" data-history-action="cancel-rename">取消</button><button type="submit">保存</button></div></form>
      </div>`;
    history.append(context);
    host.append(history, feedback);
    $('.history-context-veil', context).addEventListener('click', closeHistoryContext);
    context.addEventListener('click', async event => {
      const action = event.target.closest('[data-history-action]')?.dataset.historyAction;
      if (!action || !historyContext) return;
      const session = ChatConversations.list().find(item => item.id === historyContext.id);
      if (!session) { closeHistoryContext(); refreshHistory(); return; }
      if (action === 'rename' || action === 'cancel-rename') {
        const editing = action === 'rename';
        $('.history-context-actions', context).hidden = editing;
        $('.history-rename', context).hidden = !editing;
        if (editing) { const input = $('input', context); input.value = session.title; input.dispatchEvent(new Event('input')); input.focus(); input.select(); }
        else $('[data-history-action="rename"]', context).focus();
        positionHistoryContext();
      } else if (action === 'share') {
        const text = session.messages.map(message => {
          if (message.role === 'user') return `用户：${message.text}`;
          if (message.state !== 'complete') return '迪客牛仔：（回答未完成）';
          const r = message.reply;
          if (!r) return '';
          if (r.kind === 'clarify') return `迪客牛仔：${r.question}\n${r.options.join('、')}`;
          return `迪客牛仔：${[r.title, ...(r.paragraphs || []), r.quote, r.nextStep, ...(r.metrics || []).map(([value, label]) => `${label}：${value}`), ...(r.rows || []).map(row => row.join(' · ')), ...(r.chart ? r.chart.labels.map((label, i) => `${label}：${r.chart.values[i]}`) : [])].filter(Boolean).join('\n')}`;
        }).filter(Boolean).join('\n\n');
        const data = { title: session.title, text };
        try {
          if (navigator.share && (!navigator.canShare || navigator.canShare(data))) { await navigator.share(data); closeHistoryContext(); }
          else { await navigator.clipboard.writeText(`${session.title}\n\n${text}`); closeHistoryContext(); toast('已复制对话内容，可粘贴分享'); }
        } catch (error) { if (error.name !== 'AbortError') toast('分享未完成，请重试'); }
      } else if (action === 'pin') {
        if (!ChatConversations.update(session.id, { pinned: !session.pinned })) { toast('保存未完成，请重试'); return; }
        closeHistoryContext(); refreshHistory();
      } else if (action === 'delete') {
        const deletingCurrent = chat?.session.id === session.id;
        if (deletingCurrent && chat.busy) chat.stop();
        if (!ChatConversations.remove(session.id)) { toast('删除未完成，请重试'); return; }
        closeHistoryContext();
        if (deletingCurrent) { DemoMotion.navigate('index.html'); return; }
        refreshHistory(); $('.history-recent', history)?.focus({ preventScroll: true });
      }
    });
    $('input', context).addEventListener('input', () => { $('.history-rename [type="submit"]', context).disabled = !$('input', context).value.trim(); });
    $('.history-rename', context).addEventListener('submit', event => {
      event.preventDefault(); if (!historyContext || !$('input', context).value.trim()) return;
      if (!ChatConversations.update(historyContext.id, { title: $('input', context).value })) { toast('保存未完成，请重试'); return; }
      closeHistoryContext(); refreshHistory();
    });
    $$('.overlay-backdrop, .feedback-close', host).forEach(button => button.addEventListener('click', closeOverlay));
    const updateFeedbackSubmit = () => {
      $('.feedback-submit', feedback).disabled = !$('.feedback-reasons [aria-pressed="true"]', feedback) && !$('.feedback-comment', feedback).value.trim();
      saveFeedbackDraft();
    };
    $$('.feedback-reasons button', feedback).forEach(button => button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      updateFeedbackSubmit();
    }));
    $('.feedback-comment', feedback).addEventListener('input', updateFeedbackSubmit);
    $('.feedback-sheet', feedback).addEventListener('submit', event => {
      event.preventDefault();
      if (!feedbackMessage || $('.feedback-submit', feedback).disabled) return;
      feedbackMessage.feedback = {
        reasons: $$('.feedback-reasons [aria-pressed="true"]', feedback).map(button => button.textContent),
        comment: $('.feedback-comment', feedback).value.trim(), submittedAt: Date.now(),
      };
      feedbackMessage.disliked = true; feedbackMessage.liked = false;
      chat.updateFeedbackIcons(feedbackMessage);
      delete feedbackMessage.feedbackDraft; feedbackMessage = undefined;
      chat.persist(); closeOverlay(); toast('反馈已保存在当前浏览器');
    });
    $('.history-main', history).addEventListener('click', () => {
      if (ChatConversations.list().length) DemoMotion.navigate('conversation.html'); else closeOverlay();
    });
    DemoFontSize.updateButtons();
    $$('[data-font-size-toggle]', history).forEach(button => button.addEventListener('click', () => {
      if ((button.dataset.fontSizeToggle === 'large') !== DemoFontSize.isLarge()) DemoFontSize.toggle();
    }));
    $('.history-new', history).addEventListener('click', () => {
      ChatConversations.create();
      sessionStorage.removeItem('demo-current-message');
      sessionStorage.removeItem('demo-pending-message');
      DemoMotion.navigate('index.html');
    });
    const recentList = document.createElement('div');
    recentList.className = 'history-recent-list';
    $('.history-list', history).append(recentList);
    $('.history-list', history).addEventListener('click', event => {
      const button = event.target.closest('[data-session-id]');
      if (!button) return;
      if (button.dataset.longPressed === 'true') { delete button.dataset.longPressed; return; }
      ChatConversations.activate(button.dataset.sessionId);
      DemoMotion.navigate('conversation.html');
    });
    document.addEventListener('keydown', event => {
      if (!activeOverlay) return;
      if (event.key === 'Escape') { event.preventDefault(); if (historyContext) closeHistoryContext(); else closeOverlay(); }
      if (event.key === 'Tab') {
        const scope = historyContext ? $('.history-context', activeOverlay) : activeOverlay;
        const buttons = $$('button:not(:disabled), textarea, input', scope).filter(node => node.getClientRects().length && !node.closest('[inert]'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === $('[role="dialog"]', scope))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
  }
  async function openOverlay(name, trigger) {
    voiceInput?.cancel(false);
    if (name === 'history') refreshHistory();
    if (activeOverlay) await closeOverlay();
    overlayTrigger = trigger;
    activeOverlay = $(`[data-overlay="${name}"]`);
    if (!activeOverlay) return;
    $('.message-input')?.blur();
    $('.design-screen').firstElementChild.inert = true;
    nav.inert = true;
    $('.nav-toggle').inert = true;
    activeOverlay.hidden = false;
    DemoMotion.overlay(activeOverlay, true);
    trigger?.setAttribute('aria-expanded', 'true');
    $('[role="dialog"]', activeOverlay).focus({ preventScroll: true });
  }
  function saveFeedbackDraft() {
    if (activeOverlay?.dataset.overlay !== 'feedback' || !feedbackMessage) return;
    const draft = {
      reasons: $$('.feedback-reasons [aria-pressed="true"]', activeOverlay).map(button => button.textContent),
      comment: $('.feedback-comment', activeOverlay).value,
    };
    chat?.setFeedbackDraft(feedbackMessage, draft, feedbackPreviousLike);
  }
  window.addEventListener('pagehide', saveFeedbackDraft);
  function closeOverlay() {
    if (!activeOverlay) return Promise.resolve();
    if (activeOverlay.closing) return activeOverlay.closing;
    saveFeedbackDraft();
    if (activeOverlay.dataset.overlay === 'feedback') {
      if (feedbackMessage?.disliked) toast('已记录这条回答的不满意反馈');
      feedbackMessage = undefined;
    }
    closeHistoryContext();
    const overlay = activeOverlay;
    // Keep the page inert until the exiting panel is fully off screen.
    overlay.style.pointerEvents = 'none';
    overlay.closing = DemoMotion.overlay(overlay, false).then(() => {
    overlay.hidden = true;
    overlay.style.pointerEvents = '';
    $('.design-screen').firstElementChild.inert = false;
    nav.inert = false;
    $('.nav-toggle').inert = false;
    overlayTrigger?.setAttribute('aria-expanded', 'false');
    overlayTrigger?.focus({ preventScroll: true });
    activeOverlay = undefined;
    overlay.closing = undefined;
    });
    return overlay.closing;
  }
  function positionHistoryContext() {
    if (!historyContext) return;
    const screen = $('.design-screen'), panel = $('.history-context-panel');
    const zoom = screen.getBoundingClientRect().width / screen.offsetWidth;
    panel.style.setProperty('--context-target', `${44 / zoom}px`);
    const mobile = document.documentElement.classList.contains('mobile-layout') && matchMedia('(max-width:900px)').matches;
    const margin = mobile ? 24 : 104, bottom = mobile ? 24 : 88;
    const available = screen.getBoundingClientRect().height / zoom;
    panel.style.maxHeight = `${Math.max(120, available - margin - bottom)}px`;
    const y = (historyContext.trigger.getBoundingClientRect().top - screen.getBoundingClientRect().top) / zoom;
    panel.style.top = `${Math.max(margin, Math.min(y, available - panel.offsetHeight - bottom))}px`;
  }
  function openHistoryContext(sessionId, trigger) {
    const session = ChatConversations.list().find(item => item.id === sessionId);
    if (!session) return;
    closeHistoryContext();
    historyContext = { id: sessionId, trigger };
    const context = $('.history-context');
    $('.history-context-preview span', context).textContent = session.title;
    $('[data-history-action="pin"] span', context).textContent = session.pinned ? '取消置顶' : '置顶';
    $('.history-context-actions', context).hidden = false; $('.history-rename', context).hidden = true;
    $('.history-panel').inert = true; $('.history-overlay > .overlay-backdrop').inert = true;
    context.hidden = false; trigger.setAttribute('aria-expanded', 'true'); positionHistoryContext();
    DemoMotion.animate($('.history-context-panel'), [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)' }], 150);
    $('.history-context-panel').focus({ preventScroll: true });
  }
  function closeHistoryContext() {
    if (!historyContext) return;
    const trigger = historyContext.trigger;
    $('.history-context').hidden = true;
    $('.history-panel').inert = false; $('.history-overlay > .overlay-backdrop').inert = false;
    trigger.setAttribute('aria-expanded', 'false');
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
    historyContext = undefined;
  }
  function bindHistoryLongPress(button) {
    let timer, start;
    const cancel = () => { clearTimeout(timer); start = undefined; };
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      delete button.dataset.longPressed;
      start = { x: event.clientX, y: event.clientY };
      timer = setTimeout(() => {
        if (activeOverlay?.dataset.overlay !== 'history' || activeOverlay.hidden || activeOverlay.closing || !button.isConnected) return;
        button.dataset.longPressed = 'true'; openHistoryContext(button.dataset.sessionId, button);
      }, 450);
    });
    button.addEventListener('pointermove', event => { if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(name => button.addEventListener(name, cancel));
    button.addEventListener('contextmenu', event => { event.preventDefault(); cancel(); button.dataset.longPressed = 'true'; if (historyContext?.id !== button.dataset.sessionId) openHistoryContext(button.dataset.sessionId, button); });
    button.addEventListener('keydown', event => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); openHistoryContext(button.dataset.sessionId, button); }
    });
  }
  function refreshHistory() {
    const list = $('.history-recent-list');
    if (!list) return;
    list.replaceChildren();
    const pinned = $('.history-pinned-list'); pinned.replaceChildren();
    const sessions = ChatConversations.list();
    let previousGroup;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    sessions.forEach(session => {
      const date = new Date(session.updated || 0);
      const group = date >= today ? '今天' : date >= yesterday ? '昨天' : '更早';
      if (!session.pinned && group !== previousGroup) {
        const heading = document.createElement('p'); heading.className = 'history-date-group'; heading.textContent = group; list.append(heading); previousGroup = group;
      }
      const button = document.createElement('button');
      button.className = 'history-recent';
      button.dataset.sessionId = session.id;
      button.setAttribute('aria-label', session.title);
      const title = document.createElement('span'); title.className = 'history-session-title'; title.textContent = session.title;
      button.append(title);
      if (session.id === ChatConversations.activeId()) { button.classList.add('selected'); button.setAttribute('aria-current', 'page'); }
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false');
      (session.pinned ? pinned : list).append(button);
      bindHistoryLongPress(button);
    });
    if (!sessions.length) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = '暂无历史对话';
      list.append(empty);
    }
  }
  if (page === 'conversation') {
    // Explicit review link opens the revised scenario without rewriting old turns.
    if (new URLSearchParams(location.search).get('preview') === 'champion-september') {
      ChatConversations.create();
      sessionStorage.removeItem('demo-pending-attachments');
      sessionStorage.setItem('demo-pending-message', '上个月王朝的销冠是谁？');
      history.replaceState(history.state, '', location.pathname + location.hash);
    }
    chat = new ChatConversations({
      host: $('[data-node-id="9:1388"]'),
      onBusy: value => { thinking = value; updateSend(); },
      onError: toast,
      onFeedback: (message, trigger) => {
        feedbackMessage = message;
        feedbackPreviousLike = Boolean(message.liked);
        const feedback = $('[data-overlay="feedback"]');
        const saved = message.feedbackDraft || message.feedback;
        $$('.feedback-reasons button', feedback).forEach(button => button.setAttribute('aria-pressed', String(Boolean(saved?.reasons.includes(button.textContent)))));
        $('.feedback-comment', feedback).value = saved?.comment || '';
        $('.feedback-submit', feedback).disabled = !saved?.reasons.length && !saved?.comment.trim();
        openOverlay('feedback', trigger);
      },
    });
    const pending = sessionStorage.getItem('demo-pending-message');
    sessionStorage.removeItem('demo-pending-message');
    let files = [];
    try { files = JSON.parse(sessionStorage.getItem('demo-pending-attachments') || '[]'); } catch {}
    sessionStorage.removeItem('demo-pending-attachments');
    if (pending || files.length) chat.submit(pending || '', files);
  }
  // Fill narrow viewports while retaining the 750px design canvas.
  function fitSmallScreen() {
    const mobile = document.documentElement.classList.contains('mobile-layout') && matchMedia('(max-width:900px)').matches;
    const shell = $('.screen-shell');
    const insets = getComputedStyle(shell);
    const horizontalInset = mobile ? parseFloat(insets.paddingLeft) + parseFloat(insets.paddingRight) : 0;
    
    const viewport = window.visualViewport;
    // CSS dvh covers the installed app, including the home-indicator background.
    // visualViewport can lag behind it; shrink only for a keyboard or viewport pan.
    const viewportHeight = viewport?.height || innerHeight;
    const fullHeight = mobile ? shell.clientHeight : innerHeight;
    const focusedInput = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
    const keyboard = viewport && (viewport.offsetTop > 0 ||
      fullHeight - viewportHeight > 120 && (focusedInput || viewportHeight < fullHeight * .75));
    const homeKeyboard = mobile && ['index', 'input'].includes(page) && fullHeight - viewportHeight > 120 && Boolean(focusedInput || viewportHeight < fullHeight * .75);
    $('.design-screen').classList.toggle('home-keyboard', homeKeyboard);
    const mobileHeight = keyboard ? viewportHeight : Math.max(fullHeight, viewportHeight);
    const occlusion = mobile ? Math.max(0, fullHeight - mobileHeight - (viewport?.offsetTop || 0)) : 0;
    document.documentElement.style.setProperty('--viewport-occlusion', `${occlusion}px`);
    shell.style.position = mobile ? 'relative' : '';
    shell.style.top = mobile ? `${viewport?.offsetTop || 0}px` : '';
    const mobileWidth = document.documentElement.clientWidth;
    const width = mobile ? mobileWidth - horizontalInset : 375;
    $('.design-screen').style.zoom = String(width / 750);
    shell.style.width = (mobile ? mobileWidth : width) + 'px';
    const canvas = document.querySelector('.design-screen');
    canvas.style.setProperty('--home-keyboard-gap', `${56 * 750 / width}px`);
    canvas.style.setProperty('--home-keyboard-composer', `${50 * 750 / width}px`);
    canvas.style.setProperty('--voice-tap-target', `${44 * 750 / width}px`);
    canvas.style.setProperty('--safe-top', `calc(env(safe-area-inset-top, 0px) * ${750 / width})`);
    canvas.style.setProperty('--safe-bottom', `calc(var(--native-safe-bottom) * ${750 / width})`);
    if (isChatFlow) {
      const height = mobile ? Math.max(1, mobileHeight) : 812;
      $('.design-screen').style.setProperty('--canvas-height', `${height * 750 / width}px`);
    }
  }
  fitSmallScreen();
  window.addEventListener('pageshow', () => { navigatingToChat = false; updateSend(); fitSmallScreen(); });
  window.addEventListener('resize', fitSmallScreen);
  document.addEventListener('focusin', () => requestAnimationFrame(fitSmallScreen));
  document.addEventListener('focusout', () => requestAnimationFrame(fitSmallScreen));
  window.visualViewport?.addEventListener('resize', fitSmallScreen);
  window.visualViewport?.addEventListener('scroll', fitSmallScreen);
  window.addEventListener('resize', positionHistoryContext);
  window.visualViewport?.addEventListener('resize', positionHistoryContext);
  document.addEventListener('demo-font-change', positionHistoryContext);
})();
