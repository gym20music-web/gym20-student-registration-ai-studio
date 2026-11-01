(() => {
  const TAB='studentTermsTab', S={students:[],enrollments:[],terms:[],studentId:'',termId:'',term:null,draftId:'',rows:[],publishedId:null,sessions:[],termEnrollmentIds:[]};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=v=>Number(v||0).toLocaleString('fa-IR');
  const db=()=>{if(!gym20OwnerAuthorized||!gym20AdminClient)throw Error('ابتدا با حساب مدیر وارد شوید.');return gym20AdminClient.schema('gym20');};
  const say=(m,bad)=>{const e=$('stFeedback');if(e){e.textContent=m||'';e.style.color=bad?'#fb7185':'#34d399';}};
  const dateFa=v=>v?jalaliInput(String(v).slice(0,10)).replace(/\//g,'/'):'—';
  const enDigits=v=>String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const jalaliInput=v=>{if(!v)return '';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '';if(p[0]<1700)return String(p[0]).padStart(4,'0')+'/'+String(p[1]).padStart(2,'0')+'/'+String(p[2]).padStart(2,'0');return new Intl.DateTimeFormat('en-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p[0],p[1]-1,p[2],12)).replace(/[^0-9]/g,'/');};
  const gregorianInput=v=>{const z=enDigits(v).trim().replace(/[.\-]/g,'/');if(!z)return '';const p=z.split('/').map(Number);if(p.length!==3||p[0]<1200||p[1]<1||p[1]>12||p[2]<1||p[2]>31)throw Error('تاریخ شمسی را به شکل ۱۴۰۵/۰۸/۱۰ وارد کن.');const g=jalaliToGregorian(p[0],p[1],p[2]);if(!g)throw Error('تاریخ شمسی معتبر نیست.');return g;};
  const bindJalaliDates=root=>{(root||document).querySelectorAll('[data-jalali-date]').forEach(el=>{if(el.dataset.jalaliBound)return;el.dataset.jalaliBound='1';el.type='text';el.inputMode='numeric';el.placeholder='۱۴۰۵/۰۸/۱۰';el.value=jalaliInput(el.value);el.addEventListener('input',()=>{let v=enDigits(el.value).replace(/[^0-9]/g,'').slice(0,8);if(v.length>6)v=v.slice(0,4)+'/'+v.slice(4,6)+'/'+v.slice(6);else if(v.length>4)v=v.slice(0,4)+'/'+v.slice(4);el.value=v;});});};
  const localISO=(d,t)=>{const x=new Date(d+'T'+t+':00');if(isNaN(x))throw Error('تاریخ یا ساعت نامعتبر است.');return x.toISOString();};
  const localDate=v=>{const d=new Date(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const localTime=v=>{const d=new Date(v);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
  const rowMinutes=r=>Math.max(1,Math.round((new Date(r.ends_at)-new Date(r.starts_at))/60000));
  const plus7=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+7*n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  const classNames={normal:'عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP',online:'آنلاین'};
  const attNames={pending:'در انتظار',present:'حاضر',absent:'غایب',excused:'غیبت موجه',makeup:'جلسه جبرانی',cancelled:'لغوشده'};

  function mount(){
    if($(TAB))return;
    const nav=document.querySelector('.admin-tabs'),work=document.querySelector('.admin-workspace');
    if(!nav||!work)return;
    const css=document.createElement('style');css.id='studentTermsCss';
    css.textContent='#studentTermsTab{color:var(--text-primary)}.st-card{background:var(--surface-card);border:1px solid var(--border);border-radius:11px;padding:11px;margin:10px 0}.st-title{font-size:.88rem;font-weight:850;color:#d6b35a;margin-bottom:8px}.st-muted{font-size:.7rem;color:var(--text-secondary);line-height:1.8}.st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}.st-field label{font-size:.7rem;color:var(--text-secondary);font-weight:700}.st-field input,.st-field select{width:100%;min-width:0;height:34px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:7px;padding:5px 7px;font-size:.72rem}.st-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.st-btn{border:1px solid rgba(214,179,90,.35);border-radius:7px;background:rgba(214,179,90,.12);color:var(--text-primary);padding:6px 9px;font-size:.66rem;font-weight:800;cursor:pointer}.st-btn.primary{background:linear-gradient(110deg,#a98235,#e0c16e);color:#17130a}.st-btn.danger{border-color:#ef4444;color:#fb7185}.st-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.st-check{display:flex;align-items:center;gap:6px;padding:6px 7px;border:1px solid var(--border);border-radius:7px;background:var(--surface);font-size:.66rem;line-height:1.5;min-width:0}.st-check input{accent-color:#d6b35a}.st-table-wrap{overflow:auto}.st-table{width:100%;border-collapse:collapse;font-size:.7rem;min-width:600px}.st-table th,.st-table td{padding:8px;border-bottom:1px solid var(--border);text-align:right}.st-table th{color:#d6b35a;background:rgba(214,179,90,.07)}.st-table select,.st-table input{max-width:150px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:6px;font-size:.68rem}.st-table small{display:block;color:var(--text-secondary);font-size:.6rem}.st-version{padding:7px;border:1px solid var(--border);border-radius:8px;margin:5px 0;font-size:.7rem}.st-hide{display:none!important}.st-short-url{direction:ltr;text-align:left;word-break:break-all;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:9px;margin:7px 0;font-size:.78rem;color:#e7c875}.st-public-link{margin-top:8px}@media(max-width:650px){.st-grid,.st-checks{grid-template-columns:repeat(2,minmax(0,1fr))}.st-card{padding:8px}}@media(max-width:390px){.st-grid,.st-checks{grid-template-columns:1fr}}';
    css.textContent += '@media(max-width:720px){.admin-layout{flex-direction:row!important;direction:rtl!important;align-items:stretch!important}.admin-sidebar{width:102px!important;flex:0 0 102px!important;min-width:102px!important;max-height:none!important;padding:7px 5px!important;border-left:1px solid var(--border)!important;border-bottom:0!important;gap:7px!important;overflow-y:auto!important;overflow-x:hidden!important}.admin-sidebar-brand{display:block!important;padding:6px 5px!important}.admin-sidebar-brand strong{font-size:.66rem!important}.admin-sidebar-brand small{font-size:.52rem!important}.admin-tabs{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:5px!important;justify-content:flex-start!important}.admin-tab-btn{width:100%!important;min-height:38px!important;flex:0 0 auto!important;padding:6px 5px!important;font-size:.61rem!important;line-height:1.35!important;white-space:normal!important;text-align:right!important;border-radius:7px!important}.admin-tab-btn.active{box-shadow:inset -3px 0 0 #d6b35a!important}.admin-workspace{flex:1!important;min-width:0!important;padding:8px 7px calc(14px + env(safe-area-inset-bottom))!important}.st-card{padding:7px!important;margin:6px 0!important}.st-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}.st-field{gap:3px!important;margin-bottom:5px!important}.st-field label{font-size:.63rem!important}.st-field input,.st-field select{height:32px!important;padding:4px 6px!important;font-size:12px!important}.st-btn{padding:5px 7px!important;font-size:.62rem!important}.st-table{min-width:680px!important}.st-table th,.st-table td{padding:5px!important}.st-table input,.st-table select{padding:4px!important;font-size:11px!important}}@media(max-width:390px){.admin-sidebar{width:90px!important;flex-basis:90px!important;min-width:90px!important}.admin-tab-btn{font-size:.57rem!important;padding:5px 4px!important}.st-grid{grid-template-columns:1fr!important}}';
    document.head.appendChild(css);
    const b=document.createElement('button');b.className='admin-tab-btn';b.type='button';b.textContent='👥 هنرجویان و ترم‌ها';b.setAttribute('onclick',"switchAdminTab('"+TAB+"')");
    nav.insertBefore(b,nav.querySelector('[onclick*="requestsTab"]')||null);
    const p=document.createElement('div');p.className='admin-panel-tab';p.id=TAB;
    p.innerHTML=
      '<div class="admin-section-subhead">👥 مدیریت هنرجویان، ترم‌ها و برنامه جلسات</div>'+
      '<p class="st-muted">پیش‌نویس از برنامه منتشرشده جداست؛ تغییرات فقط پس از انتشار برای هنرجو قابل مشاهده می‌شود.</p>'+
      '<div class="st-card"><div class="st-title">۱. انتخاب هنرجو</div><div class="st-field"><label>هنرجو</label><select id="stStudent"><option value="">در حال دریافت…</option></select></div><div id="stSummary" class="st-muted"></div></div>'+
      '<div id="stMain" class="st-hide">'+
      '<div class="st-card"><div class="st-title">۲. ساخت ترم</div><form id="stCreate">'+
      '<div class="st-grid">'+
      '<div class="st-field"><label>نام ترم</label><input id="stName" required maxlength="100" placeholder="مثلاً ترم ۱ آبان ۱۴۰۵"></div>'+
      '<div class="st-field"><label>تعداد اولیه جلسات (قابل تغییر در برنامه)</label><select id="stCount"><option value="8">۸ جلسه (پیش‌فرض)</option><option value="10">۱۰ جلسه</option><option value="12">۱۲ جلسه</option><option value="custom">تعداد دلخواه</option></select></div>'+
      '<div class="st-field st-hide" id="stCustomWrap"><label>تعداد دلخواه</label><input id="stCustom" type="number" min="1" max="1000" value="8"></div>'+
      '<div class="st-field"><label>مدت پیش‌فرض جلسه (دقیقه)</label><input id="stDuration" type="number" min="15" max="720" step="5" value="60"></div>'+
      '<div class="st-field"><label>شروع ترم</label><input id="stStart" data-jalali-date type="text"></div>'+
      '<div class="st-field"><label>پایان ترم</label><input id="stEnd" data-jalali-date type="text"></div>'+
      '<div class="st-field"><label>محل پیش‌فرض</label><input id="stVenue" maxlength="250" placeholder="مثلاً سالن نیاوران"></div>'+
      '<div class="st-field"><label>روش برنامه‌ریزی</label><select id="stMode"><option value="manual">ویرایش دستی هر جلسه</option><option value="weekly">برنامه ثابت هفتگی</option></select></div></div>'+
      '<div class="st-field"><label>سبک‌های این ترم</label><div id="stEnrollments" class="st-checks"></div></div>'+
      '<div class="st-actions"><button class="st-btn primary" type="submit">ثبت ترم</button></div></form></div>'+
      '<div class="st-card"><div class="st-title">۳. ترم‌های هنرجو</div><div class="st-field"><label>انتخاب ترم</label><select id="stTerm"><option value="">انتخاب ترم…</option></select></div><div id="stTermInfo" class="st-muted"></div><div id="stVersions"></div></div>'+
      '<div id="stSchedule" class="st-hide">'+
      '<div class="st-card"><div class="st-title">۴. برنامه جلسات پیش‌نویس</div><div id="stDraftMeta" class="st-muted"></div>'+
      '<div id="stWeekly" class="st-hide"><p class="st-muted">تعداد اولیه جلسات ساخته می‌شود؛ بعد از ساخت می‌توانی هر جلسه را حذف یا ویرایش کنی. انتخاب سبک اجباری نیست.</p><div class="st-grid"><div class="st-field"><label>تاریخ اولین جلسه</label><input data-jalali-date type="text" id="stWeeklyDate"></div><div class="st-field"><label>ساعت شروع</label><input type="time" id="stWeeklyTime" value="18:00"></div><div class="st-field"><label>محل جلسات</label><input id="stWeeklyVenue" placeholder="خالی = محل پیش‌فرض"></div></div><button class="st-btn" type="button" id="stMakeWeekly">ساخت جلسات هفتگی</button></div>'+
      '<div id="stManual" class="st-hide"><p class="st-muted">هر تعداد جلسه خواستی اضافه کن. سبک اختیاری است و مدت هر جلسه جداگانه تعیین می‌شود.</p><div class="st-grid">'+
      '<div class="st-field"><label>سبک‌های این جلسه (اختیاری)</label><div id="stStyle" class="st-checks"></div></div><div class="st-field"><label>شماره جلسه</label><input id="stNumber" type="number" min="1" max="1000" value="1"></div>'+
      '<div class="st-field"><label>تاریخ</label><input id="stDate" type="date"></div><div class="st-field"><label>ساعت شروع</label><input id="stTime" type="time" value="18:00"></div><div class="st-field"><label>مدت این جلسه (دقیقه)</label><input id="stSessionDuration" type="number" min="15" max="720" step="5" value="60"></div>'+
      '<div class="st-field"><label>نام مربی این جلسه</label><input id="stSessionCoach" maxlength="120" placeholder="نام مربی"></div><div class="st-field"><label>محل این جلسه</label><input id="stSessionVenue" placeholder="خالی = محل پیش‌فرض"></div></div><button class="st-btn" type="button" id="stAdd">افزودن جلسه</button></div>'+
      '<div id="stDraftTable" class="st-table-wrap"></div><div class="st-actions"><button class="st-btn primary" type="button" id="stSave">ذخیره پیش‌نویس</button><button class="st-btn" type="button" id="stPublish">انتشار برنامه برای هنرجو</button></div></div>'+
      '<div class="st-card"><div class="st-title">۵. حضور و غیاب</div><p class="st-muted">ثبت حضور و غیاب فقط برای نسخه منتشرشده فعال است.</p><div id="stAttendance" class="st-muted">برنامه‌ای منتشر نشده است.</div></div></div></div>'+
      '<div id="stFeedback" class="request-feedback" role="status" aria-live="polite"></div>';
    const save=$('autoCommitBtn');work.insertBefore(p,save||null);
    bindJalaliDates(p);
    $('stStudent').addEventListener('change',e=>loadStudent(e.target.value));
    $('stSummary').addEventListener('click',e=>{if(e.target.closest('#stPublicLinkBtn'))makeStudentPublicLink();});
    $('stCount').addEventListener('change',e=>$('stCustomWrap').classList.toggle('st-hide',e.target.value!=='custom'));
    $('stCreate').addEventListener('submit',createTerm);
    $('stTerm').addEventListener('change',e=>loadTerm(e.target.value));
    $('stMakeWeekly').addEventListener('click',makeWeekly);
    $('stAdd').addEventListener('click',addManual);
    $('stSave').addEventListener('click',saveDraft);
    $('stPublish').addEventListener('click',publish);
    b.addEventListener('click',()=>{if(gym20OwnerAuthorized)loadStudents();else say('ابتدا وارد پنل مدیر شوید.',true);});
  }

  async function loadStudents(){
    try{say('در حال دریافت هنرجویان…');const {data,error}=await db().from('students').select('id,full_name,phone,birth_date,is_active').eq('is_active',true).order('full_name');if(error)throw error;S.students=data||[];
      $('stStudent').innerHTML='<option value="">انتخاب هنرجو…</option>'+S.students.map(x=>'<option value="'+x.id+'">'+esc(x.full_name)+' — '+esc(x.phone||'بدون شماره')+'</option>').join('');
      if(S.studentId&&S.students.some(x=>x.id===S.studentId)){$('stStudent').value=S.studentId;await loadStudent(S.studentId);}else say(fa(S.students.length)+' هنرجوی فعال دریافت شد.');
    }catch(e){say(e.message||'دریافت هنرجویان ناموفق بود.',true);}
  }

  async function loadStudent(id){
    S.studentId=id;S.termId='';S.terms=[];S.enrollments=[];$('stMain').classList.toggle('st-hide',!id);$('stSchedule').classList.add('st-hide');if(!id)return;
    try{say('در حال دریافت پرونده هنرجو…');const student=S.students.find(x=>x.id===id);
      const [er,tr]=await Promise.all([
        db().from('enrollments').select('id,course_id,class_type,age_group,total_sessions,start_date,end_date,status,courses(name)').eq('student_id',id).order('created_at'),
        db().from('student_terms').select('id,term_name,start_date,end_date,total_sessions,duration_minutes,default_venue,schedule_mode,status,published_version_id,created_at').eq('student_id',id).order('created_at',{ascending:false})
      ]);
      if(er.error)throw er.error;if(tr.error)throw tr.error;S.enrollments=er.data||[];S.terms=tr.data||[];
      $('stSummary').innerHTML='<b>'+esc(student?.full_name||'')+'</b> · '+esc(student?.phone||'—')+'<br>تعداد سبک‌ها: '+fa(S.enrollments.length)+' · تولد: '+esc(student?.birth_date||'ثبت نشده')+'<div id="stPublicLinkBox" class="st-public-link"><div class="st-actions"><button type="button" class="st-btn primary" id="stPublicLinkBtn">🔗 ساخت لینک اختصاصی</button><span id="stPublicLinkStatus" class="st-muted">در حال بررسی لینک…</span></div></div>';
      loadStudentPublicLink();
      $('stEnrollments').innerHTML=S.enrollments.map(e=>'<label class="st-check"><input type="checkbox" name="stEnroll" value="'+e.id+'" '+(e.status==='active'?'checked':'')+'><span>'+esc(e.courses?.name||'سبک')+' <small>('+esc(classNames[e.class_type]||e.class_type||'عمومی')+' · '+(e.age_group==='kids'?'کودک':'بزرگسال')+')</small></span></label>').join('')||'ثبت‌نام فعالی وجود ندارد.';
      $('stTerm').innerHTML='<option value="">انتخاب ترم…</option>'+S.terms.map(t=>'<option value="'+t.id+'">'+esc(t.term_name)+' · '+fa(t.total_sessions)+' جلسه</option>').join('');
      say('پرونده هنرجو دریافت شد؛ ترم‌های قبلی: '+fa(S.terms.length));
    }catch(e){say(e.message||'دریافت پرونده ناموفق بود.',true);}
  }

  function studentShortUrl(code){return 'https://gym20.ir/s/'+encodeURIComponent(code);}
  async function renderStudentPublicLink(code){
    const box=$('stPublicLinkBox');if(!box)return;
    if(!code){box.innerHTML='<div class="st-actions"><button type="button" class="st-btn primary" id="stPublicLinkBtn">🔗 ساخت لینک اختصاصی</button><span id="stPublicLinkStatus" class="st-muted">هنوز لینکی ساخته نشده است.</span></div>';return;}
    const url=studentShortUrl(code);
    box.innerHTML='<div class="st-muted">لینک اختصاصی هنرجو</div><div class="st-short-url" dir="ltr">'+esc(url)+'</div><div class="st-actions"><button type="button" class="st-btn primary" id="stCopyPublicLinkBtn">کپی لینک</button><a class="st-btn" id="stSharePublicLinkBtn" target="_blank" rel="noopener">ارسال در تلگرام</a><button type="button" class="st-btn danger" id="stRenewPublicLinkBtn">ساخت لینک جدید</button></div><div id="stPublicLinkStatus" class="st-muted">این لینک فقط برنامه‌های منتشرشده را نمایش می‌دهد.</div>';
    $('stSharePublicLinkBtn').href='https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent('برنامه کلاس‌های GYM20 شما');
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

  async function createTerm(ev){
    ev.preventDefault();try{
      const ids=Array.from(document.querySelectorAll('input[name="stEnroll"]:checked')).map(x=>x.value);
      const count=$('stCount').value==='custom'?Number($('stCustom').value):Number($('stCount').value);
      if(!ids.length)throw Error('حداقل یک سبک را انتخاب کنید.');if(!Number.isInteger(count)||count<1||count>1000)throw Error('تعداد اولیه جلسات معتبر نیست.');
      const termName=$('stName').value.trim();const exists=await db().from('student_terms').select('id').eq('student_id',S.studentId).ilike('term_name',termName).limit(1);if(exists.error)throw exists.error;if(exists.data?.length){throw Error('این نام ترم قبلاً برای این هنرجو ثبت شده است؛ از فهرست ترم‌ها همان ترم را انتخاب کن یا نام دیگری وارد کن.');}
      say('در حال ثبت ترم…');
      const {data,error}=await db().rpc('create_student_term',{p_student_id:S.studentId,p_term_name:termName,p_start_date:gregorianInput($('stStart').value)||null,p_end_date:gregorianInput($('stEnd').value)||null,p_total_sessions:count,p_duration_minutes:Number($('stDuration').value),p_default_venue:$('stVenue').value.trim()||null,p_schedule_mode:$('stMode').value,p_enrollment_ids:ids});
      if(error)throw error;const x=Array.isArray(data)?data[0]:data;if(!x?.term_id)throw Error('ترم ساخته شد اما شناسه دریافت نشد.');
      await loadStudent(S.studentId);$('stTerm').value=x.term_id;await loadTerm(x.term_id);$('stName').value='';say('ترم و پیش‌نویس اولیه ساخته شد.');
    }catch(e){say(e.message||'ساخت ترم ناموفق بود.',true);}
  }

  async function loadTerm(id){
    S.termId=id;S.term=S.terms.find(x=>x.id===id)||null;S.draftId='';S.rows=[];S.publishedId=null;$('stSchedule').classList.toggle('st-hide',!id);if(!id)return;
    try{
      const {data,error}=await db().from('term_schedule_versions').select('id,version_number,status,created_at,published_at').eq('term_id',id).order('version_number',{ascending:false});if(error)throw error;
      const vs=data||[],draft=vs.find(v=>v.status==='draft'),pub=vs.find(v=>v.status==='published');S.draftId=draft?.id||'';S.publishedId=pub?.id||S.term.published_version_id||null;
      $('stTermInfo').innerHTML='جلسات: '+fa(S.term.total_sessions)+' · مدت: '+fa(S.term.duration_minutes)+' دقیقه · روش: '+(S.term.schedule_mode==='weekly'?'هفتگی':'دستی')+'<br>محل پیش‌فرض: '+esc(S.term.default_venue||'ثبت نشده')+' · شروع: '+dateFa(S.term.start_date)+' · پایان: '+dateFa(S.term.end_date);
      $('stVersions').innerHTML='<b class="st-muted">تاریخچه نسخه‌ها</b>'+vs.map(v=>'<div class="st-version">نسخه '+fa(v.version_number)+' · '+(v.status==='draft'?'پیش‌نویس':v.status==='published'?'منتشرشده':'نسخه قبلی')+' · '+new Date(v.created_at).toLocaleString('fa-IR')+'</div>').join('');
      if(S.draftId){await loadDraftRows();await renderBuilder();}else if(S.publishedId){$('stDraftMeta').textContent='برای ویرایش، از نسخه منتشرشده پیش‌نویس جدید بسازید.';$('stDraftTable').innerHTML='<button class="st-btn" id="stNewDraft">ساخت پیش‌نویس از نسخه منتشرشده</button>';$('stNewDraft').onclick=createDraft;$('stWeekly').classList.add('st-hide');$('stManual').classList.add('st-hide');}else{say('پیش‌نویس این ترم موجود نیست.',true);}
      await loadAttendance();
    }catch(e){say(e.message||'دریافت ترم ناموفق بود.',true);}
  }

  async function loadDraftRows(){
    if(!S.draftId)return;const {data,error}=await db().from('class_sessions').select('id,enrollment_id,session_number,starts_at,ends_at,venue,coach_name,notes,courses(name)').eq('schedule_version_id',S.draftId).order('starts_at');if(error)throw error;S.rows=(data||[]).map(x=>({...x,enrollment_ids:x.enrollment_id?[x.enrollment_id]:[]}));if(S.rows.length){const rr=await db().from('class_session_styles').select('session_id,enrollment_id').in('session_id',S.rows.map(x=>x.id));if(rr.error)throw rr.error;rr.data.forEach(z=>{const row=S.rows.find(x=>x.id===z.session_id);if(row)row.enrollment_ids.push(z.enrollment_id);});}
  }
  async function renderBuilder(){
    const {data:links,error}=await db().from('term_enrollments').select('enrollment_id').eq('term_id',S.termId);if(error)throw error;
    const ids=(links||[]).map(x=>x.enrollment_id),selected=S.enrollments.filter(e=>ids.includes(e.id));S.termEnrollmentIds=ids;
    $('stDraftMeta').textContent='پیش‌نویس فعال · '+fa(S.term.total_sessions)+' جلسه برای کل ترم · '+fa(S.term.duration_minutes)+' دقیقه';
    $('stWeekly').classList.toggle('st-hide',S.term.schedule_mode!=='weekly');$('stManual').classList.toggle('st-hide',S.term.schedule_mode!=='manual');
    $('stStyle').innerHTML=selected.map(e=>'<label class="st-check"><input type="checkbox" value="'+e.id+'"><span>'+esc(e.courses?.name||'سبک')+'</span></label>').join('');
    $('stWeeklyDate').value=jalaliInput(S.term.start_date||'');$('stWeeklyVenue').placeholder=S.term.default_venue||'خالی = محل پیش‌فرض';$('stSessionDuration').value=String(S.term.duration_minutes||60);
    drawDraft();
  }
  function drawDraft(){
    if(!S.rows.length){$('stDraftTable').innerHTML='<p class="st-muted">هنوز جلسه‌ای در پیش‌نویس ثبت نشده است.</p>';return;}
    const sorted=S.rows.slice().sort((a,b)=>Number(a.session_number)-Number(b.session_number));
    const styleOptions=S.enrollments.filter(e=>(S.termEnrollmentIds||[]).includes(e.id));
    $('stDraftTable').innerHTML='<table class="st-table"><thead><tr><th>جلسه</th><th>سبک‌ها (اختیاری)</th><th>تاریخ</th><th>ساعت</th><th>مدت</th><th>محل</th><th>مربی</th><th>حذف</th></tr></thead><tbody>'+sorted.map((r,i)=>'<tr><td>'+fa(r.session_number)+'</td><td><select multiple size="3" data-styles="'+r.session_number+'">'+styleOptions.map(e=>'<option value="'+e.id+'" '+((r.enrollment_ids||[]).includes(e.id)?'selected':'')+'>'+esc(e.courses?.name||'سبک')+'</option>').join('')+'</select><small>بدون انتخاب هم مجاز است</small></td><td><input type="date" data-date="'+r.session_number+'" value="'+jalaliInput(localDate(r.starts_at))+'" data-jalali-date></td><td><input type="time" data-time="'+r.session_number+'" value="'+localTime(r.starts_at)+'"></td><td><input type="number" min="15" max="720" step="5" data-duration="'+r.session_number+'" value="'+rowMinutes(r)+'"></td><td><input type="text" maxlength="250" data-venue="'+r.session_number+'" value="'+esc(r.venue||'')+'" placeholder="'+esc(S.term.default_venue||'محل')+'"></td><td><input type="text" maxlength="120" data-coach="'+r.session_number+'" value="'+esc(r.coach_name||'')+'" placeholder="نام مربی"></td><td><button class="st-btn danger" data-del="'+i+'">حذف</button></td></tr>').join('')+'</tbody></table>';
    bindJalaliDates($('stDraftTable'));
    $('stDraftTable').querySelectorAll('[data-styles]').forEach(el=>el.addEventListener('change',()=>{const row=sorted.find(x=>Number(x.session_number)===Number(el.dataset.styles));if(row)row.enrollment_ids=Array.from(el.selectedOptions).map(o=>o.value);}));
    $('stDraftTable').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const r=sorted[Number(b.dataset.del)];S.rows=S.rows.filter(x=>x!==r);drawDraft();}));
  }
  function collectDraftPayload(){
    const seen=new Set();
    return S.rows.map(r=>{
      const n=Number(r.session_number),key=String(n);
      if(!Number.isInteger(n)||n<1||n>1000||seen.has(key))throw Error('شماره جلسات باید مثبت و غیرتکراری باشد.');
      seen.add(key);
      const d=gregorianInput($('stDraftTable').querySelector('[data-date="'+n+'"]')?.value||jalaliInput(localDate(r.starts_at)));
      const t=$('stDraftTable').querySelector('[data-time="'+n+'"]')?.value||localTime(r.starts_at);
      const mins=Number($('stDraftTable').querySelector('[data-duration="'+n+'"]')?.value||rowMinutes(r));
      const venueInput=$('stDraftTable').querySelector('[data-venue="'+n+'"]');
      const coachInput=$('stDraftTable').querySelector('[data-coach="'+n+'"]');
      if(!d||!t||!Number.isInteger(mins)||mins<15||mins>720)throw Error('تاریخ، ساعت یا مدت یکی از جلسات معتبر نیست.');
      const start=localISO(d,t);
      return {enrollment_ids:r.enrollment_ids||[],session_number:n,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:venueInput?venueInput.value.trim():(r.venue||''),coach_name:coachInput?coachInput.value.trim():(r.coach_name||''),notes:r.notes||null};
    });
  }
  function makeWeekly(){
    try{const d=gregorianInput($('stWeeklyDate').value),t=$('stWeeklyTime').value,v=$('stWeeklyVenue').value.trim()||S.term.default_venue||null,n=Number(S.term.total_sessions),mins=Number(S.term.duration_minutes);if(!d||!t)throw Error('تاریخ اولین جلسه و ساعت شروع را وارد کنید.');if(!Number.isInteger(n)||n<1||n>1000)throw Error('تعداد اولیه جلسات معتبر نیست.');
      S.rows=Array.from({length:n},(_,i)=>{const start=localISO(plus7(d,i),t);return {enrollment_ids:[],session_number:i+1,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:v,coach_name:null,notes:null};});drawDraft();say(fa(n)+' جلسه ساخته شد؛ تعداد و مدت هر جلسه قابل ویرایش است و انتخاب سبک اجباری نیست.');
    }catch(e){say(e.message,true);}
  }
  function addManual(){
    try{const ids=Array.from($('stStyle').querySelectorAll('input:checked')).map(o=>o.value),n=Number($('stNumber').value),d=gregorianInput($('stDate').value),t=$('stTime').value,mins=Number($('stSessionDuration').value);if(!d||!t||!Number.isInteger(n)||n<1||n>1000||!Number.isInteger(mins)||mins<15||mins>720)throw Error('شماره جلسه، تاریخ، ساعت و مدت معتبر را وارد کنید. سبک اختیاری است.');
      if(S.rows.some(x=>Number(x.session_number)===n))throw Error('این شماره جلسه قبلاً ثبت شده است.');
      const start=localISO(d,t);S.rows.push({enrollment_ids:ids,session_number:n,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:$('stSessionVenue').value.trim()||S.term.default_venue||null,coach_name:$('stSessionCoach').value.trim()||null,notes:null});
      $('stNumber').value=String(Math.max(...S.rows.map(x=>Number(x.session_number)+1)));drawDraft();say('جلسه اضافه شد؛ سبک و مدت هر جلسه مستقل است.');
    }catch(e){say(e.message,true);}
  }
  async function persistDraft(){
    if(!S.draftId)throw Error('پیش‌نویس فعال وجود ندارد.');
    const payload=collectDraftPayload();if(!payload.length)throw Error('برای ذخیره، حداقل یک جلسه اضافه کنید.');
    const {data,error}=await db().rpc('replace_term_draft_sessions',{p_version_id:S.draftId,p_sessions:payload});if(error)throw error;
    S.term.total_sessions=payload.length;await loadDraftRows();drawDraft();return data;
  }
  async function saveDraft(){
    try{say('در حال ذخیره پیش‌نویس…');const count=await persistDraft();say(fa(count)+' جلسه ذخیره شد. تعداد جلسات از روی برنامه شما ثبت شد؛ سبک‌ها و مدت‌ها مستقل هستند.');}
    catch(e){say(e.message||'ذخیره ناموفق بود.',true);}
  }
  async function publish(){
    try{if(!S.draftId)throw Error('پیش‌نویسی برای انتشار وجود ندارد.');if(!confirm('این برنامه با تعداد و مدت دلخواه شما برای هنرجو منتشر می‌شود. ادامه می‌دهید؟'))return;say('در حال ذخیره و انتشار…');await persistDraft();const {error}=await db().rpc('publish_term_schedule',{p_term_id:S.termId,p_version_id:S.draftId});if(error)throw error;await loadStudent(S.studentId);$('stTerm').value=S.termId;await loadTerm(S.termId);say('برنامه با موفقیت منتشر شد.');
    }catch(e){say(e.message||'انتشار ناموفق بود.',true);}
  }
  async function createDraft(){
    try{say('در حال ساخت پیش‌نویس جدید…');const {error}=await db().rpc('create_term_draft_from_published',{p_term_id:S.termId});if(error)throw error;await loadTerm(S.termId);say('پیش‌نویس جدید ساخته شد؛ نسخه منتشرشده قبلی دست‌نخورده باقی ماند.');}catch(e){say(e.message||'ساخت پیش‌نویس ناموفق بود.',true);}
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
  window.addEventListener('load',()=>{if(!$(TAB))mount();});
})();