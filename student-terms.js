(() => {
  const TAB='studentTermsTab', S={students:[],enrollments:[],terms:[],allPublishedSessions:[],studentId:'',termId:'',term:null,draftId:'',rows:[],manualDates:[],publishedId:null,publishedReadOnly:false,sessions:[],termEnrollmentIds:[],reminderDraft:{},pushTemplatesLoaded:false};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=v=>Number(v||0).toLocaleString('fa-IR');
  const db=()=>{if(!gym20OwnerAuthorized||!gym20AdminClient)throw Error('ابتدا با حساب مدیر وارد شوید.');return gym20AdminClient.schema('gym20');};
  const say=(m,bad)=>{const e=$('stFeedback');if(e){e.textContent=m||'';e.style.color=bad?'#fb7185':'#34d399';}};
  const dateFa=v=>v?jalaliInput(String(v).slice(0,10)).replace(/\//g,'/'):'—';
  const enDigits=v=>String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const jalaliInput=v=>{if(!v)return '';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite)||p[0]<1000||p[1]<1||p[1]>12||p[2]<1||p[2]>31)return '';if(p[0]<1700)return String(p[0]).padStart(4,'0')+'/'+String(p[1]).padStart(2,'0')+'/'+String(p[2]).padStart(2,'0');const parts=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(p[0],p[1]-1,p[2],12));const val=type=>parts.find(x=>x.type===type)?.value||'';return val('year').padStart(4,'0')+'/'+val('month').padStart(2,'0')+'/'+val('day').padStart(2,'0');};
  const gregorianInput=v=>{const z=enDigits(v).trim().replace(/[.\-]/g,'/');if(!z)return '';const p=z.split('/').map(Number);if(p.length!==3||p[0]<1200||p[1]<1||p[1]>12||p[2]<1||p[2]>31)throw Error('تاریخ شمسی را به شکل ۱۴۰۵/۰۸/۱۰ وارد کن.');const g=jalaliToGregorian(p[0],p[1],p[2]);if(!g)throw Error('تاریخ شمسی معتبر نیست.');return g;};
  const bindJalaliDates=root=>{(root||document).querySelectorAll('[data-jalali-date]').forEach(el=>{if(el.dataset.jalaliBound)return;el.dataset.jalaliBound='1';el.type='text';el.inputMode='numeric';el.placeholder='1405/08/10';const raw=enDigits(el.value).trim(),normalized=raw.replace(/[.\\-]/g,'/'),parts=normalized.split('/').map(Number);el.value=parts.length===3&&parts[0]>=1200&&parts[0]<1700&&parts[1]>=1&&parts[1]<=12&&parts[2]>=1&&parts[2]<=31?parts.map((n,i)=>String(n).padStart(i===0?4:2,'0')).join('/'):jalaliInput(raw);el.addEventListener('input',()=>{let v=enDigits(el.value).replace(/[^0-9]/g,'').slice(0,8);if(v.length>6)v=v.slice(0,4)+'/'+v.slice(4,6)+'/'+v.slice(6);else if(v.length>4)v=v.slice(0,4)+'/'+v.slice(4);el.value=v;});});};
  const TEHRAN_TZ='Asia/Tehran';
  const localISO=(d,t)=>{
    const dp=String(d||'').split('-').map(Number),tp=String(t||'').split(':').map(Number);
    if(dp.length!==3||tp.length<2||!dp.every(Number.isFinite)||!tp.every(Number.isFinite)||dp[0]<1900||dp[1]<1||dp[1]>12||dp[2]<1||dp[2]>31||tp[0]<0||tp[0]>23||tp[1]<0||tp[1]>59)throw Error('تاریخ یا ساعت نامعتبر است.');
    const wanted=Date.UTC(dp[0],dp[1]-1,dp[2],tp[0],tp[1],0);
    let instant=wanted;
    const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TEHRAN_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    for(let i=0;i<4;i++){
      const parts=Object.fromEntries(fmt.formatToParts(new Date(instant)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
      const represented=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second);
      const diff=wanted-represented;if(!diff)break;instant+=diff;
    }
    const check=Object.fromEntries(fmt.formatToParts(new Date(instant)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
    if(check.year!==dp[0]||check.month!==dp[1]||check.day!==dp[2]||check.hour!==tp[0]||check.minute!==tp[1])throw Error('این ساعت در منطقه زمانی تهران معتبر نیست.');
    return new Date(instant).toISOString();
  };
  const tehranParts=v=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TEHRAN_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(v)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const localDate=v=>{const p=tehranParts(v);return p.year+'-'+p.month+'-'+p.day;};
  const weekdayFa=iso=>{const p=String(iso||'').slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '';return ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];};
  const localTime=v=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:TEHRAN_TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(v)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.hour+':'+p.minute;};
  const enNum=v=>Number(v||0).toLocaleString('en-US');
  const rowMinutes=r=>Math.max(1,Math.round((new Date(r.ends_at)-new Date(r.starts_at))/60000));
  // Keep visible session numbers contiguous and chronological in the editable draft.
  function normalizeDraftSessionNumbers(){
    S.rows.sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)||Number(a.session_number)-Number(b.session_number));
    S.rows.forEach((row,index)=>{row.session_number=index+1;});
  }
  const plus7=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+7*n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  const classNames={normal:'عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP',online:'آنلاین'};
  const attNames={pending:'در انتظار',present:'حاضر',absent:'غایب',excused:'غیبت موجه',makeup:'جلسه جبرانی',cancelled:'لغوشده'};


  function syncTermName(){const p=enDigits($('stStart')?.value||'').split('/').map(Number),months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];$('stName').value=p.length===3&&p[0]>1200&&p[1]>=1&&p[1]<=12?'ترم '+months[p[1]-1]+' '+p[0]:'';}
  function initTermCalendars(root){
    const monthsFa=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    root.querySelectorAll('[data-calendar]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('.st-jcal').forEach(x=>x.remove());
      const input=$(btn.dataset.calendar),raw=enDigits(input.value||'').split('/').map(Number);
      const todayParts=enDigits(jalaliInput(localDate(new Date()))).split('/').map(Number);
      let jy=raw.length===3&&raw[0]>1200?raw[0]:todayParts[0];
      let jm=raw.length===3&&raw[1]>=1&&raw[1]<=12?raw[1]:todayParts[1];
      const pop=document.createElement('div');pop.className='st-jcal';document.body.appendChild(pop);
      const rect=btn.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-260,rect.left+rect.width/2-126))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-290,rect.bottom+5))+'px';
      const draw=()=>{
        const g=jalaliToGregorian(jy,jm,1),next=jm===12?jalaliToGregorian(jy+1,1,1):jalaliToGregorian(jy,jm+1,1);
        const first=new Date(g+'T12:00:00'),last=new Date(next+'T12:00:00'),days=Math.round((last-first)/86400000),offset=(first.getDay()+1)%7,picked=enDigits(input.value).split('/').map(Number),todayParts=enDigits(jalaliInput(localDate(new Date()))).split('/').map(Number);
        const termStart=gregorianInput($('stStart')?.value||''),termEnd=gregorianInput($('stEnd')?.value||''),hasTermRange=!!termStart&&!!termEnd&&termEnd>=termStart;
        pop.innerHTML='<div class="st-jcal-head"><button type="button" data-prev>‹</button><b>'+monthsFa[jm-1]+' '+fa(jy)+'</b><button type="button" data-next>›</button></div><div class="st-jcal-grid">'+['ش','ی','د','س','چ','پ','ج'].map(x=>'<span>'+x+'</span>').join('')+Array(offset).fill('<i></i>').join('')+Array.from({length:days},(_,i)=>{const iso=jalaliToGregorian(jy,jm,i+1),isStart=hasTermRange&&iso===termStart,isEnd=hasTermRange&&iso===termEnd;return '<button type="button" class="st-jcal-day '+(isStart?'term-range-start ':'')+(isEnd?'term-range-end ':'')+(picked[0]===jy&&picked[1]===jm&&picked[2]===i+1?'selected '+(input.classList.contains('st-date-input')?'session-date-selected ':''):'')+(todayParts[0]===jy&&todayParts[1]===jm&&todayParts[2]===i+1?'today':'')+'" data-day="'+(i+1)+'">'+fa(i+1)+'</button>';}).join('')+'</div>';
        pop.querySelector('[data-prev]').onclick=()=>{if(--jm<1){jm=12;jy--;}draw();};
        pop.querySelector('[data-next]').onclick=()=>{if(++jm>12){jm=1;jy++;}draw();};
        pop.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{input.value=jy+'/'+String(jm).padStart(2,'0')+'/'+String(Number(b.dataset.day)).padStart(2,'0');input.dispatchEvent(new Event('change',{bubbles:true}));pop.remove();});
      };draw();
      const close=e=>{if(!pop.contains(e.target)&&e.target!==btn){pop.remove();document.removeEventListener('pointerdown',close);}};
      setTimeout(()=>document.addEventListener('pointerdown',close),0);
    }));
  }
  /* Term selector wheel: mirrors the region picker (3-copy loop, centered focus, touch + mouse). */
  function syncTermWheel(wrap){
    const select=wrap?.querySelector('#stTerm'),label=wrap?.querySelector('.st-custom-value'),menu=wrap?._termWheelMenu||wrap?.querySelector('.st-term-wheel-menu');
    if(!select||!label)return;
    const option=select.options[select.selectedIndex];label.textContent=option?option.textContent:'انتخاب ترم…';
    if(menu)menu.querySelectorAll('.st-term-wheel-item').forEach(item=>{
      const selected=item.dataset.value===select.value;
      item.setAttribute('aria-selected',String(selected));
      item.classList.toggle('selected',selected);
    });
  }
  function refreshTermWheel(select){
    const wrap=select?.closest('.st-term-wheel'),menu=wrap?._termWheelMenu||wrap?.querySelector('.st-term-wheel-menu');
    if(!wrap||!menu)return;
    menu.innerHTML='';
    const options=Array.from(select.options),wheel=document.createElement('div');
    wheel.className='st-term-wheel-list';wheel.setAttribute('role','listbox');wheel.setAttribute('aria-label','انتخاب ترم هنرجو');
    wheel.dataset.optionCount=String(options.length);
    [0,1,2].forEach(copy=>options.forEach(option=>{
      const item=document.createElement('button');item.type='button';item.className='st-term-wheel-item';
      item.dataset.value=option.value;item.dataset.copy=String(copy);
      item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));
      item.textContent=option.textContent;wheel.appendChild(item);
    }));
    menu.appendChild(wheel);bindTermWheel(wheel);syncTermWheel(wrap);
  }
  function termWheelList(){return document.querySelector('.st-term-wheel-menu.open .st-term-wheel-list');}
  function updateTermWheelFocus(w){
    w=w||termWheelList();if(!w)return null;
    const items=Array.from(w.querySelectorAll('.st-term-wheel-item'));if(!items.length)return null;
    const center=w.getBoundingClientRect().top+w.clientHeight/2;
    let best=null,distance=Infinity;
    items.forEach(item=>{const r=item.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-center);if(d<distance){best=item;distance=d;}});
    items.forEach(item=>item.classList.toggle('wheel-focus',item===best));
    if(best)w._gym20PendingTermValue=best.dataset.value;
    return best;
  }
  function termWheelCycleSize(w){
    const count=Number(w.dataset.optionCount)||Math.floor(w.children.length/3);
    return count>0&&w.children.length>=count*3?w.children[count].offsetTop-w.children[0].offsetTop:0;
  }
  function recycleTermWheel(w){
    const cycle=termWheelCycleSize(w);if(!cycle)return;
    if(w.scrollTop<cycle*.35)w.scrollTop+=cycle;
    else if(w.scrollTop>cycle*1.65)w.scrollTop-=cycle;
  }
  function centerTermWheel(value){
    const w=termWheelList();if(!w)return;
    const item=Array.from(w.querySelectorAll('.st-term-wheel-item')).find(x=>x.dataset.value===String(value)&&x.dataset.copy==='1');
    if(!item)return;
    w.scrollTop=item.offsetTop-(w.clientHeight-item.offsetHeight)/2;
    requestAnimationFrame(()=>updateTermWheelFocus(w));
  }
  function positionTermWheel(wrap){
    const trigger=wrap?.querySelector('.st-custom-select-trigger'),menu=wrap?._termWheelMenu||wrap?.querySelector('.st-term-wheel-menu');
    if(!trigger||!menu||!menu.classList.contains('open'))return;
    const r=trigger.getBoundingClientRect(),gap=6,pad=8;
    const below=Math.max(0,window.innerHeight-r.bottom-gap-pad),above=Math.max(0,r.top-gap-pad);
    const placeBelow=below>=above,available=placeBelow?below:above;
    const height=Math.max(112,Math.min(218,window.innerHeight-pad*2,available));
    const width=Math.max(1,Math.min(r.width,window.innerWidth-pad*2));
    const left=Math.max(pad,Math.min(r.right-width,window.innerWidth-width-pad));
    const top=placeBelow?r.bottom+gap:r.top-gap-height;
    menu.style.setProperty('position','fixed','important');
    menu.style.setProperty('top',Math.max(pad,Math.min(top,window.innerHeight-height-pad))+'px','important');
    menu.style.setProperty('left',left+'px','important');menu.style.setProperty('right','auto','important');
    menu.style.setProperty('bottom','auto','important');menu.style.setProperty('width',width+'px','important');
    menu.style.setProperty('height',height+'px','important');menu.style.setProperty('max-height',height+'px','important');
  }
  function closeTermWheel(wrap){
    const menu=wrap?._termWheelMenu||wrap?.querySelector('.st-term-wheel-menu'),trigger=wrap?.querySelector('.st-custom-select-trigger');
    const w=menu?.querySelector('.st-term-wheel-list');if(w){clearTimeout(w._gym20SettleTimer);w._gym20PointerDown=false;w._gym20GestureMoved=false;}
    menu?.classList.remove('open');trigger?.classList.remove('open');trigger?.setAttribute('aria-expanded','false');
    if(menu){menu.setAttribute('aria-hidden','true');['top','left','right','bottom','width','height','max-height'].forEach(p=>menu.style.removeProperty(p));}
  }
  function commitTermWheel(wrap,value){
    const select=wrap?.querySelector('#stTerm');if(!select||!Array.from(select.options).some(o=>o.value===value))return;
    select.value=value;wrap._termWheelCommitting=true;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    wrap._termWheelCommitting=false;syncTermWheel(wrap);closeTermWheel(wrap);
  }
  function bindTermWheel(w){
    if(w._gym20TermBound)return;w._gym20TermBound=true;
    w._gym20PointerDown=false;w._gym20GestureMoved=false;w._gym20Dragged=false;w._gym20LastScrollTop=w.scrollTop;
    const settle=()=>{
      clearTimeout(w._gym20SettleTimer);
      if(!w._gym20GestureMoved||w._gym20PointerDown)return;
      w._gym20SettleTimer=setTimeout(()=>{
        if(w._gym20PointerDown||!w._gym20GestureMoved)return;
        const best=updateTermWheelFocus(w);w._gym20GestureMoved=false;w._gym20Dragged=false;
        if(best)commitTermWheel(w.closest('.st-term-wheel-menu')?._termWheelWrap,best.dataset.value);
      },760);
    };
    w.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      w._gym20PointerDown=true;w._gym20Dragged=false;w._gym20GestureMoved=false;
      w._gym20StartX=e.clientX;w._gym20StartY=e.clientY;w._gym20StartScrollTop=w.scrollTop;w._gym20PointerType=e.pointerType;
      clearTimeout(w._gym20SettleTimer);
    },{passive:true});
    w.addEventListener('pointermove',e=>{
      if(!w._gym20PointerDown)return;
      const dx=Math.abs(e.clientX-w._gym20StartX),dy=Math.abs(e.clientY-w._gym20StartY);
      if(dx>7||dy>7)w._gym20Dragged=true;
      if(dy>7&&dy>dx*1.15){
        w._gym20GestureMoved=true;
        if(w._gym20PointerType==='mouse'){
          if(!w._gym20MouseCaptured&&w.setPointerCapture){try{w.setPointerCapture(e.pointerId);w._gym20MouseCaptured=true;}catch(_){}}
          e.preventDefault();w.scrollTop=w._gym20StartScrollTop-(e.clientY-w._gym20StartY);
        }
      }
    },{passive:false});
    const end=()=>{if(!w._gym20PointerDown)return;w._gym20PointerDown=false;w._gym20StartX=null;w._gym20StartY=null;if(w._gym20GestureMoved)settle();};
    w.addEventListener('pointerup',end,{passive:true});w.addEventListener('pointercancel',end,{passive:true});
    w.addEventListener('wheel',()=>{w._gym20GestureMoved=true;settle();},{passive:true});
    w.addEventListener('scroll',()=>{
      const now=w.scrollTop,delta=Math.abs(now-w._gym20LastScrollTop);w._gym20LastScrollTop=now;
      if(delta>2&&w._gym20PointerDown)w._gym20GestureMoved=true;
      if(!w._gym20Frame)w._gym20Frame=requestAnimationFrame(()=>{w._gym20Frame=0;recycleTermWheel(w);updateTermWheelFocus(w);});
      if(w._gym20GestureMoved&&!w._gym20PointerDown)settle();
    },{passive:true});
  }
  function enhanceTermWheel(select){
    if(!select||select.dataset.termWheelReady==='1')return;
    select.dataset.termWheelReady='1';
    const wrap=document.createElement('div');wrap.className='st-custom-select st-term-wheel';
    select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.classList.add('st-custom-select-native');
    const trigger=document.createElement('button');trigger.type='button';trigger.className='st-custom-select-trigger';
    trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<span class="st-custom-value"></span><span class="st-custom-arrow">⌄</span>';
    const menu=document.createElement('div');menu.className='st-term-wheel-menu';menu.setAttribute('aria-hidden','true');
    wrap.append(trigger,menu);wrap._termWheelMenu=menu;menu._termWheelWrap=wrap;document.body.appendChild(menu);
    if(!document.getElementById('stTermWheelStyle')){const style=document.createElement('style');style.id='stTermWheelStyle';style.textContent=`\n      #studentTermsTab .st-term-wheel{position:relative!important;min-width:0!important;width:100%!important;overflow:visible!important}\n      #studentTermsTab .st-term-wheel .st-custom-select-native{position:absolute!important;inset:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}\n      #studentTermsTab .st-term-wheel .st-custom-select-trigger{box-sizing:border-box!important;width:100%!important;min-width:0!important;overflow:hidden!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}\n      .st-term-wheel-menu{display:none;box-sizing:border-box;z-index:2147483000;padding:0;overflow:hidden;direction:rtl;border:1px solid rgba(225,232,242,.10);border-radius:15px;background:linear-gradient(145deg,rgba(55,63,74,.97),rgba(27,32,41,.98));-webkit-backdrop-filter:blur(22px) saturate(145%);backdrop-filter:blur(22px) saturate(145%);box-shadow:0 18px 42px rgba(0,0,0,.40),0 4px 12px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.055);}\n      .st-term-wheel-menu.open{display:flex!important;flex-direction:column!important}\n      .st-term-wheel-menu:after{content:\"\";position:absolute;z-index:2;left:0;right:0;bottom:0;height:22px;pointer-events:none;background:linear-gradient(to bottom,transparent,rgba(27,32,41,.82))}\n      .st-term-wheel-list{position:relative;z-index:1;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;width:100%;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;padding:89px 9px;scroll-padding-block:89px;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-width:none}\n      .st-term-wheel-list::-webkit-scrollbar{display:none}\n      .st-term-wheel-item{box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex:0 0 40px;width:100%;height:40px;min-height:40px;margin:0;padding:5px 8px;border:1px solid transparent;border-radius:10px;background:transparent;color:#dce2e9;font:650 12px Vazirmatn,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.46;transform:scale(.94);filter:blur(.2px);transition:opacity .18s ease,transform .18s ease,background .18s ease,filter .18s ease;cursor:pointer;touch-action:pan-y}\n      .st-term-wheel-item.wheel-focus{opacity:1;transform:scale(1.015);filter:none;background:linear-gradient(100deg,rgba(214,179,90,.08),rgba(214,179,90,.16),rgba(214,179,90,.08));color:#f0d18a;font-weight:850}\n      html[data-theme=\"light\"] .st-term-wheel-menu{background:linear-gradient(145deg,rgba(255,255,255,.99),rgba(242,246,249,.99));border-color:rgba(120,130,145,.24);box-shadow:0 18px 42px rgba(25,39,55,.18),inset 0 1px 0 rgba(255,255,255,.8)}\n      html[data-theme=\"light\"] .st-term-wheel-menu:after{background:linear-gradient(to bottom,transparent,rgba(242,246,249,.9))}\n      html[data-theme=\"light\"] .st-term-wheel-item{color:#647184}\n      html[data-theme=\"light\"] .st-term-wheel-item.wheel-focus{color:#795814}\n      @media(prefers-reduced-motion:reduce){.st-term-wheel-item{transition:none!important}}\n    `;document.head.appendChild(style);}
    refreshTermWheel(select);
    trigger.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const opening=!menu.classList.contains('open');
      document.querySelectorAll('.st-term-wheel-menu.open').forEach(m=>closeTermWheel(m._termWheelWrap));
      if(!opening)return;
      refreshTermWheel(select);menu.classList.add('open');trigger.classList.add('open');trigger.setAttribute('aria-expanded','true');menu.setAttribute('aria-hidden','false');
      positionTermWheel(wrap);
      const w=menu.querySelector('.st-term-wheel-list');if(w){w._gym20PointerDown=false;w._gym20GestureMoved=false;w._gym20Dragged=false;clearTimeout(w._gym20SettleTimer);}
      requestAnimationFrame(()=>{centerTermWheel(select.value);if(w)w._gym20LastScrollTop=w.scrollTop;});
    });
    menu.addEventListener('click',e=>{
      const item=e.target.closest('.st-term-wheel-item');if(!item||!menu.contains(item))return;
      e.preventDefault();e.stopPropagation();const w=menu.querySelector('.st-term-wheel-list');
      if(w?._gym20Dragged){w._gym20Dragged=false;w._gym20GestureMoved=true;return;}
      if(w){clearTimeout(w._gym20SettleTimer);w._gym20GestureMoved=false;}
      commitTermWheel(wrap,item.dataset.value);
    });
    select.addEventListener('change',()=>{
      syncTermWheel(wrap);
      if(menu.classList.contains('open')&&!wrap._termWheelCommitting)centerTermWheel(select.value);
    });
    if(!document.documentElement.dataset.stTermWheelGlobalBound){
      document.documentElement.dataset.stTermWheelGlobalBound='1';
      document.addEventListener('pointerdown',e=>{
        document.querySelectorAll('.st-term-wheel-menu.open').forEach(m=>{const w=m._termWheelWrap;if(w&&!w.contains(e.target)&&!m.contains(e.target))closeTermWheel(w);});
      },true);
      document.addEventListener('keydown',e=>{
        if(e.key==='Escape')document.querySelectorAll('.st-term-wheel-menu.open').forEach(m=>closeTermWheel(m._termWheelWrap));
      });
      const reposition=()=>document.querySelectorAll('.st-term-wheel-menu.open').forEach(m=>positionTermWheel(m._termWheelWrap));
      window.addEventListener('resize',reposition,{passive:true});
      document.addEventListener('scroll',reposition,true);
    }
  }
  function syncCustomSelect(wrap){if(wrap?.classList.contains('st-term-wheel')){syncTermWheel(wrap);return;}const select=wrap?.querySelector('select'),value=wrap?.querySelector('.st-custom-value'),menu=wrap?.querySelector('.st-custom-select-menu');if(!select||!value||!menu)return;const opt=select.options[select.selectedIndex];value.textContent=opt?opt.textContent:'انتخاب کنید…';menu.querySelectorAll('[data-option-index]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.optionIndex)===select.selectedIndex));}
  function refreshCustomSelect(select){if(select?.id==='stTerm'){refreshTermWheel(select);return;}const wrap=select?.closest('.st-custom-select');if(!wrap)return;const menu=wrap.querySelector('.st-custom-select-menu');menu.innerHTML=Array.from(select.options).map((o,i)=>'<button type="button" class="st-custom-option '+(i===select.selectedIndex?'selected':'')+'" data-option-index="'+i+'" '+(o.disabled?'disabled':'')+'>'+esc(o.textContent)+'</button>').join('');syncCustomSelect(wrap);}
  function enhanceSelect(select){if(!select||select.id==='stTerm'||select.multiple||select.dataset.customized==='1')return;select.dataset.customized='1';const wrap=document.createElement('div');wrap.className='st-custom-select';select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.classList.add('st-custom-select-native');select.removeAttribute('required');const trigger=document.createElement('button');trigger.type='button';trigger.className='st-custom-select-trigger';trigger.innerHTML='<span class="st-custom-value"></span><span class="st-custom-arrow">⌄</span>';const menu=document.createElement('div');menu.className='st-custom-select-menu';menu.hidden=true;wrap.append(trigger,menu);trigger.addEventListener('click',()=>{const opening=menu.hidden;document.querySelectorAll('#studentTermsTab .st-custom-select-menu').forEach(m=>{m.hidden=true;m.parentElement.classList.remove('open');});menu.hidden=!opening;wrap.classList.toggle('open',opening);trigger.setAttribute('aria-expanded',String(opening));});menu.addEventListener('click',e=>{const b=e.target.closest('[data-option-index]');if(!b)return;select.selectedIndex=Number(b.dataset.optionIndex);select.dispatchEvent(new Event('change',{bubbles:true}));menu.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');syncCustomSelect(wrap);});select.addEventListener('change',()=>refreshCustomSelect(select));refreshCustomSelect(select);}
  function enhanceAllSelects(root){const scope=root||document;enhanceTermWheel(scope.querySelector?.('#stTerm')||document.getElementById('stTerm'));scope.querySelectorAll('#studentTermsTab select:not([multiple]):not(#stTerm)').forEach(enhanceSelect);}
  function mount(){
    if($(TAB))return;
    const nav=document.querySelector('.admin-tabs'),work=document.querySelector('.admin-workspace');
    if(!nav||!work)return;
    const termCss=document.createElement('style');
    termCss.id='studentTermsLayoutCss';
    termCss.textContent=`
      #studentTermsTab .st-term-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:end}
      #studentTermsTab .st-term-grid>.st-field{min-width:0!important;margin:0!important}
      #studentTermsTab .st-term-picker-row{display:flex;align-items:center;gap:5px;min-width:0}
      #studentTermsTab .st-term-picker-row .st-custom-select{flex:1 1 auto;min-width:0}
      #studentTermsTab .st-term-picker-row .st-btn{flex:0 0 auto;height:34px;min-height:34px;padding:4px 7px!important;font-size:9px!important}
      #studentTermsTab .st-term-picker-field .st-custom-select-trigger{height:40px;min-height:40px;font-size:11px}
      #studentTermsTab .st-term-grid .st-field label{display:block;font-size:12px!important;line-height:1.5;white-space:normal!important;margin-bottom:4px}
      #studentTermsTab .st-term-grid input{box-sizing:border-box;width:100%;min-width:0;height:40px!important;min-height:40px!important;padding:7px 9px!important;font-size:13px!important}
      #studentTermsTab .st-date-wrap{display:flex;align-items:center;gap:6px;width:100%;min-width:0}
      #studentTermsTab .st-date-wrap input{flex:1 1 auto;width:0;min-width:0}
      #studentTermsTab .st-calendar-btn{flex:0 0 38px;width:38px;height:40px;border:1px solid #9b7938;border-radius:8px;background:#24202a;color:#f1ce7c;font-size:18px;cursor:pointer}
      #studentTermsTab .st-create-compact{padding:14px!important}
      .st-jcal{position:fixed!important;z-index:2147483001!important;width:252px;max-width:calc(100vw - 16px);padding:10px;border:1px solid #94743a;border-radius:12px;background:#111722;box-shadow:0 12px 30px #000b;color:#fff;box-sizing:border-box;direction:rtl;font-family:inherit}.st-jcal *{box-sizing:border-box}.st-jcal-head button{min-width:34px;min-height:32px;cursor:pointer;font-size:18px}.st-jcal-head b{font-size:13px;white-space:nowrap}.st-jcal-grid{grid-auto-rows:minmax(32px,auto);align-items:stretch}.st-jcal-grid>span{display:flex;align-items:center;justify-content:center}.st-jcal-grid>i{display:block;min-height:32px}.st-jcal-day{display:flex;align-items:center;justify-content:center;min-width:0;min-height:32px;line-height:1;padding:0;font-family:inherit}
      .st-jcal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .st-jcal-head button,.st-jcal-day{border:1px solid #354153;border-radius:7px;background:#1c2634;color:#fff;padding:6px 7px}
      .st-jcal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
      .st-jcal-grid span{font-size:11px;color:#d8bc78;padding:5px 0}
      .st-jcal-grid i{min-height:30px}
      .st-jcal-day{width:100%;min-height:30px;font-size:11px;padding:4px 0;cursor:pointer}
      .st-jcal-day.selected{background:#b68b3b;color:#111;font-weight:800}
      .st-jcal-day.term-boundary,.st-jcal-day.term-boundary.selected{background:#168a45!important;border-color:#22c55e!important;color:#fff!important;font-weight:900!important;box-shadow:0 0 0 1px rgba(34,197,94,.2)}
      .st-jcal-day.today{outline:2px solid #d6b35a;outline-offset:1px}
      .st-student-select-wrap{width:100%;max-width:420px;margin-bottom:0!important}
      .st-student-picker{position:relative;width:100%}
      .st-student-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:42px;padding:9px 11px;border:1px solid rgba(214,179,90,.55);border-radius:10px;background:#111a27;color:#f3f0e8;font:inherit;font-size:13px;text-align:right;cursor:pointer}
      .st-student-trigger span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .st-picker-arrow{color:#d6b35a;font-size:18px}
      .st-student-menu{position:absolute!important;z-index:10050!important;top:calc(100% + 6px)!important;right:0!important;left:0!important;width:100%!important;max-height:min(48vh,300px);overflow-y:auto;overflow-x:hidden;padding:5px;border:1px solid rgba(214,179,90,.65);border-radius:11px;background:#171e2b!important;color:#f3f0e8!important;box-shadow:0 14px 32px #000b;box-sizing:border-box;direction:rtl}.st-student-option{display:flex!important;min-height:40px;box-sizing:border-box;line-height:1.5}.st-student-option span{min-width:0;overflow:hidden;text-overflow:ellipsis}.st-student-option small{flex:0 0 auto}
      .st-student-menu[hidden]{display:none!important}
      .st-student-option{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:10px 9px;border:1px solid rgba(255,255,255,.22);border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:#eee;text-align:right;font:inherit;font-size:12px;cursor:pointer}
      .st-student-option:last-child{border-bottom:0}
      .st-student-option small{color:#b7a16c;font-size:10px;white-space:nowrap}
      .st-student-option.selected{background:rgba(214,179,90,.13);color:#f2d48b;border-radius:7px}
      .st-day-picks{display:flex;flex-wrap:wrap;gap:6px}
      .st-day-chip{display:flex!important;align-items:center;gap:5px;padding:7px 9px;border:1px solid rgba(214,179,90,.35);border-radius:8px;background:var(--surface);color:var(--text-primary)!important;font-size:11px!important;white-space:nowrap}
      .st-day-chip input{width:14px!important;height:14px!important;accent-color:#d6b35a}
      .st-pattern-grid{margin:10px 0;grid-template-columns:repeat(2,minmax(0,1fr))!important}
      @media(max-width:720px){
        #studentTermsTab .st-term-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
        #studentTermsTab .st-term-grid>.st-field:nth-child(1),
        #studentTermsTab .st-term-grid>.st-field:nth-child(2),
        #studentTermsTab .st-term-grid>.st-field:nth-child(3){grid-column:auto;grid-row:auto}
        #studentTermsTab .st-term-picker-row{gap:3px}
        #studentTermsTab .st-term-picker-row .st-btn{padding:3px 5px!important;font-size:8px!important}
        #studentTermsTab .st-term-picker-field .st-custom-select-trigger{height:36px;min-height:36px;padding:4px 5px;font-size:9px}
        #studentTermsTab .st-term-grid .st-field label{font-size:11px!important}
        #studentTermsTab .st-term-grid input{height:38px!important;min-height:38px!important;font-size:12px!important}
        #studentTermsTab .st-calendar-btn{height:38px;flex-basis:34px;width:34px}
        #studentTermsTab .st-create-compact{padding:10px!important}
        #studentTermsTab .st-pattern-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #studentTermsTab .st-day-chip{padding:6px 7px;font-size:10px!important}
      }
      @media(max-width:390px){
        #studentTermsTab .st-term-grid{gap:8px 6px!important}
        #studentTermsTab .st-term-grid .st-field label{font-size:10px!important}
        #studentTermsTab .st-term-grid input{font-size:11px!important;padding:5px!important}
        #studentTermsTab .st-calendar-btn{flex-basis:31px;width:31px}
      }`;
    termCss.textContent += `
      #studentTermsTab .st-student-card{padding:6px 8px!important;margin:5px 0!important}
      #studentTermsTab .st-student-card #stSummary{margin:0!important;padding:0!important}
      #studentTermsTab .st-student-trigger{min-height:30px!important;padding:4px 7px!important;font-size:9px!important}
      #studentTermsTab .st-public-link{margin:0!important;padding:0!important}
      #studentTermsTab .st-short-url{font-size:8px!important;line-height:1.35!important;padding:4px 6px!important;margin:3px 0!important;border-radius:6px!important}
      #studentTermsTab .st-public-link .st-actions{gap:4px!important;margin-top:3px!important}
      #studentTermsTab .st-public-link .st-btn{min-height:24px!important;padding:3px 6px!important;font-size:8px!important;border-radius:6px!important}
      #studentTermsTab #stPublicLinkStatus{font-size:8px!important;line-height:1.35!important}
      #studentTermsTab .st-term-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;align-items:end!important}
      #studentTermsTab .st-term-grid>.st-field{min-width:0!important;margin:0!important}
      #studentTermsTab .st-term-grid .st-field label{font-size:10px!important;white-space:nowrap!important;margin-bottom:3px!important}
      #studentTermsTab .st-term-grid input{height:35px!important;min-height:35px!important;padding:4px 5px!important;font-size:10px!important}
      #studentTermsTab .st-term-picker-row{gap:4px!important}
      #studentTermsTab .st-term-picker-row .st-custom-select{min-width:0!important;flex:1 1 auto!important}
      #studentTermsTab .st-term-picker-row .st-custom-select-trigger{height:35px!important;min-height:35px!important;padding:3px 5px!important;font-size:9px!important}
      #studentTermsTab .st-term-picker-row .st-btn{height:35px!important;min-height:35px!important;padding:3px 5px!important;font-size:8px!important}
      #studentTermsTab .st-date-wrap{gap:3px!important}
      #studentTermsTab .st-calendar-btn{flex:0 0 25px!important;width:25px!important;height:35px!important;font-size:13px!important}
      @media(max-width:720px){
        #studentTermsTab .st-term-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
        #studentTermsTab .st-term-grid>.st-field:nth-child(1),
        #studentTermsTab .st-term-grid>.st-field:nth-child(2),
        #studentTermsTab .st-term-grid>.st-field:nth-child(3){grid-column:auto!important;grid-row:auto!important}
        #studentTermsTab .st-term-grid .st-field label{font-size:9px!important;letter-spacing:-.25px}
        #studentTermsTab .st-term-grid input{height:32px!important;min-height:32px!important;font-size:9px!important;padding:3px!important}
        #studentTermsTab .st-calendar-btn{flex-basis:21px!important;width:21px!important;height:32px!important;padding:0!important;font-size:11px!important}
        #studentTermsTab .st-term-picker-row .st-custom-select-trigger{height:32px!important;min-height:32px!important;font-size:8px!important}
        #studentTermsTab .st-term-picker-row .st-btn{height:32px!important;min-height:32px!important;font-size:7px!important;padding:2px 3px!important}
        #studentTermsTab .st-create-compact{padding:8px!important}
      }
      @media(max-width:390px){
        #studentTermsTab .st-term-grid{gap:4px!important}
        #studentTermsTab .st-term-grid .st-field label{font-size:8px!important}
        #studentTermsTab .st-calendar-btn{flex-basis:18px!important;width:18px!important}
      }`;
    document.head.appendChild(termCss);
    const termPolishCss=document.createElement('style');
    termPolishCss.id='studentTermsPolishCss';
    termPolishCss.textContent=`
      /* Keep Persian dates compact but readable. */
      #studentTermsTab .st-term-grid input[data-jalali-date]{font-size:9px!important;letter-spacing:-.15px}
      /* Center the captions above the term date and term selector fields. */
      #studentTermsTab .st-term-grid>.st-field>label{display:block!important;width:100%!important;text-align:center!important;align-self:stretch!important;justify-self:stretch!important}
      /* Show month/year cleanly in the term picker; the stored term name is unchanged. */
      #studentTermsTab .st-term-picker-field .st-custom-select-trigger{font-weight:700;letter-spacing:0}
      #studentTermsTab .st-term-picker-field .st-custom-value{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @media(max-width:720px){
        #studentTermsTab .st-term-grid input[data-jalali-date]{font-size:8px!important;letter-spacing:-.2px}
      }`;
    document.head.appendChild(termPolishCss);

    const css=document.createElement('style');css.id='studentTermsCss';
    css.textContent='#studentTermsTab{color:var(--text-primary)}.st-card{background:var(--surface-card);border:1px solid var(--border);border-radius:11px;padding:11px;margin:10px 0}.st-title{font-size:.88rem;font-weight:850;color:#d6b35a;margin-bottom:8px}.st-muted{font-size:.7rem;color:var(--text-secondary);line-height:1.8}.st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}.st-field label{font-size:.7rem;color:var(--text-secondary);font-weight:700}.st-field input,.st-field select{width:100%;min-width:0;height:34px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:7px;padding:5px 7px;font-size:.72rem}.st-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.st-btn{border:1px solid rgba(214,179,90,.35);border-radius:7px;background:rgba(214,179,90,.12);color:var(--text-primary);padding:6px 9px;font-size:.66rem;font-weight:800;cursor:pointer}.st-btn.primary{background:linear-gradient(110deg,#a98235,#e0c16e);color:#17130a}.st-btn.danger{border-color:#ef4444;color:#fb7185}.st-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.st-check{display:flex;align-items:center;gap:6px;padding:6px 7px;border:1px solid var(--border);border-radius:7px;background:var(--surface);font-size:.66rem;line-height:1.5;min-width:0}.st-check input{accent-color:#d6b35a}.st-table-wrap{overflow:auto}.st-table{width:100%;border-collapse:collapse;font-size:.7rem;min-width:600px}.st-table th,.st-table td{padding:8px;border-bottom:1px solid var(--border);text-align:right}.st-table th{color:#d6b35a;background:rgba(214,179,90,.07)}.st-table select,.st-table input{max-width:150px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:6px;font-size:.68rem}.st-table small{display:block;color:var(--text-secondary);font-size:.6rem}.st-version{padding:7px;border:1px solid var(--border);border-radius:8px;margin:5px 0;font-size:.7rem}.st-hide{display:none!important}.st-short-url{direction:ltr;text-align:left;word-break:break-all;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 6px;margin:3px 0;font-size:8px!important;line-height:1.35;color:#e7c875}.st-public-link{margin-top:2px}.st-public-link .st-actions{gap:4px;margin-top:3px}.st-public-link .st-btn{min-height:25px;padding:3px 6px;font-size:8px!important}.st-public-link .st-muted{font-size:8px!important;line-height:1.35}@media(max-width:650px){.st-grid,.st-checks{grid-template-columns:repeat(2,minmax(0,1fr))}.st-card{padding:8px}}@media(max-width:390px){.st-grid,.st-checks{grid-template-columns:1fr}}';
    css.textContent += "#stPushCard .st-reminder-row:not(.st-custom-push-row){display:grid;grid-template-columns:1fr;gap:9px;margin:12px 0;padding:12px;border:1px solid rgba(214,179,90,.25);border-radius:13px;background:linear-gradient(135deg,rgba(214,179,90,.07),rgba(255,255,255,.015)),var(--surface);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:8px;border-bottom:1px solid var(--border)}#stPushCard .st-hour-field label{font-size:11px;font-weight:850;color:var(--text-primary)}#stPushCard .st-hour-field input{width:54px;height:32px;border-radius:9px;background:var(--surface-card);border:1px solid rgba(214,179,90,.5);font-size:14px;font-weight:850}#stPushCard .st-template-box{padding:0;border:0;background:transparent}#stPushCard .st-template-top{margin-bottom:8px}#stPushCard .st-template-top b{font-size:11px;color:#d6b35a}#stPushCard .st-template-preview{min-height:44px;padding:10px 11px;border:1px solid var(--border);border-radius:10px;background:rgba(0,0,0,.13);font-size:11px;line-height:1.9;color:var(--text-primary)}#stPushCard .st-edit-template{min-height:30px;padding:5px 10px!important;border-radius:8px;font-size:10px!important}#stPushCard .st-template-editor{box-sizing:border-box;width:100%;min-height:88px;margin-top:9px;padding:10px;border:1px solid rgba(214,179,90,.5);border-radius:10px;background:var(--surface-card);color:var(--text-primary);font:inherit;font-size:11px;line-height:1.9;resize:vertical}#stPushCard #stPushFeedback:empty{display:none}@media(min-width:650px){#stPushCard .st-reminder-row:not(.st-custom-push-row){grid-template-columns:1fr 1.4fr;align-items:center;gap:14px}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;border:0;padding:0}#stPushCard .st-hour-field input{width:76px;height:38px}}@media(max-width:420px){#stPushCard .st-reminder-row:not(.st-custom-push-row){padding:10px}#stPushCard .st-template-preview{font-size:10px}}" + '#stPushCard .st-reminder-row{display:grid;grid-template-columns:84px minmax(0,1fr);gap:9px;align-items:start;margin:9px 0}#stPushCard .st-reminder-row .st-field{min-width:0;margin:0}#stPushCard .st-hour-field input{box-sizing:border-box;width:100%;height:36px;min-height:36px;padding:6px 8px;text-align:center;direction:ltr;font-size:14px;font-weight:700;border:1px solid rgba(214,179,90,.6);border-radius:8px;background:var(--surface);color:var(--text-primary)}#stPushCard .st-template-box{min-width:0;padding:7px 9px;border:1px solid var(--border);border-radius:8px;background:var(--surface)}#stPushCard .st-template-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px;font-size:11px}#stPushCard .st-template-preview{font-size:11px;line-height:1.8;color:var(--text-secondary);overflow-wrap:anywhere}#stPushCard .st-template-editor{box-sizing:border-box;width:100%;min-height:76px;margin-top:7px;padding:8px;border:1px solid rgba(214,179,90,.55);border-radius:7px;background:var(--surface-card);color:var(--text-primary);font:inherit;font-size:12px;line-height:1.8;resize:vertical}#stPushCard .st-custom-push-row{grid-template-columns:minmax(0,1fr) 96px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)}#stPushCard .st-send-push-field{width:96px}#stPushCard #stSendCustomPush{height:36px;width:100%;white-space:nowrap}#stPushCard #stPushFeedback{min-height:18px;margin-top:4px}#stPushCard .st-push-status{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0;padding:8px 0;border-top:1px solid var(--border);font-size:11px;color:var(--text-secondary)}#stPushCard .st-push-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;display:inline-block;background:#777}#stPushCard .st-push-dot.active{background:#22c55e;box-shadow:0 0 7px #22c55e99}#stPushCard .st-push-dot.inactive{background:#ef4444;box-shadow:0 0 7px #ef444499}#stPushCard .st-push-toggle{height:32px;min-height:32px;padding:0 10px!important;font-size:10px!important;white-space:nowrap}#stPushCard .st-push-toggle.is-on{border-color:#16a34a!important;color:#4ade80!important}#stPushCard .st-reminder-row.st-custom-push-row textarea{box-sizing:border-box;width:100%;height:36px;min-height:36px;resize:vertical;padding:7px 8px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--text-primary);font:inherit;font-size:11px}@media(max-width:420px){#stPushCard .st-reminder-row{grid-template-columns:70px minmax(0,1fr);gap:6px}#stPushCard .st-template-top{font-size:10px}#stPushCard .st-template-preview{font-size:10px}#stPushCard .st-custom-push-row{grid-template-columns:minmax(0,1fr) 88px}#stPushCard .st-send-push-field{width:88px}}' + '.st-public-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;align-items:stretch}.st-public-actions .st-btn{display:flex;align-items:center;justify-content:center;min-width:0;min-height:36px;padding:6px 4px;text-align:center;text-decoration:none;white-space:nowrap;font-size:.64rem;line-height:1.2;overflow:hidden;text-overflow:clip}.st-public-actions .st-btn:active{transform:scale(.97)}@media(max-width:600px){.st-public-actions{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.st-public-actions .st-btn{min-height:34px;padding:5px 2px;font-size:clamp(8px,2.45vw,10px);border-radius:6px}}';
    css.textContent += '.st-time-input{box-sizing:border-box!important;width:104px!important;max-width:104px!important;height:36px!important;min-height:36px!important;padding:5px 9px!important;border:1px solid rgba(214,179,90,.62)!important;border-radius:10px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f7e7bd!important;font-family:Montserrat,Vazirmatn,sans-serif!important;font-size:15px!important;font-weight:800!important;letter-spacing:1px;text-align:center;direction:ltr;color-scheme:dark;box-shadow:inset 0 1px 2px #0008,0 2px 8px #0003;transition:border-color .18s,box-shadow .18s,background .18s}.st-time-input:focus{outline:none!important;border-color:#e5c36e!important;background:linear-gradient(145deg,#263448,#151f2e)!important;box-shadow:0 0 0 3px rgba(214,179,90,.17),0 4px 12px #0005}.st-time-input::-webkit-calendar-picker-indicator{opacity:.85;filter:sepia(1) saturate(2) brightness(1.25);cursor:pointer}@media(max-width:600px){.st-time-input{width:98px!important;max-width:98px!important;height:34px!important;min-height:34px!important;font-size:14px!important;border-radius:9px!important}}';
    css.textContent += '.st-schedule-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:9px}.st-schedule-table{width:100%;border-collapse:separate;border-spacing:0;min-width:650px;font-size:10px;text-align:center}.st-schedule-table th{padding:7px 5px;background:var(--surface);color:var(--text-secondary);font-weight:800;white-space:nowrap;border-bottom:1px solid var(--border)}.st-schedule-table td{padding:5px 4px;border-bottom:1px solid var(--border);white-space:nowrap}.st-schedule-table tr:last-child td{border-bottom:0}.st-schedule-row.past{background:rgba(168,59,74,.07)}.st-schedule-row.live{background:rgba(250,204,21,.13);box-shadow:inset 3px 0 0 #facc15}.st-schedule-row.upcoming{background:rgba(36,116,154,.07)}.st-table-input{height:27px;max-width:100%;padding:3px 5px;border:1px solid var(--border);border-radius:6px;background:var(--surface-card);color:var(--text-primary);font:inherit;font-size:10px}.st-date-input{width:96px}.st-time-input{width:82px}.st-coach-input{width:105px}.st-session-number{font-weight:800}.st-row-delete{min-height:25px;padding:2px 6px;font-size:9px}.st-session-card{padding:6px 8px;margin:5px 0;border:1px solid var(--border);border-radius:8px;background:var(--surface)}.st-session-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:5px;color:var(--text-primary);font-size:11px}.st-session-state{padding:2px 6px;border-radius:16px;font-size:9px;font-weight:800;white-space:nowrap}.st-session-state.past{background:#4a1d24;color:#ff9aa5;border:1px solid #a83b4a}.st-session-state.live{background:#facc15;color:#17130a;border:1px solid #facc15;box-shadow:0 0 10px rgba(250,204,21,.28)}.st-session-card.live{background:rgba(250,204,21,.10);border-color:rgba(250,204,21,.75);box-shadow:inset 3px 0 0 #facc15,0 0 12px rgba(250,204,21,.10)}.st-session-state.upcoming{background:#12364b;color:#7dd3fc;border:1px solid #24749a}.st-session-state.next{background:#123d2b;color:#65e6a1;border:1px solid #24734c}.st-session-state.future{background:#12364b;color:#7dd3fc;border:1px solid #24749a}.st-session-card.next{border-color:#24734c;background:#10251d}.st-session-card.future{border-color:#24749a;background:#12202d}.st-session-fields{display:grid;grid-template-columns:minmax(110px,1fr) minmax(90px,.7fr) minmax(110px,1fr) auto;align-items:end;gap:6px}.st-session-fields label{display:flex;flex-direction:column;gap:2px;color:var(--text-secondary);font-size:9px;min-width:0}.st-session-fields input{width:100%;min-width:0;height:27px;padding:3px 6px;border:1px solid var(--border);border-radius:6px;background:var(--surface-card);color:var(--text-primary);font:inherit;font-size:10px}.st-session-fields footer{display:flex;align-items:end}.st-session-fields footer .st-btn{min-height:27px;padding:3px 8px;font-size:9px}@media(max-width:600px){.st-session-card{padding:6px}.st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.st-session-fields label{font-size:9px}.st-session-fields input{height:27px;font-size:10px}.st-session-head{font-size:10px}.st-session-fields footer{grid-column:2;justify-content:flex-end}}';
css.textContent += '@media(max-width:720px){.admin-layout{flex-direction:row!important;direction:rtl!important;align-items:stretch!important}.admin-sidebar{width:102px!important;flex:0 0 102px!important;min-width:102px!important;max-height:none!important;padding:7px 5px!important;border-left:1px solid var(--border)!important;border-bottom:0!important;gap:7px!important;overflow-y:auto!important;overflow-x:hidden!important}.admin-sidebar-brand{display:block!important;padding:6px 5px!important}.admin-sidebar-brand strong{font-size:.66rem!important}.admin-sidebar-brand small{font-size:.52rem!important}.admin-tabs{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:5px!important;justify-content:flex-start!important}.admin-tab-btn{width:100%!important;min-height:38px!important;flex:0 0 auto!important;padding:6px 5px!important;font-size:.61rem!important;line-height:1.35!important;white-space:normal!important;text-align:right!important;border-radius:7px!important}.admin-tab-btn.active{box-shadow:inset -3px 0 0 #d6b35a!important}.admin-workspace{flex:1!important;min-width:0!important;padding:8px 7px calc(14px + env(safe-area-inset-bottom))!important}}@media(max-width:390px){.admin-sidebar{width:90px!important;flex-basis:90px!important;min-width:90px!important}.admin-tab-btn{font-size:.57rem!important;padding:5px 4px!important}}';
    css.textContent += '.st-custom-select{position:relative;width:100%;min-width:0}.st-custom-select-native{position:absolute!important;inset:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}.st-custom-select-trigger{display:flex;align-items:center;justify-content:space-between;gap:7px;width:100%;min-width:0;min-height:36px;padding:7px 9px;border:1px solid rgba(214,179,90,.48);border-radius:9px;background:linear-gradient(180deg,#1b2432,#121a26);color:#f3f0e8;font:inherit;font-size:12px;text-align:right;cursor:pointer;box-shadow:inset 0 1px 0 #ffffff09}.st-custom-select-trigger .st-custom-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.st-custom-select-trigger .st-custom-arrow{flex:0 0 auto;color:#d6b35a;font-size:16px;transition:transform .15s}.st-custom-select.open .st-custom-arrow{transform:rotate(180deg)}.st-custom-select-menu{position:absolute;z-index:11000;top:calc(100% + 5px);right:0;left:0;max-height:min(42vh,260px);overflow:auto;padding:5px;border:1px solid rgba(214,179,90,.5);border-radius:10px;background:#171e2b;box-shadow:0 14px 32px #000c}.st-custom-select-menu[hidden]{display:none!important}.st-custom-option{display:block;width:100%;padding:9px 10px;border:0;border-bottom:1px solid #ffffff10;border-radius:6px;background:transparent;color:#e9e6df;font:inherit;font-size:12px;text-align:right;cursor:pointer}.st-custom-option:last-child{border-bottom:0}.st-custom-option.selected{background:rgba(214,179,90,.16);color:#f2d48b;font-weight:800}.st-custom-option:active{background:rgba(214,179,90,.24)}@media(max-width:600px){.st-custom-select-trigger{min-height:36px;padding:6px;font-size:10px}.st-custom-select-menu{max-height:35vh}.st-custom-option{padding:11px 8px;font-size:11px}}';
    css.textContent += '.st-schedule-table{font-family:Vazirmatn,Montserrat,sans-serif!important}.st-schedule-table th{background:linear-gradient(180deg,#202b3a,#172130)!important;color:#e4c879!important;font-size:11px!important;border-bottom:1px solid rgba(214,179,90,.35)!important}.st-schedule-table td{background:rgba(17,26,39,.72);color:#e9e5dc;border-bottom:1px solid rgba(214,179,90,.13)!important}.st-schedule-row.past td{background:rgba(83,36,45,.2)}.st-schedule-row.live td{background:rgba(30,88,61,.18)}.st-schedule-row.upcoming td{background:rgba(29,70,96,.2)}.st-schedule-table .st-table-input,.st-schedule-table .st-date-input,.st-schedule-table .st-time-input,.st-schedule-table .st-coach-input{box-sizing:border-box!important;min-height:36px!important;height:36px!important;padding:5px 9px!important;border:1px solid rgba(214,179,90,.48)!important;border-radius:9px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f4e9ce!important;font-family:Vazirmatn,Montserrat,sans-serif!important;font-size:12px!important;font-weight:650!important;box-shadow:inset 0 1px 2px #0007,0 2px 6px #0002;transition:border-color .18s,box-shadow .18s,background .18s}.st-schedule-table .st-date-input{width:112px!important;max-width:112px!important;direction:ltr;text-align:center;letter-spacing:.3px;font-variant-numeric:tabular-nums}.st-schedule-table .st-time-input{width:104px!important;max-width:104px!important;direction:ltr;text-align:center;font-family:Montserrat,Vazirmatn,sans-serif!important;font-size:15px!important;font-weight:800!important;letter-spacing:1px;color:#f7e7bd!important;color-scheme:dark}.st-schedule-table .st-coach-input{width:100px!important;max-width:100px!important;cursor:pointer}.st-schedule-table .st-table-input:focus{outline:none!important;border-color:#e5c36e!important;background:linear-gradient(145deg,#263448,#151f2e)!important;box-shadow:0 0 0 3px rgba(214,179,90,.16),0 4px 10px #0004}.st-schedule-table .st-date-input::placeholder{color:#9ca9b8}.st-schedule-table .st-time-input::-webkit-calendar-picker-indicator{opacity:.9;filter:sepia(1) saturate(2) brightness(1.25);cursor:pointer}.st-schedule-table .st-session-number{color:#e6c879;font-size:11px}.st-schedule-table [data-weekday]{color:#d9dce2;font-weight:700}.st-schedule-table .st-session-state{font-family:Vazirmatn,sans-serif}.st-schedule-table .st-row-delete{min-height:30px!important;border-radius:8px!important}.st-schedule-table-wrap{border:1px solid rgba(214,179,90,.3)!important;border-radius:12px!important;background:#111a27!important;box-shadow:0 5px 18px #0002;overflow-x:auto}.st-card .st-field input,.st-card .st-field select,.st-card .st-custom-select-trigger{border:1px solid rgba(214,179,90,.42)!important;border-radius:9px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f4e9ce!important;min-height:36px!important;font-family:Vazirmatn,Montserrat,sans-serif!important}.st-card .st-field input:focus{outline:none!important;border-color:#e5c36e!important;box-shadow:0 0 0 3px rgba(214,179,90,.14)!important}.st-schedule-table select option{background:#172130;color:#f4e9ce}@media(max-width:600px){.st-schedule-table .st-table-input,.st-schedule-table .st-date-input,.st-schedule-table .st-time-input,.st-schedule-table .st-coach-input{height:35px!important;min-height:35px!important;font-size:11px!important}.st-schedule-table .st-date-input{width:108px!important;max-width:108px!important}.st-schedule-table .st-time-input{width:98px!important;max-width:98px!important;font-size:14px!important}.st-schedule-table .st-coach-input{width:92px!important;max-width:92px!important}}';
css.textContent += '#stPushCard .st-reminder-row:not(.st-custom-push-row){display:grid!important;grid-template-columns:76px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;margin:10px 0!important;padding:10px 0!important;border:0!important;border-top:1px solid var(--border)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;gap:4px!important;padding:0!important;border:0!important;min-width:0}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field label{font-size:10px!important;line-height:1.4!important;white-space:normal!important;color:var(--text-secondary)!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field input{box-sizing:border-box!important;width:100%!important;height:36px!important;min-height:36px!important;padding:5px 4px!important;border:1px solid rgba(214,179,90,.5)!important;border-radius:8px!important;background:var(--surface)!important;color:var(--text-primary)!important;text-align:center!important;font-size:13px!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-box{min-width:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;margin:0 0 5px!important;font-size:10px!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-top b{font-size:10px!important;color:var(--text-primary)!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-preview{min-height:36px!important;padding:6px 8px!important;border:1px solid var(--border)!important;border-radius:7px!important;background:var(--surface)!important;font-size:10px!important;line-height:1.65!important;color:var(--text-secondary)!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-editor{min-height:64px!important;margin-top:6px!important;padding:7px 8px!important;border-radius:7px!important;font-size:11px!important}@media(max-width:420px){#stPushCard .st-reminder-row:not(.st-custom-push-row){grid-template-columns:66px minmax(0,1fr)!important;gap:6px!important;margin:8px 0!important;padding:8px 0!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-hour-field label{font-size:9px!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-template-preview{font-size:9px!important;padding:5px 7px!important}#stPushCard .st-reminder-row:not(.st-custom-push-row) .st-edit-template{min-height:27px!important;padding:4px 7px!important;font-size:9px!important}}';
    css.textContent += '#stPushCard .st-template-modal[hidden]{display:none!important}#stPushCard .st-template-modal{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:18px;box-sizing:border-box}#stPushCard .st-template-modal-backdrop{position:absolute;inset:0;background:rgba(3,8,15,.78);backdrop-filter:blur(7px)}#stPushCard .st-template-dialog{position:relative;width:min(520px,100%);padding:17px;border:1px solid rgba(214,179,90,.42);border-radius:16px;background:linear-gradient(155deg,#202b3a,#111a27 75%);box-shadow:0 24px 70px #000b;color:#f4e9ce;animation:stTemplateIn .18s ease-out}@keyframes stTemplateIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}#stPushCard .st-template-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px}#stPushCard .st-template-dialog-head div{display:flex;flex-direction:column;gap:4px}#stPushCard .st-template-dialog-head small{font:700 9px Montserrat,sans-serif;letter-spacing:1.2px;color:#d6b35a}#stPushCard .st-template-dialog-head b{font-size:14px;color:#f4e9ce}#stPushCard .st-template-close{width:30px;height:30px;border:1px solid #ffffff24;border-radius:8px;background:#ffffff0b;color:#f4e9ce;font-size:21px;cursor:pointer}#stPushCard .st-template-hint{margin:12px 0 8px;color:#aeb8c5;font-size:10px;line-height:1.9}#stPushCard #stTemplateModalText{box-sizing:border-box;width:100%;min-height:150px;padding:12px;border:1px solid rgba(214,179,90,.45);border-radius:10px;outline:none;resize:vertical;background:#0d1521;color:#f5ead0;font:12px/2 Vazirmatn,sans-serif}#stPushCard #stTemplateModalText:focus{border-color:#e5c36e;box-shadow:0 0 0 3px rgba(214,179,90,.13)}#stPushCard .st-template-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}#stPushCard .st-template-dialog-actions .st-btn{min-width:82px;min-height:34px}@media(max-width:420px){#stPushCard .st-template-dialog{padding:13px;border-radius:13px}#stPushCard .st-template-dialog-head b{font-size:12px}#stPushCard #stTemplateModalText{min-height:135px;font-size:11px}}';
    document.head.appendChild(css);
    const reminderLayoutStyle=document.createElement('style');
    reminderLayoutStyle.id='stReminderThreeRowLayout';
    reminderLayoutStyle.textContent='#stPushCard .st-reminder-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:5px;margin:8px 0 10px;padding:9px;border:1px solid rgba(214,179,90,.25);border-radius:11px;background:linear-gradient(135deg,rgba(214,179,90,.06),rgba(255,255,255,.012)),var(--surface)}#stPushCard .st-reminder-label-row,#stPushCard .st-reminder-input-row,#stPushCard .st-reminder-action-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#stPushCard .st-reminder-label-row label{display:block;min-width:0;margin:0;color:var(--text-primary);font-size:10px;font-weight:800;line-height:1.5}#stPushCard .st-reminder-input-row input{box-sizing:border-box;width:100%;min-width:0;height:32px;min-height:32px;padding:4px 8px;border:1px solid rgba(214,179,90,.5);border-radius:7px;background:var(--surface-card);color:var(--text-primary);font:700 13px Vazirmatn,sans-serif;text-align:center;direction:ltr}#stPushCard .st-reminder-action-row{margin-top:1px}#stPushCard .st-reminder-action-row .st-btn{box-sizing:border-box;width:100%;min-width:0;min-height:28px;height:28px;padding:3px 6px!important;border-radius:7px;font-size:9px!important;white-space:nowrap}#stPushCard .st-reminder-save-row{display:flex;justify-content:flex-end;margin-top:2px}#stPushCard .st-reminder-save-row .st-btn{width:auto;min-width:118px;min-height:29px;height:29px;padding:3px 12px!important;border-radius:7px;font-size:9px!important;font-weight:800;white-space:nowrap}#stPushCard .st-reminder-hidden{display:none!important}@media(max-width:380px){#stPushCard .st-reminder-layout{padding:7px;gap:5px}#stPushCard .st-reminder-label-row,#stPushCard .st-reminder-input-row,#stPushCard .st-reminder-action-row{gap:6px}#stPushCard .st-reminder-action-row .st-btn{font-size:8px!important;padding:3px 4px!important}#stPushCard .st-reminder-save-row .st-btn{min-width:108px}}#stPushCard .st-reminder-layout{padding:6px!important;gap:4px!important;margin:6px 0 8px!important}#stPushCard .st-reminder-label-row label{font-size:9px!important;line-height:1.35!important}#stPushCard .st-reminder-input-row input{height:25px!important;min-height:25px!important;padding:2px 6px!important;font-size:11px!important;line-height:1!important;border-radius:6px!important}@media(max-width:380px){#stPushCard .st-reminder-layout{padding:5px!important;gap:4px!important}#stPushCard .st-reminder-label-row label{font-size:8.5px!important}#stPushCard .st-reminder-input-row input{height:24px!important;min-height:24px!important;font-size:10px!important}}';
    document.head.appendChild(reminderLayoutStyle);

    css.textContent += ".st-mode-switch{display:flex;gap:5px;flex-wrap:wrap;margin:4px 0 8px}.st-mode-btn{min-height:30px;padding:5px 13px;border:1px solid rgba(214,179,90,.38);border-radius:7px;background:var(--surface);color:var(--text-secondary);font:inherit;font-size:11px;cursor:pointer}.st-mode-btn.active{background:rgba(214,179,90,.2);border-color:#d6b35a;color:#f0d58e}.st-mode-panel{padding-top:5px}.st-manual-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.st-weekly-top{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin:4px 0 8px}.st-compact-field{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text-secondary);white-space:nowrap}.st-compact-field input{width:92px;height:29px;padding:3px 6px;font-size:11px}.st-pattern-switch{display:flex;gap:4px}.st-pattern-tab{min-height:29px;padding:4px 10px;border:1px solid rgba(214,179,90,.38);border-radius:7px;background:var(--surface);color:var(--text-secondary);font:inherit;font-size:10px;cursor:pointer}.st-pattern-tab.active{background:rgba(214,179,90,.2);border-color:#d6b35a;color:#f0d58e}.st-day-panel{margin:5px 0 8px}.st-day-picks{gap:4px}.st-day-chip{gap:3px!important;padding:4px 6px!important;border-radius:6px!important;font-size:10px!important}.st-day-chip input{width:12px!important;height:12px!important;margin:0!important}#studentTermsTab #stManual .st-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#studentTermsTab #stManual .st-field{margin:0}#studentTermsTab #stManual .st-field label{font-size:10px}#studentTermsTab #stManual input{height:29px;padding:4px 6px;font-size:11px}#studentTermsTab .st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}#studentTermsTab .st-session-fields label{font-size:10px}#studentTermsTab .st-session-fields input{height:29px;padding:4px 6px;font-size:11px}@media(max-width:600px){#studentTermsTab #stManual .st-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}";
    css.textContent += '.st-sessions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;width:100%;direction:rtl}.st-session-card{box-sizing:border-box;min-width:0;padding:10px!important;margin:0!important;border:1px solid rgba(214,179,90,.28)!important;border-radius:11px!important;background:linear-gradient(145deg,#192434,#101824)!important;box-shadow:0 4px 12px #0002}.st-session-card.past{border-color:rgba(168,59,74,.45)!important}.st-session-card.live{border-color:rgba(36,115,76,.55)!important}.st-session-head{display:flex;align-items:center;gap:7px;min-width:0;margin-bottom:9px!important}.st-session-head strong{color:#e8cb7c;font-size:12px;white-space:nowrap}.st-session-head .st-session-state{margin-right:auto;font-size:9px}.st-session-head .st-row-delete{flex:0 0 auto;min-height:26px!important;padding:3px 8px!important;font-size:10px!important}.st-session-fields{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:end;gap:7px!important}.st-session-fields label{display:flex!important;flex-direction:column!important;gap:4px!important;min-width:0!important;color:#c6b98f!important;font-family:Vazirmatn,sans-serif!important;font-size:10px!important;white-space:nowrap}.st-session-fields input,.st-session-fields select{box-sizing:border-box!important;display:block;width:100%!important;min-width:0!important;max-width:100%!important;height:36px!important;min-height:36px!important;padding:5px 6px!important;border:1px solid rgba(214,179,90,.45)!important;border-radius:8px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f4e9ce!important;font-family:Vazirmatn,Montserrat,sans-serif!important;font-size:11px!important;font-weight:650!important}.st-session-fields .st-date-input{direction:ltr;text-align:center;font-variant-numeric:tabular-nums}.st-session-fields .st-time-input{direction:ltr;text-align:center;font-family:Montserrat,Vazirmatn,sans-serif!important;font-size:14px!important;font-weight:800!important;letter-spacing:.5px;color-scheme:dark}.st-session-fields select{cursor:pointer}.st-session-fields input:focus,.st-session-fields select:focus{outline:none!important;border-color:#e5c36e!important;box-shadow:0 0 0 3px rgba(214,179,90,.14)!important}@media(max-width:850px){.st-sessions-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-session-card{padding:8px!important}.st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}.st-session-fields label{font-size:9px!important}.st-session-fields input,.st-session-fields select{height:34px!important;min-height:34px!important;font-size:10px!important}.st-session-fields .st-time-input{font-size:13px!important}}@media(max-width:360px){.st-sessions-grid{grid-template-columns:minmax(0,1fr)}.st-session-fields{grid-template-columns:repeat(3,minmax(0,1fr))!important}.st-session-fields label{font-size:9px!important}}';
    const sessionLayoutCss=document.createElement('style');sessionLayoutCss.id='stSessionCardsCss';sessionLayoutCss.textContent=css.textContent.slice(css.textContent.lastIndexOf('.st-sessions-grid'));
    document.head.appendChild(sessionLayoutCss);
    const compactSessionsCss=document.createElement('style');compactSessionsCss.id='stCompactSessionsCss';compactSessionsCss.textContent="\n/* Compact schedule session cards: eliminate oversized desktop/mobile cards */\n#studentTermsTab .st-sessions-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;align-items:start!important}\n#studentTermsTab .st-session-card{min-width:0!important;padding:7px 9px!important;margin:0!important;border-radius:9px!important;box-shadow:none!important}\n#studentTermsTab .st-session-head{display:grid!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;gap:6px!important;margin:0 0 6px!important;font-size:10px!important}\n#studentTermsTab .st-session-head strong{font-size:11px!important;white-space:nowrap}\n#studentTermsTab .st-session-state{justify-self:start!important;font-size:8px!important;padding:2px 5px!important}\n#studentTermsTab .st-row-delete{min-height:24px!important;height:24px!important;padding:2px 6px!important;font-size:9px!important}\n#studentTermsTab .st-session-fields{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr) minmax(0,1fr)!important;gap:5px!important;align-items:end!important}\n#studentTermsTab .st-session-fields label{min-width:0!important;font-size:9px!important;line-height:1.4!important;gap:3px!important}\n#studentTermsTab .st-session-fields input,\n#studentTermsTab .st-session-fields select,\n#studentTermsTab .st-session-fields .st-custom-select-trigger{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:30px!important;min-height:30px!important;padding:4px 6px!important;font-size:10px!important;border-radius:6px!important}\n#studentTermsTab .st-session-fields .st-time-input{font-size:12px!important;letter-spacing:0!important}\n#studentTermsTab .st-session-fields .st-custom-select-trigger{font-size:10px!important;min-height:30px!important}\n#studentTermsTab .st-session-fields .st-custom-select-menu{top:calc(100% + 4px)!important;bottom:auto!important;max-height:190px!important;z-index:2147483000!important}\n#studentTermsTab .st-session-fields .st-custom-select{min-width:0!important;width:100%!important}\n#studentTermsTab .st-session-fields .st-custom-select-value{min-width:0}\n@media(max-width:720px){\n #studentTermsTab .st-sessions-grid{grid-template-columns:minmax(0,1fr)!important;gap:6px!important}\n #studentTermsTab .st-session-card{padding:7px 8px!important}\n #studentTermsTab .st-session-head{grid-template-columns:auto 1fr auto!important;margin-bottom:5px!important}\n #studentTermsTab .st-session-fields{grid-template-columns:minmax(0,1.15fr) minmax(0,.75fr) minmax(0,1fr)!important;gap:5px!important}\n #studentTermsTab .st-session-fields label{font-size:9px!important}\n #studentTermsTab .st-session-fields input,\n #studentTermsTab .st-session-fields select,\n #studentTermsTab .st-session-fields .st-custom-select-trigger{height:31px!important;min-height:31px!important;font-size:10px!important;padding:4px 5px!important}\n}\n@media(max-width:380px){\n #studentTermsTab .st-session-fields{grid-template-columns:minmax(0,1fr) minmax(0,.72fr) minmax(0,1fr)!important;gap:4px!important}\n #studentTermsTab .st-session-fields label{font-size:8px!important}\n #studentTermsTab .st-session-fields input,\n #studentTermsTab .st-session-fields .st-custom-select-trigger{font-size:9px!important;padding:3px!important}\n}\n";
    document.head.appendChild(compactSessionsCss);
    const compactSessionsCssExtra=document.createElement('style');compactSessionsCssExtra.id='stCompactSessionsCssExtra';compactSessionsCssExtra.textContent="\n/* Compact session editor: avoid oversized cards and keep fields aligned */\n.st-sessions-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;align-items:stretch!important}\n.st-session-card{min-width:0!important;padding:7px 8px!important;margin:0!important;border-radius:8px!important;box-shadow:none!important}\n.st-session-head{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:5px!important;margin-bottom:6px!important;align-items:center!important}\n.st-session-head strong{font-size:10px!important}\n.st-session-head .st-session-state{margin:0!important;justify-self:start!important;font-size:8px!important;padding:2px 5px!important}\n.st-session-head .st-row-delete{min-height:23px!important;padding:2px 6px!important;font-size:9px!important}\n.st-session-fields{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;align-items:end!important}\n.st-session-fields label{min-width:0!important;font-size:9px!important;white-space:normal!important;line-height:1.35!important}\n.st-session-fields input,.st-session-fields select{width:100%!important;min-width:0!important;max-width:100%!important;height:30px!important;min-height:30px!important;padding:3px 5px!important;border-radius:6px!important;font-size:10px!important}\n.st-session-fields .st-date-input{width:100%!important;max-width:100%!important;font-size:10px!important}\n.st-session-fields .st-time-input{width:100%!important;max-width:100%!important;font-size:12px!important;letter-spacing:0!important}\n@media(min-width:1000px){.st-sessions-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}\n@media(max-width:720px){\n .st-sessions-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}\n .st-session-card{padding:6px!important}\n .st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}\n .st-session-fields input,.st-session-fields select{height:29px!important;min-height:29px!important;font-size:10px!important}\n}\n@media(max-width:390px){\n .st-sessions-grid{grid-template-columns:minmax(0,1fr)!important}\n .st-session-fields{grid-template-columns:repeat(3,minmax(0,1fr))!important}\n .st-session-fields label{font-size:9px!important}\n}\n#studentTermsTab .st-table-wrap{width:100%;overflow-x:auto}\n#studentTermsTab .st-table{min-width:0!important;width:100%!important;table-layout:fixed!important;font-size:10px!important}\n#studentTermsTab .st-table th,#studentTermsTab .st-table td{padding:5px 4px!important;white-space:normal!important;overflow-wrap:anywhere}\n#studentTermsTab .st-table select,#studentTermsTab .st-table input{width:100%!important;max-width:100%!important;min-width:0!important;padding:4px!important;font-size:10px!important}\n@media(max-width:600px){#studentTermsTab .st-table{font-size:9px!important}#studentTermsTab .st-table th,#studentTermsTab .st-table td{padding:4px 2px!important}}\n";
    document.head.appendChild(compactSessionsCssExtra);

    const adminSessionPolish=document.createElement('style');adminSessionPolish.id='stAdminSessionPolish';adminSessionPolish.textContent=`
      /* Live class: yellow/gold in both editable cards and published schedule rows */
      #studentTermsTab .st-session-card.live{border:1px solid #d6a72d!important;background:linear-gradient(145deg,#493812,#241d10)!important;box-shadow:inset 3px 0 0 #facc15!important}
      #studentTermsTab .st-session-card.live .st-session-state.live{background:#8a641b!important;color:#fff1a6!important;border:1px solid #d6a72d!important}
      #studentTermsTab .st-schedule-row.live td{background:rgba(161,98,7,.24)!important;color:#fff1a6!important}
      #studentTermsTab .st-schedule-row.live .st-session-state.live{background:#8a641b!important;color:#fff1a6!important;border-color:#d6a72d!important}
      /* One consistent, readable card system; prevent conflicting older grid overrides */
      #studentTermsTab .st-sessions-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}
      #studentTermsTab .st-session-card{min-width:0!important;padding:9px!important;border-radius:9px!important;box-shadow:none!important}
      #studentTermsTab .st-session-head{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:7px!important;margin:0 0 8px!important}
      #studentTermsTab .st-session-head strong{font-size:11px!important;white-space:nowrap!important}
      #studentTermsTab .st-session-head .st-session-state{justify-self:start!important;margin:0!important;font-size:9px!important;line-height:1.5!important}
      #studentTermsTab .st-session-head .st-row-delete{min-height:26px!important;height:26px!important;padding:3px 7px!important;font-size:9px!important}
      #studentTermsTab .st-session-fields{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;align-items:end!important}
      #studentTermsTab .st-session-fields label{display:flex!important;flex-direction:column!important;gap:4px!important;min-width:0!important;white-space:normal!important;line-height:1.5!important;font-size:10px!important;color:#c9c2b1!important}
      #studentTermsTab .st-session-fields input,#studentTermsTab .st-session-fields select,#studentTermsTab .st-session-fields .st-custom-select-trigger{width:100%!important;min-width:0!important;max-width:100%!important;height:34px!important;min-height:34px!important;padding:5px 7px!important;border-radius:7px!important;font-size:11px!important}
      #studentTermsTab .st-session-fields .st-time-input{font-size:13px!important;letter-spacing:0!important}
      @media(max-width:720px){
        #studentTermsTab .st-sessions-grid{grid-template-columns:minmax(0,1fr)!important;gap:7px!important}
        #studentTermsTab .st-session-card{padding:8px!important}
        #studentTermsTab .st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
        #studentTermsTab .st-session-fields label:first-child{grid-column:1/-1!important}
        #studentTermsTab .st-session-fields label{font-size:10px!important}
        #studentTermsTab .st-session-fields input,#studentTermsTab .st-session-fields select,#studentTermsTab .st-session-fields .st-custom-select-trigger{height:33px!important;min-height:33px!important;font-size:11px!important}
      }
      @media(max-width:360px){
        #studentTermsTab .st-session-head{gap:5px!important}
        #studentTermsTab .st-session-head strong{font-size:10px!important}
        #studentTermsTab .st-session-fields{gap:5px!important}
      }
      /* Subtle live indicator: animate only the status dot, never the full row/card */
      #studentTermsTab .st-session-state.live{display:inline-flex!important;align-items:center!important;gap:6px!important}
      #studentTermsTab .st-session-state.live::before{content:"";display:inline-block;width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:#fde047;box-shadow:0 0 0 0 rgba(253,224,71,.65);animation:gym20LivePulse 1.25s ease-in-out infinite}
      @keyframes gym20LivePulse{0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 0 0 rgba(253,224,71,.55)}50%{opacity:.42;transform:scale(.78);box-shadow:0 0 0 4px rgba(253,224,71,0)}}
      @media(prefers-reduced-motion:reduce){#studentTermsTab .st-session-state.live::before{animation:none;opacity:1;box-shadow:none}}`;
    document.head.appendChild(adminSessionPolish);


    const finalSessionLayoutCss=document.createElement('style');finalSessionLayoutCss.id='stFinalSessionLayoutCss';finalSessionLayoutCss.textContent=`
      #studentTermsTab .st-sessions-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:7px!important;width:100%!important;align-items:stretch!important}
      #studentTermsTab .st-session-card{display:block!important;min-width:0!important;width:100%!important;padding:8px 10px!important;margin:0!important;border:1px solid #344052!important;border-radius:9px!important;background:#151e2b!important;box-shadow:none!important}
      #studentTermsTab .st-session-card.live{border-color:#c99b27!important;background:linear-gradient(100deg,#3a2d12,#1c2025)!important;box-shadow:inset 3px 0 0 #facc15!important}
      #studentTermsTab .st-session-head{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;margin:0 0 7px!important;min-width:0!important}
      #studentTermsTab .st-session-head strong{font-size:11px!important;line-height:1.6!important;color:#f0d48a!important;white-space:nowrap!important}
      #studentTermsTab .st-session-state{justify-self:start!important;min-width:0!important;margin:0!important;padding:2px 7px!important;border-radius:20px!important;font-size:9px!important;line-height:1.6!important;white-space:nowrap!important;background:#263448!important;color:#cbd5e1!important}
      #studentTermsTab .st-session-state.live{background:#8a6415!important;color:#fff1b8!important;font-weight:800!important}
      #studentTermsTab .st-row-delete{justify-self:end!important;min-height:25px!important;height:25px!important;padding:2px 8px!important;font-size:9px!important;line-height:1.3!important}
      #studentTermsTab .st-session-fields{display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(110px,.8fr) minmax(120px,1fr)!important;gap:8px!important;align-items:end!important;width:100%!important}
      #studentTermsTab .st-session-fields label{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;gap:4px!important;min-width:0!important;margin:0!important;color:#aeb9c8!important;font-size:9px!important;line-height:1.5!important;white-space:normal!important}
      #studentTermsTab .st-session-fields input,#studentTermsTab .st-session-fields select,#studentTermsTab .st-session-fields .st-custom-select-trigger{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:32px!important;min-height:32px!important;margin:0!important;padding:4px 7px!important;border:1px solid #39475b!important;border-radius:7px!important;background:#101824!important;color:#f1f5f9!important;font:600 10px Vazirmatn,sans-serif!important}
      #studentTermsTab .st-session-fields .st-time-input{direction:ltr!important;text-align:center!important;font:700 12px Montserrat,Vazirmatn,sans-serif!important;letter-spacing:0!important}
      #studentTermsTab .st-session-fields .st-custom-select{width:100%!important;min-width:0!important}
      #studentTermsTab .st-session-fields .st-custom-select-value{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #studentTermsTab .st-session-fields .st-custom-select-menu{z-index:2147483000!important;max-height:190px!important}
      @media(max-width:600px){
        #studentTermsTab .st-session-card{padding:7px 8px!important}
        #studentTermsTab .st-session-fields{grid-template-columns:minmax(0,1.1fr) minmax(82px,.8fr) minmax(90px,1fr)!important;gap:6px!important}
        #studentTermsTab .st-session-fields label{font-size:8.5px!important}
        #studentTermsTab .st-session-fields input,#studentTermsTab .st-session-fields select,#studentTermsTab .st-session-fields .st-custom-select-trigger{height:31px!important;min-height:31px!important;padding:4px 5px!important;font-size:9px!important}
        #studentTermsTab .st-session-fields .st-time-input{font-size:11px!important}
      }
      @media(max-width:360px){
        #studentTermsTab .st-session-head{gap:5px!important}
        #studentTermsTab .st-session-head strong{font-size:10px!important}
        #studentTermsTab .st-session-state{font-size:8px!important;padding:2px 5px!important}
        #studentTermsTab .st-session-fields{grid-template-columns:minmax(0,1fr) minmax(0,.85fr) minmax(0,1fr)!important;gap:4px!important}
        #studentTermsTab .st-session-fields label{font-size:8px!important}
      }`;
    document.head.appendChild(finalSessionLayoutCss);
    const sessionPolishFinal=document.createElement('style');sessionPolishFinal.id='stSessionPolishFinal';sessionPolishFinal.textContent="#studentTermsTab .st-session-head{display:flex!important;align-items:center!important;gap:8px!important}#studentTermsTab .st-session-head strong{font-size:10px!important}#studentTermsTab .st-session-head .st-session-state{margin:0 auto 0 0!important;font-size:9px!important}#studentTermsTab .st-session-head .st-row-delete{height:23px!important;min-height:23px!important;padding:2px 7px!important;font-size:9px!important}#studentTermsTab .st-session-fields-modern{display:grid!important;grid-template-columns:30px minmax(55px,.7fr) minmax(88px,1.1fr) minmax(76px,.9fr) minmax(78px,.9fr)!important;gap:5px!important;align-items:end!important}#studentTermsTab .st-session-fields-modern .st-session-field{display:flex!important;flex-direction:column!important;gap:3px!important;min-width:0!important;font-size:8px!important;white-space:nowrap!important}#studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{height:29px!important;min-height:29px!important;padding:3px 5px!important;font-size:9px!important;border-radius:6px!important}#studentTermsTab .st-session-fields-modern .st-time-input{font-size:11px!important;letter-spacing:0!important}#studentTermsTab .st-session-calendar{width:30px!important;height:29px!important;min-height:29px!important;align-self:end!important;padding:0!important;border:1px solid rgba(214,179,90,.55)!important;border-radius:6px!important;background:linear-gradient(145deg,#263448,#151f2e)!important;color:#e8cb7c!important;font-size:15px!important;cursor:pointer!important}#studentTermsTab .st-session-weekday{height:29px!important;align-self:end!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;padding:0 4px!important;box-sizing:border-box!important;border:1px solid rgba(214,179,90,.3)!important;border-radius:6px!important;background:rgba(214,179,90,.09)!important;color:#e8cb7c!important;font-size:9px!important;white-space:nowrap!important}#stPushCard .st-push-heading{font-size:9px!important;margin-bottom:6px!important}#stPushCard .st-reminder-layout{padding:7px!important;gap:4px!important;margin:5px 0 7px!important}#stPushCard .st-reminder-label-row label{font-size:9px!important}#stPushCard .st-reminder-input-row input{height:28px!important;min-height:28px!important;font-size:9px!important;padding:3px 6px!important}#stPushCard .st-reminder-action-row .st-btn{height:25px!important;min-height:25px!important;font-size:9px!important;padding:2px 5px!important}#stPushCard .st-reminder-save-row .st-btn{height:26px!important;min-height:26px!important;font-size:9px!important;padding:2px 9px!important}@media(max-width:720px){#studentTermsTab .st-session-fields-modern{grid-template-columns:27px minmax(48px,.65fr) minmax(76px,1.1fr) minmax(66px,.9fr) minmax(68px,.9fr)!important;gap:4px!important}#studentTermsTab .st-session-calendar{width:27px!important;height:28px!important;min-height:28px!important;font-size:13px!important}#studentTermsTab .st-session-weekday{height:28px!important;font-size:8px!important}#studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{height:28px!important;min-height:28px!important;font-size:8px!important;padding:2px 3px!important}#studentTermsTab .st-session-fields-modern .st-time-input{font-size:10px!important}}@media(max-width:390px){#studentTermsTab .st-session-fields-modern{grid-template-columns:24px minmax(42px,.6fr) minmax(68px,1.05fr) minmax(58px,.85fr) minmax(60px,.85fr)!important;gap:3px!important}#studentTermsTab .st-session-calendar{width:24px!important}#studentTermsTab .st-session-weekday{font-size:7px!important}#studentTermsTab .st-session-fields-modern .st-session-field{font-size:7px!important}#studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{font-size:8px!important;padding:2px!important}}";
    document.head.appendChild(sessionPolishFinal);
    const sessionHeaderRowFinal=document.createElement('style');sessionHeaderRowFinal.id='stSessionHeaderRowFinal';sessionHeaderRowFinal.textContent=`
      #studentTermsTab .st-session-card{padding:8px 10px!important;border-radius:10px!important}
      #studentTermsTab .st-session-head{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;min-height:30px!important;margin:0 0 8px!important;direction:rtl!important}
      #studentTermsTab .st-session-head .st-session-calendar{order:0!important;flex:0 0 28px!important;width:28px!important;height:28px!important;min-height:28px!important;align-self:center!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(214,179,90,.6)!important;border-radius:7px!important;background:linear-gradient(145deg,#29394e,#121c2a)!important;color:#f0d48a!important;font-size:14px!important;box-shadow:0 2px 7px #0004!important}
      #studentTermsTab .st-session-head strong{order:1!important;flex:0 0 auto!important;font-size:10px!important;color:#f0d48a!important}
      #studentTermsTab .st-session-head .st-session-state{order:2!important;margin:0!important;font-size:8px!important;padding:2px 7px!important}
      #studentTermsTab .st-session-head .st-row-delete{order:3!important;margin-right:auto!important;flex:0 0 auto!important;height:24px!important;min-height:24px!important;padding:2px 9px!important;border-radius:6px!important;font-size:9px!important}
      #studentTermsTab .st-session-fields-modern{display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr) minmax(0,1fr) minmax(0,1fr)!important;gap:6px!important;align-items:end!important;width:100%!important}
      #studentTermsTab .st-session-fields-modern .st-session-weekday{height:30px!important;min-height:30px!important;font-size:9px!important}
      #studentTermsTab .st-session-fields-modern .st-session-field{min-width:0!important;font-size:8px!important;gap:3px!important}
      #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{width:100%!important;height:30px!important;min-height:30px!important;box-sizing:border-box!important;font-size:9px!important;padding:3px 5px!important;border-radius:7px!important}
      #studentTermsTab .st-session-fields-modern .st-time-input{font-size:11px!important}
      @media(max-width:600px){
        #studentTermsTab .st-session-card{padding:7px 8px!important}
        #studentTermsTab .st-session-head{gap:6px!important;margin-bottom:6px!important}
        #studentTermsTab .st-session-head .st-session-calendar{flex-basis:26px!important;width:26px!important;height:26px!important;min-height:26px!important}
        #studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.85fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)!important;gap:4px!important}
        #studentTermsTab .st-session-fields-modern .st-session-weekday{height:28px!important;min-height:28px!important;font-size:8px!important}
        #studentTermsTab .st-session-fields-modern .st-session-field{font-size:7.5px!important}
        #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{height:28px!important;min-height:28px!important;font-size:8px!important;padding:2px 3px!important}
        #studentTermsTab .st-session-fields-modern .st-time-input{font-size:10px!important}
      }
      @media(max-width:360px){
        #studentTermsTab .st-session-head{gap:5px!important}
        #studentTermsTab .st-session-head .st-session-state{font-size:7px!important;padding:2px 5px!important}
        #studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.8fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)!important;gap:3px!important}
        #studentTermsTab .st-session-fields-modern .st-session-field{font-size:7px!important}
        #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{font-size:7.5px!important;padding:2px!important}
      }`;
    document.head.appendChild(sessionHeaderRowFinal);
    const sessionHeaderCalendarLayout=document.createElement('style');sessionHeaderCalendarLayout.id='stSessionHeaderCalendarLayout';sessionHeaderCalendarLayout.textContent="#studentTermsTab .st-session-head{display:grid!important;grid-template-columns:29px auto minmax(0,1fr) auto!important;align-items:center!important;gap:7px!important;margin:0 0 7px!important}#studentTermsTab .st-session-head .st-session-calendar{grid-column:1;grid-row:1;align-self:center!important;width:27px!important;height:25px!important;min-height:25px!important;font-size:13px!important}#studentTermsTab .st-session-head strong{grid-column:2;grid-row:1;font-size:10px!important}#studentTermsTab .st-session-head .st-session-state{grid-column:3;grid-row:1;justify-self:start!important;margin:0!important}#studentTermsTab .st-session-head .st-row-delete{grid-column:4;grid-row:1;justify-self:end!important}#studentTermsTab .st-session-fields-modern{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;align-items:end!important}#studentTermsTab .st-session-fields-modern .st-session-weekday{height:29px!important;align-self:end!important}#studentTermsTab .st-session-fields-modern .st-session-field{min-width:0!important}#studentTermsTab .st-session-fields-modern .st-session-field input,#studentTermsTab .st-session-fields-modern .st-session-field select,#studentTermsTab .st-session-fields-modern .st-session-field .st-custom-select-trigger{width:100%!important;min-width:0!important;height:29px!important;min-height:29px!important;padding:3px 4px!important;font-size:9px!important}#studentTermsTab .st-session-fields-modern .st-time-input{font-size:10px!important}@media(max-width:600px){#studentTermsTab .st-session-head{grid-template-columns:27px auto minmax(0,1fr) auto!important;gap:5px!important}#studentTermsTab .st-session-fields-modern{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important}#studentTermsTab .st-session-fields-modern .st-session-field{font-size:8px!important}#studentTermsTab .st-session-fields-modern .st-session-field input,#studentTermsTab .st-session-fields-modern .st-session-field select,#studentTermsTab .st-session-fields-modern .st-session-field .st-custom-select-trigger{height:28px!important;min-height:28px!important;font-size:8px!important;padding:2px 3px!important}#studentTermsTab .st-session-fields-modern .st-session-weekday{height:28px!important;font-size:8px!important}}@media(max-width:360px){#studentTermsTab .st-session-fields-modern{gap:3px!important}#studentTermsTab .st-session-fields-modern .st-session-field{font-size:7px!important}#studentTermsTab .st-session-fields-modern .st-session-field input,#studentTermsTab .st-session-fields-modern .st-session-field select,#studentTermsTab .st-session-fields-modern .st-session-field .st-custom-select-trigger{font-size:7.5px!important;padding:2px!important}}";
    document.head.appendChild(sessionHeaderCalendarLayout);
    const sessionTimePickerCss=document.createElement('style');sessionTimePickerCss.id='stSessionTimePickerCss';sessionTimePickerCss.textContent=`
      .st-time-picker-backdrop{position:fixed;inset:0;z-index:25000;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(2,5,10,.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:stClockFade .2s ease-out}
      .st-time-picker{width:min(270px,calc(100% - 24px));overflow:hidden;border:1px solid #d8b65a35;border-radius:16px;background:radial-gradient(ellipse at 50% 0%,#26303b 0%,#151b23 55%,#10151c 100%);color:#edf0f4;box-shadow:0 24px 70px #000b,0 0 34px #d8b65a12;font-family:Vazirmatn,Montserrat,sans-serif;animation:stClockIn .24s cubic-bezier(.2,.85,.25,1)}
      .st-time-picker>header{height:35px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid #ffffff0c;color:#e9edf2;font-size:10px;font-weight:800}
      .st-time-picker>header span:before{content:'◷';margin-left:8px;color:#e4bd62;font-size:16px;vertical-align:middle}
      .st-time-picker-close{width:24px;height:24px;border:1px solid #ffffff18;border-radius:50%;background:#ffffff08;color:#c4cbd4;font-size:17px;line-height:1}
      .st-time-picker-preview{display:flex;align-items:center;justify-content:center;gap:9px;padding:7px 8px 3px}
      .st-time-picker-preview small{color:#8290a0;font:700 8px Montserrat,sans-serif;letter-spacing:1.4px}
      .st-time-picker-preview strong{color:#f0cf7a;font:650 21px/1 Montserrat,Arial,sans-serif;letter-spacing:1px;font-variant-numeric:tabular-nums;text-shadow:0 0 18px #e7bd6238}
      .st-time-picker-controls{display:grid;grid-template-columns:repeat(2,minmax(0,104px));justify-content:center;gap:5px;padding:4px 6px 8px;margin-inline:auto}
      .st-time-slider{min-width:0;width:100%;display:flex;flex-direction:column;align-items:center;padding:0}
      .st-time-slider-head{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:5px}
      .st-time-slider-head label{color:#8290a0;font:700 8px Montserrat,sans-serif;letter-spacing:1.5px}
      .st-time-slider-value{color:#e9c875;font:700 11px Montserrat,Arial,sans-serif;font-variant-numeric:tabular-nums}
      .st-time-wheel{position:relative;width:88%;height:132px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;scroll-snap-type:y proximity;scroll-behavior:auto;border:1px solid #ffffff0b;border-radius:13px;background:linear-gradient(180deg,#0c121a,#111923 48%,#0c121a);touch-action:pan-y;mask-image:linear-gradient(180deg,transparent 0%,#000 17%,#000 83%,transparent 100%)}
      .st-time-wheel::-webkit-scrollbar{display:none}
      .st-time-wheel-spacer{height:52px;pointer-events:none}
      .st-time-wheel-item{height:26px;display:flex;align-items:center;justify-content:center;scroll-snap-align:start;color:#657181;font:500 12px Montserrat,Arial,sans-serif;font-variant-numeric:tabular-nums;transition:color .24s,font-size .24s,text-shadow .24s,opacity .24s,filter .24s;user-select:none}
      .st-time-wheel-item.selected{color:#f3d27f;font-size:16px;font-weight:750;text-shadow:0 0 14px #e8bf6340}
      .st-time-wheel-indicator{position:absolute;left:7px;right:7px;top:52px;height:26px;border-top:1px solid #d9bd78aa;border-bottom:1px solid #e8c66a55;border-radius:7px;background:linear-gradient(90deg,#e8c66a08,#e8c66a16,#e8c66a08);pointer-events:none}
      .st-time-wheel-caption{margin-top:0;color:#758293;font-size:8px}
      .st-time-picker>footer{display:grid;grid-template-columns:.8fr 1.2fr;gap:7px;padding:8px 12px calc(9px + env(safe-area-inset-bottom));border-top:1px solid #ffffff0d}
      .st-time-picker>footer button{min-height:32px;border:1px solid #ffffff18;border-radius:9px;background:#ffffff07;color:#b5c0cc;font:700 9px Vazirmatn,sans-serif;transition:transform .16s,background .16s}
      .st-time-picker>footer .st-time-picker-apply{border:1px solid #e8c66a;background:linear-gradient(135deg,#f1d58e,#c99b43);color:#171b21;font-weight:900;box-shadow:0 4px 15px #d9ad5630}
      .st-time-picker>footer button:active{transform:scale(.97)}
      @keyframes stClockFade{from{opacity:0}to{opacity:1}}@keyframes stClockIn{from{opacity:0;transform:translateY(9px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:480px){.st-time-picker-backdrop{align-items:center!important;justify-content:center!important;padding:12px!important}.st-time-picker{width:min(320px,calc(100% - 24px));max-width:320px;max-height:calc(100dvh - 24px);overflow-y:auto;border-radius:16px;animation:stClockIn .24s cubic-bezier(.2,.85,.25,1)}.st-time-picker-controls{padding:4px 8px 8px;gap:7px}.st-time-wheel{height:132px}.st-time-wheel-spacer{height:52px}.st-time-wheel-indicator{top:52px}.st-time-wheel-item{height:26px}.st-time-picker-preview{padding-top:7px}}
      .st-coach-swipe{position:relative;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;height:31px!important;min-height:31px!important;padding:3px 6px!important;border:1px solid rgba(214,179,90,.35)!important;border-radius:7px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f4e9ce!important;cursor:grab!important;touch-action:pan-y!important;user-select:none!important;-webkit-user-select:none!important;white-space:nowrap!important;transition:background .22s,border-color .22s,box-shadow .22s,transform .22s!important}.st-coach-swipe-name{font-weight:800!important;font-size:10px!important}.st-coach-swipe:active,.st-coach-swipe.swiped{border-color:#e5c36e!important;background:linear-gradient(145deg,#343d48,#1c2530)!important;box-shadow:0 0 0 2px rgba(214,179,90,.12)!important}
      @keyframes stClockSheet{from{opacity:.65;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @media(prefers-reduced-motion:reduce){.st-time-picker-backdrop,.st-time-picker,.st-time-wheel-item{animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(sessionTimePickerCss);

    const statusPaletteCss=document.createElement('style');statusPaletteCss.id='stStatusPaletteCss';statusPaletteCss.textContent=`
      #studentTermsTab .st-session-card{transition:background-color .2s,border-color .2s!important}
      #studentTermsTab .st-session-card.past{border:1px solid rgba(239,68,68,.62)!important;background:linear-gradient(115deg,rgba(127,29,29,.28),#151e2b 78%)!important;box-shadow:inset 3px 0 0 #ef4444!important}
      #studentTermsTab .st-session-state.past{background:rgba(153,27,27,.38)!important;color:#fecaca!important;border:1px solid rgba(248,113,113,.5)!important}
      #studentTermsTab .st-session-card.next{border:1px solid rgba(34,197,94,.68)!important;background:linear-gradient(115deg,rgba(20,83,45,.30),#151e2b 78%)!important;box-shadow:inset 3px 0 0 #22c55e!important}
      #studentTermsTab .st-session-state.next{background:rgba(22,101,52,.4)!important;color:#bbf7d0!important;border:1px solid rgba(74,222,128,.5)!important}
      #studentTermsTab .st-session-card.live{border:1px solid rgba(234,179,8,.78)!important;background:linear-gradient(115deg,rgba(133,77,14,.36),#151e2b 78%)!important;box-shadow:inset 3px 0 0 #facc15!important}
      #studentTermsTab .st-session-state.live{background:rgba(161,98,7,.48)!important;color:#fef3c7!important;border:1px solid rgba(250,204,21,.6)!important}
      #studentTermsTab .st-session-card.future{border:1px solid rgba(59,130,246,.58)!important;background:linear-gradient(115deg,rgba(30,64,115,.28),#151e2b 78%)!important;box-shadow:inset 3px 0 0 #3b82f6!important}
      #studentTermsTab .st-session-state.future{background:rgba(30,64,175,.34)!important;color:#bfdbfe!important;border:1px solid rgba(96,165,250,.48)!important}
      #studentTermsTab .st-session-state.live:before,#studentTermsTab .st-session-state.next:before{content:"";display:inline-block;width:6px;height:6px;flex:0 0 6px;margin-left:5px;border-radius:50%;animation:gym20StatusPulse 1.4s ease-in-out infinite}
      #studentTermsTab .st-session-state.live:before{background:#fde047;box-shadow:0 0 0 0 rgba(253,224,71,.55)}
      #studentTermsTab .st-session-state.next:before{background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.5)}
      @keyframes gym20StatusPulse{0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 0 0 currentColor}50%{opacity:.48;transform:scale(.82);box-shadow:0 0 0 4px transparent}}
      @media(prefers-reduced-motion:reduce){#studentTermsTab .st-session-state.live:before,#studentTermsTab .st-session-state.next:before{animation:none;opacity:1;box-shadow:none}}
    `;
    document.head.appendChild(statusPaletteCss);
    const polishedScheduleReminderCss=document.createElement('style');
    polishedScheduleReminderCss.id='stPolishedScheduleReminderCss';
    polishedScheduleReminderCss.textContent=`
      #studentTermsTab .st-session-fields-modern{display:grid!important;grid-template-columns:34px minmax(66px,.75fr) minmax(100px,1.15fr) minmax(82px,.9fr) minmax(90px,1fr)!important;gap:7px!important;align-items:end!important}
      #studentTermsTab .st-session-calendar{align-self:end!important;width:34px!important;height:32px!important;min-height:32px!important;padding:0!important;border:1px solid rgba(214,179,90,.62)!important;border-radius:8px!important;background:linear-gradient(145deg,#283447,#121b28)!important;color:#f0cf7c!important;font-size:17px!important;cursor:pointer!important;box-shadow:inset 0 1px 0 #ffffff12,0 2px 7px #0004!important}
      #studentTermsTab .st-session-weekday{display:flex!important;align-items:center!important;justify-content:center!important;align-self:end!important;box-sizing:border-box!important;min-width:0!important;height:32px!important;padding:3px 6px!important;border:1px solid rgba(214,179,90,.3)!important;border-radius:7px!important;background:rgba(214,179,90,.09)!important;color:#e8d39b!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important}
      #studentTermsTab .st-session-fields-modern .st-session-field{display:flex!important;flex-direction:column!important;gap:3px!important;min-width:0!important;color:#aeb9c8!important;font-size:9px!important;line-height:1.4!important}
      #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{box-sizing:border-box!important;width:100%!important;min-width:0!important;height:32px!important;min-height:32px!important;padding:4px 6px!important;border:1px solid #39475b!important;border-radius:7px!important;background:linear-gradient(145deg,#202b3a,#111a27)!important;color:#f4e9ce!important;font:600 10px Vazirmatn,sans-serif!important}
      #studentTermsTab .st-session-fields-modern .st-time-input{direction:ltr!important;text-align:center!important;font:700 12px Montserrat,Vazirmatn,sans-serif!important}
      #studentTermsTab .st-session-head{grid-template-columns:minmax(0,1fr) auto!important;margin-bottom:7px!important}
      #studentTermsTab .st-session-head strong{font-size:11px!important;color:#f0d48a!important}
      #studentTermsTab .st-session-head .st-row-delete{justify-self:end!important}
      @media(max-width:720px){
        #studentTermsTab .st-session-fields-modern{grid-template-columns:29px minmax(52px,.68fr) minmax(78px,1fr) minmax(70px,.9fr) minmax(76px,1fr)!important;gap:4px!important}
        #studentTermsTab .st-session-calendar{width:29px!important;height:30px!important;min-height:30px!important;font-size:15px!important}
        #studentTermsTab .st-session-weekday{height:30px!important;padding:2px 3px!important;font-size:8px!important}
        #studentTermsTab .st-session-fields-modern .st-session-field{font-size:8px!important}
        #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{height:30px!important;min-height:30px!important;padding:3px!important;font-size:8px!important}
        #studentTermsTab .st-session-fields-modern .st-time-input{font-size:10px!important}
      }
      @media(max-width:390px){
        #studentTermsTab .st-session-fields-modern{grid-template-columns:25px minmax(46px,.62fr) minmax(70px,1fr) minmax(62px,.85fr) minmax(68px,1fr)!important;gap:3px!important}
        #studentTermsTab .st-session-calendar{width:25px!important;height:29px!important;min-height:29px!important;font-size:14px!important}
        #studentTermsTab .st-session-weekday{height:29px!important;font-size:7px!important;padding:2px!important}
        #studentTermsTab .st-session-fields-modern .st-session-field{font-size:7px!important}
        #studentTermsTab .st-session-fields-modern input,#studentTermsTab .st-session-fields-modern select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{height:29px!important;min-height:29px!important;font-size:7.5px!important;padding:2px!important}
      }
      #stPushCard .st-push-heading{font-size:9px!important;line-height:1.5!important;margin-bottom:7px!important}
      #stPushCard .st-reminder-layout{gap:3px!important;margin:5px 0 7px!important;padding:6px!important}
      #stPushCard .st-reminder-label-row{gap:5px!important}
      #stPushCard .st-reminder-label-row label{font-size:8px!important;line-height:1.2!important}
      #stPushCard .st-reminder-input-row{gap:5px!important}
      #stPushCard .st-reminder-input-row input{height:23px!important;min-height:23px!important;padding:2px 5px!important;font-size:8px!important;line-height:1!important;border-radius:5px!important}
      #stPushCard .st-reminder-action-row{gap:6px!important;margin-top:2px!important}
      #stPushCard .st-reminder-action-row .st-btn{height:25px!important;min-height:25px!important;padding:3px 6px!important;font-size:9px!important;border-radius:6px!important}
      #stPushCard .st-reminder-save-row{margin-top:3px!important}
      #stPushCard #stSavePushTemplates{height:27px!important;min-height:27px!important;padding:4px 10px!important;font-size:9px!important;border-radius:7px!important}
      #stPushCard .st-push-status,#stPushCard .st-push-toolbar button,#stPushCard .st-reminder-row label,#stPushCard .st-reminder-row textarea,#stPushCard #stPushFeedback{font-size:9px!important}
      @media(max-width:420px){#stPushCard{padding:8px!important}#stPushCard .st-reminder-label-row label{font-size:9px!important}#stPushCard #stSavePushTemplates{font-size:9px!important}}
    `;
    document.head.appendChild(polishedScheduleReminderCss);

    const sessionRowsFinalCss=document.createElement('style');
    sessionRowsFinalCss.id='stSessionRowsFinalCss';
    sessionRowsFinalCss.textContent=`
      #studentTermsTab .st-session-head{display:grid!important;grid-template-columns:27px auto minmax(0,1fr) 25px!important;align-items:center!important;gap:7px!important;direction:rtl!important;margin:0 0 7px!important}
      #studentTermsTab .st-session-head .st-session-calendar{grid-column:1!important;grid-row:1!important;width:26px!important;height:25px!important;min-height:25px!important}
      #studentTermsTab .st-session-head strong{grid-column:2!important;grid-row:1!important}
      #studentTermsTab .st-session-head .st-session-state{grid-column:3!important;grid-row:1!important;justify-self:start!important;margin:0!important}
      #studentTermsTab .st-session-head .st-row-delete{grid-column:4!important;grid-row:1!important;justify-self:end!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;padding:3px!important;border-radius:6px!important;font-size:0!important;line-height:1!important}
      #studentTermsTab .st-session-head .st-row-delete svg{display:block!important;width:14px!important;height:14px!important}
      #studentTermsTab .st-session-fields-modern{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;align-items:end!important}
      #studentTermsTab .st-session-fields-modern .st-session-weekday{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #studentTermsTab .st-session-state.past{background:rgba(153,27,27,.38)!important;color:#fecaca!important;border:1px solid rgba(248,113,113,.5)!important}
      #studentTermsTab .st-session-state.next{background:rgba(22,101,52,.4)!important;color:#bbf7d0!important;border:1px solid rgba(74,222,128,.5)!important}
      #studentTermsTab .st-session-state.live{background:rgba(161,98,7,.48)!important;color:#fef3c7!important;border:1px solid rgba(250,204,21,.6)!important}
      #studentTermsTab .st-session-state.future{background:rgba(30,64,175,.34)!important;color:#bfdbfe!important;border:1px solid rgba(96,165,250,.48)!important}
      #studentTermsTab .st-session-state.live:before,#studentTermsTab .st-session-state.next:before{content:"";display:inline-block;width:6px;height:6px;flex:0 0 6px;margin-left:5px;border-radius:50%;animation:gym20StatusPulse 1.4s ease-in-out infinite}
      #studentTermsTab .st-session-state.live:before{background:#fde047;box-shadow:0 0 0 0 rgba(253,224,71,.55)}
      #studentTermsTab .st-session-state.next:before{background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.5)}
      @media(max-width:600px){#studentTermsTab .st-session-head{grid-template-columns:25px auto minmax(0,1fr) 23px!important;gap:5px!important}#studentTermsTab .st-session-fields-modern{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important}#studentTermsTab .st-session-head .st-row-delete{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important}}
      @media(prefers-reduced-motion:reduce){#studentTermsTab .st-session-state.live:before,#studentTermsTab .st-session-state.next:before{animation:none!important;opacity:1!important;box-shadow:none!important}}
    `;
    document.head.appendChild(sessionRowsFinalCss);

    const sessionFieldsSizingCss=document.createElement('style');
    sessionFieldsSizingCss.id='stSessionFieldsSizingCss';
    sessionFieldsSizingCss.textContent=`
      #studentTermsTab .st-session-fields-modern{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,.82fr)!important}
      #studentTermsTab .st-session-fields-modern .st-session-field:last-child select,
      #studentTermsTab .st-session-fields-modern .st-session-field select.st-coach-input{font-size:8px!important;padding-left:3px!important;padding-right:3px!important}
      #studentTermsTab .st-session-fields-modern .st-time-input{direction:ltr!important;text-align:center!important;font-family:Montserrat,Arial,sans-serif!important;font-variant-numeric:lining-nums!important;font-feature-settings:"lnum" 1!important;letter-spacing:.2px!important}
      @media(max-width:600px){
        #studentTermsTab .st-session-fields-modern{grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,.82fr)!important}
        #studentTermsTab .st-session-fields-modern .st-session-field:last-child select,
        #studentTermsTab .st-session-fields-modern .st-session-field select.st-coach-input{font-size:7px!important}
      }
    `;
    document.head.appendChild(sessionFieldsSizingCss);

    /* GYM20 TERM CONTROLS — readable spacing and responsive field layout */

    const termControlsRefineCss=document.createElement('style');
    termControlsRefineCss.id='stTermControlsRefineCss';
    termControlsRefineCss.textContent=`
      #studentTermsTab .st-term-grid{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        column-gap:12px!important;row-gap:11px!important;
        align-items:end!important;
      }
      #studentTermsTab .st-term-grid>.st-field{min-width:0!important;width:100%!important}
      #studentTermsTab .st-term-grid>.st-term-picker-field{grid-column:1/-1!important}
      #studentTermsTab .st-term-grid .st-field label{
        display:block!important;margin:0 0 6px!important;
        font-size:11px!important;line-height:1.6!important;
        font-weight:600!important;white-space:nowrap!important;
        color:#e8d7ad!important;
      }
      #studentTermsTab .st-term-grid .st-date-wrap{
        display:flex!important;align-items:center!important;gap:7px!important;
        width:100%!important;min-width:0!important;
      }
      #studentTermsTab .st-term-grid input[data-jalali-date]{
        box-sizing:border-box!important;flex:1 1 auto!important;width:0!important;min-width:0!important;
        height:39px!important;min-height:39px!important;padding:7px 9px!important;
        border:1px solid rgba(214,179,90,.38)!important;border-radius:9px!important;
        background:#121b28!important;color:#f7f2e6!important;
        direction:ltr!important;text-align:center!important;
        font-family:Montserrat,Vazirmatn,Arial,sans-serif!important;
        font-size:11px!important;font-weight:600!important;letter-spacing:.15px!important;
        line-height:1.2!important;font-variant-numeric:tabular-nums!important;
      }
      #studentTermsTab .st-term-grid input[data-jalali-date]::placeholder{
        color:#8e96a3!important;opacity:1!important;font-size:10px!important;
      }
      #studentTermsTab .st-term-grid .st-calendar-btn{
        flex:0 0 36px!important;width:36px!important;height:39px!important;min-height:39px!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        padding:0!important;border:1px solid rgba(214,179,90,.52)!important;
        border-radius:9px!important;background:linear-gradient(145deg,#292536,#171d29)!important;
        color:#f1ce7c!important;font-size:16px!important;line-height:1!important;
      }
      #studentTermsTab .st-term-picker-row{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important}
      #studentTermsTab .st-term-picker-row .st-custom-select{flex:1 1 auto!important;min-width:0!important;width:0!important}
      #studentTermsTab .st-term-picker-row .st-custom-select-trigger{
        display:flex!important;align-items:center!important;justify-content:space-between!important;
        width:100%!important;height:39px!important;min-height:39px!important;
        padding:7px 11px!important;border:1px solid rgba(214,179,90,.42)!important;
        border-radius:9px!important;background:#121b28!important;color:#f5edda!important;
        font-size:11px!important;line-height:1.5!important;text-align:right!important;
      }
      #studentTermsTab .st-term-picker-row .st-custom-value{
        display:block!important;min-width:0!important;overflow:hidden!important;
        text-overflow:ellipsis!important;white-space:nowrap!important;
      }
      #studentTermsTab .st-term-picker-row .st-custom-arrow{flex:0 0 auto!important;margin-right:8px!important;color:#d6b35a!important}
      #studentTermsTab .st-term-picker-row .st-icon-delete-term{
        flex:0 0 36px!important;width:36px!important;height:36px!important;min-height:36px!important;
        border-radius:9px!important;
      }
      #studentTermsTab #stManualCalendar{
        min-height:40px!important;padding:8px 14px!important;border-radius:9px!important;
        font-size:11px!important;line-height:1.5!important;white-space:normal!important;
      }
      #studentTermsTab .st-create-compact{padding:14px!important}
      @media(max-width:600px){
        #studentTermsTab .st-term-grid{column-gap:8px!important;row-gap:10px!important}
        #studentTermsTab .st-term-grid .st-field label{font-size:10px!important;margin-bottom:5px!important}
        #studentTermsTab .st-term-grid input[data-jalali-date]{
          height:36px!important;min-height:36px!important;padding:5px 6px!important;font-size:10px!important;
        }
        #studentTermsTab .st-term-grid input[data-jalali-date]::placeholder{font-size:9px!important}
        #studentTermsTab .st-term-grid .st-calendar-btn{
          flex-basis:32px!important;width:32px!important;height:36px!important;min-height:36px!important;font-size:14px!important;
        }
        #studentTermsTab .st-term-picker-row{gap:7px!important}
        #studentTermsTab .st-term-picker-row .st-custom-select-trigger{
          height:36px!important;min-height:36px!important;padding:5px 8px!important;font-size:10px!important;
        }
        #studentTermsTab .st-term-picker-row .st-icon-delete-term{
          flex-basis:34px!important;width:34px!important;height:34px!important;min-height:34px!important;
        }
        #studentTermsTab #stManualCalendar{width:100%!important;min-height:38px!important;font-size:10px!important}
        #studentTermsTab .st-create-compact{padding:10px!important}
      }
      @media(max-width:350px){
        #studentTermsTab .st-term-grid{column-gap:6px!important}
        #studentTermsTab .st-term-grid input[data-jalali-date]{font-size:9px!important;padding:4px!important}
        #studentTermsTab .st-term-grid .st-calendar-btn{flex-basis:29px!important;width:29px!important}
      }
    `;
    document.head.appendChild(termControlsRefineCss);

    /* Student picker: compact 25px trigger and matching active-student status */
    const studentPickerCompactCss=document.createElement('style');
    studentPickerCompactCss.textContent=`
      #studentTermsTab .st-student-card .st-student-trigger{
        height:25px!important;min-height:25px!important;max-height:25px!important;
        box-sizing:border-box!important;padding:2px 7px!important;
        border:1px solid rgba(214,179,90,.42)!important;border-radius:6px!important;
        background:#121b28!important;color:#f5edda!important;
        font-size:8px!important;line-height:19px!important;
      }
      #studentTermsTab .st-student-card .st-student-trigger #stStudentSelected{
        font-size:8px!important;line-height:19px!important;
      }
      #studentTermsTab .st-student-card .st-picker-arrow{font-size:10px!important}
      #studentTermsTab .st-student-card #stSummary{
        display:block!important;box-sizing:border-box!important;
        min-height:25px!important;margin:3px 0 0!important;padding:3px 7px!important;
        border:1px solid rgba(214,179,90,.42)!important;border-radius:6px!important;
        background:#121b28!important;color:#f5edda!important;
        font-size:8px!important;line-height:17px!important;
      }
      #studentTermsTab .st-student-card #stSummary:empty{display:none!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important}
    `;
    document.head.appendChild(studentPickerCompactCss);

    const studentLoadStatusCss=document.createElement('style');
    studentLoadStatusCss.textContent=`
      #studentTermsTab .st-student-card #stStudentLoadStatus{
        display:block!important;min-height:20px!important;box-sizing:border-box!important;
        margin:2px 0 0!important;padding:1px 7px!important;
        border:0!important;border-radius:0!important;background:transparent!important;
        color:#34d399!important;font-size:8px!important;line-height:16px!important;
        text-align:right!important;
      }
      #studentTermsTab .st-student-card #stStudentLoadStatus:empty{display:none!important}
    `;
    document.head.appendChild(studentLoadStatusCss);



    /* Compact term creation controls: 24px, 8px text, gold bold labels */
    const termCreateCompactCss=document.createElement('style');
    termCreateCompactCss.textContent=`
      #studentTermsTab .st-create-compact .st-title,
      #studentTermsTab .st-create-compact .st-field>label{
        color:#f1ce7c!important;font-weight:700!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid input[data-jalali-date]{
        height:24px!important;min-height:24px!important;max-height:24px!important;
        padding:2px 6px!important;font-size:8px!important;line-height:18px!important;
        border-radius:6px!important;
      }
      #studentTermsTab .st-create-compact .st-date-wrap .st-calendar-btn{
        height:24px!important;min-height:24px!important;max-height:24px!important;
        width:24px!important;flex-basis:24px!important;padding:0!important;
        font-size:12px!important;border-radius:6px!important;
      }
      #studentTermsTab .st-create-compact .st-term-picker-row .st-custom-select-trigger{
        height:24px!important;min-height:24px!important;max-height:24px!important;
        padding:2px 7px!important;font-size:8px!important;line-height:18px!important;
        border-radius:6px!important;
      }
      #studentTermsTab .st-create-compact .st-term-picker-row .st-custom-value{
        font-size:8px!important;line-height:18px!important;
      }
      #studentTermsTab .st-create-compact .st-term-picker-row .st-custom-arrow{font-size:9px!important}
      #studentTermsTab .st-create-compact .st-term-picker-row .st-icon-delete-term{
        height:24px!important;min-height:24px!important;max-height:24px!important;
        width:24px!important;flex-basis:24px!important;padding:0!important;border-radius:6px!important;
      }
      #studentTermsTab .st-create-compact .st-term-picker-row .st-icon-delete-term svg{width:12px!important;height:12px!important}
      #studentTermsTab .st-create-compact #stManualCalendar{
        height:24px!important;min-height:24px!important;max-height:24px!important;
        padding:2px 8px!important;font-size:8px!important;line-height:18px!important;
        border-radius:6px!important;white-space:nowrap!important;
      }
      #studentTermsTab .st-create-compact .st-field>label{
        font-size:8px!important;margin-bottom:3px!important;
      }
    `;
    document.head.appendChild(termCreateCompactCss);






    const b=document.createElement('button');b.className='admin-tab-btn';b.type='button';b.textContent='👥 هنرجویان و ترم‌ها';b.setAttribute('onclick',"switchAdminTab('"+TAB+"')");
    nav.insertBefore(b,nav.querySelector('[onclick*="requestsTab"]')||null);
    const p=document.createElement('div');p.className='admin-panel-tab';p.id=TAB;
    p.innerHTML=
      '<div class="admin-section-subhead">👥 مدیریت هنرجویان، ترم‌ها و برنامه جلسات</div>'+
      '<div class="st-card st-student-card"><div class="st-field st-student-select-wrap"><div class="st-student-picker"><button type="button" id="stStudentTrigger" class="st-student-trigger" aria-expanded="false"><span id="stStudentSelected">انتخاب هنرجو…</span><span class="st-picker-arrow">⌄</span></button><div id="stStudentMenu" class="st-student-menu" hidden></div></div></div><div id="stStudentLoadStatus" class="st-muted"></div><div id="stSummary" class="st-muted"></div></div>'+
      '<div id="stMain" class="st-hide">'+
      '<div class="st-card st-create-compact"><div class="st-title">ساخت ترم و مدیریت ترم‌های قبلی</div><form id="stCreate">'+'<input id="stName" type="hidden">'+
      '<div class="st-grid st-term-grid">'+
      '<div class="st-field"><label>شروع ترم</label><div class="st-date-wrap"><input id="stStart" data-jalali-date type="text" placeholder="تاریخ شروع" required><button type="button" class="st-calendar-btn" data-calendar="stStart">▦</button></div></div>'+
      '<div class="st-field"><label>پایان ترم</label><div class="st-date-wrap"><input id="stEnd" data-jalali-date type="text" placeholder="تاریخ پایان" required><button type="button" class="st-calendar-btn" data-calendar="stEnd">▦</button></div></div>'+
      '<div class="st-actions st-calendar-action-row"><button class="st-btn primary" type="button" id="stManualCalendar">▦ انتخاب جلسات از تقویم</button><span id="stManualCount" class="st-muted"></span></div>'+
      '<div class="st-field st-term-picker-field"><label>ترم‌های هنرجو</label><div class="st-term-picker-row"><select id="stTerm"><option value="">انتخاب ترم…</option></select><button type="button" class="st-btn danger st-icon-delete-term" id="stDeleteTerm" disabled aria-label="حذف ترم" title="حذف ترم" style="width:36px;min-width:36px;height:36px;padding:0;display:inline-flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:17px;height:17px;display:block"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>'+
      '</div></form></div>'+
      '<div id="stSchedule" class="st-hide">'+
      '<div class="st-card">'+
      '<div id="stDraftTable" class="st-table-wrap"></div><div class="st-actions"><button class="st-btn primary" type="button" id="stPublish">ثبت نهایی</button></div></div>'+
      '</div></div>'+
      '<div id="stFeedback" class="request-feedback" role="status" aria-live="polite"></div>';
    const save=$('autoCommitBtn');work.insertBefore(p,save||null);
    /* Student menu stays inside its picker so its position and theme remain scoped to the admin panel. */
    const termCard=p.querySelector('.st-create-compact'),schedulePanel=p.querySelector('#stSchedule');if(termCard&&schedulePanel)termCard.appendChild(schedulePanel);
    const pushCard=document.createElement('section');pushCard.className='st-card st-needs-student';pushCard.id='stPushCard';pushCard.hidden=false;
    pushCard.innerHTML='<div class="st-push-toolbar"><div class="st-push-status" id="stPushStatusControls"></div><button type="button" class="st-btn" id="stPushTestAdmin">تست اعلان</button></div>'+
      '<div class="st-title st-push-heading">🔔 یادآوری کلاس روی گوشی هنرجو</div>' +

      '<div class="st-reminder-layout">'+
      '<div class="st-reminder-label-row"><label for="stReminder1Hours">ساعت یادآوری اول</label><label for="stReminder2Hours">ساعت یادآوری دوم</label></div>'+
      '<div class="st-reminder-input-row"><div class="st-hour-scroll-wrap"><input id="stReminder1Hours" type="hidden" value="6"><div class="st-hour-loop" data-hour-loop="stReminder1Hours" role="listbox" aria-label="ساعت یادآوری اول" tabindex="0"></div></div><div class="st-hour-scroll-wrap"><input id="stReminder2Hours" type="hidden" value="2"><div class="st-hour-loop" data-hour-loop="stReminder2Hours" role="listbox" aria-label="ساعت یادآوری دوم" tabindex="0"></div></div></div>'+
      '<div class="st-reminder-action-row"><button type="button" class="st-btn st-edit-template" data-edit-template="stReminder1">ویرایش متن</button><button type="button" class="st-btn st-edit-template" data-edit-template="stReminder2">ویرایش متن</button></div>'+
      '<div class="st-reminder-save-row"><button type="button" class="st-btn primary" id="stSavePushTemplates">ذخیره اعلان‌ها</button></div>'+
      '<div class="st-reminder-hidden"><textarea id="stReminder1" class="st-template-editor" rows="3" maxlength="1000" hidden></textarea><textarea id="stReminder2" class="st-template-editor" rows="3" maxlength="1000" hidden></textarea></div></div>'+
      '<div id="stTemplateModal" class="st-template-modal" hidden><div class="st-template-modal-backdrop" data-template-close></div><section class="st-template-dialog" role="dialog" aria-modal="true" aria-labelledby="stTemplateModalTitle"><div class="st-template-dialog-head"><div><small>GYM20 · NOTIFICATION</small><b id="stTemplateModalTitle">ویرایش متن یادآوری</b></div><button type="button" class="st-template-close" data-template-close aria-label="بستن">×</button></div><p class="st-template-hint">متن پیام را ویرایش کن. متغیرهایی مثل {student} و {time} را برای جایگذاری خودکار حفظ کن.</p><textarea id="stTemplateModalText" rows="6" maxlength="1000" placeholder="متن یادآوری را بنویس…"></textarea><div class="st-template-dialog-actions"><button type="button" class="st-btn" id="stTemplateCancel">انصراف</button><button type="button" class="st-btn primary" id="stTemplateApply">اعمال متن</button></div></section></div>'+
      
      '<div class="st-reminder-row st-custom-push-row"><div class="st-field"><label for="stCustomPushText">اعلان فوری جدید</label><input id="stCustomPushText" type="text" maxlength="1200" placeholder="متن اعلان فوری…" autocomplete="off"></div><div class="st-field st-send-push-field"><label>ارسال</label><button type="button" class="st-btn primary" id="stSendCustomPush">ارسال اعلان</button></div></div>'+
      '<div id="stPushFeedback" class="st-muted" role="status" aria-live="polite"></div>';
    const summary=$('stSummary');if(summary?.parentNode)summary.parentNode.insertBefore(pushCard,summary.nextSibling);else $('stMain').appendChild(pushCard);
    const noStudentPushCss=document.createElement('style');noStudentPushCss.id='stNoStudentPushCss';noStudentPushCss.textContent=
      '#stPushCard.st-needs-student{display:none!important}'+
      '#stPushCard.st-needs-student::before{content:none!important}';
    document.head.appendChild(noStudentPushCss);

    /* Compact reminder hour fields to reduce vertical scrolling. */
    const reminderCompactCss=document.createElement('style');
    reminderCompactCss.id='stReminderCompactFinalCss';
    reminderCompactCss.textContent=`
      #stPushCard .st-reminder-layout{padding:5px!important;gap:3px!important;margin:4px 0 6px!important}
      #stPushCard .st-reminder-label-row{gap:5px!important}
      #stPushCard .st-reminder-label-row label{font-size:8px!important;line-height:1.15!important;margin:0!important}
      #stPushCard .st-reminder-input-row{gap:5px!important}
      #stPushCard .st-reminder-input-row input{box-sizing:border-box!important;height:20px!important;min-height:20px!important;max-height:20px!important;padding:1px 4px!important;font-size:9px!important;line-height:18px!important;border-radius:5px!important}
      #stPushCard .st-reminder-action-row{gap:5px!important;margin-top:1px!important}
      #stPushCard .st-reminder-action-row .st-btn{height:22px!important;min-height:22px!important;padding:1px 5px!important;font-size:8px!important;line-height:18px!important}
      #stPushCard .st-reminder-save-row{margin-top:2px!important}
      #stPushCard #stSavePushTemplates{height:24px!important;min-height:24px!important;padding:2px 9px!important;font-size:8px!important}
      @media(max-width:420px){
        #stPushCard .st-reminder-layout{padding:4px!important;margin:3px 0 5px!important}
        #stPushCard .st-reminder-input-row input{height:19px!important;min-height:19px!important;max-height:19px!important;font-size:8px!important;line-height:17px!important}
        #stPushCard .st-reminder-label-row label{font-size:7.5px!important}
      }`;
    document.head.appendChild(reminderCompactCss);

    /* Force compact sizing directly on the reminder inputs; inline important wins over legacy theme rules. */
    const reminderHourFinalCss=document.createElement('style');
    reminderHourFinalCss.id='stReminderHourFinalCss';
    reminderHourFinalCss.textContent=`
      #stPushCard #stReminder1Hours,#stPushCard #stReminder2Hours{
        box-sizing:border-box!important;width:100%!important;height:14px!important;min-height:14px!important;max-height:14px!important;
        padding:0 3px!important;font-size:7px!important;line-height:14px!important;border-radius:4px!important;
      }
      @media(max-width:720px){
        #stPushCard #stReminder1Hours,#stPushCard #stReminder2Hours{
          height:13px!important;min-height:13px!important;max-height:13px!important;font-size:7px!important;line-height:11px!important;
        }
      }`;
    document.head.appendChild(reminderHourFinalCss);
    /* Compact seamless circular number belt for reminder hours. */
    const hourScrollerCss=document.createElement('style');
    hourScrollerCss.id='stReminderHorizontalScrollerCss';
    hourScrollerCss.textContent=`
      #stPushCard .st-reminder-input-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}
      #stPushCard .st-hour-scroll-wrap{position:relative;min-width:0;width:100%;height:18px;min-height:18px;max-height:18px;overflow:hidden;box-sizing:border-box;border:0;border-radius:5px;background:linear-gradient(90deg,#111a27,#202b3a 50%,#111a27);box-shadow:inset 0 1px 2px #0008;direction:ltr}
            #stPushCard .st-hour-loop{position:relative;display:flex;align-items:center;gap:.5px;width:100%;height:100%;box-sizing:border-box;padding:0 calc(50% - 6px);overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-x:contain;touch-action:pan-x;cursor:grab;user-select:none;-webkit-user-select:none;scroll-behavior:auto}
      #stPushCard .st-hour-loop::-webkit-scrollbar{display:none}
      #stPushCard .st-hour-loop.is-dragging{cursor:grabbing;scroll-snap-type:none}
      #stPushCard .st-hour-option{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex:0 0 12px;width:12px;height:16px;margin:0;padding:0;border:1px solid transparent;border-radius:5px;color:rgba(255,255,255,.72);font:600 9px/14px Vazirmatn,Montserrat,sans-serif;text-align:center;white-space:nowrap;scroll-snap-align:center;cursor:pointer;transition:color .08s,text-shadow .08s,transform .08s,border-color .08s,background .08s,box-shadow .08s;flex-shrink:0}
      #stPushCard .st-hour-option.is-two-digit{flex:0 0 19px!important;width:19px!important;min-width:19px!important;max-width:19px!important;flex-shrink:0!important;margin-inline:.25px;letter-spacing:0}
      #stPushCard .st-hour-option.is-selected{margin-inline:1.5px;border-color:transparent;background:transparent;color:#fff;font-weight:900;text-shadow:0 0 4px #fff,0 0 9px rgba(255,255,255,.95);box-shadow:none;transform:scale(1.08);z-index:2}
      #stPushCard .st-hour-option.is-two-digit.is-selected{margin-inline:.5px}
      #stPushCard .st-hour-option.is-adjacent{margin-inline:0}
      @media(max-width:720px){#stPushCard .st-hour-scroll-wrap{height:17px;min-height:17px;max-height:17px}}
    `;
    document.head.appendChild(hourScrollerCss);

    /* Remove captions from the urgent-push controls; single-line input centers text vertically by design. */
    const urgentPushCompactCss=document.createElement('style');
    urgentPushCompactCss.id='stUrgentPushCompactCss';
    urgentPushCompactCss.textContent='#stPushCard .st-custom-push-row .st-field>label{display:none!important}#stPushCard #stCustomPushText{box-sizing:border-box!important;display:block!important;width:100%!important;height:24px!important;min-height:24px!important;max-height:24px!important;padding:0 8px!important;line-height:24px!important;text-align:center!important;direction:rtl!important;vertical-align:middle!important}';
    document.head.appendChild(urgentPushCompactCss);
    /* Center each reminder-hour caption over its matching input. */
    const reminderLabelCenterCss=document.createElement('style');
    reminderLabelCenterCss.id='stReminderLabelCenterCss';
    reminderLabelCenterCss.textContent='#stPushCard .st-reminder-label-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:center!important}#stPushCard .st-reminder-label-row label{display:block!important;width:100%!important;text-align:center!important;justify-self:stretch!important}';
    document.head.appendChild(reminderLabelCenterCss);

    bindJalaliDates(p);
    enhanceAllSelects(p);
    const selectObserver=new MutationObserver(records=>records.forEach(rec=>{if(rec.type!=='childList')return;if(rec.target.tagName==='SELECT')refreshCustomSelect(rec.target);rec.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('#studentTermsTab select'))enhanceSelect(n);n.querySelectorAll?.('#studentTermsTab select,select').forEach(enhanceSelect);}});}));
    selectObserver.observe(p,{childList:true,subtree:true});
    initTermCalendars(p);
    bindJalaliDates(p);
      const todayFa=jalaliInput(localDate(new Date()));$('stStart').value=todayFa;$('stEnd').value=todayFa;syncTermName();$('stPublish').textContent='ثبت نهایی';
    $('stStudentTrigger').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const menu=$('stStudentMenu');const open=menu.hidden;menu.hidden=!open;$('stStudentTrigger').setAttribute('aria-expanded',String(open));});
    $('stStudentMenu').addEventListener('click',e=>{const item=e.target.closest('[data-student-id]');if(!item)return;const id=String(item.dataset.studentId||'');S.studentId=id;const student=S.students.find(x=>String(x.id)===id);$('stStudentSelected').dataset.studentId=id;$('stStudentSelected').textContent=student?.full_name||item.querySelector('span')?.textContent?.trim()||'انتخاب هنرجو…';$('stStudentMenu').hidden=true;$('stStudentTrigger').setAttribute('aria-expanded','false');$('stStudentMenu').querySelectorAll('[data-student-id]').forEach(x=>x.classList.toggle('selected',String(x.dataset.studentId)===id));loadStudent(id);});
    document.addEventListener('pointerdown',e=>{if(!e.target.closest('.st-student-picker')){$('stStudentMenu').hidden=true;$('stStudentTrigger').setAttribute('aria-expanded','false');}});
    $('stSummary').addEventListener('click',e=>{if(e.target.closest('#stPublicLinkBtn'))makeStudentPublicLink();});
    $('stCreate').addEventListener('submit',e=>e.preventDefault());
    $('stTerm').addEventListener('change',e=>{$('stDeleteTerm').disabled=!e.target.value;loadTerm(e.target.value);});
    $('stDeleteTerm').addEventListener('click',deleteSelectedTerm);
    initManualMultiCalendar(p);
    $('stPublish').addEventListener('click',publish);
    $('stSavePushTemplates').addEventListener('click',savePushTemplates);
    let activeTemplateId='';
     const templateModal=$('stTemplateModal'),templateModalText=$('stTemplateModalText');
     const closeTemplateModal=()=>{templateModal.hidden=true;activeTemplateId='';};
     p.querySelectorAll('[data-edit-template]').forEach(btn=>btn.addEventListener('click',()=>{activeTemplateId=btn.dataset.editTemplate;templateModalText.value=$(activeTemplateId).value;$('stTemplateModalTitle').textContent=activeTemplateId==='stReminder1'?'ویرایش متن یادآوری اول':'ویرایش متن یادآوری دوم';templateModal.hidden=false;requestAnimationFrame(()=>templateModalText.focus());}));
     templateModal.querySelectorAll('[data-template-close]').forEach(el=>el.addEventListener('click',closeTemplateModal));
     $('stTemplateCancel').addEventListener('click',closeTemplateModal);
     $('stTemplateApply').addEventListener('click',()=>{if(activeTemplateId)$(activeTemplateId).value=templateModalText.value;closeTemplateModal();});
     templateModalText.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')$('stTemplateApply').click();if(e.key==='Escape')closeTemplateModal();});
    
    /* Circular 0–24 number belt. Three repeated cycles keep the scroll seamless in both directions. */
    const reminderLoopTimers=new Map();
    const reminderLoops=new Map();
    function centerReminderHour(id,value,instant=true){
      const loop=reminderLoops.get(id),hidden=$(id);
      if(!loop||!hidden)return;
      const hour=((Math.round(Number(value)||0)%25)+25)%25;
      const options=loop.querySelectorAll('.st-hour-option');
      const target=options[25+hour];
      if(!target)return;
      hidden.value=String(hour);
      loop.querySelectorAll('.st-hour-option').forEach(el=>{
        const active=el===target;
        const adjacent=Math.abs(Number(el.dataset.index)-(25+hour))===1;
        el.classList.toggle('is-selected',active);
        el.classList.toggle('is-adjacent',adjacent);
        el.setAttribute('aria-selected',String(active));
      });
      const left=target.offsetLeft+target.offsetWidth/2-loop.clientWidth/2;
      loop.scrollTo({left:Math.max(0,left),behavior:instant?'auto':'smooth'});
    }
    function setupReminderLoop(id){
      const hidden=$(id),loop=p.querySelector('[data-hour-loop="'+id+'"]');
      if(!hidden||!loop)return;
      reminderLoops.set(id,loop);
      loop.innerHTML=Array.from({length:75},(_,index)=>{
        const hour=index%25;
        return '<span class="st-hour-option'+(hour>=10?' is-two-digit':'')+'" data-hour="'+hour+'" data-index="'+index+'" role="option" aria-selected="false">'+hour+'</span>';
      }).join('');
      const paintCenter=()=>{
        const mid=loop.scrollLeft+loop.clientWidth/2;
        let nearest=null,dist=Infinity;
        loop.querySelectorAll('.st-hour-option').forEach(el=>{
          const center=el.offsetLeft+el.offsetWidth/2,d=Math.abs(center-mid);
          if(d<dist){dist=d;nearest=el;}
        });
        if(!nearest)return null;
        const index=Number(nearest.dataset.index),hour=Number(nearest.dataset.hour);
        hidden.value=String(hour);
        loop.querySelectorAll('.st-hour-option').forEach(el=>{
          const active=el===nearest;
          const adjacent=Math.abs(Number(el.dataset.index)-index)===1;
          el.classList.toggle('is-selected',active);
          el.classList.toggle('is-adjacent',adjacent);
          el.setAttribute('aria-selected',String(active));
        });
        return {index,hour};
      };
      const commit=()=>{
        const selected=paintCenter();
        if(!selected)return;
        const {index,hour}=selected;
        /* Rebase to the middle copy after settling, preserving the selected hour. */
        if(index<25||index>=50){
          const middle=loop.querySelector('[data-index="'+(25+hour)+'"]');
          if(middle)loop.scrollLeft=middle.offsetLeft+middle.offsetWidth/2-loop.clientWidth/2;
          paintCenter();
        }
      };
      loop.addEventListener('scroll',()=>{
        paintCenter();
        clearTimeout(reminderLoopTimers.get(id));
        reminderLoopTimers.set(id,setTimeout(commit,110));
      },{passive:true});
      loop.addEventListener('click',event=>{
        const option=event.target.closest('.st-hour-option');
        if(option)centerReminderHour(id,Number(option.dataset.hour),false);
      });
      loop.addEventListener('wheel',event=>{
        if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();loop.scrollLeft+=event.deltaY;}
      },{passive:false});
      let dragging=false,startX=0,startLeft=0,moved=false;
      loop.addEventListener('pointerdown',event=>{
        if(event.pointerType!=='mouse'||event.button!==0)return;
        dragging=true;moved=false;startX=event.clientX;startLeft=loop.scrollLeft;
        loop.classList.add('is-dragging');
        try{loop.setPointerCapture(event.pointerId);}catch(_){}
        event.preventDefault();
      });
      loop.addEventListener('pointermove',event=>{
        if(!dragging)return;
        const dx=event.clientX-startX;
        if(Math.abs(dx)>3)moved=true;
        loop.scrollLeft=startLeft-dx;
      });
      const finish=event=>{
        if(!dragging)return;
        dragging=false;loop.classList.remove('is-dragging');
        if(moved){loop.dataset.dragged='1';setTimeout(()=>delete loop.dataset.dragged,0);}
        if(event.pointerId!==undefined){try{loop.releasePointerCapture(event.pointerId);}catch(_){}}
        commit();
      };
      loop.addEventListener('pointerup',finish);
      loop.addEventListener('pointercancel',finish);
      loop.addEventListener('click',event=>{
        if(loop.dataset.dragged==='1'){event.preventDefault();event.stopPropagation();delete loop.dataset.dragged;}
      },true);
      loop.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const current=Number(hidden.value)||0;
        const next=event.key==='Home'?0:event.key==='End'?24:(current+(event.key==='ArrowRight'?1:-1)+25)%25;
        centerReminderHour(id,next,false);
      });
      centerReminderHour(id,Number(hidden.value),true);
    }
    ['stReminder1Hours','stReminder2Hours'].forEach(setupReminderLoop);
    if(typeof ResizeObserver!=='undefined'){
      const reminderLoopResizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>{
        if(entry.contentRect.width<=0)return;
        const id=entry.target.dataset.hourLoop,input=$(id);
        if(input)requestAnimationFrame(()=>centerReminderHour(id,input.value,true));
      }));
      reminderLoops.forEach(loop=>reminderLoopResizeObserver.observe(loop));
    }
    S.syncReminderHourLoops=()=>{
      ['stReminder1Hours','stReminder2Hours'].forEach(id=>{
        const input=$(id);
        if(input)centerReminderHour(id,input.value,true);
      });
    };
    $('stSendCustomPush').addEventListener('click',sendCustomPush);$('stPushTestAdmin').addEventListener('click',sendTestPush);
    b.addEventListener('click',()=>{if(gym20OwnerAuthorized)loadStudents();else say('ابتدا وارد پنل مدیر شوید.',true);});
  }


  const DEFAULT_PUSH_TEMPLATES={
    reminder_1_template:'{student} عزیز، خوبی؟ 🌱 کلاس ما {relative}، {day} ساعت {time} برگزار می‌شود. منتظرت هستم!',
    reminder_2_template:'{student} عزیز 💪 آماده‌ای؟ کلاس شما {relative}، {day} ساعت {time} شروع می‌شود. به امید دیدار!'
  };
  function updateTemplatePreview(id){const preview=$(id+'Preview'),editor=$(id);if(preview&&editor)preview.textContent=editor.value||'متنی ثبت نشده است.';}
  async function loadPushSettings(){
    const {data,error}=await db().from('site_settings').select('value').eq('key','student_push_config').maybeSingle();
    if(error)throw error;
    S.reminderDraft={enabled:true,reminder_1_hours:6,reminder_2_hours:2,...DEFAULT_PUSH_TEMPLATES,...(data?.value||{})};
    const legacy1='{student} عزیز 🌟 یادآوری دوستانه؛ کلاس شما {relative}، {day} ساعت {time} برگزار می‌شود. برای یک تمرین پرقدرت آماده باشید!';
    const legacy2='وقت تمرینه! 💪 {student} عزیز، کلاس شما {relative}، {day} ساعت {time} شروع می‌شود. منتظرتون هستیم!';
    if(S.reminderDraft.reminder_1_template===legacy1)S.reminderDraft.reminder_1_template=DEFAULT_PUSH_TEMPLATES.reminder_1_template;
    if(S.reminderDraft.reminder_2_template===legacy2)S.reminderDraft.reminder_2_template=DEFAULT_PUSH_TEMPLATES.reminder_2_template;
    $('stReminder1').value=S.reminderDraft.reminder_1_template;
    $('stReminder2').value=S.reminderDraft.reminder_2_template;
    const reminder1=Number(S.reminderDraft.reminder_1_hours),reminder2=Number(S.reminderDraft.reminder_2_hours);
    $('stReminder1Hours').value=String(Number.isInteger(reminder1)&&reminder1>=0&&reminder1<=24?reminder1:6);
    $('stReminder2Hours').value=String(Number.isInteger(reminder2)&&reminder2>=0&&reminder2<=24?reminder2:2);
    if(S.syncReminderHourLoops)S.syncReminderHourLoops();
    requestAnimationFrame(()=>S.syncReminderHourLoops?.());
    setTimeout(()=>S.syncReminderHourLoops?.(),120);
    updateTemplatePreview('stReminder1');updateTemplatePreview('stReminder2');
    S.pushTemplatesLoaded=true;
  }
  async function savePushTemplates(){
    const feedback=$('stPushFeedback'),first=$('stReminder1').value.trim(),second=$('stReminder2').value.trim(),firstHours=Number($('stReminder1Hours').value),secondHours=Number($('stReminder2Hours').value);
    try{
      if(!S.pushTemplatesLoaded)throw Error('تنظیمات اعلان هنوز بارگذاری نشده است؛ صفحه را تازه‌سازی کن و دوباره تلاش کن.');
      if(!first||!second)throw Error('متن هر دو یادآوری را وارد کن.');
      if(first.length>1000||second.length>1000)throw Error('حداکثر طول هر متن ۱۰۰۰ کاراکتر است.');
      if(!Number.isInteger(firstHours)||firstHours<0||firstHours>168||!Number.isInteger(secondHours)||secondHours<0||secondHours>168)throw Error('زمان یادآوری باید بین صفر تا ۱۶۸ ساعت باشد.');
      if(firstHours>0&&secondHours>0&&firstHours===secondHours)throw Error('ساعت یادآوری اول و دوم باید متفاوت باشد.');
      if(firstHours>0&&secondHours>0&&firstHours<secondHours)throw Error('یادآوری اول باید زودتر از یادآوری دوم باشد؛ مثلاً ۶ و سپس ۲ ساعت.');
      const {data:{user},error:userError}=await gym20AdminClient.auth.getUser();if(userError)throw userError;
      const value={...S.reminderDraft,...DEFAULT_PUSH_TEMPLATES,enabled:S.reminderDraft.enabled!==false,reminder_1_template:first,reminder_2_template:second,reminder_1_hours:firstHours,reminder_2_hours:secondHours};
      const {error}=await db().from('site_settings').upsert({key:'student_push_config',value,updated_at:new Date().toISOString(),updated_by:user?.id||null},{onConflict:'key'});
      if(error)throw error;
      S.reminderDraft=value;if(feedback)feedback.textContent='متن یادآوری‌ها ذخیره شد ✓';
      say('متن یادآوری کلاس‌ها ذخیره شد.');
    }catch(e){if(feedback)feedback.textContent=e.message||'ذخیره متن‌ها ناموفق بود.';say(e.message||'ذخیره متن‌ها ناموفق بود.',true);}
  }
  async function sendCustomPush(){
    const button=$('stSendCustomPush'),feedback=$('stPushFeedback'),message=$('stCustomPushText').value.trim();
    if(!S.studentId){say('ابتدا یک هنرجو انتخاب کن.',true);return;}
    if(!message){say('متن اعلان را بنویس.',true);return;}
    if(message.length>1200){say('حداکثر طول اعلان ۱۲۰۰ کاراکتر است.',true);return;}
    const original=button.textContent;button.disabled=true;button.textContent='در حال ارسال…';
    try{
      const {data,error}=await gym20AdminClient.functions.invoke('student-push-admin',{body:{student_id:S.studentId,message}});
      if(error)throw error;
      if(!data?.ok)throw Error(data?.error||'ارسال اعلان انجام نشد.');
      const result='اعلان با موفقیت به '+fa(data.sent)+' دستگاه ارسال شد.';
      if(feedback)feedback.textContent=result;
      $('stCustomPushText').value='';
      say(result);
    }catch(e){const msg=e.message||'ارسال اعلان ناموفق بود.';if(feedback)feedback.textContent=msg;say(msg,true);}
    finally{button.disabled=false;button.textContent=original;}
  }

  async function loadStudentPushCount(studentId){
    const status=$('stPushActiveCount');if(!status)return;
    status.textContent='…';status.classList.remove('is-active','is-inactive');
    try{
      const {data,error}=await gym20AdminClient.functions.invoke('student-push-admin',{body:{action:'count',student_id:studentId}});
      if(error)throw error;if(!data?.ok)throw Error(data?.error||'دریافت تعداد دستگاه‌ها ناموفق بود.');
      if(S.studentId!==studentId)return;
      const count=Math.max(0,Number(data.active_count)||0);
      status.textContent=fa(count)+' اعلان فعال';
      status.classList.toggle('is-active',count>0);status.classList.toggle('is-inactive',count===0);
    }catch(e){if(S.studentId===studentId){status.textContent='';status.classList.remove('is-active','is-inactive');}}
  }

  async function sendTestPush(){
    const button=$('stPushTestAdmin'),feedback=$('stPushFeedback');
    if(!S.studentId){say('ابتدا یک هنرجو انتخاب کن.',true);return;}
    const original=button.textContent;button.disabled=true;button.textContent='در حال ارسال آزمایش…';
    try{
      const {data,error}=await gym20AdminClient.functions.invoke('student-push-admin',{body:{student_id:S.studentId,message:'آزمایش اعلان GYM20 🌱 اگر این پیام را روی گوشی می‌بینی، دریافت اعلان فعال است.'}});
      if(error)throw error;if(!data?.ok)throw Error(data?.error||'ارسال اعلان آزمایشی انجام نشد.');
      if(feedback)feedback.textContent='';
    }catch(e){const msg=e.message||'ارسال اعلان آزمایشی ناموفق بود.';if(feedback)feedback.textContent=msg;say(msg,true);}
    finally{button.disabled=false;button.textContent=original;}
  }

  async function loadStudents(){
    try{say('در حال دریافت هنرجویان…');const {data,error}=await db().from('students').select('id,full_name,phone,birth_date,is_active').eq('is_active',true).order('full_name');if(error)throw error;S.students=data||[];loadPushSettings().catch(e=>console.warn('Push template settings unavailable:',e));
      $('stStudentMenu').innerHTML=S.students.map(x=>'<button type="button" class="st-student-option '+(x.id===S.studentId?'selected':'')+'" data-student-id="'+x.id+'"><span>'+esc(x.full_name)+'</span><small>'+esc(x.phone||'بدون شماره')+'</small></button>').join('')||'<div class="st-muted">هنرجویی ثبت نشده است.</div>';
      const selected=S.students.find(x=>String(x.id)===String(S.studentId));$('stStudentSelected').textContent=selected?(selected.full_name||'انتخاب هنرجو…'):'انتخاب هنرجو…';
      if(S.studentId&&S.students.some(x=>x.id===S.studentId)){await loadStudent(S.studentId);}else {const status=$('stStudentLoadStatus');if(status)status.textContent=fa(S.students.length)+' هنرجوی فعال دریافت شد.';say('');}
    }catch(e){say(e.message||'دریافت هنرجویان ناموفق بود.',true);}
  }

  async function loadStudent(id){
    S.studentId=id;S.allPublishedSessions=[];if($('stPushActiveCount')){$('stPushActiveCount').textContent=id?'…':'';$('stPushActiveCount').classList.remove('is-active','is-inactive');}if($('stStudentSelected'))$('stStudentSelected').dataset.studentId=id||'';S.termId='';S.term=null;S.terms=[];S.enrollments=[];S.rows=[];S.manualDates=[];S.draftId='';S.publishedId=null;S.publishedReadOnly=false;$('stManualCalendar').textContent='▦ انتخاب جلسات از تقویم';$('stManualCalendar').hidden=false;$('stPublish').hidden=false;$('stPublish').textContent='ثبت نهایی';$('stMain').classList.toggle('st-hide',!id);$('stSchedule').classList.add('st-hide');const reminderCard=$('stPushCard');if(reminderCard){reminderCard.hidden=false;reminderCard.classList.toggle('st-needs-student',!id);}if(!id)return;
    try{say('در حال دریافت پرونده هنرجو…');const student=S.students.find(x=>x.id===id);
      const [er,tr]=await Promise.all([
        db().from('enrollments').select('id,course_id,class_type,age_group,total_sessions,start_date,end_date,status,courses(name)').eq('student_id',id).order('created_at'),
        db().from('student_terms').select('id,term_name,start_date,end_date,total_sessions,duration_minutes,default_venue,schedule_mode,status,published_version_id,created_at').eq('student_id',id).order('created_at',{ascending:false})
      ]);
      if(er.error)throw er.error;if(tr.error)throw tr.error;S.enrollments=er.data||[];S.terms=tr.data||[];const publishedVersionIds=Array.from(new Set(S.terms.map(t=>t.published_version_id).filter(Boolean)));S.allPublishedSessions=[];if(publishedVersionIds.length){const allPublished=await db().from('class_sessions').select('id,session_number,starts_at,ends_at,schedule_version_id').in('schedule_version_id',publishedVersionIds).order('starts_at');if(allPublished.error)throw allPublished.error;S.allPublishedSessions=allPublished.data||[];}const activeCounts=S.enrollments.filter(e=>e.status==='active').map(e=>Number(e.total_sessions)||0).filter(n=>n>0);if(activeCounts.length)
      $('stSummary').innerHTML='<div id="stPublicLinkBox" class="st-public-link"><div class="st-actions"><button type="button" class="st-btn primary" id="stPublicLinkBtn">🔗 ساخت لینک اختصاصی</button><span id="stPublicLinkStatus" class="st-muted">در حال بررسی لینک…</span></div></div>';
      loadStudentPublicLink();loadStudentPushCount(id);
      $('stTerm').innerHTML='<option value="">انتخاب ترم…</option>'+S.terms.map(t=>'<option value="'+t.id+'">'+esc(String(t.term_name||'').replace(/^ترم\s*/,''))+'</option>').join('');
      say('پرونده هنرجو دریافت شد؛ ترم‌های قبلی: '+fa(S.terms.length));
    }catch(e){say(e.message||'دریافت پرونده ناموفق بود.',true);}
  }

  function studentShortUrl(code){return 'https://gym20.ir/s/'+encodeURIComponent(code);}
  async function renderStudentPublicLink(code){
    const box=$('stPublicLinkBox');if(!box)return;
    if(!code){box.innerHTML='<div class="st-actions"><button type="button" class="st-btn primary" id="stPublicLinkBtn">🔗 ساخت لینک اختصاصی</button><span id="stPublicLinkStatus" class="st-muted">هنوز لینکی ساخته نشده است.</span></div>';return;}
    const url=studentShortUrl(code);
    box.innerHTML='<div class="st-short-url" dir="ltr">'+esc(url)+'</div><div class="st-actions st-public-actions"><button type="button" class="st-btn" id="stCopyPublicLinkBtn">کپی لینک</button><a class="st-btn" id="stSharePublicLinkBtn" target="_blank" rel="noopener">ارسال در تلگرام</a><button type="button" class="st-btn" id="stRenewPublicLinkBtn">لینک جدید</button><a class="st-btn" id="stViewPublicLinkBtn" target="_blank" rel="noopener">کارت جلسات</a></div><div id="stPublicLinkStatus" class="st-muted"></div>';
    $('stSharePublicLinkBtn').href='https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent('برنامه کلاس‌های GYM20 شما');
    $('stViewPublicLinkBtn').href=url;
    $('stCopyPublicLinkBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url);$('stPublicLinkStatus').textContent='لینک کپی شد.';}catch(_){$('stPublicLinkStatus').textContent='کپی خودکار در دسترس نیست؛ آدرس بالا را انتخاب و کپی کن.';}});
    $('stRenewPublicLinkBtn').addEventListener('click',makeStudentPublicLink);
  }
  async function loadStudentPublicLink(){
    try{const {data,error}=await db().rpc('get_student_public_link',{p_student_id:S.studentId});if(error)throw error;await renderStudentPublicLink(typeof data==='string'?data:null);}
    catch(e){const status=$('stPublicLinkStatus');if(status)status.textContent='وضعیت لینک دریافت نشد: '+(e.message||'خطا');}
  }
  async function makeStudentPublicLink(){
    const btn=$('stPublicLinkBtn')||$('stRenewPublicLinkBtn');
    const status=$('stPublicLinkStatus');
    if(!S.studentId||!btn)return;
    btn.disabled=true;if(status)status.textContent='در حال ساخت لینک امن…';
    try{
      const {data,error}=await db().rpc('create_student_public_link',{p_student_id:S.studentId});
      if(error)throw error;
      const code=typeof data==='string'?data:Array.isArray(data)?data[0]:data?.create_student_public_link;
      if(!code||!/^[0-9a-f]{12}$/.test(code))throw Error('کد کوتاه امن از سرور دریافت نشد.');
      await renderStudentPublicLink(code);
      try{await navigator.clipboard.writeText(studentShortUrl(code));$('stPublicLinkStatus').textContent='لینک کوتاه ساخته و کپی شد.';}catch(_){$('stPublicLinkStatus').textContent='لینک کوتاه ساخته شد.';}
    }catch(e){if(status)status.textContent=e.message||'ساخت لینک ناموفق بود.';btn.disabled=false;}
  }

  function stageNewTerm(selectedDates){
    try{
      const activeEnrollments=S.enrollments.filter(e=>e.status==='active'||e.status==='paused'),ids=activeEnrollments.map(x=>x.id);
      if(!ids.length)throw Error('برای این هنرجو سبک فعالی در ثبت‌نام اولیه پیدا نشد.');
      const startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value);
      if(!Array.isArray(selectedDates)||!selectedDates.length)throw Error('حداقل یک تاریخ جلسه انتخاب کن.');
      if(!startDate||!endDate||endDate<startDate)throw Error('تاریخ شروع و پایان ترم را درست انتخاب کن.');
      if(new Set(selectedDates).size!==selectedDates.length)throw Error('تاریخ تکراری انتخاب شده است.');
      const currentPublishedId=S.term?.published_version_id||null,occupiedDates=new Set(S.allPublishedSessions.filter(x=>x.schedule_version_id!==currentPublishedId).map(x=>localDate(x.starts_at)));
      if(selectedDates.some(d=>occupiedDates.has(d)))throw Error('برای بعضی از تاریخ‌ها در ترم دیگری جلسه ثبت شده است؛ تاریخ‌های تکراری را انتخاب نکن.');
      if(selectedDates.some(d=>d<startDate||d>endDate))throw Error('همه تاریخ‌ها باید داخل بازه شروع و پایان ترم باشند.');
      S.termId='';S.term=null;S.draftId='';S.publishedId=null;S.publishedReadOnly=false;S.manualDates=selectedDates.slice().sort();
      const termSelect=$('stTerm');if(termSelect){termSelect.value='';const wrap=termSelect.closest('.st-custom-select');if(wrap)syncCustomSelect(wrap);}
      const mins=60;
      S.rows=S.manualDates.map((d,i)=>{const startAt=localISO(d,'18:00');return {enrollment_ids:ids,session_number:i+1,starts_at:startAt,ends_at:new Date(new Date(startAt).getTime()+mins*60000).toISOString(),venue:null,coach_name:'هانیه',notes:null};});
      $('stManualCount').textContent=fa(S.rows.length)+' جلسه انتخاب شده';
      $('stPublish').hidden=false;$('stPublish').textContent='ثبت نهایی';$('stSchedule').classList.remove('st-hide');
      drawDraft();say('جلسات آماده‌اند؛ ساعت و مربی را بررسی کن و فقط «ثبت نهایی» را بزن.');
    }catch(e){say(e.message||'آماده‌سازی ترم ناموفق بود.',true);}
  }

    async function deleteSelectedTerm(){
    const id=S.termId,term=S.terms.find(t=>t.id===id);
    if(!id||!term){say('ابتدا ترم موردنظر را انتخاب کن.',true);return;}
    const name=term.term_name||'این ترم';
    if(!confirm('هشدار: با حذف «'+name+'»، تمام جلسات، برنامه‌های منتشرشده و پیش‌نویس‌ها و سوابق حضور و غیاب همین ترم نیز حذف می‌شوند. ثبت‌نام سبک‌ها و پرونده هنرجو حذف نمی‌شود. آیا مطمئنی؟'))return;
    const btn=$('stDeleteTerm');btn.disabled=true;
    try{
      say('در حال حذف ترم و اطلاعات وابسته…');
      const {data:sessions,error:se}=await db().from('class_sessions').select('id').eq('term_id',id);if(se)throw se;
      const sessionIds=(sessions||[]).map(x=>x.id);
      if(sessionIds.length){const {error}=await db().from('attendance').delete().in('session_id',sessionIds);if(error)throw error;}
      const {error:ce}=await db().from('class_sessions').delete().eq('term_id',id);if(ce)throw ce;
      const {error:ue}=await db().from('student_terms').update({published_version_id:null}).eq('id',id);if(ue)throw ue;
      const {error:ve}=await db().from('term_schedule_versions').delete().eq('term_id',id);if(ve)throw ve;
      const {error:te}=await db().from('student_terms').delete().eq('id',id);if(te)throw te;
      S.termId='';S.term=null;S.draftId='';S.rows=[];S.publishedId=null;
      await loadStudent(S.studentId);$('stTerm').value='';$('stSchedule').classList.add('st-hide');
      say('ترم «'+name+'» و تمام جلسات و سوابق حضور و غیاب وابسته حذف شد.');
    }catch(e){say(e.message||'حذف ترم انجام نشد.',true);}
    finally{btn.disabled=!S.termId;}
  }

  async function loadTerm(id){
    S.manualDates=[];S.termId=id;S.term=S.terms.find(x=>x.id===id)||null;S.reminderDraft={};
    S.draftId='';S.rows=[];S.publishedId=null;S.publishedReadOnly=false;
    if(S.term){$('stStart').value=jalaliInput(S.term.start_date||'');$('stEnd').value=jalaliInput(S.term.end_date||'');syncTermName();}
    $('stSchedule').classList.toggle('st-hide',!id);
    $('stManualCalendar').textContent='▦ انتخاب جلسات از تقویم';
    setTimeout(()=>enhanceAllSelects($('studentTermsTab')),0);
    if(!id){$('stPublish').hidden=false;$('stManualCalendar').hidden=false;return;}
    try{
      const {data,error}=await db().from('term_schedule_versions').select('id,status,version_number').eq('term_id',id).order('created_at',{ascending:false});if(error)throw error;
      const vs=data||[],pub=vs.find(v=>v.status==='published');
      S.publishedId=pub?.id||S.term?.published_version_id||null;
      S.draftId=vs.find(v=>v.status==='draft')?.id||'';
      // Always prepare edits in a separate draft. The database RPC clones the
      // published sessions and their style links atomically under owner RLS.
      if(S.publishedId){
        say('در حال آماده‌سازی نسخه قابل ویرایش…');
        const {data:editDraft,error:editDraftError}=await db().rpc('create_term_edit_draft',{p_term_id:id});
        if(editDraftError)throw editDraftError;
        S.draftId=editDraft;
      }
      if(S.draftId){
        S.publishedReadOnly=false;
        $('stPublish').hidden=false;$('stPublish').textContent='ثبت نهایی و انتشار تغییرات';
        $('stManualCalendar').hidden=false;
        await loadDraftRows();await renderBuilder();
        say(S.publishedId?'نسخه ویرایشی آماده است؛ تغییرات را انجام بده و «ثبت نهایی و انتشار تغییرات» را بزن.':'پیش‌نویس ترم آماده و قابل ویرایش است.');
      }else if(S.publishedId){
        throw Error('نسخه ویرایشی این ترم آماده نشد؛ دوباره ترم را انتخاب کن یا وضعیت دسترسی مدیر را بررسی کن.');
      }else{
        $('stPublish').hidden=true;$('stManualCalendar').hidden=false;
        $('stDraftTable').innerHTML='<p class="st-muted">برای این ترم هنوز برنامه‌ای ثبت نشده است.</p>';
        $('stSchedule').classList.remove('st-hide');
      }
    }catch(e){say(e.message||'دریافت ترم ناموفق بود.',true);}
  }
  // Published schedules are never edited in place. This renderer now always
  // uses the separate draft editor created by create_term_edit_draft().
  function drawPublishedSessions(){
    S.publishedReadOnly=false;
    drawDraft();
  }

  async function loadDraftRows(){
    if(!S.draftId)return;const {data,error}=await db().from('class_sessions').select('id,course_id,enrollment_id,session_number,starts_at,ends_at,venue,coach_name,notes,courses(name)').eq('schedule_version_id',S.draftId).order('starts_at');if(error)throw error;S.rows=(data||[]).map(x=>({...x,enrollment_ids:x.enrollment_id?[x.enrollment_id]:[]}));if(S.rows.length){const rr=await db().from('class_session_styles').select('session_id,enrollment_id').in('session_id',S.rows.map(x=>x.id));if(rr.error)throw rr.error;rr.data.forEach(z=>{const row=S.rows.find(x=>x.id===z.session_id);if(row)row.enrollment_ids.push(z.enrollment_id);});}normalizeDraftSessionNumbers();
  }
  async function renderBuilder(){
    const {data:links,error}=await db().from('term_enrollments').select('enrollment_id').eq('term_id',S.termId);if(error)throw error;
    const ids=(links||[]).map(x=>x.enrollment_id);S.termEnrollmentIds=ids;
    $('stManual')?.classList.remove('st-hide');
    $('stStart').value=jalaliInput(S.term.start_date||'');$('stEnd').value=jalaliInput(S.term.end_date||'');syncTermName();
    drawDraft();
  }
  function sessionState(r){
    const now=Date.now(),start=Date.parse(r?.starts_at||''),end=Date.parse(r?.ends_at||'');
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {label:'زمان نامشخص',cls:'future'};
    if(start<=now&&now<end)return {label:'در حال برگزاری',cls:'live'};
    if(end<=now)return {label:'جلسه گذشته',cls:'past'};
    // Determine the single next session across every published term for this student,
    // not only inside the term currently open in the editor.
    const otherPublished=S.allPublishedSessions.filter(x=>x.schedule_version_id!==S.term?.published_version_id);
    const timeline=otherPublished.concat(S.rows);
    const hasLiveSession=timeline.some(x=>{const a=Date.parse(x?.starts_at||''),b=Date.parse(x?.ends_at||'');return Number.isFinite(a)&&Number.isFinite(b)&&a<=now&&now<b;});
    const next=hasLiveSession?null:(timeline.filter(x=>{const a=Date.parse(x?.starts_at||''),b=Date.parse(x?.ends_at||'');return Number.isFinite(a)&&Number.isFinite(b)&&a>now&&b>now;}).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at))[0]||null);
    if(next&&(next===r||(next.id&&r.id&&next.id===r.id)))return {label:'جلسه آینده',cls:'next'};
    return {label:'جلسه برگزار نشده',cls:'future'};
  }
  function refreshDraftSessionStates(){
    const root=$('stDraftTable');if(!root)return;
    root.querySelectorAll('.st-session-card[data-session-number]').forEach(card=>{
      const n=Number(card.dataset.sessionNumber),row=S.rows.find(x=>Number(x.session_number)===n);if(!row)return;
      const state=sessionState(row),badge=card.querySelector('.st-session-state');
      card.className='st-session-card '+state.cls;
      if(badge){badge.className='st-session-state '+state.cls;badge.textContent=state.label;}
    });
  }
  function openSessionTimePicker(input){
    document.querySelector('.st-time-picker-backdrop')?.remove();
    const current=enDigits(input.value||'18:00').split(':'),initialHour=Math.max(0,Math.min(23,Number(current[0])||0)),initialMinute=Math.max(0,Math.min(59,Number(current[1])||0));
    let hour=initialHour,minute=initialMinute,frames={hour:0,minute:0};
    const pad=n=>String(n).padStart(2,'0');
    const overlay=document.createElement('div');overlay.className='st-time-picker-backdrop';
    const makeWheel=(key,label,max,value)=>{const count=max+1;return '<div class="st-time-slider" data-kind="'+key+'"><div class="st-time-slider-head"><label>'+label+'</label><output class="st-time-slider-value">'+pad(value)+'</output></div><div class="st-time-wheel" tabindex="0" role="listbox" aria-label="'+(key==='hour'?'انتخاب ساعت':'انتخاب دقیقه')+'"><div class="st-time-wheel-spacer" aria-hidden="true"></div>'+Array.from({length:count*5},(_,i)=>{const n=i%count;return '<div class="st-time-wheel-item'+(i===count*2+value?' selected':'')+'" data-value="'+n+'" role="option" aria-selected="'+(n===value?'true':'false')+'">'+pad(n)+'</div>';}).join('')+'<div class="st-time-wheel-spacer" aria-hidden="true"></div><div class="st-time-wheel-indicator" aria-hidden="true"></div></div></div>';};
    overlay.innerHTML='<section class="st-time-picker" role="dialog" aria-modal="true" aria-label="تنظیم ساعت کلاس"><header><span>تنظیم ساعت کلاس</span><button type="button" class="st-time-picker-close" aria-label="بستن">×</button></header><div class="st-time-picker-preview"><small>CLASS TIME</small><strong class="st-time-preview-value">'+pad(hour)+':'+pad(minute)+'</strong></div><div class="st-time-picker-controls">'+makeWheel('hour','HOUR',23,hour)+makeWheel('minute','MINUTE',59,minute)+'</div></section>';
    const body=document.body,doc=document.documentElement,oldBodyOverflow=body.style.overflow,oldDocOverflow=doc.style.overflow;
    let onKey;
    const commitTime=()=>{input.value=pad(hour)+':'+pad(minute);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
    const close=()=>{if(!overlay.isConnected)return;commitTime();overlay.remove();body.style.overflow=oldBodyOverflow;doc.style.overflow=oldDocOverflow;if(onKey)document.removeEventListener('keydown',onKey);};
    const syncPreview=()=>{overlay.querySelector('.st-time-preview-value').textContent=pad(hour)+':'+pad(minute);};
    const setValue=(key,value)=>{
      const max=key==='hour'?23:59; if(key==='hour')hour=Math.max(0,Math.min(max,value));else minute=Math.max(0,Math.min(max,value));
      const wheel=overlay.querySelector('[data-kind="'+key+'"] .st-time-wheel'),chosen=key==='hour'?hour:minute,items=wheel.querySelectorAll('.st-time-wheel-item'),center=Math.round(wheel.scrollTop/26);
      overlay.querySelector('[data-kind="'+key+'"] .st-time-slider-value').textContent=pad(chosen);
      items.forEach((el,i)=>{const distance=Math.abs(i-center),active=distance<.55&&Number(el.dataset.value)===chosen;el.classList.toggle('selected',active);el.setAttribute('aria-selected',active?'true':'false');el.style.opacity=String(Math.max(.22,1-distance*.24));el.style.filter=distance<1?'blur(0)':'blur(.15px)';});
      syncPreview();
      input.value=pad(hour)+':'+pad(minute);
      input.dispatchEvent(new Event('input',{bubbles:true}));
    };
    ['hour','minute'].forEach(key=>{
      const wheel=overlay.querySelector('[data-kind="'+key+'"] .st-time-wheel');
      wheel.addEventListener('scroll',()=>{
        if(frames[key])cancelAnimationFrame(frames[key]);
        frames[key]=requestAnimationFrame(()=>{const count=key==='hour'?24:60,cycle=count*26,raw=Math.round(wheel.scrollTop/26),next=((raw%count)+count)%count;setValue(key,next);
          if(wheel.scrollTop<cycle){wheel.scrollTop+=cycle*2;}else if(wheel.scrollTop>cycle*4){wheel.scrollTop-=cycle*2;}
        });
      },{passive:true});
      wheel.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='PageDown'||e.key==='PageUp'){e.preventDefault();const step=e.key.startsWith('Page')?5:1,current=key==='hour'?hour:minute,next=current+(e.key==='ArrowUp'||e.key==='PageUp'?-step:step);setValue(key,next);wheel.scrollTo({top:(2*(key==='hour'?24:60)+(key==='hour'?hour:minute))*26,behavior:'smooth'});}});
    });
    overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.st-time-picker-close'))close();});
    onKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onKey);
    body.style.overflow='hidden';doc.style.overflow='hidden';document.body.appendChild(overlay);
    requestAnimationFrame(()=>{const hw=overlay.querySelector('[data-kind="hour"] .st-time-wheel'),mw=overlay.querySelector('[data-kind="minute"] .st-time-wheel');hw.scrollTop=(48+hour)*26;mw.scrollTop=(120+minute)*26;setValue('hour',hour);setValue('minute',minute);});
  }
  function drawDraft(){
    const sorted=S.rows.slice().sort((a,b)=>localDate(a.starts_at).localeCompare(localDate(b.starts_at))||Date.parse(a.starts_at)-Date.parse(b.starts_at)||Number(a.session_number)-Number(b.session_number));
    if(!sorted.length){$('stDraftTable').innerHTML='<p class="st-muted">هنوز جلسه‌ای برای این ترم ثبت نشده است؛ از دکمه «انتخاب جلسات از تقویم» بالای صفحه استفاده کن.</p>';return;}
    $('stDraftTable').innerHTML='<div class="st-sessions-grid">'+sorted.map((r,i)=>{
      const state=sessionState(r),isoDate=localDate(r.starts_at),weekday=weekdayFa(isoDate),n=r.session_number;
      return '<article data-session-number="'+n+'" class="st-session-card '+state.cls+'"><div class="st-session-head"><button type="button" class="st-session-calendar" data-calendar="stSessionDate'+n+'" aria-label="ویرایش تاریخ جلسه '+fa(n)+'" title="ویرایش تاریخ">▦</button><strong>جلسه <span class="st-session-number">'+enNum(n)+'</span></strong><span class="st-session-state '+state.cls+'">'+state.label+'</span><button class="st-btn danger st-row-delete" type="button" data-del="'+i+'" aria-label="حذف جلسه '+fa(n)+'" title="حذف جلسه"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div class="st-session-fields st-session-fields-modern"><div class="st-session-weekday" aria-label="روز">'+esc(weekday)+'</div><label class="st-session-field">تاریخ<input id="stSessionDate'+n+'" class="st-table-input st-date-input" data-date="'+n+'" value="'+jalaliInput(isoDate)+'" data-jalali-date aria-label="تاریخ جلسه"></label><label class="st-session-field">ساعت کلاس<input class="st-table-input st-time-input" type="text" lang="en" dir="ltr" inputmode="none" autocomplete="off" maxlength="5" readonly aria-haspopup="dialog" placeholder="22:57" data-time="'+n+'" value="'+localTime(r.starts_at)+'" aria-label="ساعت کلاس"></label><label class="st-session-field">مربی<input type="hidden" data-coach="'+n+'" value="'+esc(r.coach_name==='بهروز'?'بهروز':'هانیه')+'"><button type="button" class="st-coach-swipe" data-coach-swipe="'+n+'" aria-label="تغییر مربی با کشیدن به چپ یا راست"><span class="st-coach-swipe-name">'+esc(r.coach_name==='بهروز'?'بهروز':'هانیه')+'</span></button></label></div></article>';
    }).join('')+'</div>';
    bindJalaliDates($('stDraftTable'));
    initTermCalendars($('stDraftTable'));
    enhanceAllSelects($('stDraftTable'));
    $('stDraftTable').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const r=sorted[Number(b.dataset.del)];S.rows=S.rows.filter(x=>x!==r);normalizeDraftSessionNumbers();drawDraft();}));
    const syncSessionEditor=e=>{const input=e.target;if(!input?.matches?.('[data-date],[data-time]'))return;const n=Number(input.dataset.date||input.dataset.time),row=S.rows.find(x=>Number(x.session_number)===n);if(!row)return;const dateInput=$('stDraftTable').querySelector('[data-date="'+n+'"]'),timeInput=$('stDraftTable').querySelector('[data-time="'+n+'"]');timeInput.value=enDigits(timeInput.value||'');const dateParts=enDigits(dateInput?.value||'').trim().split('/'),timeParts=(timeInput?.value||'').split(':');if(!dateInput||!timeInput||dateParts.length!==3||dateParts.some((v,i)=>v.length!==(i===0?4:2)||!/^\d+$/.test(v))||timeParts.length<2||timeParts[0].length!==2||timeParts[1].length!==2)return;try{const date=gregorianInput(dateInput.value),start=localISO(date,timeInput.value),mins=rowMinutes(row);row.starts_at=start;row.ends_at=new Date(new Date(start).getTime()+mins*60000).toISOString();const card=input.closest('.st-session-card'),weekday=card?.querySelector('.st-session-weekday');if(weekday)weekday.textContent=weekdayFa(date);if(e.type==='change'&&input.matches('[data-date]')){normalizeDraftSessionNumbers();drawDraft();return;}refreshDraftSessionStates();}catch(err){if(e.type!=='input')say(err.message||'ثبت زمان جلسه ناموفق بود.',true);}};
    const editorRoot=$('stDraftTable');if(!editorRoot.dataset.sessionEditorBound){editorRoot.dataset.sessionEditorBound='1';editorRoot.addEventListener('input',syncSessionEditor);editorRoot.addEventListener('change',syncSessionEditor);editorRoot.addEventListener('blur',syncSessionEditor,true);
      // Delegated time-picker trigger: reliably works for every session card, including dynamically redrawn rows.
      editorRoot.addEventListener('click',e=>{const input=e.target.closest('[data-time]');if(!input||!editorRoot.contains(input))return;e.preventDefault();e.stopPropagation();openSessionTimePicker(input);});
      // Coach selector is intentionally swipe-based instead of a dropdown.
      let coachSwipe=null;
      editorRoot.addEventListener('pointerdown',e=>{const control=e.target.closest('[data-coach-swipe]');if(!control)return;coachSwipe={control,x:e.clientX,y:e.clientY,pointerId:e.pointerId};control.setPointerCapture?.(e.pointerId);});
      editorRoot.addEventListener('pointerup',e=>{if(!coachSwipe||coachSwipe.pointerId!==e.pointerId)return;const {control,x,y}=coachSwipe;coachSwipe=null;const dx=e.clientX-x,dy=e.clientY-y;if(Math.abs(dx)<24||Math.abs(dx)<Math.abs(dy))return;const n=control.dataset.coachSwipe,input=editorRoot.querySelector('[data-coach="'+n+'"]'),label=control.querySelector('.st-coach-swipe-name');if(!input||!label)return;const next=input.value==='هانیه'?'بهروز':'هانیه';input.value=next;label.textContent=next;control.classList.add('swiped');setTimeout(()=>control.classList.remove('swiped'),260);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
      editorRoot.addEventListener('pointercancel',()=>{coachSwipe=null;});
      editorRoot.addEventListener('click',e=>{const control=e.target.closest('[data-coach-swipe]');if(!control||control.classList.contains('swiped')){if(control)control.classList.remove('swiped');return;}const n=control.dataset.coachSwipe,input=editorRoot.querySelector('[data-coach="'+n+'"]'),label=control.querySelector('.st-coach-swipe-name');if(!input||!label)return;const next=input.value==='هانیه'?'بهروز':'هانیه';input.value=next;label.textContent=next;input.dispatchEvent(new Event('change',{bubbles:true}));});
    }
  }

  function collectDraftPayload(){
    const seen=new Set();
    return S.rows.map(r=>{
      const n=Number(r.session_number),key=String(n);
      if(!Number.isInteger(n)||n<1||n>1000||seen.has(key))throw Error('شماره جلسات باید مثبت و غیرتکراری باشد.');
      seen.add(key);
      const d=gregorianInput($('stDraftTable').querySelector('[data-date="'+n+'"]')?.value||jalaliInput(localDate(r.starts_at)));
      const t=$('stDraftTable').querySelector('[data-time="'+n+'"]')?.value||localTime(r.starts_at);
      const mins=rowMinutes(r);
      const coachInput=$('stDraftTable').querySelector('[data-coach="'+n+'"]');
      if(!d||!t)throw Error('تاریخ یا ساعت یکی از جلسات معتبر نیست.');
      const start=localISO(d,t);
      return {enrollment_ids:r.enrollment_ids||[],session_number:n,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:r.venue||null,coach_name:coachInput?coachInput.value.trim():(r.coach_name||''),notes:r.notes||null};
    });
  }
  function makeWeekly(pattern){
    try{const startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value),t=$('stWeeklyTime').value,n=Number(S.term?.total_sessions)||8,mins=Number(S.term?.duration_minutes)||60;if(!startDate||!endDate||!t)throw Error('تاریخ شروع، پایان ترم و ساعت کلاس را بررسی کن.');
      const id=pattern==='even'?'stEvenDays':'stOddDays',allowed=Array.from($(id).querySelectorAll('input:checked')).map(x=>Number(x.value));if(!allowed.length)throw Error('حداقل یک روز را انتخاب کن.');
      const selected=[];let cursor=new Date(startDate+'T12:00:00'),last=new Date(endDate+'T12:00:00');while(cursor<=last&&selected.length<n){const d=cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0')+'-'+String(cursor.getDate()).padStart(2,'0'),weekday=(cursor.getDay()+1)%7;if(allowed.includes(weekday))selected.push(d);cursor.setDate(cursor.getDate()+1);}
      if(selected.length<n)throw Error('در بازه ترم فقط '+selected.length+' جلسه پیدا شد؛ پایان ترم را افزایش بده یا روزهای بیشتری انتخاب کن.');
      S.rows=selected.map((d,i)=>{const start=localISO(d,t);return {enrollment_ids:[],session_number:i+1,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:null,coach_name:null,notes:null};});drawDraft();say(fa(n)+' جلسه ساخته شد؛ ساعت و مربی هر جلسه را می‌توانی جداگانه تنظیم کنی.');
    }catch(e){say(e.message,true);}
  }
  function initManualMultiCalendar(root){
    const openCalendar=trigger=>{
      trigger.addEventListener('click',()=>{
        const startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value);
        const storedStart=String(S.term?.start_date||'').slice(0,10),storedEnd=String(S.term?.end_date||'').slice(0,10);
        const addingToExisting=Boolean(S.termId&&startDate===storedStart&&endDate===storedEnd);
        const rangeChanged=Boolean(S.termId&&!addingToExisting);
        if(!startDate||!endDate||endDate<startDate){say('ابتدا تاریخ شروع و پایان ترم را درست انتخاب کن.',true);return;}
        if(addingToExisting&&!S.draftId){say('این ترم منتشرشده است و در این بخش فقط نمایش داده می‌شود.',true);return;}
        document.querySelectorAll('.st-jcal').forEach(x=>x.remove());
        const pop=document.createElement('div');pop.className='st-jcal';document.body.appendChild(pop);
        const startJ=enDigits(jalaliInput(startDate)).split('/').map(Number),endJ=enDigits(jalaliInput(endDate)).split('/').map(Number);
        let jy=startJ[0],jm=startJ[1];const chosen=new Set(),currentPublishedId=S.term?.published_version_id||null,otherPublishedDates=S.allPublishedSessions.filter(x=>x.schedule_version_id!==currentPublishedId).map(x=>localDate(x.starts_at)),existingDates=new Set((addingToExisting?S.rows.map(r=>localDate(r.starts_at)):[]).concat(otherPublishedDates));
        if(rangeChanged)say('بازه تاریخ با ترم انتخاب‌شده متفاوت است؛ جلسات جدید به‌صورت یک ترم جداگانه ساخته می‌شوند.');
        const minKey=startDate,maxKey=endDate;
        const draw=()=>{
          const g=jalaliToGregorian(jy,jm,1),next=jm===12?jalaliToGregorian(jy+1,1,1):jalaliToGregorian(jy,jm+1,1),first=new Date(g+'T12:00:00'),days=Math.round((new Date(next+'T12:00:00')-first)/86400000),offset=(first.getDay()+1)%7,monthKey=jy*12+jm,minMonth=startJ[0]*12+startJ[1],maxMonth=endJ[0]*12+endJ[1];
          pop.innerHTML='<div class="st-jcal-head"><button type="button" data-prev '+(monthKey<=minMonth?'disabled':'')+'>‹</button><b>'+['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'][jm-1]+' '+fa(jy)+'</b><button type="button" data-next '+(monthKey>=maxMonth?'disabled':'')+'>›</button></div><div class="st-muted" style="text-align:center;margin-bottom:6px">بازه ترم: '+jalaliInput(startDate)+' تا '+jalaliInput(endDate)+' · انتخاب آزاد جلسات</div><div class="st-jcal-grid">'+['ش','ی','د','س','چ','پ','ج'].map(x=>'<span>'+x+'</span>').join('')+Array(offset).fill('<i></i>').join('')+Array.from({length:days},(_,i)=>{const d=jy+'/'+String(jm).padStart(2,'0')+'/'+String(i+1).padStart(2,'0'),iso=gregorianInput(d),inRange=iso>=minKey&&iso<=maxKey,valid=inRange&&!existingDates.has(iso),selected=chosen.has(iso),inTable=existingDates.has(iso),boundary=iso===minKey||iso===maxKey;return '<button type="button" class="st-jcal-day '+(iso===minKey?'term-range-start ':'')+(iso===maxKey?'term-range-end ':'')+(boundary?'term-boundary ':'')+(inTable?'session-existing ':'')+(selected?'selected':'')+'" data-day="'+(i+1)+'" '+(!valid&&!selected?'disabled':'')+' title="'+(iso===minKey?'شروع ترم':iso===maxKey?'پایان ترم':'')+'">'+fa(i+1)+'</button>';}).join('')+'</div><div class="st-actions"><button type="button" class="st-btn primary" data-confirm '+(!chosen.size?'disabled':'')+'>'+ 'تأیید تاریخ‌های انتخاب‌شده'+' ('+fa(chosen.size)+')</button></div>';
          pop.querySelector('[data-prev]').onclick=()=>{if(jm>1)jm--;else{jm=12;jy--;}draw();};
          pop.querySelector('[data-next]').onclick=()=>{if(jm<12)jm++;else{jm=1;jy++;}draw();};
          pop.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const d=jy+'/'+String(jm).padStart(2,'0')+'/'+String(Number(b.dataset.day)).padStart(2,'0'),iso=gregorianInput(d);if(chosen.has(iso))chosen.delete(iso);else if(iso>=minKey&&iso<=maxKey&&!existingDates.has(iso))chosen.add(iso);draw();});
          pop.querySelector('[data-confirm]').onclick=async()=>{
            if(!chosen.size)return;const dates=Array.from(chosen).sort();pop.remove();
            if(!addingToExisting){stageNewTerm(dates);return;}
            const ids=S.termEnrollmentIds.length?S.termEnrollmentIds:S.enrollments.filter(e=>e.status==='active').map(e=>e.id),mins=Number(S.term?.duration_minutes)||60;
            dates.forEach(d=>{const starts=localISO(d,'18:00');S.rows.push({enrollment_ids:ids,session_number:S.rows.length+1,starts_at:starts,ends_at:new Date(new Date(starts).getTime()+mins*60000).toISOString(),venue:null,coach_name:null,notes:null});});
            normalizeDraftSessionNumbers();drawDraft();say(fa(dates.length)+' جلسه به ترم موجود اضافه شد؛ ساعت و مربی هر جلسه را تنظیم کن و ثبت نهایی را بزن.');
          };
        };
        const rect=trigger.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-268,rect.left+rect.width/2-126))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-390,rect.bottom+5))+'px';draw();
        const close=e=>{if(!pop.contains(e.target)&&e.target!==trigger){pop.remove();document.removeEventListener('pointerdown',close);}};
        setTimeout(()=>document.addEventListener('pointerdown',close),0);
      });
    };
    const create=$('stManualCalendar');if(create)openCalendar(create);
  }
  async function persistDraft(){
    if(!S.draftId)throw Error('پیش‌نویس فعال وجود ندارد.');
    const payload=collectDraftPayload();if(!payload.length)throw Error('برای این ترم هنوز جلسه‌ای از تقویم انتخاب نشده است.');
    const {data,error}=await db().rpc('replace_term_draft_sessions',{p_version_id:S.draftId,p_sessions:payload});if(error)throw error;
    S.term.total_sessions=payload.length;await loadDraftRows();drawDraft();return data;
  }
  async function saveDraft(){
    try{say('در حال ذخیره پیش‌نویس…');const count=await persistDraft();say(fa(count)+' جلسه ذخیره شد. تعداد جلسات از روی برنامه شما ثبت شد؛ سبک‌ها و مدت‌ها مستقل هستند.');}
    catch(e){say(e.message||'ذخیره ناموفق بود.',true);}
  }
  async function publish(){
    try{
      if(S.publishedReadOnly)throw Error('این ترم قبلاً منتشر شده و فقط برای مشاهده است.');
      if(!S.termId){
        if(!S.manualDates.length||!S.rows.length)throw Error('ابتدا تاریخ‌های جلسات را از تقویم انتخاب کن.');
        const startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value);
        if(!startDate||!endDate||endDate<startDate)throw Error('تاریخ شروع و پایان ترم را درست انتخاب کن.');
        const p=enDigits($('stStart').value).split('/').map(Number),months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        const termName='ترم '+months[p[1]-1]+' '+p[0];
        const exists=await db().from('student_terms').select('id,term_name').eq('student_id',S.studentId).eq('term_name',termName);if(exists.error)throw exists.error;
        const duplicate=(exists.data||[]).find(t=>String(t.term_name||'').trim()===termName);
        if(duplicate){await loadStudent(S.studentId);$('stTerm').value=duplicate.id;await loadTerm(duplicate.id);throw Error('این ترم از قبل وجود دارد؛ از فهرست ترم‌ها انتخابش کن.');}
        const ids=S.enrollments.filter(e=>e.status==='active'||e.status==='paused').map(e=>e.id);
        if(!ids.length)throw Error('برای این هنرجو سبک فعالی پیدا نشد.');
        say('در حال ثبت ترم و برنامه جلسات…');
        const created=await db().rpc('create_student_term',{p_student_id:S.studentId,p_term_name:termName,p_start_date:startDate,p_end_date:endDate,p_total_sessions:S.rows.length,p_duration_minutes:60,p_default_venue:null,p_schedule_mode:'manual',p_enrollment_ids:ids});
        if(created.error)throw created.error;const x=Array.isArray(created.data)?created.data[0]:created.data;
        if(!x?.term_id||!x?.draft_version_id)throw Error('ترم یا پیش‌نویس برنامه ساخته نشد.');
        S.termId=x.term_id;S.draftId=x.draft_version_id;
        const payload=collectDraftPayload();
        const saved=await db().rpc('replace_term_draft_sessions',{p_version_id:S.draftId,p_sessions:payload});if(saved.error)throw saved.error;
        const pub=await db().rpc('publish_term_schedule',{p_term_id:S.termId,p_version_id:S.draftId});if(pub.error)throw pub.error;
        await loadStudent(S.studentId);
        S.termId='';S.term=null;S.draftId='';S.rows=[];S.manualDates=[];S.publishedId=null;S.publishedReadOnly=false;
        const termSelect=$('stTerm');if(termSelect){termSelect.value='';const wrap=termSelect.closest('.st-custom-select');if(wrap)syncCustomSelect(wrap);}
        $('stDeleteTerm').disabled=true;$('stSchedule').classList.add('st-hide');$('stManualCalendar').hidden=false;$('stManualCalendar').textContent='▦ انتخاب جلسات از تقویم';$('stPublish').hidden=false;$('stPublish').textContent='ثبت نهایی';
        $('stDraftTable').innerHTML='';$('stManualCount').textContent='';
        say('ثبت شد');
        return;
      }
      if(!S.draftId)throw Error('برای این ترم پیش‌نویس قابل ثبت وجود ندارد.');
      say('در حال ذخیره و انتشار برنامه…');await persistDraft();
      const {error}=await db().rpc('publish_term_schedule',{p_term_id:S.termId,p_version_id:S.draftId});if(error)throw error;
      const termId=S.termId;await loadStudent(S.studentId);$('stTerm').value=termId;await loadTerm(termId);say('ثبت شد');
    }catch(e){say(e.message||'ثبت نشد',true);}
  }
  async function loadAttendance(){
    const box=$('stAttendance');if(!S.publishedId){box.textContent='برای این ترم هنوز برنامه‌ای منتشر نشده است.';return;}
    try{const {data,error}=await db().from('class_sessions').select('id,session_number,starts_at,ends_at,venue').eq('schedule_version_id',S.publishedId).order('starts_at');if(error)throw error;S.sessions=data||[];const ids=S.sessions.map(x=>x.id);let ats=[];
      if(ids.length){const r=await db().from('attendance').select('session_id,status').in('session_id',ids).eq('student_id',S.studentId);if(r.error)throw r.error;ats=r.data||[];}
      const map={};ats.forEach(a=>map[a.session_id]=a.status);
      if(!S.sessions.length){box.textContent='جلسه منتشرشده‌ای پیدا نشد.';return;}
      box.innerHTML='<table class="st-table"><thead><tr><th>جلسه</th><th>زمان</th><th>مدت</th><th>محل</th><th>وضعیت</th></tr></thead><tbody>'+S.sessions.map(x=>'<tr><td>'+fa(x.session_number)+'</td><td>'+new Date(x.starts_at).toLocaleString('fa-IR',{dateStyle:'short',timeStyle:'short'})+'</td><td>'+fa(Math.max(1,Math.round((new Date(x.ends_at)-new Date(x.starts_at))/60000)))+' دقیقه</td><td>'+esc(x.venue||S.term.default_venue||'—')+'</td><td><select data-att="'+x.id+'">'+Object.keys(attNames).map(k=>'<option value="'+k+'" '+((map[x.id]||'pending')===k?'selected':'')+'>'+attNames[k]+'</option>').join('')+'</select></td></tr>').join('')+'</tbody></table><div class="st-actions"><button class="st-btn primary" id="stSaveAtt">ذخیره حضور و غیاب</button></div>';
      $('stSaveAtt').onclick=saveAttendance;
    }catch(e){box.textContent=e.message||'دریافت حضور و غیاب ناموفق بود.';}
  }
  async function saveAttendance(){
    try{const {data:{user},error:ue}=await gym20AdminClient.auth.getUser();if(ue)throw ue;const records=Array.from(document.querySelectorAll('[data-att]')).map(el=>({session_id:el.dataset.att,student_id:S.studentId,enrollment_id:null,status:el.value,confirmed_by:user?.id||null,confirmed_at:new Date().toISOString()}));
      say('در حال ذخیره حضور و غیاب…');const {error}=await db().from('attendance').upsert(records,{onConflict:'session_id,student_id'});if(error)throw error;await loadAttendance();say('حضور و غیاب ذخیره شد.');
    }catch(e){say(e.message||'ذخیره حضور و غیاب ناموفق بود.',true);}
  }
  function init(){
    mount();
    const tabObserver=new MutationObserver(()=>{
      if(!$(TAB)&&document.querySelector('.admin-tabs')&&document.querySelector('.admin-workspace'))mount();
      if($(TAB))tabObserver.disconnect();
    });
    if(!$(TAB))tabObserver.observe(document.body,{childList:true,subtree:true});
    const activeObserver=new MutationObserver(()=>{const p=$(TAB);if(p&&p.classList.contains('active')&&gym20OwnerAuthorized&&!S.students.length)loadStudents();});
    const p=$(TAB);if(p)activeObserver.observe(p,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.setInterval(refreshDraftSessionStates,1000);
  // Final high-specificity live-state palette, appended after the panel's legacy styles.
  const liveStateCss=document.createElement('style');
  liveStateCss.id='gym20LiveStateFinalCss';
  liveStateCss.textContent=`
    #studentTermsTab .st-session-card.live{background:linear-gradient(110deg,rgba(133,77,14,.52),#151e2b 82%)!important;border:1px solid #eab308!important;box-shadow:inset 4px 0 0 #facc15,0 0 14px rgba(250,204,21,.16)!important}
    #studentTermsTab .st-session-card.live .st-session-state.live{background:#facc15!important;color:#17130a!important;border:1px solid #fde047!important;box-shadow:0 0 12px rgba(250,204,21,.35)!important}
    #studentTermsTab .st-schedule-row.live td{background:rgba(161,98,7,.34)!important;color:#fff1a6!important}
    #studentTermsTab .st-schedule-row.live .st-session-state.live{background:#facc15!important;color:#17130a!important;border-color:#fde047!important}
  `;
  document.head.appendChild(liveStateCss);

  // GYM20 compact admin pilot: consistent 24px controls and unified typography.
  const adminPilotCss=document.createElement('style');
  adminPilotCss.id='gym20StudentTermsAdminPilotCss';
  adminPilotCss.textContent=`
    #studentTermsTab .st-btn,
    #studentTermsTab button.st-btn,
    #studentTermsTab .st-term-grid input[data-jalali-date],
    #studentTermsTab .st-term-grid .st-calendar-btn,
    #studentTermsTab .st-term-picker-row select,
    #studentTermsTab .st-term-picker-row .st-custom-select-trigger,
    #studentTermsTab .st-term-picker-row .st-icon-delete-term,
    #studentTermsTab #stManualCalendar,
    #studentTermsTab #stPublish,
    #studentTermsTab .st-session-fields input,
    #studentTermsTab .st-session-fields select,
    #studentTermsTab .st-session-fields-modern input,
    #studentTermsTab .st-session-fields-modern select,
    #studentTermsTab .st-row-delete,
    #stPushCard .st-btn,
    #stPushCard button,
    #stPushCard input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]) {
      box-sizing:border-box!important;
      height:24px!important;min-height:24px!important;max-height:24px!important;
      padding:0 6px!important;border-radius:6px!important;
      font-size:8px!important;line-height:1!important;
      font-family:Vazirmatn,Montserrat,Arial,sans-serif!important;
    }
    #studentTermsTab .st-term-grid .st-calendar-btn,
    #studentTermsTab .st-term-picker-row .st-icon-delete-term {
      width:24px!important;min-width:24px!important;flex:0 0 24px!important;
      padding:0!important;
    }
    #studentTermsTab #stManualCalendar{width:auto!important;white-space:nowrap!important}
    #studentTermsTab .st-term-grid .st-field label,
    #studentTermsTab .st-term-picker-field label,
    #studentTermsTab .st-session-fields label,
    #studentTermsTab .st-session-fields-modern .st-session-field label,
    #stPushCard .st-reminder-label-row label,
    #stPushCard .st-hour-field label {
      font-size:9px!important;font-weight:800!important;line-height:1.25!important;
      color:#e8c96f!important;
    }
    #studentTermsTab .st-title,
    #stPushCard .st-push-heading {
      font-size:9px!important;font-weight:800!important;line-height:1.35!important;
      color:#e8c96f!important;
    }
    #studentTermsTab .st-term-grid input[data-jalali-date],
    #studentTermsTab .st-session-fields .st-date-input,
    #studentTermsTab .st-session-fields .st-time-input,
    #studentTermsTab .st-session-fields-modern input,
    #studentTermsTab .st-session-fields-modern select,
    #stPushCard #stReminder1Hours,
    #stPushCard #stReminder2Hours {
      direction:ltr!important;text-align:center!important;
      font-family:Montserrat,Vazirmatn,Arial,sans-serif!important;
      font-size:8px!important;font-weight:700!important;
      font-variant-numeric:lining-nums tabular-nums!important;
      font-feature-settings:"lnum" 1,"tnum" 1!important;
      letter-spacing:0!important;
    }
    #studentTermsTab .st-term-grid input[data-jalali-date]::placeholder{
      font-size:8px!important;
    }
    #studentTermsTab .st-session-head strong{font-size:9px!important;font-weight:800!important}
    #studentTermsTab .st-session-state{font-size:8px!important}
    #studentTermsTab .st-muted,
    #studentTermsTab .st-help,
    #stPushCard .st-muted,
    #stPushCard #stPushAdminStatus{font-size:8px!important;line-height:1.4!important}
    #stPushCard .st-reminder-input-row input{
      width:100%!important;height:24px!important;min-height:24px!important;max-height:24px!important;
      font:700 8px/1 Montserrat,Vazirmatn,Arial,sans-serif!important;
    }
    #stPushCard #stPushStatusControls .st-push-toggle,
    #stPushCard #stPushStudentStatus,
    #stPushCard #stPushTestAdmin{
      height:24px!important;min-height:24px!important;max-height:24px!important;
      font-size:8px!important;padding:0 6px!important;
    }
    #studentTermsTab .st-jcal-head button,
    #studentTermsTab .st-jcal-day,
    .st-jcal .st-jcal-head button,
    .st-jcal .st-jcal-day,
    .st-jcal [data-confirm]{
      min-height:24px!important;height:24px!important;font-size:8px!important;
      font-family:Vazirmatn,Montserrat,Arial,sans-serif!important;
    }
    @media(max-width:600px){
      #studentTermsTab .st-term-grid{column-gap:6px!important;row-gap:6px!important}
      #studentTermsTab .st-term-grid .st-field label{font-size:9px!important;margin-bottom:3px!important}
      #studentTermsTab .st-session-fields input,
      #studentTermsTab .st-session-fields select,
      #studentTermsTab .st-session-fields-modern input,
      #studentTermsTab .st-session-fields-modern select{height:24px!important;min-height:24px!important}
    }
  `;
  document.head.appendChild(adminPilotCss);

  // Final unified 24px controls for notification + term management.
  const unified24Css=document.createElement('style');
  unified24Css.id='gym20Unified24ControlsCss';
  unified24Css.textContent=`
    #studentTermsTab .st-term-grid input[data-jalali-date],
    #studentTermsTab .st-term-grid .st-calendar-btn,
    #studentTermsTab .st-term-picker-row .st-custom-select-trigger,
    #studentTermsTab .st-term-picker-row .st-btn,
    #studentTermsTab .st-term-picker-row .st-icon-delete-term,
    #studentTermsTab #stManualCalendar,
    #studentTermsTab #stPublish,
    #stPushCard .st-push-toolbar button,
    #stPushCard .st-reminder-input-row input,
    #stPushCard .st-reminder-action-row button,
    #stPushCard .st-reminder-save-row button,
    #stPushCard #stCustomPushText,
    #stPushCard #stSendCustomPush,
    #stPushCard #stPushTestAdmin,
    #stPushCard #stPushStatusControls button,
    #stPushCard #stPushStatusControls .st-push-toggle,
    #stPushCard .st-custom-select-trigger,
    #stPushCard .st-custom-select-menu button {
      box-sizing:border-box!important;
      height:24px!important;min-height:24px!important;max-height:24px!important;
      padding:0 6px!important;
      font-size:8px!important;line-height:22px!important;
      border-radius:6px!important;
      font-family:Vazirmatn,Montserrat,Arial,sans-serif!important;
    }
    #studentTermsTab .st-term-grid .st-calendar-btn{
      width:24px!important;min-width:24px!important;flex:0 0 24px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
    }
    #studentTermsTab .st-term-picker-row .st-custom-select-trigger{
      width:100%!important;display:flex!important;align-items:center!important;justify-content:space-between!important;
    }
    #studentTermsTab .st-term-picker-row .st-btn,
    #studentTermsTab #stManualCalendar,
    #studentTermsTab #stPublish,
    #stPushCard button.st-btn{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      white-space:nowrap!important;
    }
    #stPushCard .st-reminder-input-row input,
    #stPushCard #stCustomPushText{
      width:100%!important;min-width:0!important;
      font-size:9px!important;line-height:22px!important;
      text-align:center!important;
    }
    #stPushCard #stCustomPushText{
      resize:none!important;overflow:hidden!important;
    }
    #stPushCard #stCustomPushText{
      box-sizing:border-box!important;padding:0 8px!important;
      text-align:center!important;direction:rtl!important;
      line-height:22px!important;vertical-align:middle!important;
    }
    #stPushCard .st-reminder-action-row button,
    #stPushCard .st-reminder-save-row button{
      width:100%!important;
    }
    #stPushCard .st-reminder-label-row label,
    #studentTermsTab .st-term-grid .st-field label,
    #studentTermsTab .st-term-picker-field label{
      color:#e8c96f!important;font-size:9px!important;font-weight:800!important;
      line-height:1.25!important;
    }
    @media(max-width:600px){
      #studentTermsTab .st-term-grid input[data-jalali-date],
      #studentTermsTab .st-term-grid .st-calendar-btn,
      #studentTermsTab .st-term-picker-row .st-custom-select-trigger,
      #studentTermsTab .st-term-picker-row .st-btn,
      #stPushCard .st-reminder-input-row input,
      #stPushCard .st-reminder-action-row button,
      #stPushCard .st-reminder-save-row button,
      #stPushCard #stCustomPushText,
      #stPushCard #stSendCustomPush,
      #stPushCard #stPushTestAdmin{
        height:24px!important;min-height:24px!important;max-height:24px!important;
      }
    }
  `;
  document.head.appendChild(unified24Css);

  // Keep every control in the term date/picker row precisely 24px tall.
  const termFields24Css=document.createElement('style');
  termFields24Css.id='gym20TermFields24Css';
  termFields24Css.textContent=`
    #studentTermsTab .st-term-grid .st-date-wrap,
    #studentTermsTab .st-term-grid input[data-jalali-date],
    #studentTermsTab .st-term-grid .st-calendar-btn,
    #studentTermsTab .st-term-picker-row .st-custom-select,
    #studentTermsTab .st-term-picker-row .st-custom-select-trigger,
    #studentTermsTab .st-term-picker-row .st-icon-delete-term,
    #studentTermsTab .st-term-picker-row .st-btn{
      box-sizing:border-box!important;
      height:24px!important;min-height:24px!important;max-height:24px!important;
      padding-top:0!important;padding-bottom:0!important;
      line-height:22px!important;
    }
    #studentTermsTab .st-term-grid input[data-jalali-date]{
      width:100%!important;min-width:0!important;
      padding-inline:6px!important;font-size:9px!important;
    }
    #studentTermsTab .st-term-grid .st-date-wrap{
      display:flex!important;align-items:center!important;gap:3px!important;
    }
    #studentTermsTab .st-term-grid .st-calendar-btn{
      width:24px!important;min-width:24px!important;flex:0 0 24px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      padding:0!important;
    }
    #studentTermsTab .st-term-picker-row .st-custom-select-trigger{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      padding-inline:6px!important;font-size:9px!important;
    }
    #studentTermsTab .st-term-picker-row .st-icon-delete-term,
    #studentTermsTab .st-term-picker-row .st-btn{
      width:24px!important;min-width:24px!important;flex:0 0 24px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      padding:0!important;
    }
    #studentTermsTab .st-term-picker-row .st-icon-delete-term svg{width:13px!important;height:13px!important}
  `;
  document.head.appendChild(termFields24Css);

  // Keep the four student-link actions compact and visually consistent.
  const publicActions24Css=document.createElement('style');
  publicActions24Css.id='gym20PublicActions24Css';
  publicActions24Css.textContent=`
    #studentTermsTab .st-public-link .st-public-actions{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      align-items:stretch!important;
      gap:5px!important;
      margin-top:4px!important;
      width:100%!important;
    }
    #studentTermsTab .st-public-link .st-public-actions .st-btn{
      box-sizing:border-box!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      min-width:0!important;
      height:24px!important;
      min-height:24px!important;
      max-height:24px!important;
      margin:0!important;
      padding:0 3px!important;
      border:1px solid rgba(214,179,90,.48)!important;
      border-radius:6px!important;
      background:linear-gradient(145deg,rgba(214,179,90,.17),rgba(214,179,90,.07))!important;
      color:#f0d58e!important;
      font-family:Vazirmatn,Montserrat,sans-serif!important;
      font-size:8px!important;
      font-weight:750!important;
      line-height:1!important;
      text-align:center!important;
      text-decoration:none!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:clip!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;
      cursor:pointer!important;
    }
    #studentTermsTab .st-public-link .st-public-actions .st-btn:hover{
      border-color:#d6b35a!important;
      background:rgba(214,179,90,.23)!important;
      color:#fff0c2!important;
    }
    #studentTermsTab .st-public-link .st-public-actions .st-btn:focus-visible{
      outline:2px solid rgba(229,195,110,.8)!important;
      outline-offset:2px!important;
    }
    #studentTermsTab .st-public-link .st-public-actions .st-btn:active{
      transform:translateY(1px)!important;
    }
    @media(max-width:390px){
      #studentTermsTab .st-public-link .st-public-actions{gap:3px!important}
      #studentTermsTab .st-public-link .st-public-actions .st-btn{
        padding:0 2px!important;font-size:7.5px!important;border-radius:5px!important;
      }
    }
  `;
  document.head.appendChild(publicActions24Css);

  window.addEventListener('load',()=>{if(!$(TAB))mount();});
  if(!document.getElementById('stCalendarActionOrderCss')){const x=document.createElement('style');x.id='stCalendarActionOrderCss';x.textContent="\n#studentTermsTab .st-term-grid>.st-calendar-action-row{\n  grid-column:1/-1!important;display:flex!important;align-items:center!important;\n  justify-content:flex-start!important;gap:8px!important;margin:0!important;\n  padding:2px 0!important;min-width:0!important;\n}\n#studentTermsTab .st-term-grid>.st-calendar-action-row #stManualCalendar{\n  width:auto!important;min-width:0!important;height:31px!important;min-height:31px!important;\n  max-height:31px!important;padding:4px 12px!important;border-radius:7px!important;\n  font-size:10px!important;line-height:1.3!important;white-space:nowrap!important;\n}\n#studentTermsTab .st-term-grid>.st-calendar-action-row #stManualCount{font-size:9px!important}\n@media(max-width:600px){\n #studentTermsTab .st-term-grid>.st-calendar-action-row #stManualCalendar{\n  height:29px!important;min-height:29px!important;max-height:29px!important;\n  padding:3px 9px!important;font-size:9px!important\n }\n}\n";document.head.appendChild(x);}

    /* Keep calendar action and student-term selector side by side. */
    const stCalendarTermInlineCss=document.createElement('style');
    stCalendarTermInlineCss.id='stCalendarTermInlineCss';
    stCalendarTermInlineCss.textContent=`
      #studentTermsTab .st-create-compact .st-term-grid{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        column-gap:10px!important;row-gap:9px!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row{
        grid-column:auto!important;align-self:end!important;
        min-width:0!important;min-height:36px!important;
        display:flex!important;align-items:center!important;
        justify-content:flex-start!important;margin:0!important;padding:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field{
        grid-column:auto!important;min-width:0!important;margin:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row #stManualCalendar{
        width:100%!important;height:36px!important;min-height:36px!important;
        max-height:36px!important;padding:4px 7px!important;
        font-size:10px!important;white-space:normal!important;
      }
      #studentTermsTab .st-create-compact .st-term-picker-row{min-width:0!important}
      #studentTermsTab .st-create-compact .st-term-picker-row select,
      #studentTermsTab .st-create-compact .st-term-picker-row .st-custom-select-trigger{
        min-width:0!important;width:100%!important;box-sizing:border-box!important;
      }
      @media(max-width:600px){
        #studentTermsTab .st-create-compact .st-term-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row #stManualCalendar{
          height:34px!important;min-height:34px!important;max-height:34px!important;
          padding:3px 5px!important;font-size:9px!important;
        }
      }
    `;
    document.head.appendChild(stCalendarTermInlineCss);

    /* Remove the term caption and vertically align its control with the calendar button. */
    const stTermPickerCleanAlignCss=document.createElement('style');
    stTermPickerCleanAlignCss.id='stTermPickerCleanAlignCss';
    stTermPickerCleanAlignCss.textContent=`
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field>label{
        display:none!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field{
        align-self:center!important;justify-self:stretch!important;
        display:flex!important;flex-direction:column!important;justify-content:center!important;
        min-height:36px!important;padding:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row{
        width:100%!important;height:36px!important;min-height:36px!important;
        align-items:center!important;margin:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row select,
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row .st-custom-select-trigger{
        height:36px!important;min-height:36px!important;max-height:36px!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row{
        align-self:center!important;min-height:36px!important;
      }
    `;
    document.head.appendChild(stTermPickerCleanAlignCss);


    /* Center the labels above all three term controls. */
    const termFieldLabelCenterCss=document.createElement('style');
    termFieldLabelCenterCss.id='stTermFieldLabelCenterCss';
    termFieldLabelCenterCss.textContent='#studentTermsTab .st-term-grid>.st-field>label{display:block!important;width:100%!important;text-align:center!important;align-self:stretch!important}';
    document.head.appendChild(termFieldLabelCenterCss);

    /* Exact 24px shared baseline for the calendar and term selector controls. */
    const stTermPicker24pxCss=document.createElement('style');
    stTermPicker24pxCss.id='stTermPicker24pxCss';
    stTermPicker24pxCss.textContent=`
      #studentTermsTab .st-create-compact .st-term-grid{
        align-items:center!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row,
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field{
        align-self:center!important;display:flex!important;align-items:center!important;
        height:24px!important;min-height:24px!important;max-height:24px!important;
        margin:0!important;padding:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row #stManualCalendar{
        box-sizing:border-box!important;width:100%!important;height:24px!important;
        min-height:24px!important;max-height:24px!important;padding:0 5px!important;
        line-height:22px!important;font-size:8px!important;white-space:nowrap!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row{
        box-sizing:border-box!important;display:flex!important;align-items:center!important;
        width:100%!important;height:24px!important;min-height:24px!important;max-height:24px!important;
        gap:4px!important;margin:0!important;padding:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row select,
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row .st-custom-select,
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row .st-custom-select-trigger,
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row #stDeleteTerm{
        box-sizing:border-box!important;height:24px!important;min-height:24px!important;
        max-height:24px!important;line-height:22px!important;margin:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row #stDeleteTerm{
        width:24px!important;min-width:24px!important;max-width:24px!important;
        flex:0 0 24px!important;padding:0!important;
      }
      #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row #stDeleteTerm svg{
        width:12px!important;height:12px!important;
      }
    `;
    document.head.appendChild(stTermPicker24pxCss);

    /* Override admin-modal and custom-select wrapper sizing: every visible layer is 24px. */
    const stTermPickerHard24Css=document.createElement('style');
    stTermPickerHard24Css.id='stTermPickerHard24Css';
    stTermPickerHard24Css.textContent=`
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row,
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>.st-custom-select,
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>.st-custom-select .st-custom-select-trigger,
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>#stDeleteTerm,
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row,
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row>#stManualCalendar{
        box-sizing:border-box!important;
        height:24px!important;min-height:24px!important;max-height:24px!important;
        margin-top:0!important;margin-bottom:0!important;
        padding-top:0!important;padding-bottom:0!important;
        align-self:center!important;
      }
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row{
        display:flex!important;align-items:center!important;gap:4px!important;
        width:100%!important;overflow:visible!important;
      }
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>.st-custom-select{
        display:block!important;position:relative!important;flex:1 1 0!important;
        width:0!important;min-width:0!important;overflow:visible!important;
      }
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>.st-custom-select .st-custom-select-trigger{
        display:flex!important;align-items:center!important;justify-content:space-between!important;
        width:100%!important;min-width:0!important;padding:0 6px!important;
        line-height:22px!important;font-size:8px!important;border-radius:6px!important;
      }
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-term-picker-field .st-term-picker-row>#stDeleteTerm{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;
      }
      #adminModal #studentTermsTab .st-create-compact .st-term-grid>.st-calendar-action-row>#stManualCalendar{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        width:100%!important;line-height:22px!important;font-size:8px!important;
      }
    `;
    document.head.appendChild(stTermPickerHard24Css);

  // Unified compact session editor: four equal-height controls with proportional widths.
  const sessionControls25Css=document.createElement('style');
  sessionControls25Css.id='stSessionControls25Css';
  sessionControls25Css.textContent=`
    #studentTermsTab .st-session-fields-modern{display:grid!important;grid-template-columns:minmax(0,.78fr) minmax(0,1.28fr) minmax(0,1fr) minmax(0,1fr)!important;gap:5px!important;align-items:end!important;width:100%!important}
    #studentTermsTab .st-session-fields-modern>.st-session-field{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;align-items:stretch!important;gap:3px!important;min-width:0!important;width:100%!important;text-align:center!important;white-space:nowrap!important}
    #studentTermsTab .st-session-fields-modern>.st-session-weekday,#studentTermsTab .st-session-fields-modern>.st-session-field>input,#studentTermsTab .st-session-fields-modern .st-custom-select,#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{box-sizing:border-box!important;width:100%!important;min-width:0!important;height:25px!important;min-height:25px!important;max-height:25px!important;margin:0!important;padding:0 3px!important;border-radius:5px!important;line-height:23px!important}
    #studentTermsTab .st-session-fields-modern>.st-session-weekday{display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;white-space:nowrap!important;font-size:8px!important}
    #studentTermsTab .st-session-fields-modern .st-date-input{display:block!important;width:100%!important;min-width:0!important;height:25px!important;min-height:25px!important;direction:ltr!important;text-align:center!important;white-space:nowrap!important;font-family:Montserrat,Arial,sans-serif!important;font-size:9px!important;font-weight:700!important;font-variant-numeric:lining-nums tabular-nums!important;letter-spacing:0!important}
    #studentTermsTab .st-session-fields-modern .st-time-input{display:block!important;width:100%!important;min-width:0!important;height:25px!important;min-height:25px!important;direction:ltr!important;text-align:center!important;white-space:nowrap!important;appearance:none!important;-webkit-appearance:none!important;font-family:Montserrat,Arial,sans-serif!important;font-size:10px!important;font-weight:800!important;font-variant-numeric:lining-nums tabular-nums!important;letter-spacing:0!important;color-scheme:dark!important}
    #studentTermsTab .st-session-fields-modern .st-time-input::placeholder{color:#8f9bad!important;opacity:.7!important}
    #studentTermsTab .st-session-fields-modern .st-custom-select{display:block!important;position:relative!important;overflow:visible!important}
    #studentTermsTab .st-session-fields-modern .st-custom-select-native{display:none!important}
    #studentTermsTab .st-session-fields-modern .st-custom-select-trigger{display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;text-align:center!important;white-space:nowrap!important;font-family:Vazirmatn,Arial,sans-serif!important;font-size:8px!important;font-weight:700!important}
    #studentTermsTab .st-session-fields-modern .st-custom-value{display:block!important;flex:1 1 auto!important;min-width:0!important;overflow:hidden!important;text-overflow:clip!important;text-align:center!important;white-space:nowrap!important}
    #studentTermsTab .st-session-fields-modern .st-custom-arrow{display:none!important}
    @media(max-width:720px){#studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.75fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)!important;gap:4px!important}}
    @media(max-width:390px){#studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr) minmax(0,.95fr) minmax(0,1fr)!important;gap:3px!important}#studentTermsTab .st-session-fields-modern .st-date-input{font-size:8px!important}#studentTermsTab .st-session-fields-modern .st-time-input{font-size:9px!important}#studentTermsTab .st-session-fields-modern .st-custom-select-trigger{font-size:7.5px!important}}
  `;
  document.head.appendChild(sessionControls25Css);


  // Final override: target the actual rendered markup after select enhancement.
  // This intentionally wins over legacy rules in both the module and index.html.
  const sessionAndCalendarFinalCss=document.createElement('style');
  sessionAndCalendarFinalCss.id='stSessionAndCalendarFinalCss';
  sessionAndCalendarFinalCss.textContent=`
    /* Session editor: four stable columns; weekday/date/time/coach controls share one height. */
    #adminModal #studentTermsTab .st-session-card{box-sizing:border-box!important;width:100%!important;min-width:0!important;overflow:visible!important}
    #adminModal #studentTermsTab .st-session-fields-modern{
      display:grid!important;grid-template-columns:minmax(0,.82fr) minmax(0,1.22fr) minmax(0,1fr) minmax(0,1fr)!important;
      gap:5px!important;align-items:end!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-weekday,
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field{
      box-sizing:border-box!important;min-width:0!important;width:100%!important;margin:0!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field{
      display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-end!important;
      gap:3px!important;white-space:nowrap!important;text-align:center!important;font-size:8px!important;line-height:1.2!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-weekday{
      display:flex!important;align-items:center!important;justify-content:center!important;
      height:27px!important;min-height:27px!important;max-height:27px!important;
      padding:0 3px!important;overflow:hidden!important;white-space:nowrap!important;
      border:1px solid rgba(214,179,90,.34)!important;border-radius:6px!important;
      background:rgba(214,179,90,.09)!important;color:#e8cb7c!important;
      font:700 8px/25px Vazirmatn,Arial,sans-serif!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>input,
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>.st-custom-select,
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>.st-custom-select>.st-custom-select-trigger,
    #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>select{
      display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;
      height:27px!important;min-height:27px!important;max-height:27px!important;
      margin:0!important;padding:0 4px!important;border-radius:6px!important;line-height:25px!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-date-input,
    #adminModal #studentTermsTab .st-session-fields-modern .st-time-input{
      appearance:none!important;-webkit-appearance:none!important;
      direction:ltr!important;text-align:center!important;white-space:nowrap!important;
      font-family:Montserrat,Arial,sans-serif!important;font-size:9px!important;font-weight:750!important;
      font-variant-numeric:lining-nums tabular-nums!important;font-feature-settings:"lnum" 1,"tnum" 1!important;
      letter-spacing:0!important;color-scheme:dark!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-time-input{
      cursor:text!important;pointer-events:auto!important;background-image:none!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-custom-select{
      position:relative!important;display:block!important;width:100%!important;min-width:0!important;
      height:27px!important;min-height:27px!important;max-height:27px!important;overflow:visible!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-custom-select-native{display:none!important}
    #adminModal #studentTermsTab .st-session-fields-modern .st-custom-select-trigger{
      display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;
      width:100%!important;height:27px!important;min-height:27px!important;max-height:27px!important;
      padding:0 3px!important;overflow:hidden!important;text-align:center!important;white-space:nowrap!important;
      font:700 8px/25px Vazirmatn,Arial,sans-serif!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-custom-value{
      display:block!important;flex:1 1 auto!important;min-width:0!important;overflow:hidden!important;
      text-align:center!important;text-overflow:clip!important;white-space:nowrap!important;
    }
    #adminModal #studentTermsTab .st-session-fields-modern .st-custom-arrow{display:none!important}
    #adminModal #studentTermsTab .st-session-head{display:flex!important;align-items:center!important;gap:7px!important;min-width:0!important}
    #adminModal #studentTermsTab .st-session-head .st-session-calendar{
      box-sizing:border-box!important;flex:0 0 27px!important;width:27px!important;height:27px!important;
      min-width:27px!important;min-height:27px!important;max-height:27px!important;padding:0!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
    }
    #adminModal #studentTermsTab .st-session-head .st-row-delete{
      box-sizing:border-box!important;height:24px!important;min-height:24px!important;max-height:24px!important;
      padding:0 6px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
    }
    /* Term date inputs and their calendar launchers use the same compact baseline. */
    #adminModal #studentTermsTab .st-term-grid .st-date-wrap{display:flex!important;align-items:center!important;gap:4px!important;min-width:0!important}
    #adminModal #studentTermsTab .st-term-grid input[data-jalali-date]{
      box-sizing:border-box!important;height:27px!important;min-height:27px!important;max-height:27px!important;
      min-width:0!important;padding:0 5px!important;direction:ltr!important;text-align:center!important;
      font:700 9px/25px Montserrat,Arial,sans-serif!important;font-variant-numeric:tabular-nums!important;
    }
    #adminModal #studentTermsTab .st-term-grid .st-calendar-btn{
      box-sizing:border-box!important;flex:0 0 27px!important;width:27px!important;height:27px!important;
      min-width:27px!important;min-height:27px!important;max-height:27px!important;padding:0!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
    }
    /* Both single-date and multi-date Jalali calendars. */
    .st-jcal{
      box-sizing:border-box!important;width:252px!important;max-width:calc(100vw - 16px)!important;
      padding:9px!important;border-radius:11px!important;direction:rtl!important;
    }
    .st-jcal .st-jcal-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;margin:0 0 7px!important}
    .st-jcal .st-jcal-head button{
      box-sizing:border-box!important;width:27px!important;height:27px!important;min-width:27px!important;
      min-height:27px!important;max-height:27px!important;padding:0!important;display:flex!important;
      align-items:center!important;justify-content:center!important;font:700 13px/25px Montserrat,Arial,sans-serif!important;
    }
    .st-jcal .st-jcal-head b{font:800 10px/27px Vazirmatn,Arial,sans-serif!important}
    .st-jcal .st-jcal-grid{
      display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;
      grid-auto-rows:29px!important;gap:3px!important;align-items:stretch!important;
    }
    .st-jcal .st-jcal-grid>span,
    .st-jcal .st-jcal-grid>i,
    .st-jcal .st-jcal-grid>.st-jcal-day{
      box-sizing:border-box!important;width:100%!important;height:29px!important;min-height:29px!important;
      max-height:29px!important;margin:0!important;padding:0!important;display:flex!important;
      align-items:center!important;justify-content:center!important;border-radius:6px!important;
      font-family:Vazirmatn,Arial,sans-serif!important;font-size:9px!important;line-height:1!important;
    }
    .st-jcal .st-jcal-grid>span{border:0!important;background:transparent!important;color:#d8bc78!important;font-weight:800!important}
    .st-jcal .st-jcal-grid>i{border:0!important;background:transparent!important}
    .st-jcal .st-jcal-day{cursor:pointer!important}
    .st-jcal .st-jcal-day.term-range-start,
    .st-jcal .st-jcal-day.term-range-end,
    .st-jcal .st-jcal-day.term-boundary{
      background:#168a45!important;border-color:#4ade80!important;color:#fff!important;
      font-weight:900!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)!important;
    }
    .st-jcal .st-jcal-day:disabled{opacity:.3!important;cursor:not-allowed!important}
    .st-jcal .st-jcal-day.session-existing,
    .st-jcal .st-jcal-day.session-date-selected{
      background:rgba(34,197,94,.22)!important;border-color:rgba(74,222,128,.7)!important;
      color:#d9ffe5!important;font-weight:800!important;opacity:1!important;
    }
    .st-jcal .st-jcal-day.session-existing:disabled{opacity:1!important}
    .st-jcal .st-muted{font-size:8px!important;line-height:1.5!important}
    .st-jcal [data-confirm]{
      box-sizing:border-box!important;min-height:27px!important;height:27px!important;padding:0 8px!important;
      font:700 8px/25px Vazirmatn,Arial,sans-serif!important;white-space:nowrap!important;
    }
    @media(max-width:600px){
      #adminModal #studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.78fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)!important;gap:4px!important}
      #adminModal #studentTermsTab .st-session-fields-modern>.st-session-weekday,
      #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>input,
      #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>.st-custom-select,
      #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>.st-custom-select>.st-custom-select-trigger,
      #adminModal #studentTermsTab .st-session-fields-modern>.st-session-field>select{height:27px!important;min-height:27px!important;max-height:27px!important}
      #adminModal #studentTermsTab .st-session-fields-modern .st-date-input{font-size:8px!important}
      #adminModal #studentTermsTab .st-session-fields-modern .st-time-input{font-size:9px!important}
      #adminModal #studentTermsTab .st-session-fields-modern .st-custom-select-trigger{font-size:7.5px!important}
    }
    @media(max-width:360px){
      #adminModal #studentTermsTab .st-session-fields-modern{grid-template-columns:minmax(0,.72fr) minmax(0,1.18fr) minmax(0,1fr) minmax(0,1fr)!important;gap:3px!important}
      .st-jcal{width:244px!important;padding:8px!important}
      .st-jcal .st-jcal-grid{grid-auto-rows:27px!important;gap:2px!important}
      .st-jcal .st-jcal-grid>span,.st-jcal .st-jcal-grid>i,.st-jcal .st-jcal-grid>.st-jcal-day{height:27px!important;min-height:27px!important;max-height:27px!important}
    }
  `;
  document.head.appendChild(sessionAndCalendarFinalCss);

})();
/* Put calendar session selection directly above the student term selector. */



/* Final light palette for the dynamically-created student/term workspace.
   Kept in the module itself so it loads after all legacy dark-mode style injections. */
(function(){
  const style=document.createElement('style');
  style.id='stStudentTermsLightFinal';
  style.textContent=`
    html[data-theme="light"] #studentTermsTab{
      background:#f3f5f8!important;color:#263545!important;
    }
    html[data-theme="light"] #studentTermsTab .st-card,
    html[data-theme="light"] #studentTermsTab .st-create-compact,
    html[data-theme="light"] #studentTermsTab #stSchedule,
    html[data-theme="light"] #studentTermsTab #stPushCard{
      background:#fff!important;color:#263545!important;border:1px solid #dce3eb!important;
      box-shadow:0 3px 12px rgba(30,43,58,.045)!important;
    }
    html[data-theme="light"] #studentTermsTab :is(.st-title,.st-field label,.st-session-head strong,.st-section-title,.st-push-heading){
      color:#795814!important;-webkit-text-fill-color:#795814!important;text-shadow:none!important;
    }
    html[data-theme="light"] #studentTermsTab :is(.st-muted,.st-field,.st-session-fields label,.st-compact-field,.st-push-status,.st-template-preview,.st-template-hint){
      color:#687586!important;-webkit-text-fill-color:#687586!important;
    }
    html[data-theme="light"] #studentTermsTab :is(p,span,strong,b,small,label,div){
      text-shadow:none!important;
    }
    html[data-theme="light"] #studentTermsTab :is(input:not([type=checkbox]):not([type=radio]),textarea,select,.st-custom-select-trigger,.st-student-trigger,.st-time-input,.st-date-input,.st-table-input){
      background:#fff!important;color:#202b38!important;-webkit-text-fill-color:#202b38!important;
      border-color:#cfd8e2!important;box-shadow:inset 0 1px 2px rgba(28,42,58,.035)!important;
      color-scheme:light!important;
    }
    html[data-theme="light"] #studentTermsTab :is(input,textarea)::placeholder{color:#8793a1!important;-webkit-text-fill-color:#8793a1!important;opacity:1!important}
    html[data-theme="light"] #studentTermsTab .st-student-trigger,
    html[data-theme="light"] #studentTermsTab .st-custom-select-trigger{background:#fff!important;color:#263545!important}
    html[data-theme="light"] #studentTermsTab :is(.st-student-menu,.st-custom-select-menu),
    html[data-theme="light"] .st-jcal{
      background:#fff!important;color:#344253!important;border:1px solid #d5bd83!important;
      box-shadow:0 12px 28px rgba(25,39,55,.14)!important;
    }
    html[data-theme="light"] #studentTermsTab :is(.st-student-option,.st-custom-option),
    html[data-theme="light"] .st-jcal :is(button,b,span){
      background:#fff!important;color:#344253!important;border-color:#e1e6ec!important;
    }
    html[data-theme="light"] #studentTermsTab :is(.st-student-option.selected,.st-custom-option.selected),
    html[data-theme="light"] .st-jcal .st-jcal-day.selected{
      background:#f8f1df!important;color:#795814!important;border-color:#dfc37e!important;
    }
    html[data-theme="light"] #studentTermsTab .st-session-card{
      background:#fff!important;color:#344253!important;border:1px solid #dce3eb!important;
      box-shadow:0 2px 8px rgba(30,43,58,.04)!important;
    }
    html[data-theme="light"] #studentTermsTab .st-session-card :is(strong,span,b,label,small,div){
      color:#344253!important;-webkit-text-fill-color:#344253!important;
    }
    html[data-theme="light"] #studentTermsTab .st-session-card.live{
      background:linear-gradient(110deg,#fff8df,#fff)!important;border-color:#d6a72d!important;
      box-shadow:inset 3px 0 0 #eab308!important;
    }
    html[data-theme="light"] #studentTermsTab .st-session-card.live .st-session-state.live{
      background:#f7e8b6!important;color:#765617!important;-webkit-text-fill-color:#765617!important;border-color:#d6a72d!important;
    }
    html[data-theme="light"] #studentTermsTab .st-session-card.past{background:#fff5f5!important;border-color:#e6b6bc!important}
    html[data-theme="light"] #studentTermsTab .st-session-card.next{background:#f1fbf5!important;border-color:#b7dfc5!important}
    html[data-theme="light"] #studentTermsTab .st-session-card.future{background:#f2f7ff!important;border-color:#c4d7f4!important}
    html[data-theme="light"] #studentTermsTab .st-session-state.past{background:#fee2e2!important;color:#991b1b!important;-webkit-text-fill-color:#991b1b!important}
    html[data-theme="light"] #studentTermsTab .st-session-state.next{background:#dcfce7!important;color:#166534!important;-webkit-text-fill-color:#166534!important}
    html[data-theme="light"] #studentTermsTab .st-session-state.future{background:#dbeafe!important;color:#1d4ed8!important;-webkit-text-fill-color:#1d4ed8!important}
    html[data-theme="light"] #studentTermsTab .st-session-fields-modern>.st-session-weekday{background:#f8f1df!important;color:#795814!important;border-color:#dfc37e!important}
    html[data-theme="light"] #studentTermsTab .st-table,
    html[data-theme="light"] #studentTermsTab .st-table tbody,
    html[data-theme="light"] #studentTermsTab .st-table tr{background:#fff!important;color:#344253!important}
    html[data-theme="light"] #studentTermsTab .st-table th{background:#edf1f5!important;color:#344253!important}
    html[data-theme="light"] #studentTermsTab .st-table td{color:#344253!important;border-color:#e2e7ed!important}
    html[data-theme="light"] #studentTermsTab .st-table tr:nth-child(even){background:#f7f9fb!important}
    html[data-theme="light"] #studentTermsTab .st-schedule-table th{background:#edf1f5!important;color:#344253!important}
    html[data-theme="light"] #studentTermsTab .st-schedule-table td{color:#344253!important;border-color:#e2e7ed!important}
    html[data-theme="light"] #studentTermsTab .st-schedule-row.live td{background:#fff4c9!important;color:#765617!important}
    html[data-theme="light"] #studentTermsTab .st-btn:not(.primary):not(.danger){background:#f1f4f7!important;color:#344253!important;border-color:#d5dde6!important}
    html[data-theme="light"] #studentTermsTab .st-btn.primary{background:linear-gradient(135deg,#e0c16e,#bd9140)!important;color:#211a0d!important;border-color:#c49a42!important}
    html[data-theme="light"] #studentTermsTab .st-btn.danger{background:#fff0f0!important;color:#a92332!important;border-color:#edc4c8!important}
    html[data-theme="light"] #studentTermsTab .st-version{background:#fff!important;color:#344253!important;border-color:#dce3eb!important}
    html[data-theme="light"] #studentTermsTab .st-time-picker{
      background:linear-gradient(145deg,#fff,#f1f4f7)!important;color:#263545!important;border-color:#d5bd83!important;
      box-shadow:0 18px 48px rgba(25,39,55,.2)!important;
    }
    html[data-theme="light"] #studentTermsTab .st-time-picker :is(header,footer,small,label,span,button){color:#344253!important}
    html[data-theme="light"] #studentTermsTab .st-time-picker-preview strong{color:#795814!important}
    html[data-theme="light"] #studentTermsTab .st-time-wheel{background:linear-gradient(180deg,#edf1f5,#fff 48%,#edf1f5)!important;border-color:#dce3eb!important}
    html[data-theme="light"] #studentTermsTab .st-time-wheel-item{color:#8793a1!important}
    html[data-theme="light"] #studentTermsTab .st-time-wheel-item.selected{color:#795814!important;text-shadow:none!important}
    html[data-theme="light"] #studentTermsTab .st-time-wheel-indicator{border-color:#d6b35a!important;background:rgba(214,179,90,.12)!important}
    html[data-theme="light"] #studentTermsTab .st-time-picker>footer button{background:#f1f4f7!important;border-color:#d5dde6!important}
    html[data-theme="light"] #studentTermsTab .st-time-picker>footer .st-time-picker-apply{background:linear-gradient(135deg,#e0c16e,#bd9140)!important;color:#211a0d!important}
    html[data-theme="light"] #studentTermsTab .st-template-dialog{
      background:#fff!important;color:#263545!important;border-color:#d5bd83!important;
      box-shadow:0 18px 48px rgba(25,39,55,.2)!important;
    }
    html[data-theme="light"] #studentTermsTab .st-template-dialog :is(b,small,label,p,div){color:#344253!important}
    html[data-theme="light"] #studentTermsTab #stTemplateModalText{background:#fff!important;color:#202b38!important;border-color:#cfd8e2!important}
    html[data-theme="light"] #studentTermsTab .st-hour-scroll-wrap{background:#edf1f5!important;box-shadow:inset 0 1px 2px rgba(28,42,58,.08)!important}
    html[data-theme="light"] #studentTermsTab .st-hour-option{color:#687586!important}
    html[data-theme="light"] #studentTermsTab .st-hour-option.is-selected{color:#795814!important;text-shadow:none!important}
    html[data-theme="light"] #studentTermsTab .st-push-dot.active{background:#16a34a!important}
    html[data-theme="light"] #studentTermsTab .st-push-dot.inactive{background:#dc2626!important}
    html[data-theme="light"] #studentTermsTab .st-feedback{color:#687586!important}
    html[data-theme="light"] .st-jcal .st-jcal-grid>span{background:transparent!important;color:#795814!important}
    html[data-theme="light"] .st-jcal .st-jcal-day{background:#fff!important;color:#344253!important;border-color:#e1e6ec!important}
    html[data-theme="light"] .st-jcal .st-jcal-day.selected{background:#f8f1df!important;color:#795814!important;border-color:#dfc37e!important}
    html[data-theme="light"] .st-jcal .st-jcal-day.term-boundary,
    html[data-theme="light"] .st-jcal .st-jcal-day.term-boundary.selected{background:#168a45!important;color:#fff!important;border-color:#22c55e!important}
  `;
  document.head.appendChild(style);
})();
