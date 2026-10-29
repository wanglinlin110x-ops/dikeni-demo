const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={window:{}};for(const name of ['demo-access.js','sales-dialogue.js','home-replies.js','chat-engine.js'])vm.runInNewContext(fs.readFileSync(name,'utf8'),env);const chat=env.window.DemoChat;
const current=chat.reply('本月销售冠军是谁？');assert.match(current.paragraphs[0],/截至10月29日/);assert.match(current.contextLabel,/2026年10月截至29日/);assert(!current.profile.role);assert(!current.contextLabel.includes('模拟业绩'));assert.equal(current.sources[0].updated,'2026-10-29');
for(const text of ['主要卖什么车？','近6个月销量趋势','她的目标完成了吗？']){const next=chat.reply(text,current.context);assert(!/截至2[46]日|10月2[46]日/.test(JSON.stringify(next)));}
const old=JSON.parse(JSON.stringify(current));old.homeReplyVersion=1;old.contextLabel='2026年10月截至26日 · 模拟业绩';old.profile.role='销售顾问';old.paragraphs=['截至10月26日'];const updated=chat.normalizeReply(old);assert.match(updated.contextLabel,/截至29日/);assert(!updated.profile.role);assert(!updated.contextLabel.includes('模拟业绩'));
const previous=chat.reply('上个月销冠是谁？');assert.equal(previous.profile.name,'李明轩');assert.match(previous.paragraphs[0],/38辆.*32辆.*118.8%.*14辆/);assert.equal(previous.contextLabel,'2026年9月 · 深圳南山王朝旗舰店');assert.equal(previous.sources[0].updated,'2026-10-26');assert(!previous.profile.role);
assert.deepEqual(Array.from(chat.reply('主要卖什么车？',previous.context).chart.values),[12,9,8,5,3,1]);assert.equal(chat.reply('近6个月销量趋势',previous.context).chart.values.at(-1),38);
const orders=chat.reply('本月订单目标完成率是多少？');assert.match(orders.paragraphs[0],/10月29日.*剩余2天.*18单/);
for(const file of ['home-replies.js','chat-engine.js','answer.html','trend.html','analysis.html'])assert(!/截至2[46]日|10月2[46]日|模拟业绩/.test(fs.readFileSync(file,'utf8')),file);
console.log('PASS: October29 cards/followups/source dates, cached response refresh, role/copy removal, unchanged September metrics/models and corrected remaining-day math.');
