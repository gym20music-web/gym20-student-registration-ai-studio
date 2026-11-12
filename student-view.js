(() => {
  const SUPABASE_URL='https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY='sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const $=id=>document.getElementById(id);
  // Center each field's label and value inside its own box on mobile and desktop.
  const studentFieldCenterStyle=document.createElement('style');
  studentFieldCenterStyle.textContent=`
    #schedule .session-compact-row .session-inline .session-fact{
      display:flex!important;flex-direction:column!important;
      align-items:center!important;justify-content:center!important;
      text-align:center!important;
    }
    #schedule .session-compact-row .session-inline .session-fact>i,
    #schedule .session-compact-row .session-inline .session-fact>b{
      display:block!important;width:100%!important;text-align:center!important;
    }
    #schedule .session-compact-row .session-inline .session-status-fact .status{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      margin-inline:auto!important;
    }`;
  document.head.appendChild(studentFieldCenterStyle);
  const faDate=v=>{if(!v)return '—';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '—';if(p[0]<1700)return p.map((x,i)=>String(x).padStart(i===0?4:2,'0')).join('/');const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(v)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return parts.year+'/'+parts.month+'/'+parts.day;};
  const faDateTime=v=>{if(!v)return '—';const d=new Date(v),fmt=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}),p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value])),weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(d);return weekday+' · '+p.year+'/'+p.month+'/'+p.day;};
  const faTime=v=>v?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v)):'—';
  const latinDigits=v=>String(v).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const num=v=>Number(v||0).toLocaleString('en-US');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const att={
    pending:['در انتظار ثبت','pending'],present:['حاضر','present'],absent:['غایب','absent'],
    excused:['غیبت موجه','pending'],makeup:['جلسه جبرانی','present'],cancelled:['لغوشده','absent']
  };


  const decodePushKey=value=>{const pad="=".repeat((4-value.length%4)%4),raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(raw,c=>c.charCodeAt(0));};
  function enhanceTermPicker(select){
    if(!select||select.dataset.customized==='1')return;
    select.dataset.customized='1';
    const wrap=document.createElement('div');wrap.className='term-select-wrap';
    select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.classList.add('term-select-native');
    const trigger=document.createElement('button');trigger.type='button';trigger.className='term-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<span class="term-select-label"></span><span class="term-select-arrow">⌄</span>';
    const menu=document.createElement('div');menu.className='term-select-menu';menu.hidden=true;menu.setAttribute('role','presentation');
    wrap.append(trigger,menu);
    const wheel=document.createElement('div');wheel.className='term-wheel-list';wheel.setAttribute('role','listbox');wheel.setAttribute('aria-label','انتخاب ترم');
    menu.appendChild(wheel);
    const items=()=>Array.from(wheel.querySelectorAll('.term-wheel-item'));
    const selectedOption=()=>select.options[select.selectedIndex];
    const sync=()=>{
      const opt=selectedOption();
      trigger.querySelector('.term-select-label').textContent=opt?opt.textContent:'انتخاب ترم';
      items().forEach(item=>item.setAttribute('aria-selected',String(item.dataset.value===select.value)));
    };
    const updateFocus=()=>{
      const all=items();if(!all.length)return null;
      const center=wheel.getBoundingClientRect().top+wheel.clientHeight/2;
      let best=null,distance=Infinity;
      all.forEach(item=>{const r=item.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-center);if(d<distance){best=item;distance=d;}});
      all.forEach(item=>item.classList.toggle('wheel-focus',item===best));
      wheel._gym20PendingValue=best?.dataset.value||'';
      return best;
    };
    const cycleSize=()=>{
      const all=items(),count=Number(wheel.dataset.termCount)||0;
      return count&&all.length>=count*3?all[count].offsetTop-all[0].offsetTop:0;
    };
    const recycle=()=>{
      const cycle=cycleSize();if(!cycle)return;
      const y=wheel.scrollTop;
      if(y<cycle*.35)wheel.scrollTop=y+cycle;
      else if(y>cycle*1.65)wheel.scrollTop=y-cycle;
    };
    const centerSelected=()=>{
      const item=items().find(x=>x.dataset.value===String(select.value)&&x.dataset.copy==='1')||items().find(x=>x.dataset.value===String(select.value));
      if(!item)return;
      wheel.scrollTop=item.offsetTop-(wheel.clientHeight-item.offsetHeight)/2;
      requestAnimationFrame(updateFocus);
    };
    const close=()=>{
      clearTimeout(wheel._gym20SettleTimer);
      menu.hidden=true;trigger.setAttribute('aria-expanded','false');
    };
    const choose=value=>{
      if(!Array.from(select.options).some(o=>o.value===String(value)))return;
      select.value=String(value);
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync();close();
    };
    const settle=()=>{
      clearTimeout(wheel._gym20SettleTimer);
      if(!wheel._gym20GestureMoved||wheel._gym20PointerDown)return;
      wheel._gym20SettleTimer=setTimeout(()=>{
        if(wheel._gym20PointerDown||!wheel._gym20GestureMoved)return;
        const best=updateFocus();
        wheel._gym20GestureMoved=false;
        if(best)choose(best.dataset.value);
      },760);
    };
    const render=()=>{
      const options=Array.from(select.options);
      const signature=options.map(option=>option.value+'\\u0000'+option.textContent).join('\\u0001');
      if(wheel.dataset.termSignature===signature){sync();return;}
      wheel.dataset.termSignature=signature;
      wheel.dataset.termCount=String(options.length);
      wheel.innerHTML='';
      [0,1,2].forEach(copy=>options.forEach(option=>{
        const item=document.createElement('div');
        item.className='term-wheel-item';
        item.dataset.value=option.value;item.dataset.copy=String(copy);
        item.setAttribute('role','option');
        item.setAttribute('aria-selected',String(option.value===select.value));
        item.innerHTML='<span class="term-wheel-label"></span><span class="term-wheel-check">✓</span>';
        item.querySelector('.term-wheel-label').textContent=option.textContent;
        wheel.appendChild(item);
      }));
      sync();
      if(!menu.hidden)requestAnimationFrame(centerSelected);
    };
    const bind=()=>{
      if(wheel._gym20Bound)return;wheel._gym20Bound=true;
      wheel._gym20PointerDown=false;wheel._gym20GestureMoved=false;wheel._gym20Dragged=false;wheel._gym20LastScrollTop=wheel.scrollTop;
      wheel.addEventListener('pointerdown',e=>{
        wheel._gym20PointerDown=true;wheel._gym20Dragged=false;wheel._gym20GestureMoved=false;
        wheel._gym20StartX=e.clientX;wheel._gym20StartY=e.clientY;
        clearTimeout(wheel._gym20SettleTimer);
      },{passive:true});
      wheel.addEventListener('pointermove',e=>{
        if(!wheel._gym20PointerDown)return;
        const dx=Math.abs(e.clientX-wheel._gym20StartX),dy=Math.abs(e.clientY-wheel._gym20StartY);
        if(dx>7||dy>7)wheel._gym20Dragged=true;
        if(dy>7&&dy>dx*1.15)wheel._gym20GestureMoved=true;
      },{passive:true});
      const pointerEnd=()=>{
        if(!wheel._gym20PointerDown)return;
        wheel._gym20PointerDown=false;wheel._gym20StartX=null;wheel._gym20StartY=null;
        if(wheel._gym20GestureMoved)settle();
      };
      wheel.addEventListener('pointerup',pointerEnd,{passive:true});
      wheel.addEventListener('pointercancel',pointerEnd,{passive:true});
      wheel.addEventListener('wheel',()=>{wheel._gym20GestureMoved=true;settle();},{passive:true});
      wheel.addEventListener('scroll',()=>{
        const now=wheel.scrollTop,delta=Math.abs(now-wheel._gym20LastScrollTop);
        wheel._gym20LastScrollTop=now;
        if(delta>2&&wheel._gym20PointerDown)wheel._gym20GestureMoved=true;
        if(!wheel._gym20Frame)wheel._gym20Frame=requestAnimationFrame(()=>{
          wheel._gym20Frame=0;recycle();updateFocus();wheel._gym20LastScrollTop=wheel.scrollTop;
        });
        if(wheel._gym20GestureMoved&&!wheel._gym20PointerDown)settle();
      },{passive:true});
      wheel.addEventListener('click',e=>{
        const item=e.target.closest('.term-wheel-item');if(!item)return;
        e.preventDefault();
        if(wheel._gym20Dragged){wheel._gym20Dragged=false;wheel._gym20GestureMoved=true;return;}
        wheel._gym20GestureMoved=false;choose(item.dataset.value);
      });
    };
    trigger.addEventListener('click',()=>{
      const opening=menu.hidden;
      document.querySelectorAll('.term-select-menu').forEach(m=>{
        if(m!==menu){m.hidden=true;m.parentElement.querySelector('.term-select-trigger')?.setAttribute('aria-expanded','false');}
      });
      menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));
      if(opening){
        wheel._gym20PointerDown=false;wheel._gym20GestureMoved=false;wheel._gym20Dragged=false;
        wheel._gym20LastScrollTop=wheel.scrollTop;bind();
        requestAnimationFrame(()=>{centerSelected();wheel._gym20LastScrollTop=wheel.scrollTop;});
      }
    });
    select.addEventListener('change',sync);
    document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    select._gym20RenderWheel=render;
    render();
  }
  async function setupPush(shortCode,client){
    const box=$("pushControls"),button=$("pushToggle"),status=$("pushStatus");
    if(!box||!button||!status||!shortCode)return;
    box.classList.remove("hide");
    button.disabled=true;
    button.textContent="در حال آماده‌سازی اعلان…";

    const ua=navigator.userAgent||"";
    const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    const isStandalone=!!(navigator.standalone||(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches));
    if(isIOS&&!isStandalone){
      button.hidden=true;
      status.textContent="برای اعلان در آیفون: این صفحه را در Safari باز کن، دکمه Share را بزن و Add to Home Screen را انتخاب کن؛ سپس برنامه GYM20 را از آیکون صفحه اصلی باز کن و اعلان را فعال کن. (نیازمند iOS 16.4 یا جدیدتر)";
      return;
    }
    if(!window.isSecureContext){
      button.disabled=true;
      status.textContent="اعلان فقط روی اتصال امن HTTPS فعال می‌شود. آدرس gym20.ir را باز کن.";
      return;
    }
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){
      button.disabled=true;
      status.textContent=isIOS
        ?"برای اعلان آیفون، iOS 16.4 یا جدیدتر و اجرای برنامه از آیکون Add to Home Screen لازم است."
        :"این مرورگر اعلان وب را پشتیبانی نمی‌کند. صفحه را در نسخه به‌روز Chrome، Firefox، Edge، Safari یا Zen باز کن؛ مرورگرهای داخلی بعضی برنامه‌ها پشتیبانی ندارند.";
      return;
    }

    const api=client.schema("gym20");
    let registration=null,publicKey="",configReady=false;
    const paint=active=>{
      button.dataset.active=active?"1":"0";
      button.hidden=!!active;
    };
    const friendlyError=error=>{
      const name=String(error?.name||"");
      const raw=String(error?.message||error||"");
      if(name==="NotAllowedError"||Notification.permission==="denied")
        return "اجازه اعلان برای gym20.ir مسدود است. از تنظیمات اعلان مرورگر یا گوشی، اجازه Notifications را فعال کن.";
      if(name==="SecurityError")
        return "مرورگر اجازه اعلان نمی‌دهد. مطمئن شو سایت با HTTPS باز شده و در حالت خصوصی مرورگر نیستی.";
      if(name==="InvalidStateError")
        return "اشتراک قبلی اعلان در مرورگر ناسازگار یا ناقص است. مجوز اعلان سایت را از تنظیمات مرورگر بررسی کن و دوباره تلاش کن.";
      if(/retriev.*push subscription|push subscription/i.test(raw))
        return "مرورگر Zen نتوانست اشتراک اعلان ذخیره‌شده را بخواند. مرورگر را به‌روز کن، مجوز اعلان gym20.ir را بررسی کن و دوباره فعال‌سازی را بزن.";
      if(/network|fetch|load failed|failed to fetch/i.test(raw))
        return "ارتباط با سرور اعلان برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.";
      return "فعال‌سازی اعلان انجام نشد. مرورگر را به‌روز کن و مجوز اعلان سایت gym20.ir را بررسی کن.";
    };
    const ensureReady=async()=>{
      let current=await navigator.serviceWorker.getRegistration("/");
      if(!current)current=await navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"});
      registration=current;
      try{await registration.update();}catch(_){}
      const ready=await navigator.serviceWorker.ready;
      registration=await navigator.serviceWorker.getRegistration("/")||ready;
      if(!registration||!registration.pushManager)throw new Error("PushManager unavailable");
      return registration;
    };
    const readSubscription=async()=>{
      try{return await registration.pushManager.getSubscription();}
      catch(firstError){
        // Retry once against the current root-scope service worker. Never unregister
        // here: doing so can disrupt other tabs and valid subscriptions on this device.
        try{
          registration=await navigator.serviceWorker.getRegistration("/")||registration;
          try{await registration.update();}catch(_){}
          await navigator.serviceWorker.ready;
          registration=await navigator.serviceWorker.getRegistration("/")||registration;
          return await registration.pushManager.getSubscription();
        }catch(_){throw firstError;}
      }
    };
    const saveSubscription=async subscription=>{
      const keys=subscription.toJSON().keys||{};
      if(!keys.p256dh||!keys.auth)throw new Error("Push subscription keys missing");
      const {error}=await api.rpc("subscribe_student_push",{
        p_code:shortCode,p_endpoint:subscription.endpoint,p_p256dh:keys.p256dh,p_auth:keys.auth,p_user_agent:navigator.userAgent
      });
      if(error)throw error;
    };

    button.addEventListener("click",async()=>{
      if(button.disabled||!configReady)return;
      button.disabled=true;
      try{
        if(Notification.permission==="denied")throw new Error("Notification permission denied");
        let permission=Notification.permission;
        if(permission!=="granted")permission=await Notification.requestPermission();
        if(permission!=="granted")throw new Error("Notification permission denied");
        await ensureReady();
        if(!publicKey)throw new Error("Push public key unavailable");
        let subscription=await readSubscription();
        if(!subscription){
          subscription=await registration.pushManager.subscribe({
            userVisibleOnly:true,
            applicationServerKey:decodePushKey(publicKey)
          });
        }
        await saveSubscription(subscription);
        paint(true);
        status.textContent="اعلان کلاس‌ها برای این دستگاه فعال شد ✓";
      }catch(error){
        status.textContent=friendlyError(error);
        paint(false);
      }finally{button.disabled=false;}
    });

    try{
      const {data,error}=await api.rpc("get_student_push_public_config");
      if(error)throw error;
      const config=Array.isArray(data)?data[0]:data;
      if(!config?.enabled||!config?.public_key){
        box.classList.add("hide");
        return;
      }
      publicKey=config.public_key;
      await ensureReady();
      let existing=null;
      try{
        existing=await readSubscription();
      }catch(subscriptionError){
        // Do not fail the schedule page because one browser cannot read its local
        // subscription. Leave a retry action available to the student.
        configReady=true;
        paint(false);
        button.disabled=false;
        button.textContent="تلاش دوباره برای فعال‌سازی اعلان";
        status.textContent=friendlyError(subscriptionError);
        return;
      }
      if(Notification.permission==="granted"&&existing){
        try{
          await saveSubscription(existing);
          paint(true);
          status.textContent="✓ اعلان فعال";
        }catch(saveError){
          paint(false);
          status.textContent="اشتراک مرورگر پیدا شد، اما ثبت آن در سرور انجام نشد. دکمه فعال‌سازی را بزن و دوباره تلاش کن.";
        }
      }else{
        paint(false);
        status.textContent=Notification.permission==="denied"
          ?"اجازه اعلان برای این سایت مسدود است؛ از تنظیمات مرورگر آن را فعال کن."
          :"برای دریافت یادآوری کلاس، دکمه فعال‌سازی را بزن.";
      }
      configReady=true;
      button.disabled=false;
      button.textContent="فعال‌سازی اعلان کلاس‌ها";
    }catch(error){
      // Keep the schedule usable and provide a retry instead of exposing browser
      // implementation-specific English exceptions.
      configReady=true;
      button.disabled=false;
      paint(false);
      button.textContent="تلاش دوباره برای فعال‌سازی اعلان";
      status.textContent=friendlyError(error);
    }
  }
  let terms=[];
  let activeView="grid";
  let viewStorageKey="gym20-session-view";
  function showTerm(id){
    const t=terms.find(x=>x.id===id)||terms[0];if(!t)return;
    $('termMeta').textContent='';
    const sessions=t.sessions||[];
    if(!sessions.length){$('schedule').innerHTML='<div class="empty">برای این ترم هنوز جلسه منتشرشده‌ای ثبت نشده است.</div>';return;}
    const done=sessions.filter(s=>['present','absent','excused','makeup','cancelled'].includes(s.attendance)).length;
    const now=Date.now();
    const allPublishedSessions=terms.flatMap(term=>(Array.isArray(term.sessions)?term.sessions:[]).map(s=>({session:s,termId:String(term.id||'')})));
    const toMs=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:NaN;};
    const allValid=allPublishedSessions.map(x=>({...x,startMs:toMs(x.session.starts_at),endMs:toMs(x.session.ends_at)})).filter(x=>Number.isFinite(x.startMs)&&Number.isFinite(x.endMs));
    const hasLiveSession=allValid.some(x=>x.startMs<=now&&now<x.endMs);
    const nextEntry=hasLiveSession?null:(allValid.filter(x=>x.startMs>now&&x.endMs>now).sort((a,b)=>a.startMs-b.startMs)[0]||null);
    const sessionIdentity=(s,termId)=>String(s.id||s.session_id||[termId,s.starts_at,s.ends_at,s.coach_name||''].join('|'));
    const upcomingIdentity=nextEntry?sessionIdentity(nextEntry.session,nextEntry.termId):'';
    $('schedule').innerHTML='<div class="session-list view-list">'+sessions.slice().sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).map((s,i)=>{const start=new Date(s.starts_at),end=new Date(s.ends_at),mins=Math.max(1,Math.round((end-start)/60000));const a=att[s.attendance||'pending']||att.pending;let timeClass='time-future',timeLabel='جلسه برگزار نشده';if(Number.isFinite(end.getTime())&&end.getTime()<=now){timeClass='time-past';timeLabel='جلسه برگزار شده';}else if(Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start.getTime()<=now&&now<end.getTime()){timeClass='time-live';timeLabel='در حال برگزاری';}else if(upcomingIdentity&&sessionIdentity(s,String(t.id||''))===upcomingIdentity){timeClass='time-next';timeLabel='جلسه آینده';}const statusText=timeClass==='time-live'?'در حال برگزاری':((s.attendance||'pending')==='pending'?timeLabel:a[0]);const date=new Date(s.starts_at),weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(date),dateText=latinDigits(faDate(s.starts_at));
      return '<article class="session-card session-compact-row '+timeClass+'"><div class="session-inline"><span class="session-fact session-number-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">جلسه</i><b class="session-number" style="text-align:center!important">'+num(i+1)+'</b></span><span class="session-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">روز</i><b style="text-align:center!important">'+weekday+'</b></span><span class="session-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">تاریخ</i><b class="session-date" style="text-align:center!important">'+dateText+'</b></span><span class="session-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">ساعت کلاس</i><b class="session-time" style="text-align:center!important">'+faTime(s.starts_at)+'</b></span><span class="session-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">مربی</i><b style="text-align:center!important">'+esc(s.coach_name||'تعیین نشده')+'</b></span><span class="session-fact session-status-fact" style="align-items:center!important;text-align:center!important"><i style="text-align:center!important">وضعیت</i><b class="status '+a[1]+' '+timeClass+'" style="text-align:center!important;justify-content:center!important;margin-inline:auto!important">'+statusText+'</b></span></div></article>';}).join('')+'</div>';

  }
  function celebrateExercise(title){
    document.getElementById('exerciseCelebration')?.remove();
    const overlay=document.createElement('div');
    overlay.id='exerciseCelebration';overlay.className='exercise-celebration';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','تمرین با موفقیت انجام شد');
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const flash=document.createElement('div');flash.className='achievement-flash';
    const shockwave=document.createElement('div');shockwave.className='achievement-shockwave';
    const stage=document.createElement('div');stage.className='achievement-stage';
    const halo=document.createElement('div');halo.className='achievement-halo';
    const ring=document.createElement('div');ring.className='achievement-ring';
    const medal=document.createElement('div');medal.className='achievement-medal';
    const medalFace=document.createElement('div');medalFace.className='achievement-medal-face';
    medalFace.innerHTML='<span class="achievement-cup"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="gym20CupGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".28" stop-color="#f5d77b"/><stop offset=".58" stop-color="#a97828"/><stop offset=".82" stop-color="#f4d477"/><stop offset="1" stop-color="#fff0b2"/></linearGradient></defs><path d="M34 20h52v12c0 25-10 39-26 43C44 71 34 57 34 32V20Z" fill="url(#gym20CupGold)" stroke="#fff0b8" stroke-width="2"/><path d="M34 28H17v8c0 17 10 26 25 27M86 28h17v8c0 17-10 26-25 27" fill="none" stroke="url(#gym20CupGold)" stroke-width="9" stroke-linecap="round"/><path d="M60 75v14M42 91h36M35 100h50" stroke="url(#gym20CupGold)" stroke-width="8" stroke-linecap="round"/><path d="m60 34 5 10 11 1-8 7 2 11-10-5-10 5 2-11-8-7 11-1 5-10Z" fill="#fff5cf"/></svg><span class="achievement-cup-word">GYM20</span></span>';
    const medalBack=document.createElement('div');medalBack.className='achievement-medal-back';
    medal.append(medalFace,medalBack);stage.append(halo,ring,medal);
    const beams=document.createElement('div');beams.className='achievement-beams';
    const card=document.createElement('div');card.className='exercise-celebration-card';
    const kicker=document.createElement('div');kicker.className='exercise-celebration-kicker';kicker.textContent='GYM20  •  POWER IN PROGRESS';
    const heading=document.createElement('div');heading.className='exercise-celebration-title';heading.textContent='یک قدم قوی‌تر شدی!';
    const exercise=document.createElement('div');exercise.className='exercise-celebration-exercise';exercise.textContent=title;
    const message=document.createElement('div');message.className='exercise-celebration-text';message.textContent='این حسِ رضایت، نتیجه تلاش خودته. ادامه بده؛ قوی‌تر از دیروز.';
    const close=document.createElement('button');close.className='exercise-celebration-close';close.type='button';close.textContent='ادامه تمرین  ↗';
    const closeCelebration=()=>{overlay.classList.add('is-closing');window.setTimeout(()=>{overlay.remove();document.removeEventListener('keydown',onKey);},260);};
    close.addEventListener('click',closeCelebration);
    card.append(kicker,heading,exercise,message,close);
    overlay.append(flash,shockwave,stage,beams,card);
    if(!reducedMotion){
      const count=Math.min(170,Math.max(105,Math.round(window.innerWidth*window.innerHeight/7200)));
      const colors=['#f6d77a','#fff2c6','#d4a94d','#e8e0c8','#fffaf0','#b98a35'];
      for(let n=0;n<count;n++){
        const particle=document.createElement('i');particle.className='achievement-particle';
        if(Math.random()>.62)particle.classList.add('achievement-paper');
        else particle.classList.add('achievement-glitter');
        particle.style.setProperty('--p-x',(Math.random()*100-50)+'vw');
        particle.style.setProperty('--p-drift',(Math.random()*54-27)+'vw');
        particle.style.setProperty('--p-top',(-Math.random()*95-8)+'vh');
        particle.style.setProperty('--p-r',(Math.random()*1440-720)+'deg');
        particle.style.setProperty('--p-flip',(Math.random()*.9+.12).toFixed(2));
        particle.style.setProperty('--p-delay',(Math.random()*1250)+'ms');
        particle.style.setProperty('--p-duration',(4200+Math.random()*3600)+'ms');
        particle.style.setProperty('--p-color',colors[Math.floor(Math.random()*colors.length)]);
        particle.style.setProperty('--p-size',(4+Math.random()*9)+'px');
        overlay.appendChild(particle);
      }
    }
    const onKey=e=>{if(e.key==='Escape')closeCelebration();};
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeCelebration();});
    document.addEventListener('keydown',onKey);
    document.body.appendChild(overlay);
    close.focus({preventScroll:true});
    window.setTimeout(()=>{if(overlay.isConnected)closeCelebration();},5200);
  }
  async function loadStudentExercises(shortCode,token,client){
    const panel=$('exercisePanel'),list=$('exerciseList'),feedback=$('exerciseFeedback');
    if(!panel||!list)return;
    panel.classList.remove('hide');
    try{
      const exerciseResult=shortCode
        ?await client.schema('gym20').rpc('get_student_exercises_by_code',{p_code:shortCode})
        :await client.schema('gym20').rpc('get_student_exercises_by_token',{p_token:token});
      const {data,error}=exerciseResult;
      if(error)throw error;
      const items=Array.isArray(data)?data:[];
      if(!items.length){panel.classList.add('hide');return;}
      list.innerHTML=items.map(item=>{
        const done=!!item.is_completed;
        return '<label class="exercise-row '+(done?'completed':'')+'" data-exercise-row="'+esc(item.id)+'"><input type="checkbox" data-exercise-id="'+esc(item.id)+'" '+(done?'checked':'')+'><span class="exercise-title">'+esc(item.title)+'</span><span class="exercise-checkmark">'+(done?'✓':'')+'</span></label>';
      }).join('');
      panel.classList.remove('hide');
      if(!list.dataset.bound){
        list.dataset.bound='1';
        list.addEventListener('change',async e=>{
          const input=e.target.closest('input[data-exercise-id]');if(!input)return;
          const row=input.closest('[data-exercise-row]'),id=input.dataset.exerciseId,completed=input.checked;
          input.disabled=true;row.classList.toggle('completed',completed);
          const mark=row.querySelector('.exercise-checkmark');if(mark)mark.textContent=completed?'✓':'';
          feedback.textContent=completed?'در حال ثبت انجام تمرین…':'در حال به‌روزرسانی…';
          try{
            const updateResult=shortCode
              ?await client.schema('gym20').rpc('set_student_exercise_completion',{p_code:shortCode,p_exercise_id:id,p_completed:completed})
              :await client.schema('gym20').rpc('set_student_exercise_completion_by_token',{p_token:token,p_exercise_id:id,p_completed:completed});
            const {data,error}=updateResult;
            if(error)throw error;
            if(data!==true)throw new Error('ثبت وضعیت تمرین انجام نشد.');
            feedback.textContent=completed?'آفرین! تمرینت ثبت شد 💪':'وضعیت تمرین به‌روزرسانی شد.';if(completed)celebrateExercise(row.querySelector('.exercise-title')?.textContent||'تمرین');
          }catch(err){
            input.checked=!completed;row.classList.toggle('completed',!completed);
            if(mark)mark.textContent=!completed?'✓':'';
            feedback.textContent='ثبت تغییر انجام نشد؛ دوباره تلاش کن.';
            console.warn('GYM20 exercise update failed:',err);
          }finally{input.disabled=false;}
        });
      }
    }catch(err){
      panel.classList.remove('hide');
      list.innerHTML='<div class="empty">بارگذاری تمرین‌ها انجام نشد.</div>';
      feedback.textContent='اتصال برای دریافت تمرین‌ها برقرار نشد.';
      console.warn('GYM20 exercise load failed:',err);
    }
  }
  async function init(){
    const params=new URLSearchParams(location.search);
    const token=params.get('t');
    const shortCode=(location.pathname.match(/\/s\/([0-9a-f]{12})\/?$/i)||[])[1]||params.get('c');
    viewStorageKey='gym20-session-view-'+(shortCode||'token');
    try{const saved=localStorage.getItem(viewStorageKey);if(['grid','list'].includes(saved))activeView=saved;}catch(_){}
    if((!token||!/^[0-9a-f]{64}$/.test(token))&&(!shortCode||!/^[0-9a-f]{12}$/.test(shortCode))){$('studentName').textContent='لینک معتبر نیست یا ناقص است.';$('schedule').textContent='لطفاً لینک اختصاصی را از مربی دریافت کنید.';return;}
    try{
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{db:{schema:'gym20'},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const getSchedule=async()=>{
        const result=shortCode
          ?await client.schema('gym20').rpc('get_student_public_schedule_by_code',{p_code:shortCode})
          :await client.schema('gym20').rpc('get_student_public_schedule',{p_token:token});
        if(result.error)throw result.error;
        if(!result.data||!result.data.student)throw Error('لینک برنامه معتبر نیست یا غیرفعال شده است.');
        return result.data;
      };
      const data=await getSchedule();
      $('studentName').textContent='هنرجو: '+data.student.full_name;
      if(shortCode)setupPush(shortCode,client);loadStudentExercises(shortCode,token,client);
      terms=Array.isArray(data.terms)?data.terms:[];
      if(!terms.length){$('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';return;}
      $('termPanel').classList.remove('hide');
      const updateTermOptions=(selectedId)=>{
        const select=$('termSelect');
        select.innerHTML=terms.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
        select.value=terms.some(t=>String(t.id)===String(selectedId))?selectedId:terms[0].id;
        select._gym20RenderWheel?.();
        select.dispatchEvent(new Event('change',{bubbles:true}));
      };
      updateTermOptions(terms[0].id);
      enhanceTermPicker($('termSelect'));
      $('termSelect').addEventListener('change',e=>showTerm(e.target.value));
      showTerm(terms[0].id);

      // IMPORTANT: fetch the latest published schedule, not just repaint stale data.
      // Previously this timer only called showTerm() on the old in-memory terms array.
      let refreshInFlight=false;
      const refreshPublishedSchedule=async()=>{
        if(refreshInFlight||document.visibilityState==='hidden')return;
        refreshInFlight=true;
        try{
          const fresh=await getSchedule();
          const selectedId=$('termSelect')?.value||terms[0]?.id;
          terms=Array.isArray(fresh.terms)?fresh.terms:[];
          $('studentName').textContent='هنرجو: '+(fresh.student?.full_name||'');
          if(!terms.length){
            $('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';
            return;
          }
          updateTermOptions(selectedId);
          const currentId=$('termSelect')?.value||terms[0].id;
          showTerm(currentId);
        }catch(err){console.warn('GYM20 student schedule live refresh failed:',err);}
        finally{refreshInFlight=false;}
      };
      window.setInterval(refreshPublishedSchedule,5000);
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')refreshPublishedSchedule();
      });
    }catch(e){console.error(e);$('studentName').textContent='دریافت برنامه با خطا مواجه شد.';$('schedule').textContent='بارگذاری برنامه ناموفق بود. لطفاً صفحه را دوباره باز کنید؛ اگر مشکل ادامه داشت به مربی اطلاع دهید.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();