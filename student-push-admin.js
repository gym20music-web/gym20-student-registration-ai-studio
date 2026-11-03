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
      $('stPushReminder1').value=String(config.reminder_1_hours??6);
      $('stPushReminder2').value=String(config.reminder_2_hours??2);
      paintButton();await refreshStudentStatus();
      note('تنظیمات اعلان دریافت شد.');
    }catch(e){note(e.message||'دریافت تنظیمات اعلان ناموفق بود.',true);}
  }
  async function toggleConfig(){
    const db=client();if(!db||!(typeof gym20OwnerAuthorized!=='undefined'&&gym20OwnerAuthorized)){note('ابتدا با حساب مدیر وارد شوید.',true);return;}
    const first=Number($('stPushReminder1').value),second=Number($('stPushReminder2').value);
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
    const tab=$('studentTermsTab');if(!tab||mounted)return;mounted=true;
    const card=document.createElement('section');card.className='st-card st-push-compact';card.id='stPushAdminCard';
    card.innerHTML='<div class="st-title">🔔 یادآوری کلاس روی گوشی هنرجو</div>'+
      '<div class="st-push-row">'+
      '<label class="st-push-field"><span>یادآوری اول</span><input id="stPushReminder1" type="number" min="0" max="168" step="1" value="6" aria-label="یادآوری اول بر حسب ساعت"></label>'+
      '<label class="st-push-field"><span>یادآوری دوم</span><input id="stPushReminder2" type="number" min="0" max="168" step="1" value="2" aria-label="یادآوری دوم بر حسب ساعت"></label>'+
      '<button type="button" class="st-btn primary st-push-toggle" id="stPushSave">فعال کردن اعلان</button></div>'+
      '<div class="st-push-status"><span id="stPushStudentDot" class="st-push-dot unknown"></span><span id="stPushStudentStatus">ابتدا هنرجو را انتخاب کنید</span></div>'+
      '<div id="stPushAdminStatus" class="st-muted" role="status" aria-live="polite"></div>';
    const style=document.createElement('style');style.id='stPushCompactCss';style.textContent=
      '#studentTermsTab .st-push-compact{padding:11px 13px!important;margin-bottom:10px!important}'+
      '#studentTermsTab .st-push-compact .st-title{margin-bottom:8px!important;font-size:13px!important}'+
      '#studentTermsTab .st-push-row{display:grid;grid-template-columns:minmax(70px,1fr) minmax(70px,1fr) auto;gap:7px;align-items:end}'+
      '#studentTermsTab .st-push-field{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:11px;color:var(--text-secondary,#aaa)}'+
      '#studentTermsTab .st-push-field input{width:100%;height:34px;min-height:34px;box-sizing:border-box;padding:4px 7px;font-size:12px;text-align:center}'+
      '#studentTermsTab .st-push-toggle{height:34px;min-height:34px;padding:0 12px!important;white-space:nowrap;font-size:11px!important;margin:0!important}'+
      '#studentTermsTab .st-push-toggle.is-on{border-color:#16a34a!important;color:#4ade80!important}'+
      '#studentTermsTab .st-push-status{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:11px;color:var(--text-secondary,#aaa)}'+
      '#studentTermsTab .st-push-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;display:inline-block;background:#777}'+
      '#studentTermsTab .st-push-dot.active{background:#22c55e;box-shadow:0 0 7px #22c55e99}'+
      '#studentTermsTab .st-push-dot.inactive{background:#ef4444;box-shadow:0 0 7px #ef444499}'+
      '#studentTermsTab #stPushAdminStatus{font-size:10px;margin-top:4px}'+
      '@media(max-width:520px){#studentTermsTab .st-push-row{grid-template-columns:minmax(58px,1fr) minmax(58px,1fr) auto;gap:5px}#studentTermsTab .st-push-toggle{padding:0 8px!important;font-size:10px!important}}';
    document.head.appendChild(style);
    const anchor=tab.querySelector('#stMain');if(anchor)tab.insertBefore(card,anchor);else tab.appendChild(card);
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