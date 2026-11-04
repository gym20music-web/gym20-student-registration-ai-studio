(() => {
  const SUPABASE_URL='https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY='sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const $=id=>document.getElementById(id);
  const faDate=v=>{if(!v)return '—';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '—';if(p[0]<1700)return p.map((x,i)=>String(x).padStart(i===0?4:2,'0')).join('/').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'numeric',day:'numeric'}).format(new Date(p[0],p[1]-1,p[2],12));};
  const faDateTime=v=>{if(!v)return '—';const d=new Date(v),fmt=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}),p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value])),weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(d);return weekday+' · '+p.year+'/'+p.month+'/'+p.day;};
  const faTime=v=>v?new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
  const num=v=>Number(v||0).toLocaleString('fa-IR');
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
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){
      button.disabled=true;
      status.textContent="این مرورگر از اعلان وب پشتیبانی نمی‌کند. در اندروید از Chrome به‌روز استفاده کن.";
      return;
    }
    const api=client.schema("gym20");
    let registration=null,publicKey="",configReady=false;
    const paint=active=>{
      button.dataset.active=active?"1":"0";
      button.hidden=!!active;
    };
    const saveSubscription=async subscription=>{
      const keys=subscription.toJSON().keys||{};
      const {error}=await api.rpc("subscribe_student_push",{
        p_code:shortCode,p_endpoint:subscription.endpoint,p_p256dh:keys.p256dh,p_auth:keys.auth,p_user_agent:navigator.userAgent
      });
      if(error)throw error;
    };
    const ensureReady=async()=>{
      if(!registration){
        registration=await navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"});
      }
      registration=await navigator.serviceWorker.ready;
      return registration;
    };
    button.addEventListener("click",async()=>{
      if(button.disabled||!configReady)return;
      button.disabled=true;
      try{
        if(Notification.permission==="denied"){
          throw new Error("اعلان در تنظیمات گوشی مسدود شده است. از تنظیمات Android > Apps > Chrome > Notifications و سپس تنظیمات Site settings در Chrome، اجازه اعلان gym20.ir را روشن کن.");
        }
        let permission=Notification.permission;
        if(permission!=="granted")permission=await Notification.requestPermission();
        if(permission!=="granted")throw new Error("اجازه اعلان داده نشد. مجوز Notifications برای gym20.ir را در تنظیمات Chrome فعال کن.");
        await ensureReady();
        if(!publicKey)throw new Error("کلید اعلان از سرور دریافت نشد؛ صفحه را تازه‌سازی کن و دوباره تلاش کن.");
        let subscription=await registration.pushManager.getSubscription();
        if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(publicKey)});
        await saveSubscription(subscription);
        paint(true);
        status.textContent="اعلان کلاس‌ها برای این گوشی فعال شد ✓";
      }catch(error){
        status.textContent=error.message||"فعال‌سازی اعلان ناموفق بود.";
      }finally{button.disabled=false;}
    });
    try{
      const {data,error}=await api.rpc("get_student_push_public_config");
      if(error)throw error;
      const config=Array.isArray(data)?data[0]:data;
      if(!config?.enabled||!config?.public_key){box.classList.add("hide");return;}
      publicKey=config.public_key;
      await ensureReady();
      const existing=await registration.pushManager.getSubscription();
      if(Notification.permission==="granted"&&existing){
        await saveSubscription(existing);
        paint(true);
        status.textContent="اعلان فعال است ✓";
      }else{
        paint(false);
        status.textContent=Notification.permission==="denied"
          ?"اجازه اعلان در گوشی مسدود است؛ از تنظیمات Android و Chrome آن را فعال کن."
          :"برای دریافت یادآوری کلاس، دکمه فعال‌سازی را بزن.";
      }
      configReady=true;
      button.disabled=false;
      button.textContent="فعال‌سازی اعلان کلاس‌ها";
    }catch(error){
      button.disabled=true;
      status.textContent=(error.message||"آماده‌سازی اعلان ناموفق بود.")+" صفحه را تازه‌سازی کن؛ اگر ادامه داشت، مرورگر را به‌روز کن.";
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
    const now=new Date();
    const hasLiveSession=sessions.some(s=>new Date(s.starts_at)<=now&&now<new Date(s.ends_at));const upcoming=hasLiveSession?null:(sessions.filter(s=>new Date(s.starts_at)>now&&new Date(s.ends_at)>now).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at))[0]||null);
    $('schedule').innerHTML='<div class="session-list view-list">'+sessions.slice().sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).map(s=>{const start=new Date(s.starts_at),end=new Date(s.ends_at),mins=Math.max(1,Math.round((end-start)/60000));const a=att[s.attendance||'pending']||att.pending;let timeClass='time-future',timeLabel='جلسه برگزار نشده';if(end<=now){timeClass='time-past';timeLabel='جلسه برگزار شده';}else if(start<=now&&now<end){timeClass='time-live';timeLabel='در حال برگزاری';}else if(upcoming&&s===upcoming){timeClass='time-next';timeLabel='جلسه آینده';}const statusText=timeClass==='time-live'?'در حال برگزاری':((s.attendance||'pending')==='pending'?timeLabel:a[0]);const date=new Date(s.starts_at),weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long'}).format(date),dateText=faDate(s.starts_at);
      return '<article class="session-card session-compact-row '+timeClass+'"><div class="session-inline"><span class="session-fact session-number-fact"><i>جلسه</i><b class="session-number">'+num(s.session_number)+'</b></span><span class="session-fact"><i>روز</i><b>'+weekday+'</b></span><span class="session-fact"><i>تاریخ</i><b>'+dateText+'</b></span><span class="session-fact"><i>ساعت کلاس</i><b class="session-time">'+faTime(s.starts_at)+'</b></span><span class="session-fact"><i>مربی</i><b>'+esc(s.coach_name||'تعیین نشده')+'</b></span><span class="session-fact session-status-fact"><i>وضعیت</i><b class="status '+a[1]+' '+timeClass+'">'+statusText+'</b></span></div></article>';}).join('')+'</div>';

  }
  async function init(){
    const token=new URLSearchParams(location.search).get('t');
    const shortCode=(location.pathname.match(/\/s\/([0-9a-f]{12})\/?$/i)||[])[1]||new URLSearchParams(location.search).get('c');
    viewStorageKey='gym20-session-view-'+(shortCode||'token');
    try{const saved=localStorage.getItem(viewStorageKey);if(['grid','list'].includes(saved))activeView=saved;}catch(_){}
    if((!token||!/^[0-9a-f]{64}$/.test(token))&&(!shortCode||!/^[0-9a-f]{12}$/.test(shortCode))){$('studentName').textContent='لینک معتبر نیست یا ناقص است.';$('schedule').textContent='لطفاً لینک اختصاصی را از مربی دریافت کنید.';return;}
    try{
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{db:{schema:'gym20'},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=shortCode
        ?await client.schema('gym20').rpc('get_student_public_schedule_by_code',{p_code:shortCode})
        :await client.schema('gym20').rpc('get_student_public_schedule',{p_token:token});
      if(error)throw error;if(!data||!data.student){$('studentName').textContent='این لینک معتبر نیست یا غیرفعال شده است.';$('schedule').textContent='برای دریافت لینک جدید با مربی تماس بگیرید.';return;}
      $('studentName').textContent='هنرجو: '+data.student.full_name;
      if(shortCode)setupPush(shortCode,client);
      terms=data.terms||[];
      if(!terms.length){$('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';return;}
      $('termPanel').classList.remove('hide');
      $('termSelect').innerHTML=terms.map((t,i)=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
      enhanceTermPicker($('termSelect'));
      $('termSelect').addEventListener('change',e=>showTerm(e.target.value));
      showTerm(terms[0].id);
      window.setInterval(()=>{const selected=$('termSelect')?.value||terms[0]?.id;if(selected)showTerm(selected);},15000);
    }catch(e){console.error(e);$('studentName').textContent='دریافت برنامه با خطا مواجه شد.';$('schedule').textContent='اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();