(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getStudentId=()=>String($('stStudentSelected')?.dataset.studentId||'');
  const db=()=>{if(!window.gym20OwnerAuthorized||!window.gym20AdminClient)throw Error('ابتدا با حساب مدیر وارد شوید.');return window.gym20AdminClient.schema('gym20');};
  let currentStudent='';
  function mount(){
    const nav=document.querySelector('.admin-tabs'),work=document.querySelector('.admin-workspace');
    if(!nav||!work||$('gym20ExercisesTab'))return;
    const btn=document.createElement('button');
    btn.className='admin-tab-btn';btn.type='button';btn.setAttribute('onclick',"switchAdminTab('exercisesTab');loadStudentExercisesAdmin()");
    btn.textContent='🏋️ تمرین هنرجو';nav.appendChild(btn);
    const panel=document.createElement('section');panel.className='admin-panel-tab';panel.id='exercisesTab';panel.innerHTML=`
      <div id="gym20ExercisesTab" class="admin-card-section" style="border:1px solid rgba(214,179,90,.28);border-radius:12px;padding:14px;background:rgba(255,255,255,.025)">
        <div style="font-weight:800;color:#e4c879;margin-bottom:5px">🏋️ تمرین‌های اختصاصی هنرجو</div>
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px">ابتدا هنرجو را در بخش «برنامه کلاس‌ها» انتخاب کن؛ تمرین‌ها در لینک اختصاصی همان هنرجو، زیر جلسات نمایش داده می‌شوند.</div>
        <div id="gym20ExerciseStudent" style="font-size:11px;color:#d8c58e;margin-bottom:10px">هنرجویی انتخاب نشده است.</div>
        <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
          <input id="gym20ExerciseInput" maxlength="120" placeholder="مثلاً پوش اپ ۳۰تا" style="flex:1 1 180px;min-width:0;min-height:36px;border:1px solid rgba(214,179,90,.4);border-radius:8px;background:#101722;color:#fff;padding:7px 10px;font:inherit;font-size:12px">
          <button type="button" id="gym20ExerciseAdd" style="min-height:36px;border:1px solid #a98743;border-radius:8px;background:linear-gradient(135deg,#e8c46b,#a77a2e);color:#17130b;padding:6px 14px;font:700 11px Vazirmatn,sans-serif;cursor:pointer">＋ افزودن</button>
        </div>
        <div id="gym20ExerciseFeedback" style="font-size:10px;min-height:20px;margin-top:7px;color:#9aa7b8"></div>
        <div id="gym20ExerciseList" style="display:grid;gap:7px;margin-top:8px"></div>
      </div>`;
    work.appendChild(panel);
    const css=document.createElement('style');css.textContent=`
      #exercisesTab .gym20-ex-admin-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;border:1px solid #303b4b;border-radius:8px;background:#111a27;font-size:11px}
      #exercisesTab .gym20-ex-admin-row button{border:1px solid #7f3540;border-radius:6px;background:#351820;color:#fecaca;padding:4px 8px;font:inherit;font-size:10px;cursor:pointer}
      #exercisesTab #gym20ExerciseAdd:disabled{opacity:.55}
    `;document.head.appendChild(css);
    $('gym20ExerciseAdd').addEventListener('click',addExercise);
    $('gym20ExerciseInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addExercise();}});
    $('gym20ExerciseList').addEventListener('click',e=>{const b=e.target.closest('[data-delete-exercise]');if(b)deleteExercise(b.dataset.deleteExercise);});
  }
  async function loadStudentExercisesAdmin(){
    const feedback=$('gym20ExerciseFeedback'),studentLabel=$('gym20ExerciseStudent'),list=$('gym20ExerciseList');
    if(!list)return;
    const studentId=getStudentId();currentStudent=studentId;
    if(!studentId){studentLabel.textContent='ابتدا در بخش «برنامه کلاس‌ها» یک هنرجو انتخاب کن.';list.innerHTML='';return;}
    const selected=document.querySelector('#stStudentSelected');
    studentLabel.textContent='هنرجوی انتخاب‌شده: '+(selected?.textContent?.trim()||'');
    feedback.textContent='در حال دریافت تمرین‌ها…';
    try{
      const {data,error}=await db().from('student_exercises').select('id,title,is_completed').eq('student_id',studentId).order('created_at');
      if(error)throw error;
      list.innerHTML=(data||[]).map(x=>'<div class="gym20-ex-admin-row"><span>'+esc(x.title)+(x.is_completed?' <small style="color:#86efac">· انجام شده</small>':'')+'</span><button type="button" data-delete-exercise="'+esc(x.id)+'">حذف</button></div>').join('')||'<div style="font-size:10px;color:#8e9aaa;padding:10px">هنوز تمرینی ثبت نشده است.</div>';
      feedback.textContent=(data||[]).length+' تمرین ثبت شده است.';
    }catch(e){feedback.textContent=e.message||'دریافت تمرین‌ها ناموفق بود.';}
  }
  async function addExercise(){
    const input=$('gym20ExerciseInput'),button=$('gym20ExerciseAdd'),feedback=$('gym20ExerciseFeedback'),studentId=getStudentId(),title=input.value.trim();
    if(!studentId){feedback.textContent='ابتدا هنرجو را در بخش برنامه کلاس‌ها انتخاب کن.';return;}
    if(!title){feedback.textContent='عنوان تمرین را بنویس.';input.focus();return;}
    if(title.length>120){feedback.textContent='حداکثر طول عنوان تمرین ۱۲۰ کاراکتر است.';return;}
    button.disabled=true;
    try{
      const {error}=await db().from('student_exercises').insert({student_id:studentId,title});
      if(error)throw error;
      input.value='';feedback.textContent='تمرین اضافه شد ✓';await loadStudentExercisesAdmin();
    }catch(e){feedback.textContent=e.message||'افزودن تمرین ناموفق بود.';}
    finally{button.disabled=false;}
  }
  async function deleteExercise(id){
    if(!confirm('این تمرین از برنامه هنرجو حذف شود؟'))return;
    const feedback=$('gym20ExerciseFeedback');
    try{const {error}=await db().from('student_exercises').delete().eq('id',id).eq('student_id',currentStudent);if(error)throw error;await loadStudentExercisesAdmin();}
    catch(e){feedback.textContent=e.message||'حذف تمرین ناموفق بود.';}
  }
  window.loadStudentExercisesAdmin=loadStudentExercisesAdmin;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();