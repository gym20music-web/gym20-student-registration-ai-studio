(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PROJECT_DEFAULT = 'https://iqjujumhoawlugrmjvyj.supabase.co';
  const VIEW_META = {
    overview:['نمای کلی','وضعیت کلی آکادمی و دسترسی سریع'],
    students:['هنرجویان و ترم‌ها','مدیریت هنرجویان، ترم‌ها و برنامه جلسات'],
    requests:['درخواست‌های ثبت‌نام','بررسی و تعیین وضعیت درخواست‌های جدید'],
    classes:['سبک‌ها و کلاس‌ها','مدیریت سبک‌ها و ضرایب قیمت‌گذاری'],
    regions:['مناطق و شهریه','قیمت پایه و هزینه سبک‌های اضافه'],
    rules:['قوانین و شرایط','متن شرایط کلاس و قوانین عمومی'],
    site:['محتوای سایت','عنوان‌ها و متن‌های صفحه اصلی'],
    payments:['پرداخت و ارتباطات','اطلاعات پرداخت و راه‌های تماس'],
    notifications:['اعلان‌ها','یادآوری جلسات و پیام‌رسانی']
  };
  let client = null, config = {}, requests = [];
  const status = (message, error=false) => {
    $('globalStatus').textContent = message || '';
    $('globalStatus').style.color = error ? '#e47777' : '#55c58a';
  };
  const loginStatus = (message, error=false) => {
    $('loginStatus').textContent = message || '';
    $('loginStatus').style.color = error ? '#e47777' : '#55c58a';
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = value => Number(String(value ?? '').replace(/[^0-9.-]/g,'')) || 0;
  const fmt = value => n(value).toLocaleString('en-US');

  async function connect(url,key) {
    if (!window.supabase?.createClient) throw new Error('کتابخانه Supabase بارگذاری نشده است؛ اتصال اینترنت را بررسی کنید.');
    if (/service_role|sb_secret_/i.test(key)) throw new Error('کلید Secret یا service_role برای مرورگر مجاز نیست؛ فقط Publishable key.');
    client = window.supabase.createClient(url.replace(/\/$/,''), key, {
      db:{schema:'gym20'},
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return client;
  }
  async function authorizeOwner() {
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!user)throw new Error('نشست مدیر معتبر نیست.');
    const {data:profile,error}=await client.schema('gym20').from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
    if(error)throw error;
    if(!profile || profile.role!=='owner' || profile.is_active!==true) {
      await client.auth.signOut();
      throw new Error('این حساب، مدیر فعال GYM20 نیست.');
    }
    return user;
  }
  async function loadConfig() {
    const {data,error}=await client.schema('gym20').from('site_settings').select('value').eq('key','public_site_config').maybeSingle();
    if(error)throw error;
    if(!data?.value)throw new Error('تنظیمات public_site_config در دیتابیس پیدا نشد.');
    config=data.value;
    renderConfig();
    updateStats();
  }
  function renderConfig() {
    $('brandTag').value=config.brandTag||'';
    $('bannerTitle').value=config.bannerTitle||'';
    $('bannerSubtitle').value=config.bannerSubtitle||'';
    const m=config.multipliers||{};
    $('factorNormal').value=m.normal??1;$('factorSemi').value=m.semi??1.4;$('factorPrivate').value=m.private??2;$('factorVip').value=m.vip??3;$('factorOnline').value=m.online??.8;
    const sr=config.sessionRates||{};
    $('rate8').value=sr['8']??1;$('rate10').value=sr['10']??1.25;$('rate12').value=sr['12']??1.5;
    renderStyles();renderRegions();renderRules();
    const card=config.card||{},contact=config.contact||{};
    $('bankName').value=card.bank||'';$('cardNumber').value=card.number||'';$('cardOwner').value=card.owner||'';$('gatewayLink').value=card.gatewayLink||'';
    $('contactPhone').value=contact.phone||'';$('contactInstagram').value=contact.instagram||'';$('contactTelegram').value=contact.telegram||'';
  }
  function updateStats() {
    $('statRegions').textContent=(config.regions||[]).length.toLocaleString('fa-IR');
    $('statStyles').textContent=(config.styles||[]).length.toLocaleString('fa-IR');
    $('systemNote').textContent='نشست مدیر تأیید شده است. اطلاعات تنظیمات از جدول gym20.site_settings دریافت شد.';
  }
  function renderStyles() {
    $('stylesEditor').innerHTML=(config.styles||[]).map((s,i)=>'<div class="edit-row"><div class="name-field"><span class="row-label">نام سبک</span><input data-style-name="'+i+'" value="'+escapeHtml(s.name)+'"></div><div><span class="row-label">شناسه</span><input value="'+escapeHtml(s.id)+'" disabled></div><div><span class="row-label">وضعیت</span><input value="فعال" disabled></div><button class="icon-btn" data-delete-style="'+i+'" aria-label="حذف سبک">×</button></div>').join('') || '<p class="muted">سبکی تعریف نشده است.</p>';
  }
  function renderRegions() {
    $('regionsEditor').innerHTML=(config.regions||[]).map((r,i)=>'<div class="edit-row"><div class="name-field"><span class="row-label">نام منطقه</span><input data-region-name="'+i+'" value="'+escapeHtml(r.name)+'"></div><div><span class="row-label">شهریه کودکان</span><input data-region-kids="'+i+'" inputmode="numeric" value="'+fmt(r.kidsBase)+'"></div><div><span class="row-label">شهریه بزرگسالان</span><input data-region-adult="'+i+'" inputmode="numeric" value="'+fmt(r.adultBase)+'"></div><button class="icon-btn" data-delete-region="'+i+'" aria-label="حذف منطقه">×</button><div class="field"><label>هزینه سبک اضافه</label><input data-region-extra="'+i+'" inputmode="numeric" value="'+fmt(r.extraStylePrice)+'"></div></div>').join('') || '<p class="muted">منطقه‌ای تعریف نشده است.</p>';
  }
  const RULE_NAMES={normal:'کلاس عمومی',semi:'کلاس نیمه‌خصوصی',private:'کلاس خصوصی',vip:'کلاس VIP',online:'کلاس آنلاین',s8:'ترم ۸ جلسه‌ای',s10:'ترم ۱۰ جلسه‌ای',s12:'ترم ۱۲ جلسه‌ای',general:'قوانین عمومی'};
  function renderRules() {
    $('rulesEditor').innerHTML=Object.entries(RULE_NAMES).map(([key,label])=>'<div><label for="rule-'+key+'">'+label+'</label><textarea id="rule-'+key+'">'+escapeHtml(config.rules?.[key]||'')+'</textarea></div>').join('');
  }
  function readStyles() {
    (config.styles||[]).forEach((s,i)=>{const el=document.querySelector('[data-style-name="'+i+'"]');if(el)s.name=el.value.trim();});
  }
  function readRegions() {
    (config.regions||[]).forEach((r,i)=>{
      const get=key=>document.querySelector('[data-region-'+key+'="'+i+'"]');
      if(get('name'))r.name=get('name').value.trim();
      if(get('kids'))r.kidsBase=n(get('kids').value);
      if(get('adult'))r.adultBase=n(get('adult').value);
      if(get('extra'))r.extraStylePrice=n(get('extra').value);
    });
  }
  async function saveConfig(message) {
    if(!client)throw new Error('اتصال مدیر برقرار نیست.');
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError)throw authError;
    const {error}=await client.schema('gym20').from('site_settings').upsert({
      key:'public_site_config',value:config,updated_at:new Date().toISOString(),updated_by:user?.id||null
    },{onConflict:'key'});
    if(error)throw error;
    status(message||'تغییرات ذخیره شد.');
    updateStats();
  }
  async function runSave(button,fn) {
    const old=button.textContent;button.disabled=true;button.textContent='در حال ذخیره…';
    try{await fn();}catch(e){status(e.message||'ذخیره انجام نشد.',true);}
    finally{button.disabled=false;button.textContent=old;}
  }
  async function loadRequests() {
    $('requestsList').innerHTML='<p class="muted">در حال دریافت درخواست‌ها…</p>';
    const {data,error}=await client.from('public_registration_requests').select('id,full_name,phone,status,created_at,selected_styles,age_group,total_sessions').order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    requests=data||[];
    renderRequests();
  }
  function renderRequests() {
    const term=($('requestSearch').value||'').trim().toLowerCase(),filter=$('requestFilter').value;
    const list=requests.filter(r=>(filter==='all'||r.status===filter)&&(!term||String(r.full_name+' '+r.phone).toLowerCase().includes(term)));
    const pending=requests.filter(r=>r.status==='pending').length;
    $('pendingBadge').textContent=String(pending);
    $('statPending').textContent=pending.toLocaleString('fa-IR');
    $('requestsList').innerHTML=list.length?list.map(r=>'<article class="request-card"><div><strong>'+escapeHtml(r.full_name)+'</strong><small>'+escapeHtml(r.phone)+' · '+escapeHtml((r.selected_styles||[]).join('، '))+' · '+escapeHtml(r.status)+'</small></div><div class="request-actions">'+(r.status==='pending'?'<button class="primary" data-request-action="approved" data-id="'+escapeHtml(r.id)+'">تأیید</button><button class="ghost" data-request-action="rejected" data-id="'+escapeHtml(r.id)+'">رد</button>':'<span class="tag">'+escapeHtml(r.status)+'</span>')+'</div></article>').join(''):'<p class="muted">درخواستی برای نمایش وجود ندارد.</p>';
  }
  async function updateRequest(id,next) {
    const {error}=await client.rpc('update_registration_request_status',{p_request_id:id,p_status:next});
    if(error)throw error;
    await loadRequests();
    status('وضعیت درخواست بروزرسانی شد.');
  }
  function showView(view) {
    document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    $('pageTitle').textContent=VIEW_META[view][0];$('pageSubtitle').textContent=VIEW_META[view][1];
    if(view==='requests')loadRequests().catch(e=>status(e.message,true));
  }
  async function refresh() {
    try{await loadConfig();if(document.getElementById('view-requests').classList.contains('active'))await loadRequests();status('اطلاعات بروزرسانی شد.');}
    catch(e){status(e.message||'بروزرسانی ناموفق بود.',true);}
  }

  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=$('loginSubmit');btn.disabled=true;btn.textContent='در حال ورود…';loginStatus('');
    try{
      await connect($('projectUrl').value.trim(),$('publishableKey').value.trim());
      const {error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
      if(error)throw error;
      await authorizeOwner();
      $('loginPassword').value='';
      $('loginScreen').hidden=true;$('app').hidden=false;
      await loadConfig();
      status('ورود مدیر تأیید شد.');
    }catch(err){
      if(client)await client.auth.signOut().catch(()=>{});
      loginStatus(err.message||'ورود یا بررسی دسترسی مدیر ناموفق بود.',true);
    }finally{btn.disabled=false;btn.textContent='ورود امن';}
  });
  $('logoutBtn').addEventListener('click',async()=>{if(client)await client.auth.signOut();location.reload();});
  $('mainNav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)showView(b.dataset.view);});
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  $('refreshBtn').addEventListener('click',refresh);
  $('reloadRequests').addEventListener('click',()=>loadRequests().catch(e=>status(e.message,true)));
  $('requestSearch').addEventListener('input',renderRequests);$('requestFilter').addEventListener('change',renderRequests);
  $('requestsList').addEventListener('click',e=>{const b=e.target.closest('[data-request-action]');if(b)runSave(b,()=>updateRequest(b.dataset.id,b.dataset.requestAction));});
  $('stylesEditor').addEventListener('click',e=>{const b=e.target.closest('[data-delete-style]');if(!b)return;config.styles.splice(Number(b.dataset.deleteStyle),1);renderStyles();});
  $('addStyle').addEventListener('click',()=>{const name=prompt('نام سبک جدید را وارد کنید:');if(name?.trim()){config.styles=config.styles||[];config.styles.push({id:'style_'+Date.now(),name:name.trim()});renderStyles();}});
  $('saveClasses').addEventListener('click',e=>runSave(e.currentTarget,async()=>{
    readStyles();config.multipliers={...(config.multipliers||{}),normal:n($('factorNormal').value),semi:n($('factorSemi').value),private:n($('factorPrivate').value),vip:n($('factorVip').value),online:n($('factorOnline').value)};
    config.sessionRates={'8':n($('rate8').value),'10':n($('rate10').value),'12':n($('rate12').value)};
    await saveConfig('سبک‌ها و ضرایب کلاس ذخیره شد.');
  }));
  $('regionsEditor').addEventListener('click',e=>{const b=e.target.closest('[data-delete-region]');if(!b)return;if((config.regions||[]).length<=1){status('حداقل یک منطقه باید باقی بماند.',true);return;}config.regions.splice(Number(b.dataset.deleteRegion),1);renderRegions();});
  $('addRegion').addEventListener('click',()=>{config.regions=config.regions||[];config.regions.push({id:'reg_'+Date.now(),name:'منطقه جدید',kidsBase:1500000,adultBase:2000000,extraStylePrice:500000});renderRegions();});
  $('saveRegions').addEventListener('click',e=>runSave(e.currentTarget,async()=>{readRegions();await saveConfig('مناطق و قیمت‌ها ذخیره شد.');}));
  $('saveRules').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.rules=config.rules||{};Object.keys(RULE_NAMES).forEach(k=>config.rules[k]=$('rule-'+k).value);await saveConfig('قوانین ذخیره شد.');}));
  $('saveSite').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.brandTag=$('brandTag').value;config.bannerTitle=$('bannerTitle').value;config.bannerSubtitle=$('bannerSubtitle').value;await saveConfig('محتوای سایت ذخیره شد.');}));
  $('savePayments').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.card={...(config.card||{}),bank:$('bankName').value,number:$('cardNumber').value,cleanNumber:$('cardNumber').value.replace(/\D/g,''),owner:$('cardOwner').value,gatewayLink:$('gatewayLink').value};config.contact={...(config.contact||{}),phone:$('contactPhone').value,instagram:$('contactInstagram').value,telegram:$('contactTelegram').value};await saveConfig('اطلاعات پرداخت و ارتباطات ذخیره شد.');}));
})();