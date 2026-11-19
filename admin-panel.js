(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PROJECT_DEFAULT = 'https://ubrafxjpnqtjnjdaskba.supabase.co';
  const VIEW_META = {
    overview:['نمای کلی','وضعیت کلی آکادمی و دسترسی سریع'],
    attendance:['حضور و غیاب','ثبت و پیگیری وضعیت جلسات منتشرشده'], coaches:['مربیان','مدیریت برنامه و آمار مربیان'], reports:['گزارش‌ها','گزارش‌های عملیاتی آکادمی'], integrations:['اتصالات','وضعیت سرویس‌های پیام‌رسانی و اعلان'],
    students:['هنرجویان و ترم‌ها','مدیریت هنرجویان، ترم‌ها و برنامه جلسات'],
    exercises:['تمرین هنرجویان','تعریف و پیگیری تمرین‌های اختصاصی هر هنرجو'],
    requests:['درخواست‌های ثبت‌نام','بررسی و تعیین وضعیت درخواست‌های جدید'],
    classes:['سبک‌ها و کلاس‌ها','مدیریت سبک‌ها و ضرایب قیمت‌گذاری'],
    regions:['مناطق و شهریه','قیمت پایه و هزینه سبک‌های اضافه'],
    rules:['قوانین و شرایط','متن شرایط کلاس و قوانین عمومی'],
    site:['محتوای سایت','عنوان‌ها و متن‌های صفحه اصلی'],
    payments:['پرداخت و ارتباطات','اطلاعات پرداخت و راه‌های تماس'],
    notifications:['اعلان‌ها','یادآوری جلسات و پیام‌رسانی']
  };
  let client = null, config = {}, requests = [], students = [], attendanceRows = [];
  window.gym20AdminClient = null;
  window.gym20OwnerAuthorized = false;
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
    window.gym20AdminClient = client;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'&&!session){
        window.gym20OwnerAuthorized=false;
        $('app').hidden=true;
        $('loginScreen').hidden=false;
        loginStatus('نشست مدیر پایان یافته است؛ دوباره وارد شوید.',true);
      }
      if(event==='PASSWORD_RECOVERY'){
        $('passwordRecoveryPanel').hidden=false;
        loginStatus('لینک بازیابی تأیید شد؛ رمز عبور جدید را وارد کنید.');
      }
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
    window.gym20OwnerAuthorized = true;
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
    if($('telegramChannelId'))$('telegramChannelId').value=config.telegramChannelId||'@GYM20MUSIC';
    const m=config.multipliers||{};
    $('factorNormal').value=m.normal??1;$('factorSemi').value=m.semi??1.4;$('factorPrivate').value=m.private??2;$('factorVip').value=m.vip??3;$('factorOnline').value=m.online??.8;
    const sr=config.sessionRates||{};
    $('rate8').value=sr['8']??1;$('rate10').value=sr['10']??1.25;$('rate12').value=sr['12']??1.5;
    renderStyles();renderRegions();renderRules();renderClassTypes();renderPageTexts();
    const card=config.card||{},contact=config.contact||{};
    $('bankName').value=card.bank||'';$('cardNumber').value=card.number||'';$('cardOwner').value=card.owner||'';$('gatewayLink').value=card.gatewayLink||'';
    $('contactPhone').value=contact.phone||'';$('contactInstagram').value=contact.instagram||'';$('contactTelegram').value=contact.telegram||'';
  }

  const PAGE_TEXT_LABELS={stylesSectionTitle:'عنوان بخش سبک‌ها',classTypeLabel:'عنوان نوع کلاس',sessionCountLabel:'عنوان تعداد جلسات',stylesChoiceLabel:'راهنمای انتخاب سبک‌ها',tuitionLabel:'عنوان شهریه',registrationTitle:'عنوان فرم ثبت‌نام',registrationIntro:'توضیح فرم ثبت‌نام',fullNameLabel:'برچسب نام و نام خانوادگی',phoneLabel:'برچسب شماره موبایل',birthDateLabel:'برچسب تاریخ تولد',notesLabel:'برچسب توضیحات',notesPlaceholder:'متن راهنمای توضیحات',rulesSectionTitle:'عنوان قوانین',classRulesLabel:'برچسب شرایط کلاس',sessionRulesLabel:'برچسب شرایط ترم',generalRulesTitle:'عنوان قوانین عمومی',rulesAgreementText:'متن تأیید قوانین',bankInfoTitle:'عنوان اطلاعات پرداخت',onlinePayLabel:'متن پرداخت آنلاین',copyCardLabel:'متن کپی کارت',sendReceiptLabel:'متن ارسال فیش',paymentConfirmedLabel:'متن تأیید پرداخت',submitLabel:'متن دکمه ثبت‌نام',contactsSectionTitle:'عنوان راه‌های ارتباطی',instagramLabel:'برچسب اینستاگرام',telegramLabel:'برچسب تلگرام',phoneButtonLabel:'برچسب تماس',musicJoinLabel:'متن عضویت کانال'};
  function renderPageTexts(){
    const p=config.pageTexts||{};
    $('pageTextsEditor').innerHTML=Object.entries(PAGE_TEXT_LABELS).map(([k,label])=>'<div><label for="pageText-'+k+'">'+label+'</label><textarea id="pageText-'+k+'" rows="2">'+escapeHtml(p[k]||'')+'</textarea></div>').join('');
  }
  const CLASS_LABELS={normal:'کلاس عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP',online:'آنلاین'};
  function renderClassTypes(){
    const data=config.classTypesConfig||{};
    $('classTypesEditor').innerHTML=Object.entries(CLASS_LABELS).map(([k,label])=>{const v=data[k]||{enabled:true,statusText:'',allowedStyles:[]};return '<div class="edit-row"><div class="name-field"><span class="row-label">'+label+'</span><label><input type="checkbox" data-class-enabled="'+k+'" '+(v.enabled!==false?'checked':'')+'> فعال برای ثبت‌نام</label></div><div style="grid-column:span 2"><span class="row-label">متن وضعیت / ظرفیت</span><input data-class-status="'+k+'" value="'+escapeHtml(v.statusText||'')+'" placeholder="مثلاً ظرفیت محدود"></div></div>';}).join('');
  }
  async function loadNotifications(){
    if(!client||!window.gym20OwnerAuthorized)return;
    try{
      const {data,error}=await client.schema('gym20').from('site_settings').select('value').eq('key','student_push_config').maybeSingle();if(error)throw error;
      const v={enabled:true,reminder_1_hours:6,reminder_2_hours:2,reminder_1_template:'{student} عزیز، خوبی؟ 🌱 کلاس ما {relative}، {day} ساعت {time} برگزار می‌شود. منتظرت هستم!',reminder_2_template:'{student} عزیز 💪 آماده‌ای؟ کلاس شما {relative}، {day} ساعت {time} شروع می‌شود. به امید دیدار!',...(data?.value||{})};
      $('notificationEnabled').checked=v.enabled!==false;$('reminderOne').value=v.reminder_1_hours??6;$('reminderTwo').value=v.reminder_2_hours??2;$('reminderOneText').value=v.reminder_1_template;$('reminderTwoText').value=v.reminder_2_template;
      $('notificationStatus').textContent='تنظیمات فعلی دریافت شد.';
    }catch(e){$('notificationStatus').textContent=e.message||'دریافت تنظیمات اعلان ناموفق بود.';}
  }
  async function saveNotifications(){
    const first=Number($('reminderOne').value),second=Number($('reminderTwo').value);
    if(!Number.isInteger(first)||first<0||first>24||!Number.isInteger(second)||second<0||second>24){$('notificationStatus').textContent='زمان هر یادآوری باید بین صفر تا ۲۴ ساعت باشد.';return;}
    if(first>0&&second>0&&first<=second){$('notificationStatus').textContent='یادآوری اول باید از نظر زمانی زودتر باشد؛ نمونه: ۶ و سپس ۲ ساعت.';return;}
    const one=$('reminderOneText').value.trim(),two=$('reminderTwoText').value.trim();
    if(!one||!two||one.length>1000||two.length>1000){$('notificationStatus').textContent='متن هر دو یادآوری را کامل و حداکثر تا ۱۰۰۰ نویسه وارد کن.';return;}
    const b=$('saveNotificationSettings');b.disabled=true;
    try{
      const {data,error:readError}=await client.schema('gym20').from('site_settings').select('value').eq('key','student_push_config').maybeSingle();if(readError)throw readError;
      const {data:{user},error:authError}=await client.auth.getUser();if(authError)throw authError;
      const value={...(data?.value||{}),enabled:$('notificationEnabled').checked,reminder_1_hours:first,reminder_2_hours:second,reminder_1_template:one,reminder_2_template:two,updated_at:new Date().toISOString()};
      delete value.vapid_private_key;
      const {error}=await client.schema('gym20').from('site_settings').upsert({key:'student_push_config',value,updated_at:new Date().toISOString(),updated_by:user?.id||null},{onConflict:'key'});if(error)throw error;
      $('notificationStatus').textContent='تنظیمات یادآوری ذخیره شد ✓';
    }catch(e){$('notificationStatus').textContent=e.message||'ذخیره تنظیمات ناموفق بود.';}
    finally{b.disabled=false;}
  }
  let paymentRows=[];
  async function loadPayments(){
    if(!client||!window.gym20OwnerAuthorized)return;
    $('paymentsList').innerHTML='<p class="muted">در حال دریافت دفتر مالی…</p>';
    try{
      const {data,error}=await client.schema('gym20').from('student_payments').select('id,student_id,transaction_type,amount_toman,payment_method,paid_at,reference,notes,students(full_name)').order('paid_at',{ascending:false}).limit(500);
      if(error)throw error;paymentRows=data||[];
      const total=key=>paymentRows.filter(x=>x.transaction_type===key).reduce((sum,x)=>sum+Number(x.amount_toman||0),0);
      const paid=total('payment'),refund=total('refund');$('financePaid').textContent=paid.toLocaleString('fa-IR');$('financeRefunds').textContent=refund.toLocaleString('fa-IR');$('financeNet').textContent=(paid-refund).toLocaleString('fa-IR');
      $('paymentStudent').innerHTML='<option value="">انتخاب هنرجو…</option>'+students.map(x=>'<option value="'+escapeHtml(x.id)+'">'+escapeHtml(x.full_name)+'</option>').join('');
      $('paymentsList').innerHTML=paymentRows.length?paymentRows.map(x=>'<article class="request-card"><div><strong>'+escapeHtml(x.students?.full_name||'هنرجو')+' · '+Number(x.amount_toman).toLocaleString('fa-IR')+' تومان</strong><small>'+(x.transaction_type==='refund'?'برگشت وجه':'دریافت شهریه')+' · '+escapeHtml(x.payment_method)+' · '+escapeHtml(x.paid_at)+' · '+escapeHtml(x.reference||'بدون شناسه')+'</small><small>'+escapeHtml(x.notes||'')+'</small></div><span class="tag">'+(x.transaction_type==='refund'?'برگشت':'پرداخت')+'</span></article>').join(''):'<p class="muted">تراکنشی ثبت نشده است.</p>';
    }catch(e){$('paymentsList').innerHTML='<p class="muted">'+escapeHtml(e.message||'دریافت دفتر مالی ناموفق بود.')+'</p>';}
  }
  async function addPayment(){
    const student_id=$('paymentStudent').value,amount=Number($('paymentAmount').value);
    if(!student_id){$('paymentStatus').textContent='هنرجو را انتخاب کن.';return;}
    if(!Number.isSafeInteger(amount)||amount<1){$('paymentStatus').textContent='مبلغ معتبر به تومان وارد کن.';return;}
    const b=$('addPayment');b.disabled=true;
    try{
      const {data:{user},error:authError}=await client.auth.getUser();if(authError)throw authError;
      const row={student_id,transaction_type:$('paymentType').value,amount_toman:amount,payment_method:$('paymentMethod').value,paid_at:$('paymentDate').value||new Date().toISOString().slice(0,10),reference:$('paymentReference').value.trim()||null,notes:$('paymentNotes').value.trim()||null,created_by:user?.id||null};
      const {error}=await client.schema('gym20').from('student_payments').insert(row);if(error)throw error;
      $('paymentAmount').value='';$('paymentReference').value='';$('paymentNotes').value='';$('paymentStatus').textContent='تراکنش ثبت شد ✓';await loadPayments();
    }catch(e){$('paymentStatus').textContent=e.message||'ثبت تراکنش ناموفق بود.';}
    finally{b.disabled=false;}
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
  async function loadTelegramChannelInfo(){
    const input=$('telegramChannelId'),button=$('getTelegramChannelInfo'),details=$('telegramChannelDetails'),out=$('integrationStatus');
    const channel=(input?.value||'').trim();
    if(!client||!window.gym20OwnerAuthorized){out.textContent='ابتدا با حساب مدیر وارد شوید.';out.style.color='#e47777';return;}
    if(!channel){out.textContent='لینک یا آیدی کانال را وارد کنید.';out.style.color='#e47777';input?.focus();return;}
    button.disabled=true;button.textContent='در حال دریافت…';out.textContent='در حال ارتباط امن با تلگرام…';out.style.color='var(--muted)';details.innerHTML='';
    try{
      let {data:sessionData,error:sessionError}=await client.auth.getSession();
      if(sessionError)throw sessionError;
      let session=sessionData?.session||null;
      if(!session){
        const refreshed=await client.auth.refreshSession();
        if(refreshed.error)throw refreshed.error;
        session=refreshed.data?.session||null;
      }
      if(!session?.access_token)throw new Error('نشست مدیر در این مرورگر وجود ندارد یا پایان یافته است؛ دوباره با لینک ایمیل یا رمز عبور وارد شوید.');
      let {data:userData,error:userError}=await client.auth.getUser(session.access_token);
      if(userError||!userData?.user){
        const refreshed=await client.auth.refreshSession();
        if(refreshed.error||!refreshed.data?.session?.access_token)throw new Error('نشست مدیر منقضی شده است؛ از صفحه ورود دوباره وارد شوید.');
        session=refreshed.data.session;
        const verified=await client.auth.getUser(session.access_token);
        if(verified.error||!verified.data?.user)throw new Error('اعتبار نشست مدیر تأیید نشد؛ دوباره وارد شوید.');
      }
      const {data,error}=await client.functions.invoke('telegram-channel-info',{
        headers:{Authorization:'Bearer '+session.access_token},
        body:{channel}
      });
      if(error)throw new Error(error.message||'ارتباط با سرویس اطلاعات کانال ناموفق بود.');
      if(!data?.ok||!data.chat)throw new Error(data?.error||'اطلاعات کانال از تلگرام دریافت نشد.');
      const chat=data.chat;
      const rows=[['عنوان کانال',chat.title||'—'],['شناسه',chat.id||'—'],['نام کاربری',chat.username?'@'+chat.username:'ندارد'],['نوع',chat.type||'—'],['توضیحات',chat.description||'—']];
      details.innerHTML='<article class="request-card"><div>'+rows.map(([k,v])=>'<small><b>'+escapeHtml(k)+':</b> '+escapeHtml(v)+'</small>').join('')+'</div><span class="tag">دریافت شد</span></article>';
      config.telegramChannelId=channel;
      try{await saveConfig('اطلاعات کانال دریافت و شناسه آن ذخیره شد.');}
      catch(saveError){out.textContent='اطلاعات کانال دریافت شد؛ اما ذخیره شناسه ناموفق بود: '+(saveError.message||'خطای ذخیره');out.style.color='#e47777';return;}
      out.textContent='اطلاعات کانال با موفقیت دریافت شد و شناسه ذخیره شد ✓';out.style.color='var(--green)';
    }catch(error){
      out.textContent=error.message||'دریافت اطلاعات کانال ناموفق بود.';out.style.color='#e47777';
    }finally{button.disabled=false;button.textContent='دریافت اطلاعات کانال';}
  }

  async function runSave(button,fn) {
    const old=button.textContent;button.disabled=true;button.textContent='در حال ذخیره…';
    try{await fn();}catch(e){status(e.message||'ذخیره انجام نشد.',true);}
    finally{button.disabled=false;button.textContent=old;}
  }
  async function loadRequests() {
    $('requestsList').innerHTML='<p class="muted">در حال دریافت درخواست‌ها…</p>';
    const {data,error}=await client.from('public_registration_requests').select('id,full_name,phone,birth_date,class_type,notes,status,created_at,selected_styles,age_group,total_sessions,converted_student_id,converted_at').order('created_at',{ascending:false}).limit(100);
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
    if(!VIEW_META[view]){status('بخش انتخاب‌شده در پنل تعریف نشده است.',true);return;}
    const target=$('view-'+view);
    if(!target){status('محتوای این بخش در صفحه بارگذاری نشده است.',true);return;}
    document.querySelectorAll('.view,.admin-panel-tab').forEach(el=>el.classList.toggle('active',el===target));
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    $('pageTitle').textContent=VIEW_META[view][0];$('pageSubtitle').textContent=VIEW_META[view][1];
    if(view==='students')loadStudents();
    if(view==='exercises'){
      if(window.gym20OwnerAuthorized&&typeof window.loadExerciseStudents==='function')window.loadExerciseStudents();
      else if(window.gym20OwnerAuthorized)status('ماژول تمرین بارگذاری نشده است؛ فایل student-exercises.js را بررسی کنید.',true);
      else status('برای استفاده از تمرین‌ها ابتدا وارد حساب مدیر شوید.',true);
    }
    if(view==='requests')loadRequests().catch(e=>status(e.message||'دریافت درخواست‌ها ناموفق بود.',true));
    if(view==='attendance')loadAttendance();
    if(view==='coaches')loadCoachStats();
    if(view==='reports')loadReports();
    if(view==='payments')loadPayments();
    if(view==='notifications')loadNotifications();
  }
  async function refresh() {
    try{await loadConfig();if(document.getElementById('view-requests').classList.contains('active'))await loadRequests();status('اطلاعات بروزرسانی شد.');}
    catch(e){status(e.message||'بروزرسانی ناموفق بود.',true);}
  }


  window.switchAdminTab = function(id) {
    document.querySelectorAll('.view,.admin-panel-tab').forEach(el=>el.classList.toggle('active',el.id===id));
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===''+id.replace(/^view-/,'') ));
    document.querySelectorAll('.admin-tab-btn').forEach(el=>el.classList.toggle('active',String(el.getAttribute('onclick')||'').includes("'"+id+"'")));
    const metaKey=id==='studentTermsTab'?'students':id.replace(/^view-/,'');
    const meta=VIEW_META[metaKey];
    if(meta){$('pageTitle').textContent=meta[0];$('pageSubtitle').textContent=meta[1];}
    if(id==='view-students')loadStudents();
    if(id==='view-exercises'&&window.gym20OwnerAuthorized)window.loadExerciseStudents?.();
    if(id==='view-attendance')loadAttendance();
    if(id==='view-coaches')loadCoachStats();
    if(id==='view-reports')loadReports();
    if(id==='requestsTab'||id==='view-requests')loadRequests().catch(e=>status(e.message,true));
  };
  async function loadStudents() {
    if(!client||!window.gym20OwnerAuthorized)return;
    $('studentsList').innerHTML='<p class="muted">در حال دریافت هنرجویان…</p>';
    try{
      const {data,error}=await client.schema('gym20').from('students').select('id,full_name,phone,birth_date,notes,is_active,created_at').order('full_name');
      if(error)throw error;students=data||[];renderStudents();
    }catch(e){$('studentsList').innerHTML='<p class="muted">'+escapeHtml(e.message||'دریافت هنرجویان ناموفق بود.')+'</p>';}
  }
  function renderStudents(){
    const q=($('studentSearch').value||'').trim().toLowerCase(),state=$('studentState').value;
    const rows=students.filter(s=>(state==='all'||(state==='active'?s.is_active:s.is_active===false))&&(!q||String(s.full_name+' '+s.phone).toLowerCase().includes(q)));
    $('studentsList').innerHTML=rows.length?rows.map(s=>'<article class="request-card"><div><strong>'+escapeHtml(s.full_name)+'</strong><small><a href="tel:'+escapeHtml(s.phone||'')+'">'+escapeHtml(s.phone||'بدون شماره')+'</a> · '+(s.is_active?'فعال':'غیرفعال')+'</small></div><div class="request-actions"><button class="ghost" data-edit-student="'+escapeHtml(s.id)+'">ویرایش</button><button class="ghost" data-toggle-student="'+escapeHtml(s.id)+'">'+(s.is_active?'غیرفعال‌سازی':'فعال‌سازی')+'</button></div></article>').join(''):'<p class="muted">هنرجویی با این فیلتر پیدا نشد.</p>';
  }
  function resetStudentForm(){
    $('editStudentId').value='';$('studentName').value='';$('studentPhone').value='';$('studentBirth').value='';$('studentNotes').value='';$('studentActive').value='true';$('studentFormTitle').textContent='افزودن هنرجوی جدید';$('studentFormStatus').textContent='';
  }
  async function saveStudent(){
    const id=$('editStudentId').value,name=$('studentName').value.trim(),phone=$('studentPhone').value.trim();
    if(name.length<2){$('studentFormStatus').textContent='نام هنرجو را کامل وارد کن.';return;}
    if(phone.replace(/[^0-9+]/g,'').length<8){$('studentFormStatus').textContent='شماره تماس معتبر وارد کن.';return;}
    const row={full_name:name,phone,birth_date:$('studentBirth').value||null,notes:$('studentNotes').value.trim()||null,is_active:$('studentActive').value==='true'};
    const b=$('saveStudent');b.disabled=true;
    try{
      const result=id?await client.schema('gym20').from('students').update(row).eq('id',id):await client.schema('gym20').from('students').insert(row);
      if(result.error)throw result.error;
      $('studentFormStatus').textContent='پرونده هنرجو ذخیره شد ✓';resetStudentForm();await loadStudents();
    }catch(e){$('studentFormStatus').textContent=e.message||'ذخیره هنرجو ناموفق بود.';}
    finally{b.disabled=false;}
  }
  async function toggleStudent(id){
    const s=students.find(x=>x.id===id);if(!s)return;
    try{const {error}=await client.schema('gym20').from('students').update({is_active:!s.is_active}).eq('id',id);if(error)throw error;await loadStudents();}
    catch(e){status(e.message||'تغییر وضعیت هنرجو ناموفق بود.',true);}
  }
  async function loadAttendance(){
    if(!client||!window.gym20OwnerAuthorized)return;
    $('attendanceList').innerHTML='<p class="muted">در حال دریافت جلسات…</p>';
    try{
      const db=client.schema('gym20');
      const {data:sessions,error}=await db.from('class_sessions').select('id,term_id,schedule_version_id,session_number,starts_at,ends_at,venue,coach_name').not('schedule_version_id','is',null).order('starts_at',{ascending:true}).limit(300);
      if(error)throw error;
      const ids=(sessions||[]).map(x=>x.id);
      if(!ids.length){attendanceRows=[];renderAttendance();return;}
      const {data:links,error:le}=await db.from('class_session_styles').select('session_id,enrollment_id').in('session_id',ids);if(le)throw le;
      const enrollmentIds=[...new Set((links||[]).map(x=>x.enrollment_id))];
      const {data:enrollments,error:ee}=enrollmentIds.length?await db.from('enrollments').select('id,student_id,students(full_name)').in('id',enrollmentIds):{data:[],error:null};if(ee)throw ee;
      const {data:attendance,error:ae}=await db.from('attendance').select('session_id,student_id,status').in('session_id',ids);if(ae)throw ae;
      const studentByEnrollment=new Map((enrollments||[]).map(x=>[x.id,x]));
      const statusByKey=new Map((attendance||[]).map(x=>[x.session_id+'|'+x.student_id,x.status]));
      attendanceRows=[];
      (sessions||[]).forEach(session=>{
        const related=(links||[]).filter(x=>x.session_id===session.id);
        related.forEach(link=>{
          const enrollment=studentByEnrollment.get(link.enrollment_id);if(!enrollment)return;
          attendanceRows.push({...session,student_id:enrollment.student_id,student_name:enrollment.students?.full_name||'هنرجو',enrollment_id:link.enrollment_id,attendance_status:statusByKey.get(session.id+'|'+enrollment.student_id)||'pending'});
        });
      });
      renderAttendance();
    }catch(e){$('attendanceList').innerHTML='<p class="muted">'+escapeHtml(e.message||'دریافت جلسات ناموفق بود.')+'</p>';}
  }
  function renderAttendance(){
    if(!$('attendanceList'))return;
    const now=Date.now(),range=$('attendanceRange').value,q=$('attendanceSearch').value.trim().toLowerCase();
    const rows=attendanceRows.filter(x=>{
      const t=Date.parse(x.starts_at),date=new Date(x.starts_at).toDateString()===new Date().toDateString();
      return (range==='all'||(range==='today'&&date)||(range==='past'&&t<now)||(range==='upcoming'&&t>=now))&&(!q||String(x.student_name+' '+(x.coach_name||'')+' '+(x.venue||'')).toLowerCase().includes(q));
    });
    const names={pending:'در انتظار',present:'حاضر',absent:'غایب',excused:'غیبت موجه',makeup:'جبرانی',cancelled:'لغوشده'};
    $('attendanceList').innerHTML=rows.length?rows.map(x=>'<article class="request-card attendance-card" data-session="'+escapeHtml(x.id)+'" data-student="'+escapeHtml(x.student_id)+'"><div><strong>'+escapeHtml(x.student_name)+' · جلسه '+escapeHtml(x.session_number)+'</strong><small>'+new Date(x.starts_at).toLocaleString('fa-IR',{dateStyle:'medium',timeStyle:'short'})+' · '+escapeHtml(x.coach_name||'بدون مربی')+' · '+escapeHtml(x.venue||'بدون محل')+'</small></div><div class="request-actions"><select data-attendance-status>'+Object.entries(names).map(([k,v])=>'<option value="'+k+'" '+(x.attendance_status===k?'selected':'')+'>'+v+'</option>').join('')+'</select><button class="primary" data-save-attendance>ذخیره</button></div></article>').join(''):'<p class="muted">جلسه‌ای با این فیلتر پیدا نشد.</p>';
  }
  async function saveAttendanceRow(card){
    const session_id=card.dataset.session,student_id=card.dataset.student,statusValue=card.querySelector('[data-attendance-status]').value;
    const {data:{user},error:ue}=await client.auth.getUser();if(ue)throw ue;
    const row=attendanceRows.find(x=>x.id===session_id&&x.student_id===student_id);
    const {error}=await client.schema('gym20').from('attendance').upsert({session_id,student_id,enrollment_id:row?.enrollment_id||null,status:statusValue,confirmed_by:user?.id||null,confirmed_at:new Date().toISOString()},{onConflict:'session_id,student_id'});
    if(error)throw error;
    row.attendance_status=statusValue;
    status('حضور و غیاب ذخیره شد.');
  }
  async function loadCoachStats(){
    if(!client||!window.gym20OwnerAuthorized)return;
    $('coachStats').innerHTML='<p class="muted">در حال دریافت آمار مربیان…</p>';
    try{
      const {data,error}=await client.schema('gym20').from('class_sessions').select('id,coach_name,starts_at').not('schedule_version_id','is',null).limit(1000);
      if(error)throw error;
      const map={};(data||[]).forEach(x=>{const k=x.coach_name||'بدون مربی';map[k]=(map[k]||0)+1;});
      $('coachStats').innerHTML=Object.entries(map).map(([k,v])=>'<article class="request-card"><strong>'+escapeHtml(k)+'</strong><span class="tag">'+v.toLocaleString('fa-IR')+' جلسه</span></article>').join('')||'<p class="muted">هنوز جلسه‌ای ثبت نشده است.</p>';
    }catch(e){$('coachStats').innerHTML='<p class="muted">'+escapeHtml(e.message)+'</p>';}
  }
  async function loadReports(){
    if(!client||!window.gym20OwnerAuthorized)return;
    try{
      const [s,e,c,a]=await Promise.all([
        client.schema('gym20').from('students').select('id',{count:'exact',head:true}),
        client.schema('gym20').from('enrollments').select('id',{count:'exact',head:true}).eq('status','active'),
        client.schema('gym20').from('class_sessions').select('id',{count:'exact',head:true}).not('schedule_version_id','is',null),
        client.schema('gym20').from('attendance').select('id',{count:'exact',head:true}).neq('status','pending')
      ]);
      for(const x of [s,e,c,a])if(x.error)throw x.error;
      $('reportStudents').textContent=(s.count||0).toLocaleString('fa-IR');$('reportEnrollments').textContent=(e.count||0).toLocaleString('fa-IR');$('reportSessions').textContent=(c.count||0).toLocaleString('fa-IR');$('reportAttendance').textContent=(a.count||0).toLocaleString('fa-IR');
    }catch(e){status('گزارش مدیریتی: '+(e.message||'خطا در دریافت آمار'),true);}
  }
  function addRequestManagement(){
    const view=$('view-requests');if(!view||$('requestsSearch'))return;
    const panel=view.querySelector('.panel');
    const old=panel.querySelector('.filters');if(old)old.remove();
    panel.innerHTML='<div class="panel-head"><h2>درخواست‌های ثبت‌نام</h2><div class="request-actions"><button class="ghost" id="refreshRequests">↻ بروزرسانی</button><button class="ghost" id="bulkDeleteRequests">حذف انتخاب‌شده‌ها</button></div></div><div class="filters"><input id="requestsSearch" placeholder="جست‌وجوی نام یا شماره تماس"><select id="requestsStatus"><option value="all">همه وضعیت‌ها</option><option value="pending">در انتظار بررسی</option><option value="approved">تأییدشده</option><option value="rejected">ردشده</option><option value="converted">تبدیل‌شده</option></select></div><div id="requestDetails" class="panel hidden"></div><div id="requestsList" class="request-list"></div>';
    $('refreshRequests').addEventListener('click',()=>loadRequests().catch(e=>status(e.message,true)));
    $('requestsSearch').addEventListener('input',renderRequests);$('requestsStatus').addEventListener('change',renderRequests);
    $('requestsList').addEventListener('click',async e=>{
      const b=e.target.closest('[data-action]');if(!b)return;
      const r=requests.find(x=>x.id===b.dataset.id);if(!r)return;
      try{
        if(b.dataset.action==='details'){$('requestDetails').classList.remove('hidden');$('requestDetails').innerHTML='<b>'+escapeHtml(r.full_name)+'</b><p>'+escapeHtml(r.phone)+' · '+escapeHtml(r.birth_date||'بدون تاریخ تولد')+'</p><p>رده سنی: '+escapeHtml(r.age_group)+' · کلاس: '+escapeHtml(r.class_type)+' · جلسات: '+escapeHtml(r.total_sessions)+'</p><p>سبک‌ها: '+escapeHtml((r.selected_styles||[]).join('، '))+'</p><p>'+escapeHtml(r.notes||'بدون توضیح')+'</p>';return;}
        if(b.dataset.action==='convert'){if(!confirm('درخواست '+r.full_name+' به هنرجو تبدیل شود؟'))return;const {error}=await client.schema('gym20').rpc('convert_registration_request',{p_request_id:r.id});if(error)throw error;}
        if(b.dataset.action==='delete'){if(r.converted_student_id||r.status==='converted')throw Error('درخواست تبدیل‌شده قابل حذف نیست.');if(!confirm('این درخواست حذف شود؟'))return;const {error}=await client.schema('gym20').from('public_registration_requests').delete().eq('id',r.id).is('converted_student_id',null);if(error)throw error;}
        if(b.dataset.action==='approved'||b.dataset.action==='rejected'){const {error}=await client.schema('gym20').rpc('update_registration_request_status',{p_request_id:r.id,p_status:b.dataset.action});if(error)throw error;}
        await loadRequests();status('درخواست بروزرسانی شد.');
      }catch(err){status(err.message||'عملیات درخواست ناموفق بود.',true);}
    });
    $('bulkDeleteRequests').addEventListener('click',async()=>{const checks=[...document.querySelectorAll('[data-select-request]:checked')];if(!checks.length)return;if(!confirm('درخواست‌های انتخاب‌شده حذف شوند؟'))return;try{const ids=checks.map(x=>x.value),{error}=await client.schema('gym20').from('public_registration_requests').delete().in('id',ids).is('converted_student_id',null);if(error)throw error;await loadRequests();}catch(e){status(e.message,true);}});
  }
  function renderRequests(){
    if(!$('requestsList'))return;
    const q=$('requestsSearch').value.trim().toLowerCase(),filter=$('requestsStatus').value;
    const list=requests.filter(r=>(filter==='all'||r.status===filter)&&(!q||String(r.full_name+' '+r.phone).toLowerCase().includes(q)));
    const pending=requests.filter(r=>r.status==='pending').length;$('pendingBadge').textContent=String(pending);$('statPending').textContent=pending.toLocaleString('fa-IR');
    $('requestsList').innerHTML=list.length?list.map(r=>'<article class="request-card"><div><input type="checkbox" value="'+escapeHtml(r.id)+'" data-select-request '+(r.converted_student_id?'disabled':'')+'><strong>'+escapeHtml(r.full_name)+'</strong><small>'+escapeHtml(r.phone)+' · '+escapeHtml((r.selected_styles||[]).join('، '))+' · '+escapeHtml(r.status)+'</small></div><div class="request-actions"><button class="ghost" data-action="details" data-id="'+escapeHtml(r.id)+'">جزئیات</button>'+(r.status==='pending'?'<button class="primary" data-action="approved" data-id="'+escapeHtml(r.id)+'">تأیید</button><button class="ghost" data-action="rejected" data-id="'+escapeHtml(r.id)+'">رد</button>':'')+(r.status!=='converted'?'<button class="primary" data-action="convert" data-id="'+escapeHtml(r.id)+'">تبدیل به هنرجو</button><button class="ghost" data-action="delete" data-id="'+escapeHtml(r.id)+'">حذف</button>':'<span class="tag">تبدیل‌شده</span>')+'</div></article>').join(''):'<p class="muted">درخواستی پیدا نشد.</p>';
  }

  addRequestManagement();
  $('attendanceList').addEventListener('click',e=>{const b=e.target.closest('[data-save-attendance]');if(b){const card=b.closest('.attendance-card');b.disabled=true;saveAttendanceRow(card).catch(err=>status(err.message||'ذخیره حضور و غیاب ناموفق بود.',true)).finally(()=>b.disabled=false);}});
  async function enterAdminPanel(){
    await authorizeOwner();
    $('loginScreen').hidden=true;$('app').hidden=false;
    status('ورود مدیر تأیید شد؛ در حال دریافت اطلاعات…');
    try{
      await loadConfig();
      await loadStudents();
      await loadReports();
      showView('students');
      window.dispatchEvent(new Event('gym20:owner-authorized'));
    }catch(err){status(err.message||'دریافت اطلاعات پنل ناموفق بود.',true);}
  }
  $('passwordLogin').addEventListener('click',async()=>{
    const btn=$('passwordLogin');btn.disabled=true;btn.textContent='در حال بررسی…';loginStatus('');
    try{
      if(!client)await connect($('projectUrl').value.trim(),$('publishableKey').value.trim());
      const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
      if(!email)throw new Error('ایمیل مدیر را وارد کنید.');
      if(!password)throw new Error('رمز عبور مدیر را وارد کنید.');
      const {error}=await client.auth.signInWithPassword({email,password});
      if(error){
        if(error.code==='invalid_credentials'||/invalid login credentials/i.test(error.message||''))throw new Error('ایمیل یا رمز عبور درست نیست. اگر رمز را به یاد ندارید، «فراموشی رمز عبور» را بزنید یا لینک ورود ایمیلی بگیرید.');
        throw error;
      }
      await enterAdminPanel();
    }catch(err){loginStatus(err.message||'ورود با رمز عبور ناموفق بود.',true);}
    finally{btn.disabled=false;btn.textContent='ورود با رمز عبور';}
  });
  $('resetPassword').addEventListener('click',async()=>{
    const btn=$('resetPassword');btn.disabled=true;
    try{
      if(!client)await connect($('projectUrl').value.trim(),$('publishableKey').value.trim());
      const email=$('loginEmail').value.trim();
      if(!email)throw new Error('ابتدا ایمیل حساب مدیر را وارد کنید.');
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://gym20.ir/admin.html?recovery=1'});
      if(error)throw error;
      loginStatus('لینک بازیابی رمز عبور برای ایمیل حساب ارسال شد. لینک را روی همین دستگاه باز کنید.');
    }catch(err){loginStatus(err.message||'ارسال لینک بازیابی ناموفق بود.',true);}
    finally{btn.disabled=false;}
  });
  $('saveNewPassword').addEventListener('click',async()=>{
    const btn=$('saveNewPassword');btn.disabled=true;
    try{
      const password=$('newAdminPassword').value;
      if(password.length<8)throw new Error('رمز جدید باید حداقل ۸ کاراکتر باشد.');
      const {error}=await client.auth.updateUser({password});
      if(error)throw error;
      $('passwordRecoveryPanel').hidden=true;
      loginStatus('رمز عبور جدید ثبت شد؛ در حال ورود مدیر…');
      await enterAdminPanel();
    }catch(err){loginStatus(err.message||'ثبت رمز عبور جدید ناموفق بود.',true);}
    finally{btn.disabled=false;}
  });
  if(location.search.includes('recovery=1')||location.hash.includes('type=recovery')){
    $('passwordRecoveryPanel').hidden=false;
    loginStatus('لینک بازیابی تأیید شد؛ رمز عبور جدید را وارد کنید.');
  }

  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=$('loginSubmit');btn.disabled=true;btn.textContent='در حال ارسال…';loginStatus('');
    try{
      if(!client)await connect($('projectUrl').value.trim(),$('publishableKey').value.trim());
      const email=$('loginEmail').value.trim();
      if(!email)throw new Error('ایمیل حساب مدیر را وارد کنید.');
      const {error}=await client.auth.signInWithOtp({
        email,
        options:{
          emailRedirectTo:'https://gym20.ir/admin-login.html',
          shouldCreateUser:false
        }
      });
      if(error)throw error;
      loginStatus('لینک ورود به ایمیل مدیر ارسال شد. صندوق ورودی و پوشه هرزنامه را بررسی کنید؛ لینک را روی همین دستگاه باز کنید.');
      btn.textContent='ارسال دوباره لینک';
    }catch(err){
      loginStatus(err.message||'ارسال لینک ورود ناموفق بود.',true);
      btn.textContent='ارسال لینک ورود';
    }finally{btn.disabled=false;}
  });
  $('logoutBtn').addEventListener('click',async()=>{window.gym20OwnerAuthorized=false;if(client)await client.auth.signOut();location.reload();});
  $('mainNav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)showView(b.dataset.view);});
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  $('refreshBtn').addEventListener('click',refresh);
  $('saveNotificationSettings').addEventListener('click',saveNotifications);$('reloadPayments').addEventListener('click',loadPayments);$('addPayment').addEventListener('click',addPayment);
  $('reloadStudents').addEventListener('click',loadStudents);$('studentSearch').addEventListener('input',renderStudents);$('studentState').addEventListener('change',renderStudents);
  $('studentsList').addEventListener('click',e=>{const edit=e.target.closest('[data-edit-student]'),toggle=e.target.closest('[data-toggle-student]');if(edit){const s=students.find(x=>x.id===edit.dataset.editStudent);if(!s)return;$('editStudentId').value=s.id;$('studentName').value=s.full_name||'';$('studentPhone').value=s.phone||'';$('studentBirth').value=s.birth_date||'';$('studentNotes').value=s.notes||'';$('studentActive').value=String(!!s.is_active);$('studentFormTitle').textContent='ویرایش پرونده هنرجو';window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});}if(toggle)toggleStudent(toggle.dataset.toggleStudent);});
  $('studentFormReset').addEventListener('click',resetStudentForm);$('saveStudent').addEventListener('click',saveStudent);
  $('paymentDate').value=new Date().toISOString().slice(0,10);
  $('reloadAttendance').addEventListener('click',loadAttendance);$('attendanceSearch').addEventListener('input',renderAttendance);$('attendanceRange').addEventListener('change',renderAttendance);
  $('reloadCoachStats').addEventListener('click',loadCoachStats);$('reloadReports').addEventListener('click',loadReports);


  $('stylesEditor').addEventListener('click',e=>{const b=e.target.closest('[data-delete-style]');if(!b)return;config.styles.splice(Number(b.dataset.deleteStyle),1);renderStyles();});
  $('addStyle').addEventListener('click',()=>{const name=prompt('نام سبک جدید را وارد کنید:');if(name?.trim()){config.styles=config.styles||[];config.styles.push({id:'style_'+Date.now(),name:name.trim()});renderStyles();}});
  $('saveClasses').addEventListener('click',e=>runSave(e.currentTarget,async()=>{
    readStyles();
    config.classTypesConfig=config.classTypesConfig||{};Object.keys(CLASS_LABELS).forEach(k=>{const old=config.classTypesConfig[k]||{};config.classTypesConfig[k]={...old,enabled:!!document.querySelector('[data-class-enabled="'+k+'"]')?.checked,statusText:document.querySelector('[data-class-status="'+k+'"]')?.value||'',allowedStyles:old.allowedStyles||[]};});config.multipliers={...(config.multipliers||{}),normal:n($('factorNormal').value),semi:n($('factorSemi').value),private:n($('factorPrivate').value),vip:n($('factorVip').value),online:n($('factorOnline').value)};
    config.sessionRates={'8':n($('rate8').value),'10':n($('rate10').value),'12':n($('rate12').value)};
    await saveConfig('سبک‌ها و ضرایب کلاس ذخیره شد.');
  }));
  $('regionsEditor').addEventListener('click',e=>{const b=e.target.closest('[data-delete-region]');if(!b)return;if((config.regions||[]).length<=1){status('حداقل یک منطقه باید باقی بماند.',true);return;}config.regions.splice(Number(b.dataset.deleteRegion),1);renderRegions();});
  $('addRegion').addEventListener('click',()=>{config.regions=config.regions||[];config.regions.push({id:'reg_'+Date.now(),name:'منطقه جدید',kidsBase:1500000,adultBase:2000000,extraStylePrice:500000});renderRegions();});
  $('saveRegions').addEventListener('click',e=>runSave(e.currentTarget,async()=>{readRegions();await saveConfig('مناطق و قیمت‌ها ذخیره شد.');}));
  $('saveRules').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.rules=config.rules||{};Object.keys(RULE_NAMES).forEach(k=>config.rules[k]=$('rule-'+k).value);await saveConfig('قوانین ذخیره شد.');}));
  $('getTelegramChannelInfo').addEventListener('click',loadTelegramChannelInfo);
  $('saveSite').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.brandTag=$('brandTag').value;config.bannerTitle=$('bannerTitle').value;config.bannerSubtitle=$('bannerSubtitle').value;config.pageTexts=config.pageTexts||{};Object.keys(PAGE_TEXT_LABELS).forEach(k=>config.pageTexts[k]=$('pageText-'+k).value);await saveConfig('محتوای سایت ذخیره شد.');}));
  $('savePayments').addEventListener('click',e=>runSave(e.currentTarget,async()=>{config.card={...(config.card||{}),bank:$('bankName').value,number:$('cardNumber').value,cleanNumber:$('cardNumber').value.replace(/\D/g,''),owner:$('cardOwner').value,gatewayLink:$('gatewayLink').value};config.contact={...(config.contact||{}),phone:$('contactPhone').value,instagram:$('contactInstagram').value,telegram:$('contactTelegram').value};await saveConfig('اطلاعات پرداخت و ارتباطات ذخیره شد.');}));
  // Restore the verified owner session after the email magic-link callback.
  (async()=>{
    try{
      await connect($('projectUrl').value.trim(),$('publishableKey').value.trim());
      const {data:{session},error}=await client.auth.getSession();
      if(error)throw error;
      if(session)await enterAdminPanel();
    }catch(err){
      loginStatus(err.message||'بازیابی نشست ورود مدیر ناموفق بود.',true);
    }
  })();

})();