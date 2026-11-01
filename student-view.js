(() => {
  const SUPABASE_URL='https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY='sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const $=id=>document.getElementById(id);
  const faDate=v=>{if(!v)return '—';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite))return '—';if(p[0]<1700)return p.map((x,i)=>String(x).padStart(i===0?4:2,'0')).join('/').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'numeric',day:'numeric'}).format(new Date(p[0],p[1]-1,p[2],12));};
  const faDateTime=v=>v?new Date(v).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'}):'—';
  const faTime=v=>v?new Date(v).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}):'—';
  const num=v=>Number(v||0).toLocaleString('fa-IR');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const att={
    pending:['در انتظار ثبت','pending'],present:['حاضر','present'],absent:['غایب','absent'],
    excused:['غیبت موجه','pending'],makeup:['جلسه جبرانی','present'],cancelled:['لغوشده','absent']
  };
  let terms=[];
  function showTerm(id){
    const t=terms.find(x=>x.id===id)||terms[0];if(!t)return;
    $('termMeta').textContent='تعداد جلسات: '+num(t.total_sessions)+' · شروع: '+faDate(t.start_date)+' · پایان: '+faDate(t.end_date);
    const sessions=t.sessions||[];
    if(!sessions.length){$('schedule').innerHTML='<div class="empty">برای این ترم هنوز جلسه منتشرشده‌ای ثبت نشده است.</div>';return;}
    const done=sessions.filter(s=>['present','absent','excused','makeup','cancelled'].includes(s.attendance)).length;
    $('schedule').innerHTML='<div class="schedule-summary"><span>جلسات برنامه‌ریزی‌شده <b>'+num(sessions.length)+'</b></span><span>وضعیت ثبت‌شده <b>'+num(done)+'</b></span></div><div class="session-list">'+sessions.map(s=>{const mins=Math.max(1,Math.round((new Date(s.ends_at)-new Date(s.starts_at))/60000));const a=att[s.attendance||'pending']||att.pending;return '<article class="session-card"><div class="session-top"><b class="session-number">جلسه '+num(s.session_number)+'</b><span class="status '+a[1]+'">'+a[0]+'</span></div><div class="session-facts"><span><i>تاریخ</i><b>'+faDateTime(s.starts_at)+'</b></span><span><i>ساعت</i><b>'+faTime(s.starts_at)+'–'+faTime(s.ends_at)+'</b></span><span><i>مدت</i><b>'+num(mins)+' دقیقه</b></span></div><div class="session-bottom"><span>📍 '+esc(s.venue||t.default_venue||'محل ثبت نشده')+'</span><span class="coach">🏅 '+esc(s.coach_name||'مربی تعیین نشده')+'</span></div></article>';}).join('')+'</div>'
  }
  async function init(){
    const token=new URLSearchParams(location.search).get('t');
    const shortCode=(location.pathname.match(/\/s\/([0-9a-f]{12})\/?$/i)||[])[1]||new URLSearchParams(location.search).get('c');
    if((!token||!/^[0-9a-f]{64}$/.test(token))&&(!shortCode||!/^[0-9a-f]{12}$/.test(shortCode))){$('studentName').textContent='لینک معتبر نیست یا ناقص است.';$('schedule').textContent='لطفاً لینک اختصاصی را از مربی دریافت کنید.';return;}
    try{
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{db:{schema:'gym20'},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=shortCode
        ?await client.schema('gym20').rpc('get_student_public_schedule_by_code',{p_code:shortCode})
        :await client.schema('gym20').rpc('get_student_public_schedule',{p_token:token});
      if(error)throw error;if(!data||!data.student){$('studentName').textContent='این لینک معتبر نیست یا غیرفعال شده است.';$('schedule').textContent='برای دریافت لینک جدید با مربی تماس بگیرید.';return;}
      $('studentName').textContent='هنرجو: '+data.student.full_name+' · برنامه ترم‌های منتشرشده';
      terms=data.terms||[];
      if(!terms.length){$('schedule').textContent='هنوز برنامه‌ای برای شما منتشر نشده است.';return;}
      $('termPanel').classList.remove('hide');
      $('termSelect').innerHTML=terms.map((t,i)=>'<option value="'+esc(t.id)+'">'+esc(t.term_name)+'</option>').join('');
      $('termSelect').addEventListener('change',e=>showTerm(e.target.value));
      showTerm(terms[0].id);
    }catch(e){console.error(e);$('studentName').textContent='دریافت برنامه با خطا مواجه شد.';$('schedule').textContent='اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();