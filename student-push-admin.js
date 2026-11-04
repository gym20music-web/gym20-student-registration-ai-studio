(() => {
  const KEY='student_push_config';
  let mounted=false, config={enabled:true,reminder_1_hours:6,reminder_2_hours:2}, statusBusy=false;
  const $=id=>document.getElementById(id);
  const client=()=>typeof gym20AdminClient!=='undefined'&&gym20AdminClient?gym20AdminClient.schema('gym20'):null;
  const note=(message,error=false)=>{const el=$('stPushAdminStatus');if(el){el.textContent=message||'';el.style.color=error?'#fb7185':'#34d399';}};
  function paintButton(){const b=$('stPushSave');if(!b)return;b.textContent=config.enabled?'غیرفعال کردن اعلان':'فعال کردن اعلان';b.classList.toggle('is-on',!!config.enabled);b.setAttribute('aria-pressed',String(!!config.enabled));}
  async function refreshStudentStatus(){
    if(statusBusy)return;statusBusy=true;
    const dot=$('stPushStudentDot'),label=$('stPushStudentStatus');
    try{
      const db=client(),studentId=$('stStudentSelected')?.dataset.studentId||'';
      if(!db||!studentId){if(dot)dot.className='st-push-dot unknown';if(label)label.textContent='ابتدا هنرجو را انتخاب کنید';return;}
      const {data,error}=await db.rpc('get_student_push_subscription_status',{p_student_id:studentId});
      if(error)throw error;
      const active=data===true;
      if(dot)dot.className='st-push-dot '+(active?'active':'inactive');
      if(label)label.textContent=active?'اعلان روی گوشی این هنرجو فعال است':'اعلان روی گوشی این هنرجو تأیید نشده است';
    }catch(e){if(dot)dot.className='st-push-dot unknown';if(label)label.textContent='وضعیت اعلان قابل دریافت نیست';}
    finally{statusBusy=false;}
  }
  async function loadConfig(){
    const db=client();if(!db||!(typeof gym20OwnerAuthorized!=='undefined'&&gym20OwnerAuthorized))return;
    try{
      const {data,error}=await db.from('site_settings').select('value').eq('key',KEY).maybeSingle();if(error)throw error;
      config={...config,...(data?.value||{})};
      paintButton();await refreshStudentStatus();
      note('');
    }catch(e){note(e.message||'دریافت تنظیمات اعلان ناموفق بود.',true);}
  }
  async function toggleConfig(){
    const db=client();if(!db||!(typeof gym20OwnerAuthorized!=='undefined'&&gym20OwnerAuthorized)){note('ابتدا با حساب مدیر وارد شوید.',true);return;}
    const first=Number($('stReminder1Hours').value),second=Number($('stReminder2Hours').value);
    if(!Number.isInteger(first)||first<0||first>168||!Number.isInteger(second)||second<0||second>168){note('زمان یادآوری باید عددی بین صفر تا ۱۶۸ ساعت باشد.',true);return;}
    if(first>0&&second>0&&first<=second){note('یادآوری اول باید زودتر از یادآوری دوم باشد؛ مثلاً ۶ و سپس ۲ ساعت.',true);return;}
    const b=$('stPushSave'),old=b.textContent;b.disabled=true;b.textContent='در حال ذخیره…';
    try{
      const next={...config,enabled:!config.enabled,reminder_1_hours:first,reminder_2_hours:second,subject:'mailto:admin@gym20.ir',updated_at:new Date().toISOString()};
      delete next.vapid_public_key;delete next.vapid_private_key;
      const {data:authData,error:authError}=await gym20AdminClient.auth.getUser();if(authError)throw authError;
      const {error}=await db.from('site_settings').upsert({key:KEY,value:next,updated_at:new Date().toISOString(),updated_by:authData.user?.id||null},{onConflict:'key'});if(error)throw error;
      config=next;paintButton();note(config.enabled?'اعلان یادآوری برای جلسات منتشرشده فعال شد.':'اعلان یادآوری غیرفعال شد.');
    }catch(e){note(e.message||'ذخیره تنظیمات ناموفق بود.',true);}
    finally{b.disabled=false;paintButton();}
  }
  function mount(){
    const tab=$('studentTermsTab'),card=$('stPushCard'),controls=$('stPushStatusControls');if(!tab||!card||!controls||mounted)return;mounted=true;
    controls.innerHTML='<button type="button" class="st-btn primary st-push-toggle" id="stPushSave">فعال کردن اعلان</button>'+
      '<span id="stPushStudentDot" class="st-push-dot unknown"></span><span id="stPushStudentStatus">ابتدا هنرجو را انتخاب کنید</span>'+
      '<span id="stPushAdminStatus" class="st-muted" role="status" aria-live="polite"></span>';
    const style=document.createElement('style');style.id='stPushCompactCss';style.textContent=
      '#stPushCard .st-push-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 0 10px;padding:8px 9px;border:1px solid rgba(214,179,90,.2);border-radius:10px;background:rgba(214,179,90,.035)}'+
      '#stPushCard #stPushStatusControls{display:flex;align-items:center;gap:7px;flex:1 1 230px;min-width:0;flex-wrap:wrap}'+
      '#stPushCard .st-push-toggle,#stPushCard #stPushTestAdmin{height:30px;min-height:30px;padding:0 9px!important;white-space:nowrap;font-size:9px!important;margin:0!important;border-radius:7px!important}'+
      '#stPushCard .st-push-toggle.is-on{border-color:#16a34a!important;color:#4ade80!important}'+
      '#stPushCard .st-push-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;display:inline-block;background:#777}'+
      '#stPushCard .st-push-dot.active{background:#22c55e;box-shadow:0 0 7px #22c55e99}'+
      '#stPushCard .st-push-dot.inactive{background:#ef4444;box-shadow:0 0 7px #ef444499}'+
      '#stPushCard #stPushStudentStatus{font-size:9px;line-height:1.6;color:var(--text-secondary);flex:1 1 120px}'+
      '#stPushCard #stPushAdminStatus{font-size:9px;margin:0;flex:0 1 auto}'+
      '#stPushCard #stPushTestAdmin{flex:0 0 auto}'+
      '@media(max-width:420px){#stPushCard .st-push-toolbar{gap:6px;padding:7px}#stPushCard #stPushStatusControls{flex-basis:100%;gap:6px}#stPushCard #stPushTestAdmin{margin-right:auto!important}}'
    document.head.appendChild(style);
    $('stPushSave').addEventListener('click',toggleConfig);
    const selected=$('stStudentSelected');if(selected)new MutationObserver(()=>refreshStudentStatus()).observe(selected,{childList:true,characterData:true,subtree:true,attributes:true});
    const watch=new MutationObserver(()=>{if(tab.classList.contains('active')&&typeof gym20OwnerAuthorized!=='undefined'&&gym20OwnerAuthorized)loadConfig();});
    watch.observe(tab,{attributes:true,attributeFilter:['class']});
    if(tab.classList.contains('active')&&typeof gym20OwnerAuthorized!=='undefined'&&gym20OwnerAuthorized)loadConfig();
  }
  const observer=new MutationObserver(()=>{if(!mounted)mount();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();observer.observe(document.body,{childList:true,subtree:true});});
  else{mount();observer.observe(document.body,{childList:true,subtree:true});}
})();