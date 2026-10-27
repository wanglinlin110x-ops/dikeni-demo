const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const env={window:{}};
for(const f of ['voice-input.js','demo-access.js','sales-dialogue.js','home-replies.js','chat-engine.js','voice-understanding.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),env);
const {DemoChat:chat,VoiceUnderstanding:voice}=env.window;
for(const inputSource of ['text','voice'])for(const order of [['这个月销冠是谁','上个月销冠是谁'],['上个月销售冠军是谁？','这个月销售冠军是谁？']]){
 let context={};const cards=[];
 for(const raw of order){const query=inputSource==='voice'?voice.understand(raw,context).query:raw;const card=chat.reply(query,context);cards.push(card);context=card.context;
 const past=/上月|上个月/.test(raw);assert.equal(card.profile.name,past?'李明轩':'周雨桐');assert.equal(card.context.homeScenario.person,past?'storeLi':'zhou');assert.match(card.paragraphs[0],new RegExp(past?'38辆':'26辆'));assert.match(card.contextLabel,new RegExp(past?'2026年9月':'2026年10月'));assert.match(card.profile.store,/深圳南山王朝旗舰店/);
 const mix=chat.reply('主要卖哪些车型？',context);assert.equal(mix.chart.values.reduce((a,b)=>a+b),past?38:26);assert.equal(mix.chart.values[0],past?12:11);const trend=chat.reply('近6个月销量趋势',context);assert.equal(trend.chart.values.at(-1),past?38:26);const target=chat.reply('目标完成了吗',context);assert.equal(target.progressCard.value,past?38:26);assert.equal(target.progressCard.target,past?32:25);
 assert.equal(chat.reply('他是哪里人？',context).paragraphs[0].includes(past?'广东梅州':'广东汕头'),true);
 }
 assert.notEqual(cards[0].profile.name,cards[1].profile.name);assert.notEqual(cards[0].profile.avatar,cards[1].profile.avatar);assert.notDeepEqual(cards[0].paragraphs,cards[1].paragraphs);
}
for(const raw of ['本月的销冠是谁','这月销冠是谁','请问这个月谁卖得最好','这个月呢？'])assert.equal(chat.reply(raw).profile.name,'周雨桐',raw);
for(const raw of ['上个月的销冠是谁','上月销量冠军是谁','上个月谁卖得最好','上月呢？','前一个月销冠是谁'])assert.equal(chat.reply(raw).context.homeScenario.person,'storeLi',raw);
const national=chat.reply('上个月王朝全国销冠是谁？');assert.match(national.paragraphs[0],/58辆/);const regional=chat.reply('上个月王朝网华南销冠是谁？');assert.match(regional.paragraphs[0],/38辆/);assert.equal(regional.homeReply,undefined);
const currentNational=chat.reply('本月全国销冠是谁');assert.equal(currentNational.profile.name,'王小迪');const previousNational=chat.reply('上个月销冠是谁',currentNational.context);assert.equal(previousNational.profile.name,'李明轩');assert.match(previousNational.paragraphs[0],/58辆/);
const old=structuredClone(currentNational);old.context.period='2026年9月';old.championDataVersion=8;old.profile.name='王小迪';old.metrics=[['34','9月交付']];const migrated=chat.normalizeReply(old);assert.equal(migrated.profile.name,'李明轩');assert.match(migrated.paragraphs[0],/58辆/);
console.log('PASS: relative months choose distinct complete store champions across voice/text, reverse/contextual switches, model mix/trend/targets/personnel, scoped archives and old cached national migration.');
