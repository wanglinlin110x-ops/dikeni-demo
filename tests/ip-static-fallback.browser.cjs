const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const scriptMode of ['normal','blocked-runtime','no-javascript']){
 const c=await b.newContext({viewport:{width:1000,height:900},javaScriptEnabled:scriptMode!=='no-javascript'});const p=await c.newPage();
 await p.route('**/assets/ip-intro-mobile.mp4*',r=>r.abort());if(scriptMode==='blocked-runtime')await p.route('**/runtime-home.js*',r=>r.abort());
 for(const name of ['index','input']){
  const url=pathToFileURL(path.join(process.cwd(),name+'.html')).href;await p.goto(url);const image=p.locator('.ip-intro-fallback');assert.equal(await image.count(),1);await image.waitFor({state:'visible'});assert(await image.evaluate(n=>n.complete&&n.naturalWidth===480));const box=await image.boundingBox();assert(box.width>=40&&box.height>=40);assert.equal(await p.locator('video').evaluate(n=>getComputedStyle(n).opacity),'0');
 }
 await c.close();
}
// Existing autoplay remains once per entry and keeps a single fallback element.
const p=await b.newPage({viewport:{width:1000,height:900}});await p.goto('http://127.0.0.1:8000/index.html');await p.waitForFunction(()=>document.querySelector('video').dataset.frameReady==='true');assert.equal(await p.locator('.ip-intro-fallback').count(),1);await p.waitForFunction(()=>document.querySelector('video').ended);assert.equal(await p.locator('video').evaluate(n=>getComputedStyle(n).opacity),'1');await p.reload();await p.waitForFunction(()=>document.querySelector('video').currentTime>0);assert.equal(await p.locator('.ip-intro-fallback').count(),1);console.log('PASS: direct file opens retain a visible static IP with video failure, blocked runtime or JavaScript disabled; normal playback/final frame/reload unchanged and no duplicate images.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
