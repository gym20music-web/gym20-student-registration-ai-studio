(function(){
'use strict';
const TEHRAN=[
{id:'tehran_1',name:'منطقه ۱',zone:'شمال',hoods:'تجریش، نیاوران، زعفرانیه، ولنجک، الهیه',path:'M510 55 L610 32 L735 48 L835 78 L815 125 L710 120 L655 142 L580 128 L535 105',x:655,y:82},
{id:'tehran_2',name:'منطقه ۲',zone:'غرب',hoods:'سعادت‌آباد، شهرک غرب، طرشت، گیشا، مرزداران، ستارخان',path:'M425 112 L510 55 L535 105 L525 215 L495 295 L420 285 L405 195',x:462,y:205},
{id:'tehran_3',name:'منطقه ۳',zone:'شمال',hoods:'ونک، میرداماد، جردن، ظفر، پاسداران، دروس',path:'M535 105 L580 128 L655 142 L668 215 L525 215',x:602,y:172},
{id:'tehran_4',name:'منطقه ۴',zone:'شرق',hoods:'تهرانپارس، نارمک، هروی، حکیمیه، لویزان',path:'M655 142 L710 120 L815 125 L895 185 L865 248 L745 245 L668 215',x:765,y:185},
{id:'tehran_5',name:'منطقه ۵',zone:'غرب',hoods:'پونک، جنت‌آباد، شهران، اکباتان، باغ فیض',path:'M280 135 L425 112 L405 195 L420 285 L335 295 L305 215',x:355,y:205},
{id:'tehran_6',name:'منطقه ۶',zone:'مرکز',hoods:'یوسف‌آباد، امیرآباد، فاطمی، کریم‌خان، ولیعصر',path:'M495 215 L575 215 L575 305 L495 305',x:535,y:262},
{id:'tehran_7',name:'منطقه ۷',zone:'مرکز',hoods:'سهروردی، سیدخندان، عباس‌آباد، بهار، نظام‌آباد',path:'M575 215 L655 215 L655 305 L575 305',x:615,y:262},
{id:'tehran_8',name:'منطقه ۸',zone:'شرق',hoods:'نارمک، هفت‌حوض، مدنی، وحیدیه، تسلیحات',path:'M655 215 L745 245 L745 298 L655 298',x:698,y:262},
{id:'tehran_9',name:'منطقه ۹',zone:'غرب',hoods:'مهرآباد، استاد معین، جی، شمشیری، سی‌متری جی',path:'M315 295 L435 295 L442 368 L305 365',x:372,y:332},
{id:'tehran_10',name:'منطقه ۱۰',zone:'مرکز',hoods:'سلسبیل، کارون، جیحون، هاشمی، بریانک',path:'M435 295 L495 295 L495 375 L442 368',x:468,y:336},
{id:'tehran_11',name:'منطقه ۱۱',zone:'مرکز',hoods:'منیریه، جمهوری، انقلاب، پاستور، حر، رازی',path:'M495 305 L552 305 L552 388 L495 388',x:524,y:348},
{id:'tehran_12',name:'منطقه ۱۲',zone:'مرکز',hoods:'بازار تهران، بهارستان، فردوسی، سنگلج',path:'M552 305 L625 305 L625 392 L552 388',x:588,y:350},
{id:'tehran_13',name:'منطقه ۱۳',zone:'شرق',hoods:'پیروزی، نیروی هوایی، تهران‌نو، سرخه‌حصار',path:'M625 298 L765 298 L755 352 L625 345',x:688,y:324},
{id:'tehran_14',name:'منطقه ۱۴',zone:'شرق',hoods:'آهنگ، پرستار، شکوفه، چهارصد دستگاه، دولاب',path:'M625 345 L745 352 L732 408 L625 395',x:680,y:376},
{id:'tehran_15',name:'منطقه ۱۵',zone:'جنوب',hoods:'افسریه، مشیریه، کیانشهر، خاوران، مسعودیه',path:'M625 395 L745 408 L765 525 L695 525 L635 475',x:695,y:455},
{id:'tehran_16',name:'منطقه ۱۶',zone:'جنوب',hoods:'نازی‌آباد، خزانه، یاخچی‌آباد، جوادیه، باغ‌آذری',path:'M522 388 L625 392 L635 475 L522 475',x:576,y:435},
{id:'tehran_17',name:'منطقه ۱۷',zone:'جنوب',hoods:'ابوذر، فلاح، یافت‌آباد شرقی، زمزم، آذری',path:'M442 368 L522 388 L522 438 L442 425',x:482,y:402},
{id:'tehran_18',name:'منطقه ۱۸',zone:'جنوب',hoods:'یافت‌آباد، شادآباد، خلیج فارس، شهرک ولیعصر',path:'M225 355 L442 368 L442 455 L255 442',x:335,y:405},
{id:'tehran_19',name:'منطقه ۱۹',zone:'جنوب',hoods:'عبدل‌آباد، خانی‌آباد نو، نعمت‌آباد، دولتخواه',path:'M425 425 L522 438 L522 522 L415 508',x:468,y:472},
{id:'tehran_20',name:'منطقه ۲۰',zone:'جنوب',hoods:'شهرری، دولت‌آباد، جوانمرد قصاب، صفائیه',path:'M522 475 L635 475 L655 568 L522 568',x:582,y:522},
{id:'tehran_21',name:'منطقه ۲۱',zone:'غرب',hoods:'تهرانسر، شهرک استقلال، شهرک آزادی، وردآورد',path:'M45 255 L305 275 L305 365 L75 335',x:185,y:312},
{id:'tehran_22',name:'منطقه ۲۲',zone:'غرب',hoods:'دریاچه چیتگر، شهرک راه‌آهن، دهکده المپیک',path:'M35 175 L185 125 L280 135 L305 275 L45 255',x:175,y:205}
];
const ANDISHEH=[
{id:'andisheh_1',name:'فاز ۱ اندیشه',zone:'فاز ۱',hoods:'شهرک اندیشه؛ محدوده مستقل در جنوب',path:'M300 510 L420 492 L545 505 L585 555 L520 580 L365 578 L280 550',x:430,y:540},
{id:'andisheh_2',name:'فاز ۲ اندیشه',zone:'فاز ۲',hoods:'فاز دو، محدوده غربی و جنوب‌غربی شهر جدید',path:'M125 175 L185 225 L275 265 L330 330 L300 405 L205 438 L105 375 L75 270',x:205,y:330},
{id:'andisheh_3',name:'فاز ۳ اندیشه',zone:'فاز ۳',hoods:'فاز سه، محدوده جنوبی و جنوب‌شرقی شهر جدید',path:'M300 405 L330 330 L410 300 L500 315 L585 360 L655 405 L625 465 L520 490 L420 475 L330 455 L205 438',x:465,y:410},
{id:'andisheh_4',name:'فاز ۴ اندیشه',zone:'فاز ۴',hoods:'فاز چهار، محدوده مرکزی و شرقی شهر جدید',path:'M410 300 L475 245 L565 220 L650 235 L735 275 L760 350 L655 405 L585 360 L500 315',x:610,y:315},
{id:'andisheh_5',name:'فاز ۵ اندیشه',zone:'فاز ۵',hoods:'فاز پنج، محدوده کوچک شمالی و شمال‌شرقی',path:'M600 82 L730 105 L810 170 L790 245 L735 275 L650 235 L565 220 L575 145',x:700,y:185},
{id:'andisheh_6',name:'فاز ۶ اندیشه',zone:'فاز ۶',hoods:'فاز شش، محدوده شمالی و شمال‌غربی شهر جدید',path:'M150 95 L300 58 L455 62 L600 82 L575 145 L565 220 L475 245 L410 300 L330 330 L275 265 L185 225 L125 175',x:365,y:165}
];
const DEFAULT_ASSIGNMENTS={
reg_north:['tehran_1','tehran_2'],
reg_west:['tehran_5','tehran_22'],
reg_center:['tehran_6','tehran_7'],
reg_east:['tehran_4','tehran_8']
};
let city='tehran',activeAreaId='',activeZone='همه',mapSearch='',scrollFrame=0,areaFlowTimer=null,areaFlowToken=0;
const allAreas=()=>city==='tehran'?TEHRAN:ANDISHEH;
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const normalize=s=>String(s||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[\u200c\u200f\u200e]/g,' ').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g,' ').trim().toLowerCase();
function ensureAreaPricing(){
 if(!Array.isArray(appData.regions))return;
 const firstMigration=!appData.regions.some(r=>Array.isArray(r.areas));
 appData.regions.forEach(r=>{
  if(!Array.isArray(r.areas))r.areas=firstMigration?(DEFAULT_ASSIGNMENTS[r.id]||[]).slice():[];
 });
}
function ownerOf(areaId){return (appData.regions||[]).find(r=>Array.isArray(r.areas)&&r.areas.includes(areaId))||null;}
function updateSelectedTitle(area){
 const el=document.getElementById('customRegionSelectedText');
 if(el)el.textContent=area?('📍 '+area.name+' · '+(city==='tehran'?'تهران':'اندیشه')):((appData.regions||[]).find(r=>r.id===currentRegionId)?.name||'📍 انتخاب شهر و محدوده');
}
function updatePricingStatus(area){
 const status=document.getElementById('gym20AreaPricingStatus');
 if(!status)return;
 const group=area?ownerOf(area.id):null;
 if(!area){status.textContent='ابتدا شهر و محدوده مورد نظر را روی نقشه یا از فهرست انتخاب کنید.';status.className='gym20-area-status';}
 else if(group){status.textContent='تعرفه فعال این محدوده: '+group.name;status.className='gym20-area-status is-ready';}
 else{status.textContent='برای '+area.name+' هنوز تعرفه‌ای تعریف نشده است. لطفاً محدوده دیگری انتخاب کنید یا با مدیریت تماس بگیرید.';status.className='gym20-area-status is-missing';}
}
function paintSelection(){
 const areas=allAreas();
 document.querySelectorAll('#gym20AreaPickerHost .gym20-map-node').forEach(n=>n.classList.toggle('active',n.dataset.areaId===activeAreaId));
 document.querySelectorAll('#gym20AreaPickerHost .gym20-area-item').forEach(n=>n.classList.toggle('active',n.dataset.areaId===activeAreaId));
 const area=areas.find(a=>a.id===activeAreaId)||null;
 updateSelectedTitle(area);updatePricingStatus(area);
 const root=document.querySelector('#gym20AreaPickerHost .gym20-area-picker');if(root)updateAreaChrome(root);
}
function applyAreaSelection(area,fromScroll){
 if(!area)return;
 activeAreaId=area.id;
 window.gym20SelectedAreaInfo={id:area.id,city:city==='tehran'?'تهران':'اندیشه',name:area.name,hoods:area.hoods};
 const group=ownerOf(area.id);
 currentRegionId=group?group.id:'';
 const dependent=document.getElementById('regionDependentContent');
 if(dependent)dependent.style.display=group?'':'none';
 if(typeof updateRegionDependentVisibility==='function')updateRegionDependentVisibility();
 if(group&&typeof updateClassStatusAndStylesFlow==='function'){updateClassStatusAndStylesFlow();if(typeof calculatePrice==='function')calculatePrice();}
 else if(typeof calculatePrice==='function')calculatePrice();
 paintSelection();
 if(!fromScroll&&group){
  const menu=document.getElementById('customRegionMenu'),trigger=document.getElementById('customRegionTrigger');
  if(menu){menu.classList.remove('open');menu.style.display='none';menu.style.visibility='hidden';menu.style.pointerEvents='none';}
  if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false');}
  const content=document.getElementById('regionDependentContent');
  if(content)content.scrollIntoView({behavior:'smooth',block:'start'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(typeof window.gym20GuidedFlowStart==='function')window.gym20GuidedFlowStart();
   else window.dispatchEvent(new CustomEvent('gym20:region-selected',{detail:{regionId:currentRegionId,areaId:area.id}}));
  }));
 }
}
function startAreaSelectionFlow(target){
 if(!target)return;
 const token=++areaFlowToken;
 if(areaFlowTimer)clearTimeout(areaFlowTimer);
 areaFlowTimer=null;
 const areas=allAreas();
 const targetIndex=areas.findIndex(a=>a.id===target.id);
 let startIndex=areas.findIndex(a=>a.id===activeAreaId);
 if(startIndex<0)startIndex=targetIndex;
 const direction=targetIndex>=startIndex?1:-1;
 const steps=[];
 for(let i=startIndex;i!==targetIndex;i+=direction)steps.push(i);
 steps.push(targetIndex);
 let step=0;
 const paintNext=()=>{
  if(token!==areaFlowToken)return;
  const area=areas[steps[step]];
  if(area){activeAreaId=area.id;paintSelection();}
  step++;
  if(step<steps.length){
   areaFlowTimer=setTimeout(paintNext,85);
   return;
  }
  applyAreaSelection(target,true);
  // مکث پس از رسیدن نشانگر به محدوده لمس‌شده
  areaFlowTimer=setTimeout(()=>{
   if(token!==areaFlowToken)return;
   const content=document.getElementById('regionDependentContent');
   if(content)content.scrollIntoView({behavior:'smooth',block:'start'});
   const started=Date.now();
   const waitForArrival=()=>{
    if(token!==areaFlowToken)return;
    const reached=!content||content.getBoundingClientRect().top<=140||Date.now()-started>=2600;
    if(!reached){requestAnimationFrame(waitForArrival);return;}
    if(typeof window.gym20GuidedFlowStart==='function')window.gym20GuidedFlowStart();
    else window.dispatchEvent(new CustomEvent('gym20:region-selected',{detail:{regionId:currentRegionId,areaId:target.id}}));
    // ده ثانیه پس از رسیدن اسکرول به بخش بزرگسالان، کشو بسته می‌شود
    areaFlowTimer=setTimeout(()=>{
     if(token!==areaFlowToken)return;
     const menu=document.getElementById('customRegionMenu');
     const trigger=document.getElementById('customRegionTrigger');
     if(menu){menu.classList.remove('open');menu.style.display='none';menu.style.visibility='hidden';menu.style.pointerEvents='none';}
     if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false');}
    },10000);
   };
   requestAnimationFrame(waitForArrival);
  },3500);
 };
 paintNext();
}
function renderZones(root){
 const bar=root.querySelector('.gym20-area-zones');if(!bar)return;
 const zones=city==='tehran'?['همه','شمال','غرب','مرکز','شرق','جنوب']:['همه','فاز ۱','فاز ۲','فاز ۳','فاز ۴','فاز ۵','فاز ۶'];
 bar.innerHTML='';
 zones.forEach(z=>{
  const b=document.createElement('button');b.type='button';b.className='gym20-area-zone'+(activeZone===z?' active':'');b.textContent=z;b.dataset.zone=z;bar.appendChild(b);
 });
}
function renderMap(root){
 const svg=root.querySelector('.gym20-area-map');if(!svg)return;
 svg.innerHTML='';
 allAreas().forEach(a=>{
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','gym20-map-node'+(a.id===activeAreaId?' active':''));
  g.dataset.areaId=a.id;
  [[17,'gym20-map-under'],[9,'gym20-map-wall'],[0,'gym20-map-top']].forEach(pair=>{
   const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',a.path);p.setAttribute('transform','translate(0 '+pair[0]+')');p.setAttribute('class',pair[1]);g.appendChild(p);
  });
  const t=document.createElementNS(svg.namespaceURI,'text');t.setAttribute('x',a.x);t.setAttribute('y',a.y);t.setAttribute('class','gym20-map-label');t.textContent=city==='tehran'?a.id.split('_')[1]:a.zone.replace('فاز ','');g.appendChild(t);
  g.addEventListener('click',()=>startAreaSelectionFlow(a));
  svg.appendChild(g);
 });
 applyMapEmphasis(root);
}
function applyMapEmphasis(root){
 const q=normalize(mapSearch);
 root.querySelectorAll('.gym20-map-node').forEach(n=>{
  const a=allAreas().find(x=>x.id===n.dataset.areaId);if(!a)return;
  const zoneHit=activeZone==='همه'||a.zone===activeZone;
  const searchHit=!q||normalize(a.name+' '+a.zone+' '+a.hoods).includes(q);
  n.classList.toggle('dim',!zoneHit||!searchHit);
  n.classList.toggle('search-hit',!!q&&searchHit);
 });
}
function renderAreaList(root){
 const list=root.querySelector('.gym20-area-list');if(!list)return;
 const q=normalize(mapSearch);
 const matches=allAreas().filter(a=>(activeZone==='همه'||a.zone===activeZone)&&(!q||normalize(a.name+' '+a.zone+' '+a.hoods).includes(q)));
 list.innerHTML='';
 matches.forEach(a=>{
  const b=document.createElement('button');b.type='button';b.className='gym20-area-item'+(a.id===activeAreaId?' active':'');b.dataset.areaId=a.id;
  const top=document.createElement('span');top.className='gym20-area-item-top';top.textContent=a.name;
  const sub=document.createElement('span');sub.className='gym20-area-item-sub';sub.textContent=a.zone+' · '+a.hoods;
  const mark=document.createElement('span');mark.className='gym20-area-item-check';mark.textContent='✓';
  b.append(top,sub,mark);b.addEventListener('click',()=>startAreaSelectionFlow(a));list.appendChild(b);
 });
 applyMapEmphasis(root);
}
function renderAreaPicker(){
 const menu=document.getElementById('customRegionMenu');if(!menu)return;
 const regionCard=document.getElementById('regionSelectionCard');if(!regionCard)return;
 let host=document.getElementById('gym20AreaPickerHost');
 if(!host){host=document.createElement('div');host.id='gym20AreaPickerHost';host.className='gym20-area-picker-host';}
 /* Keep the map as a true sibling of the whole region card, not inside the card or dropdown. */
 if(host.parentElement!==regionCard.parentElement||host.previousElementSibling!==regionCard)regionCard.insertAdjacentElement('afterend',host);
 const old=host.querySelector('.gym20-area-picker');if(old)old.remove();
 const wheel=menu.querySelector('#customRegionWheelList');if(wheel)wheel.style.display='none';
 const dependent=document.getElementById('regionDependentContent');if(dependent){const initial=allAreas().find(a=>a.id===activeAreaId);dependent.style.display=initial&&ownerOf(initial.id)?'':'none';}
 const root=document.createElement('section');root.className='gym20-area-picker';
 root.innerHTML='<div class="gym20-area-head"><div class="gym20-city-switch" role="group" aria-label="انتخاب شهر"><button type="button" data-city="tehran" class="gym20-city-btn">تهران</button><button type="button" data-city="andisheh" class="gym20-city-btn">اندیشه</button></div><span class="gym20-area-counter"></span></div><div class="gym20-area-layout"><aside class="gym20-area-side"><input class="gym20-area-search" type="search" placeholder="جستجوی منطقه یا محله..." autocomplete="off"><div class="gym20-area-list"></div></aside><div class="gym20-area-map-side"><div class="gym20-area-zones"></div><div class="gym20-area-viewport"><div class="gym20-area-compass"></div><div class="gym20-area-hud"><b></b><span></span></div><svg class="gym20-area-map" viewBox="0 0 920 600" role="img" aria-label="نقشه شماتیک مناطق تهران و فازهای اندیشه"></svg><div class="gym20-area-legend"><span>نقشه شماتیک نمایشی</span><span>برای انتخاب روی محدوده بزنید</span></div></div></div></div><div id="gym20AreaPricingStatus" class="gym20-area-status">ابتدا شهر و محدوده مورد نظر را انتخاب کنید.</div>';
 host.appendChild(root);
 const syncHost=()=>{host.style.display=menu.classList.contains('open')?'block':'none';};
 if(!host._gym20Observe){new MutationObserver(syncHost).observe(menu,{attributes:true,attributeFilter:['class']});host._gym20Observe=true;}
 syncHost();
 const cityButtons=root.querySelectorAll('[data-city]');
 cityButtons.forEach(b=>{b.classList.toggle('active',b.dataset.city===city);b.addEventListener('click',()=>{
  if(city===b.dataset.city)return;
  city=b.dataset.city;activeAreaId='';activeZone='همه';mapSearch='';window.gym20SelectedAreaInfo=null;currentRegionId='';
  const dependent=document.getElementById('regionDependentContent');if(dependent)dependent.style.display='none';
  if(typeof updateRegionDependentVisibility==='function')updateRegionDependentVisibility();
  root.querySelector('.gym20-area-search').value='';
  cityButtons.forEach(x=>x.classList.toggle('active',x===b));
  updateAreaChrome(root);renderZones(root);renderMap(root);renderAreaList(root);paintSelection();
 });});
 const search=root.querySelector('.gym20-area-search');
 search.value=mapSearch;
 search.addEventListener('input',()=>{mapSearch=search.value;renderAreaList(root);applyMapEmphasis(root);});
 root.querySelector('.gym20-area-zones').addEventListener('click',e=>{
  const b=e.target.closest('[data-zone]');if(!b)return;activeZone=b.dataset.zone;
  root.querySelectorAll('.gym20-area-zone').forEach(x=>x.classList.toggle('active',x===b));
  renderAreaList(root);applyMapEmphasis(root);
 });
 const list=root.querySelector('.gym20-area-list');
 // Select the item nearest the list viewport center while scrolling; paintSelection
 // keeps the corresponding map region and list row highlighted together.
 if(list){
  const syncCenteredArea=()=>{
   if(scrollFrame)return;
   scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;
    const items=[...list.querySelectorAll('.gym20-area-item')];
    if(!items.length)return;
    const box=list.getBoundingClientRect(),center=box.top+box.height/2;
    let nearest=null,minDistance=Infinity;
    items.forEach(item=>{
     const r=item.getBoundingClientRect(),d=Math.abs((r.top+r.height/2)-center);
     if(d<minDistance){minDistance=d;nearest=item;}
    });
    if(nearest){
     const area=allAreas().find(a=>a.id===nearest.dataset.areaId);
     // Scrolling the list is preview-only: highlight the centered row/map area,
     // but do not commit a region or reveal the adult section until an explicit tap.
     if(area&&area.id!==activeAreaId){activeAreaId=area.id;paintSelection();}
    }
   });
  };
  list.addEventListener('scroll',syncCenteredArea,{passive:true});
 }
 updateAreaChrome(root);renderZones(root);renderMap(root);renderAreaList(root);paintSelection();
}
function updateAreaChrome(root){
 const count=root.querySelector('.gym20-area-counter');if(count)count.textContent=city==='tehran'?'۲۲ منطقه':'۶ فاز';
 const compass=root.querySelector('.gym20-area-compass');if(compass)compass.textContent=city==='tehran'?'N · شمال':'اندیشه · فازها';
 const hud=root.querySelector('.gym20-area-hud');const a=allAreas().find(x=>x.id===activeAreaId);
 if(hud){hud.querySelector('b').textContent=a?a.name:(city==='tehran'?'نقشه مناطق تهران':'نقشه فازهای اندیشه');hud.querySelector('span').textContent=a?a.hoods:'برای انتخاب، روی یکی از محدوده‌ها بزنید';}
 const search=root.querySelector('.gym20-area-search');if(search)search.placeholder=city==='tehran'?'جستجوی منطقه یا محله در تهران...':'جستجوی فاز یا محدوده اندیشه...';
}
function renderAdminAreaAssignments(){
 const container=document.getElementById('adminRegionAreasContainer');if(!container)return;
 const group=(appData.regions||[]).find(r=>String(r.id)===String(adminActiveRegionId));
 if(!group){container.style.display='none';container.innerHTML='';return;}
 if(!Array.isArray(group.areas))group.areas=[];
 container.style.display='block';container.innerHTML='';
 const title=document.createElement('div');title.className='gym20-admin-area-title';title.textContent='محدوده‌های مشمول این تعرفه';container.appendChild(title);
 const hint=document.createElement('div');hint.className='gym20-admin-area-hint';hint.textContent='چند منطقه یا فاز را تیک بزن. هر محدوده فقط به یک گروه تعرفه تعلق می‌گیرد؛ انتخاب آن در این گروه، از گروه قبلی منتقل می‌شود.';container.appendChild(hint);
 [['تهران',TEHRAN],['اندیشه',ANDISHEH]].forEach(([cityName,items])=>{
  const section=document.createElement('div');section.className='gym20-admin-area-city';
  const head=document.createElement('div');head.className='gym20-admin-area-city-title';head.textContent=cityName;section.appendChild(head);
  const grid=document.createElement('div');grid.className='gym20-admin-area-grid';
  items.forEach(a=>{
   const owner=ownerOf(a.id),checked=owner&&String(owner.id)===String(group.id);
   const label=document.createElement('label');label.className='gym20-admin-area-option'+(checked?' selected':'');
   const input=document.createElement('input');input.type='checkbox';input.checked=!!checked;
   input.addEventListener('change',()=>{
    (appData.regions||[]).forEach(r=>{if(!Array.isArray(r.areas))r.areas=[];r.areas=r.areas.filter(id=>id!==a.id);});
    if(input.checked)group.areas.push(a.id);
    renderAdminAreaAssignments();
    if(activeAreaId===a.id){applyAreaSelection(a,true);}
   });
   const name=document.createElement('span');name.textContent=a.name;
   const detail=document.createElement('small');detail.textContent=owner&&!checked?'در تعرفه: '+owner.name:a.zone;
   label.append(input,name,detail);grid.appendChild(label);
  });
  section.appendChild(grid);container.appendChild(section);
 });
 const total=(group.areas||[]).length;
 const count=document.createElement('div');count.className='gym20-admin-area-count';count.textContent=fa(total)+' محدوده به این تعرفه متصل است.';container.appendChild(count);
}
window.gym20EnsureAreaPricing=ensureAreaPricing;
window.gym20RenderAreaPicker=renderAreaPicker;
window.gym20RenderAdminAreaAssignments=renderAdminAreaAssignments;
window.gym20SelectedAreaInfo=null;
ensureAreaPricing();
if(typeof loadActiveRegionDataIntoForm==='function'){
 const oldLoadActiveRegionDataIntoForm=loadActiveRegionDataIntoForm;
 loadActiveRegionDataIntoForm=function(){oldLoadActiveRegionDataIntoForm();renderAdminAreaAssignments();};
}
if(typeof onActiveRegionFieldInput==='function'){
 const oldOnActiveRegionFieldInput=onActiveRegionFieldInput;
 onActiveRegionFieldInput=function(){oldOnActiveRegionFieldInput();renderAdminAreaAssignments();};
}
if(typeof renderCustomRegionDropdown==='function')renderCustomRegionDropdown();
})();