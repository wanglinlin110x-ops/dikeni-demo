const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const base=process.env.DEMO_BASE_URL||'http://127.0.0.1:8000';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const file of ['index.html','input.html','conversation.html']){
  await page.goto(`${base}/${file}`);await page.waitForFunction(()=>document.documentElement.classList.contains('demo-ready'));
  assert.equal(await page.locator('[data-startup-inert]').count(),0);
  const scripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));
  assert.equal(scripts.length,3);const bundle=scripts.find(s=>s.startsWith('runtime-'));assert(bundle);
  const [name,query]=bundle.split('?v=');assert.equal(query,hash(fs.readFileSync(path.join(root,name))));
  const response=await context.request.get(`${base}/${bundle}`,{headers:{'Accept-Encoding':'gzip'}});
  assert.equal(response.status(),200);assert.equal(response.headers()['content-encoding'],'gzip');assert.match(response.headers()['cache-control'],/immutable/);
  const cached=await context.request.get(`${base}/${bundle}`,{headers:{'Accept-Encoding':'gzip','If-None-Match':response.headers().etag}});assert.equal(cached.status(),304);
  const stale=await context.request.get(`${base}/${name}?v=old`,{headers:{'Accept-Encoding':'gzip'}});assert.equal(stale.headers()['cache-control'],'no-cache');
 }
 await page.goto(`${base}/index.html`);await page.waitForFunction(()=>document.documentElement.classList.contains('demo-ready'));
 // Slow cached-bundle replacement retains the initial canvas layout and becomes usable.
 const before=await page.locator('.s18').boundingBox();
 await page.route('**/runtime-home.js?*',async route=>{await new Promise(r=>setTimeout(r,450));await route.continue()});
 await page.reload({waitUntil:'commit'});await page.waitForFunction(()=>document.documentElement.classList.contains('demo-ready'));const after=await page.locator('.s18').boundingBox();assert.deepEqual(after,before);await page.unroute('**/runtime-home.js?*');
 await page.getByRole('button',{name:'换一换',exact:true}).click();
 await page.getByRole('button',{name:'添加照片或文件',exact:true}).click();assert(await page.locator('#attachment-panel').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: 3 ordered scripts/page, content hashes, gzip, immutable/conditional cache, stale-version revalidation, slow startup layout and attachment readiness.');
 await context.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
