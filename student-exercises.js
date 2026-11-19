(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db = () => {
    if (!window.gym20OwnerAuthorized || !window.gym20AdminClient) throw new Error('ابتدا با حساب مدیر وارد شوید.');
    return window.gym20AdminClient.schema('gym20');
  };
  let students = [];
  let currentStudentId = '';

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
      return day + ' · ساعت ' + time;
    } catch (_) { return date.toLocaleString('fa-IR'); }
  }

  async function loadExerciseStudents() {
    const select = $('gym20ExerciseStudentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">در حال دریافت…</option>';
    try {
      const {data, error} = await db().from('students').select('id,full_name,is_active').order('full_name');
      if (error) throw error;
      students = data || [];
      select.innerHTML = '<option value="">انتخاب هنرجو…</option>' + students.map(s =>
        '<option value="' + esc(s.id) + '">' + esc(s.full_name) + (s.is_active ? '' : ' · غیرفعال') + '</option>'
      ).join('');
      if (currentStudentId && students.some(s => s.id === currentStudentId)) select.value = currentStudentId;
      else if (students.length === 1) { currentStudentId = students[0].id; select.value = currentStudentId; }
      if (select.value) await loadStudentExercisesAdmin();
      else $('gym20ExerciseList').innerHTML = '<p class="muted">برای نمایش تمرین‌ها، یک هنرجو انتخاب کنید.</p>';
    } catch (e) {
      select.innerHTML = '<option value="">دریافت فهرست هنرجویان ناموفق بود</option>';
      say(e.message || 'دریافت فهرست هنرجویان ناموفق بود.', true);
    }
  }

  async function loadStudentExercisesAdmin() {
    const select = $('gym20ExerciseStudentSelect');
    const list = $('gym20ExerciseList');
    if (!select || !list) return;
    currentStudentId = select.value;
    if (!currentStudentId) {
      list.innerHTML = '<p class="muted">برای نمایش تمرین‌ها، یک هنرجو انتخاب کنید.</p>';
      say('');
      return;
    }
    say('در حال دریافت تمرین‌ها…');
    try {
      const {data, error} = await db().from('student_exercises')
        .select('id,title,is_completed,completed_at,created_at')
        .eq('student_id', currentStudentId)
        .order('created_at', {ascending:true});
      if (error) throw error;
      const rows = data || [];
      list.innerHTML = rows.length ? rows.map(x => {
        const completed = !!x.is_completed;
        const stamp = completed ? formatCompletedAt(x.completed_at) : '';
        return '<article class="request-card"><div><strong>' + esc(x.title) +
          (completed ? ' <span style="color:#55c58a">✓ انجام‌شده</span>' : ' <span style="color:#d5b66b">در انتظار انجام</span>') +
          (stamp ? '<small>' + esc(stamp) + '</small>' : '') +
          '</div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<button class="ghost" type="button" data-toggle-exercise="' + esc(x.id) + '" data-completed="' + String(completed) + '">' + (completed ? 'بازگردانی' : '✓ انجام شد') + '</button>' +
          '<button class="ghost" type="button" data-delete-exercise="' + esc(x.id) + '" aria-label="حذف تمرین">🗑️</button></div></article>';
      }).join('') : '<p class="muted">برای این هنرجو هنوز تمرینی ثبت نشده است.</p>';
      say(rows.length.toLocaleString('fa-IR') + ' تمرین ثبت شده است.');
    } catch (e) {
      list.innerHTML = '<p class="muted">دریافت تمرین‌ها ناموفق بود.</p>';
      say(e.message || 'دریافت تمرین‌ها ناموفق بود.', true);
    }
  }

  async function addExercise() {
    const input = $('gym20ExerciseInput');
    const button = $('gym20ExerciseAdd');
    const title = input.value.trim();
    if (!currentStudentId) { say('ابتدا هنرجو را انتخاب کنید.', true); return; }
    if (!title) { say('عنوان تمرین را وارد کنید.', true); input.focus(); return; }
    if (title.length > 120) { say('عنوان تمرین حداکثر ۱۲۰ نویسه باشد.', true); return; }
    button.disabled = true;
    try {
      const {error} = await db().from('student_exercises').insert({student_id:currentStudentId, title});
      if (error) throw error;
      input.value = '';
      await loadStudentExercisesAdmin();
      say('تمرین با موفقیت اضافه شد ✓');
    } catch (e) {
      say(e.message || 'افزودن تمرین ناموفق بود.', true);
    } finally { button.disabled = false; }
  }

  async function toggleExercise(id, completed) {
    if (!currentStudentId) return;
    try {
      const next = !completed;
      const {error} = await db().from('student_exercises').update({
        is_completed: next,
        completed_at: next ? new Date().toISOString() : null
      }).eq('id', id).eq('student_id', currentStudentId);
      if (error) throw error;
      await loadStudentExercisesAdmin();
      say(next ? 'تمرین انجام‌شده ثبت شد ✓' : 'تمرین به فهرست در انتظار بازگشت.');
    } catch (e) { say(e.message || 'به‌روزرسانی وضعیت تمرین ناموفق بود.', true); }
  }

  async function deleteExercise(id) {
    if (!currentStudentId || !confirm('این تمرین از برنامه هنرجو حذف شود؟')) return;
    try {
      const {error} = await db().from('student_exercises').delete().eq('id', id).eq('student_id', currentStudentId);
      if (error) throw error;
      await loadStudentExercisesAdmin();
      say('تمرین حذف شد.');
    } catch (e) { say(e.message || 'حذف تمرین ناموفق بود.', true); }
  }

  function mount() {
    const nav = document.querySelector('.admin-tabs');
    const work = document.querySelector('.admin-workspace');
    if (!nav || !work) return;

    // Keep the exercise destination available even if an older cached admin shell is opened.
    let navButton = nav.querySelector('[data-view="exercises"]');
    if (!navButton) {
      navButton = document.createElement('button');
      navButton.type = 'button';
      navButton.className = 'nav-item';
      navButton.dataset.view = 'exercises';
      navButton.innerHTML = '🏋️ <span>تمرین هنرجویان</span>';
      const overview = nav.querySelector('[data-view="overview"]');
      if (overview?.nextSibling) nav.insertBefore(navButton, overview.nextSibling);
      else nav.appendChild(navButton);
    }
    let panel = $('view-exercises');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'view-exercises';
      panel.className = 'view admin-panel-tab';
      panel.innerHTML = '<div class="panel"><div class="panel-head"><h2>تمرین‌های اختصاصی هنرجویان</h2><span class="tag">برنامه تمرینی</span></div><div class="field-grid"><div class="field full"><label for="gym20ExerciseStudentSelect">انتخاب هنرجو</label><select id="gym20ExerciseStudentSelect"><option value="">در حال دریافت فهرست هنرجویان…</option></select></div><div class="field full"><label for="gym20ExerciseInput">عنوان تمرین</label><input id="gym20ExerciseInput" maxlength="120" placeholder="مثلاً پوش‌آپ ۳۰ تکرار"></div></div><div class="panel-actions"><button class="primary" id="gym20ExerciseAdd" type="button">＋ افزودن تمرین</button></div><p class="muted" id="gym20ExerciseFeedback" role="status" aria-live="polite"></p><div id="gym20ExerciseList" class="request-list"><p class="muted">برای نمایش تمرین‌ها، یک هنرجو انتخاب کنید.</p></div></div>';
      work.appendChild(panel);
    }

    const openExerciseTab = () => {
      const target = $('view-exercises');
      if (!target) return;
      document.querySelectorAll('.view,.admin-panel-tab').forEach(el => el.classList.toggle('active', el === target));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === 'exercises'));
      if ($('pageTitle')) $('pageTitle').textContent = 'تمرین هنرجویان';
      if ($('pageSubtitle')) $('pageSubtitle').textContent = 'تعریف و پیگیری تمرین‌های اختصاصی هر هنرجو';
      if (window.gym20OwnerAuthorized) loadExerciseStudents();
      else say('برای استفاده از تمرین‌ها ابتدا وارد حساب مدیر شوید.', true);
    };
    navButton.addEventListener('click', event => { event.preventDefault(); openExerciseTab(); });
    document.querySelectorAll('[data-go="exercises"]').forEach(button => {
      if (!button.dataset.exerciseRouteBound) {
        button.dataset.exerciseRouteBound = '1';
        button.addEventListener('click', event => { event.preventDefault(); openExerciseTab(); });
      }
    });

    const select = $('gym20ExerciseStudentSelect');
    const add = $('gym20ExerciseAdd');
    const input = $('gym20ExerciseInput');
    const list = $('gym20ExerciseList');
    window.loadStudentExercisesAdmin = loadStudentExercisesAdmin;
    window.loadExerciseStudents = loadExerciseStudents;
    window.gym20ExerciseTabReady = true;
    if (!select || !add || !input || !list) {
      console.error('[GYM20] Exercise module mounted without required controls.');
      return;
    }
    if (select.dataset.exerciseBound) return;
    select.dataset.exerciseBound = '1';
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
    $('refreshBtn')?.addEventListener('click', () => {
      if (panel.classList.contains('active') && window.gym20OwnerAuthorized) loadExerciseStudents();
    });
    window.addEventListener('gym20:owner-authorized', () => {
      if (window.gym20OwnerAuthorized) loadExerciseStudents();
    });
    if (window.gym20OwnerAuthorized) loadExerciseStudents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();