// Clear only this demo identity's local content; retain reading and browser permissions.
window.DemoLocalData = (() => {
  const scope=window.DemoAccess?.storageScope||'guest';
  const defaultScope=encodeURIComponent(JSON.stringify(['general_manager',['hometown','joinedAt'],['*']]));
  const conversationKey=scope===defaultScope?'dick-cowboy-conversations-v1':'dick-cowboy-conversations-v1:'+scope;
  const libraryKey='demo-library-images-v1:'+scope,resetKey='demo-data-reset:'+scope;
  const readStamp=()=>{try{return localStorage.getItem(resetKey)}catch{return null}};
  let observed=readStamp(),clearing=false;
  const checkReset=()=>{if(readStamp()!==observed)location.reload()};
  window.addEventListener('pageshow',checkReset);
  window.addEventListener('storage',event=>{if(event.key===resetKey||event.key===null)checkReset()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReset()});
  async function clear(){
    if(clearing)throw new Error('正在清空');clearing=true;
    const localBackup=new Map(),sessionBackup=new Map();
    try{
      const keys=Object.keys(localStorage).filter(key=>key===conversationKey||key.startsWith(conversationKey+'-before-')||key===libraryKey||key===resetKey);
      for(const key of new Set([...keys,conversationKey,resetKey]))localBackup.set(key,localStorage.getItem(key));
      const retained=new Set(['demo-settings-return','demo-sidebar-return','demo-sidebar-selected','demo-voice-style']);
      for(const key of Object.keys(sessionStorage))if(key.startsWith('demo-')&&!retained.has(key))sessionBackup.set(key,sessionStorage.getItem(key));
      await AttachmentStorage.clearWithMetadata(()=>{
        for(const key of localBackup.keys())localStorage.removeItem(key);
        localStorage.setItem(conversationKey,JSON.stringify({version:1,activeId:null,sessions:[],historyCleared:true,initialHistoryVersion:1,artifactHistoryVersion:1,materialsFlowRepairVersion:1}));
        localStorage.setItem(resetKey,crypto.randomUUID());
        for(const key of sessionBackup.keys())sessionStorage.removeItem(key);
      });
      observed=readStamp();
    }catch(error){
      let restored=true;
      for(const[storage,backup]of[[localStorage,localBackup],[sessionStorage,sessionBackup]])for(const[key,value]of backup){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value)}catch{restored=false}}
      observed=readStamp();
      throw new Error(restored?'清空未完成，请重试':'清空未完成，部分存储暂时不可用，请检查浏览器设置');
    }finally{clearing=false}
  }
  return{clear,isCleared(){try{return Boolean(JSON.parse(localStorage.getItem(conversationKey)||'null')?.historyCleared)}catch{return false}}};
})();
