const {chromium}=require('playwright'),assert=require('node:assert/strict');
const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const ua of [ios,'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36']){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  window.sent=[];window.drafts=[];window.notices=[];window.recognizers=[];window.mediaCalls=0;window.audioCalls=0;window.autoStart=true;
  window.SpeechRecognition=class {constructor(){recognizers.push(this)}start(){if(autoStart)queueMicrotask(()=>this.onstart?.())}stop(){this.stopCalls=(this.stopCalls||0)+1}abort(){this.abortCalls=(this.abortCalls||0)+1}};
  Object.defineProperty(navigator,'permissions',{value:{query:async()=>({state:'granted'})},configurable:true});
  window.AudioContext=class {constructor(){audioCalls++;this.state='running'}resume(){return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}};
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{mediaCalls++;throw Error('Meter unavailable')}},configurable:true});
  window.result=(text,final=true)=>{const r=[{transcript:text}];r.isFinal=final;recognizers.at(-1).onresult({results:[r]})};
 });
 await page.route('**/voice-mobile-harness',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><main class="design-screen" style="position:fixed;inset:0;margin:0;width:390px;height:844px;zoom:1"><div class="s36" style="position:absolute;top:400px;left:10px;width:360px;height:80px;min-height:80px"><div data-name="Text Input" style="width:260px;height:70px"><input class="message-input" style="width:250px;height:60px"></div><button id="mic" style="width:50px;height:50px">语音</button></div></main><script src="/voice-input.js"></script>'}));
 await page.goto('http://127.0.0.1:8000/voice-mobile-harness');await page.clock.install();await page.evaluate(()=>{window.voice=new VoiceInput({root:document.querySelector('main'),onSubmit:t=>sent.push(t),onRecover:t=>drafts.push(t),onError:t=>notices.push(t),onStateChange(){}});voice.bindComposerHold(document.querySelector('input'));voice.bindPressGesture(document.querySelector('#mic'))});
 // A short pause never truncates a late final result or repeated speech.
 for(let i=0;i<24;i++){
  await page.evaluate(()=>voice.start());await page.evaluate(()=>{const sr=recognizers.at(-1);sr.onspeechstart();result('这个月谁卖',false);sr.onspeechend()});await page.clock.runFor(900);
  assert.equal(await page.evaluate(()=>recognizers.at(-1).stopCalls||0),0);
  await page.evaluate(()=>recognizers.at(-1).onspeechstart());await page.clock.runFor(800);
  assert.equal(await page.evaluate(()=>recognizers.at(-1).stopCalls||0),0);
  await page.evaluate(()=>{result('这个月谁卖的最好',true);const sr=recognizers.at(-1);sr.onend();sr.onend();sr.onspeechend()});
  assert.equal(await page.evaluate(()=>voice.active),false);assert.equal(await page.evaluate(()=>sent.length),i+1);
 }
 assert((await page.evaluate(()=>sent)).every(t=>t==='这个月谁卖的最好'));
 if(ua===ios){assert.equal(await page.evaluate(()=>mediaCalls),0);assert.equal(await page.evaluate(()=>audioCalls),0)}else assert.equal(await page.evaluate(()=>mediaCalls),0,'mobile must not open a second audio stream even when microphone permission is granted');
 // Releasing during the start handshake still waits for the final result.
 await page.evaluate(()=>{autoStart=false;voice.start(true);voice.finish(true)});assert(await page.evaluate(()=>voice.active&&voice.session.ending));await page.evaluate(()=>{recognizers.at(-1).onstart();result('首次授权也要保留原话');recognizers.at(-1).onend()});assert.equal(await page.evaluate(()=>sent.at(-1)),'首次授权也要保留原话');await page.evaluate(()=>autoStart=true);
 // A silent/hung service cannot leave an indefinite active recording.
 await page.evaluate(()=>voice.start());await page.clock.runFor(20001);assert.equal(await page.evaluate(()=>voice.active),false);assert.match(await page.evaluate(()=>notices.at(-1)),/未返回结果/);
 // Stale callbacks from a canceled recognizer never affect a fresh session.
 await page.evaluate(()=>{voice.start();window.old=recognizers.at(-1);voice.cancel(false);voice.start()});await page.evaluate(()=>{const r=[{transcript:'旧语音'}];r.isFinal=true;old.onresult({results:[r]});old.onend();old.onerror({error:'network'})});assert(await page.evaluate(()=>voice.active));await page.evaluate(()=>{result('新语音');recognizers.at(-1).onend()});assert.equal(await page.evaluate(()=>sent.at(-1)),'新语音');
 // Unfinished/error text is recovered; denied permission never sends anything.
 const before=await page.evaluate(()=>sent.length);await page.evaluate(()=>voice.start());await page.evaluate(()=>{result('还没说完',false);recognizers.at(-1).onerror({error:'network'})});assert.equal(await page.evaluate(()=>drafts.at(-1)),'还没说完');assert.equal(await page.evaluate(()=>sent.length),before);
 await page.evaluate(()=>voice.start());await page.evaluate(()=>recognizers.at(-1).onerror({error:'not-allowed'}));assert.match(await page.evaluate(()=>notices.at(-1)),/权限被拒绝/);assert.equal(await page.evaluate(()=>voice.active),false);
 // Mic-button capture handoff must not abort a held recording on first movement.
 const rect=await page.locator('#mic').boundingBox();await page.mouse.move(rect.x+15,rect.y+15);await page.mouse.down();await page.clock.runFor(300);await page.mouse.move(rect.x+16,rect.y+16);assert(await page.evaluate(()=>voice.active));
 for(const sel of ['.voice-instruction','.voice-wave','.voice-wave i'])assert.equal(await page.locator(sel).first().evaluate(n=>n.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true}))),false);
 await page.evaluate(()=>result('按住麦克风说话'));await page.mouse.up();await page.evaluate(()=>recognizers.at(-1).onend());assert.equal(await page.evaluate(()=>sent.at(-1)),'按住麦克风说话');
 // Input long press and upward cancel remain usable after many complete sessions.
 const input=await page.locator('input').boundingBox();await page.mouse.move(input.x+30,input.y+20);await page.mouse.down();await page.clock.runFor(500);assert(await page.evaluate(()=>voice.active));await page.mouse.move(input.x+30,input.y-80);await page.mouse.up();assert.equal(await page.evaluate(()=>voice.active),false);assert.equal(await page.locator('input').evaluate(n=>n.readOnly),false);
 assert.deepEqual(errors,[]);await page.close();
}
console.log('PASS: iOS single audio owner/no meter capture, Android optional meter, 48 repeated dictations, pause/resume and delayed finals, queued release, no-result watchdog, stale callback isolation, permissions, recovery, mic capture transfer, composer hold and no selection. ASR is simulated; this does not measure real-device recognition accuracy.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
