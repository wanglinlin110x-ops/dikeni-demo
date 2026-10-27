// Tighten Chinese/Latin boundaries in displayed copy without rewriting stored or editable text.
window.DemoText = (() => {
  const format = value => String(value ?? '')
    .replace(/([\p{Script=Han}])[ \t\u00a0\u3000]+(?=[A-Za-z0-9])/gu, '$1')
    .replace(/([A-Za-z0-9])[ \t\u00a0\u3000]+(?=[\p{Script=Han}])/gu, '$1')
    .replace(/\b(TOP)[ \t\u00a0\u3000]+(?=\d)/gi, '$1');
  const excluded = 'script,style,textarea,input,pre,code,[contenteditable="true"],.attachment-chip,.attachment-recent,.chat-user-attachments';
  function update(node) {
    if (!node.isConnected || node.parentElement?.closest(excluded)) return;
    const text = format(node.data);
    if (text !== node.data) node.data = text;
  }
  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) { update(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches(excluded)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) update(walker.currentNode);
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') update(record.target);
      else record.addedNodes.forEach(scan);
    }
  });
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  if (document.body) scan(document.body);
  return { format };
})();
