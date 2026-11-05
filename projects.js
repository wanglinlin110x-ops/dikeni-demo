(() => {
 const projects=[{name:'销冠信息',time:'1天前'},{name:'销量数据对比',time:'1周前'}];
 const list=document.querySelector('#project-list'),input=document.querySelector('input[type="search"]'),clear=document.querySelector('.library-search-clear'),status=document.querySelector('.library-search-status'),toast=document.querySelector('.toast');let timer;
 const back=document.querySelector('.library-back'),previous=sessionStorage.getItem('demo-project-return');back.href='index.html#sidebar-project';if(['index.html','input.html','conversation.html'].includes(previous))back.href=previous+'#sidebar-project';
 input.value=new URLSearchParams(location.search).get('q')||'';
 const element=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el};
 function notify(text){clearTimeout(timer);toast.textContent=text;toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,2000)}
 function render(){const q=input.value.trim();clear.hidden=!q;list.replaceChildren();const rows=projects.filter(item=>item.name.includes(q));status.textContent=q?`找到${rows.length}个项目`:'';
 for(const item of rows){const row=element('button','project-row');row.type='button';const icon=element('span','project-icon'),img=element('img','');img.src='assets/project-folder.svg';img.alt='';icon.append(img);const info=element('span','project-info');info.append(element('span','project-name',item.name),element('span','project-time',item.time));row.append(icon,info);row.onclick=()=>notify('项目详情暂未开放');list.append(row)}
 if(!rows.length){const p=element('p','library-message');p.append(element('strong','','没有找到相关项目'),document.createTextNode('换个关键词试试'));list.append(p)}
 const url=new URL(location.href);if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');history.replaceState(null,'',url)}
 document.querySelector('.project-add').onclick=()=>notify('新建项目功能暂未开放');input.oninput=render;clear.onclick=()=>{input.value='';render();input.focus()};document.querySelector('form').onsubmit=e=>{e.preventDefault();input.blur();render()};render();window.addEventListener('pagehide',()=>clearTimeout(timer));
})();
