(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let students = [];
  let currentStudentId = '';
  let currentTermId = '';
  let mounted = false;
  let groupManagerLoaded = false;
  let selectedGroupId = '';
  let groupMembers = [];

  function authContext() {
    let authorized = false, client = null;
    try { if (typeof gym20OwnerAuthorized !== 'undefined') authorized = !!gym20OwnerAuthorized; } catch (_) {}
    try { if (typeof gym20AdminClient !== 'undefined') client = gym20AdminClient; } catch (_) {}
    authorized = authorized || !!window.gym20OwnerAuthorized;
    client = client || window.gym20AdminClient || null;
    return {authorized, client};
  }
  function db() {
    const auth = authContext();
    if (!auth.authorized || !auth.client) throw new Error('ابتدا با حساب مدیر وارد شوید.');
    return auth.client.schema('gym20');
  }
  function say(message, error = false) {
    const el = $('gym20ExerciseFeedback');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = error ? '#e47777' : '#55c58a';
  }
  function tehranDateKey(value) {
    if (!value) return '';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return parts.year + '-' + parts.month + '-' + parts.day;
  }
  function tehranDayLabel(value) {
    const date = new Date(value);
    const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {timeZone:'Asia/Tehran',weekday:'long'}).format(date);
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    return weekday + ' - ' + parts.year + '/' + parts.month + '/' + parts.day;
  }
  function formatCompletedAt(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
      const day = tehranDayLabel(date);
      const time = new Intl.DateTimeFormat('fa-IR', {timeZone:'Asia/Tehran',hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).format(date);
      return {day, time};
    } catch (_) { return {day:date.toLocaleDateString('fa-IR'), time:date.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}; }
  }
  function renderExerciseStudentOptions(select) {
    const selected = currentStudentId || select.value;
    select.innerHTML = '<option value="">انتخاب هنرجو…</option>' + students.map(s =>
      '<option value="' + esc(s.id) + '">' + esc(s.full_name) + (s.is_active ? '' : ' · غیرفعال') + '</option>'
    ).join('');
    if (selected && students.some(s => String(s.id) === String(selected))) select.value = selected;
    else if (students.length === 1) { currentStudentId = String(students[0].id); select.value = currentStudentId; }
    else select.value = '';
  }
  async function loadExerciseStudents() {
    const select = $('gym20ExerciseStudentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">در حال دریافت فهرست هنرجویان…</option>';
    try {
      const {data, error} = await db().from('students').select('id,full_name,is_active').order('full_name');
      if (error) throw error;
      students = Array.isArray(data) ? data : [];
      if (!students.length && Array.isArray(window.gym20Students) && window.gym20Students.length) students = window.gym20Students;
      renderExerciseStudentOptions(select);
      if (groupManagerLoaded) renderGroupStudentChecklist(groupMembers.map(x=>x.student_id));
      if (select.value) {
        await loadStudentTermsForExercises(select.value);
        await loadStudentExercisesAdmin();
      } else {
        currentStudentId = '';
        $('gym20ExerciseList').innerHTML = '';
        say('');
      }
    } catch (e) {
      students = Array.isArray(window.gym20Students) ? window.gym20Students : [];
      if (students.length) {
        renderExerciseStudentOptions(select);
        say('فهرست هنرجویان از پرونده‌های مدیریت دریافت شد.');
      } else {
        select.innerHTML = '<option value="">دریافت فهرست هنرجویان ناموفق بود</option>';
        say(e.message || 'دریافت فهرست هنرجویان ناموفق بود.', true);
      }
    }
  }
  async function loadStudentTermsForExercises(studentId) {
    const termSelect = $('gym20ExerciseTermSelect');
    if (!termSelect) return;
    currentTermId = '';
    if (!studentId) {
      termSelect.innerHTML = '<option value="">ابتدا هنرجو را انتخاب کنید</option>';
      termSelect.disabled = true;
      return;
    }
    termSelect.innerHTML = '<option value="">در حال دریافت ترم‌ها…</option>';
    termSelect.disabled = true;
    try {
      const {data,error} = await db().from('student_terms')
        .select('id,term_name,start_date,end_date,status,created_at')
        .eq('student_id',studentId).order('created_at',{ascending:false});
      if(error) throw error;
      const terms = data || [];
      termSelect.innerHTML = terms.length ? terms.map(t =>
        '<option value="'+esc(t.id)+'">'+esc(t.term_name)+(t.status==='active'?' · فعال':'')+'</option>'
      ).join('') : '<option value="">ترمی برای این هنرجو ثبت نشده</option>';
      const preferred = terms.find(t=>t.status==='active') || terms[0];
      currentTermId = preferred ? String(preferred.id) : '';
      termSelect.value = currentTermId;
      termSelect.disabled = !terms.length;
      if(!terms.length) say('برای این هنرجو هنوز ترمی ثبت نشده است.',true);
    } catch(e) {
      termSelect.innerHTML = '<option value="">دریافت ترم‌ها ناموفق بود</option>';
      termSelect.disabled = true;
      currentTermId = '';
      say(e.message || 'دریافت ترم‌های هنرجو ناموفق بود.',true);
    }
  }
  async function loadStudentExercisesAdmin() {
    const select = $('gym20ExerciseStudentSelect'), list = $('gym20ExerciseList');
    if (!select || !list) return;
    currentStudentId = select.value;
    if (!currentStudentId) {
      list.innerHTML = '';
      say('');
      return;
    }
    say('در حال دریافت تمرین‌ها…');
    try {
      currentTermId = $('gym20ExerciseTermSelect')?.value || currentTermId;
      if (!currentTermId) {
        list.innerHTML = '<p class="hint">برای این هنرجو ترمی وجود ندارد؛ ابتدا ترم او را ایجاد کنید.</p>';
        say('');
        return;
      }
      const {data, error} = await db().from('student_exercises')
        .select('id,term_id,title,is_completed,completed_at,created_at')
        .eq('student_id', currentStudentId).eq('term_id',currentTermId).order('created_at', {ascending:true});
      if (error) throw error;
      const rows = data || [];
      const today = tehranDateKey(Date.now());
      const openDays = new Set(Array.from(list.querySelectorAll('details[data-exercise-day][open]')).map(node => node.dataset.exerciseDay || ''));
      const currentRows = rows.filter(x => !x.is_completed || !x.completed_at || tehranDateKey(x.completed_at) === today);
      const archivedRows = rows.filter(x => !!x.is_completed && !!x.completed_at && tehranDateKey(x.completed_at) !== today);
      const renderExercise = x => {
        const completed = !!x.is_completed, stamp = completed ? formatCompletedAt(x.completed_at) : null;
        const overdue = !completed && !!x.created_at && tehranDateKey(x.created_at) < today;
        const statusClass = completed ? 'is-completed' : overdue ? 'is-overdue' : 'is-pending';
        const statusLabel = completed ? '✓ انجام‌شده' : overdue ? 'انجام‌نشده' : 'در انتظار انجام';
        return '<article class="gym20-ex-admin-row"><div class="gym20-ex-info"><strong class="gym20-ex-title">' + esc(x.title) + '</strong>' +
          '<span class="gym20-ex-status ' + statusClass + '">' + statusLabel + '</span>' +
          (stamp ? '<small class="gym20-ex-date">' + esc(stamp.day) + '</small><small class="gym20-ex-time">ساعت ' + esc(stamp.time) + '</small>' : '') +
          '</div><div class="gym20-ex-actions">' +
          '<button type="button" data-toggle-exercise="' + esc(x.id) + '" data-completed="' + String(completed) + '">' + (completed ? 'بازگردانی' : '✓ انجام شد') + '</button>' +
          '<button type="button" data-delete-exercise="' + esc(x.id) + '" aria-label="حذف تمرین">🗑️</button></div></article>';
      };
      const groups = new Map();
      archivedRows.forEach(x => {
        const key = tehranDateKey(x.completed_at);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(x);
      });
      const archiveMarkup = Array.from(groups.entries()).sort((a,b)=>b[0].localeCompare(a[0])).map(([day,items]) => {
        items.sort((a,b)=>Date.parse(b.completed_at)-Date.parse(a.completed_at));
        const opened = openDays.has(day) ? ' open' : '';
        return '<details class="gym20-ex-archive-day" data-exercise-day="' + esc(day) + '"' + opened + '><summary>تمرینات من ـ ' + esc(tehranDayLabel(items[0].completed_at)) + ' <span>' + items.length.toLocaleString('fa-IR') + ' تمرین</span></summary><div class="gym20-ex-archive-list">' + items.map(renderExercise).join('') + '</div></details>';
      }).join('');
      list.innerHTML = rows.length
        ? '<div class="gym20-ex-count"><strong>' + currentRows.length.toLocaleString('fa-IR') + ' تمرین جاری</strong><small>مجموع این ترم: ' + rows.length.toLocaleString('fa-IR') + ' تمرین</small></div>' +
          (currentRows.length ? currentRows.map(renderExercise).join('') : '<p class="hint">تمرین جاری برای امروز باقی نمانده است.</p>') +
          (groups.size ? '<details class="gym20-ex-archive" ' + (Array.from(list.querySelectorAll('details.gym20-ex-archive[open]')).length ? 'open' : '') + '><summary>آرشیو تمرینات انجام‌شده <span>' + archivedRows.length.toLocaleString('fa-IR') + ' تمرین</span></summary><div class="gym20-ex-archive-days">' + archiveMarkup + '</div></details>' : '')
        : '<p class="hint">برای این هنرجو هنوز تمرینی ثبت نشده است.</p>';
      say('');
    } catch (e) {
      list.innerHTML = '<p class="hint">دریافت تمرین‌ها ناموفق بود.</p>';
      say(e.message || 'دریافت تمرین‌ها ناموفق بود.', true);
    }
  }
  async function addExercise() {
    const input = $('gym20ExerciseInput'), button = $('gym20ExerciseAdd');
    const title = (input?.value || '').trim();
    if (!currentStudentId) { say('ابتدا هنرجو را انتخاب کنید.', true); $('gym20ExerciseStudentSelect')?.focus(); return; }
    if (!title) { say('عنوان تمرین را وارد کنید.', true); input?.focus(); return; }
    if (title.length > 120) { say('عنوان تمرین حداکثر ۱۲۰ نویسه باشد.', true); return; }
    button.disabled = true;
    try {
      currentTermId = $('gym20ExerciseTermSelect')?.value || currentTermId;
      if (!currentTermId) { say('ابتدا ترم تمرین را انتخاب کنید.',true); return; }
      const {error} = await db().from('student_exercises').insert({student_id:currentStudentId, term_id:currentTermId, title});
      if (error) throw error;
      input.value = '';
      await loadStudentExercisesAdmin();
      say('تمرین با موفقیت اضافه شد ✓');
      try {
        const auth = authContext();
        const {data:pushData, error:pushError} = await auth.client.functions.invoke('student-push-admin', {
          body:{student_id:currentStudentId, message:'امروز وقت قوی‌تر شدنه. آماده‌ای؟'}
        });
        if (pushError) throw pushError;
        if (!pushData?.ok) throw new Error(pushData?.error || 'ارسال اعلان انجام نشد.');
        if (Number(pushData.total || 0) > 0 && Number(pushData.sent || 0) > 0) {
          say('تمرین با موفقیت اضافه شد ✓ · اعلان به ' + Number(pushData.sent).toLocaleString('fa-IR') + ' دستگاه ارسال شد.');
        } else {
          say('تمرین ثبت شد ✓ · برای این هنرجو دستگاه اعلان فعالی پیدا نشد.', true);
        }
      } catch (pushError) {
        say('تمرین ثبت شد ✓ · ارسال اعلان ناموفق بود: ' + (pushError.message || 'خطای اعلان'), true);
      }
    } catch (e) { say(e.message || 'افزودن تمرین ناموفق بود.', true); }
    finally { button.disabled = false; }
  }
  async function toggleExercise(id, completed) {
    if (!currentStudentId) return;
    try {
      const next = !completed;
      const {error} = await db().from('student_exercises').update({
        is_completed:next, completed_at:next ? new Date().toISOString() : null
      }).eq('id',id).eq('student_id',currentStudentId);
      if (error) throw error;
      await loadStudentExercisesAdmin();
      say(next ? 'تمرین انجام‌شده ثبت شد ✓' : 'تمرین به فهرست در انتظار بازگشت.');
    } catch (e) { say(e.message || 'به‌روزرسانی وضعیت تمرین ناموفق بود.', true); }
  }
  async function deleteExercise(id) {
    if (!currentStudentId || !confirm('این تمرین از برنامه هنرجو حذف شود؟')) return;
    try {
      const {error} = await db().from('student_exercises').delete().eq('id',id).eq('student_id',currentStudentId);
      if (error) throw error;
      await loadStudentExercisesAdmin();
      say('تمرین حذف شد.');
    } catch (e) { say(e.message || 'حذف تمرین ناموفق بود.', true); }
  }
  function setExercisePushButtonState(button,active){
    if(!button)return;
    button.dataset.active=active?'1':'0';
    button.textContent=active?'اعلان فعال':'اعلان خاموش';
    button.style.setProperty('border-color',active?'rgba(85,197,138,.75)':'rgba(248,90,105,.72)','important');
    button.style.setProperty('background',active?'rgba(85,197,138,.16)':'rgba(248,90,105,.16)','important');
    button.style.setProperty('color',active?'#55c58a':'#ff7b86','important');
  }
  function exercisePushStatus(message,bad=false){
    const el=$('gym20ExercisePushStatus');if(el){el.textContent=message||'';el.style.color=bad?'#fda4af':'#9aa6b6';}
  }
  async function invokeExercisePush(body){
    const auth=authContext();
    if(!auth.authorized||!auth.client)throw new Error('ابتدا با حساب مدیر وارد شوید.');
    const {data,error}=await auth.client.functions.invoke('student-push',{body});
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.error||'سرویس اعلان پاسخ معتبری نداد.');
    return data;
  }
  function pushKeyBytes(value){
    const base64=String(value||'').replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value||'').length%4)%4);
    const raw=atob(base64),out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }
  async function syncExercisePushStatus(){
    const button=$('gym20ExercisePushToggle');
    if(!button||!authContext().authorized)return;
    if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)){
      button.disabled=true;exercisePushStatus('اعلان گوشی در این مرورگر پشتیبانی نمی‌شود.',true);return;
    }
    try{
      const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
      const subscription=await registration.pushManager.getSubscription();
      if(!subscription){
        setExercisePushButtonState(button,false);
        exercisePushStatus(Notification.permission==='denied'?'اجازه اعلان برای سایت مسدود است. از تنظیمات مرورگر فعالش کن.':'برای دریافت گزارش انجام تمرین، اعلان این گوشی را فعال کن.');
        return;
      }
      const state=await invokeExercisePush({action:'admin-status',endpoint:subscription.endpoint});
      setExercisePushButtonState(button,!!state.active);
      exercisePushStatus(state.active?'اعلان انجام تمرین برای این گوشی فعال است.':'اشتراک اعلان این گوشی هنوز برای مدیر فعال نشده است.');
    }catch(e){
      button.dataset.active='0';button.textContent='اعلان خاموش';
      exercisePushStatus('بررسی وضعیت اعلان ناموفق بود: '+(e.message||'خطای ارتباط'),true);
    }
  }
  async function toggleExercisePush(){
    const button=$('gym20ExercisePushToggle');
    if(!button)return;
    const wasActive=button.dataset.active==='1';
    button.disabled=true;
    const old=wasActive?'اعلان فعال':'اعلان خاموش';
    try{
      const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
      let subscription=await registration.pushManager.getSubscription();
      if(wasActive){
        if(subscription)await invokeExercisePush({action:'admin-unsubscribe',endpoint:subscription.endpoint});
        button.dataset.active='0';button.textContent='اعلان خاموش';
        exercisePushStatus('اعلان انجام تمرین برای این گوشی غیرفعال شد.');
      }else{
        if(!('Notification' in window)||!('PushManager' in window))throw new Error('این مرورگر از اعلان گوشی پشتیبانی نمی‌کند.');
        let permission=Notification.permission;
        if(permission!=='granted')permission=await Notification.requestPermission();
        if(permission!=='granted')throw new Error('اجازه نمایش اعلان داده نشد.');
        const config=await invokeExercisePush({action:'admin-config'});
        if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushKeyBytes(config.public_key)});
        await invokeExercisePush({action:'admin-subscribe',subscription:subscription.toJSON(),user_agent:navigator.userAgent});
        setExercisePushButtonState(button,true);
        const test=await invokeExercisePush({action:'admin-test',endpoint:subscription.endpoint});
        exercisePushStatus(test.sent>0?'اعلان فعال شد؛ پیام آزمایشی هم به این گوشی ارسال شد.':'اشتراک ثبت شد، اما پیام آزمایشی به گوشی نرسید.',test.sent<=0);
      }
    }catch(e){
      setExercisePushButtonState(button,wasActive);
      exercisePushStatus(e.message||'فعال‌سازی اعلان ناموفق بود.',true);
    }finally{button.disabled=false;}
  }

  function renderGroupStudentChecklist(selectedIds=[]) {
    const host=$('gym20ExerciseGroupStudents');
    if(!host)return;
    const selected=new Set((selectedIds||[]).map(String));
    host.innerHTML=students.length?students.map(student=>
      '<label class="gym20-group-student"><input type="checkbox" data-group-student value="'+esc(student.id)+'" '+(selected.has(String(student.id))?'checked':'')+'><span>'+esc(student.full_name)+(student.is_active?'':' · غیرفعال')+'</span></label>'
    ).join(''):'<div class="gym20-group-empty">فهرست هنرجویان هنوز بارگذاری نشده است.</div>';
    const count=$('gym20ExerciseGroupSelectedCount');
    if(count)count.textContent=selected.size.toLocaleString('fa-IR')+' هنرجو انتخاب‌شده';
  }
  function selectedGroupStudentIds(){
    return Array.from(document.querySelectorAll('#gym20ExerciseGroupStudents [data-group-student]:checked')).map(x=>x.value);
  }
  function renderGroupExerciseRows(rows){
    const host=$('gym20ExerciseGroupExercises');
    if(!host)return;
    host.innerHTML=rows.length?rows.map(row=>
      '<div class="gym20-group-exercise-row"><strong>'+esc(row.title)+'</strong><small>'+esc(tehranDayLabel(row.created_at))+'</small></div>'
    ).join(''):'<div class="gym20-group-empty">برای این گروه هنوز تمرینی ثبت نشده است.</div>';
  }
  async function loadSelectedExerciseGroup(){
    const select=$('gym20ExerciseGroupSelect'),summary=$('gym20ExerciseGroupMembersSummary');
    if(!select)return;
    selectedGroupId=select.value||'';
    if(!selectedGroupId){
      groupMembers=[];
      renderGroupStudentChecklist([]);
      if(summary)summary.textContent='ابتدا گروه را انتخاب کنید.';
      renderGroupExerciseRows([]);
      return;
    }
    const [membersResult,exercisesResult]=await Promise.all([
      db().from('exercise_group_members').select('student_id').eq('group_id',selectedGroupId),
      db().from('group_exercises').select('id,title,created_at').eq('group_id',selectedGroupId).order('created_at',{ascending:false})
    ]);
    if(membersResult.error)throw membersResult.error;
    if(exercisesResult.error)throw exercisesResult.error;
    groupMembers=membersResult.data||[];
    renderGroupStudentChecklist(groupMembers.map(x=>x.student_id));
    if(summary)summary.textContent=groupMembers.length.toLocaleString('fa-IR')+' هنرجو در این گروه عضو هستند.';
    renderGroupExerciseRows(exercisesResult.data||[]);
  }
  async function loadExerciseGroups(preferredId=''){
    const select=$('gym20ExerciseGroupSelect');
    if(!select)return;
    select.innerHTML='<option value="">در حال دریافت گروه‌ها…</option>';
    const {data,error}=await db().from('exercise_groups').select('id,name').order('created_at',{ascending:false});
    if(error)throw error;
    const groups=data||[];
    select.innerHTML='<option value=""></option>'+groups.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('');
    const desired=preferredId||selectedGroupId;
    selectedGroupId=groups.some(g=>String(g.id)===String(desired))?String(desired):(groups[0]?.id||'');
    select.value=selectedGroupId;
    await loadSelectedExerciseGroup();
  }
  async function createExerciseGroup(){
    const name=($('gym20ExerciseGroupName')?.value||'').trim();
    const memberIds=selectedGroupStudentIds();
    if(!name){say('نام گروه را وارد کنید.',true);$('gym20ExerciseGroupName')?.focus();return;}
    if(name.length>80){say('نام گروه حداکثر ۸۰ نویسه باشد.',true);return;}
    if(!memberIds.length){say('حداقل یک هنرجو برای گروه انتخاب کنید.',true);return;}
    const button=$('gym20ExerciseGroupCreate');button.disabled=true;
    try{
      const auth=authContext();
      const {data:userData,error:userError}=await auth.client.auth.getUser();
      if(userError||!userData?.user)throw userError||new Error('نشست مدیر معتبر نیست.');
      const {data:group,error}=await db().from('exercise_groups').insert({name,created_by:userData.user.id}).select('id,name').single();
      if(error)throw error;
      const {error:membersError}=await db().from('exercise_group_members').insert(memberIds.map(student_id=>({group_id:group.id,student_id})));
      if(membersError){
        await db().from('exercise_groups').delete().eq('id',group.id);
        throw membersError;
      }
      $('gym20ExerciseGroupName').value='';
      groupManagerLoaded=true;
      await loadExerciseGroups(group.id);
      say('گروه «'+group.name+'» با '+memberIds.length.toLocaleString('fa-IR')+' هنرجو ساخته شد ✓');
    }catch(e){say(e.message||'ساخت گروه ناموفق بود.',true);}
    finally{button.disabled=false;}
  }
  let groupMembersSaveInFlight=false;
  async function saveExerciseGroupMembers(){
    if(!selectedGroupId||groupMembersSaveInFlight)return;
    groupMembersSaveInFlight=true;
    try{
      let changed=false;
      while(selectedGroupId){
        const next=selectedGroupStudentIds(),previous=groupMembers.map(x=>String(x.student_id));
        if(!next.length){say('گروه باید حداقل یک هنرجو داشته باشد.',true);return;}
        const added=next.filter(id=>!previous.includes(String(id)));
        const removed=previous.filter(id=>!next.includes(String(id)));
        if(!added.length&&!removed.length)break;
        if(removed.length){
          const {error}=await db().from('exercise_group_members').delete().eq('group_id',selectedGroupId).in('student_id',removed);
          if(error)throw error;
        }
        if(added.length){
          const {error}=await db().from('exercise_group_members').insert(added.map(student_id=>({group_id:selectedGroupId,student_id})));
          if(error)throw error;
        }
        changed=true;
        const {data,error}=await db().from('exercise_group_members').select('student_id').eq('group_id',selectedGroupId);
        if(error)throw error;
        // Keep the live checkbox selection intact while coalescing rapid taps.
        groupMembers=data||[];
        const summary=$('gym20ExerciseGroupMembersSummary');
        if(summary)summary.textContent=groupMembers.length.toLocaleString('fa-IR')+' هنرجو در این گروه عضو هستند.';
      }
      if(changed)say('اعضای گروه ذخیره شدند ✓');
    }catch(e){say(e.message||'ذخیره خودکار اعضای گروه ناموفق بود.',true);}
    finally{groupMembersSaveInFlight=false;}
  }
  async function addGroupExercise(){
    const title=($('gym20ExerciseGroupInput')?.value||'').trim();
    if(!selectedGroupId){say('ابتدا گروه را انتخاب کنید.',true);return;}
    if(!title){say('عنوان تمرین گروهی را وارد کنید.',true);$('gym20ExerciseGroupInput')?.focus();return;}
    if(title.length>120){say('عنوان تمرین حداکثر ۱۲۰ نویسه باشد.',true);return;}
    const button=$('gym20ExerciseGroupAdd');button.disabled=true;
    try{
      const {error}=await db().from('group_exercises').insert({group_id:selectedGroupId,title});
      if(error)throw error;
      $('gym20ExerciseGroupInput').value='';
      await loadSelectedExerciseGroup();
      const message='تمرین گروهی «'+title+'» برای گروه شما ثبت شد. آماده‌ای؟ 💪';
      const results=await Promise.allSettled(groupMembers.map(member=>authContext().client.functions.invoke('student-push-admin',{body:{student_id:member.student_id,message}})));
      const sent=results.filter(x=>x.status==='fulfilled'&&!x.value.error&&x.value.data?.ok&&Number(x.value.data.sent)>0).length;
      say('تمرین گروهی ثبت شد ✓ · اعلان برای '+sent.toLocaleString('fa-IR')+' نفر ارسال شد.');
    }catch(e){say(e.message||'افزودن تمرین گروهی ناموفق بود.',true);}
    finally{button.disabled=false;}
  }
  async function toggleGroupManager(){
    const panel=$('gym20ExerciseGroupPanel'),button=$('gym20ExerciseGroupToggle');
    if(!panel||!button)return;
    const open=panel.hidden;
    panel.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    if(open&&!groupManagerLoaded){
      try{groupManagerLoaded=true;renderGroupStudentChecklist([]);await loadExerciseGroups();}
      catch(e){groupManagerLoaded=false;say(e.message||'دریافت گروه‌ها ناموفق بود.',true);}
    }
  }

  function mount() {
    if (mounted) return;
    const embedded = !!document.querySelector('#adminModal .admin-tabs');
    const panel = embedded ? $('exercisesTab') : $('view-exercises');
    const select = $('gym20ExerciseStudentSelect'), add = $('gym20ExerciseAdd');
    const input = $('gym20ExerciseInput'), list = $('gym20ExerciseList');
    if (!panel || !select || !add || !input || !list) {
      console.error('[GYM20] Canonical exercise panel or controls are missing.');
      return;
    }
    mounted = true;
    const pushBar=document.createElement('div');
    pushBar.id='gym20ExercisePushBar';
    pushBar.innerHTML='<button type="button" id="gym20ExercisePushToggle" aria-live="polite" data-active="0">اعلان خاموش</button>';
    const pushHost=embedded?$('gym20ExercisesTab'):panel;
    const pushHeading=pushHost?.querySelector('.admin-section-subhead');
    if(pushHeading){
      pushHeading.classList.add('gym20-exercise-heading-row');
      pushHeading.appendChild(pushBar);
    }else pushHost?.prepend(pushBar);
    const pushStyle=document.createElement('style');
    pushStyle.id='gym20ExercisePushStyle';
    pushStyle.textContent='.gym20-exercise-heading-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;flex-wrap:wrap!important;min-width:0}.gym20-exercise-heading-row>*{min-width:0}#gym20ExercisePushBar{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin:0;padding:0;border:0;background:transparent;min-width:0;flex:0 0 auto}#gym20ExercisePushBar button{box-sizing:border-box;min-height:23px;height:23px;padding:0 7px;border:1px solid rgba(248,90,105,.58);border-radius:6px;background:rgba(248,90,105,.12);color:#ff7b86;font:800 8px Vazirmatn,sans-serif;white-space:nowrap}#gym20ExercisePushBar button[data-active="0"]{border-color:rgba(248,90,105,.58);background:rgba(248,90,105,.12);color:#ff7b86}#gym20ExercisePushBar button[data-active="1"]{border-color:rgba(85,197,138,.55);background:rgba(85,197,138,.10);color:#55c58a}#gym20ExercisePushBar button:disabled{opacity:.65}@media(max-width:420px){#gym20ExercisePushBar button{padding:0 6px;font-size:7px;min-height:22px;height:22px}.gym20-exercise-heading-row{gap:5px!important}}';
    document.head.appendChild(pushStyle);
    const groupToggle=document.createElement('button');
    groupToggle.type='button';groupToggle.id='gym20ExerciseGroupToggle';groupToggle.className='gym20-group-toggle';
    groupToggle.setAttribute('aria-expanded','false');groupToggle.textContent='👥 تمرین گروهی';
    const groupPanel=document.createElement('div');
    groupPanel.id='gym20ExerciseGroupPanel';groupPanel.className='gym20-group-panel';groupPanel.hidden=true;
    groupPanel.innerHTML='<div class="gym20-group-field"><input id="gym20ExerciseGroupName" maxlength="80" aria-label="نام گروه جدید" placeholder="نام گروه جدید"></div><div class="gym20-group-field"><button type="button" id="gym20ExerciseGroupMembersToggle" class="gym20-group-members-toggle" aria-expanded="false">اعضا <span id="gym20ExerciseGroupSelectedCount">۰ هنرجو انتخاب‌شده</span> <span aria-hidden="true">⌄</span></button><div id="gym20ExerciseGroupStudentsWrap" hidden><div id="gym20ExerciseGroupStudents" class="gym20-group-students"></div></div><button type="button" id="gym20ExerciseGroupCreate" class="gym20-group-action">ثبت گروه</button></div><div class="gym20-group-divider"></div><div class="gym20-group-field"><label for="gym20ExerciseGroupSelect">گروه‌های ثبت‌شده</label><select id="gym20ExerciseGroupSelect"><option value="">انتخاب گروه…</option></select><small id="gym20ExerciseGroupMembersSummary" class="gym20-group-summary">ابتدا گروه را انتخاب کنید.</small></div><div class="gym20-group-field"><label for="gym20ExerciseGroupInput">عنوان تمرین گروهی</label><input id="gym20ExerciseGroupInput" maxlength="120" placeholder="مثلاً Push up 30"></div><button type="button" id="gym20ExerciseGroupAdd" class="gym20-group-action">＋ افزودن تمرین به همه اعضای گروه</button><div id="gym20ExerciseGroupExercises" class="gym20-group-exercises"></div>';

    // Keep the notification header, group tools, and individual tools in three
    // distinct cards so their controls never visually blend together.
    const exerciseHost=embedded?$('gym20ExercisesTab'):panel;
    const exerciseCardsStyle=document.createElement('style');
    exerciseCardsStyle.id='gym20ExerciseCardsStyle';
    exerciseCardsStyle.textContent='.gym20-exercise-card{--border:rgba(148,163,184,.20);--surface:#191c23;--surface-card:#232732;--text-primary:#f8fafc;--text-secondary:#94a3b8;--neon-blue:#e2e8f0;--neon-shadow:0 0 12px rgba(226,232,240,.15);--btn-active:linear-gradient(135deg,#cbd5e1,#64748b);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;min-width:0;margin:0 0 10px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-md,10px);background:var(--surface);box-shadow:0 5px 16px rgba(0,0,0,.10);color:var(--text-primary)}.gym20-exercise-card-title{margin:0;color:#e2e8f0;font:800 10px Vazirmatn,sans-serif;line-height:1.7}.gym20-exercise-notify-card{flex-direction:row;align-items:center;justify-content:space-between;gap:8px}.gym20-exercise-notify-card .admin-section-subhead{flex:1;min-width:0;margin:0!important}.gym20-exercise-group-card .gym20-group-toggle,.gym20-exercise-individual-card .gym20-group-toggle{box-sizing:border-box;display:flex;width:100%;height:32px;min-height:32px;margin:0;align-self:stretch;padding:0 10px;line-height:1.2}.gym20-exercise-individual-card .admin-grid-2{margin:0}.gym20-exercise-individual-card #gym20ExerciseList{margin-top:2px}.gym20-exercise-individual-card .gym20-group-panel{border:0!important;box-shadow:none!important}';
    document.head.appendChild(exerciseCardsStyle);
    const notifyCard=document.createElement('section');
    notifyCard.className='gym20-exercise-card gym20-exercise-notify-card';
    const groupCard=document.createElement('section');
    groupCard.className='gym20-exercise-card gym20-exercise-group-card';
    const individualCard=document.createElement('section');
    individualCard.className='gym20-exercise-card gym20-exercise-individual-card';
    const individualToggle=document.createElement('button');
    individualToggle.type='button';individualToggle.id='gym20ExerciseIndividualToggle';individualToggle.className='gym20-group-toggle';
    individualToggle.setAttribute('aria-expanded','false');individualToggle.textContent='🥋 تمرین انفرادی هنرجو';
    const individualPanel=document.createElement('div');
    individualPanel.id='gym20ExerciseIndividualPanel';individualPanel.className='gym20-group-panel';individualPanel.hidden=true;
    const individualGrid=exerciseHost.querySelector('.admin-grid-2,.field-grid');
    const feedback=$('gym20ExerciseFeedback');
    if(pushHeading)notifyCard.appendChild(pushHeading);
    notifyCard.appendChild(pushBar);
    groupCard.append(groupToggle,groupPanel);
    individualCard.append(individualToggle,individualPanel);
    if(individualGrid)individualPanel.appendChild(individualGrid);
    if(add)individualPanel.appendChild(add);
    if(feedback)individualPanel.appendChild(feedback);
    if(list)individualPanel.appendChild(list);
    exerciseHost.prepend(individualCard);
    exerciseHost.prepend(groupCard);
    exerciseHost.prepend(notifyCard);
    groupToggle.addEventListener('click',toggleGroupManager);
    individualToggle.addEventListener('click',()=>{
      const open=individualPanel.hidden;
      individualPanel.hidden=!open;
      individualToggle.setAttribute('aria-expanded',String(open));
    });
    groupPanel.querySelector('#gym20ExerciseGroupMembersToggle').addEventListener('click',()=>{
      const button=$('gym20ExerciseGroupMembersToggle'),wrap=$('gym20ExerciseGroupStudentsWrap');
      const open=wrap.hidden;wrap.hidden=!open;button.setAttribute('aria-expanded',String(open));
      button.querySelector('[aria-hidden="true"]').textContent=open?'⌃':'⌄';
    });
    groupPanel.querySelector('#gym20ExerciseGroupStudents').addEventListener('change',()=>{
      const count=selectedGroupStudentIds().length;
      $('gym20ExerciseGroupSelectedCount').textContent=count.toLocaleString('fa-IR')+' هنرجو انتخاب‌شده';
      // New group members are saved together by «ثبت گروه».
      // Existing group membership changes are persisted immediately.
      if(selectedGroupId&&!$('gym20ExerciseGroupName').value.trim())saveExerciseGroupMembers();
    });
    groupPanel.querySelector('#gym20ExerciseGroupCreate').addEventListener('click',createExerciseGroup);
    groupPanel.querySelector('#gym20ExerciseGroupAdd').addEventListener('click',addGroupExercise);
    groupPanel.querySelector('#gym20ExerciseGroupSelect').addEventListener('change',()=>loadSelectedExerciseGroup().catch(e=>say(e.message||'دریافت گروه ناموفق بود.',true)));
    const groupStyle=document.createElement('style');
    groupStyle.id='gym20ExerciseGroupStyle';
    groupStyle.textContent='.gym20-group-members-toggle{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:29px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--radius-sm,6px);background:var(--surface-card);color:var(--neon-blue);font:800 9px Vazirmatn,sans-serif;text-align:right;cursor:pointer;transition:.2s}.gym20-group-members-toggle:hover,.gym20-group-members-toggle[aria-expanded=true]{border-color:var(--neon-blue);box-shadow:0 0 8px var(--neon-shadow)}.gym20-group-members-toggle span{color:var(--text-secondary);font-size:8px}.gym20-group-toggle{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:27px;height:27px;margin:0 0 7px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm,6px);background:var(--surface-card);color:var(--text-primary);font:800 9px Vazirmatn,sans-serif;cursor:pointer;transition:all .2s ease}.gym20-group-toggle[aria-expanded=true]{background:var(--btn-active);color:var(--text-primary);border-color:transparent;box-shadow:var(--neon-shadow)}.gym20-group-toggle:active,.gym20-group-action:active{transform:scale(.98)}.gym20-group-toggle:focus-visible,.gym20-group-action:focus-visible,.gym20-group-members-toggle:focus-visible{outline:2px solid var(--neon-blue);outline-offset:2px}.gym20-group-panel{display:flex;flex-direction:column;gap:7px;margin:0;padding:9px;border:1px solid var(--border);border-radius:var(--radius-md,10px);background:var(--surface);box-shadow:inset 0 1px 0 rgba(255,255,255,.025);color:var(--text-primary)}#gym20ExerciseIndividualPanel{border:0!important;box-shadow:none!important}.gym20-group-panel[hidden]{display:none!important}.gym20-group-field{display:flex;flex-direction:column;gap:4px}.gym20-group-field label{color:#cbd5e1;font-size:9px;font-weight:800}.gym20-group-field input,.gym20-group-field select{box-sizing:border-box;width:100%;height:30px;min-height:30px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--radius-sm,6px);background:var(--surface);color:var(--text-primary);font:10px Vazirmatn,sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}.gym20-group-field input:focus,.gym20-group-field select:focus{border-color:var(--neon-blue);box-shadow:0 0 8px var(--neon-shadow)}.gym20-group-field input::placeholder{color:var(--text-secondary);opacity:.85}#gym20ExerciseGroupStudentsWrap[hidden]{display:none!important}#gym20ExerciseGroupStudentsWrap{padding-top:5px}.gym20-group-students{display:flex;flex-flow:row nowrap;align-items:center;gap:5px;width:100%;max-height:48px;overflow-x:auto;overflow-y:hidden;padding:5px;border:1px solid var(--border);border-radius:var(--radius-sm,6px);background:var(--surface);direction:rtl;touch-action:pan-x;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.38) transparent;-webkit-overflow-scrolling:touch}.gym20-group-students::-webkit-scrollbar{height:3px}.gym20-group-students::-webkit-scrollbar-track{background:transparent}.gym20-group-students::-webkit-scrollbar-thumb{background:rgba(148,163,184,.38);border-radius:8px}.gym20-group-student{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;min-width:max-content;max-width:190px;padding:5px 8px;border:1px solid transparent;border-radius:6px;background:var(--surface-card);color:var(--text-primary);font-size:9px;cursor:pointer;white-space:nowrap}.gym20-group-student:has(input:checked){border-color:var(--neon-blue);color:var(--neon-blue);background:color-mix(in srgb,var(--neon-blue) 9%,var(--surface-card))}.gym20-group-student input{width:13px;height:13px;flex:0 0 13px;margin:0;accent-color:var(--neon-blue)}.gym20-group-student span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gym20-group-action{align-self:flex-start;min-height:26px;height:26px;padding:0 9px;border:1px solid transparent;border-radius:var(--radius-sm,6px);background:var(--btn-active);color:var(--text-primary);font:800 8px Vazirmatn,sans-serif;cursor:pointer;box-shadow:var(--neon-shadow);transition:all .2s ease}.gym20-group-field #gym20ExerciseGroupCreate{align-self:center;margin-top:2px}.gym20-group-action.secondary{background:var(--surface);border-color:var(--border);color:var(--text-primary);box-shadow:none}.gym20-group-action:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}[data-color-theme=stealth] .gym20-group-toggle[aria-expanded=true],[data-color-theme=stealth] .gym20-group-action,[data-color-theme=noctech] .gym20-group-toggle[aria-expanded=true],[data-color-theme=noctech] .gym20-group-action,[data-color-theme=bumblebee] .gym20-group-toggle[aria-expanded=true],[data-color-theme=bumblebee] .gym20-group-action{color:#000;font-weight:800}.gym20-group-divider{height:1px;background:var(--border);margin:3px 0}.gym20-group-summary,.gym20-group-empty{color:var(--text-secondary);font-size:8px}.gym20-group-exercises{display:flex;flex-direction:column;gap:4px}.gym20-group-exercise-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 7px;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text-primary)}.gym20-group-exercise-row strong{font-size:9px;color:#cbd5e1}.gym20-group-exercise-row small{font-size:8px;color:var(--text-secondary)}.gym20-exercise-group-card .gym20-group-panel{border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important}.gym20-exercise-group-card .gym20-group-toggle,.gym20-exercise-group-card .gym20-group-members-toggle{border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text-primary)!important;padding-left:0!important;padding-right:0!important}.gym20-exercise-group-card .gym20-group-toggle[aria-expanded=true],.gym20-exercise-group-card .gym20-group-members-toggle[aria-expanded=true]{background:transparent!important;border:0!important;box-shadow:none!important;color:#cbd5e1!important}.gym20-exercise-group-card .gym20-group-action{border:0!important;border-radius:0!important;background:transparent!important;color:#e2e8f0!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}.gym20-exercise-group-card .gym20-group-field input,.gym20-exercise-group-card .gym20-group-field select{background:transparent!important;border:0!important;border-bottom:1px solid rgba(148,163,184,.20)!important;border-radius:0!important;color:var(--text-primary)!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}.gym20-exercise-group-card .gym20-group-field input:focus,.gym20-exercise-group-card .gym20-group-field select:focus{border-bottom-color:rgba(226,232,240,.48)!important;box-shadow:none!important}.gym20-exercise-group-card .gym20-group-students{border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:3px 0!important}.gym20-exercise-group-card .gym20-group-student,.gym20-exercise-group-card .gym20-group-student:has(input:checked){border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text-primary)!important;padding-left:0!important;padding-right:0!important}.gym20-exercise-group-card .gym20-group-student:has(input:checked){color:#e2e8f0!important}.gym20-exercise-group-card .gym20-group-student input{accent-color:#cbd5e1}.gym20-exercise-group-card .gym20-group-divider{background:rgba(148,163,184,.16)!important}@media(max-width:420px){.gym20-group-students{grid-template-columns:repeat(2,minmax(0,1fr))}}.gym20-exercise-group-card #gym20ExerciseGroupMembersToggle{min-height:36px!important;padding:7px 11px!important;border:1px solid rgba(148,163,184,.24)!important;border-radius:10px!important;background:linear-gradient(145deg,#232732,#191c23)!important;color:#f8fafc!important;box-shadow:0 4px 12px rgba(0,0,0,.16)!important;font-size:10px!important}.gym20-exercise-group-card #gym20ExerciseGroupMembersToggle[aria-expanded=true]{border-color:rgba(226,232,240,.48)!important;background:#232732!important;box-shadow:0 0 0 2px rgba(226,232,240,.06)!important}.gym20-exercise-group-card #gym20ExerciseGroupMembersToggle span{color:#94a3b8!important;font-size:9px!important;font-weight:500!important}.gym20-exercise-group-card #gym20ExerciseGroupStudentsWrap{margin-top:5px!important;padding:8px!important;border:1px solid rgba(148,163,184,.16)!important;border-radius:11px!important;background:rgba(15,17,21,.82)!important}.gym20-exercise-group-card #gym20ExerciseGroupStudents{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;max-height:176px!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 2px 0 0!important;border:0!important;border-radius:0!important;background:transparent!important;scrollbar-width:thin!important;scrollbar-color:rgba(148,163,184,.42) transparent!important;overscroll-behavior:contain!important}.gym20-exercise-group-card #gym20ExerciseGroupStudents::-webkit-scrollbar{width:4px!important}.gym20-exercise-group-card #gym20ExerciseGroupStudents::-webkit-scrollbar-track{background:transparent!important}.gym20-exercise-group-card #gym20ExerciseGroupStudents::-webkit-scrollbar-thumb{background:rgba(148,163,184,.38)!important;border-radius:8px!important}.gym20-exercise-group-card .gym20-group-student,.gym20-exercise-group-card .gym20-group-student:has(input:checked){display:flex!important;align-items:center!important;gap:7px!important;min-height:35px!important;padding:6px 8px!important;border:1px solid rgba(148,163,184,.14)!important;border-radius:8px!important;background:#191c23!important;color:#cbd5e1!important;box-shadow:none!important;font-size:9px!important;transition:background .15s ease,border-color .15s ease!important}.gym20-exercise-group-card .gym20-group-student:has(input:checked){border-color:rgba(226,232,240,.42)!important;background:rgba(100,116,139,.22)!important;color:#f8fafc!important}.gym20-exercise-group-card .gym20-group-student input{appearance:none!important;-webkit-appearance:none!important;position:relative!important;display:grid!important;place-items:center!important;width:14px!important;height:14px!important;flex:0 0 14px!important;margin:0!important;border:1px solid rgba(148,163,184,.55)!important;border-radius:4px!important;background:#0f1115!important;accent-color:transparent!important;cursor:pointer!important}.gym20-exercise-group-card .gym20-group-student input:checked{border-color:#cbd5e1!important;background:#64748b!important}.gym20-exercise-group-card .gym20-group-student input:checked:after{content:"";width:6px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}.gym20-exercise-group-card .gym20-group-student input:focus-visible{outline:2px solid rgba(226,232,240,.5)!important;outline-offset:2px!important}.gym20-exercise-group-card .gym20-group-student span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.gym20-exercise-group-card #gym20ExerciseGroupStudentsWrap[hidden]{display:none!important}';
    document.head.appendChild(groupStyle);
    const style = document.createElement('style');
    style.id = 'gym20ExerciseCompactStyle';
    style.textContent = `
      :is(#gym20ExercisesTab,.gym20-exercises-panel) .hint{font-size:9px;line-height:1.5;margin:4px 0 7px}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) .admin-grid-2{gap:6px;margin-bottom:6px}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) :is(.admin-input-group,.field) label[for="gym20ExerciseStudentSelect"]{display:block!important;margin:0 0 4px!important;color:var(--neon-blue)!important;font-size:9px!important;font-weight:800!important;line-height:1.4!important}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseStudentSelect,
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseInput{min-height:30px!important;height:32px!important;padding:4px 8px!important;font-size:10px!important}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseAdd{min-height:26px!important;height:26px!important;padding:0 10px!important;font-size:9px!important;margin:2px 0 4px}
      #gym20ExerciseFeedback{font-size:9px!important;line-height:1.5;margin:3px 0 6px}
      #gym20ExerciseList{display:flex;flex-direction:column;gap:5px;margin-top:5px}
      #gym20ExerciseList .gym20-ex-count{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid rgba(226,232,240,.2);border-radius:8px;background:rgba(226,232,240,.055)}
      #gym20ExerciseList .gym20-ex-count strong{font-size:9px;color:#e2e8f0}
      #gym20ExerciseList .gym20-ex-count small{font-size:8px;color:var(--text-secondary,#aab0b9)}
      #gym20ExerciseList .gym20-ex-archive{margin-top:5px;border:1px solid rgba(226,232,240,.2);border-radius:9px;background:rgba(255,255,255,.018);overflow:hidden}
      #gym20ExerciseList .gym20-ex-archive>summary,#gym20ExerciseList .gym20-ex-archive-day>summary{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;padding:6px 9px;cursor:pointer;list-style:none;color:#e2e8f0;font-size:9px;font-weight:800}
      #gym20ExerciseList summary::-webkit-details-marker{display:none}
      #gym20ExerciseList .gym20-ex-archive summary span{font-size:8px;color:var(--text-secondary,#aab0b9);font-weight:600}
      #gym20ExerciseList .gym20-ex-archive-days{display:flex;flex-direction:column;gap:5px;padding:0 6px 6px}
      #gym20ExerciseList .gym20-ex-archive-day{border:1px solid rgba(255,255,255,.07);border-radius:7px;background:rgba(0,0,0,.12);overflow:hidden}
      #gym20ExerciseList .gym20-ex-archive-day>summary{color:#d7dce4;font-size:8px}
      #gym20ExerciseList .gym20-ex-archive-list{display:flex;flex-direction:column;gap:5px;padding:0 5px 5px}
      #gym20ExerciseList .gym20-ex-admin-row{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px!important;margin:0!important;border:1px solid rgba(148,163,184,.20);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.012));min-width:0}
      #gym20ExerciseList .gym20-ex-info{display:flex;flex:1 1 auto;min-width:0;flex-direction:column;align-items:flex-start;gap:2px}
      #gym20ExerciseList .gym20-ex-title{font-size:10px!important;line-height:1.5;color:var(--text-primary,#eee);font-weight:800;overflow-wrap:anywhere}
      #gym20ExerciseList .gym20-ex-status{font-size:8px;line-height:1.45;font-weight:700}
      #gym20ExerciseList .gym20-ex-status.is-completed{color:#55c58a}
      #gym20ExerciseList .gym20-ex-status.is-pending{color:#eab308}
      #gym20ExerciseList .gym20-ex-status.is-overdue{color:#ef4444}
      #gym20ExerciseList .gym20-ex-date,#gym20ExerciseList .gym20-ex-time{display:block;font-size:8px;line-height:1.5;color:var(--text-secondary,#aab0b9);font-weight:500}
      #gym20ExerciseList .gym20-ex-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:0 0 auto}
      #gym20ExerciseList .gym20-ex-actions button{box-sizing:border-box;min-height:23px!important;height:23px!important;padding:0 6px!important;margin:0!important;border-radius:5px!important;font-size:8px!important;line-height:1!important;white-space:nowrap}
      #gym20ExerciseList .gym20-ex-actions button[data-delete-exercise]{width:24px;padding:0!important}
      @media(max-width:480px){#gym20ExerciseList .gym20-ex-admin-row{gap:5px;padding:6px!important}#gym20ExerciseList .gym20-ex-title{font-size:9px!important}#gym20ExerciseList .gym20-ex-actions{gap:3px}#gym20ExerciseList .gym20-ex-actions button{font-size:7px!important;padding:0 5px!important}}
    `;
    document.head.appendChild(style);
    window.loadExerciseStudents = loadExerciseStudents;
    window.loadStudentExercisesAdmin = loadStudentExercisesAdmin;
    window.gym20ExerciseTabReady = true;
    const termSelect = $('gym20ExerciseTermSelect');
    select.addEventListener('change', async () => {
      currentStudentId = select.value;
      currentTermId = '';
      if (!currentStudentId) {
        if (termSelect) { termSelect.innerHTML = '<option value="">ابتدا هنرجو را انتخاب کنید</option>'; termSelect.disabled = true; }
        if (list) list.innerHTML = '';
        say('');
        return;
      }
      await loadStudentTermsForExercises(currentStudentId);
      await loadStudentExercisesAdmin();
    });
    termSelect?.addEventListener('change', () => {
      currentTermId = termSelect.value;
      loadStudentExercisesAdmin();
    });
    add.type = 'button';
    add.addEventListener('click', addExercise);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); addExercise(); }
    });
    list.addEventListener('click', event => {
      const toggle = event.target.closest('[data-toggle-exercise]');
      if (toggle) { toggleExercise(toggle.dataset.toggleExercise, toggle.dataset.completed === 'true'); return; }
      const button = event.target.closest('[data-delete-exercise]');
      if (button) deleteExercise(button.dataset.deleteExercise);
    });
    $('gym20ExercisePushToggle').addEventListener('click',toggleExercisePush);
    window.addEventListener('gym20:owner-authorized', () => {
      if (authContext().authorized && panel.classList.contains('active')) { loadExerciseStudents(); syncExercisePushStatus(); }
    });
    window.addEventListener('gym20:students-loaded', () => {
      if (authContext().authorized && panel.classList.contains('active')) loadExerciseStudents();
    });
    window.addEventListener('gym20:exercise-tab-opened', () => {
      if (authContext().authorized) { loadExerciseStudents(); syncExercisePushStatus(); }
    });
    if (authContext().authorized && panel.classList.contains('active')) { loadExerciseStudents(); syncExercisePushStatus(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();