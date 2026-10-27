/* Eight curated demo entries. Public disclosures and simulated internal records stay separate. */
window.HomeReplies = (() => {
  const pages = [
    ['本月销售冠军是谁？', '近6个月销量趋势', '置换权益和金融优惠能叠加吗？', '客户说有点贵，怎么接？'],
    ['门店区域归属查询', '本月订单目标完成率是多少？', '置换补贴需要哪些材料？', '上个月王朝全国销冠是谁？'],
  ];
  const icons = ['home-car.svg', 'home-chart-line.svg', 'home-note-edit.svg', 'home-bulb.svg'];
  const iconFor = text => icons[(pages.flat().indexOf(text) + 4) % 4];
  const clean = text => String(text).replace(/[\s？?，,。！!]/g, '');
  const store = '深圳南山王朝旗舰店';
  const people = {
    zhou: { id: 'home-zhou', name: '周雨桐', store, region: '华南战区', avatar: 'assets/chen-siyu-avatar.png?v=20261027-small', month: '2026年10月截至26日', deliveries: 26, target: 25, runner: '陈思雨', second: 23, names: ['宋 Pro DM-i', '元 PLUS', '秦 PLUS DM-i', '汉 DM-i'], counts: [11, 7, 5, 3], history: [13, 15, 18, 20, 24, 26], months: ['5月','6月','7月','8月','9月','10月'] },
    li: { id: 'home-national-li', name: '李明轩', store, region: '华南战区', avatar: 'assets/li-mingxuan-avatar.png?v=20261027-small', month: '2026年9月', deliveries: 58, target: 50, runner: '王浩', second: 53, names: ['元 PLUS','元 UP','宋 Pro DM-i','秦 PLUS DM-i','汉 DM-i','唐 DM-i'], counts: [21,14,10,7,4,2], history: [35,39,37,44,49,58], months: ['4月','5月','6月','7月','8月','9月'] },
  };
  people.storeLi = { id:'home-store-li', name:'李明轩', store, region:'华南战区', avatar:'assets/li-mingxuan-avatar.png?v=20261027-small', month:'2026年9月', deliveries:38, target:32, runner:'周雨桐', second:24, names:['元 PLUS','元 UP','宋 Pro DM-i','秦 PLUS DM-i','汉 DM-i','唐 DM-i'], counts:[12,9,8,5,3,1], history:[24,28,26,31,33,38], months:['4月','5月','6月','7月','8月','9月'] };
  const policyUrl = 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/tzgg/content/post_12664246.html';
  const policySource = () => ({ kind: 'public', title: '官方政策 · 深圳市2026年汽车置换更新补贴实施指引', description: '深圳市商务局发布。区分政府置换更新补贴与厂家置换权益、金融产品；厂家活动是否叠加仍须核对对应条款。申请材料见第四部分，申请条件见第三部分。政策期内资金使用完毕即止，不表示当前已取得申请资格。', updated: '2026-03-03', url: policyUrl });
  const internal = (title, description) => ({ kind: 'simulated', title: `模拟台账 · ${title}`, description, updated: '2026-10-26' });
  const make = (key, title, paragraphs, extra = {}, data = {}) => ({ kind:'answer', homeReplyVersion:1, homeReply:true, title, paragraphs, sources:[], followups:[], context:{ pending:null, lastIntent:`home-${key}`, homeScenario:{key,...data} }, ...extra });
  const pct = (value,total) => `${(value / total * 100).toFixed(1)}%`;
  function champion(id, section = 'rank') {
    const p = people[id], national = id === 'li', archive = id === 'storeLi', past = national || archive, key = national ? 'nationalChampion' : archive ? 'previousStoreChampion' : 'currentChampion';
    const scope = national ? '王朝网全国' : store;
    const sources = [internal(`${p.month}个人交付`, `范围：${scope}。${p.name}${p.deliveries}辆；第二名${p.runner}${p.second}辆；个人目标${p.target}辆。人物、门店、排名及业绩均为演示编写；按已交付车辆数统计，排除取消及未交付订单。`)];
    const data = { person:id, section };
    if (section === 'distribution') return make(key, `${p.name}的主销车型`, [`${p.month}，${p.names[0]}交付${p.counts[0]}辆，占个人交付的${pct(p.counts[0],p.deliveries)}。${national ? '元 PLUS与元 UP合计35辆，是主要交付来源。' : archive ? '元 PLUS与元 UP合计21辆，占个人交付的55.3%。' : '宋 Pro DM-i与元 PLUS合计18辆，贡献了大部分交付。'}`], { chart:{ type:'horizontal', title:`${p.month}个人车型交付`, labels:p.names, values:p.counts, total:p.deliveries, highlight:0, note:`合计${p.deliveries}辆 · 模拟个人交付` }, sources, followups:past ? ['他近半年表现怎么样？','哪些销售做法值得推广？'] : ['她的目标完成了吗？','她最近表现怎么样？'] }, data);
    if (section === 'trend') return make(key, `${p.name}的近期交付表现`, national ? ['4—9月累计交付262辆。6月略有回落，7月起连续增长；9月58辆，较8月49辆增长18.4%。'] : archive ? ['4—9月累计交付180辆，月均30辆。6月略有回落，7月起连续增长；9月38辆，较8月33辆增长15.2%。'] : ['5—9月完整月交付从13辆提升至24辆；10月截至26日已交付26辆。10月尚未结束，不作为完整月份环比。'], { chart:{ labels:p.months, values:p.history, note:past?'2026年4—9月完整月 · 模拟个人交付':'2026年5—9月完整月；10月截至26日 · 模拟个人交付' }, sources, followups:past?['主要卖什么车型？','哪些销售做法值得推广？']:['她的目标完成了吗？','主要卖哪些车型？'] }, data);
    if (section === 'target') return make(key, `${p.name}的目标完成情况`, [`${p.month}已交付${p.deliveries}辆，个人目标${p.target}辆，完成率${pct(p.deliveries,p.target)}，超出目标${p.deliveries-p.target}辆。`], { progressCard:{value:p.deliveries,target:p.target,label:'个人交付目标'}, sources, followups:['主要卖哪些车型？'] }, data);
    if (section === 'learning') return make(key, '可供推广的销售做法', past ? ['李明轩的模拟复盘中，重点是先确认预算和补能条件，再安排针对性试驾；试驾当天发送配置与费用清单，并约定回访时间。','建议先选客群相近的门店试行两周，以回访完成率和交付变化评估效果，不仅凭销冠排名判断因果。'] : ['周雨桐的模拟复盘重点是宋 Pro DM-i家庭客群：试驾前确认空间和日常出行需求，试驾后当天核对配置及费用。','先把本月待交付订单逐单确认，记录交付时间和客户尚未解决的问题，再复盘是否适合其他顾问。'], { sources:[internal('销售复盘访谈','访谈及推广建议为模拟内容，不是已验证的经营结论。')], followups:['整理一份门店推广清单'] }, data);
    if (section === 'checklist') return make(key,'门店试行清单',['先选择两家客群相近的门店，试行两周后复盘。'],{headers:['环节','动作'],rows:[['需求确认','记录预算、补能条件和两项重点需求'],['试驾跟进','围绕关注点体验，当天发送费用清单'],['评估','记录回访完成率及交付变化']],sources,followups:[]},data);
    if (section === 'runnerup') return make(key, national?'9月全国第二名':archive?'9月门店第二名':'本月门店第二名', [`${p.month}，${p.runner}交付${p.second}辆，落后${p.name}${p.deliveries-p.second}辆。${national?'所属门店为广州天河王朝店。':'统计范围为深圳南山王朝旗舰店。'}`], { sources, followups:[] }, data);
    const currentCopy = [`截至10月26日，深圳南山王朝旗舰店本月交付排名第一的是周雨桐，已交付26辆，领先第二名3辆。宋 Pro DM-i交付11辆，是她本月的主销车型。`];
    const previousCopy = ['2026年9月，深圳南山王朝旗舰店月度交付冠军是李明轩，交付38辆，目标32辆，完成率118.8%，领先第二名周雨桐14辆。元 PLUS交付12辆，占31.6%，是上月主销车型。'];
    const nationalCopy = ['9月王朝网全国销冠是李明轩，来自深圳南山王朝旗舰店，交付58辆，超过个人目标8辆，领先第二名5辆。元 PLUS交付21辆，占个人交付的36.2%。'];
    return make(key,national?'9月王朝网全国销冠':archive?'上月门店交付冠军':'本月门店交付当前第一',national?nationalCopy:archive?previousCopy:currentCopy,{profile:{personId:p.id,name:p.name,store:p.store,role:'销售顾问',avatar:p.avatar,badge:national?'王朝网全国销冠':archive?'上月门店销冠':'本月门店第一',fields:archive?[{label:'9月完整月交付',value:'38辆'},{label:'目标完成率',value:'118.8%'}]:national?[{label:'9月完整月交付',value:'58辆'},{label:'目标完成率',value:'116.0%'}]:[{label:'本月交付',value:'26辆'},{label:'领先第二名',value:'3辆'}]},contextLabel:`${p.month} · ${scope} · 模拟业绩`,sources,followups:past?['他近半年表现怎么样？','哪些销售做法值得推广？']:['她的目标完成了吗？','主要卖哪些车型？']},data);
  }
  function materials(script = false) {
    if (!window.DemoAccess?.canReadKnowledge('sales')) return make('materials','当前账号无权查看这项知识',['请使用具有销售知识查看权限的账号。']);
    return make('materials',script?'可以发给客户的材料清单':'深圳政府置换更新补贴材料',script?[]:['按深圳市2026年政府汽车置换更新补贴指引，主要准备以下6类材料。'],{...(script?{quote:'请准备本人身份证、新车发票及登记证书第1—2页、旧车二手车销售发票及登记证书第1—4页，以及本人银行一类账户信息。我们再核对车主、时间及申请条件。',quoteLabel:'客户话术'}:{headers:['材料','要求'],rows:[['身份证件','本人有效身份证件'],['新车发票','机动车销售统一发票'],['新车登记证书','第1—2页'],['旧车交易发票','二手车销售统一发票'],['旧车登记证书','第1—4页，含转让登记信息'],['银行账户','本人一类账户']]}),nextStep:'核对新旧车车主一致、旧车持有时间及购车登记条件；材料齐全不等于已获得补贴资格。',sources:[policySource()],followups:script?['申请条件有哪些？']:['申请条件有哪些？','帮我整理成客户清单']});
  }
  function policy(script = false) {
    if (!window.DemoAccess?.canReadKnowledge('sales')) return make('policy','当前账号无权查看这项知识',['请使用具有销售知识查看权限的账号。']);
    return make('policy','置换与金融优惠：有条件叠加',script?[]:['先区分政府补贴与厂家置换权益。政府补贴按当地政策申请，厂家置换权益和金融优惠是否能同时享受，需要核对具体活动条款，不能把宣传金额直接相加。'],{quote:'我帮您把置换权益和金融方案逐项核对，能同时享受的优惠会单独列清，再给您确认总费用。',quoteLabel:'可以对客户这样说',sources:[policySource()],followups:['置换补贴需要哪些材料？','整理成客户话术']});
  }
  function brandTrend(split = false) {
    if (split) return make('brandTrend','9月乘用车动力结构',['纯电动乘用车273,143辆，插电式混合动力乘用车183,570辆，合计456,713辆。'],{chart:{type:'horizontal',labels:['纯电动','插电式混合动力'],values:[273143,183570],total:456713,note:'2026年9月 · 公司公告乘用车口径'},sources:[{kind:'public',title:'比亚迪2026年9月产销快报',description:'乘用车销量及动力类型拆分。',updated:'2026-10-08',url:'https://static.cninfo.com.cn/finalpage/2026-10-08/1225595402.PDF'}],followups:['近6个月销量趋势']});
    const urls = ['https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12297860&stockid=002594','https://static.cninfo.com.cn/finalpage/2026-06-02/1225343520.PDF','https://static.cninfo.com.cn/finalpage/2026-07-02/1225403848.PDF','https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12473718&stockid=002594','https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12579555&stockid=002594','https://static.cninfo.com.cn/finalpage/2026-10-08/1225595402.PDF'];
    const values=[321123,383453,403472,419211,440293,463561];
    return make('brandTrend','近6个完整月集团销量',['2026年4—9月，比亚迪集团新能源汽车月销量连续增长，累计243.11万辆。9月销售46.36万辆，环比增长5.28%。'],{contextLabel:'比亚迪集团 · 2026年4—9月完整月 · 公开数据',chart:{labels:['4月','5月','6月','7月','8月','9月'],values,note:'单位：辆。公司公告新能源汽车销量，含乘用车和商用车，不是门店零售或个人交付。'},sources:urls.map((url,i)=>({kind:'public',title:`比亚迪2026年${i+4}月产销快报`,description:`公司公告新能源汽车销量${values[i].toLocaleString('en-US')}辆。`,updated:`2026-${String(i+5).padStart(2,'0')}`,url})),followups:['9月各品牌销量','纯电和插混各占多少？']});
  }
  function reply(text, previous = {}) {
    const q=clean(text), old=previous.homeScenario;
    const rankText = clean(String(text).replace(/[；;]销售冠军是谁[？?]?$/, '')).replace(/^(?:请问|帮我查一下|帮我看看|查一下|看看)+/, '').replace(/[啊呀呢吧]+$/, '');
    const match = rankText.match(/^(本月|这个月|这月|今个月|10月|2026年10月|上个月|上月|前一个月|9月|2026年9月)(?:的)?(?:(?:销售冠军|销量冠军|销冠|销量第一名|销售第一名|销量TOP1)(?:是谁|谁|是哪位|是哪个)?|谁是(?:销售冠军|销冠)|谁(?:卖得|卖的|卖)(?:最好|最多)|(?:呢)?)$/i);
    if (match && (!previous.scope || old)) {
      const previousMonth = /上月|上个月|前一个月|9月/.test(match[1]);
      return champion(previousMonth ? (old?.person === 'li' ? 'li' : 'storeLi') : 'zhou');
    }

    if (/^(本月|这个月)(销售冠军|销量冠军|销冠|销量第一名|销售第一名|销量TOP1)(是谁|谁|是哪位)$/i.test(q)) return champion('zhou');
    if (/^(上个月|上月|9月|2026年9月)王朝(网)?全国(销售冠军|销量冠军|销冠|销量第一名|销量TOP1)(是谁|谁|是哪位)$/i.test(q)) return champion('li');
    if (q==='门店区域归属查询'||q==='门店归属查询') return make('store','当前门店的区域归属',[`${store}属于王朝网，业务组织归属为华南战区 → 深圳区域。`],{contextLabel:'当前演示门店 · 模拟组织关系',headers:['项目','内容'],rows:[['销售网络','王朝网'],['所属战区','华南战区'],['所属区域','深圳区域'],['所在地','广东省深圳市'],['门店类型','授权经销门店']],sources:[internal('门店组织档案','此门店及战区、区域关系为演示设定；地理位置不等于业务组织归属。')],followups:['该店本月目标完成情况','该店销售排名']});
    if (/^(本月订单目标完成率是多少|本月订单目标完成率|该店本月目标完成情况)$/.test(q)) return make('orders','本月订单目标完成率88.0%',['截至10月26日，深圳南山王朝旗舰店本月有效订单264单，目标300单，还差36单。剩余5天，平均每天需新增约8单。'],{contextLabel:'2026年10月截至26日 · 模拟订单台账',progressCard:{value:264,target:300,label:'有效订单目标'},sources:[internal('门店有效订单与月度目标','有效订单264单，目标300单，排除取消订单；订单数与已交付车辆数分别统计。')],followups:['哪个车型缺口最大？','分销售顾问看完成情况']});
    if (/^(置换权益和金融优惠能叠加吗|置换与金融优惠能叠加吗)$/.test(q)) return policy();
    if (/^(置换补贴需要哪些材料|置换要准备什么材料|政府置换补贴需要什么材料)$/.test(q)) return materials();
    if (q==='客户说有点贵怎么接') {
      const result=window.SalesDialogue.reply(text,{});
      return {...result,homeReply:true,homeReplyVersion:1,paragraphs:['目前只能确认客户有价格顾虑，还不能判断是预算不足、在比较其他车型，还是没看懂差价价值。'],quote:'理解，买车确实要算清楚。您是觉得超出了预算，还是和另一款车相比，觉得差价不太值？',followups:result.followups.slice(0,3)};
    }
    if (/^(近6个月销量趋势|近六个月销量趋势)$/.test(q) && !old?.person && !previous.personId) return brandTrend();
    if (!old) return null;
    if (old.person) {
      const p=people[old.person];
      if (/^(上个月|上月)(呢|销冠是谁)?$/.test(q)) return champion(old.person === 'li' ? 'li' : 'storeLi');
      if (/^(本月|这个月)(呢|销冠是谁)?$/.test(q)) return champion('zhou');
      if (/主要卖|主销|车型.*(结构|构成|分布)|哪[个款].*车型.*(最多|最高)|哪款卖得最多/.test(q)) return champion(old.person,'distribution');
      if (/趋势|半年|最近.*表现|一直.*好/.test(q)) return champion(old.person,'trend');
      if (/目标.*完成|完成.*目标/.test(q)) return champion(old.person,'target');
      if (/推广清单/.test(q)) return champion(old.person,'checklist');
      if (/推广|做法|经验/.test(q)) return champion(old.person,'learning');
      if (/第二名/.test(q)) return champion(old.person,'runnerup');
      if (/哪个店|哪家店|门店信息|所属门店/.test(q)) return make(old.key,`${p.name}的门店信息`,[`${p.name}是${p.store}的销售顾问，所属业务组织为华南战区深圳区域。`],{sources:[internal('门店与顾问归属','人物、门店及组织关系为演示设定。')],followups:['主要卖哪些车型？']},{...old,section:'profile'});
      if (/哪里人|籍贯|入职|任职/.test(q)) {
        const field=/哪里人|籍贯/.test(q)?'hometown':'joinedAt';
        const allowed=window.DemoAccess?.canReadEmployee(field,p);
        return make(old.key,allowed?`${p.name}的人员资料`:'无权查看这项人员资料',[allowed ? field==='hometown'?`${p.name}籍贯${old.person!=='zhou'?'广东梅州':'广东汕头'}。`:`${p.name}于${old.person!=='zhou'?'2022年3月15日':'2023年7月10日'}入职。`:`当前账号无权查看${p.name}的${field==='hometown'?'籍贯':'入职时间'}。`],{followups:['主要卖哪些车型？']},{...old,section:'personal',field});
      }
    }
    if (old.key==='store' && /该店销售排名/.test(q)) return make('store','本月门店交付排名',['截至10月26日，周雨桐暂列第一。'],{headers:['销售顾问','交付（辆）'],rows:[['周雨桐','26'],['陈思雨','23'],['李明轩','21']],sources:[internal('门店交付排名','10月截至26日：26、23、21辆；未完月排名，区别于9月全国完整月。')],followups:['本月销售冠军是谁？']});
    if (old.key==='orders' && /车型缺口|哪个车型/.test(q)) return make('orders','宋 Pro DM-i订单缺口最大',['宋 Pro DM-i尚差14单，是当前最大的车型订单缺口。'],{headers:['车型','目标（单）','有效订单','缺口'],rows:[['宋 Pro DM-i','100','86','14'],['元 PLUS','80','70','10'],['秦 PLUS DM-i','70','62','8'],['汉 DM-i','50','46','4']],sources:[internal('分车型订单','目标合计300单、有效订单264单、缺口36单。')],followups:['分销售顾问看完成情况']});
    if (old.key==='orders' && /分销售顾问/.test(q)) return make('orders','分销售顾问订单完成情况',['以下按有效订单统计，与个人已交付排名分别计算。'],{headers:['顾问','目标','订单','完成率'],rows:[['周雨桐','35','34','97.1%'],['陈思雨','35','32','91.4%'],['李明轩','30','28','93.3%'],['其他顾问合计','200','170','85.0%']],sources:[internal('顾问订单目标','目标合计300单、有效订单合计264单。')],followups:['哪个车型缺口最大？']});
    if (['policy','materials'].includes(old.key)) {
      if (!window.DemoAccess?.canReadKnowledge('sales')) return policy();
      if (/材料|清单/.test(q)) return materials(/客户/.test(q));
      if (/话术/.test(q)) return old.key==='materials'?materials(true):policy(true);
      if (/申请条件/.test(q)) return make('materials','先核对这几项申请条件',['旧车应在2025年1月8日前登记于申请人名下并持续持有至转让；新旧车车主须为同一人，相关交易及登记须符合2026年实施期要求。','在深圳符合条件的销售企业购买新车，并在广东省内登记。2026年仅能选择一次政府报废更新或置换更新补贴。'],{sources:[policySource()],followups:['置换补贴需要哪些材料？']});
    }
    if (old.key==='brandTrend' && /纯电.*插混/.test(q)) return brandTrend(true);
    if (old.key==='brandTrend' && /9月各品牌销量/.test(q)) return null; // Existing public brand breakdown.
    return null;
  }
  function normalizeReply(response) {
    const old=response.context?.homeScenario;
    if (['policy','materials'].includes(old?.key) && !window.DemoAccess?.canReadKnowledge('sales')) return policy();
    if (old?.section==='personal') return reply(old.field==='hometown'?'籍贯':'入职时间',response.context);
    return response;
  }
  return { pages, iconFor, reply, normalizeReply };
})();
