// The local server opts in with a same-origin meta tag. Static hosting stays unchanged.
window.DemoUnderstanding = (() => {
  const endpoint = document.querySelector('meta[name="demo-language-model"]')?.content;
  const enabled = endpoint === '/api/understand';
  const intents = new Set(['rank','runnerup','trend','distribution','profile','sales','gap','models','progress','experience','knowledge','objection','conversion','growth','average','clarify','unavailable']);
  async function resolve(text, context, signal) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }), signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error('Local understanding unavailable');
    const result = await response.json();
    if (result.version !== 2 || result.engine !== 'qwen3-local' || result.original !== text || !intents.has(result.intent)
      || typeof result.query !== 'string' || result.query.length > 1400 || !result.context || typeof result.context !== 'object') throw new Error('Invalid understanding result');
    return result;
  }
  function reply(result, previous) {
    const conditions = result.conditions || {};
    const scenario = previous.homeScenario;
    const homePerson = ['zhou', 'li'].includes(scenario?.person);
    const unchangedScope = !conditions.network && !conditions.scope && !conditions.personName;
    // Keep the current demo's chosen roster. A model interpretation must not switch data sets.
    if (result.intent === 'rank' && unchangedScope && (!conditions.period || conditions.period === '2026年10月')) {
      return HomeReplies.reply('本月销售冠军是谁？', {});
    }
    if (homePerson && unchangedScope && result.intent !== 'clarify' && result.intent !== 'unavailable') {
      if (result.intent === 'rank' && conditions.period === '2026年9月') return HomeReplies.reply('上个月王朝全国销冠是谁？', {});
      if (!conditions.period || conditions.period === result.context.period) {
        const questions = { distribution: '主要卖哪些车型？', sales: result.slots?.models?.length ? '主要卖哪些车型？' : '目标完成情况',
          trend: '近6个月销量趋势', runnerup: '第二名是谁？', gap: '第二名是谁？', experience: '销售做法',
          profile: { store: '门店信息', joinedAt: '入职时间', hometown: '籍贯' }[result.slots?.profileField] || '门店信息' };
        if (questions[result.intent]) return HomeReplies.reply(questions[result.intent], previous);
        const response = DemoChat.reply('查一下', {});
        return { ...response, question: '这位顾问的这项数据尚未接入，可以先查看主销车型或近期表现。' };
      }
    }
    const context = { ...previous };
    for (const key of ['network','scope','period','personId','lastIntent']) {
      if (Object.hasOwn(result.context, key)) context[key] = result.context[key];
      else if (key === 'personId') delete context[key];
    }
    if (result.intent === 'clarify') {
      const response = DemoChat.reply('查一下', context);
      return { ...response, question: result.question || '请再明确一下查询对象或内容。', hint: '你可以补充完整名称、月份或统计口径，也可以选择下方问题继续。' };
    }
    return DemoChat.reply(result.query, context);
  }
  return { enabled, resolve, reply };
})();
