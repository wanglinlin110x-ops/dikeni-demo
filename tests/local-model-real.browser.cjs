const {chromium}=require('playwright');const assert=require('node:assert/strict');const base=process.env.DEMO_BASE_URL||'http://127.0.0.1:8002';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base+'/index.html');assert(await p.evaluate(()=>DemoUnderstanding.enabled));await p.clock.install();
 const send=async text=>{await p.locator('.message-input').fill(text);await p.getByRole('button',{name:'发送消息',exact:true}).click();await p.waitForURL('**/conversation.html');await p.clock.runFor(1000);await p.waitForFunction(()=>ChatConversations.list()[0].messages.filter(m=>m.role==='user').at(-1)?.dialogueUnderstanding,{},{timeout:20000});await p.clock.runFor(60000);assert.equal(await p.locator('.chat-user p').last().innerText(),text);assert.equal(await p.locator('.chat-thread').getAttribute('aria-busy'),'false');};
 await send('这个月谁交得最多呀');assert.match(await p.locator('.chat-answer').last().innerText(),/周雨桐.*26辆/s);
 await send('她交得最多的是哪款车');assert.equal(await p.locator('.chat-horizontal-row').count(),4);assert.match(await p.locator('.chat-answer').last().innerText(),/宋Pro\s*DM-i.*11辆/s);
 await send('她在公司干了多久');assert.match(await p.locator('.chat-answer').last().innerText(),/周雨桐.*2023年7月10日/s);
 await p.evaluate(()=>ChatConversations.create());await p.goto(base+'/index.html');
 await send('上个月华南王朝网谁交车最多');assert.match(await p.locator('.chat-answer').last().innerText(),/李明轩.*38辆/s);
 await send('他比亚军多交了几台');assert.match(await p.locator('.chat-answer').last().innerText(),/3辆/);
 await send('今年谁是销冠');assert.match(await p.locator('.clarification-card').last().innerText(),/2026年9月、10月/);
 assert.deepEqual(errors,[]);console.log('PASS: real local model → page; raw text, current home roster, contextual model mix/personnel, September regional archive, runner-up gap and unsupported-period clarification.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
