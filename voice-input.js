// Native speech recognition supplies text; Web Audio supplies the live waveform.
class VoiceInput {
  constructor({ root, onSubmit, onError, onStateChange, onBeforeStart, onRecover }) {
    Object.assign(this, { root, onSubmit, onError, onStateChange, onBeforeStart, onRecover });
    this.session = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    try { this.mode = sessionStorage.getItem('demo-voice-style') === 'compact' ? 'compact' : 'current'; } catch { this.mode = 'current'; }
    this.root.classList.toggle('voice-alt', this.mode === 'compact');
    this.panel = document.createElement('section');
    this.panel.className = 'voice-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('aria-label', '语音输入');
    this.panel.innerHTML = `<p class="voice-instruction" role="status" aria-live="polite"></p>
      <button class="voice-wave" type="button" aria-label="结束语音并发送识别文字">${'<i></i>'.repeat(30)}</button>`;
    root.append(this.panel);
    this.legacyPanel = this.panel;
    this.compactPanel = document.createElement('section');
    this.compactPanel.className = 'voice-compact';
    this.compactPanel.hidden = true;
    this.compactPanel.setAttribute('aria-label', '语音听写');
    this.compactPanel.innerHTML = `<p class="voice-compact-hint" role="status" aria-live="polite"></p>
      <button type="button" data-voice-action="cancel" aria-label="取消录音">×</button>
      <div class="voice-compact-wave" aria-hidden="true">${'<i></i>'.repeat(30)}</div>
      <button type="button" data-voice-action="review" aria-label="停止录音并转成文字"><span></span></button>
      <button type="button" data-voice-action="send" aria-label="结束录音并发送"><img src="assets/eda6e.svg" alt=""></button>`;
    this.composer = root.querySelector('[data-name^="Text Input"]')?.parentElement;
    this.composer?.append(this.compactPanel);
    this.compactPanel.addEventListener('pointerdown', event => event.preventDefault());
    this.compactPanel.addEventListener('click', event => {
      const action = event.target.closest('[data-voice-action]')?.dataset.voiceAction;
      if (action === 'cancel') this.cancel(false);
      else if (action) this.finish(action === 'send');
    });
    this.bars = [...this.panel.querySelectorAll('i')];
    this.restHeights = [16.657,16.657,16.657,16.657,16.657,16.657,8.634,20.5,14.384,24.503,32.102,15.242,42.641,35.729,53.318,46.923,43.69,20.735,33.574,45.363,20.585,26.546,25.255,38.554,16.657,16.657,16.657,16.657,16.657,16.657];
    this.panel.querySelector('button').addEventListener('click', () => {
      if (!this.suppressClick) this.finish();
    });
    for (const panel of [this.legacyPanel, this.compactPanel]) {
      for (const name of ['selectstart', 'contextmenu', 'dragstart']) panel.addEventListener(name, event => event.preventDefault());
      panel.addEventListener('pointerdown', event => { event.preventDefault(); document.getSelection()?.removeAllRanges(); });
    }
    this.bindSwipe(this.panel);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.active) { event.preventDefault(); this.cancel(); }
    });
    document.addEventListener('selectstart', event => { if (this.active) event.preventDefault(); }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(false); });
    window.addEventListener('pagehide', () => this.cancel(false));
  }
  get active() { return Boolean(this.session); }
  toggle() {
    if (this.suppressClick) return;
    if (this.active) this.finish();
    else this.start();
  }
  instruction(text) { this.panel.querySelector('p').textContent = text; }
  switchMode() {
    if (this.active) return;
    this.mode = this.mode === 'compact' ? 'current' : 'compact';
    try { sessionStorage.setItem('demo-voice-style', this.mode); } catch { /* Use the selected mode on this page. */ }
    this.root.classList.toggle('voice-alt', this.mode === 'compact');
    return this.mode;
  }
  bindModeSwitch(button, canSwitch, onSwitch) {
    if (!button) return;
    let timer, press, switched = false, suppressClick = false;
    const clear = () => { clearTimeout(timer); press = null; };
    button.style.touchAction = 'none';
    button.style.webkitTouchCallout = 'none';
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary || this.active || !canSwitch()) return;
      clear(); switched = false; suppressClick = false;
      press = { x: event.clientX, y: event.clientY };
      button.setPointerCapture(event.pointerId);
      timer = setTimeout(() => {
        if (!press || this.active || !canSwitch()) return;
        switched = suppressClick = true;
        onSwitch(this.switchMode());
      }, 1200);
    });
    button.addEventListener('pointermove', event => {
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
        suppressClick = true; clear();
      }
    });
    button.addEventListener('pointerup', () => { clear(); if (switched) setTimeout(() => { suppressClick = false; }, 500); });
    button.addEventListener('pointercancel', () => { clear(); suppressClick = true; });
    button.addEventListener('lostpointercapture', clear);
    button.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
    }, true);
    window.addEventListener('pagehide', clear);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  }
  start(held = false) {
    if (this.active) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { this.onError('当前浏览器不支持语音识别，请在支持语音识别的 Chrome 或 Safari 中打开'); return; }
    this.onBeforeStart?.();
    const compact = this.mode === 'compact' && !held;
    this.panel = compact ? this.compactPanel : this.legacyPanel;
    this.bars = [...this.panel.querySelectorAll('i')];
    this.panel.querySelectorAll('button').forEach(button => { button.disabled = false; });
    const session = { held, compact, draft: this.root.querySelector('.message-input')?.value.trim() || '', submit: !compact, finalText: '', frame: 0, starting: true, ending: false, heights: [...this.restHeights] };
    this.session = session;
    document.getSelection()?.removeAllRanges();
    if (!compact) this.root.querySelector('.message-input')?.blur();
    this.composer?.classList.add('voice-recording');
    this.panel.getAnimations().forEach(animation => animation.cancel());
    this.panel.hidden = false;
    window.DemoMotion?.animate(this.panel, [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'translateY(0)' }], 200);
    this.panel.dataset.state = 'requesting'; this.instruction('正在开启语音识别...'); this.onStateChange();
    try {
      session.recognition = new Recognition();
      session.recognition.lang = 'zh-CN';
      // Push-to-talk uses the same one-utterance recognizer as a normal voice tap.
      // Only the explicit dictation/review mode needs continuous recognition.
      session.recognition.continuous = compact;
      session.recognition.interimResults = true;
      session.recognition.onstart = () => {
        if (this.session !== session) return;
        session.starting = false; clearTimeout(session.startDeadline);
        if (session.ending) { this.stopRecognition(session); return; }
        this.panel.dataset.state = 'listening';
        this.instruction(compact ? '正在聆听…' : held ? '松手发送，上移取消' : '说完自动发送，点击结束');
        if (session.analyser) this.draw(session);
        else if (this.isIOS) this.drawActivity(session);
        this.watchResponse(session);
        session.limit = setTimeout(() => this.finish(), 60000);
      };
      session.recognition.onresult = event => {
        if (this.session !== session) return;
        const results = Array.from(event.results || []);
        if (!results.length) return; // An empty event must not erase a completed transcript.
        this.watchResponse(session);
        session.partialText = results.map(result => result[0].transcript).join('').trim();
        session.finalText = results.filter(result => result.isFinal).map(result => result[0].transcript).join('').trim();
        session.hasInterim = results.some(result => !result.isFinal && result[0].transcript.trim());
      };
      session.recognition.onspeechstart = () => {
        if (this.session !== session || session.ending) return;
        session.speaking = true; clearTimeout(session.speechEndDeadline); this.watchResponse(session);
      };
      session.recognition.onspeechend = () => {
        if (this.session !== session || session.ending) return;
        session.speaking = false;
        // Let the browser finalize naturally; a pause is not an immediate stop.
        if (!compact && !held) {
          clearTimeout(session.speechEndDeadline);
          session.speechEndDeadline = setTimeout(() => { if (this.session === session) this.finish(); }, 1400);
        }
      };
      session.recognition.onerror = event => {
        if (this.session !== session) return;
        const messages = { 'not-allowed': '麦克风或语音识别权限被拒绝，请在浏览器设置中允许后重试', 'service-not-allowed': '浏览器未允许语音识别服务，请检查浏览器权限', 'audio-capture': '无法使用麦克风，请检查设备后重试', 'no-speech': '没有听清，请再说一次', network: '语音识别服务连接失败，请检查网络后重试', 'language-not-supported': '当前浏览器的语音识别服务不支持中文' };
        this.fail(session, messages[event.error] || '语音识别未完成，请重试');
      };
      session.recognition.onend = () => {
        if (this.session !== session) return;
        session.recognitionEnded = true;
        clearTimeout(session.responseDeadline); clearTimeout(session.speechEndDeadline);
        if (session.held && !session.ending) {
          session.starting = false; session.recognitionEnded = true;
          clearTimeout(session.limit); clearTimeout(session.startDeadline); cancelAnimationFrame(session.frame);
          this.releaseAudio(session); this.panel.dataset.state = 'ready';
          this.instruction(session.hasInterim ? '识别未完成，松手后保留文字' : session.finalText ? '已识别，松手发送，上移取消' : '没有听清，松手后再试一次');
          return;
        }
        this.complete(session);
      };
      // Recognition starts before any awaited microphone/AudioContext work.
      session.recognition.start();
      if (this.session === session && session.starting) session.startDeadline = setTimeout(() => this.fail(session, '语音识别启动超时，请检查权限或网络后重试'), 12000);
      // iOS owns a single speech audio session: a second capture for metering can interrupt it.
      if (this.session === session && !this.isIOS) this.startMeter(session);
    } catch { this.fail(session, '无法启动语音输入，请检查麦克风权限后重试'); }
  }
  watchResponse(session) {
    clearTimeout(session.responseDeadline);
    if (session.ending) return;
    session.responseDeadline = setTimeout(() => this.fail(session, '语音服务未返回结果，请检查网络及语音识别权限后重试'), 20000);
  }
  drawActivity(session) {
    if (this.session !== session || session.ending || session.recognitionEnded) return;
    // Speech activity only; iOS cannot expose true volume without a second microphone capture.
    const pulse = session.speaking ? .75 + .25 * Math.sin(performance.now() / 130) : .35;
    this.bars.forEach((bar, index) => {
      const target = session.compact ? 6 + (this.restHeights[index] - 6) * pulse * .65 : this.restHeights[index] * (.7 + .3 * pulse);
      session.heights[index] += (target - session.heights[index]) * .25;
      bar.style.height = `${session.heights[index].toFixed(2)}px`;
    });
    session.frame = requestAnimationFrame(() => this.drawActivity(session));
  }
  complete(session) {
    if (this.session !== session) return;
    const text = session.finalText;
    const unfinished = session.hasInterim || !text && Boolean(session.partialText);
    this.cleanup(session);
    if (unfinished) {
      this.onRecover?.(session.partialText || text || '');
      this.onError('识别尚未完成，已保留原文，请检查后发送');
      return;
    }
    if (text) { if (session.submit) this.onSubmit(session.compact ? [session.draft, text].filter(Boolean).join(' ') : text); else this.onRecover?.(text); }
    else { this.onRecover?.(session.partialText || ''); this.onError(session.partialText ? '识别未完成，已保留文字，请检查后发送' : '未识别到文字，请再说一次'); }
  }
  async startMeter(session) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || !navigator.mediaDevices?.getUserMedia) return;
    try {
      session.audio = new Audio();
      const resume = session.audio.resume(); resume.catch(() => {});
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (this.session !== session || session.recognitionEnded) { session.stream.getTracks().forEach(track => track.stop()); return; }
      await resume;
      if (this.session !== session) return;
      session.source = session.audio.createMediaStreamSource(session.stream);
      session.analyser = session.audio.createAnalyser(); session.analyser.fftSize = 256; session.analyser.smoothingTimeConstant = .7;
      session.source.connect(session.analyser);
      session.samples = new Uint8Array(session.analyser.fftSize); session.frequencies = new Uint8Array(session.analyser.frequencyBinCount);
      if (!session.starting && !session.ending) this.draw(session);
    } catch { this.releaseAudio(session); /* The optional visualizer must never block dictation. */ }
  }
  draw(session) {
    if (this.session !== session || session.ending || !session.analyser) return;
    const { analyser, samples, frequencies } = session;
    analyser.getByteTimeDomainData(samples);
    analyser.getByteFrequencyData(frequencies);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
    const level = Math.min(1, rms * 7);
    this.bars.forEach((bar, index) => {
      const band = frequencies[Math.min(frequencies.length - 1, 1 + index * 2)] / 255;
      const center = 0.35 + 0.65 * Math.sin(Math.PI * index / (this.bars.length - 1));
      const target = session.compact ? Math.min(42, 6 + 48 * level * (0.45 + 0.55 * band) * center) : Math.min(56, this.restHeights[index] + 50 * level * (0.45 + 0.55 * band) * center);
      session.heights[index] += (target - session.heights[index]) * 0.3;
      bar.style.height = `${session.heights[index].toFixed(2)}px`;
    });
    session.frame = requestAnimationFrame(() => this.draw(session));
  }
  finish(submit) {
    const session = this.session;
    if (!session || session.ending) return;
    if (session.compact) session.submit = submit === true;
    session.ending = true;
    if (session.starting) {
      this.panel.dataset.state = 'recognizing'; this.instruction('正在等待语音就绪并完成识别…');
      return; // A release during the permission/start handshake is fulfilled once onstart arrives.
    }
    if (session.recognitionEnded) this.complete(session); else this.stopRecognition(session);
  }
  stopRecognition(session) {
    this.panel.dataset.state = 'recognizing';
    this.instruction(session.compact ? '正在转成文字…' : '正在识别...');
    this.panel.querySelectorAll('[data-voice-action]:not([data-voice-action=cancel])').forEach(button => { button.disabled = true; });
    if (this.session !== session || !session.recognition || session.stopRequested) return;
    session.stopRequested = true;
    clearTimeout(session.limit); clearTimeout(session.responseDeadline); clearTimeout(session.speechEndDeadline);
    cancelAnimationFrame(session.frame);
    // Keep the microphone alive until onend delivers the final recognition result.
    session.deadline = setTimeout(() => this.fail(session, '语音识别超时，请重试'), 8000);
    try { session.recognition.stop(); }
    catch { this.fail(session, '语音识别未完成，请重试'); return; }
  }
  releaseAudio(session) {
    session.stream?.getTracks().forEach(track => track.stop());
    try { session.source?.disconnect(); } catch { /* Already disconnected. */ }
    if (session.audio && session.audio.state !== 'closed') session.audio.close().catch(() => {});
  }
  cleanup(session) {
    if (this.session !== session) return;
    this.session = null;
    clearTimeout(session.startDeadline);
    clearTimeout(session.limit);
    clearTimeout(session.deadline);
    clearTimeout(session.responseDeadline);
    clearTimeout(session.speechEndDeadline);
    cancelAnimationFrame(session.frame);
    this.releaseAudio(session);
    try { session.recognition?.abort(); } catch { /* Already ended. */ }
    this.panel.hidden = true;
    this.composer?.classList.remove('voice-recording');
    this.panel.classList.remove('voice-cancel');
    this.bars.forEach(bar => bar.style.height = '6px');
    this.onStateChange();
  }
  fail(session, message) { if (this.session === session) { const text = session.partialText || session.finalText; this.cleanup(session); if (text) this.onRecover?.(text); this.onError(text ? `${message}，已保留识别文字` : message); } }
  cancel(notify = true) {
    if (!this.active) return;
    this.cleanup(this.session);
    if (notify) this.onError('已取消语音输入');
  }
  suppressNextClick() {
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 400);
  }
  bindComposerHold(input) {
    const surface = this.composer || input;
    let press;
    const clear = () => { if (press) clearTimeout(press.timer); };
    input.style.touchAction = 'none';
    input.style.webkitTouchCallout = 'none';
    input.addEventListener('contextmenu', event => { if (press || this.active) event.preventDefault(); });
    input.addEventListener('selectstart', event => { if (press || this.active) event.preventDefault(); });
    const restoreInput = () => { if (press) input.readOnly = press.wasReadOnly; input.classList.remove('voice-hold-pending'); };
    input.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary || this.active) return;
      this.suppressClick = false;
      clear();
      // A short tap still opens the keyboard; a hold keeps it out of the way.
      event.preventDefault();
      const wasReadOnly = input.readOnly;
      input.readOnly = true; input.classList.add('voice-hold-pending');
      document.getSelection()?.removeAllRanges();
      const current = { wasReadOnly, id: event.pointerId, x: event.clientX, y: event.clientY, held: false, moved: false };
      press = current;
      surface.setPointerCapture(event.pointerId);
      current.timer = setTimeout(() => {
        if (press !== current || current.moved || !input.isConnected || document.hidden) return;
        current.held = true;
        document.getSelection()?.removeAllRanges();
        if (typeof input.selectionEnd === 'number') input.setSelectionRange(input.selectionEnd, input.selectionEnd);
        input.blur();
        this.start(true);
      }, 450);
    });
    document.addEventListener('pointermove', event => {
      if (!press || press.id !== event.pointerId) return;
      if (!press.held) {
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) { press.moved = true; clear(); }
        return;
      }
      if (!this.active) return;
      press.cancel = press.y - event.clientY > 60;
      this.panel.classList.toggle('voice-cancel', press.cancel);
      this.instruction(press.cancel ? '松手取消' : '松手发送，上滑取消');
    });
    document.addEventListener('pointerup', event => {
      if (!press || press.id !== event.pointerId) return;
      clear(); restoreInput(); const current = press; press = undefined;
      if (current.held) {
        this.suppressNextClick();
        if (current.cancel) this.cancel(false); else this.finish(true);
      } else if (!current.moved) input.focus();
    });
    const abort = event => {
      if (event?.pointerId !== undefined && press?.id !== event.pointerId) return;
      clear(); restoreInput(); if (press?.held) this.cancel(false); press = undefined;
    };
    // Capture may be lost when the input is blurred/hidden; it is not a release.
    // The document still receives the matching pointerup or pointercancel.
    document.addEventListener('pointercancel', abort);
    surface.addEventListener('click', event => { if (this.suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); input.blur(); } }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) abort(); });
    window.addEventListener('pagehide', abort);
  }
  bindPressGesture(button) {
    if (!button) return;
    const surface = this.composer || button;
    button.style.touchAction = 'none';
    button.style.webkitTouchCallout = 'none';
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('selectstart', event => event.preventDefault());
    let timer, pointerId, held = false, startY = 0, cancel = false;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary || this.active) return;
      this.suppressClick = false;
      if (this.mode === 'compact') return;
      event.preventDefault(); document.getSelection()?.removeAllRanges();
      pointerId = event.pointerId;
      startY = event.clientY;
      cancel = false;
      held = false;
      button.setPointerCapture(event.pointerId);
      timer = setTimeout(() => { held = true; surface.setPointerCapture(event.pointerId); this.start(true); }, 250);
    });
    document.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId || !held || !this.active) return;
      cancel = startY - event.clientY > 60;
      this.panel.classList.toggle('voice-cancel', cancel);
      this.instruction(cancel ? '松手取消' : '松手发送，上移取消');
    });
    document.addEventListener('pointerup', event => {
      if (event.pointerId !== pointerId) return;
      pointerId = undefined;
      clearTimeout(timer);
      if (!held) return;
      this.suppressNextClick();
      if (cancel) this.cancel(); else this.finish();
      held = false;
    });
    const abort = event => {
      if (event?.pointerId !== undefined && event.pointerId !== pointerId) return;
      clearTimeout(timer); pointerId = undefined;
      if (held) { held = false; this.suppressNextClick(); this.cancel(false); }
    };
    document.addEventListener('pointercancel', abort);
    document.addEventListener('visibilitychange', () => { if (document.hidden) abort(); });
    window.addEventListener('pagehide', abort);
  }
  bindSwipe(element) {
    let startY;
    element.addEventListener('pointerdown', event => { startY = event.clientY; });
    element.addEventListener('pointermove', event => {
      if (startY === undefined || !this.active) return;
      const cancel = startY - event.clientY > 60;
      this.panel.classList.toggle('voice-cancel', cancel);
      this.instruction(cancel ? '松手取消' : '说完自动发送，点击结束');
    });
    element.addEventListener('pointerup', event => {
      if (startY !== undefined && startY - event.clientY > 60) { this.suppressNextClick(); this.cancel(); }
      startY = undefined;
    });
    element.addEventListener('pointercancel', () => { startY = undefined; this.cancel(); });
  }
}
