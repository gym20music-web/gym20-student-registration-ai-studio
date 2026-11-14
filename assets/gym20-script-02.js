
/* Accessible custom admin dropdowns: every menu is anchored below its field. */
(function(){
  const root=document.querySelector('.admin-content .admin-workspace');
  if(!root||root.dataset.bottomDropdownsReady==='1')return;
  root.dataset.bottomDropdownsReady='1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sync(wrap){
    const select=wrap.querySelector('select'),label=wrap.querySelector('.admin-dropdown-label'),menu=wrap.querySelector('.admin-dropdown-menu');
    if(!select||!label||!menu)return;
    const option=select.options[select.selectedIndex];
    label.textContent=option?option.textContent:'انتخاب کنید…';
    const trigger=wrap.querySelector('.admin-dropdown-trigger');
    if(trigger){
      trigger.disabled=!!select.disabled;
      trigger.setAttribute('aria-label',select.getAttribute('aria-label')||option?.textContent||'انتخاب گزینه');
      trigger.setAttribute('aria-disabled',String(!!select.disabled));
    }
    menu.querySelectorAll('[data-index]').forEach(b=>{
      const i=Number(b.dataset.index),selected=i===select.selectedIndex;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-selected',String(selected));
      b.disabled=!!select.options[i]?.disabled;
    });
  }
  function rebuild(select){
    const wrap=select.closest('.admin-dropdown');if(!wrap)return;
    const menu=wrap.querySelector('.admin-dropdown-menu');
    menu.innerHTML=Array.from(select.options,(o,i)=>'<button type="button" role="option" aria-selected="'+(i===select.selectedIndex)+'" class="admin-dropdown-option" data-index="'+i+'" '+(o.disabled?'disabled':'')+'>'+esc(o.textContent)+'</button>').join('');
    sync(wrap);
  }
  function enhance(select){
    if(select.id==='ruleSelector'||select.closest('#studentTermsTab')||select.closest('.st-custom-select')||select.multiple||select.dataset.bottomDropdown==='1')return;
    if(select.closest('.admin-dropdown'))return;
    select.dataset.bottomDropdown='1';
    const wrap=document.createElement('div');wrap.className='admin-dropdown';
    select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);
    select.classList.add('admin-dropdown-native');
    const trigger=document.createElement('button');trigger.type='button';trigger.className='admin-dropdown-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<span class="admin-dropdown-label"></span><span class="admin-dropdown-arrow">⌄</span>';
    const menu=document.createElement('div');menu.className='admin-dropdown-menu';menu.setAttribute('role','listbox');
    wrap.append(trigger,menu);
    trigger.addEventListener('click',()=>{
      if(trigger.disabled)return;
      const open=!wrap.classList.contains('open');
      root.querySelectorAll('.admin-dropdown.open').forEach(x=>{x.classList.remove('open');x.querySelector('.admin-dropdown-trigger')?.setAttribute('aria-expanded','false');});
      if(open){rebuild(select);wrap.classList.add('open');trigger.setAttribute('aria-expanded','true');}
    });
    trigger.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){
        e.preventDefault();trigger.click();
        const current=menu.querySelector('[data-index="'+select.selectedIndex+'"]:not(:disabled)');
        (current||menu.querySelector('.admin-dropdown-option:not(:disabled)'))?.focus();
      }
    });
    menu.addEventListener('keydown',e=>{
      const items=Array.from(menu.querySelectorAll('.admin-dropdown-option:not(:disabled)'));
      const at=items.indexOf(document.activeElement);
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();items[(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
      }else if(e.key==='Escape'){
        e.preventDefault();wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');trigger.focus();
      }else if(e.key==='Enter'||e.key===' '){
        e.preventDefault();document.activeElement?.click();
      }
    });
    menu.addEventListener('click',e=>{
      const b=e.target.closest('[data-index]');if(!b||b.disabled)return;
      select.selectedIndex=Number(b.dataset.index);
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync(wrap);wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');trigger.focus();
    });
    select.addEventListener('change',()=>sync(wrap));
    const observer=new MutationObserver(()=>rebuild(select));
    observer.observe(select,{childList:true,subtree:true,attributes:true,characterData:true});
    rebuild(select);
  }
  function scan(scope){(scope||root).querySelectorAll('select').forEach(enhance);}
  scan();
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{
    if(n.nodeType!==1)return;
    if(n.matches?.('select'))enhance(n);
    scan(n);
  }))).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('.admin-dropdown'))return;
    root.querySelectorAll('.admin-dropdown.open').forEach(x=>{x.classList.remove('open');x.querySelector('.admin-dropdown-trigger')?.setAttribute('aria-expanded','false');});
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')root.querySelectorAll('.admin-dropdown.open').forEach(x=>{x.classList.remove('open');x.querySelector('.admin-dropdown-trigger')?.setAttribute('aria-expanded','false');});
  });
})();
