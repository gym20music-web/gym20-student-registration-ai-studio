(() => {
  const SUPABASE_URL='https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY='sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const $=id=>document.getElementById(id);
  const faDate=v=>{if(!v)return '—';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '—';if(p[0]<1700)return p.map((x,i)=>String(x).padStart(i===0?4:2,'0')).join('/').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'numeric',day:'numeric'}).format(new Date(p[0],p[1]-1,p[2],12));};
  const faDateTime=v=>v?new Date(v).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'}):'—';
  const faTime=v=>v?new Date(v).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}):'—';
  const num=v=>Number(v||0).toLocaleString('fa-IR');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const att={
    pending:['در انتظار ثبت','pending'],present:['حاضر','present'],absent:['غایب','absent'],
    excused:['غیبت موجه','pending'],makeup:['جلسه جبرانی','present'],cancelled:['لغوشده','absent']
  };


  const decodePushKey=value=>{const pad="=".repeat((4-value.length%4)%4),raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(raw,c=>c.charCodeAt(0));};
  async function setupPush(shortCode,client){
    const box=$("pushControls"),button=$("pushToggle"),status=$("pushStatus");
    if(!box||!button||!status||!shortCode)return;
    box.classList.remove("hide");
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){
      button.disabled=true;status.textContent="این مرورگر از اعلان مستقیم پشتیبانی نمی‌کند.";return;
    }
    const api=client.schema("gym20");
    let registration=null,publicKey="";
    const paint=active=>{button.dataset.active=active?"1":"0";button.textContent=active?"غیرفعال‌سازی اعلان‌ها":"فعال‌سازی اعلان کلاس‌ها";status.textContent=active?"اعلان یادآوری کلاس‌ها روی این گوشی فعال است.":"برای دریافت یادآوری کلاس‌ها، اعلان گوشی را فعال کن.";};
    const saveSubscription=async subscription=>{
      const keys=subscription.toJSON().keys||{};
      const {error}=await api.rpc("subscribe_student_push",{
        p_code:shortCode,p_endpoint:subscription.endpoint,p_p256dh:keys.p256dh,p_auth:keys.auth,p_user_agent:navigator.userAgent
      });
      if(error)throw error;
    };
    try{
      const {data,error}=await api.rpc("get_student_push_public_config");
      if(error)throw error;
      const config=Array.isArray(data)?data[0]:data;
      if(!config?.enabled||!config?.public_key){box.classList.add("hide");return;}
      publicKey=config.public_key;
      registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
      const existing=await registration.pushManager.getSubscription();
      if(Notification.permission==="granted"&&existing){await saveSubscription(existing);paint(true);}
      else paint(false);
    }catch(error){status.textContent=error.message||"آماده‌سازی اعلان‌ها ناموفق بود.";}
    button.addEventListener("click",async()=>{
      if(button.disabled)return;
      button.disabled=true;
      try{
        registration=registration||await navigator.serviceWorker.register("/sw.js",{scope:"/"});
        let subscription=await registration.pushManager.getSubscription();
        if(button.dataset.active==="1"&&subscription){
          const {error}=await api.rpc("unsubscribe_student_push",{p_code:shortCode,p_endpoint:subscription.endpoint});
          if(error)throw error;
          await subscription.unsubscribe();
          paint(false);
        }else{
          let permission=Notification.permission;
          if(permission==="default")permission=await Notification.requestPermission();
          if(permission!=="granted")throw new Error("اجازه اعلان در تنظیمات گوشی داده نشده است.");
          subscription=subscription||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(publicKey)});
          await saveSubscription(subscription);
          paint(true);
        }
      }catch(error){status.textContent=error.message||"فعال‌سازی اعلان ناموفق بود.";}
      finally{button.disabled=false;}
    });
  }
  let terms=[];
  let activeView="grid";
  let viewStorageKey="gym20-session-view";
  function showTerm(id){
    const t=terms.find(x=>x.id===id)||terms[0];if(!t)return;
    $('termMeta').textContent='تعداد جلسات: '+num(t.total_sessions)+' · شروع: '+faDate(t.start_date)+' · پایان: '+faDate(t.end_date)+(t.styles?.length?' · سبک‌ها: '+t.styles.map(esc).join('، '):'');
    const sessions=t.sessions||[];
    if(!sessions.length){$('schedule').innerHTML='<div class="empty">برای این ترم هنوز جلسه منتشرشده‌ای ثبت نشده است.</div>';return;}
    const done=sessions.filter(s=>['present','absent','excused','makeup','cancelled'].includes(s.attendance)).length;
    const now=new Date();
    const upcoming=sessions.filter(s=>new Date(s.starts_at)>now&&new Date(s.ends_at)>now).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at))[0]||null;
    $('schedule').innerHTML='<div class="schedule-summary"><span>جلسات برنامه‌ریزی‌شده <b>'+num(sessions.length)+'</b></span><span>وضعیت ثبت‌شده <b>'+num(done)+'</b></span></div><div class="view-heading"><strong>جلسات این ترم</strong><small>نحوه نمایش را انتخاب کنید</small></div><div class="view-switch" role="group" aria-label="نحوه نمایش جلسات"><button type="button" class="view-btn" data-view="grid" aria-pressed="false"><span class="view-icon">▦</span> کارت‌بندی</button><button type="button" class="view-btn" data-view="list" aria-pressed="false"><span class="view-icon">☰</span> نمایش سطری</button></div><div class="session-list">'+sessions.slice().sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).map(s=>{const start=new Date(s.starts_at),end=new Date(s.ends_at),mins=Math.max(1,Math.round((end-start)/60000));const a=att[s.attendance||'pending']||att.pending;let timeClass='time-future',timeLabel='جلسه برگزار نشده';if(end<=now){timeClass='time-past';timeLabel='جلسه برگزار شده';}else if(start<=now&&now<end){timeClass='time-live';timeLabel='در حال برگزاری';}else if(upcoming&&s===upcoming){timeClass='time-next';timeLabel='جلسه آینده';}const statusText=(s.attendance||'pending')==='pending'?timeLabel:a[0];return '<article class="session-card '+timeClass+'"><div class="session-top"><b class="session-number">جلسه '+num(s.session_number)+'</b><span class="status '+a[1]+' '+timeClass+'">'+statusText+'</span></div><div class="session-facts"><span><i>تاریخ</i><b>'+faDateTime(s.starts_at)+'</b></span><span><i>ساعت</i><b>'+faTime(s.starts_at)+'–'+faTime(s.ends_at)+'</b></span><span><i>مدت</i><b>'+num(mins)+' دقیقه</b></span></div><div class="session-bottom"><span class="coach">🏅 '+esc(s.coach_name||'مربی تعیین نشده')+'</span></div></article>';}).join('')+'</div>';
    const sessionList=$('schedule').querySelector('.session-list');if(sessionList)sessionList.classList.add('view-'+activeView);
    $('schedule').querySelectorAll('.view-btn').forEach(btn=>{btn.setAttribute('aria-pressed',String(btn.dataset.view===activeView));btn.addEventListener('click',()=>{const v=btn.dataset.view;if(!['grid','list'].includes(v))return;activeView=v;try{localStorage.setItem(viewStorageKey,v);}catch(_){}showTerm($('termSelect').value||terms[0]?.id);});});
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
      $('studentName').textContent='هنرجو: '+data.student.full_name+' · برنامه ترم‌های منتشرشده';
      if(shortCode)setupPush(shortCode,client);
      terms=data.terms||[];
      if(!terms.length){$('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';return;}
      $('termPanel').classList.remove('hide');
      $('termSelect').innerHTML=terms.map((t,i)=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
      $('termSelect').addEventListener('change',e=>showTerm(e.target.value));
      showTerm(terms[0].id);
    }catch(e){console.error(e);$('studentName').textContent='دریافت برنامه با خطا مواجه شد.';$('schedule').textContent='اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();