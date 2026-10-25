// Native speech recognition supplies text; Web Audio supplies the live waveform.
class VoiceInput {
  constructor({ root, onSubmit, onError, onStateChange, onBeforeStart, onRecover }) {
    Object.assign(this, { root, onSubmit, onError, onStateChange, onBeforeStart, onRecover });
    this.session = null;
    this.panel = document.createElement('section');
    this.panel.className = 'voice-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('aria-label', '语音输入');
    this.panel.innerHTML = `<p class="voice-instruction" role="status" aria-live="polite"></p>
      <button class="voice-wave" type="button" aria-label="结束语音并发送识别文字">${'<i></i>'.repeat(30)}</button>`;
    root.append(this.panel);
    this.bars = [...this.panel.querySelectorAll('i')];
    this.restHeights = [16.657,16.657,16.657,16.657,16.657,16.657,8.634,20.5,14.384,24.503,32.102,15.242,42.641,35.729,53.318,46.923,43.69,20.735,33.574,45.363,20.585,26.546,25.255,38.554,16.657,16.657,16.657,16.657,16.657,16.657];
    this.panel.querySelector('button').addEventListener('click', () => {
      if (!this.suppressClick) this.finish();
    });
    this.bindSwipe(this.panel);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.active) { event.preventDefault(); this.cancel(); }
    });
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
  async start(held = false) {
    if (this.active) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Recognition || !Audio || !navigator.mediaDevices?.getUserMedia) {
      this.onError('当前浏览器不支持语音识别，请在支持语音识别的 Chrome 或 Safari 中打开');
      return;
    }
    this.onBeforeStart?.();
    const session = { held, finalText: '', frame: 0, ending: false, heights: [...this.restHeights] };
    this.session = session;
    this.root.querySelector('.message-input')?.blur();
    this.panel.getAnimations().forEach(animation => animation.cancel());
    this.panel.hidden = false;
    window.DemoMotion?.animate(this.panel, [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'translateY(0)' }], 200);
    this.panel.dataset.state = 'requesting';
    this.instruction('正在开启麦克风...');
    this.onStateChange();
    try {
      // Resume during the user gesture, before awaiting microphone permission.
      session.audio = new Audio();
      const resume = session.audio.resume();
      resume.catch(() => {});
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (this.session !== session) { session.stream.getTracks().forEach(track => track.stop()); return; }
      await resume;
      if (this.session !== session) return;
      session.source = session.audio.createMediaStreamSource(session.stream);
      session.analyser = session.audio.createAnalyser();
      session.analyser.fftSize = 256;
      session.analyser.smoothingTimeConstant = 0.7;
      session.source.connect(session.analyser);
      session.samples = new Uint8Array(session.analyser.fftSize);
      session.frequencies = new Uint8Array(session.analyser.frequencyBinCount);
      session.recognition = new Recognition();
      session.recognition.lang = 'zh-CN';
      session.recognition.continuous = false;
      session.recognition.interimResults = true;
      session.recognition.onresult = event => {
        if (this.session !== session) return;
        session.partialText = Array.from(event.results).map(result => result[0].transcript).join('').trim();
        session.finalText = Array.from(event.results).filter(result => result.isFinal).map(result => result[0].transcript).join('').trim();
      };
      session.recognition.onspeechend = () => this.finish();
      session.recognition.onerror = event => {
        if (this.session !== session) return;
        const messages = { 'not-allowed': '麦克风或语音识别权限被拒绝，请在浏览器设置中允许后重试', 'service-not-allowed': '浏览器未允许语音识别服务，请检查浏览器权限', 'audio-capture': '无法使用麦克风，请检查设备后重试', 'no-speech': '没有听清，请再说一次', network: '语音识别服务连接失败，请检查网络后重试', 'language-not-supported': '当前浏览器的语音识别服务不支持中文' };
        this.fail(session, messages[event.error] || '语音识别未完成，请重试');
      };
      session.recognition.onend = () => {
        if (this.session !== session) return;
        const text = session.finalText;
        this.cleanup(session);
        if (text) this.onSubmit(text);
        else { this.onRecover?.(session.partialText || ''); this.onError(session.partialText ? '识别未完成，已保留文字，请检查后发送' : '未识别到文字，请再说一次'); }
      };
      session.recognition.start();
      this.panel.dataset.state = 'listening';
      this.instruction(held ? '松手发送，上移取消' : '说完自动发送，点击结束');
      this.draw(session);
      session.limit = setTimeout(() => this.finish(), 60000);
      if (session.ending) this.stopRecognition(session);
    } catch (error) {
      if (this.session !== session) return;
      this.fail(session, error.name === 'NotAllowedError' ? '麦克风权限被拒绝，请在浏览器设置中允许后重试' : '无法启动语音输入，请检查麦克风后重试');
    }
  }
  draw(session) {
    if (this.session !== session || session.ending) return;
    const { analyser, samples, frequencies } = session;
    analyser.getByteTimeDomainData(samples);
    analyser.getByteFrequencyData(frequencies);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
    const level = Math.min(1, rms * 7);
    this.bars.forEach((bar, index) => {
      const band = frequencies[Math.min(frequencies.length - 1, 1 + index * 2)] / 255;
      const center = 0.35 + 0.65 * Math.sin(Math.PI * index / (this.bars.length - 1));
      const target = Math.min(56, this.restHeights[index] + 50 * level * (0.45 + 0.55 * band) * center);
      session.heights[index] += (target - session.heights[index]) * 0.3;
      bar.style.height = `${session.heights[index].toFixed(2)}px`;
    });
    session.frame = requestAnimationFrame(() => this.draw(session));
  }
  finish() {
    const session = this.session;
    if (!session || session.ending) return;
    session.ending = true;
    this.stopRecognition(session);
  }
  stopRecognition(session) {
    this.panel.dataset.state = 'recognizing';
    this.instruction('正在识别...');
    if (!session.recognition) return; // Permission is still pending; honor release once ready.
    cancelAnimationFrame(session.frame);
    this.releaseAudio(session);
    try { session.recognition.stop(); }
    catch { this.fail(session, '语音识别未完成，请重试'); return; }
    session.deadline = setTimeout(() => this.fail(session, '语音识别超时，请重试'), 8000);
  }
  releaseAudio(session) {
    session.stream?.getTracks().forEach(track => track.stop());
    session.source?.disconnect();
    if (session.audio && session.audio.state !== 'closed') session.audio.close().catch(() => {});
  }
  cleanup(session) {
    if (this.session !== session) return;
    this.session = null;
    clearTimeout(session.limit);
    clearTimeout(session.deadline);
    cancelAnimationFrame(session.frame);
    this.releaseAudio(session);
    try { session.recognition?.abort(); } catch { /* Already ended. */ }
    this.panel.hidden = true;
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
  bindPressGesture(button) {
    if (!button) return;
    button.style.touchAction = 'none';
    let timer, held = false, startY = 0, cancel = false;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.active) return;
      startY = event.clientY;
      cancel = false;
      held = false;
      button.setPointerCapture(event.pointerId);
      timer = setTimeout(() => { held = true; this.start(true); }, 250);
    });
    button.addEventListener('pointermove', event => {
      if (!held || !this.active) return;
      cancel = startY - event.clientY > 60;
      this.panel.classList.toggle('voice-cancel', cancel);
      this.instruction(cancel ? '松手取消' : '松手发送，上移取消');
    });
    button.addEventListener('pointerup', () => {
      clearTimeout(timer);
      if (!held) return;
      this.suppressNextClick();
      if (cancel) this.cancel(); else this.finish();
      held = false;
    });
    button.addEventListener('pointercancel', () => { clearTimeout(timer); if (held) { this.suppressNextClick(); this.cancel(); held = false; } });
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
