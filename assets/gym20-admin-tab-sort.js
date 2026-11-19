/* GYM20 admin tab touch/mouse reordering */
(function(){
  'use strict';
  const KEY='gym20-admin-tab-order-v1';
  const nav=document.querySelector('#adminModal .admin-tabs');
  if(!nav||nav.dataset.gym20Sortable==='1')return;
  nav.dataset.gym20Sortable='1';
  const getButtons=()=>Array.from(nav.querySelectorAll(':scope > .admin-tab-btn'));
  const tabKey=btn=>{const m=(btn.getAttribute('onclick')||'').match(/switchAdminTab\(['"]([^'"]+)['"]\)/);return m?m[1]:'';};
  const buttons=getButtons().filter(b=>tabKey(b));
  if(buttons.length<2)return;
  const byKey=new Map(buttons.map(b=>[tabKey(b),b]));
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(Array.isArray(saved)&&saved.length){
      saved.forEach(k=>{const b=byKey.get(k);if(b)nav.appendChild(b);});
    }
  }catch(_){}
  const style=document.createElement('style');
  style.textContent=`
    #adminModal .admin-tabs .admin-tab-btn{position:relative;user-select:none;-webkit-user-select:none}
    #adminModal .admin-tabs .gym20-tab-grip{display:inline-flex;align-items:center;justify-content:center;flex:0 0 23px;width:23px;height:25px;margin-inline-end:5px;border-radius:7px;color:rgba(218,190,126,.72);font-size:17px;line-height:1;cursor:grab;touch-action:none;vertical-align:middle}
    #adminModal .admin-tabs .gym20-tab-grip:active{cursor:grabbing}
    #adminModal .admin-tabs .admin-tab-btn.gym20-tab-dragging{opacity:.48;transform:scale(.98);border-color:rgba(218,190,126,.9)!important}
    #adminModal .admin-tabs .admin-tab-btn.gym20-tab-over{outline:1px dashed rgba(218,190,126,.85);outline-offset:-3px}
    #adminModal .admin-tabs .admin-tab-btn.gym20-tab-dragging{z-index:5}
  `;
  document.head.appendChild(style);
  buttons.forEach(btn=>{
    if(btn.querySelector('.gym20-tab-grip'))return;
    const grip=document.createElement('span');
    grip.className='gym20-tab-grip';grip.textContent='⠿';
    grip.setAttribute('role','button');grip.setAttribute('aria-label','جابجایی تب');
    grip.setAttribute('title','برای جابه‌جایی نگه دارید و بکشید');
    btn.insertBefore(grip,btn.firstChild);
  });
  let drag=null,holdTimer=0,scrollFrame=0,lastY=0;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(getButtons().map(tabKey).filter(Boolean)));}catch(_){}};
  const clearMarks=()=>getButtons().forEach(b=>b.classList.remove('gym20-tab-over'));
  const finish=()=>{
    if(!drag)return;
    clearTimeout(holdTimer);cancelAnimationFrame(scrollFrame);
    const {btn,grip}=drag;
    btn.classList.remove('gym20-tab-dragging');
    grip.style.cursor='grab';
    clearMarks();
    if(drag.started)save();
    drag=null;
  };
  const autoScroll=()=>{
    if(!drag)return;
    const r=nav.getBoundingClientRect();
    if(lastY<r.top+38)nav.scrollTop-=Math.max(4,(r.top+38-lastY)*.22);
    else if(lastY>r.bottom-38)nav.scrollTop+=Math.max(4,(lastY-(r.bottom-38))*.22);
    scrollFrame=requestAnimationFrame(autoScroll);
  };
  nav.addEventListener('pointerdown',e=>{
    const grip=e.target.closest('.gym20-tab-grip');
    if(!grip||e.button!==0&&e.pointerType==='mouse')return;
    const btn=grip.closest('.admin-tab-btn');
    if(!btn)return;
    drag={btn,grip,pointerId:e.pointerId,started:false,startY:e.clientY};
    lastY=e.clientY;
    holdTimer=setTimeout(()=>{
      if(!drag)return;
      drag.started=true;
      btn.classList.add('gym20-tab-dragging');
      grip.style.cursor='grabbing';
      try{grip.setPointerCapture(e.pointerId);}catch(_){}
      scrollFrame=requestAnimationFrame(autoScroll);
    },180);
  });
  nav.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.pointerId)return;
    lastY=e.clientY;
    if(!drag.started){
      if(Math.abs(e.clientY-drag.startY)>9){clearTimeout(holdTimer);drag=null;}
      return;
    }
    e.preventDefault();
    const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('.admin-tab-btn');
    clearMarks();
    if(!over||over===drag.btn||!nav.contains(over))return;
    over.classList.add('gym20-tab-over');
    const r=over.getBoundingClientRect();
    const after=e.clientY>r.top+r.height/2;
    nav.insertBefore(drag.btn,after?over.nextSibling:over);
  });
  nav.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointerId)finish();});
  nav.addEventListener('pointercancel',finish);
  nav.addEventListener('lostpointercapture',()=>{if(drag&&drag.started)finish();});
  nav.addEventListener('click',e=>{if(e.target.closest('.gym20-tab-grip')){e.preventDefault();e.stopPropagation();}},true);
  console.info('[GYM20] Admin tab sorting ready');
})();