/* Deterministic demo scenarios. No model API or real business data is connected. */
window.DemoChat = (() => {
  const people = [
    { id: 'wang', name: '王小迪', store: '腾势坪山4S店', region: '粤桂琼战区', monthly: [22, 25, 28, 32, 34, 38], leads: 126 },
    { id: 'li', name: '李明轩', store: '广州天河4S店', region: '粤桂琼战区', monthly: [19, 22, 24, 26, 28, 31], leads: 112 },
    { id: 'chen', name: '陈思雨', store: '上海虹桥4S店', region: '华东战区', monthly: [17, 18, 21, 23, 26, 27], leads: 108 },
  ];
  const scopes = ['全国门店', '粤桂琼战区', '腾势坪山4S店'];
  const dynastyPeople = [
    { id: 'dynasty-li', name: '李明轩', store: '深圳南山王朝旗舰店', region: '华南战区', monthly: [22, 25, 28, 32, 34, 38], leads: 126 },
    { id: 'dynasty-wang', name: '王浩', store: '广州天河王朝店', region: '华南战区', monthly: [19, 22, 24, 26, 28, 31], leads: 112 },
    { id: 'dynasty-chen', name: '陈思雨', store: '上海虹桥王朝店', region: '华东战区', monthly: [17, 18, 21, 23, 26, 27], leads: 108 },
  ];
  const employeeRecords = {
    wang: { hometown: '广东惠州', joinedAt: '2021年6月8日', tenure: '5年4个月' },
    li: { hometown: '广东广州', joinedAt: '2022年5月16日', tenure: '4年5个月' },
    chen: { hometown: '浙江杭州', joinedAt: '2023年2月6日', tenure: '3年8个月' },
    'dynasty-li': { hometown: '广东梅州', joinedAt: '2022年3月15日', tenure: '4年7个月' },
    'dynasty-wang': { hometown: '广东佛山', joinedAt: '2021年8月9日', tenure: '5年2个月' },
    'dynasty-chen': { hometown: '浙江杭州', joinedAt: '2023年2月6日', tenure: '3年8个月' },
  };
  const models = ['Z9', 'N9', 'N8L', '汉 DM-i', '宋 PLUS DM-i', '秦 PLUS DM-i'];
  const roster = network => network === 'wangchao' ? dynastyPeople : people;
  const networkName = network => network === 'wangchao' ? '王朝网' : '腾势';
  const periodLabel = period => period === '2026年9月' ? '2026年9月' : '2026年10月截至24日';
  const source = (title, period = '2026年10月') => ({ title, description: `统计月份：${period}。`, updated: '2026-10-24' });
  function enrichSources(response) {
    if (response.sources?.length !== 1) return response;
    const original = response.sources[0], title = original.title;
    const period = original.description.match(/统计月份：([^。]+)/)?.[1] || response.context?.period || '2026年10月';
    const scope = response.context?.scope || '所选门店范围';
    const person = personById(response.context?.personId);
    const owner = person ? `${person.name}（${person.store}）` : scope;
    const entries = /基础信息/.test(title) ? [
      [title, '销售运营人员档案', `核对${owner}的姓名、人员编号和在岗状态。`],
      ['门店与战区组织档案', '组织管理', '核对门店名称、门店编码及所属战区，按当前有效组织关系展示。'],
      ['销售顾问门店任职记录', '人力资源管理', '依据任职生效日期确认顾问所属门店；跨店调动按生效时间划分。'],
    ] : /线索|成交/.test(title) ? [
      [title, 'CRM 经营分析', `按${owner}汇总有效线索与成交车辆数，计算同周期成交率。`],
      ['客户线索去重明细', 'CRM 线索管理', '合并同一客户的重复留资，排除无效号码、测试及已作废线索。'],
      ['线索分配与归属记录', 'CRM 客户分配', '依据分配记录确认统计期内的顾问归属，避免转派客户重复计入。'],
      ['已交付销售订单明细', 'DMS 订单管理', '核对成交订单、交付日期与销售顾问编号，按车辆去重统计成交量。'],
      ['成交率指标口径', '经营指标字典', '成交车辆数除以同周期有效线索数；车辆数与客户数分别保留，不混用分母。'],
    ] : /车型/.test(title) ? [
      [title, '销售运营看板', `按${scope}及所选车型汇总销量，用于同口径比较。`],
      ['车型与车系主数据', '车辆基础资料', '统一车型编码和车系名称，合并历史别名，避免同一车型被拆分统计。'],
      ['车型销售订单明细', 'DMS 订单管理', '按车型编码关联订单，核对销售状态、门店和车辆唯一编号。'],
      ['车辆交付台账', '交付管理', '按实际交付日期归属统计月份，核对车型、门店及交付状态。'],
      ['销量统计口径', '经营指标字典', '仅计入已交付车辆；排除取消、重复及内部测试订单，以相同范围和周期进行对比。'],
    ] : /业绩|人均/.test(title) ? [
      [title, '销售运营看板', `汇总${owner}及${scope}的个人销量、排名与月度业绩。`],
      ['销售订单成交明细', 'DMS 订单管理', '核对订单状态、销售顾问编号、所属门店和车辆唯一编号，关联个人成交记录。'],
      ['车辆交付确认台账', '交付管理', '依据交付完成日期归属销量月份；未交付订单不提前计入当月销量。'],
      ['销售顾问业绩归属记录', 'CRM 客户与顾问管理', '依据订单业绩归属人统计个人销量，转派或协作订单按归属规则处理。'],
      ['门店及战区组织档案', '组织管理', `按${scope}筛选参与比较的门店及在岗销售顾问，确定排名和人均计算范围。`],
      ['订单取消与退车调整记录', 'DMS 售后与订单调整', '复核取消、退车及跨月冲销记录，排除重复统计，并回写对应月份。'],
      ['销量与排名指标口径', '经营指标字典', '销量按已交付车辆数统计；按顾问汇总后降序排名，累计及月均指标沿用相同统计范围。'],
    ] : null;
    if (!entries) return response;
    return { ...response, sources: entries.map(([name, system, detail], i) => ({
      title: name, description: `系统：${system}。统计周期：${period}；范围：${scope}。${detail}`,
      updated: `2026-10-24 ${i === 0 ? '09:00' : '08:30'}`,
    })) };
  }
  const pct = n => `${n.toFixed(1)}%`;
  const personById = id => [...people, ...dynastyPeople].find(p => p.id === id);
  function requestedFields(text) {
    const fields = [];
    if (/哪里人|籍贯|老家|个人背景|人员资料/.test(text)) fields.push('hometown');
    if (/入职|加入公司|来公司|来了多久|任职多久|工龄|任职情况|个人背景|人员资料/.test(text)) fields.push('joinedAt');
    return fields;
  }
  function modelMix(person, state) {
    const names = state.network === 'wangchao' ? ['汉 DM-i', '宋 PLUS DM-i', '秦 PLUS DM-i', '其他车型'] : ['腾势Z9', '腾势N9', '腾势N8L', '其他车型'];
    const amount = person.monthly[state.period === '2026年9月' ? 4 : 5];
    const first = Math.round(amount * .5), second = Math.round(amount * 11 / 38), third = Math.round(amount * 6 / 38);
    return { names, amount, counts: [first, second, third, amount - first - second - third] };
  }
  function personCard(person, state, badge) {
    const mix = modelMix(person, state);
    return { personId: person.id, name: person.name, store: `${networkName(state.network)} · ${person.store}`, badge, role: '销售顾问', avatar: null, avatarTone: [...people, ...dynastyPeople].findIndex(item => item.id === person.id),
      fields: [{ label: state.period === '2026年9月' ? '上月交付' : '本月交付', value: `${mix.amount}辆` }, { label: '销量最高车型', value: mix.names[0] }],
    };
  }
  function personalReply(response, text, person) {
    const fields = requestedFields(text);
    if (!fields.length) return response;
    const publicParagraphs = [...response.paragraphs];
    const personalParts = fields.map(field => {
      // Authorization is checked before accessing the simulated employee record.
      if (!window.DemoAccess?.canReadEmployee(field, person)) return { field, text: `当前账号无权查看${person.name}的${field === 'hometown' ? '籍贯' : '入职时间及任职时长'}。` };
      const record = employeeRecords[person.id];
      return { field, text: field === 'hometown' ? `${person.name}是${record.hometown}人。` : `${person.name}于${record.joinedAt}入职，截至2026年10月24日约${record.tenure}。` };
    });
    if (response.profile) {
      const facts = fields.flatMap(field => {
        if (!window.DemoAccess?.canReadEmployee(field, person)) return [{ label: field === 'hometown' ? '籍贯' : '入职时间', value: '无查看权限', permission: field }];
        const record = employeeRecords[person.id];
        return field === 'hometown' ? [{ label: '籍贯', value: record.hometown, permission: field }] : [{ label: '入职时间', value: record.joinedAt, permission: field }];
      });
      const tenure = fields.includes('joinedAt') && window.DemoAccess?.canReadEmployee('joinedAt', person) ? employeeRecords[person.id].tenure : null;
      response = { ...response, profile: { ...response.profile, tenure, fields: [...facts, ...response.profile.fields] } };
    }
    const personalInCard = Boolean(response.profile);
    return { ...response, paragraphs: [...publicParagraphs, ...personalParts.filter(item => !personalInCard || !window.DemoAccess?.canReadEmployee(item.field, person)).map(item => item.text)], publicParagraphs, personalParts, personalInCard };
  }
  function detect(text) {
    if (/销冠|TOP\s*1|第一名|冠军|谁.*(卖得最好|卖.*最多|表现.*突出|卖得好)/i.test(text)) return 'rank';
    if (/第二名.*(呢|谁|信息)|看看第二名/.test(text)) return 'runnerup';
    if (/一直.*(好|这样)|历史表现|是否稳定|稳定吗/.test(text)) return 'trend';
    if (/主要卖|卖什么车|哪[个款].*车型.*(最多|最好)|车型.*(构成|结构)/.test(text)) return 'distribution';
    if (/哪个店|哪家店|在哪里|门店信息|任职情况|个人背景|人员资料|入职|哪里人|籍贯|老家|加入公司|来公司|来了多久|任职多久|工龄/.test(text)) return 'profile';
    if (/推广|其他店.*学|访谈提纲/.test(text)) return 'learning';
    if (/对比|比较|哪个.*多/.test(text) && /车型|Z9|N9|N8L/i.test(text)) return 'models';
    if (/平均|均值/.test(text)) return 'average';
    if (/第二名|多卖/.test(text)) return 'gap';
    if (/成交率|转化率/.test(text)) return 'conversion';
    if (/增长.*原因|增长.*因素|为什么.*增长/.test(text)) return 'growth';
    if (/趋势|近.*个月/.test(text)) return 'trend';
    if (/跟进|进展/.test(text)) return 'progress';
    if (/经验|方法|销售技巧/.test(text)) return 'experience';
    if (/哪个店|哪家店|在哪里|入职|哪里人/.test(text)) return 'profile';
    if (/销冠|TOP\s*1|第一名|冠军|谁.*卖.*最多|销量最多/i.test(text)) return 'rank';
    if (/销量|卖了|卖多少|销售多少/.test(text)) return 'sales';
    return null;
  }
  function slots(text, network) {
    const p = roster(network).find(p => text.includes(p.name));
    const store = roster(network).find(p => text.includes(p.store));
    const scope = /全国/.test(text) ? scopes[0] : store ? store.store : /粤桂琼/.test(text) ? scopes[1] : /坪山/.test(text) ? scopes[2] : /华南/.test(text) ? '华南战区' : /华东/.test(text) ? '华东战区' : undefined;
    const period = /上个?月|9月/.test(text) ? '2026年9月' : /本月|这个月|最近|10月/.test(text) ? '2026年10月' : undefined;
    const selectedModels = models.filter(model => new RegExp(`(^|[^A-Z0-9])${model}([^A-Z0-9]|$)`, 'i').test(text));
    return { ...(p ? { personId: p.id } : {}), ...(scope ? { scope } : {}), ...(period ? { period } : {}), ...(selectedModels.length ? { models: selectedModels } : {}) };
  }
  function clarify(field, intent, values, state, extra = '') {
    const fields = {
      intent: ['你想了解哪方面的信息?', ['本月销量 TOP1 的销售是谁?', '本月 Z9 和 N9 销量对比', '帮我写跟进进展']],
      scope: ['请问您指的门店是哪个范围?', scopes],
      period: ['想查询哪个月份的数据?', ['本月（2026年10月）', '上月（2026年9月）']],
      personId: ['你想了解哪位销售顾问?', roster(state.network).map(p => p.name)],
      models: ['请选择需要对比的两款车型', state.network === 'wangchao' ? models.slice(3) : models.slice(0, 3)],
      details: ['请补充客户及跟进情况', []],
    };
    const [question, options] = fields[field];
    return {
      kind: 'clarify', question, options, field, multiple: field === 'models',
      hint: extra || (field === 'details' ? '可直接输入，例如：张先生，今天试驾Z9，关注置换补贴，周五回访。' : '也可以在输入框直接补充信息。'),
      context: { ...state, pending: { field, intent, values } }, sources: [], followups: [],
    };
  }
  function answer(title, paragraphs, state, extra = {}) {
    return enrichSources({ kind: 'answer', title, paragraphs, context: { ...state, pending: null }, sources: [], followups: [], ...extra });
  }
  function buildReply(text, previous = {}) {
    const state = { ...previous };
    const network = /王朝|汉\s*DM|宋\s*PLUS|秦\s*PLUS/i.test(text) ? 'wangchao' : /腾势|Z9|N9|N8L/i.test(text) ? 'tengshi' : state.network || 'tengshi';
    if (state.network && state.network !== network) { delete state.personId; delete state.scope; delete state.pending; }
    state.network = network;
    const explicit = slots(text, network);
    let intent = detect(text), values;
    if (!intent && (explicit.scope || explicit.period)) intent = explicit.scope ? 'rank' : state.lastIntent || 'rank';
    const prompt = text.replace(/[\s?？。！!]/g, '');
    if (['帮我写跟进进展', '给我一份客户跟进示例'].includes(prompt) || (state.followupExample && ['压缩成一句话', '改成客户跟进短信', '补充下次跟进安排'].includes(prompt))) {
      const drafts = {
        '压缩成一句话': ['一句话跟进记录示例', '客户已试驾腾势Z9，关注置换补贴，待补充报价方案并于周五回访。'],
        '改成客户跟进短信': ['客户回访短信示例', '您好，感谢您体验腾势Z9。我会整理您关注的置换补贴和报价方案，周五再与您沟通，您有其他问题也可以随时联系我。'],
        '补充下次跟进安排': ['下一步跟进安排示例', '周五回访：先发送腾势Z9报价与置换补贴说明，再确认客户的预算和购车时间，并记录下一次沟通安排。'],
      };
      const [title, content] = drafts[prompt] || ['客户跟进进展示例', '客户今天试驾腾势Z9，重点关注置换补贴和落地价格。下一步整理报价及补贴方案，计划周五回访。'];
      return answer(title, [content], { ...state, followupExample: true }, { followups: ['压缩成一句话', '改成客户跟进短信', '补充下次跟进安排'].filter(item => item !== prompt) });
    }
    if (['给我一份试驾前确认清单', '给我一段试驾后回访话术'].includes(prompt)) {
      return answer(prompt.includes('清单') ? '试驾前确认清单' : '试驾后回访话术参考', prompt.includes('清单') ? [
        '1. 确认需求：常用人数、主要出行场景和购车预算。', '2. 安排体验：确认试驾车型、到店时间和重点体验项目。', '3. 准备资料：提前整理配置差异、报价和客户关注的补贴信息。',
      ] : ['您好，今天试驾后，您对车辆的空间、驾驶感受和配置还有哪些疑问？我可以先为您整理关心的问题，再约一个方便的时间沟通。'], state, { followups: ['帮我写跟进进展', '看看销冠经验'] });
    }
    if ((intent && !['progress', 'experience'].includes(intent)) || (state.pending && !['details', 'intent'].includes(state.pending.field))) {
      const year = text.match(/(\d{4})年/), month = text.match(/(?:^|[^\d])(\d{1,2})月/);
      if ((year && year[1] !== '2026') || (month && !['9', '09', '10'].includes(month[1]))) return answer('该时段暂无数据', ['目前可查询2026年9月和10月，近6个月趋势使用2026年5月至10月的完整记录。请补充一个可查询的月份。'], state, { followups: ['本月销量 TOP1 的销售是谁?'] });
    }
    const pending = state.pending;
    if (pending && /^跳过/.test(text)) return answer('已跳过补充', ['缺少必要信息，暂不生成该项结论。你可以随时补充范围、月份或查询对象后继续。'], state);
    if (pending && pending.field === 'details' && (!intent || intent === 'progress')) {
      const parts = text.split(/[，,；;\n]+/).map(s => s.trim()).filter(Boolean);
      return answer('客户跟进记录草稿', ['以下仅整理你提供的信息，没有补写成交结果或客户承诺。'], state, {
        rows: parts.map((part, i) => [i === 0 ? '客户 / 记录主题' : `补充信息 ${i}`, part]), headers: ['项目', '内容'],
        followups: ['继续补充下一步跟进安排'],
      });
    }
    const fillsPending = pending && (pending.field === 'intent' ? Boolean(intent) : pending.field === 'scope' || Boolean(explicit[pending.field]));
    if (pending && fillsPending) {
      intent = pending.field === 'intent' ? intent : pending.intent;
      values = { ...pending.values, ...explicit };
    } else if (pending && !intent) {
      return clarify(pending.field, pending.intent, pending.values, state, '这条补充还不能确定查询条件，请选择下面的选项或直接输入明确的信息。');
    } else {
      values = { ...explicit };
      if (!intent && personById(values.personId)) intent = 'profile';
      if (!intent && /^(你好|您好|嗨|hello)/i.test(text)) return answer('你好', ['我可以帮你查询销量、销售趋势、车型对比和客户跟进整理。你想先了解哪一项?'], state, { followups: ['本月销量 TOP1 的销售是谁?', '本月 Z9 和 N9 销量对比'] });
      if (!intent) return clarify('intent', null, {}, state);
      if (['trend', 'conversion', 'growth', 'profile', 'gap', 'average', 'sales', 'distribution', 'learning'].includes(intent)) values.personId ||= state.personId;
      values.period ||= state.period;
    }
    values.scope ||= state.scope || scopes[0];
    if (intent === 'average' && /门店/.test(text) && !explicit.scope && personById(values.personId)) values.scope = personById(values.personId).store;
    if (intent === 'rank' || intent === 'runnerup') values.period ||= '2026年10月';
    if (intent === 'progress') return clarify('details', intent, values, state);
    if (['rank', 'models'].includes(intent) && !values.period) return clarify('period', intent, values, state);
    if (intent === 'models' && values.models?.length !== 2) return clarify('models', intent, values, state);
    if (['trend', 'conversion', 'growth', 'profile', 'gap', 'average', 'sales', 'distribution', 'learning'].includes(intent) && !values.personId) return clarify('personId', intent, values, state);
    if (['conversion', 'average', 'sales'].includes(intent) && !values.period) return clarify('period', intent, values, state);
    Object.assign(state, values, { pending: null, lastIntent: intent });
    const index = values.period === '2026年9月' ? 4 : 5;
    const period = values.period || '2026年10月';
    const p = personById(values.personId);
    if (intent === 'profile') {
      const personal = requestedFields(text).length > 0;
      const publicInfo = !personal || /门店|哪个店|哪家店|在哪里/.test(text);
      const fullCard = /任职情况|个人背景|人员资料/.test(text);
      return personalReply(answer(`${p.name}的${personal ? '人员信息' : '门店信息'}`, publicInfo ? [`${p.name}所属门店为${p.store}，所属战区为${p.region}。`] : [], state, { ...(fullCard ? { profile: personCard(p, state, '人员资料') } : {}), sources: publicInfo ? [source('销售顾问基础信息')] : [], followups: [] }), text, p);
    }
    if (intent === 'distribution') {
      const { names, amount, counts } = modelMix(p, state), first = counts[0], second = counts[1];
      return answer(`${p.name}的车型销量`, [`${periodLabel(period)}，${p.name}交付最多的是${names[0]}，共${first}辆，占个人交付量的${pct(first / amount * 100)}；其次是${names[1]}，${second}辆。`], state, { chart: { labels: names, values: counts }, sources: [source('车型月度销量报表', periodLabel(period))], followups: ['他近6个月的销量趋势', '他的做法能让其他店学一学吗？'] });
    }
    if (intent === 'learning') {
      if (/推广清单/.test(text)) return answer('门店推广清单', ['先选择客群相近的门店试行两周，再根据反馈调整。'], state, { headers: ['环节', '建议动作'], rows: [['需求确认', '记录预算、用车场景和客户最关心的两项差异'], ['试驾跟进', '围绕关注点试驾，当天发送对比和报价清单'], ['复盘评估', '跟踪试驾后回访完成率与成交情况，核实效果后再扩大推广']], followups: [] });
      return answer(/访谈提纲/.test(text) ? '销售经验访谈提纲' : '值得进一步了解的销售做法', /访谈提纲/.test(text) ? [
        '1. 客户主要来自哪些渠道？哪些渠道更容易成交？', '2. 试驾前如何确认需求，试驾后如何跟进？', '3. 主销车型如何介绍，遇到价格顾虑如何回应？', '4. 哪些做法适合其他门店，推广需要什么条件？',
      ] : [`可以先在客群相近的门店试用。${p.name}的模拟复盘记录中，有三项做法可供参考：`, '1. 先确认预算与用车场景，再围绕主销车型解释客户最关心的差异。', '2. 试驾后当天发送配置对比与报价清单，逐项回应顾虑。', '3. 每次沟通约定下次联系时间，回访时先处理尚未解决的问题。', '以上为演示访谈内容，推广效果仍需试行核实，不能仅凭销量认定因果。'], state, { sources: /访谈提纲/.test(text) ? [] : [source('销售复盘访谈纪要（模拟）', periodLabel(period))], followups: /访谈提纲/.test(text) ? [] : ['整理一份门店推广清单'] });
    }
    if (intent === 'sales') return answer(`${p.name}的个人销量`, [`${period}，${p.name}的销量为${p.monthly[index]}辆，所属门店为${p.store}。`], state, { metrics: [[String(p.monthly[index]), '个人销量（辆）']], sources: [source('销售顾问月度业绩报表', period)], followups: ['他近6个月的销量趋势', '他的成交率是多少?'] });
    if (intent === 'rank' || intent === 'runnerup') {
      const ranked = roster(network).filter(person => values.scope === scopes[0] || person.region === values.scope || person.store === values.scope).sort((a, b) => b.monthly[index] - a.monthly[index]);
      const winner = ranked[intent === 'runnerup' ? 1 : 0];
      if (!winner) return answer('当前范围记录不足', ['当前范围暂无足够的销售记录，可切换全国门店查看。'], state, { followups: ['全国门店本月销售冠军是谁？'] });
      if (intent === 'runnerup') return personalReply(answer('销量第二名', [`${periodLabel(period)}，${networkName(network)}${values.scope}第二名是${winner.name}，来自${winner.store}，交付${winner.monthly[index]}辆。`], { ...state, personId: winner.id }, { followups: ['他近6个月的销量趋势', '主要卖什么车？'] }), text, winner);
      return personalReply(answer(`${period}销量第一名`, [`${periodLabel(period)}，${networkName(network)}${values.scope}销售冠军是${winner.name}，来自${winner.store}，累计交付${winner.monthly[index]}辆${ranked[1] ? `，领先第二名${winner.monthly[index] - ranked[1].monthly[index]}辆` : ''}。`, '演示数据；销量按已交付车辆数统计。'], { ...state, personId: winner.id }, {
        profile: personCard(winner, state, values.scope === scopes[0] ? '全国销冠' : '区域销冠'),
        rows: ranked.map(person => [person.name, person.store, String(person.monthly[index])]), headers: ['销售顾问', '门店', '销量（辆）'],
        sources: [source('销售顾问月度业绩报表', periodLabel(period))], followups: ['他近6个月的销量趋势', '主要卖什么车？'],
      }), text, winner);
    }
    if (intent === 'trend' || intent === 'growth') {
      const total = p.monthly.reduce((sum, n) => sum + n, 0), first = p.monthly[0], last = p.monthly[5];
      const rate = (last / first - 1) * 100;
      return answer(intent === 'trend' ? `${p.name}近6个月销量趋势` : `${p.name}的销量增长分析`, [
        `${p.name}5月至9月销量持续增长，从${first}辆提升到${p.monthly[4]}辆；10月截至24日已交付${last}辆，累计${total}辆。`,
        intent === 'growth' ? '当前数据只能确认销量变化；客户来源、转化效率与销售方法仍需进一步核实。' : `10月尚未结束，当前累计已比9月全月多${last - p.monthly[4]}辆（${pct((last / p.monthly[4] - 1) * 100)}），此处不作为完整月份环比。`,
      ], state, { metrics: [[String(total), '累计销量（辆）'], [String(p.monthly[4]), '9月全月（辆）'], [String(last), '10月截至24日（辆）']], chart: { labels: ['5月', '6月', '7月', '8月', '9月', '10月'], values: p.monthly, note: '10月为截至24日的累计值，其余为完整月份；演示数据。' }, sources: [source('销售顾问月度业绩报表', '2026年5月至10月24日')], followups: ['主要卖什么车？', '与门店平均销量对比'] });
    }
    if (intent === 'models') {
      const count = values.scope === scopes[0] ? [420, 310, 270] : values.scope === scopes[1] ? [160, 110, 90] : [86, 64, 50];
      const selectedCatalog = network === 'wangchao' ? models.slice(3) : models.slice(0, 3);
      const data = values.models.map(model => [model, index === 4 ? Math.round(count[selectedCatalog.indexOf(model)] * .9) : count[selectedCatalog.indexOf(model)]]);
      const diff = data[0][1] - data[1][1];
      const prefix = network === 'wangchao' ? '' : '腾势';
      return answer(`${prefix}${data[0][0]}与${prefix}${data[1][0]}销量对比`, [`${periodLabel(period)}，${values.scope}记录中，${prefix}${data[0][0]}为${data[0][1]}辆，${prefix}${data[1][0]}为${data[1][1]}辆，相差${Math.abs(diff)}辆。`], state, { chart: { labels: data.map(r => prefix + r[0]), values: data.map(r => r[1]) }, sources: [source('车型月度销量报表', periodLabel(period))], followups: [`${values.period === '2026年9月' ? '本月' : '上月'} ${data[0][0]} 和 ${data[1][0]} 销量对比`, '本月销售冠军是谁？'] });
    }
    if (intent === 'average') {
      const avg = values.scope === scopes[0] ? 23 : values.scope === scopes[1] ? 25 : 22;
      const amount = p.monthly[index], diff = amount - avg;
      return answer(`${p.name}与${values.scope}平均销量对比`, [`${period}数据中，${p.name}销售${amount}辆，所选范围内销售顾问人均${avg}辆，${diff >= 0 ? '高于' : '低于'}平均值${Math.abs(diff)}辆。`], state, { metrics: [[String(amount), '个人销量（辆）'], [String(avg), '范围内人均（辆）'], [(diff > 0 ? '+' : '') + diff, '差值（辆）']], sources: [source('个人及范围人均销量报表', period)], followups: ['他近6个月的销量趋势'] });
    }
    if (intent === 'conversion') {
      if (index !== 5) return answer('该月份缺少线索数据', [`现有记录只包含2026年10月的客户线索数据，不能计算${period}的成交率。`], state, { followups: ['本月他的成交率是多少?'] });
      return answer(`${p.name}本月成交率`, [`以“成交车辆数 ÷ 有效线索数”为统计口径：${p.name}本月成交${p.monthly[5]}辆，有效线索${p.leads}条，成交率为${pct(p.monthly[5] / p.leads * 100)}。`, '实际业务中需要先确认同一统计周期，以及去重客户数和车辆数的使用口径。'], state, { sources: [source('有效线索与成交记录')], followups: ['他近6个月的销量趋势'] });
    }
    if (intent === 'gap') {
      const ranked = roster(network).filter(person => !state.scope || state.scope === scopes[0] || person.region === state.scope || person.store === state.scope).sort((a, b) => b.monthly[index] - a.monthly[index]);
      if (ranked.length < 2) return answer('当前范围记录不足', [`${state.scope}只包含一位销售顾问的记录，无法计算与第二名的差距。`], state, { followups: ['全国门店本月销量TOP1是谁?'] });
      return answer('与第二名的销量差距', [`${period}，${ranked[0].name}${ranked[0].monthly[index]}辆，第二名${ranked[1].name}${ranked[1].monthly[index]}辆，相差${ranked[0].monthly[index] - ranked[1].monthly[index]}辆。`], state, { sources: [source('销售顾问月度业绩报表', period)], followups: ['他近6个月的销量趋势'] });
    }
    if (intent === 'profile') return answer(`${p.name}的门店信息`, [`${p.name}所属门店为${p.store}，所属战区为${p.region}。`, '现有资料没有籍贯和入职日期，因此无法提供这两项信息。'], state, { sources: [source('销售顾问基础信息')], followups: ['他近6个月的销量趋势'] });
    return answer('销售方法参考：三条建议', ['1. 先问清需求：了解客户的用车场景、预算和购车时间，再推荐适合的车型。', '2. 围绕关注点试驾：提前确认客户最关心的两三个问题，试驾后逐项回应。', '3. 每次沟通留下一步：记录客户疑问，明确下次联系时间和需要准备的方案。'], state, { followups: ['给我一份试驾前确认清单', '给我一段试驾后回访话术', '帮我写跟进进展'] });
  }
  function stageFor(text, intent) {
    if (intent !== 'profile') return intent;
    const fields = requestedFields(text);
    return fields.includes('joinedAt') ? 'tenure' : fields.includes('hometown') ? 'hometown' : 'profile';
  }
  function nextQuestions(state, stage) {
    const seen = new Set(state.journey?.seen || [stage]);
    const person = personById(state.personId);
    const questions = {
      trend: '他一直都这么好吗？', tenure: '了解他的任职情况', hometown: '他是哪里人？',
      distribution: '主要卖什么车？', learning: '他的做法能让其他店学一学吗？',
    };
    const order = { rank: ['trend', 'tenure', 'distribution'], runnerup: ['trend', 'distribution'], trend: ['tenure', 'distribution', 'learning'], growth: ['distribution', 'learning'], tenure: ['hometown', 'distribution', 'trend', 'learning'], hometown: ['distribution', 'trend', 'learning'], profile: ['trend', 'distribution'], distribution: ['learning', 'trend', 'tenure'], sales: ['trend', 'distribution'], gap: ['trend', 'distribution'] }[stage];
    if (!order) return null;
    return order.filter(key => !seen.has(key) && (key !== 'hometown' || window.DemoAccess?.canReadEmployee('hometown', person)) && (key !== 'tenure' || window.DemoAccess?.canReadEmployee('joinedAt', person))).slice(0, 2).map(key => questions[key]);
  }
  function reply(text, previous = {}) {
    const salesResponse = window.SalesDialogue?.reply(text, previous);
    if (salesResponse) return salesResponse;
    const response = buildReply(text, previous);
    if (response.context.lastIntent && !['objection', 'knowledge'].includes(response.context.lastIntent)) delete response.context.salesContext;
    if (response.kind !== 'answer' || !personById(response.context?.personId)) return response;
    const stage = stageFor(text, response.context.lastIntent);
    const key = `${response.context.personId}|${response.context.period || '2026年10月'}|${response.context.scope}`;
    const seen = previous.journey?.key === key ? [...previous.journey.seen] : [];
    const fields = requestedFields(text);
    for (const item of [stage, ...(fields.includes('hometown') ? ['hometown'] : []), ...(fields.includes('joinedAt') ? ['tenure'] : [])]) if (item && !seen.includes(item)) seen.push(item);
    response.context = { ...response.context, journey: { key, seen, stage } };
    const followups = nextQuestions(response.context, stage);
    if (followups) response.followups = followups;
    return response;
  }
  function normalizeReply(response) {
    response = window.SalesDialogue?.normalizeReply(response) || response;
    if (response.personalParts?.length) {
      const person = personById(response.context?.personId);
      const personalParts = response.personalParts.map(part => ({ ...part, text: window.DemoAccess?.canReadEmployee(part.field, person) ? part.text : `当前账号无权查看${person?.name || '该员工'}的${part.field === 'hometown' ? '籍贯' : '入职时间及任职时长'}。` }));
      response = { ...response, personalParts, paragraphs: [...(response.publicParagraphs || []), ...personalParts.filter(part => !response.personalInCard || !window.DemoAccess?.canReadEmployee(part.field, person)).map(part => part.text)] };
    }
    response = enrichSources(response);
    if (/销量第一名$/.test(response.title) && response.rows?.length) {
      const [name, store, sales] = response.rows[0];
      const person = personById(response.context?.personId);
      response = { ...response,
        profile: response.profile?.fields ? response.profile : person ? personCard(person, response.context, response.context.scope === scopes[0] ? '全国销冠' : '区域销冠') : { name, store, badge: '销冠', role: '销售顾问', fields: [{ label: '个人交付', value: `${sales}辆` }] },
      };
      delete response.metrics;
      response.followups = nextQuestions(response.context, 'rank');
    }
    if (response.profile) {
      const profile = response.profile;
      const candidate = personById(profile.personId || response.context?.personId);
      const person = candidate && candidate.name === profile.name ? candidate : roster(response.context?.network).find(item => item.name === profile.name);
      const identity = person ? personCard(person, { ...response.context, network: person.id.startsWith('dynasty-') ? 'wangchao' : 'tengshi' }, profile.badge) : null;
      // Refresh cached demo identities as well as newly generated cards.
      const fallbackTone = Array.from(profile.name || '').reduce((sum, char) => sum + char.codePointAt(0), 0) % 6;
      response = { ...response, profile: { ...profile,
        ...(identity ? { personId: identity.personId, name: identity.name, store: identity.store } : {}),
        avatar: identity ? identity.avatar : profile.avatar === 'assets/ebdd8.png' ? null : profile.avatar,
        avatarTone: identity ? identity.avatarTone : fallbackTone,
      } };
    }
    if (response.profile?.fields) {
      const person = personById(response.profile.personId || response.context?.personId);
      response = { ...response, profile: { ...response.profile, tenure: window.DemoAccess?.canReadEmployee('joinedAt', person) ? response.profile.tenure : null, fields: response.profile.fields.map(field => field.permission && !window.DemoAccess?.canReadEmployee(field.permission, person) ? { ...field, value: '无查看权限' } : field) } };
    }
    if (response.context?.personId) {
      const stage = response.context.journey?.stage || (response.context.lastIntent === 'profile' && response.personalParts?.length ? response.personalParts.some(part => part.field === 'joinedAt') ? 'tenure' : 'hometown' : response.context.lastIntent);
      const followups = nextQuestions(response.context, stage);
      if (followups) response = { ...response, followups };
    }
    const clean = text => String(text ?? '')
      .replace('本地场景演示数据，非真实业务记录。', '')
      .replace('这里只比较当前演示样本，不代表真实门店或全国完整排名。', '排名基于当前已收录的销售记录。')
      .replace('以下是销售跟进的通用建议，不是某位销冠的真实访谈记录。', '以下是可以参考的销售跟进方法。')
      .replace(/演示样本没有/g, '现有资料没有').replace(/演示样本只包含/g, '现有记录只包含')
      .replace(/演示样本/g, '记录').replace(/演示销量/g, '销量')
      .replace(/本次演示口径/g, '统计口径').replace(/演示记录/g, '记录')
      .replace(/我可以演示销量查询/g, '我可以帮你查询销量').replace(/参与比较的样本/g, '参与比较的人数')
      .replace(/业绩样本/g, '业绩报表').replace(/销量样本/g, '销量报表').replace(/成交样本/g, '成交记录').replace(/信息样本/g, '信息')
      .replace(/暂无演示样本/g, '暂无数据');
    return { ...response, title: clean(response.title),
      paragraphs: response.paragraphs?.map(clean),
      metrics: response.metrics?.map(([value, label]) => [value, clean(label)]),
      sources: (response.sources || []).map(item => ({ ...item, title: clean(item.title), description: clean(item.description) })),
    };
  }
  return { reply, normalizeReply };
})();
