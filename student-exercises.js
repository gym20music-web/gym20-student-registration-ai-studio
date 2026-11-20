(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let students = [];
  let currentStudentId = '';
  let mounted = false;

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
  function formatCompletedAt(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
      const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year:'numeric', month:'2-digit', day:'2-digit'}).format(date);
      const time = new Intl.DateTimeFormat('fa-IR', {hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).format(date);
      return {day, time};
    } catch (_) { return {day:date.toLocaleDateString('fa-IR'), time:date.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}; }
  }
  async function loadExerciseStudents() {
    const select = $('gym20ExerciseStudentSelect');
    if (!select) return;
    try {
      select.innerHTML = '<option value=""></option>';
      const {data, error} = await db().from('students').select('id,full_name,is_active').order('full_name');
      if (error) throw error;
      students = data || [];
      select.innerHTML = '<option value=""></option>' + students.map(s =>
        '<option value="' + esc(s.id) + '">' + esc(s.full_name) + (s.is_active ? '' : ' · غیرفعال') + '</option>'
      ).join('');
      if (currentStudentId && students.some(s => s.id === currentStudentId)) select.value = currentStudentId;
      else if (students.length === 1) { currentStudentId = students[0].id; select.value = currentStudentId; }
      if (select.value) await loadStudentExercisesAdmin();
      else {
        currentStudentId = '';
        $('gym20ExerciseList').innerHTML = '<p class="hint">برای نمایش تمرین‌ها، یک هنرجو انتخاب کنید.</p>';
        say(students.length ? 'هنرجو را برای مشاهده یا ثبت تمرین انتخاب کنید.' : 'هنوز هنرجویی ثبت نشده است.');
      }
    } catch (e) {
      select.innerHTML = '<option value="">دریافت فهرست هنرجویان ناموفق بود</option>';
      say(e.message || 'دریافت فهرست هنرجویان ناموفق بود.', true);
    }
  }
  async function loadStudentExercisesAdmin() {
    const select = $('gym20ExerciseStudentSelect'), list = $('gym20ExerciseList');
    if (!select || !list) return;
    currentStudentId = select.value;
    if (!currentStudentId) {
      list.innerHTML = '<p class="hint">برای نمایش تمرین‌ها، یک هنرجو انتخاب کنید.</p>';
      say('');
      return;
    }
    say('در حال دریافت تمرین‌ها…');
    try {
      const {data, error} = await db().from('student_exercises')
        .select('id,title,is_completed,completed_at,created_at')
        .eq('student_id', currentStudentId).order('created_at', {ascending:true});
      if (error) throw error;
      const rows = data || [];
      list.innerHTML = rows.length ? rows.map(x => {
        const completed = !!x.is_completed, stamp = completed ? formatCompletedAt(x.completed_at) : null;
        return '<article class="gym20-ex-admin-row"><div class="gym20-ex-info"><strong class="gym20-ex-title">' + esc(x.title) + '</strong>' +
          '<span class="gym20-ex-status ' + (completed ? 'is-completed' : 'is-pending') + '">' +
          (completed ? '✓ انجام‌شده' : 'در انتظار انجام') + '</span>' +
          (stamp ? '<small class="gym20-ex-date">' + esc(stamp.day) + '</small><small class="gym20-ex-time">ساعت ' + esc(stamp.time) + '</small>' : '') +
          '</div><div class="gym20-ex-actions">' +
          '<button type="button" data-toggle-exercise="' + esc(x.id) + '" data-completed="' + String(completed) + '">' + (completed ? 'بازگردانی' : '✓ انجام شد') + '</button>' +
          '<button type="button" data-delete-exercise="' + esc(x.id) + '" aria-label="حذف تمرین">🗑️</button></div></article>';
      }).join('') : '<p class="hint">برای این هنرجو هنوز تمرینی ثبت نشده است.</p>';
      say(rows.length.toLocaleString('fa-IR') + ' تمرین ثبت شده است.');
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
      const {error} = await db().from('student_exercises').insert({student_id:currentStudentId, title});
      if (error) throw error;
      input.value = '';
      await loadStudentExercisesAdmin();
      say('تمرین با موفقیت اضافه شد ✓');
      try {
        const auth = authContext();
        const {data:pushData, error:pushError} = await auth.client.functions.invoke('student-push-admin', {
          body:{student_id:currentStudentId, message:'CLASS NOTIFICATION\nپیام کلاس شما\nپاشو تمرین داری 💪🏻🔥'}
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
        button.dataset.active='0';button.textContent='فعال‌سازی اعلان روی این گوشی';
        exercisePushStatus(Notification.permission==='denied'?'اجازه اعلان برای سایت مسدود است. از تنظیمات مرورگر فعالش کن.':'برای دریافت گزارش انجام تمرین، اعلان این گوشی را فعال کن.');
        return;
      }
      const state=await invokeExercisePush({action:'admin-status',endpoint:subscription.endpoint});
      button.dataset.active=state.active?'1':'0';
      button.textContent=state.active?'غیرفعال‌سازی اعلان':'فعال‌سازی اعلان روی این گوشی';
      exercisePushStatus(state.active?'اعلان انجام تمرین برای این گوشی فعال است.':'اشتراک اعلان این گوشی هنوز برای مدیر فعال نشده است.');
    }catch(e){
      button.dataset.active='0';button.textContent='فعال‌سازی اعلان روی این گوشی';
      exercisePushStatus('بررسی وضعیت اعلان ناموفق بود: '+(e.message||'خطای ارتباط'),true);
    }
  }
  async function toggleExercisePush(){
    const button=$('gym20ExercisePushToggle');
    if(!button)return;
    const wasActive=button.dataset.active==='1';
    button.disabled=true;
    const old=button.textContent;button.textContent='در حال انجام…';
    try{
      const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
      let subscription=await registration.pushManager.getSubscription();
      if(wasActive){
        if(subscription)await invokeExercisePush({action:'admin-unsubscribe',endpoint:subscription.endpoint});
        button.dataset.active='0';button.textContent='فعال‌سازی اعلان روی این گوشی';
        exercisePushStatus('اعلان انجام تمرین برای این گوشی غیرفعال شد.');
      }else{
        if(!('Notification' in window)||!('PushManager' in window))throw new Error('این مرورگر از اعلان گوشی پشتیبانی نمی‌کند.');
        let permission=Notification.permission;
        if(permission!=='granted')permission=await Notification.requestPermission();
        if(permission!=='granted')throw new Error('اجازه نمایش اعلان داده نشد.');
        const config=await invokeExercisePush({action:'admin-config'});
        if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushKeyBytes(config.public_key)});
        await invokeExercisePush({action:'admin-subscribe',subscription:subscription.toJSON(),user_agent:navigator.userAgent});
        button.dataset.active='1';button.textContent='غیرفعال‌سازی اعلان';
        const test=await invokeExercisePush({action:'admin-test',endpoint:subscription.endpoint});
        exercisePushStatus(test.sent>0?'اعلان فعال شد؛ پیام آزمایشی هم به این گوشی ارسال شد.':'اشتراک ثبت شد، اما پیام آزمایشی به گوشی نرسید.',test.sent<=0);
      }
    }catch(e){
      button.dataset.active=wasActive?'1':'0';button.textContent=old;
      exercisePushStatus(e.message||'فعال‌سازی اعلان ناموفق بود.',true);
    }finally{button.disabled=false;}
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
    pushBar.innerHTML='<div class="gym20-ex-push-copy"><strong>🔔 اعلان انجام تمرین</strong><small id="gym20ExercisePushStatus" role="status" aria-live="polite">برای دریافت اعلان روی گوشی، این دستگاه را فعال کن.</small></div><button type="button" id="gym20ExercisePushToggle">فعال‌سازی اعلان روی این گوشی</button>';
    const pushHost=embedded?$('gym20ExercisesTab'):panel;
    const pushHeading=pushHost?.querySelector('.admin-section-subhead');
    if(pushHeading)pushHeading.insertAdjacentElement('afterend',pushBar);else pushHost?.prepend(pushBar);
    const pushStyle=document.createElement('style');
    pushStyle.id='gym20ExercisePushStyle';
    pushStyle.textContent='#gym20ExercisePushBar{display:flex;align-items:center;justify-content:space-between;gap:9px;margin:8px 0 10px;padding:9px 10px;border:1px solid rgba(214,179,90,.22);border-radius:10px;background:linear-gradient(135deg,rgba(214,179,90,.075),rgba(255,255,255,.018));min-width:0}#gym20ExercisePushBar .gym20-ex-push-copy{display:flex;flex-direction:column;gap:3px;min-width:0}#gym20ExercisePushBar strong{font-size:10px;color:#e8c46b;font-weight:800}#gym20ExercisePushBar small{font-size:8px;line-height:1.6;color:#9aa6b6}#gym20ExercisePushBar button{box-sizing:border-box;flex:0 0 auto;min-height:26px;height:26px;padding:0 9px;border:1px solid rgba(214,179,90,.5);border-radius:7px;background:rgba(214,179,90,.12);color:#e8c46b;font:800 8px Vazirmatn,sans-serif;white-space:nowrap}#gym20ExercisePushBar button:disabled{opacity:.55}@media(max-width:420px){#gym20ExercisePushBar{gap:6px;padding:7px}#gym20ExercisePushBar button{padding:0 6px;font-size:7px}}';
    document.head.appendChild(pushStyle);
    const style = document.createElement('style');
    style.id = 'gym20ExerciseCompactStyle';
    style.textContent = `
      :is(#gym20ExercisesTab,.gym20-exercises-panel) .hint{font-size:9px;line-height:1.5;margin:4px 0 7px}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) .admin-grid-2{gap:6px;margin-bottom:6px}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) :is(.admin-input-group,.field) label[for="gym20ExerciseStudentSelect"]{display:block!important;margin:0 0 4px!important;color:#d8bd78!important;font-size:9px!important;font-weight:800!important;line-height:1.4!important}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseStudentSelect,
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseInput{min-height:30px!important;height:32px!important;padding:4px 8px!important;font-size:10px!important}
      :is(#gym20ExercisesTab,.gym20-exercises-panel) #gym20ExerciseAdd{min-height:26px!important;height:26px!important;padding:0 10px!important;font-size:9px!important;margin:2px 0 4px}
      #gym20ExerciseFeedback{font-size:9px!important;line-height:1.5;margin:3px 0 6px}
      #gym20ExerciseList{display:flex;flex-direction:column;gap:5px;margin-top:5px}
      #gym20ExerciseList .gym20-ex-admin-row{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px!important;margin:0!important;border:1px solid rgba(214,179,90,.16);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.012));min-width:0}
      #gym20ExerciseList .gym20-ex-info{display:flex;flex:1 1 auto;min-width:0;flex-direction:column;align-items:flex-start;gap:2px}
      #gym20ExerciseList .gym20-ex-title{font-size:10px!important;line-height:1.5;color:var(--text-primary,#eee);font-weight:800;overflow-wrap:anywhere}
      #gym20ExerciseList .gym20-ex-status{font-size:8px;line-height:1.45;font-weight:700}
      #gym20ExerciseList .gym20-ex-status.is-completed{color:#55c58a}
      #gym20ExerciseList .gym20-ex-status.is-pending{color:#d5b66b}
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
    select.addEventListener('change', () => { currentStudentId = select.value; loadStudentExercisesAdmin(); });
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
    window.addEventListener('gym20:exercise-tab-opened', () => {
      if (authContext().authorized) { loadExerciseStudents(); syncExercisePushStatus(); }
    });
    if (authContext().authorized && panel.classList.contains('active')) { loadExerciseStudents(); syncExercisePushStatus(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();