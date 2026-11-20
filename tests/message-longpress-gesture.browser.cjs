const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'});
  await page.goto('http://127.0.0.1:8000/index.html');
  await page.evaluate(()=>ChatConversations.activate('initial-history-han-v1'));
  await page.goto('http://127.0.0.1:8000/conversation.html');
  const text=page.locator('.chat-answer').last().locator('.chat-paragraph').first();
  await text.scrollIntoViewIfNeeded();
  const rect=await text.boundingBox(),x=rect.x+30,y=rect.y+12;
  const menu=page.getByRole('dialog',{name:'消息操作',exact:true});
  const touch=await page.context().newCDPSession(page);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await menu.waitFor();await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const bounds=await menu.boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=390&&bounds.y+bounds.height<=844);
  await page.screenshot({path:'/private/tmp/message-menu-real-hold.png'});
  await menu.getByRole('button',{name:'点赞',exact:true}).click();
  assert.equal(await page.locator('.chat-answer').last().locator('[data-chat-action="like"]').getAttribute('aria-pressed'),'true');
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y+30);await page.waitForTimeout(550);await page.mouse.up();assert.equal(await menu.isVisible(),false);
  // User-message deletion must roll back if local persistence fails.
  const user=page.locator('.chat-user').last();await user.scrollIntoViewIfNeeded();
  await user.locator('p').evaluate(n=>n.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:120,clientY:200})));
  const count=await page.locator('.chat-user').count();
  await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}});
  await menu.getByRole('button',{name:'删除',exact:true}).click();assert.equal(await page.locator('.chat-user').count(),count);
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
  // Regeneration still targets the selected historical reply.
  const answer=page.locator('.chat-answer').first();await answer.locator('p').first().evaluate(n=>n.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:120,clientY:200})));
  await menu.getByRole('button',{name:'重新生成',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.chat-response')?.dataset.generationState==='complete',{},{timeout:30000});
  assert.equal(await page.locator('.chat-user').count(),count);
  await page.goto('http://127.0.0.1:8000/index.html');await page.getByRole('button',{name:'打开菜单',exact:true}).click();
  const history=page.locator('[data-session-id]').first();await history.dispatchEvent('contextmenu');await page.locator('.history-context').waitFor();
  for(const button of await page.locator('.history-context-actions button').all())assert(await button.evaluate(n=>n.querySelector('img').getBoundingClientRect().right<n.querySelector('span').getBoundingClientRect().left));
  await page.screenshot({path:'/private/tmp/history-menu-left-icons.png'});
  console.log('PASS actual hold, release action, viewport bounds, movement cancellation, failed-delete rollback and historical regeneration.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
