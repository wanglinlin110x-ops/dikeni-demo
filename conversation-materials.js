/* Shared presentation assets and one opt-in, repeatable multi-turn demonstration. */
window.ConversationMaterials=(()=>{
  const catalog=[
  {
    "key": "zhou-deliveries",
    "title": "销冠顾问个人交付明细",
    "name": "销冠顾问个人交付明细.csv",
    "url": "assets/conversation-materials/zhou-deliveries.csv",
    "type": "text/csv",
    "size": 425
  },
  {
    "key": "customer-followup",
    "title": "客户试驾跟进清单",
    "name": "客户试驾跟进清单.pdf",
    "url": "assets/conversation-materials/customer-followup.pdf",
    "type": "application/pdf",
    "size": 74754
  }
];
  const get=key=>catalog.find(item=>item.key===key);
  function hanReply(section='rank'){
    const base={kind:'answer',homeReply:true,homeReplyVersion:2,sources:[],context:{lastIntent:'home-han-champion',homeScenario:{key:'hanChampion',person:'han-chenyu',section}},followups:['他最近几个月表现怎么样？','有哪些销售方法值得学习？']};
    const picture=(key,name,width=1600,height=1067)=>({src:`assets/library-materials/${key}.webp`,name,width,height,key});
    if(section==='distribution')return{...base,title:'陈宇的汉车型交付构成',paragraphs:['本月截至29日，陈宇交付汉DM-i10辆、汉EV8辆，分别占个人汉车型交付的55.6%和44.4%。','客户以家庭通勤和商务出行为主。沟通时先确认补能条件，再介绍对应动力版本及配置。'],metrics:[['10','汉DM-i交付（辆）'],['8','汉EV交付（辆）']],libraryImage:picture('material-18','车型动力结构图表示意'),followups:['他最近几个月表现怎么样？','有哪些销售方法值得学习？']};
    if(section==='trend')return{...base,title:'陈宇的汉车型交付趋势',paragraphs:['5月至9月，陈宇的汉车型月交付由8辆提升至14辆；10月截至29日已交付18辆。','近期重点是提高试驾后的跟进完成率，及时确认客户仍有疑虑的配置和费用事项。10月尚未结束，不与完整月份直接计算环比。'],metrics:[['18','10月截至29日（辆）'],['14','9月完整月（辆）']],libraryImage:picture('material-15','交付趋势图表示意'),followups:['有哪些销售方法值得学习？','帮我整理一份跟进清单']};
    if(section==='learning')return{...base,title:'陈宇的汉车型销售方法',paragraphs:['先确认客户的通勤路线、家庭用车需求与预算，再围绕空间、乘坐感受和驾驶体验安排试驾。','试驾当天整理客户反馈，发送对应配置及费用方案，并约定下一次跟进时间。','每次跟进记录一个明确的下一步：补充资料、再次到店或确认方案，避免只问“考虑得怎么样”。'],libraryImage:picture('material-07','汉车型客户试驾跟进清单',1086,1448),followups:['帮我整理一份跟进清单','他最近几个月表现怎么样？']};
    if(section==='checklist')return{...base,title:'陈宇的客户跟进资料',paragraphs:['按需求确认、试驾反馈、方案沟通和约定跟进四步执行，并记录每一步的负责人及完成时间。','已整理为PDF清单，可直接预览或下载。'],headers:['环节','跟进重点'],rows:[['需求确认','预算、通勤路线、补能条件'],['试驾反馈','客户满意点与待确认问题'],['方案沟通','对应配置、费用与权益说明'],['约定跟进','下次联系时间及具体待办']],libraryFiles:[get('customer-followup')],followups:['汉DM-i和汉EV分别卖了多少辆？']};
    return{...base,title:'本月汉车型销冠：陈宇',paragraphs:['截至10月29日，深圳南山王朝旗舰店汉车型销售冠军是陈宇，累计交付18辆，领先第二名4辆。月度目标15辆，完成率120%。','他的销售重点是先确认客户的通勤、家庭用车需求，再通过试驾展示车辆体验，及时跟进客户的配置与购车方案。'],metrics:[['18','汉车型交付（辆）'],['120%','目标完成率']],libraryImage:{src:'assets/library-materials/material-12.webp',name:'汉车型销冠荣誉海报',width:1086,height:1448,key:'material-12'}};
  }
  function decorate(reply){
    const scenario=reply?.context?.homeScenario;
    if(scenario?.person!=='zhou'||!reply.context.materialsDemo)return reply;
    const section=scenario.section||'rank';
    reply={...reply,title:reply.title.replace(/周雨桐/g,'销冠顾问'),paragraphs:reply.paragraphs.map(text=>text.replace(/周雨桐/g,'这位顾问')),sources:reply.sources.map(source=>({...source,description:source.description.replace(/周雨桐/g,'销冠顾问')}))};
    if(section==='rank')return{...reply,profile:null,title:'本月销冠业绩概览',metrics:[['26','本月交付（辆）'],['104.0%','目标完成率']],libraryImage:{src:'assets/library-materials/material-11.webp',name:'销冠荣誉宣传海报',width:1086,height:1448,key:'material-11'}};
    if(section==='trend')return{...reply,libraryFiles:[get('zhou-deliveries')]};
    if(section==='learning')return{...reply,libraryImage:{src:'assets/library-materials/material-09.webp',name:'客户试驾跟进清单',width:1086,height:1448,key:'material-09'}};
    if(section==='checklist')return{...reply,libraryFiles:[get('customer-followup')]};
    return reply;
  }
  function followup(context){return {kind:'answer',homeReply:true,homeReplyVersion:2,title:'客户试驾跟进资料',paragraphs:['可以按“确认需求、试驾反馈、方案沟通、约定跟进”四步执行。把每次沟通的待办事项记录下来，再约定下一次联系时间。','已整理为一份PDF清单，方便预览、下载或发给同事使用。'],headers:['环节','需要记录的内容'],rows:[['需求确认','预算、用车场景与两项重点需求'],['试驾反馈','满意点、顾虑与待确认事项'],['方案沟通','对应配置、费用与权益说明'],['后续跟进','约定时间、负责人和下一步动作']],sources:[],followups:['主要卖哪些车型？'],libraryFiles:[get('customer-followup')],context:{...context,homeScenario:{key:'currentChampion',person:'zhou',section:'checklist'}}};}
  function repairGeneratedSessions(data){
    const next=structuredClone(data);let changed=false;
    const han=['本月汉的销冠是谁？','他主要卖汉的哪些版本？','他最近几个月表现怎么样？','有哪些销售方法值得学习？','帮我整理一份跟进清单'];
    const general=['本月销售冠军是谁？','她主要卖什么车？','她最近几个月表现怎么样？','她有哪些做法值得学习？','帮我整理成一份跟进资料'];
    for(const session of next.sessions){
      const generated=session.hanDemoVersion===1?han:session.materialsDemoVersion?general:null;
      if(!generated)continue;
      // Only remove the exact auto-inserted prefix; subsequent real questions stay intact.
      const exact=session.messages.length>=10&&generated.every((text,i)=>session.messages[i*2]?.role==='user'&&session.messages[i*2].text===text&&session.messages[i*2+1]?.role==='assistant');
      if(exact)session.messages.splice(2,8);
      if(!session.customTitle&&['陈宇的汉车型销冠复盘','本月销冠与客户跟进资料'].includes(session.title))session.title=session.messages.find(message=>message.role==='user')?.text.slice(0,26)||session.title;
      session.context=session.messages.filter(message=>message.role==='assistant').at(-1)?.reply?.context||session.context;
      delete session.hanDemoVersion;delete session.materialsDemoVersion;changed=true;
    }
    return{data:next,changed};
  }
  return{catalog,get,decorate,followup,hanReply,repairGeneratedSessions};
})();
{
  const reply=DemoChat.reply;
  DemoChat.reply=(text,context={})=>{
    const q=String(text).replace(/[\s？?，,。！!]/g,'');
    if(/^(?:请问)?(?:本月|这个月|这月)(?:的)?汉(?:车型)?(?:的)?(?:销冠|销售冠军|销量冠军)(?:是谁|是哪个|是哪位|谁)?$/.test(q))return ConversationMaterials.hanReply();
    if(context.homeScenario?.key==='hanChampion'){if(/清单|跟进资料|整理.*资料/.test(q))return ConversationMaterials.hanReply('checklist');if(/版本|车型构成|动力|分别卖|主要卖|汉DM-?i|汉EV/i.test(q))return ConversationMaterials.hanReply('distribution');if(/最近|趋势|半年|几个月|表现/.test(q))return ConversationMaterials.hanReply('trend');if(/方法|学习|做法|经验/.test(q))return ConversationMaterials.hanReply('learning')}
    let result=context.homeScenario?.person==='zhou'&&/跟进(?:资料|清单)|整理成.*资料/.test(String(text))?ConversationMaterials.followup(context):reply(text,context);
    if(context.materialsDemo)result={...result,context:{...result.context,materialsDemo:true}};
    return ConversationMaterials.decorate(result);
  };
}
