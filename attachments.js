// Files remain in this browser. Conversation storage contains metadata, not file bytes.
window.AttachmentStorage = (() => {
  let opening;
  const database = () => opening ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('dikeni-attachments-v1:' + (window.DemoAccess?.storageScope || 'guest'), 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { opening = null; reject(request.error); };
  });
  async function run(mode, operation) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', mode), request = operation(transaction.objectStore('files'));
      let result; request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('文件存储失败'));
    });
  }
  return {
    put: (file, id = crypto.randomUUID()) => { const metadata = { id, name: file.name, type: file.type, size: file.size, added: Date.now() }; return run('readwrite', store => store.put({ ...metadata, blob: file })).then(() => metadata); },
    get: id => run('readonly', store => store.get(id)),
    recent: () => run('readonly', store => store.getAll()).then(rows => rows.filter(row => row.type.startsWith('image/')).sort((a,b) => b.added-a.added).slice(0,20)),
    async hydrate(root) {
      for (const image of root.querySelectorAll('img[data-attachment-id]')) {
        try { const item = await this.get(image.dataset.attachmentId); if (!item || !image.isConnected) continue; image.src = URL.createObjectURL(item.blob); image.onload = image.onerror = () => URL.revokeObjectURL(image.src); }
        catch { image.alt = '照片暂时无法加载'; }
      }
    },
    async download(id) {
      const item = await this.get(id); if (!item) throw new Error('附件已被清理，请重新添加');
      const url = URL.createObjectURL(item.blob), link = document.createElement('a');
      link.href = url; link.download = item.name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
  };
})();
window.ComposerAttachments = class {
  constructor({ root, onChange, onError, onOpen }) {
    Object.assign(this, { root, onChange, onError, onOpen }); this.items = []; this.pending = 0;
    this.albumSamples = ["IMG_0011.PNG", "IMG_0009.PNG", "IMG_0008.PNG", "IMG_0007.PNG", "IMG_0006.PNG", "IMG_2685.PNG", "IMG_2684.PNG", "IMG_2683.PNG"].map(name=>({id:`sample-album:${name}`,name,type:'image/png',previewUrl:`assets/album-samples/${name}?v=thumb240`}));
    this.composer = root.querySelector('.s36'); this.footer = this.composer.parentElement;
    root.classList.add('composer-attachments');
    this.add = document.createElement('button'); this.add.type = 'button'; this.add.className = 'composer-add'; this.add.setAttribute('aria-label','添加照片或文件'); this.add.setAttribute('aria-expanded','false'); this.add.setAttribute('aria-controls','attachment-panel'); this.add.innerHTML = '<img src="assets/composer-add.svg" alt="">'; this.composer.prepend(this.add);
    this.panel = document.createElement('section'); this.panel.id = 'attachment-panel'; this.panel.className = 'attachment-panel'; this.panel.hidden = true; this.panel.setAttribute('aria-label','添加附件');
    this.panel.innerHTML = '<div class="attachment-choices"><button type="button" data-pick="camera"><img src="assets/attachment-camera.svg" alt=""><span>相机</span></button><button type="button" data-pick="album"><img src="assets/attachment-album.svg" alt=""><span>相册</span></button><button type="button" data-pick="files"><img src="assets/attachment-file.svg" alt=""><span>文件</span></button></div><div class="attachment-recent" aria-label="相册图片"></div>';
    this.footer.append(this.panel);
    this.drafts = document.createElement('div'); this.drafts.className='attachment-drafts'; this.drafts.setAttribute('aria-label','待发送附件'); this.drafts.hidden=true; this.footer.append(this.drafts);
    this.inputs = {};
    for (const kind of ['camera','album','files']) {
      const input=document.createElement('input'); input.type='file'; input.hidden=true; input.dataset.attachmentPicker=kind;
      if(kind!=='files')input.accept='image/*'; if(kind==='camera')input.setAttribute('capture','environment'); else input.multiple=true;
      input.addEventListener('change',()=>{this.select([...input.files]);input.value=''});this.footer.append(input);this.inputs[kind]=input;
    }
    this.composer.querySelector('.s37 img').src='assets/composer-voice.svg'; this.composer.querySelector('.s43 img').src='assets/composer-send-disabled.svg';
    this.add.addEventListener('pointerdown',e=>e.preventDefault());
    this.add.addEventListener('click',event=>{
      if(!this.panel.hidden){this.close(event.detail===0);return}
      this.open();
    });
    this.panel.addEventListener('click',e=>{const kind=e.target.closest('[data-pick]')?.dataset.pick;if(kind)this.inputs[kind].click();const recent=e.target.closest('[data-recent]');if(recent)this.toggleRecent(recent.dataset.recent)});
    this.drafts.addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(id){this.items=this.items.filter(item=>item.id!==id);this.render()}});
    root.addEventListener('pointerdown',e=>{if(!this.panel.hidden&&!this.footer.contains(e.target))this.close(false)},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.panel.hidden){e.preventDefault();e.stopImmediatePropagation();this.close()}},true);
    document.addEventListener('demo-back',e=>{if(!this.panel.hidden){e.preventDefault();this.close()} });
    root.addEventListener('focusin',e=>{if(e.target.matches('.message-input'))this.close(false)});
    window.addEventListener('pagehide',()=>this.releaseURLs()); this.urls=[];
  }
  releaseURLs(){this.urls?.forEach(url=>URL.revokeObjectURL(url));this.urls=[]}
  async open(){this.onOpen?.();document.activeElement?.blur();this.panel.hidden=false;this.root.classList.add('attachments-open');this.add.setAttribute('aria-expanded','true');this.refreshRecent();}
  close(focus=true){if(this.panel.hidden)return;this.panel.hidden=true;this.root.classList.remove('attachments-open');this.add.setAttribute('aria-expanded','false');if(focus)this.add.focus({preventScroll:true})}
  async select(files){
    if(!files.length)return;this.pending++;this.onChange();
    try{for(const file of files){if(this.items.length>=10){this.onError('每次最多添加10个附件');break}if(file.size>20*1024*1024){this.onError(`${file.name} 超过20MB，请选择较小的文件`);continue}if(!file.size){this.onError(`${file.name} 是空文件`);continue}this.items.push(await AttachmentStorage.put(file));}this.render();}
    catch{this.onError('附件无法保存在当前浏览器，请检查可用存储空间后重试')}
    finally{this.pending--;this.onChange();if(!this.panel.hidden)this.refreshRecent()}
  }
  async toggleRecent(id){
    if(this.pending)return;this.pending++;this.onChange();
    try{
      if(this.items.some(item=>item.id===id))this.items=this.items.filter(item=>item.id!==id);
      else if(this.items.length>=10)this.onError('每次最多添加10个附件');
      else{
        let row=await AttachmentStorage.get(id);
        const sample=this.albumSamples.find(item=>item.id===id);
        if(!row || (sample && row.size>40000)){if(sample){const response=await fetch(sample.previewUrl);if(!response.ok)throw new Error('照片加载失败');const blob=await response.blob();row=await AttachmentStorage.put(new File([blob],sample.name,{type:blob.type||sample.type}),id)}}
        if(row){const{blob,...metadata}=row;this.items.push(metadata)}
      }
    }catch{this.onError('照片暂时无法加载，请重新从相册选择')}
    finally{this.pending--;this.render();this.refreshRecent()}
  }
  render(){
    this.drafts.replaceChildren();this.drafts.hidden=!this.items.length;this.root.classList.toggle('has-attachment-drafts',Boolean(this.items.length));
    for(const item of this.items){const chip=document.createElement('div');chip.className='attachment-chip';const image=document.createElement('img');image.alt='';if(item.type.startsWith('image/'))image.dataset.attachmentId=item.id;else image.src='assets/attachment-file.svg';const label=document.createElement('span');label.textContent=item.name;const remove=document.createElement('button');remove.type='button';remove.dataset.remove=item.id;remove.setAttribute('aria-label',`移除${item.name}`);remove.textContent='×';chip.append(image,label,remove);this.drafts.append(chip)}AttachmentStorage.hydrate(this.drafts);this.onChange();
  }
  clear(){this.items=[];this.render();this.close(false)}
  async refreshRecent(){
    try{const recent=await AttachmentStorage.recent();if(this.panel.hidden)return;const rows=[...recent,...this.albumSamples.filter(sample=>!recent.some(row=>row.id===sample.id))];this.releaseURLs();const grid=this.panel.querySelector('.attachment-recent');grid.replaceChildren();
      for(const row of rows){const sample=this.albumSamples.find(item=>item.id===row.id);const previewUrl=sample?.previewUrl||row.previewUrl;const button=document.createElement('button');button.type='button';button.dataset.recent=row.id;button.setAttribute('aria-label',`选择照片：${row.name}`);button.setAttribute('aria-pressed',String(this.items.some(item=>item.id===row.id)));const image=document.createElement('img');image.alt=row.name;image.decoding='async';image.width=240;image.height=522;if(previewUrl)image.src=previewUrl;else{image.src=URL.createObjectURL(row.blob);this.urls.push(image.src)}const indicator=document.createElement('i');indicator.setAttribute('aria-hidden','true');indicator.textContent=this.items.some(item=>item.id===row.id)?'✓':'';button.append(image,indicator);grid.append(button)}
    }catch{this.onError('照片暂时无法加载，仍可通过相册选择')}
  }
};
