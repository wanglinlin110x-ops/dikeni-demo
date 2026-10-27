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
