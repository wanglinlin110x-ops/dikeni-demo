const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));let calls=[],mode='normal',release;
 const result=text=>({version:2,original:text,engine:'qwen3-local',intent:text.includes('哪款车')?'distribution':text==='宋的销量呢'?'clarify':'rank',query:text.includes('哪款车')?'主要卖什么车？':'2026年10月；全国门店；销售冠军是谁？',question:'请说明完整车型名称。',context:{network:'wangchao-national',period:'2026年10月',scope:'全国门店',...(text.includes('哪款车')?{personId:'national-wang'}:{})},slots:{}});
 await page.route('**/api/understand',async route=>{const body=route.request().postDataJSON();calls.push(body);if(mode==='delay')await new Promise(r=>release=r);if(mode==='error')return route.fulfill({status:503,body:'{}'});if(mode==='invalid')return route.fulfill({json:{intent:'execute'}});await route.fulfill({json:result(body.text)}).catch(()=>{});});
 await page.goto('http://127.0.0.1:8002/index.html');assert(await page.evaluate(()=>DemoUnderstanding.enabled));await page.clock.install();
 const send=async text=>{await page.locator('.message-input').fill(text);await page.getByRole('button',{name:'发送消息',exact:true}).click()};
 const resolve=async()=>{await page.clock.runFor(1000);await page.waitForFunction(()=>ChatConversations.list()[0]?.messages.filter(m=>m.role==='user').at(-1)?.dialogueUnderstanding);await page.clock.runFor(60000)};
 const raw='这个月谁交得最多呀';await send(raw);await page.waitForURL('**/conversation.html');await resolve();
 assert.equal(await page.locator('.chat-user p').first().innerText(),raw);assert.match(await page.locator('.chat-profile-heading').first().innerText(),/周雨桐/);assert.match(await page.locator('.chat-answer').first().innerText(),/26/);assert.equal(calls.length,1);
 await page.getByRole('button',{name:'重新生成回答',exact:true}).click();await page.clock.runFor(60000);assert.equal(calls.length,1);assert.match(await page.locator('.chat-profile-heading').first().innerText(),/周雨桐/);
 await send('她交得最多的是哪款车');await resolve();assert.equal(calls[1].context.homeScenario.person,'zhou');assert.equal(await page.locator('.chat-horizontal-row').count(),4);
 await send('宋的销量呢');await resolve();assert.match(await page.locator('.clarification-card').last().innerText(),/完整车型/);
 // A stopped inference cannot append its late result or show a fabricated business answer.
 mode='delay';await send('这个月谁交得最多');await page.clock.runFor(1000);await page.waitForFunction(()=>document.querySelector('.thinking-status'));while(!release)await page.waitForTimeout(10);
 const before=await page.locator('.chat-user').count();await page.getByRole('button',{name:'停止生成',exact:true}).click();release();release=null;await page.clock.runFor(60000);assert.equal(await page.locator('.chat-user').count(),before);assert.match(await page.locator('.generation-stopped').last().innerText(),/已停止生成/);assert.equal(await page.evaluate(()=>ChatConversations.list()[0].messages.at(-1).reply.profile),undefined);assert.equal(await page.locator('.chat-thread').getAttribute('aria-busy'),'false');
 // Sending again after cancellation starts a fresh request without late-result interference.
 mode='normal';await send('这个月谁交得最多');await resolve();assert.match(await page.locator('.chat-profile-heading').last().innerText(),/周雨桐/);
 // True service and schema failures retain the user text and use an explicit existing-rule fallback.
 for(const failure of ['error','invalid']){mode=failure;await send('测试'+failure);await page.clock.runFor(1000);await page.waitForFunction(()=>!document.querySelector('.thinking-status'));assert.match(await page.locator('.toast').innerText(),/本地模型暂未响应/);await page.clock.runFor(60000);assert.equal(await page.locator('.chat-user p').last().innerText(),'测试'+failure);}
 // Interrupted requests survive a page restore without duplicating the user's message.
 mode='delay';await send('恢复后的销冠');await page.clock.runFor(1000);while(!release)await page.waitForTimeout(10);await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));release();release=null;mode='normal';await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await resolve();assert.equal(await page.locator('.chat-user p').filter({hasText:'恢复后的销冠'}).count(),1);
 // Voice and keyboard share interpretation but raw voice spelling/spacing remain unchanged.
 await page.evaluate(()=>{ChatConversations.create();sessionStorage.setItem('demo-pending-message','这个月 谁交得最多');sessionStorage.setItem('demo-pending-input-source','voice')});await page.goto('http://127.0.0.1:8002/conversation.html');await resolve();assert.equal(await page.locator('.chat-user p').innerText(),'这个月 谁交得最多');assert.equal(await page.locator('.chat-user').getAttribute('data-input-source'),'voice');
 await page.reload();assert.equal(await page.locator('.chat-user p').innerText(),'这个月 谁交得最多');assert.match(await page.locator('.chat-profile-heading').innerText(),/周雨桐/);
 assert.deepEqual(errors,[]);console.log('PASS: mocked local-model pipeline, raw voice/text, program-owned metrics, contextual followup, clarify, regenerate, stop/late reply, service/schema failures and page restore.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
