const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'), env={window:{}};
for(const f of ['voice-input.js','demo-access.js','sales-dialogue.js','home-replies.js','chat-engine.js','voice-understanding.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),env);
const normalize=vm.runInNewContext('VoiceInput.normalizeTranscript',env);
for(const alias of ['销关','销管','销官','销罐','消冠','消关','消管','消官','小冠','小关','小管','小官','校冠','校官','肖冠','萧冠','肖观','萧观','小观','销观','消观','校观','xiaoguan','xiao guan','XIAO GUAN','xiāo guàn','xiao1guan4']){
 assert.equal(normalize(`本月${alias}是谁？`),'本月销冠是谁？',alias);
 assert.equal(normalize(`上个月王朝全国${alias}是谁？`),'上个月王朝全国销冠是谁？',alias);
 assert.equal(normalize(alias),'销冠',alias);
 const interpreted=env.window.VoiceUnderstanding.understand(`本月${alias}是谁？`);assert.equal(interpreted.intent,'rank');assert(interpreted.query.includes('销冠'));assert.equal(env.window.DemoChat.reply(normalize(`本月${alias}是谁？`)).profile.name,'周雨桐');
}
for(const literal of ['我叫小冠','顾问小关的销量是多少','同事小管是谁','小关经理在哪里','小冠这个人是谁','军衔中的校官是什么','小管家怎么用','小管道堵了','tinyxiaoguanname','不要查小冠经理'])assert.equal(normalize(literal),literal,literal);
assert.equal(normalize('本月肖观是谁'),'本月销冠是谁');
assert.equal(normalize('不是上个月，我说本月小冠是谁'),'不是上个月，我说本月销冠是谁');
assert.equal(env.window.VoiceUnderstanding.understand('不要查小冠').intent,'clarify');
assert.equal(env.window.DemoChat.reply('这个月小冠是谁').profile,undefined,'keyboard text does not receive voice vocabulary substitution');
assert.equal(env.window.DemoChat.reply(normalize('上个月王朝全国小冠是谁')).profile.name,'李明轩');
console.log('PASS: 27 homophone/pinyin variants, corrected visible queries, correct current/national champion, literal names/military/compounds and negative/keyboard safeguards.');

for(const alias of ['小 冠','销 冠','销 关','销 管','销售冠','笑冠','效冠']) {
 const interpreted=env.window.VoiceUnderstanding.understand(`本月${alias}是谁`);
 const reply=env.window.DemoChat.reply(interpreted.query);assert.equal(reply.profile.name,'周雨桐');assert.equal(env.window.VoiceUnderstanding.canAnswerDirectly(interpreted,reply),true);
}
for(const raw of ['本月理想销冠是谁','本月北京战区销冠是谁','本月订单冠军是谁','今年销冠是谁','同事小冠是谁']){
 const i=env.window.VoiceUnderstanding.understand(raw);assert.equal(env.window.VoiceUnderstanding.canAnswerDirectly(i,env.window.DemoChat.reply(i.query)),false,raw);
}
for(const [raw,name,count] of [['本月xiaoguan是谁','周雨桐',26],['上个月王朝全国小冠是谁','李明轩',58],['上个月王朝网华南小冠是谁','李明轩',38]]){
 const i=env.window.VoiceUnderstanding.understand(raw),r=env.window.DemoChat.reply(i.query);assert.equal(r.profile.name,name);assert(JSON.stringify(r).includes(String(count)));assert(env.window.VoiceUnderstanding.canAnswerDirectly(i,r));
}
console.log('PASS: voice rank fast path preserves known periods/scopes and rejects unknown brands, regions, people and metrics.');
