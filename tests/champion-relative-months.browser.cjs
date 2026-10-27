const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:402,height:874},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'}),errors=[],calls=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/api/understand'))calls.push(r.url())});
await p.goto('http://127.0.0.1:8000/index.html');await p.clock.install();
const send=async(text,voice=false)=>{await p.locator('.message-input').fill(text);if(voice)await p.locator('.message-input').evaluate(e=>e.dataset.voiceDraft=e.value);await p.getByRole('button',{name:'发送消息',exact:true}).click();await p.waitForURL('**/conversation.html');await p.clock.runFor(60000)};
for(const voice of [false,true]){
 await p.evaluate(()=>ChatConversations.create());await p.reload();
 await send('这个月销售冠军是谁？',voice);assert.match(await p.locator('.chat-profile-heading').last().innerText(),/周雨桐/);const avatar=await p.locator('.chat-champion-profile img.chat-champion-avatar').last().getAttribute('src');
 await send('上个月销售冠军是谁？',voice);assert.match(await p.locator('.chat-profile-heading').last().innerText(),/李明轩/);assert.match(await p.locator('.chat-answer').last().innerText(),/38辆/);assert.match(await p.locator('.chat-answer').last().innerText(),/118.8%/);assert.notEqual(await p.locator('.chat-champion-profile img.chat-champion-avatar').last().getAttribute('src'),avatar);
 await send('主要卖什么车？',voice);assert.equal(await p.locator('.chat-horizontal-row').count(),6);assert.match(await p.locator('.chat-answer').last().innerText(),/元PLUS.*12辆/s);
 await send('近6个月销量趋势',voice);assert.match(await p.locator('.chat-answer').last().innerText(),/180辆/);
 await send('这个月呢？',voice);assert.match(await p.locator('.chat-profile-heading').last().innerText(),/周雨桐/);await send('主要卖什么车？',voice);assert.equal(await p.locator('.chat-horizontal-row').count(),10);
 await p.reload();await p.clock.runFor(60000);assert.match(await p.locator('.chat-answer').last().innerText(),/宋Pro\s*DM-i/);
}
assert.deepEqual(calls,[]);assert.deepEqual(errors,[]);await p.screenshot({path:'/private/tmp/dikeni-distinct-month-champions.png',fullPage:true});console.log('PASS: mobile text/voice month switch, distinct portraits/cards, scoped followup mix/trend, reverse switch, reload and no model calls.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
