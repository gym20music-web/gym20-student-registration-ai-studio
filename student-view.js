(() => {
  const SUPABASE_URL='https://iqjujumhoawlugrmjvyj.supabase.co';
  const SUPABASE_KEY='sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ';
  const $=id=>document.getElementById(id);
  const faDate=v=>v?new Date(v+'T12:00:00').toLocaleDateString('fa-IR'):'—';
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
    $('schedule').innerHTML='<div class="muted" style="margin-bottom:12px">جلسات برنامه‌ریزی‌شده: <span class="session-count">'+num(sessions.length)+'</span> · وضعیت ثبت‌شده: '+num(done)+'</div><div class="table-wrap"><table><thead><tr><th>جلسه</th><th>تاریخ</th><th>ساعت</th><th>مدت</th><th>محل برگزاری</th><th>حضور و غیاب</th></tr></thead><tbody>'+
      sessions.map(s=>{const mins=Math.max(1,Math.round((new Date(s.ends_at)-new Date(s.starts_at))/60000));const a=att[s.attendance||'pending']||att.pending;return '<tr><td>'+num(s.session_number)+'</td><td>'+faDateTime(s.starts_at)+'</td><td>'+faTime(s.starts_at)+' تا '+faTime(s.ends_at)+'</td><td>'+num(mins)+' دقیقه</td><td>'+esc(s.venue||t.default_venue||'—')+'</td><td><span class="status '+a[1]+'">'+a[0]+'</span></td></tr>';}).join('')+
      '</tbody></table></div>';
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