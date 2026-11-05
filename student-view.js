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
    const menu=document.createElement('div');menu.className='term-select-menu';menu.hidden=true;menu.setAttribute('role','listbox');
    wrap.append(trigger,menu);
    const sync=()=>{const opt=select.options[select.selectedIndex];trigger.querySelector('.term-select-label').textContent=opt?opt.textContent:'انتخاب ترم';menu.querySelectorAll('.term-option').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.value===select.value)));};
    menu.innerHTML=Array.from(select.options,o=>'<button type="button" class="term-option" role="option" data-value="'+esc(o.value)+'">'+esc(o.textContent)+'</button>').join('');
    trigger.addEventListener('click',()=>{const opening=menu.hidden;document.querySelectorAll('.term-select-menu').forEach(m=>{m.hidden=true;m.parentElement.querySelector('.term-select-trigger')?.setAttribute('aria-expanded','false');});menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));});
    menu.addEventListener('click',e=>{const b=e.target.closest('.term-option');if(!b)return;select.value=b.dataset.value;select.dispatchEvent(new Event('change',{bubbles:true}));menu.hidden=true;trigger.setAttribute('aria-expanded','false');sync();});
    select.addEventListener('change',sync);
    document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target)){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}});
    sync();
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
          status.textContent="اعلان برای این دستگاه فعال است ✓";
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
      if(shortCode)setupPush(shortCode,client);
      terms=Array.isArray(data.terms)?data.terms:[];
      if(!terms.length){$('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';return;}
      $('termPanel').classList.remove('hide');
      const updateTermOptions=(selectedId)=>{
        const select=$('termSelect');
        select.innerHTML=terms.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
        select.value=terms.some(t=>String(t.id)===String(selectedId))?selectedId:terms[0].id;
        const menu=select.closest('.term-select-wrap')?.querySelector('.term-select-menu');
        if(menu)menu.innerHTML=Array.from(select.options,o=>'<button type="button" class="term-option" role="option" data-value="'+esc(o.value)+'">'+esc(o.textContent)+'</button>').join('');
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
    }catch(e){console.error(e);$('studentName').textContent='دریافت برنامه با خطا مواجه شد.';$('schedule').textContent='اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();