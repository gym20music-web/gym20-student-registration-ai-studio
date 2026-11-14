
(function(){
  const getEls=()=>({trigger:document.getElementById('customRegionTrigger'),menu:document.getElementById('customRegionMenu'),wrap:document.getElementById('customRegionDropdown')});
  let pendingRegionId='';
  function wheelOf(menu){return menu&&menu.querySelector('#customRegionWheelList');}
  function updateFocus(menu){
    const wheel=wheelOf(menu);if(!wheel)return null;
    const items=Array.from(wheel.querySelectorAll('.region-wheel-item'));if(!items.length)return null;
    const center=wheel.getBoundingClientRect().top+wheel.clientHeight/2;
    let best=null,bestDistance=Infinity;
    for(const item of items){const r=item.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-center);if(d<bestDistance){best=item;bestDistance=d;}}
    items.forEach(item=>item.classList.toggle('wheel-focus',item===best));
    if(best)pendingRegionId=best.dataset.regionId||'';
    return best;
  }
  function cycleSize(wheel){
    const items=wheel.querySelectorAll('.region-wheel-item'),count=Number(wheel.dataset.regionCount)||Math.floor(items.length/3);
    if(!count||items.length<count*3)return 0;
    return items[count].offsetTop-items[0].offsetTop;
  }
  function recycle(wheel){
    const cycle=cycleSize(wheel);if(!cycle)return;
    const y=wheel.scrollTop;
    if(y<cycle*.35)wheel.scrollTop=y+cycle;
    else if(y>cycle*1.65)wheel.scrollTop=y-cycle;
  }
  function settle(wheel,menu){
    clearTimeout(wheel._gym20SettleTimer);
    if(!wheel._gym20GestureMoved||wheel._gym20PointerDown)return;
    wheel._gym20SettleTimer=setTimeout(()=>{
      if(wheel._gym20PointerDown||!wheel._gym20GestureMoved)return;
      const best=updateFocus(menu);
      if(best&&typeof window.gym20SelectRegion==='function'){
        const id=best.dataset.regionId;
        wheel._gym20GestureMoved=false;
        window.gym20SelectRegion(id);
      }
    },760);
  }
  function centerItem(menu,id,smooth){
    const wheel=wheelOf(menu);if(!wheel)return;
    const item=Array.from(wheel.querySelectorAll('.region-wheel-item')).find(x=>x.dataset.regionId===id&&x.dataset.regionCopy==='1')||Array.from(wheel.querySelectorAll('.region-wheel-item')).find(x=>x.dataset.regionId===id);
    if(!item)return;
    const top=item.offsetTop-(wheel.clientHeight-item.offsetHeight)/2;
    if(smooth)wheel.scrollTo({top,behavior:'smooth'});else wheel.scrollTop=top;
    requestAnimationFrame(()=>updateFocus(menu));
  }
  function bind(wheel,menu){
    if(wheel._gym20Bound)return;wheel._gym20Bound=true;
    wheel._gym20PointerDown=false;wheel._gym20GestureMoved=false;wheel._gym20Dragged=false;wheel._gym20LastScrollTop=wheel.scrollTop;
    wheel.addEventListener('pointerdown',e=>{
      wheel._gym20PointerDown=true;wheel._gym20Dragged=false;wheel._gym20GestureMoved=false;
      wheel._gym20StartX=e.clientX;wheel._gym20StartY=e.clientY;
      clearTimeout(wheel._gym20SettleTimer);
    },{passive:true});
    wheel.addEventListener('pointermove',e=>{
      if(!wheel._gym20PointerDown)return;
      const dx=Math.abs(e.clientX-wheel._gym20StartX),dy=Math.abs(e.clientY-wheel._gym20StartY);if(dx>7||dy>7)wheel._gym20Dragged=true;if(dy>7&&dy>dx*1.15)wheel._gym20GestureMoved=true;
    },{passive:true});
    const pointerEnd=()=>{
      if(!wheel._gym20PointerDown)return;
      wheel._gym20PointerDown=false;wheel._gym20StartX=null;wheel._gym20StartY=null;
      if(wheel._gym20GestureMoved)settle(wheel,menu);
    };
    wheel.addEventListener('pointerup',pointerEnd,{passive:true});
    wheel.addEventListener('pointercancel',pointerEnd,{passive:true});
    wheel.addEventListener('wheel',()=>{
      wheel._gym20GestureMoved=true;
      settle(wheel,menu);
    },{passive:true});
    wheel.addEventListener('scroll',()=>{
      const now=wheel.scrollTop,delta=Math.abs(now-wheel._gym20LastScrollTop);
      wheel._gym20LastScrollTop=now;
      // Only a real user gesture (pointer drag or mouse-wheel) may arm selection.
      // Opening/centering the wheel can emit scroll events too; those must never select a region.
      if(delta>2&&wheel._gym20PointerDown)wheel._gym20GestureMoved=true;
      if(!wheel._gym20Frame){
        wheel._gym20Frame=requestAnimationFrame(()=>{
          wheel._gym20Frame=0;recycle(wheel);updateFocus(menu);
        });
      }
      if(wheel._gym20GestureMoved&&!wheel._gym20PointerDown)settle(wheel,menu);
    },{passive:true});
  }
  document.addEventListener('click',e=>{
    const x=getEls();if(!x.menu||!x.wrap)return;
    const item=e.target&&e.target.closest?e.target.closest('.region-wheel-item'):null;
    if(!item||!x.menu.contains(item))return;
    e.preventDefault();e.stopPropagation();
    const wheel=wheelOf(x.menu);if(!wheel)return;
    if(wheel._gym20Dragged){
      wheel._gym20Dragged=false;wheel._gym20GestureMoved=true;return;
    }
    const id=item.dataset.regionId;
    clearTimeout(wheel._gym20SettleTimer);
    wheel._gym20GestureMoved=false;
    if(typeof window.gym20SelectRegion==='function')window.gym20SelectRegion(id);
  },true);
  window.gym20ToggleRegionDropdown=function(e){
    if(e){e.preventDefault();e.stopPropagation();}
    const x=getEls();if(!x.trigger||!x.menu)return;
    const open=!x.menu.classList.contains('open');
    x.menu.classList.toggle('open',open);x.trigger.classList.toggle('open',open);
    document.body.classList.toggle('region-sheet-open',open);
    x.menu.style.display=open?'flex':'none';x.menu.style.visibility=open?'visible':'hidden';x.menu.style.pointerEvents=open?'auto':'none';
    x.trigger.setAttribute('aria-expanded',String(open));
    if(open){
      const selected=x.menu.querySelector('.region-wheel-item.selected');
      pendingRegionId=selected?selected.dataset.regionId:'';
      const wheel=wheelOf(x.menu);
      if(wheel){
        clearTimeout(wheel._gym20SettleTimer);
        wheel._gym20PointerDown=false;wheel._gym20GestureMoved=false;wheel._gym20Dragged=false;
        wheel._gym20LastScrollTop=wheel.scrollTop;
        bind(wheel,x.menu);
        requestAnimationFrame(()=>{if(pendingRegionId)centerItem(x.menu,pendingRegionId,false);else updateFocus(x.menu);wheel._gym20LastScrollTop=wheel.scrollTop;});
      }
    }
  };
  document.addEventListener('click',e=>{
    const x=getEls();if(!x.trigger||!x.menu)return;
    if(x.wrap&&!x.wrap.contains(e.target)){
      clearTimeout((wheelOf(x.menu)||{})._gym20SettleTimer);
      x.menu.classList.remove('open');x.trigger.classList.remove('open');document.body.classList.remove('region-sheet-open');
      x.menu.style.display='none';x.menu.style.visibility='hidden';x.menu.style.pointerEvents='none';
      x.trigger.setAttribute('aria-expanded','false');pendingRegionId='';
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){const x=getEls();if(x.menu&&x.trigger){x.menu.classList.remove('open');x.trigger.classList.remove('open');document.body.classList.remove('region-sheet-open');x.menu.style.display='none';x.menu.style.visibility='hidden';x.menu.style.pointerEvents='none';x.trigger.setAttribute('aria-expanded','false');}}
  });
})();
