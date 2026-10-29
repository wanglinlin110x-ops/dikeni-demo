/* Deterministic sales coaching and inspectable fictional policy documents. No CRM or live offers. */
window.SalesDialogue = (() => {
  const documents = {
    october: {
      id: 'DK-POLICY-DEMO-202610', title: '10月厂家置换权益细则', version: 'V1.2', status: '已审核（演示设定）', approved: true,
      scope: '深圳 · 汉 DM-i · 2026年10月购车 · 指定金融方案', starts: '2026-10-01', ends: '2026-10-31', audience: 'sales',
      origin: '本项目编写的模拟政策，不对应真实优惠',
      parts: [
        { id: 'conditions', title: '第一条 · 适用条件', text: '本演示方案适用于2026年10月在深圳购买指定汉 DM-i车型、符合置换申请资格的客户。须核对具体配置、购车日期、置换资格及所选金融方案；条件未确认前，不作最终权益承诺。' },
        { id: 'materials', title: '第二条 · 申请材料', text: '本演示申请需准备购车人身份证明、旧车登记与行驶资料、置换交易凭证及新车订单信息；如申请金融方案，还需按指定方案核对所需材料。以上为模拟清单，不代表真实办理要求。' },
        { id: 'stacking', title: '第三条 · 权益叠加', text: '符合申请条件的客户，厂家置换权益可与本细则指定金融方案同时享受。其他地方补贴、经销商优惠需分别核对，不因本条款自动确认可叠加。' },
      ],
    },
    draft: {
      id: 'DK-POLICY-DEMO-202611-DRAFT', title: '11月厂家置换权益细则', version: 'V0.1', status: '待审核（演示设定）', approved: false,
      scope: '模拟草稿，尚未发布', starts: '2026-11-01', ends: '2026-11-30', audience: 'sales', origin: '本项目编写的模拟草稿',
      parts: [{ id: 'draft', title: '草稿说明', text: '该资料尚未完成审核，不能据此确认任何权益适用、叠加、金额或客户资格。' }],
    },
  };
  const entries = ['客户说有点贵，怎么接？', '置换权益和金融优惠能叠加吗？'];
  const options = ['客户预算已到上限', '客户正在比较另一款车', '客户不确定差价是否值得', '还不清楚，先帮我追问'];
  const plans = {
    budget: { title: '先按预算筛选方案', basis: '客户已明确总预算限制。', quote: '明白，我们先按您的总预算选。哪些需求是一定要保留的？', short: '咱们按总预算选，您最想保留哪些需求？', next: '确认可接受的总支出和最重要的两项需求，再核对预算内车型及配置。' },
    compare: { title: '先统一比较条件', basis: '客户提到了另一款车，具体配置和费用仍需核对。', quote: '您比较的是哪款配置？我们把落地费用和您最在意的两项需求放在一起看。', short: '您在比哪款配置？咱们按落地费用和关键需求一起看。', next: '确认对比车型、配置和报价条件，再整理客户关心的差异，不直接承诺价格或优惠。' },
    value: { title: '把差价对应到实际用途', basis: '客户不确定差价是否值得，仍需确认他真正重视的需求。', quote: '您觉得差价主要体现在哪？我们按您最常用的两个场景一起看看，哪些差异对您有用。', short: '咱们按您最常用的场景，看看差价是否值得。', next: '请客户选出两个重要用车场景，再通过资料和针对性体验核对差异。' },
    family: { title: '先补齐家人关心的信息', basis: '客户提到与家人商量，尚不能确定具体顾虑或决策分工。', quote: '家里人更关心哪方面？我可以先把资料整理给您，您和家人方便时再一起体验。', short: '家里人最关心什么？我先帮您整理资料。', next: '根据家人关注点补充资料；客户愿意再到店时，再确认体验安排。' },
    unknown: { title: '先确认顾虑，再决定怎么回应', basis: '目前信息不足，不能据此判断预算不足或购买意愿低。', quote: '您主要是觉得超出预算，还是和另一款车相比，觉得差价不太值？', short: '您更在意总预算，还是和另一款车的差价？', next: '听取客户补充后，再选择预算、比较或价值方向。' },
  };
  const shortRequest = text => /压成一句|更短|简短一点|再短|一句话术/.test(text);
  const scriptRequest = text => /客户话术|整理成.*话术|给客户怎么说|自然.*说法|换.*说法/.test(text);
  const clean = text => text.replace(/[\s？?。！!]/g, '');
  function make(title, paragraphs, previous, sales, extra = {}) {
    return { kind: 'answer', title, paragraphs, sources: [], followups: [], context: { ...previous, pending: null, lastIntent: sales.mode, journey: null, salesContext: sales }, ...extra };
  }
  function objection(text, previous, old) {
    const customer = text.match(/([\u4e00-\u9fa5](?:先生|女士))/)?.[1];
    const fresh = /换[一个位]+客户|另一个客户|新客户|重新分析/.test(text) || (customer && old.customer && customer !== old.customer);
    const sales = { ...(fresh ? {} : old), mode: 'objection', customer: customer || (fresh ? '' : old.customer) || '', policy: undefined };
    if (/^(帮我分析客户顾虑|客户异议诊断|分析客户异议)$/.test(clean(text))) return make('客户当时是怎么说的？', ['贴一句客户原话即可，也可以补充当时的场景，不必填写客户档案。'], previous, sales, { followups: ['客户试驾后说有点贵，再看看', '客户说要回去和家人商量'] });
    if (/补充.*客户情况|修正.*客户情况|客户补充了新情况|换一种判断/.test(text)) return make('客户又补充了什么？', ['直接输入客户的新反馈，我会据此更新建议；信息还不清楚时，先帮您组织追问。'], previous, sales, { quote: plans.unknown.quote, quoteLabel: '可以先这样问', followups: options.slice(0, 3) });
    if ((shortRequest(text) || scriptRequest(text)) && sales.branch) {
      const plan = plans[sales.branch];
      const natural = { budget: '那咱们就按您的预算来，您最想保留哪些需求？', compare: '您看中另一款的哪项？咱们把配置和落地费用放一起看看。', value: '咱们就按您平时怎么用车来比，看看这些差异用不用得上。', family: '家里人最在意哪方面？我先把资料整理好，方便您一起商量。', unknown: '您是觉得超预算了，还是跟另一款比起来差价不太值？' };
      const quote = shortRequest(text) ? plan.short : natural[sales.branch];
      return make('可以直接这样说', [], previous, { ...sales, lastScript: quote }, { quote, followups: ['客户补充了新情况'] });
    }
    const notBudget = /不是预算|预算.*(能接受|没问题|够|可以接受)/.test(text);
    let branch = 'unknown';
    if (/家人|家里|商量/.test(text)) branch = 'family';
    else if (!notBudget && /预算.*(上限|不够|不足|有限|到顶|超出)|超[出过]?预算/.test(text)) branch = 'budget';
    else if (/比较|对比|另一款|另外一款|别家|另一家|便宜/.test(text)) branch = 'compare';
    else if (/差价.*(不值|是否值|值得|没.*值)|不确定.*差价|没看懂.*价值/.test(text)) branch = 'value';
    const plan = plans[branch];
    const changed = sales.branch && sales.branch !== branch && branch !== 'unknown';
    sales.originalQuote ||= text;
    sales.latestFeedback = text;
    sales.branch = branch;
    sales.lastScript = plan.quote;
    const response = make(changed ? `更新建议：${plan.title}` : plan.title, branch === 'unknown' ? [plan.basis] : [], previous, sales, {
      quote: plan.quote, quoteLabel: branch === 'unknown' ? '可以先这样问' : '可以这样说',
      rationale: branch === 'unknown' ? null : `依据：${plan.basis}`,
      nextStep: branch === 'unknown' ? null : plan.next,
      followups: branch === 'unknown' ? options : ['压成一句话', '客户补充了新情况'], notice: '模拟销售建议',
    });
    if (branch === 'compare') response.followups = ['整理对比要点', '压成一句话'];
    return response;
  }
  function getEvidence(section, full = false, docKey = 'october') {
    const doc = documents[docKey];
    if (!doc || !window.DemoAccess?.canReadKnowledge(doc.audience)) return null;
    const selected = doc.parts.find(part => part.id === section);
    if (!selected && !full) return null;
    return { ...doc, selected: section, parts: full ? doc.parts.map(p => ({ ...p })) : [{ ...selected }] };
  }
  function knowledge(text, previous, old) {
    const sales = { ...(old.mode === 'knowledge' ? old : {}), mode: 'knowledge', customer: old.customer || '陈先生', policy: { ...old.policy } };
    const p = sales.policy;
    const example = /置换权益和金融优惠能叠加吗|查看置换与金融叠加示例|核对置换与金融优惠/.test(clean(text));
    if (example) Object.assign(p, { region: '深圳', model: '汉 DM-i', date: '2026-10-29', offers: ['厂家置换权益', '指定金融方案'] });
    const region = text.match(/深圳|广州|上海|北京/)?.[0];
    const model = text.match(/汉\s*DM-i|海狮05|宋\s*PLUS\s*DM-i|Z9|N9/i)?.[0];
    if (region) p.region = region;
    if (model) p.model = model.replace(/\s+/g, '').toLowerCase() === '汉dm-i' ? '汉 DM-i' : model;
    const date = text.match(/(202\d)年(\d{1,2})月(?:(\d{1,2})日)?/);
    if (date) p.date = `${date[1]}-${date[2].padStart(2, '0')}-${(date[3] || '01').padStart(2, '0')}`;
    else if (/下个?月|11月/.test(text)) p.date = '2026-11-01';
    else if (/上个?月|9月/.test(text)) p.date = '2026-09-01';
    if (/置换/.test(text) && /金融/.test(text)) p.offers = ['厂家置换权益', '指定金融方案'];
    const docKey = /草稿|待审核/.test(text) || p.date?.startsWith('2026-11') ? 'draft' : 'october';
    const doc = documents[docKey];
    if (!window.DemoAccess?.canReadKnowledge(doc.audience)) return make('当前账号无权查看这项资料', ['无法基于受限资料确认权益。请联系资料负责人核对可访问的有效文件。'], previous, { ...sales, lastScript: undefined }, { knowledge: true });
    const citation = id => ({ id, docKey, number: 1, label: { stacking: '权益叠加规则', conditions: '适用条件', materials: '申请材料', draft: '草稿状态' }[id] });
    const contextLabel = p.region && p.model && p.date ? `演示情境：${sales.customer} · ${p.region} · ${p.model} · ${p.date.slice(0, 7)}购车` : null;
    const base = { knowledge: true, knowledgeDocumentIds: [docKey], contextLabel, notice: '模拟政策与资料状态，仅用于演示' };
    if (!doc.approved) return make('草稿尚未审核，不能确认权益', ['这份模拟资料尚未发布，不能据此确认优惠叠加、金额或客户资格。'], previous, sales, { ...base, citations: [citation('draft')], followups: ['查看置换与金融叠加示例'] });
    if (/如何|怎么|怎样/.test(text) && /政策.*(适用|核对|确认)/.test(text)) return make('先核对条件，再确认有效版本', ['1. 核对车型、配置、地区、购车时间与客户资格。', '2. 检查文件版本、审核状态、有效期及叠加限制。', '条件未确认前，不作最终权益承诺。'], previous, sales, { ...base, citations: [citation('conditions')], followups: ['查看置换与金融叠加示例'] });
    if (!p.offers || !p.region || !p.model || !p.date) return make('先确认两项权益及适用情境', ['请补充要比较的两项权益，以及车型、购车地区和购车时间；前文已提供的信息会自动沿用。'], previous, sales, { knowledge: true, followups: ['查看置换与金融叠加示例'] });
    if (p.date < doc.starts || p.date > doc.ends || p.region !== '深圳' || p.model !== '汉 DM-i') return make('现有资料不能确认这个情境', ['当前可核对的模拟文件仅适用于深圳、指定汉 DM-i车型及2026年10月购车情境，不能直接用于其他地区、车型或月份。'], previous, sales, { ...base, citations: [citation('conditions')], followups: ['列出核对条件'] });
    if (/自然.*说法|换.*说法|更口语/.test(text)) text = '整理成客户话术';
    if (scriptRequest(text) || shortRequest(text)) {
      const quote = shortRequest(text) ? `${sales.customer}，这两项权益符合条件可以一起申请，我先帮您核对资格。` : `${sales.customer}，按目前这份方案，置换权益可以和指定金融方案一起申请。我先帮您核对车型和申请条件，再确认具体可享内容。`;
      return make('可以这样说', [], previous, { ...sales, lastScript: quote }, { ...base, quote, citations: [citation('stacking')], quoteNote: '依据政策整理的沟通建议，非文件原话。', followups: shortRequest(text) ? ['列出核对条件'] : ['再简短一点', '列出核对条件'] });
    }
    if (/材料|准备什么/.test(text)) return make('先准备这几类材料', ['1. 购车人身份证明。', '2. 旧车登记与行驶资料。', '3. 置换交易凭证及新车订单信息。', '金融申请材料需按所选方案另行核对。'], previous, sales, { ...base, citations: [citation('materials')], followups: ['列出核对条件', '整理成客户话术'] });
    if (/条件|适用|核对清单/.test(text)) return make('逐项核对申请条件', ['1. 具体车型、年款与配置。', '2. 购车地区、日期及置换申请资格。', '3. 是否为细则指定的金融方案。', '4. 其他地方补贴或经销商优惠需单独核对。'], previous, sales, { ...base, citations: [citation('conditions')], followups: ['需要准备什么材料？', '整理成客户话术'] });
    if (/冲突|不一致|不同版本/.test(text)) return make('先核实版本，暂不合并结论', ['请提供另一份文件的版本及冲突条款。当前仅能确认本份模拟细则，不能推定其他文件已失效。'], previous, sales, { ...base, citations: [citation('stacking')], followups: ['列出核对条件'] });
    return make('符合条件时，可以叠加', ['厂家置换权益可与指定金融方案叠加，需满足对应车型和申请条件。'], previous, sales, { ...base, citations: [citation('stacking')], afterCitation: '其他地区补贴需另行核对。', followups: ['需要准备什么材料？', '整理成客户话术'] });
  }
  function reply(text, previous = {}) {
    const old = previous.salesContext || {};
    if (/销量|销冠|销售冠军|成交率|交付量|销售趋势|门店信息|任职情况|籍贯|入职/.test(text)) return null;
    if (old.mode === 'objection' && /整理对比要点/.test(text)) return make('先比较客户关心的差异', ['1. 确认另一款车的具体年款和配置。', '2. 统一落地费用、优惠条件与报价日期。', '3. 由客户选出最关心的两项需求，再核对资料或安排体验。'], previous, old, { followups: ['核对置换与金融优惠', '客户补充了新情况'] });
    const knowledgeIntent = /政策|补贴|置换权益|金融优惠|叠加|优惠.*(一起|同时)|这两[个项].*(一起|同时)|权益.*(材料|条件)|可追溯|知识回答/.test(text);
    const knowledgeFollowup = old.mode === 'knowledge' && /材料|条件|客户话术|短|说法|版本|草稿|冲突|不一致|上个?月|下个?月|\d月|深圳|广州|上海|北京|汉|海狮|Z9|N9/.test(text);
    if (knowledgeIntent || knowledgeFollowup) return knowledge(text, previous, old);
    const objectionIntent = /(?:客户|先生|女士).*(顾虑|异议|贵|犹豫|再看看|商量|预算|比较|便宜)|差价.*(不值|值得)|价格高|价格异议|预算.*(上限|不够|不足|有限)|超[出过]?预算|我要回去.*商量/.test(text);
    const objectionFollowup = old.mode === 'objection' && (shortRequest(text) || scriptRequest(text) || /补充|修正|换一种判断|预算|另一款|比较|便宜|差价|家人|商量|不清楚/.test(text));
    if (objectionIntent || objectionFollowup) return objection(text, previous, old);
    return null;
  }
  function normalizeReply(response) {
    if (response.knowledgeDocumentIds?.some(key => !documents[key] || !window.DemoAccess?.canReadKnowledge(documents[key].audience))) return make('当前账号无权查看这项资料', ['当前权限不允许展示原回答及引用，请联系资料负责人核对。'], response.context || {}, { ...(response.context?.salesContext || { mode: 'knowledge' }), lastScript: undefined }, { knowledge: true });
    return response;
  }
  return { reply, normalizeReply, getEvidence, entries };
})();
