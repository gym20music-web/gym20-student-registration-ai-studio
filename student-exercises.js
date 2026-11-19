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
    const panel = $('view-exercises');
    if (!nav || !panel) return;
    const tab = nav.querySelector('[data-view="exercises"]');
    if (tab && !tab.dataset.exerciseBound) {
      tab.dataset.exerciseBound = '1';
      tab.addEventListener('click', () => setTimeout(() => {
        if (window.gym20OwnerAuthorized) loadExerciseStudents();
      }, 0));
    }
    const select = $('gym20ExerciseStudentSelect');
    const add = $('gym20ExerciseAdd');
    const input = $('gym20ExerciseInput');
    const list = $('gym20ExerciseList');
    if (!select || !add || !input || !list) return;
    if (select.dataset.exerciseBound) return;
    select.dataset.exerciseBound = '1';
    select.addEventListener('change', loadStudentExercisesAdmin);
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
    window.loadStudentExercisesAdmin = loadStudentExercisesAdmin;
    window.loadExerciseStudents = loadExerciseStudents;
    if (window.gym20OwnerAuthorized) loadExerciseStudents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();