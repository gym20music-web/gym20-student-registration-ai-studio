/* GYM20 admin tab sorting: long-press anywhere on a tab, then drag */
(function(){
 'use strict';
 const KEY='gym20-admin-tab-order-v1';
 function init(){
  const nav=document.querySelector('#adminModal .admin-tabs');
  if(!nav||nav.dataset.gym20Sortable==='1')return;
  nav.dataset.gym20Sortable='1';
  const buttons=()=>Array.from(nav.querySelectorAll(':scope > .admin-tab-btn'));
  const key=b=>{const m=(b.getAttribute('onclick')||'').match(/switchAdminTab\(['"]([^'"]+)['"]\)/);return m?m[1]:'';};
  const initial=buttons().filter(b=>key(b));
  if(initial.length<2)return;
  const map=new Map(initial.map(b=>[key(b),b]));
  try{const order=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(order))order.forEach(k=>{if(map.has(k))nav.appendChild(map.get(k));});}catch(_){}
  const css=document.createElement('style');
  css.textContent=`
   #adminModal .admin-tabs .admin-tab-btn{position:relative;user-select:none;-webkit-user-select:none}
   #adminModal .admin-tabs .gym20-tab-grip{display:inline-flex;align-items:center;justify-content:center;flex:0 0 23px;width:23px;height:25px;margin-inline-end:5px;border-radius:7px;color:rgba(218,190,126,.8);font-size:18px;line-height:1;vertical-align:middle}
   #adminModal .admin-tabs .admin-tab-btn.gym20-tab-dragging{opacity:.5;transform:scale(.98);border-color:rgba(218,190,126,.9)!important}
   #adminModal .admin-tabs .admin-tab-btn.gym20-tab-over{outline:1px dashed rgba(218,190,126,.9);outline-offset:-3px}
  `;
  document.head.appendChild(css);
  initial.forEach(b=>{if(!b.querySelector('.gym20-tab-grip')){const g=document.createElement('span');g.className='gym20-tab-grip';g.textContent='⠿';g.setAttribute('aria-hidden','true');b.insertBefore(g,b.firstChild);}});
  let state=null,timer=0;
  const clear=()=>buttons().forEach(b=>b.classList.remove('gym20-tab-over'));
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(buttons().map(key).filter(Boolean)));}catch(_){}};
  function stop(){
   if(!state)return;
   clearTimeout(timer);
   state.btn.classList.remove('gym20-tab-dragging');
   clear();
   if(state.active)persist();
   state=null;
  }
  nav.addEventListener('pointerdown',e=>{
   const btn=e.target.closest('.admin-tab-btn');
   if(!btn||!nav.contains(btn)|| (e.pointerType==='mouse'&&e.button!==0))return;
   stop();
   state={btn,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,active:false};
   timer=setTimeout(()=>{if(!state)return;state.active=true;state.btn.classList.add('gym20-tab-dragging');},320);
  });
  document.addEventListener('pointermove',e=>{
   if(!state||e.pointerId!==state.pointerId)return;
   if(!state.active){
    if(Math.hypot(e.clientX-state.startX,e.clientY-state.startY)>18){clearTimeout(timer);state=null;}
    return;
   }
   e.preventDefault();
   const hit=document.elementFromPoint(e.clientX,e.clientY);
   const over=hit&&hit.closest?hit.closest('.admin-tab-btn'):null;
   clear();
   if(!over||over===state.btn||!nav.contains(over))return;
   over.classList.add('gym20-tab-over');
   const r=over.getBoundingClientRect();
   nav.insertBefore(state.btn,e.clientY>r.top+r.height/2?over.nextSibling:over);
  },{passive:false});
  document.addEventListener('pointerup',e=>{if(state&&e.pointerId===state.pointerId)stop();});
  document.addEventListener('pointercancel',e=>{if(state&&e.pointerId===state.pointerId)stop();});
  nav.addEventListener('click',e=>{if(e.target.closest('.gym20-tab-grip')&&state?.active){e.preventDefault();e.stopPropagation();}},true);
  console.info('[GYM20] long-press tab sorting ready');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();