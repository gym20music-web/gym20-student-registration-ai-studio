(() => {
  const SUPABASE_URL='https://ubrafxjpnqtjnjdaskba.supabase.co';
  const SUPABASE_KEY='sb_publishable_hqqbaInJ5kXtySlybUdwjA_i0QHxpV3';
  const $=id=>document.getElementById(id);
  function createStudentClient(){
    const baseHeaders={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'};
    const rpc=async(schema,name,args)=>{
      try{
        const headers={...baseHeaders,'Accept-Profile':schema,'Content-Profile':schema};
        const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+encodeURIComponent(name),{method:'POST',headers,body:JSON.stringify(args||{}),cache:'no-store'});
        const payload=await response.json().catch(()=>null);
        if(!response.ok)return {data:null,error:{message:payload?.message||payload?.error||('HTTP '+response.status),code:payload?.code,details:payload?.details,hint:payload?.hint,status:response.status}};
        return {data:payload,error:null};
      }catch(error){return {data:null,error};}
    };
    return {
      rpc:(name,args)=>rpc('gym20',name,args),
      schema:schema=>({rpc:(name,args)=>rpc(schema,name,args)}),
      functions:{
        invoke:async(name,options={})=>{
          try{
            const response=await fetch(SUPABASE_URL+'/functions/v1/'+encodeURIComponent(name),{method:'POST',headers:baseHeaders,body:JSON.stringify(options.body||{}),cache:'no-store'});
            const data=await response.json().catch(()=>null);
            if(!response.ok)return {data,error:new Error(data?.error||data?.message||('HTTP '+response.status))};
            return {data,error:null};
          }catch(error){return {data:null,error};}
        }
      }
    };
  }
  const exerciseScrollStyle=document.createElement('style');
  exerciseScrollStyle.textContent=`
    #exercisePanel #exerciseList{
      display:grid!important;gap:7px!important;
      max-height:none!important;min-height:0!important;
      overflow-y:auto!important;overflow-x:hidden!important;
      overscroll-behavior:contain!important;
      scrollbar-width:thin;scrollbar-color:rgba(210,177,105,.55) rgba(255,255,255,.045);
      padding:2px 4px 2px 1px!important;
      -webkit-overflow-scrolling:touch!important;
    }
    #exercisePanel #exerciseList::-webkit-scrollbar{width:5px}
    #exercisePanel #exerciseList::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:8px}
    #exercisePanel #exerciseList::-webkit-scrollbar-thumb{background:rgba(210,177,105,.55);border-radius:8px}
  `;
  document.head.appendChild(exerciseScrollStyle);

  let pendingClassNotice="";
  try{
    const url=new URL(location.href);
    // Prefer the query payload (survives Android PWA/fallback navigation),
    // then accept the hash used by previously installed service workers.
    pendingClassNotice=String(url.searchParams.get("gym20_notice")||"").trim();
    if(!pendingClassNotice){
      const hash=String(url.hash||"");
      const marker="gym20-notice=";
      const index=hash.indexOf(marker);
      if(index>=0)pendingClassNotice=decodeURIComponent(hash.slice(index+marker.length).split("&")[0]).slice(0,1200);
    }
    if(pendingClassNotice){
      url.searchParams.delete("gym20_notice");
      if(url.hash.startsWith("#gym20-notice="))url.hash="";
      history.replaceState(null,"",url.pathname+url.search+url.hash);
      pendingClassNotice=pendingClassNotice.slice(0,1200);
    }
  }catch(error){console.warn("GYM20 notification message recovery failed:",error);}
  function showClassNotice(message){
    const text=String(message||"").trim();
    if(!text)return;
    document.getElementById("gym20ClassNotice")?.remove();
    const style=document.createElement("style");
    style.id="gym20ClassNoticeStyle";
    style.textContent=`
      #gym20ClassNotice{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:18px;background:radial-gradient(ellipse at 50% 42%,rgba(27,39,52,.42),rgba(2,5,9,.88));backdrop-filter:blur(13px);-webkit-backdrop-filter:blur(13px);animation:g20NoticeFade .22s ease-out}
      #gym20ClassNotice .notice-card{position:relative;isolation:isolate;box-sizing:border-box;width:min(100%,420px);max-height:min(78dvh,620px);overflow:auto;padding:23px 20px 18px;border:1px solid rgba(218,184,103,.32);border-radius:20px;background:linear-gradient(145deg,rgba(35,44,55,.98),rgba(13,18,25,.99) 72%);box-shadow:0 28px 85px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.07);animation:g20NoticeRise .32s cubic-bezier(.2,.8,.2,1)}
      #gym20ClassNotice .notice-card:before{content:"";position:absolute;z-index:-1;inset:0 18% auto;height:1px;background:linear-gradient(90deg,transparent,rgba(232,196,107,.9),transparent)}
      #gym20ClassNotice .notice-kicker{display:flex;align-items:center;justify-content:center;gap:8px;color:#e6c477;font:800 9px Montserrat,sans-serif;letter-spacing:1.8px;text-align:center}
      #gym20ClassNotice .notice-kicker:before,#gym20ClassNotice .notice-kicker:after{content:"";width:23px;height:1px;background:linear-gradient(90deg,transparent,#b99755)}
      #gym20ClassNotice .notice-kicker:after{transform:rotate(180deg)}
      #gym20ClassNotice .notice-title{margin:13px 0 15px;color:#f4f1e8;font:800 16px Vazirmatn,sans-serif;text-align:center}
      #gym20ClassNotice .notice-body{box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;padding:17px 14px;border:1px solid rgba(218,184,103,.2);border-radius:13px;background:linear-gradient(135deg,rgba(218,184,103,.085),rgba(255,255,255,.025));color:#fff;font:800 15px/2 Vazirmatn,sans-serif;text-align:center;text-shadow:0 1px 16px rgba(218,184,103,.12)}
      #gym20ClassNotice .notice-close{width:100%;min-height:38px;margin-top:17px;border:1px solid rgba(232,196,107,.55);border-radius:10px;background:linear-gradient(110deg,#e2c477,#b9944e);box-shadow:0 7px 20px rgba(190,151,73,.14);color:#17140e;font:800 11px Vazirmatn,sans-serif;transition:transform .18s ease,filter .18s ease}
      #gym20ClassNotice .notice-close:active{transform:scale(.985);filter:brightness(.95)}
      @keyframes g20NoticeFade{from{opacity:0}to{opacity:1}}
      @keyframes g20NoticeRise{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(prefers-reduced-motion:reduce){#gym20ClassNotice,#gym20ClassNotice .notice-card{animation:none}}
    `;
    if(!document.getElementById("gym20ClassNoticeStyle"))document.head.appendChild(style);
    const overlay=document.createElement("div");
    overlay.id="gym20ClassNotice";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","متن اعلان کلاس");
    const card=document.createElement("section");card.className="notice-card";
    const kicker=document.createElement("div");kicker.className="notice-kicker";kicker.textContent="GYM20";
    const heading=document.createElement("div");heading.className="notice-title";heading.textContent="وقت قدرته! وقت تمرینه.";
    const body=document.createElement("div");body.className="notice-body";body.textContent=text;
    const close=document.createElement("button");close.type="button";close.className="notice-close";close.textContent="متوجه شدم";
    const dismiss=()=>{overlay.remove();document.removeEventListener("keydown",onKey);};
    const onKey=e=>{if(e.key==="Escape")dismiss();};
    close.addEventListener("click",dismiss);
    overlay.addEventListener("click",e=>{if(e.target===overlay)dismiss();});
    card.append(kicker,heading,body,close);overlay.appendChild(card);document.body.appendChild(overlay);
    document.addEventListener("keydown",onKey);close.focus({preventScroll:true});
  }
  // Show the notification message as soon as the student page script starts.
  // Do not wait for the schedule API: slow mobile connections must not hide the message.
  if(pendingClassNotice){
    const notice=pendingClassNotice;
    pendingClassNotice="";
    requestAnimationFrame(()=>showClassNotice(notice));
  }
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
  const faDateTime=v=>{if(!v)return '—';const d=new Date(v),fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}),p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value])),weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(d);return weekday+' · '+p.year+'/'+p.month+'/'+p.day;};
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
    status.textContent="";button.disabled=true;button.textContent="فعال‌سازی اعلان کلاس‌ها";
    const ua=navigator.userAgent||"";
    const isIOS=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    const isStandalone=!!(navigator.standalone||(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches));
    if(isIOS&&!isStandalone){box.classList.add("hide");return;}
    if(!window.isSecureContext){box.classList.add("hide");return;}
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){box.classList.add("hide");return;}
    const endpoint=SUPABASE_URL+"/functions/v1/student-push";
    let registration=null,publicKey="",configReady=false;
    const paint=active=>{button.dataset.active=active?"1":"0";button.hidden=!!active;};
    const friendlyError=error=>{
      const name=String(error?.name||""),raw=String(error?.message||error||"");
      if(name==="NotAllowedError"||Notification.permission==="denied")return "اجازه اعلان برای gym20.ir مسدود است. از تنظیمات اعلان مرورگر یا گوشی، اجازه Notifications را فعال کن.";
      if(name==="SecurityError")return "مرورگر اجازه اعلان نمی‌دهد. مطمئن شو سایت با HTTPS باز شده و در حالت خصوصی مرورگر نیستی.";
      if(name==="InvalidStateError")return "اشتراک قبلی اعلان در مرورگر ناسازگار یا ناقص است. مجوز اعلان سایت را بررسی کن و دوباره تلاش کن.";
      if(/network|fetch|load failed|failed to fetch/i.test(raw))return "ارتباط با سرویس اعلان برقرار نشد. اینترنت را بررسی کن و دوباره تلاش کن.";
      return raw&&raw.length<220?raw:"فعال‌سازی اعلان انجام نشد. دوباره تلاش کن.";
    };
    const withTimeout=(promise,ms,message)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(message)),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
    const requestPush=async(method,body)=>{
      const response=await withTimeout(fetch(endpoint+(method==="GET"?"?code="+encodeURIComponent(shortCode):""),{method,headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined}),12000,"ارتباط با سرویس اعلان بیش از حد طول کشید.");
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.ok===false)throw new Error(data.error||"سرویس اعلان پاسخ معتبر نداد.");
      return data;
    };
    const ensureReady=async()=>{
      let current=await withTimeout(navigator.serviceWorker.getRegistration("/"),7000,"مهلت بررسی سرویس‌ورکر تمام شد.");
      if(!current)current=await withTimeout(navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}),9000,"ثبت سرویس‌ورکر بیش از حد طول کشید.");
      registration=current;
      const ready=await withTimeout(navigator.serviceWorker.ready,9000,"سرویس‌ورکر در زمان مجاز آماده نشد.");
      registration=await withTimeout(navigator.serviceWorker.getRegistration("/"),5000,"بررسی سرویس‌ورکر ناموفق بود.")||ready;
      if(!registration||!registration.pushManager)throw new Error("مرورگر امکان ساخت اشتراک اعلان را فراهم نکرد.");
      return registration;
    };
    const readSubscription=async()=>{
      try{return await withTimeout(registration.pushManager.getSubscription(),7000,"مهلت خواندن اشتراک اعلان تمام شد.");}
      catch(firstError){
        try{registration=await withTimeout(navigator.serviceWorker.getRegistration("/"),5000,"مهلت بررسی سرویس‌ورکر تمام شد.")||registration;try{await withTimeout(registration.update(),5000,"مهلت به‌روزرسانی سرویس‌ورکر تمام شد.");}catch(_){}await withTimeout(navigator.serviceWorker.ready,7000,"سرویس‌ورکر برای خواندن اشتراک آماده نشد.");registration=await withTimeout(navigator.serviceWorker.getRegistration("/"),5000,"مهلت بررسی سرویس‌ورکر تمام شد.")||registration;return await withTimeout(registration.pushManager.getSubscription(),7000,"مهلت خواندن اشتراک تمام شد.");}
        catch(_){throw firstError;}
      }
    };
    const saveSubscription=async subscription=>{const data=await requestPush("POST",{action:"subscribe",code:shortCode,subscription:subscription.toJSON(),user_agent:navigator.userAgent});if(!data.ok)throw new Error(data.error||"ثبت اشتراک در سرور انجام نشد.");};
    button.addEventListener("click",async()=>{
      if(button.disabled||!configReady)return;button.disabled=true;
      try{
        if(Notification.permission==="denied")throw new Error("اجازه اعلان برای gym20.ir در تنظیمات مرورگر مسدود است.");
        const hadPermission=Notification.permission==="granted";
        let permission=Notification.permission;if(permission!=="granted")permission=await Notification.requestPermission();
        if(permission!=="granted")throw new Error("اجازه نمایش اعلان داده نشد.");
        // The service worker is prepared before the user taps. Avoid extra awaits
        // between Safari iOS permission approval and subscribe(), which requires
        // a direct user gesture in an installed Home Screen web app.
        if(!registration)await ensureReady();
        if(!publicKey)throw new Error("کلید عمومی اعلان از سرور دریافت نشد.");
        let subscription=null;
        if(isIOS&&!hadPermission){
          subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(publicKey)});
        }else{
          // Some browsers throw when reading a stale local subscription.
          // Do not let that read failure block creating a fresh subscription.
          try{subscription=await readSubscription();}catch(readError){console.warn("GYM20 old push subscription could not be read; creating a fresh subscription:",readError);}
          if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(publicKey)});
        }
        await saveSubscription(subscription);paint(true);status.textContent="اعلان کلاس‌ها برای این دستگاه فعال شد ✓";
      }catch(error){status.textContent=friendlyError(error);paint(false);}
      finally{button.disabled=false;}
    });
    try{
      const config=await requestPush("GET");if(!config.enabled){box.classList.add("hide");return;}
      publicKey=config.public_key||"";if(!publicKey)throw new Error("کلید عمومی اعلان در سرویس ثبت نشده است.");
      await ensureReady();let existing=null;
      // Browsers may reject getSubscription() before notification permission is granted.
      // Only inspect an existing push subscription after the user has granted permission.
      if(Notification.permission==="granted"){
        try{
          existing=await readSubscription();
          if(existing){
            const bound=existing.options?.applicationServerKey;
            const actual=bound?Array.from(new Uint8Array(bound)):[];
            const expected=Array.from(decodePushKey(publicKey));
            if(actual.length!==expected.length||actual.some((value,index)=>value!==expected[index])){
              await withTimeout(existing.unsubscribe(),7000,"اشتراک قبلی اعلان آزاد نشد.");
              existing=null;
            }
          }
        }
        catch(subscriptionError){configReady=true;paint(false);button.disabled=false;button.textContent="تلاش دوباره برای فعال‌سازی اعلان";status.textContent="";box.classList.remove("hide");console.warn("GYM20 existing push subscription read failed:",subscriptionError);return;}
      }
      if(Notification.permission==="granted"&&existing){
        try{await saveSubscription(existing);paint(true);status.textContent="✓ اعلان فعال";}
        catch(saveError){paint(false);status.textContent="اشتراک مرورگر پیدا شد، اما ثبت آن در سرور انجام نشد. دوباره فعال‌سازی را بزن.";}
      }else{paint(false);status.textContent=Notification.permission==="denied"?"اجازه اعلان برای این سایت مسدود است؛ از تنظیمات مرورگر آن را فعال کن.":"";}
      configReady=true;button.disabled=false;button.textContent="فعال‌سازی اعلان کلاس‌ها";box.classList.remove("hide");
    }catch(error){configReady=true;button.disabled=false;paint(false);button.textContent="تلاش دوباره برای فعال‌سازی اعلان";status.textContent=friendlyError(error);box.classList.remove("hide");}
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
  const tehranDateKey=value=>{
    if(!value)return '';
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return parts.year+'-'+parts.month+'-'+parts.day;
  };
  const tehranTodayKey=()=>tehranDateKey(Date.now());
  const tehranDayLabel=value=>{
    const date=new Date(value);
    const weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(date);
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return weekday+' - '+parts.year+'/'+parts.month+'/'+parts.day;
  };
  function exerciseRowsMarkup(items){
    return items.map(item=>{
      const done=!!item.is_completed;
      const stamp=Date.parse(item.created_at||'');
      return '<label class="exercise-row '+(done?'completed':'')+'" data-exercise-row="'+esc(item.id)+'" data-created-at="'+(Number.isFinite(stamp)?stamp:0)+'"><input type="checkbox" data-exercise-id="'+esc(item.id)+'" '+(done?'checked':'')+'><span class="exercise-title">'+esc(item.title)+'</span><span class="exercise-checkmark">'+(done?'✓':'')+'</span></label>';
    }).join('');
  }
  function groupExerciseRowsMarkup(items){
    return items.map(item=>{
      const members=Array.isArray(item.members)?item.members:[];
      const memberMarkup=members.map(member=>{
        const name=esc(member.full_name||'هنرجو');
        if(member.is_self)return '<label class="group-member-self"><input type="checkbox" data-group-exercise-id="'+esc(item.id)+'" '+(member.is_completed?'checked':'')+'><span>'+name+' (شما)</span></label>';
        return '<span class="group-member-status '+(member.is_completed?'done':'pending')+'"><i>'+(member.is_completed?'✓':'×')+'</i><span>'+name+'</span></span>';
      }).join('');
      return '<article class="group-exercise-card"><div class="group-exercise-title"><strong>'+esc(item.title)+'</strong></div><div class="group-exercise-members">'+memberMarkup+'</div></article>';
    }).join('');
  }
  function groupExerciseDayMarkup(items){
    const byGroup=new Map();
    items.forEach(item=>{const key=String(item.group_name||'گروه');if(!byGroup.has(key))byGroup.set(key,[]);byGroup.get(key).push(item);});
    return Array.from(byGroup.entries()).map(([name,rows])=>'<section class="group-exercise-set"><div class="group-exercise-set-title">تمرین گروهی · '+esc(name)+'</div>'+groupExerciseRowsMarkup(rows)+'</section>').join('');
  }
  async function loadStudentExercises(shortCode,token,client){
    const panel=$('exercisePanel'),list=$('exerciseList'),archive=$('exerciseArchive'),feedback=$('exerciseFeedback'),groupList=$('groupExerciseList');
    if(!panel||!list||!archive)return;
    const selectedTermId=$('termSelect')?.value||'';
    if(list.dataset.loaded!=='1'){panel.classList.remove('hide');list.innerHTML='<div class="exercise-loading">در حال دریافت تمرین‌ها…</div>';}
    try{
      const exerciseResult=shortCode
        ?await client.rpc('get_student_exercises_by_code',{p_code:shortCode})
        :await client.schema('gym20').rpc('get_student_exercises_by_token',{p_token:token});
      const {data,error}=exerciseResult;
      if(error)throw error;
      const allItems=Array.isArray(data)?data:[];
      const items=selectedTermId?allItems.filter(item=>item.kind!=='group'&&String(item.term_id||'')===String(selectedTermId)):[];
      const groupItems=allItems.filter(item=>item.kind==='group');
      const groupBox=$('groupExerciseBox');
      const individualBox=$('individualExerciseBox');
      const openDays=new Set(Array.from(archive.querySelectorAll('details[open]')).map(node=>node.dataset.day||''));
      const today=tehranTodayKey();
      const mainItems=items.filter(item=>!item.is_completed||!item.completed_at||tehranDateKey(item.completed_at)===today);
      const archivedItems=items.filter(item=>!!item.is_completed&&!!item.completed_at&&tehranDateKey(item.completed_at)!==today);
      mainItems.sort((a,b)=>Number(!!a.is_completed)-Number(!!b.is_completed)||Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
      const countHint=$('exerciseCountHint');
      list.innerHTML=!selectedTermId?'':(mainItems.length?exerciseRowsMarkup(mainItems):'<div class="empty">برای امروز تمرین در انتظاری ندارید.</div>');
      const groups=new Map();
      archivedItems.forEach(item=>{
        const key=tehranDateKey(item.completed_at);
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(item);
      });
      archive.innerHTML=Array.from(groups.entries()).sort((a,b)=>b[0].localeCompare(a[0])).map(([day,rows])=>{
        rows.sort((a,b)=>Date.parse(b.completed_at)-Date.parse(a.completed_at));
        const opened=openDays.has(day)?' open':'';
        return '<details class="exercise-archive-day" data-day="'+day+'"'+opened+'><summary>تمرینات من ـ '+tehranDayLabel(rows[0].completed_at)+'</summary><div class="exercise-archive-list">'+exerciseRowsMarkup(rows)+'</div></details>';
      }).join('');
      if(!items.length&&selectedTermId){list.innerHTML='<div class="empty">برای این ترم تمرینی ثبت نشده است.</div>';}
      const mainRows=Array.from(list.querySelectorAll('.exercise-row'));
      list.style.display='flex';list.style.flexDirection='column';list.style.gap='7px';
      mainRows.forEach(row=>{row.style.flex='0 0 auto';});
      if(mainRows.length>5){
        const visible=mainRows.slice(0,4);
        const height=visible.reduce((sum,row)=>sum+row.getBoundingClientRect().height,0)+7*Math.max(0,visible.length-1);
        list.style.height=Math.ceil(height)+'px';list.style.maxHeight=Math.ceil(height)+'px';list.style.overflowY='auto';list.style.overscrollBehavior='contain';list.style.webkitOverflowScrolling='touch';
      }else{list.style.height='auto';list.style.maxHeight='none';list.style.overflowY='visible';}
      archive.classList.toggle('hide',groups.size===0);
      const todayGroupItems=groupItems.filter(item=>tehranDateKey(item.created_at)===today);
      const numberFa=value=>new Intl.NumberFormat('fa-IR').format(value);
      const individualDone=items.filter(item=>!!item.is_completed).length;
      const individualPending=items.length-individualDone;
      const individualCountHint=$('individualExerciseCount');
      if(individualCountHint){
        individualCountHint.textContent=numberFa(items.length)+' تمرین · '+numberFa(individualDone)+' انجام‌شده';
      }
      if(countHint){
        countHint.textContent=individualPending?numberFa(individualPending)+' تمرین باقی‌مانده برای انجام 💪🏻':'همه تمرین‌ها انجام شده‌اند ✓';
      }
      const ownGroupItems=groupItems.filter(item=>(Array.isArray(item.members)?item.members:[]).some(member=>member.is_self));
      const groupDone=ownGroupItems.filter(item=>(item.members||[]).some(member=>member.is_self&&member.is_completed)).length;
      const groupPending=Math.max(0,ownGroupItems.length-groupDone);
      const groupCountHint=$('groupExerciseCount');
      if(groupCountHint){
        groupCountHint.textContent=numberFa(ownGroupItems.length)+' تمرین · '+numberFa(groupDone)+' انجام‌شده';
      }
      const syncSection=(buttonId,contentId,pending)=>{
        const button=$(buttonId),content=$(contentId);
        if(!button||!content)return;
        const expanded=pending>0;
        button.setAttribute('aria-expanded',String(expanded));
        content.hidden=!expanded;
      };
      syncSection('groupExerciseToggle','groupExerciseContent',groupPending);
      syncSection('individualExerciseToggle','individualExerciseContent',individualPending);
      const oldGroupDays=new Map();
      groupItems.filter(item=>tehranDateKey(item.created_at)!==today).forEach(item=>{
        const day=tehranDateKey(item.created_at);if(!oldGroupDays.has(day))oldGroupDays.set(day,[]);oldGroupDays.get(day).push(item);
      });
      const groupArchiveMarkup=Array.from(oldGroupDays.entries()).sort((a,b)=>b[0].localeCompare(a[0])).map(([day,rows])=>
        '<details class="group-exercise-archive-day" data-group-day="'+esc(day)+'"><summary>'+esc(tehranDayLabel(rows[0].created_at))+' <span>'+rows.length.toLocaleString('fa-IR')+' تمرین</span></summary>'+groupExerciseDayMarkup(rows)+'</details>'
      ).join('');
      if(groupList){
        groupList.innerHTML=(todayGroupItems.length?'<div class="group-exercise-today">'+groupExerciseDayMarkup(todayGroupItems)+'</div>':'')+
          (oldGroupDays.size?'<details class="group-exercise-archive"><summary>تمرین‌های روزهای قبل <span>'+groupItems.length.toLocaleString('fa-IR')+' تمرین گروهی</span></summary><div class="group-exercise-archive-days">'+groupArchiveMarkup+'</div></details>':'');
      }
      groupBox?.classList.toggle('hide',groupItems.length===0);
      individualBox?.classList.toggle('hide',items.length===0);
      panel.classList.toggle('hide',items.length===0&&groupItems.length===0);
      list.dataset.loaded='1';if(feedback)feedback.textContent='';
      if(!panel.dataset.bound){
        panel.dataset.bound='1';
        panel.addEventListener('change',async e=>{
          const groupInput=e.target.closest('input[data-group-exercise-id]');
          if(groupInput){
            const id=groupInput.dataset.groupExerciseId,completed=groupInput.checked;groupInput.disabled=true;
            try{
              const {data,error}=await client.rpc('set_student_group_exercise_completion',{p_code:shortCode,p_exercise_id:id,p_completed:completed});
              if(error)throw error;if(data!==true)throw new Error('ثبت وضعیت تمرین گروهی انجام نشد.');
              if(feedback)feedback.textContent=completed?'آفرین! انجام تمرین گروهی ثبت شد 💪':'وضعیت تمرین گروهی به‌روزرسانی شد.';
              if(completed){
                const title=groupInput.closest('.group-exercise-card')?.querySelector('.group-exercise-title strong')?.textContent||'تمرین گروهی';
                celebrateExercise(title);
                client.functions.invoke('student-push',{body:{action:'exercise-completed',code:shortCode,exercise_id:id}})
                  .then(({data,error})=>{if(error||!data?.ok)console.warn('GYM20 group exercise notification was not delivered:',error||data?.error||'unknown error');})
                  .catch(err=>console.warn('GYM20 group exercise notification failed:',err));
              }
              await loadStudentExercises(shortCode,token,client);
            }catch(err){groupInput.checked=!completed;if(feedback)feedback.textContent='ثبت تمرین گروهی انجام نشد؛ دوباره تلاش کن.';console.warn('GYM20 group exercise update failed:',err);}
            finally{groupInput.disabled=false;}
            return;
          }
          const input=e.target.closest('input[data-exercise-id]');if(!input)return;
          const row=input.closest('[data-exercise-row]'),id=input.dataset.exerciseId,completed=input.checked;
          input.disabled=true;row.classList.toggle('completed',completed);
          const mark=row.querySelector('.exercise-checkmark');if(mark)mark.textContent=completed?'✓':'';
          feedback.textContent=completed?'در حال ثبت انجام تمرین…':'در حال به‌روزرسانی…';
          try{
            const updateResult=shortCode
              ?await client.rpc('set_student_exercise_completion',{p_code:shortCode,p_exercise_id:id,p_completed:completed})
              :await client.schema('gym20').rpc('set_student_exercise_completion_by_token',{p_token:token,p_exercise_id:id,p_completed:completed});
            const {data,error}=updateResult;
            if(error)throw error;
            if(data!==true)throw new Error('ثبت وضعیت تمرین انجام نشد.');
            feedback.textContent=completed?'آفرین! تمرینت ثبت شد 💪':'وضعیت تمرین به‌روزرسانی شد.';
            if(completed){
              const exerciseTitle=row.querySelector('.exercise-title')?.textContent||'تمرین';
              celebrateExercise(exerciseTitle);
              if(shortCode){
                client.functions.invoke('student-push',{body:{action:'exercise-completed',code:shortCode,exercise_id:id}})
                  .then(({data,error})=>{if(error||!data?.ok)console.warn('GYM20 admin exercise notification was not delivered:',error||data?.error||'unknown error');})
                  .catch(err=>console.warn('GYM20 admin exercise notification failed:',err));
              }
            }
            await loadStudentExercises(shortCode,token,client);
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
      if(list.dataset.loaded!=='1')list.innerHTML='<div class="empty">در حال تلاش دوباره برای دریافت تمرین‌ها…</div>';
      feedback.textContent='اتصال موقتاً برقرار نشد؛ دریافت تمرین‌ها دوباره تلاش می‌شود.';
      console.warn('GYM20 exercise load failed:',{message:err?.message||String(err),code:err?.code||null,details:err?.details||null,hint:err?.hint||null,status:err?.status||null});
    }
  }
  async function init(){
    const bindExerciseToggle=(buttonId,contentId)=>{
      const button=$(buttonId),content=$(contentId);
      if(!button||!content||button.dataset.bound)return;
      button.dataset.bound='1';
      button.addEventListener('click',()=>{
        const expanded=button.getAttribute('aria-expanded')==='true';
        button.setAttribute('aria-expanded',String(!expanded));
        content.hidden=expanded;
      });
    };
    bindExerciseToggle('groupExerciseToggle','groupExerciseContent');
    bindExerciseToggle('individualExerciseToggle','individualExerciseContent');
    const params=new URLSearchParams(location.search);
    const token=params.get('t');
    const pathCode=(location.pathname.match(/\/s\/([0-9a-f]{12})\/?$/i)||[])[1]||'';
    let shortCode=pathCode||params.get('c')||'';
    try{
      if(/^[0-9a-f]{12}$/i.test(shortCode)){
        shortCode=shortCode.toLowerCase();
        localStorage.setItem('gym20_student_launch_code',shortCode);
      }else{
        const savedCode=localStorage.getItem('gym20_student_launch_code')||'';
        if(/^[0-9a-f]{12}$/i.test(savedCode))shortCode=savedCode.toLowerCase();
      }
    }catch(_){}
    viewStorageKey='gym20-session-view-'+(shortCode||'token');
    try{const saved=localStorage.getItem(viewStorageKey);if(['grid','list'].includes(saved))activeView=saved;}catch(_){}
    if((!token||!/^[0-9a-f]{64}$/.test(token))&&(!shortCode||!/^[0-9a-f]{12}$/.test(shortCode))){$('studentName').textContent='لینک معتبر نیست یا ناقص است.';$('schedule').textContent='لطفاً لینک اختصاصی را از مربی دریافت کنید.';return;}
    const cacheKey='gym20-student-schedule-v1-'+(shortCode||('token-'+token.slice(0,16)));
    let cachedData=null,hasRenderedData=false,pushStarted=false,pickerReady=false;
    try{
      const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
      if(cached&&cached.student&&Array.isArray(cached.terms))cachedData=cached;
    }catch(_){}
    try{
      const client=createStudentClient();
      const getSchedule=async()=>{
        const result=shortCode
          ?await client.rpc('get_student_public_schedule_by_code',{p_code:shortCode})
          :await client.schema('gym20').rpc('get_student_public_schedule',{p_token:token});
        if(result.error)throw result.error;
        if(!result.data||!result.data.student)throw Error('لینک برنامه معتبر نیست یا غیرفعال شده است.');
        return result.data;
      };
      let exerciseRefreshInFlight=false;
      const refreshStudentExercises=async()=>{
        if(exerciseRefreshInFlight||document.visibilityState==='hidden')return;
        exerciseRefreshInFlight=true;
        try{await loadStudentExercises(shortCode,token,client);}
        finally{exerciseRefreshInFlight=false;}
      };
      // Keep the exercise card in sync with assignments made from the admin panel.
      refreshStudentExercises();
      window.setInterval(refreshStudentExercises,5000);
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')refreshStudentExercises();
      });
      const updateTermOptions=(selectedId)=>{
        const select=$('termSelect');
        select.innerHTML=terms.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
        select.value=terms.some(t=>String(t.id)===String(selectedId))?selectedId:terms[0].id;
        select._gym20RenderWheel?.();
      };
      const applyScheduleData=(data)=>{
        if(!data||!data.student)throw Error('اطلاعات برنامه معتبر نیست.');
        $('studentName').textContent='هنرجو: '+data.student.full_name;
        if(shortCode&&!pushStarted){pushStarted=true;setupPush(shortCode,client);}

        const selectedId=$('termSelect')?.value||terms[0]?.id;
        terms=Array.isArray(data.terms)?data.terms:[];
        if(!terms.length){
          $('termPanel').classList.add('hide');
          $('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';
          hasRenderedData=true;
          return;
        }
        $('termPanel').classList.remove('hide');
        updateTermOptions(selectedId);
        if(!pickerReady){
          enhanceTermPicker($('termSelect'));
          $('termSelect').addEventListener('change',e=>{showTerm(e.target.value);refreshStudentExercises();});
          pickerReady=true;
        }
        showTerm($('termSelect').value||terms[0].id);
        refreshStudentExercises();
        hasRenderedData=true;
      };
      let lastAppliedScheduleSnapshot='';
      const applyScheduleIfChanged=(data)=>{
        const snapshot=JSON.stringify(data);
        if(snapshot===lastAppliedScheduleSnapshot)return false;
        applyScheduleData(data);
        lastAppliedScheduleSnapshot=snapshot;
        return true;
      };
      // Show the last successfully loaded schedule immediately, then refresh it from the server.
      if(cachedData){
        try{applyScheduleIfChanged(cachedData);}catch(cacheError){console.warn('GYM20 cached schedule could not be rendered:',cacheError);}
      }
      const data=await getSchedule();
      try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch(_){}
      applyScheduleData(data);

      let refreshInFlight=false,lastRefreshAt=Date.now();
      const refreshPublishedSchedule=async(force=false)=>{
        if(refreshInFlight||document.visibilityState==='hidden')return;
        if(!force&&Date.now()-lastRefreshAt<4000)return;
        refreshInFlight=true;
        try{
          const fresh=await getSchedule();
          try{localStorage.setItem(cacheKey,JSON.stringify(fresh));}catch(_){}
          applyScheduleIfChanged(fresh);
          lastRefreshAt=Date.now();
        }catch(err){console.warn('GYM20 student schedule live refresh failed:',err);}
        finally{refreshInFlight=false;}
      };
      // Keep the published schedule and exercises close to real time without requiring a manual reload.
      window.setInterval(()=>refreshPublishedSchedule(false),5000);
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible'){
          refreshPublishedSchedule(true);
          refreshStudentExercises();
        }
      });
      window.addEventListener('focus',()=>{
        refreshPublishedSchedule(true);
        refreshStudentExercises();
      });
      window.addEventListener('pageshow',()=>{
        refreshPublishedSchedule(true);
        refreshStudentExercises();
      });
    }catch(e){
      console.error(e);
      if(!hasRenderedData){
        $('studentName').textContent='دریافت برنامه با خطا مواجه شد.';
        $('schedule').textContent='بارگذاری برنامه ناموفق بود. لطفاً صفحه را دوباره باز کنید؛ اگر مشکل ادامه داشت به مربی اطلاع دهید.';
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();