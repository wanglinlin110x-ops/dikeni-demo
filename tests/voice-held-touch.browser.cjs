const{chromium}=require('playwright'),assert=require('node:assert/strict');
const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const ua of [ios,'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36']){
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua});await c.addInitScript(()=>{
window.recognizers=[];window.SpeechRecognition=class{constructor(){recognizers.push(this)}start(){this.starts=(this.starts||0)+1;queueMicrotask(()=>this.onstart?.())}stop(){this.stops=(this.stops||0)+1;setTimeout(()=>{if(this.aborted)return;const r=[{transcript:'这个月谁卖的最好'}];r.isFinal=false;this.onresult?.({results:[r]});this.onend?.()},120)}abort(){this.aborted=true}};
window.AudioContext=window.webkitAudioContext=undefined;document.addEventListener('pointerdown',e=>window.holdPointer=e.pointerId,true);
});const p=await c.newPage(),cdp=await c.newCDPSession(p),errors=[];p.on('pageerror',e=>errors.push(String(e)));
const touch=(type,point)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});
for(const name of ['index','conversation'])for(const target of ['.message-input','[data-name="Button - 语音输入"]'])for(const scenario of ['normal','capture-loss','early-final','cancel']){
 await p.goto('http://127.0.0.1:8000/'+name+'.html');const before=await p.locator('.chat-user').count();const r=await p.locator(target).boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};await touch('touchStart',point);await p.waitForFunction(()=>document.querySelector('.voice-panel')?.dataset.state==='listening');assert.equal(await p.evaluate(()=>recognizers.at(-1).continuous),true,'mobile hold must collect consecutive final segments');
 // Another finger must never end or submit this recording.
 await p.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{pointerId:999,isPrimary:false,bubbles:true})));assert.equal(await p.evaluate(()=>recognizers.at(-1).stops||0),0);
 if(scenario==='capture-loss'){
  await p.evaluate(()=>{for(const n of document.querySelectorAll('.s36,.message-input,[data-name="Button - 语音输入"]'))if(n.hasPointerCapture(holdPointer))n.releasePointerCapture(holdPointer)});await touch('touchMove',{x:8,y:point.y});await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>recognizers.at(-1).aborted||false),false,'capture loss must not cancel speech');
 }
 if(scenario==='early-final')await p.evaluate(()=>{const r=[{transcript:'这个月谁卖的最好'}];r.isFinal=true;recognizers.at(-1).onresult({results:[r]});recognizers.at(-1).onend()});
 if(scenario==='cancel'){
  await touch('touchCancel');await p.waitForTimeout(50);assert(await p.locator('.voice-panel').isHidden());assert.equal(await p.locator('.chat-user').count(),before);continue;
 }
 await touch('touchEnd');if(name==='index')await p.waitForURL('**/conversation.html');await p.waitForFunction(n=>document.querySelectorAll('.chat-user').length===n,name==='index'?1:before+1);assert.equal(await p.locator('.chat-user p').last().innerText(),'这个月谁卖的最好');assert.equal(await p.locator('.chat-user').last().getAttribute('data-input-source'),'voice');assert(await p.locator('.voice-panel').isHidden());assert.equal(await p.evaluate(()=>getSelection().toString()),'');
}
// Short tapping the input still opens typing; microphone tapping still uses one-utterance recognition.
await p.goto('http://127.0.0.1:8000/index.html');await p.locator('.message-input').tap();assert.equal(await p.evaluate(()=>recognizers.length),0);assert.equal(await p.locator('.message-input').evaluate(n=>n.readOnly),false);await p.getByRole('button',{name:'语音输入',exact:true}).tap();await p.waitForFunction(()=>document.querySelector('.voice-panel').dataset.state==='listening');assert.equal(await p.evaluate(()=>recognizers.at(-1).continuous),true);await p.keyboard.press('Escape');assert.deepEqual(errors,[]);await c.close();
}console.log('PASS: actual browser touch input on home/conversation, field/mic holds, single-utterance parity and non-final result auto-send, pointer capture loss with release outside composer, unrelated finger isolation, early final, touch cancel, original voice text, short-tap typing and microphone tap. Recognition callbacks simulated; real iOS/Android accuracy requires device verification.');}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
