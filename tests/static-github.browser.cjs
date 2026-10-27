// Serve the exact repository HTML, without the local server's model opt-in injection.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'});
 const errors=[],modelCalls=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/understand'))modelCalls.push(r.url())});
 await page.route('**/*.html',route=>{const file=path.basename(new URL(route.request().url()).pathname);return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'..',file),'utf8')})});
 await page.goto('http://127.0.0.1:8000/index.html');await page.waitForFunction(()=>document.documentElement.classList.contains('demo-ready'));
 assert.equal(await page.locator('meta[name="demo-language-model"]').count(),0);assert.equal(await page.evaluate(()=>DemoUnderstanding.enabled),false);
 assert.equal(await page.locator('script[src]').count(),3);
 await page.locator('.s28').first().click();await page.waitForURL('**/conversation.html');await page.waitForFunction(()=>document.querySelector('.chat-profile-heading'));assert.match(await page.locator('.chat-profile-heading').innerText(),/周雨桐/);
 await page.getByRole('button',{name:'返回助手首页',exact:true}).click();await page.waitForURL('**/index.html');assert.equal(await page.evaluate(()=>DemoUnderstanding.enabled),false);
 assert.deepEqual(modelCalls,[]);assert.deepEqual(errors,[]);console.log('PASS: exact GitHub HTML initializes bundled UI and curated conversation without local model API calls.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
