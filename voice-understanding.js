// Voice-only intent adapter; VoiceInput corrects known automotive homophones before display.
window.VoiceUnderstanding = (() => {
  function understand(transcript, context = {}) {
    const original = String(transcript ?? '').trim();
    const result = (query, intent = null) => ({ version: 1, original, query, intent, matched: intent !== null });
    let text = typeof VoiceInput !== 'undefined' ? VoiceInput.normalizeTranscript(original) : original;
    // Apply an explicit spoken correction only to the internal query, preserving the original.
    const correction = text.match(/(?:不对|不是)[^，,。；;]*[，,。；;]\s*(?:我是说|我说的是|我问的是|是|我要看|我要查)?([\s\S]+)/);
    if (correction) text = correction[1];
    else if (/(?:别|不要|不用|不想|不是要)\s*(?:查|看|查询|了解)?[^，,。；;]*(?:销冠|冠军|销量|车型)/.test(text)) return result('查一下', 'clarify');
    // Do not turn unrelated requests into sales queries through a generic word such as “冠军”.
    if (/足球|篮球|奥运|世界杯|天气|股票|股价|治病|感冒|写诗|写代码|旅游|菜谱/.test(text)) return result(original);
    text = text.replace(/上个月|前一个月/g, '上月').replace(/这个月|这一个月|这月|今个月/g, '本月');
    // Unsupported periods still require clarification; known sales homophones are normalized above.
    if (/去年|前年|今年|上半年|下半年|季度/.test(text) || /(?:近|最近|过去)(?:[一二两三四五七八九十]|[1-57-9]|\d{2,})个?月/.test(text)) return result('查一下', 'clarify');
    if (/(?:小冠|销管|销关)/.test(text) && /谁|哪个|哪位/.test(text)) return result('查一下', 'clarify');
    let intent, request;
    if (/第二名|排第二|排在第二|第二个销售/.test(text)) {
      intent = 'runnerup'; request = '第二名呢？';
    } else if (/(?:卖|销售).*(?:啥|什么|哪些|哪几).*(?:车|车型)|主销.*(?:啥|什么|哪些|哪几)/.test(text)) {
      intent = 'distribution'; request = '主要卖什么车？';
    } else if (/哪个店|哪家店|哪个门店|在哪.*(?:店|上班)|哪儿上班/.test(text)) {
      intent = 'profile'; request = '门店信息';
    } else if (/啥时候.*(?:来|入职|加入)|什么时候.*(?:来|入职|加入)|来了多久|干了多久|来公司多久/.test(text)) {
      intent = 'profile'; request = '了解他的任职情况';
    } else if (/(?:哪儿|哪里|什么地方)人|老家|籍贯/.test(text)) {
      intent = 'profile'; request = '他是哪里人？';
    } else if (/(?:卖了?|卖出|交付了?|卖出去).*(?:多少|几)(?:辆|台)|销量.*多少/.test(text) && !/谁|哪个|哪位/.test(text)) {
      intent = 'sales'; request = '他的销量是多少？';
    } else if ((/销冠|销售冠军|销售第一|销量第一|销量最高|交付最多/.test(text) && !/趋势|走势|最近.*(?:表现|咋样|怎么样)|这几个月|近.*个月/.test(text)) || /谁.*(?:拿|排|是).*(?:第一|冠军)/.test(text) || /(?:谁|哪个|哪位).*(?:卖|销售).*(?:最猛|最牛|最好|最多|最厉害|最强|第一)/.test(text) || /(?:卖|销售).*(?:最猛|最牛|最好|最多|最厉害|最强).*(?:谁|哪个|哪位)/.test(text)) {
      // An order count is not a delivered-vehicle count.
      if (/订单|收入|利润|金额/.test(text) && !/交付/.test(text)) return result('查一下', 'clarify');
      intent = 'rank'; request = '销售冠军是谁？';
    } else if (/(?:最近|这几个月|近几个月|近六个月|近6个月|过去半年|近半年).*(?:表现|销量|卖|咋样|怎么样|如何)|走势|趋势|一直.*(?:这么|那么).*(?:好|厉害)/.test(text)) {
      intent = 'trend'; request = '他最近几个月表现怎么样？';
    } else if (/(?:卖了|卖出|交付了|卖出去).*(?:多少|几)(?:辆|台)|销量.*(?:多少|咋样|怎么样)/.test(text)) {
      intent = 'sales'; request = '他的销量是多少？';
    } else if (correction && /本月|上月|9月|10月/.test(text) && context.lastIntent === 'rank') {
      intent = 'rank'; request = '销售冠军是谁？';
    }
    // Keep every explicitly spoken entity/number in the internal query as well.
    const queryText = intent && intent !== 'rank' ? text.replace(/销售冠军|销冠/g, '这位销售顾问') : text;
    const interpreted = intent ? result(`${queryText}；${request}`, intent) : result(original);
    if (intent === 'rank' && window.HomeReplies?.reply(text, context)?.profile) return result(text, 'rank');
    if (intent === 'rank' && !context.scope && !context.personId && !context.network
      && !/上月|上个月|9月|九月|全国|华南|华东|战区|门店|王朝|腾势|比亚迪/.test(text)
      && canAnswerDirectly(interpreted, { kind:'answer', profile:{} })) {
      return result('本月销售冠军是谁？', 'rank');
    }
    return interpreted;
  }
  function canAnswerDirectly(voice, reply) {
    if (voice?.intent !== 'rank' || reply?.kind !== 'answer' || !reply.profile || reply.unavailable) return false;
    // Only a fully covered business query can bypass the model. Unknown names, scopes and metrics remain.
    const covered = /2026年(?:9|10)月|全国门店|销售冠军|销量最高|交付最多|华南战区|华东战区|王朝网|比亚迪|销售第一|销量第一|上个月|这个月|前一个月|今个月|本月|上月|这月|九月|十月|9月|10月|全国|华南|华东|王朝|腾势|销冠|销售|销量|交付|个人|卖车|卖得|卖的|最多|最好|最厉害|最牛|最猛|第一|排名|哪个|哪位|是谁|谁|排|拿到|拿|卖|得|的|是|请问|帮我查一下|帮我|查一下|看看|告诉我|一下|查|看|啊|呀|呢|吧/g;
    return !voice.query.replace(covered, '').replace(/[\s，,。！？?；;：:、]/g, '');
  }
  return { understand, canAnswerDirectly };
})();
