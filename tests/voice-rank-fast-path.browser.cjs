const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage({viewport:{width:402,height:874},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'}),calls=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/understand',r=>{const body=r.request().postDataJSON();calls.push(body.text);return r.fulfill({json:{version:2,engine:'qwen3-local',original:body.text,intent:'clarify',query:'查一下',context:{},conditions:{},slots:{}}})});
await page.goto('http://127.0.0.1:8000/conversation.html');await page.clock.install();
for(const [text,name,count] of [['本月xiaoguan是谁','周雨桐',26],['上个月王朝全国小冠是谁','李明轩',58],['上个月王朝网华南小冠是谁','李明轩',38]]){
 await page.evaluate(()=>ChatConversations.create());await page.reload();await page.locator('.message-input').fill(text);await page.locator('.message-input').evaluate(e=>e.dataset.voiceDraft=e.value);await page.getByRole('button',{name:'发送消息',exact:true}).click();
 await page.clock.runFor(100);assert(await page.locator('.chat-profile-heading').isVisible());assert.match(await page.locator('.chat-profile-heading').innerText(),new RegExp(name));assert.deepEqual(calls,[],'supported champion queries must not wait for a model request');
 assert.equal(await page.locator('.chat-user p').innerText(),text);assert(await page.evaluate(()=>ChatConversations.list()[0].messages.at(-1).voiceReply));
 await page.clock.runFor(60000);assert(await page.locator('.chat-answer').innerText().then(s=>s.includes(String(count))));
}
await page.evaluate(()=>ChatConversations.create());await page.reload();await page.locator('.message-input').fill('本月理想销冠是谁');await page.locator('.message-input').evaluate(e=>e.dataset.voiceDraft=e.value);await page.getByRole('button',{name:'发送消息',exact:true}).click();await page.clock.runFor(1000);await page.waitForFunction(()=>ChatConversations.list()[0].messages.some(m=>m.dialogueUnderstanding));assert.equal(calls.length,1,'unknown brand still uses understanding/clarification');
assert.deepEqual(errors,[]);console.log('PASS: voice champion answers start without artificial delay or model calls, preserve all three data scopes and original visible text; unknown brand still resolves through model.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
