
/* Dedicated rules wheel: same gesture/centering/cycle model as the GYM20 region wheel. */
(function(){
 const select=document.getElementById('ruleSelector');
 const wrap=document.getElementById('ruleWheelDropdown');
 const trigger=document.getElementById('ruleWheelTrigger');
 const menu=document.getElementById('ruleWheelMenu');
 const label=document.getElementById('ruleWheelSelectedText');
 if(!select||!wrap||!trigger||!menu||!label||wrap.dataset.wheelReady==='1')return;
 wrap.dataset.wheelReady='1';
 document.body.appendChild(menu);
 let pendingValue=select.value;
 let wheelCommitInProgress=false;
 const wheel=()=>menu.querySelector('#ruleWheelList');
 function updateLabel(){const option=select.options[select.selectedIndex];label.textContent=option?option.textContent:'انتخاب قانون';}
 function updateFocus(){
  const w=wheel();if(!w)return null;
  const items=Array.from(w.querySelectorAll('.rule-wheel-item'));if(!items.length)return null;
  const center=w.getBoundingClientRect().top+w.clientHeight/2;
  let best=null,bestDistance=Infinity;
  for(const item of items){const r=item.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-center);if(d<bestDistance){best=item;bestDistance=d;}}
  items.forEach(item=>item.classList.toggle('wheel-focus',item===best));
  if(best)pendingValue=best.dataset.value;
  return best;
 }
 function centerValue(value){
  const w=wheel();if(!w)return;
  const item=Array.from(w.querySelectorAll('.rule-wheel-item')).find(x=>x.dataset.value===value&&x.dataset.copy==='1');
  if(!item)return;
  const top=item.offsetTop-(w.clientHeight-item.offsetHeight)/2;
  w.scrollTop=top;
  requestAnimationFrame(updateFocus);
 }
 function commit(value){
  if(!value||!Array.from(select.options).some(o=>o.value===value))return;
  select.value=value;wheelCommitInProgress=true;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  wheelCommitInProgress=false;updateLabel();
  const w=wheel();if(w)w.querySelectorAll('.rule-wheel-item').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.value===value)));
 }
 function close(){
  const w=wheel();if(w){clearTimeout(w._gym20RuleSettleTimer);w._gym20RuleGestureMoved=false;w._gym20RulePointerDown=false;}
  menu.classList.remove('open');trigger.classList.remove('open');
  trigger.setAttribute('aria-expanded','false');menu.setAttribute('aria-hidden','true');
  document.body.classList.remove('rule-sheet-open');
  ['top','left','right','bottom','width','max-height'].forEach(p=>menu.style.removeProperty(p));
 }
 function positionMenu(){
  const r=trigger.getBoundingClientRect(),gap=6;
  const width=Math.min(r.width,window.innerWidth-16);
  const left=Math.max(8,Math.min(r.left,window.innerWidth-width-8));
  const top=Math.max(8,Math.min(r.bottom+gap,window.innerHeight-218-8));
  menu.style.setProperty('top',top+'px','important');
  menu.style.setProperty('left',left+'px','important');
  menu.style.setProperty('right','auto','important');
  menu.style.setProperty('bottom','auto','important');
  menu.style.setProperty('width',width+'px','important');
  menu.style.setProperty('max-height',Math.min(218,window.innerHeight-16)+'px','important');
 }
 function build(){
  const options=Array.from(select.options);menu.innerHTML='';
  const w=document.createElement('div');w.id='ruleWheelList';w.setAttribute('role','listbox');
  w.setAttribute('aria-label','انتخاب قانون برای ویرایش');w.dataset.optionCount=String(options.length);
  [0,1,2].forEach(copy=>options.forEach(option=>{
   const button=document.createElement('button');button.type='button';button.className='rule-wheel-item';
   button.dataset.value=option.value;button.dataset.copy=String(copy);
   button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.value===select.value));
   const span=document.createElement('span');span.textContent=option.textContent;button.appendChild(span);w.appendChild(button);
  }));
  menu.appendChild(w);bind(w);
 }
 function cycleSize(w){
  const items=w.querySelectorAll('.rule-wheel-item'),count=Number(w.dataset.optionCount)||Math.floor(items.length/3);
  if(!count||items.length<count*3)return 0;
  return items[count].offsetTop-items[0].offsetTop;
 }
 function recycle(w){
  const cycle=cycleSize(w);if(!cycle)return;
  const y=w.scrollTop;
  if(y<cycle*.35)w.scrollTop=y+cycle;
  else if(y>cycle*1.65)w.scrollTop=y-cycle;
 }

 function bind(w){
  if(w._gym20RuleBound)return;w._gym20RuleBound=true;
  w._gym20RulePointerDown=false;w._gym20RuleGestureMoved=false;w._gym20RuleDragged=false;
  w._gym20RuleLastScrollTop=w.scrollTop;
  function settle(){
   clearTimeout(w._gym20RuleSettleTimer);
   if(!w._gym20RuleGestureMoved||w._gym20RulePointerDown)return;
   w._gym20RuleSettleTimer=setTimeout(()=>{
    if(w._gym20RulePointerDown||!w._gym20RuleGestureMoved)return;
    const best=updateFocus();
    if(best)commit(best.dataset.value);
    w._gym20RuleGestureMoved=false;w._gym20RuleDragged=false;
   },760);
  }
  w.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   w._gym20RulePointerDown=true;w._gym20RuleDragged=false;w._gym20RuleGestureMoved=false;
   w._gym20RuleStartX=e.clientX;w._gym20RuleStartY=e.clientY;
   w._gym20RuleStartScrollTop=w.scrollTop;w._gym20RulePointerType=e.pointerType;
   clearTimeout(w._gym20RuleSettleTimer);
  },{passive:true});
  w.addEventListener('pointermove',e=>{
   if(!w._gym20RulePointerDown)return;
   const dx=Math.abs(e.clientX-w._gym20RuleStartX),dy=Math.abs(e.clientY-w._gym20RuleStartY);
   if(dx>7||dy>7)w._gym20RuleDragged=true;
   if(dy>7&&dy>dx*1.15){
    w._gym20RuleGestureMoved=true;
    /* Desktop has no native grab-to-scroll gesture; map the pointer delta directly to scrollTop. */
    if(w._gym20RulePointerType==='mouse'){
     if(!w._gym20RuleMouseCaptured&&w.setPointerCapture){try{w.setPointerCapture(e.pointerId);w._gym20RuleMouseCaptured=true;}catch(_){}}
     e.preventDefault();w.scrollTop=w._gym20RuleStartScrollTop-(e.clientY-w._gym20RuleStartY);
    }
   }
  },{passive:false});
  const pointerEnd=()=>{
   if(!w._gym20RulePointerDown)return;
   w._gym20RulePointerDown=false;w._gym20RuleStartX=null;w._gym20RuleStartY=null;
   if(w._gym20RuleGestureMoved)settle();
  };
  w.addEventListener('pointerup',pointerEnd,{passive:true});
  w.addEventListener('pointercancel',pointerEnd,{passive:true});
  w.addEventListener('wheel',()=>{w._gym20RuleGestureMoved=true;settle();},{passive:true});
  w.addEventListener('scroll',()=>{
   const now=w.scrollTop,delta=Math.abs(now-w._gym20RuleLastScrollTop);
   w._gym20RuleLastScrollTop=now;
   if(delta>2&&w._gym20RulePointerDown)w._gym20RuleGestureMoved=true;
   if(!w._gym20RuleFrame)w._gym20RuleFrame=requestAnimationFrame(()=>{
    w._gym20RuleFrame=0;recycle(w);updateFocus();
   });
   if(w._gym20RuleGestureMoved&&!w._gym20RulePointerDown)settle();
  },{passive:true});
 }
 document.addEventListener('click',e=>{
  const item=e.target&&e.target.closest?e.target.closest('.rule-wheel-item'):null;
  if(!item||!menu.contains(item))return;
  e.preventDefault();e.stopPropagation();
  const w=wheel();if(!w)return;
  if(w._gym20RuleDragged){w._gym20RuleDragged=false;w._gym20RuleGestureMoved=true;return;}
  clearTimeout(w._gym20RuleSettleTimer);w._gym20RuleGestureMoved=false;
  commit(item.dataset.value);close();
 },true);
 function open(){
  if(menu.classList.contains('open')){close();return;}
  build();positionMenu();menu.classList.add('open');trigger.classList.add('open');
  trigger.setAttribute('aria-expanded','true');menu.setAttribute('aria-hidden','false');
  document.body.classList.add('rule-sheet-open');pendingValue=select.value;
  const w=wheel();if(w){clearTimeout(w._gym20RuleSettleTimer);w._gym20RulePointerDown=false;w._gym20RuleGestureMoved=false;w._gym20RuleDragged=false;}
  requestAnimationFrame(()=>{centerValue(select.value);if(w){w._gym20RuleLastScrollTop=w.scrollTop;w._gym20RuleGestureMoved=false;}});
 }
 window.addEventListener('resize',()=>{if(menu.classList.contains('open'))positionMenu();},{passive:true});
 document.addEventListener('scroll',()=>{if(menu.classList.contains('open'))positionMenu();},true);
 trigger.addEventListener('click',open);
 trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();open();}else if(e.key==='Escape')close();});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)&&!menu.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 select.addEventListener('change',()=>{
  updateLabel();
  if(menu.classList.contains('open')){
   const w=wheel();if(w)w.querySelectorAll('.rule-wheel-item').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.value===select.value)));
   if(!wheelCommitInProgress)centerValue(select.value);
  }
 });
 updateLabel();
})();
