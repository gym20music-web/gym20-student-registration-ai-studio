(() => {
  const TAB='studentTermsTab', S={students:[],enrollments:[],terms:[],studentId:'',termId:'',term:null,draftId:'',rows:[],manualDates:[],publishedId:null,sessions:[],termEnrollmentIds:[]};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=v=>Number(v||0).toLocaleString('fa-IR');
  const db=()=>{if(!gym20OwnerAuthorized||!gym20AdminClient)throw Error('ابتدا با حساب مدیر وارد شوید.');return gym20AdminClient.schema('gym20');};
  const say=(m,bad)=>{const e=$('stFeedback');if(e){e.textContent=m||'';e.style.color=bad?'#fb7185':'#34d399';}};
  const dateFa=v=>v?jalaliInput(String(v).slice(0,10)).replace(/\//g,'/'):'—';
  const enDigits=v=>String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const jalaliInput=v=>{if(!v)return '';const p=String(v).slice(0,10).split('-').map(Number);if(p.length!==3||!p.every(Number.isFinite)||p[0]<1000||p[1]<1||p[1]>12||p[2]<1||p[2]>31)return '';if(p[0]<1700)return String(p[0]).padStart(4,'0')+'/'+String(p[1]).padStart(2,'0')+'/'+String(p[2]).padStart(2,'0');const parts=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(p[0],p[1]-1,p[2],12));const val=type=>parts.find(x=>x.type===type)?.value||'';return val('year').padStart(4,'0')+'/'+val('month').padStart(2,'0')+'/'+val('day').padStart(2,'0');};
  const gregorianInput=v=>{const z=enDigits(v).trim().replace(/[.\-]/g,'/');if(!z)return '';const p=z.split('/').map(Number);if(p.length!==3||p[0]<1200||p[1]<1||p[1]>12||p[2]<1||p[2]>31)throw Error('تاریخ شمسی را به شکل ۱۴۰۵/۰۸/۱۰ وارد کن.');const g=jalaliToGregorian(p[0],p[1],p[2]);if(!g)throw Error('تاریخ شمسی معتبر نیست.');return g;};
  const bindJalaliDates=root=>{(root||document).querySelectorAll('[data-jalali-date]').forEach(el=>{if(el.dataset.jalaliBound)return;el.dataset.jalaliBound='1';el.type='text';el.inputMode='numeric';el.placeholder='۱۴۰۵/۰۸/۱۰';el.value=jalaliInput(el.value);el.addEventListener('input',()=>{let v=enDigits(el.value).replace(/[^0-9]/g,'').slice(0,8);if(v.length>6)v=v.slice(0,4)+'/'+v.slice(4,6)+'/'+v.slice(6);else if(v.length>4)v=v.slice(0,4)+'/'+v.slice(4);el.value=v;});});};
  const localISO=(d,t)=>{const x=new Date(d+'T'+t+':00');if(isNaN(x))throw Error('تاریخ یا ساعت نامعتبر است.');return x.toISOString();};
  const localDate=v=>{const d=new Date(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const localTime=v=>{const d=new Date(v);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
  const rowMinutes=r=>Math.max(1,Math.round((new Date(r.ends_at)-new Date(r.starts_at))/60000));
  const plus7=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+7*n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  const classNames={normal:'عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP',online:'آنلاین'};
  const attNames={pending:'در انتظار',present:'حاضر',absent:'غایب',excused:'غیبت موجه',makeup:'جلسه جبرانی',cancelled:'لغوشده'};


  function syncTermName(){const p=enDigits($('stStart')?.value||'').split('/').map(Number),months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];$('stName').value=p.length===3&&p[0]>1200&&p[1]>=1&&p[1]<=12?'ترم '+months[p[1]-1]+' '+p[0]:'';}
  function initTermCalendars(root){
    const monthsFa=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    root.querySelectorAll('[data-calendar]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('.st-jcal').forEach(x=>x.remove());
      const input=$(btn.dataset.calendar),raw=enDigits(input.value||'').split('/').map(Number);
      const todayParts=enDigits(jalaliInput(localDate(new Date()))).split('/').map(Number);
      let jy=raw.length===3&&raw[0]>1200?raw[0]:todayParts[0];
      let jm=raw.length===3&&raw[1]>=1&&raw[1]<=12?raw[1]:todayParts[1];
      const pop=document.createElement('div');pop.className='st-jcal';document.body.appendChild(pop);
      const rect=btn.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-260,rect.left+rect.width/2-126))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-290,rect.bottom+5))+'px';
      const draw=()=>{
        const g=jalaliToGregorian(jy,jm,1),next=jm===12?jalaliToGregorian(jy+1,1,1):jalaliToGregorian(jy,jm+1,1);
        const first=new Date(g+'T12:00:00'),last=new Date(next+'T12:00:00'),days=Math.round((last-first)/86400000),offset=(first.getDay()+1)%7,picked=enDigits(input.value).split('/').map(Number),todayParts=enDigits(jalaliInput(localDate(new Date()))).split('/').map(Number);
        pop.innerHTML='<div class="st-jcal-head"><button type="button" data-prev>‹</button><b>'+monthsFa[jm-1]+' '+fa(jy)+'</b><button type="button" data-next>›</button></div><div class="st-jcal-grid">'+['ش','ی','د','س','چ','پ','ج'].map(x=>'<span>'+x+'</span>').join('')+Array(offset).fill('<i></i>').join('')+Array.from({length:days},(_,i)=>'<button type="button" class="st-jcal-day '+(picked[0]===jy&&picked[1]===jm&&picked[2]===i+1?'selected ':'')+(todayParts[0]===jy&&todayParts[1]===jm&&todayParts[2]===i+1?'today':'')+'" data-day="'+(i+1)+'">'+fa(i+1)+'</button>').join('')+'</div>';
        pop.querySelector('[data-prev]').onclick=()=>{if(--jm<1){jm=12;jy--;}draw();};
        pop.querySelector('[data-next]').onclick=()=>{if(++jm>12){jm=1;jy++;}draw();};
        pop.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{input.value=jy+'/'+String(jm).padStart(2,'0')+'/'+String(Number(b.dataset.day)).padStart(2,'0');input.dispatchEvent(new Event('change',{bubbles:true}));pop.remove();});
      };draw();
      const close=e=>{if(!pop.contains(e.target)&&e.target!==btn){pop.remove();document.removeEventListener('pointerdown',close);}};
      setTimeout(()=>document.addEventListener('pointerdown',close),0);
    }));
  }
  function syncCustomSelect(wrap){const select=wrap?.querySelector('select'),value=wrap?.querySelector('.st-custom-value'),menu=wrap?.querySelector('.st-custom-select-menu');if(!select||!value||!menu)return;const opt=select.options[select.selectedIndex];value.textContent=opt?opt.textContent:'انتخاب کنید…';menu.querySelectorAll('[data-option-index]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.optionIndex)===select.selectedIndex));}
  function refreshCustomSelect(select){const wrap=select?.closest('.st-custom-select');if(!wrap)return;const menu=wrap.querySelector('.st-custom-select-menu');menu.innerHTML=Array.from(select.options).map((o,i)=>'<button type="button" class="st-custom-option '+(i===select.selectedIndex?'selected':'')+'" data-option-index="'+i+'" '+(o.disabled?'disabled':'')+'>'+esc(o.textContent)+'</button>').join('');syncCustomSelect(wrap);}
  function enhanceSelect(select){if(!select||select.multiple||select.dataset.customized==='1')return;select.dataset.customized='1';const wrap=document.createElement('div');wrap.className='st-custom-select';select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);select.classList.add('st-custom-select-native');select.removeAttribute('required');const trigger=document.createElement('button');trigger.type='button';trigger.className='st-custom-select-trigger';trigger.innerHTML='<span class="st-custom-value"></span><span class="st-custom-arrow">⌄</span>';const menu=document.createElement('div');menu.className='st-custom-select-menu';menu.hidden=true;wrap.append(trigger,menu);trigger.addEventListener('click',()=>{const opening=menu.hidden;document.querySelectorAll('#studentTermsTab .st-custom-select-menu').forEach(m=>{m.hidden=true;m.parentElement.classList.remove('open');});menu.hidden=!opening;wrap.classList.toggle('open',opening);trigger.setAttribute('aria-expanded',String(opening));});menu.addEventListener('click',e=>{const b=e.target.closest('[data-option-index]');if(!b)return;select.selectedIndex=Number(b.dataset.optionIndex);select.dispatchEvent(new Event('change',{bubbles:true}));menu.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');syncCustomSelect(wrap);});select.addEventListener('change',()=>refreshCustomSelect(select));refreshCustomSelect(select);}
  function enhanceAllSelects(root){(root||document).querySelectorAll('#studentTermsTab select:not([multiple])').forEach(enhanceSelect);}
  function mount(){
    if($(TAB))return;
    const nav=document.querySelector('.admin-tabs'),work=document.querySelector('.admin-workspace');
    if(!nav||!work)return;
    const termCss=document.createElement('style');
    termCss.id='studentTermsLayoutCss';
    termCss.textContent=`
      #studentTermsTab .st-term-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;align-items:end}
      #studentTermsTab .st-term-grid>.st-field{min-width:0!important;margin:0!important}
      #studentTermsTab .st-term-grid .st-field label{display:block;font-size:12px!important;line-height:1.5;white-space:normal!important;margin-bottom:4px}
      #studentTermsTab .st-term-grid input{box-sizing:border-box;width:100%;min-width:0;height:40px!important;min-height:40px!important;padding:7px 9px!important;font-size:13px!important}
      #studentTermsTab .st-date-wrap{display:flex;align-items:center;gap:6px;width:100%;min-width:0}
      #studentTermsTab .st-date-wrap input{flex:1 1 auto;width:0;min-width:0}
      #studentTermsTab .st-calendar-btn{flex:0 0 38px;width:38px;height:40px;border:1px solid #9b7938;border-radius:8px;background:#24202a;color:#f1ce7c;font-size:18px;cursor:pointer}
      #studentTermsTab .st-create-compact{padding:14px!important}
      .st-jcal{position:fixed!important;z-index:2147483001!important;width:252px;max-width:calc(100vw - 16px);padding:10px;border:1px solid #94743a;border-radius:12px;background:#111722;box-shadow:0 12px 30px #000b;color:#fff;box-sizing:border-box;direction:rtl;font-family:inherit}.st-jcal *{box-sizing:border-box}.st-jcal-head button{min-width:34px;min-height:32px;cursor:pointer;font-size:18px}.st-jcal-head b{font-size:13px;white-space:nowrap}.st-jcal-grid{grid-auto-rows:minmax(32px,auto);align-items:stretch}.st-jcal-grid>span{display:flex;align-items:center;justify-content:center}.st-jcal-grid>i{display:block;min-height:32px}.st-jcal-day{display:flex;align-items:center;justify-content:center;min-width:0;min-height:32px;line-height:1;padding:0;font-family:inherit}
      .st-jcal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .st-jcal-head button,.st-jcal-day{border:1px solid #354153;border-radius:7px;background:#1c2634;color:#fff;padding:6px 7px}
      .st-jcal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
      .st-jcal-grid span{font-size:11px;color:#d8bc78;padding:5px 0}
      .st-jcal-grid i{min-height:30px}
      .st-jcal-day{width:100%;min-height:30px;font-size:11px;padding:4px 0;cursor:pointer}
      .st-jcal-day.selected{background:#b68b3b;color:#111;font-weight:800}
      .st-jcal-day.today{outline:2px solid #d6b35a;outline-offset:1px}
      .st-student-select-wrap{width:100%;max-width:420px;margin-bottom:0!important}
      .st-student-picker{position:relative;width:100%}
      .st-student-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:42px;padding:9px 11px;border:1px solid rgba(214,179,90,.55);border-radius:10px;background:#111a27;color:#f3f0e8;font:inherit;font-size:13px;text-align:right;cursor:pointer}
      .st-student-trigger span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .st-picker-arrow{color:#d6b35a;font-size:18px}
      .st-student-menu{position:absolute!important;z-index:10050!important;top:calc(100% + 6px)!important;right:0!important;left:0!important;width:100%!important;max-height:min(48vh,300px);overflow-y:auto;overflow-x:hidden;padding:5px;border:1px solid rgba(214,179,90,.65);border-radius:11px;background:#171e2b!important;color:#f3f0e8!important;box-shadow:0 14px 32px #000b;box-sizing:border-box;direction:rtl}.st-student-option{display:flex!important;min-height:40px;box-sizing:border-box;line-height:1.5}.st-student-option span{min-width:0;overflow:hidden;text-overflow:ellipsis}.st-student-option small{flex:0 0 auto}
      .st-student-menu[hidden]{display:none!important}
      .st-student-option{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:10px 9px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:#eee;text-align:right;font:inherit;font-size:12px;cursor:pointer}
      .st-student-option:last-child{border-bottom:0}
      .st-student-option small{color:#b7a16c;font-size:10px;white-space:nowrap}
      .st-student-option.selected{background:rgba(214,179,90,.13);color:#f2d48b;border-radius:7px}
      .st-day-picks{display:flex;flex-wrap:wrap;gap:6px}
      .st-day-chip{display:flex!important;align-items:center;gap:5px;padding:7px 9px;border:1px solid rgba(214,179,90,.35);border-radius:8px;background:var(--surface);color:var(--text-primary)!important;font-size:11px!important;white-space:nowrap}
      .st-day-chip input{width:14px!important;height:14px!important;accent-color:#d6b35a}
      .st-pattern-grid{margin:10px 0;grid-template-columns:repeat(2,minmax(0,1fr))!important}
      @media(max-width:720px){
        #studentTermsTab .st-term-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px 9px!important}
        #studentTermsTab .st-term-grid>.st-field:nth-child(1){grid-column:1;grid-row:1}
        #studentTermsTab .st-term-grid>.st-field:nth-child(2){grid-column:2;grid-row:1}
        #studentTermsTab .st-term-grid>.st-field:nth-child(3){grid-column:1/-1;grid-row:2}
        #studentTermsTab .st-term-grid>.st-field:nth-child(4){grid-column:1;grid-row:3}
        #studentTermsTab .st-term-grid>.st-field:nth-child(5){grid-column:2;grid-row:3}
        #studentTermsTab .st-term-grid .st-field label{font-size:11px!important}
        #studentTermsTab .st-term-grid input{height:38px!important;min-height:38px!important;font-size:12px!important}
        #studentTermsTab .st-calendar-btn{height:38px;flex-basis:34px;width:34px}
        #studentTermsTab .st-create-compact{padding:10px!important}
        #studentTermsTab .st-pattern-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #studentTermsTab .st-day-chip{padding:6px 7px;font-size:10px!important}
      }
      @media(max-width:390px){
        #studentTermsTab .st-term-grid{gap:8px 6px!important}
        #studentTermsTab .st-term-grid .st-field label{font-size:10px!important}
        #studentTermsTab .st-term-grid input{font-size:11px!important;padding:5px!important}
        #studentTermsTab .st-calendar-btn{flex-basis:31px;width:31px}
      }`;
    document.head.appendChild(termCss);

    const css=document.createElement('style');css.id='studentTermsCss';
    css.textContent='#studentTermsTab{color:var(--text-primary)}.st-card{background:var(--surface-card);border:1px solid var(--border);border-radius:11px;padding:11px;margin:10px 0}.st-title{font-size:.88rem;font-weight:850;color:#d6b35a;margin-bottom:8px}.st-muted{font-size:.7rem;color:var(--text-secondary);line-height:1.8}.st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}.st-field label{font-size:.7rem;color:var(--text-secondary);font-weight:700}.st-field input,.st-field select{width:100%;min-width:0;height:34px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:7px;padding:5px 7px;font-size:.72rem}.st-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.st-btn{border:1px solid rgba(214,179,90,.35);border-radius:7px;background:rgba(214,179,90,.12);color:var(--text-primary);padding:6px 9px;font-size:.66rem;font-weight:800;cursor:pointer}.st-btn.primary{background:linear-gradient(110deg,#a98235,#e0c16e);color:#17130a}.st-btn.danger{border-color:#ef4444;color:#fb7185}.st-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.st-check{display:flex;align-items:center;gap:6px;padding:6px 7px;border:1px solid var(--border);border-radius:7px;background:var(--surface);font-size:.66rem;line-height:1.5;min-width:0}.st-check input{accent-color:#d6b35a}.st-table-wrap{overflow:auto}.st-table{width:100%;border-collapse:collapse;font-size:.7rem;min-width:600px}.st-table th,.st-table td{padding:8px;border-bottom:1px solid var(--border);text-align:right}.st-table th{color:#d6b35a;background:rgba(214,179,90,.07)}.st-table select,.st-table input{max-width:150px;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:6px;font-size:.68rem}.st-table small{display:block;color:var(--text-secondary);font-size:.6rem}.st-version{padding:7px;border:1px solid var(--border);border-radius:8px;margin:5px 0;font-size:.7rem}.st-hide{display:none!important}.st-short-url{direction:ltr;text-align:left;word-break:break-all;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:9px;margin:7px 0;font-size:.78rem;color:#e7c875}.st-public-link{margin-top:8px}@media(max-width:650px){.st-grid,.st-checks{grid-template-columns:repeat(2,minmax(0,1fr))}.st-card{padding:8px}}@media(max-width:390px){.st-grid,.st-checks{grid-template-columns:1fr}}';
    css.textContent += '.st-session-card{padding:6px 8px;margin:5px 0;border:1px solid var(--border);border-radius:8px;background:var(--surface)}.st-session-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:5px;color:var(--text-primary);font-size:11px}.st-session-state{padding:2px 6px;border-radius:16px;font-size:9px;font-weight:800;white-space:nowrap}.st-session-state.done{background:#123d2b;color:#65e6a1;border:1px solid #24734c}.st-session-state.live{background:#12364b;color:#7dd3fc;border:1px solid #24749a}.st-session-state.upcoming{background:#493816;color:#f5d17c;border:1px solid #9b7938}.st-session-fields{display:grid;grid-template-columns:minmax(110px,1fr) minmax(90px,.7fr) minmax(110px,1fr) auto;align-items:end;gap:6px}.st-session-fields label{display:flex;flex-direction:column;gap:2px;color:var(--text-secondary);font-size:9px;min-width:0}.st-session-fields input{width:100%;min-width:0;height:27px;padding:3px 6px;border:1px solid var(--border);border-radius:6px;background:var(--surface-card);color:var(--text-primary);font:inherit;font-size:10px}.st-session-fields footer{display:flex;align-items:end}.st-session-fields footer .st-btn{min-height:27px;padding:3px 8px;font-size:9px}@media(max-width:600px){.st-session-card{padding:6px}.st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.st-session-fields label{font-size:9px}.st-session-fields input{height:27px;font-size:10px}.st-session-head{font-size:10px}.st-session-fields footer{grid-column:2;justify-content:flex-end}}';
css.textContent += '@media(max-width:720px){.admin-layout{flex-direction:row!important;direction:rtl!important;align-items:stretch!important}.admin-sidebar{width:102px!important;flex:0 0 102px!important;min-width:102px!important;max-height:none!important;padding:7px 5px!important;border-left:1px solid var(--border)!important;border-bottom:0!important;gap:7px!important;overflow-y:auto!important;overflow-x:hidden!important}.admin-sidebar-brand{display:block!important;padding:6px 5px!important}.admin-sidebar-brand strong{font-size:.66rem!important}.admin-sidebar-brand small{font-size:.52rem!important}.admin-tabs{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:5px!important;justify-content:flex-start!important}.admin-tab-btn{width:100%!important;min-height:38px!important;flex:0 0 auto!important;padding:6px 5px!important;font-size:.61rem!important;line-height:1.35!important;white-space:normal!important;text-align:right!important;border-radius:7px!important}.admin-tab-btn.active{box-shadow:inset -3px 0 0 #d6b35a!important}.admin-workspace{flex:1!important;min-width:0!important;padding:8px 7px calc(14px + env(safe-area-inset-bottom))!important}}@media(max-width:390px){.admin-sidebar{width:90px!important;flex-basis:90px!important;min-width:90px!important}.admin-tab-btn{font-size:.57rem!important;padding:5px 4px!important}}';
    css.textContent += '.st-custom-select{position:relative;width:100%;min-width:0}.st-custom-select-native{position:absolute!important;inset:0!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}.st-custom-select-trigger{display:flex;align-items:center;justify-content:space-between;gap:7px;width:100%;min-width:0;min-height:36px;padding:7px 9px;border:1px solid rgba(214,179,90,.48);border-radius:9px;background:linear-gradient(180deg,#1b2432,#121a26);color:#f3f0e8;font:inherit;font-size:12px;text-align:right;cursor:pointer;box-shadow:inset 0 1px 0 #ffffff09}.st-custom-select-trigger .st-custom-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.st-custom-select-trigger .st-custom-arrow{flex:0 0 auto;color:#d6b35a;font-size:16px;transition:transform .15s}.st-custom-select.open .st-custom-arrow{transform:rotate(180deg)}.st-custom-select-menu{position:absolute;z-index:11000;top:calc(100% + 5px);right:0;left:0;max-height:min(42vh,260px);overflow:auto;padding:5px;border:1px solid rgba(214,179,90,.5);border-radius:10px;background:#171e2b;box-shadow:0 14px 32px #000c}.st-custom-select-menu[hidden]{display:none!important}.st-custom-option{display:block;width:100%;padding:9px 10px;border:0;border-bottom:1px solid #ffffff10;border-radius:6px;background:transparent;color:#e9e6df;font:inherit;font-size:12px;text-align:right;cursor:pointer}.st-custom-option:last-child{border-bottom:0}.st-custom-option.selected{background:rgba(214,179,90,.16);color:#f2d48b;font-weight:800}.st-custom-option:active{background:rgba(214,179,90,.24)}@media(max-width:600px){.st-custom-select-trigger{min-height:36px;padding:6px;font-size:10px}.st-custom-select-menu{max-height:35vh}.st-custom-option{padding:11px 8px;font-size:11px}}';
    document.head.appendChild(css);
    css.textContent += ".st-mode-switch{display:flex;gap:5px;flex-wrap:wrap;margin:4px 0 8px}.st-mode-btn{min-height:30px;padding:5px 13px;border:1px solid rgba(214,179,90,.38);border-radius:7px;background:var(--surface);color:var(--text-secondary);font:inherit;font-size:11px;cursor:pointer}.st-mode-btn.active{background:rgba(214,179,90,.2);border-color:#d6b35a;color:#f0d58e}.st-mode-panel{padding-top:5px}.st-manual-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.st-weekly-top{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin:4px 0 8px}.st-compact-field{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text-secondary);white-space:nowrap}.st-compact-field input{width:92px;height:29px;padding:3px 6px;font-size:11px}.st-pattern-switch{display:flex;gap:4px}.st-pattern-tab{min-height:29px;padding:4px 10px;border:1px solid rgba(214,179,90,.38);border-radius:7px;background:var(--surface);color:var(--text-secondary);font:inherit;font-size:10px;cursor:pointer}.st-pattern-tab.active{background:rgba(214,179,90,.2);border-color:#d6b35a;color:#f0d58e}.st-day-panel{margin:5px 0 8px}.st-day-picks{gap:4px}.st-day-chip{gap:3px!important;padding:4px 6px!important;border-radius:6px!important;font-size:10px!important}.st-day-chip input{width:12px!important;height:12px!important;margin:0!important}#studentTermsTab #stManual .st-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#studentTermsTab #stManual .st-field{margin:0}#studentTermsTab #stManual .st-field label{font-size:10px}#studentTermsTab #stManual input{height:29px;padding:4px 6px;font-size:11px}#studentTermsTab .st-session-fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}#studentTermsTab .st-session-fields label{font-size:10px}#studentTermsTab .st-session-fields input{height:29px;padding:4px 6px;font-size:11px}@media(max-width:600px){#studentTermsTab #stManual .st-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}";
    const b=document.createElement('button');b.className='admin-tab-btn';b.type='button';b.textContent='👥 هنرجویان و ترم‌ها';b.setAttribute('onclick',"switchAdminTab('"+TAB+"')");
    nav.insertBefore(b,nav.querySelector('[onclick*="requestsTab"]')||null);
    const p=document.createElement('div');p.className='admin-panel-tab';p.id=TAB;
    p.innerHTML=
      '<div class="admin-section-subhead">👥 مدیریت هنرجویان، ترم‌ها و برنامه جلسات</div>'+
      '<div class="st-card st-student-card"><div class="st-title">۱. انتخاب هنرجو</div><div class="st-field st-student-select-wrap"><label>هنرجو</label><div class="st-student-picker"><button type="button" id="stStudentTrigger" class="st-student-trigger" aria-expanded="false"><span id="stStudentSelected">در حال دریافت هنرجویان…</span><span class="st-picker-arrow">⌄</span></button><div id="stStudentMenu" class="st-student-menu" hidden></div></div></div><div id="stSummary" class="st-muted"></div></div>'+
      '<div id="stMain" class="st-hide">'+
      '<div class="st-card st-create-compact"><div class="st-title">۲. ساخت ترم</div><form id="stCreate">'+'<input id="stName" type="hidden">'+
      '<div class="st-grid st-term-grid">'+
      '<div class="st-field"><label>شروع ترم شمسی</label><div class="st-date-wrap"><input id="stStart" data-jalali-date type="text" placeholder="تاریخ شروع" required><button type="button" class="st-calendar-btn" data-calendar="stStart">▦</button></div></div>'+
      '<div class="st-field"><label>پایان ترم شمسی</label><div class="st-date-wrap"><input id="stEnd" data-jalali-date type="text" placeholder="تاریخ پایان" required><button type="button" class="st-calendar-btn" data-calendar="stEnd">▦</button></div></div>'+
      '<div class="st-field"><label>تعداد جلسات</label><input id="stCount" type="number" min="1" max="100" step="1" value="8" required></div>'+
      '</div>'+
      '<div class="st-actions"><button class="st-btn primary" type="submit">ایجاد ترم و ادامه تنظیم جلسات</button></div></form></div>'+
      '<div class="st-card"><div class="st-title">۳. ترم‌های هنرجو</div><div class="st-field"><label>انتخاب ترم</label><select id="stTerm"><option value="">انتخاب ترم…</option></select></div></div>'+
      '<div id="stSchedule" class="st-hide">'+
      '<div class="st-card"><div class="st-title">افزودن و تنظیم جلسات ترم</div>'+
      '<div class="st-mode-switch"><button type="button" class="st-mode-btn" data-mode="manual">دستی</button><button type="button" class="st-mode-btn" data-mode="even">کلاس زوج</button><button type="button" class="st-mode-btn" data-mode="odd">کلاس فرد</button></div>'+
      '<div id="stManual" class="st-mode-panel st-hide"><div class="st-manual-pick"><button class="st-btn" type="button" id="stManualCalendar">انتخاب تاریخ جلسات از تقویم</button><span id="stManualCount" class="st-muted">هنوز تاریخی انتخاب نشده</span></div><div id="stManualSelected" class="st-muted"></div></div>'+
      '<div id="stWeekly" class="st-mode-panel st-hide"><div class="st-weekly-top"><label class="st-compact-field">ساعت شروع <input type="time" id="stWeeklyTime" value="18:00"></label></div><div id="stEvenPanel" class="st-day-panel st-hide"><div class="st-muted">روزهای زوج را انتخاب کن</div><div id="stEvenDays" class="st-day-picks"></div><button class="st-btn" type="button" id="stMakeEven">ساخت جلسات زوج</button></div><div id="stOddPanel" class="st-day-panel st-hide"><div class="st-muted">روزهای فرد را انتخاب کن</div><div id="stOddDays" class="st-day-picks"></div><button class="st-btn" type="button" id="stMakeOdd">ساخت جلسات فرد</button></div></div>'+
      '<div id="stDraftTable" class="st-table-wrap"></div><div class="st-actions"><button class="st-btn" type="button" id="stSave">ذخیره موقت جلسات</button><button class="st-btn primary" type="button" id="stPublish">ثبت نهایی ترم و نمایش برنامه به هنرجو</button></div></div>'+
      '</div></div>'+
      '<div id="stFeedback" class="request-feedback" role="status" aria-live="polite"></div>';
    const save=$('autoCommitBtn');work.insertBefore(p,save||null);
    /* Student menu stays inside its picker so its position and theme remain scoped to the admin panel. */
    const termCard=p.querySelector('.st-create-compact'),schedulePanel=p.querySelector('#stSchedule');if(termCard&&schedulePanel)termCard.appendChild(schedulePanel);
    bindJalaliDates(p);
    enhanceAllSelects(p);
    const selectObserver=new MutationObserver(records=>records.forEach(rec=>{if(rec.type!=='childList')return;if(rec.target.tagName==='SELECT')refreshCustomSelect(rec.target);rec.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('#studentTermsTab select'))enhanceSelect(n);n.querySelectorAll?.('#studentTermsTab select,select').forEach(enhanceSelect);}});}));
    selectObserver.observe(p,{childList:true,subtree:true});
    initTermCalendars(p);
    bindJalaliDates(p);
    $('stStart').addEventListener('change',()=>{syncTermName();if(!$('stDate').value)$('stDate').value=$('stStart').value;});
      const weekNames=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
      const renderDayPicks=(id,days)=>{$(id).innerHTML=days.map(i=>'<label class="st-day-chip"><input type="checkbox" value="'+i+'" checked><span>'+weekNames[i]+'</span></label>').join('');};renderDayPicks('stEvenDays',[0,2,4]);renderDayPicks('stOddDays',[1,3,5]);
      p.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{const mode=btn.dataset.mode;$('stManual').classList.toggle('st-hide',mode!=='manual');$('stWeekly').classList.toggle('st-hide',mode==='manual');$('stEvenPanel').classList.toggle('st-hide',mode!=='even');$('stOddPanel').classList.toggle('st-hide',mode!=='odd');p.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===btn));}));
      const todayFa=jalaliInput(localDate(new Date()));$('stStart').value=todayFa;$('stEnd').value=todayFa;syncTermName();
    $('stStudentTrigger').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const menu=$('stStudentMenu');const open=menu.hidden;menu.hidden=!open;$('stStudentTrigger').setAttribute('aria-expanded',String(open));});
    $('stStudentMenu').addEventListener('click',e=>{const item=e.target.closest('[data-student-id]');if(!item)return;const id=item.dataset.studentId;S.studentId=id;$('stStudentSelected').textContent=item.textContent;$('stStudentMenu').hidden=true;$('stStudentTrigger').setAttribute('aria-expanded','false');$('stStudentMenu').querySelectorAll('[data-student-id]').forEach(x=>x.classList.toggle('selected',x===item));loadStudent(id);});
    document.addEventListener('pointerdown',e=>{if(!e.target.closest('.st-student-picker')){$('stStudentMenu').hidden=true;$('stStudentTrigger').setAttribute('aria-expanded','false');}});
    $('stSummary').addEventListener('click',e=>{if(e.target.closest('#stPublicLinkBtn'))makeStudentPublicLink();});
    $('stCreate').addEventListener('submit',createTerm);
    $('stTerm').addEventListener('change',e=>loadTerm(e.target.value));
     $('stMakeEven').addEventListener('click',()=>makeWeekly('even'));
     $('stMakeOdd').addEventListener('click',()=>makeWeekly('odd'));
     initManualMultiCalendar(p);
    $('stSave').addEventListener('click',saveDraft);
    $('stPublish').addEventListener('click',publish);
    b.addEventListener('click',()=>{if(gym20OwnerAuthorized)loadStudents();else say('ابتدا وارد پنل مدیر شوید.',true);});
  }

  async function loadStudents(){
    try{say('در حال دریافت هنرجویان…');const {data,error}=await db().from('students').select('id,full_name,phone,birth_date,is_active').eq('is_active',true).order('full_name');if(error)throw error;S.students=data||[];
      $('stStudentMenu').innerHTML=S.students.map(x=>'<button type="button" class="st-student-option '+(x.id===S.studentId?'selected':'')+'" data-student-id="'+x.id+'"><span>'+esc(x.full_name)+'</span><small>'+esc(x.phone||'بدون شماره')+'</small></button>').join('')||'<div class="st-muted">هنرجویی ثبت نشده است.</div>';
      const selected=S.students.find(x=>x.id===S.studentId);$('stStudentSelected').textContent=selected?(selected.full_name+' — '+(selected.phone||'بدون شماره')):'انتخاب هنرجو…';
      if(S.studentId&&S.students.some(x=>x.id===S.studentId)){await loadStudent(S.studentId);}else say(fa(S.students.length)+' هنرجوی فعال دریافت شد.');
    }catch(e){say(e.message||'دریافت هنرجویان ناموفق بود.',true);}
  }

  async function loadStudent(id){
    S.studentId=id;S.termId='';S.terms=[];S.enrollments=[];$('stMain').classList.toggle('st-hide',!id);$('stSchedule').classList.add('st-hide');if(!id)return;
    try{say('در حال دریافت پرونده هنرجو…');const student=S.students.find(x=>x.id===id);
      const [er,tr]=await Promise.all([
        db().from('enrollments').select('id,course_id,class_type,age_group,total_sessions,start_date,end_date,status,courses(name)').eq('student_id',id).order('created_at'),
        db().from('student_terms').select('id,term_name,start_date,end_date,total_sessions,duration_minutes,default_venue,schedule_mode,status,published_version_id,created_at').eq('student_id',id).order('created_at',{ascending:false})
      ]);
      if(er.error)throw er.error;if(tr.error)throw tr.error;S.enrollments=er.data||[];S.terms=tr.data||[];const activeCounts=S.enrollments.filter(e=>e.status==='active').map(e=>Number(e.total_sessions)||0).filter(n=>n>0);if(activeCounts.length)$('stCount').value=String(Math.max(...activeCounts));
      $('stSummary').innerHTML='<b>'+esc(student?.full_name||'')+'</b> · '+esc(student?.phone||'—')+'<br>تعداد سبک‌ها: '+fa(S.enrollments.length)+' · تولد: '+esc(student?.birth_date||'ثبت نشده')+'<div id="stPublicLinkBox" class="st-public-link"><div class="st-actions"><button type="button" class="st-btn primary" id="stPublicLinkBtn">🔗 ساخت لینک اختصاصی</button><span id="stPublicLinkStatus" class="st-muted">در حال بررسی لینک…</span></div></div>';
      loadStudentPublicLink();
      $('stTerm').innerHTML='<option value="">انتخاب ترم…</option>'+S.terms.map(t=>'<option value="'+t.id+'">'+esc(t.term_name)+'</option>').join('');
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
      const activeEnrollments=S.enrollments.filter(e=>e.status==='active');
      const ids=activeEnrollments.map(x=>x.id);
      if(!ids.length)throw Error('برای این هنرجو سبک فعالی در ثبت‌نام اولیه پیدا نشد.');
      const count=Number($('stCount').value),duration=60,startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value);
      if(!Number.isInteger(count)||count<1||count>100)throw Error('تعداد جلسات باید بین ۱ تا ۱۰۰ باشد.');if(!startDate||!endDate||endDate<startDate)throw Error('تاریخ شروع و پایان ترم را درست انتخاب کن.');
      const p=enDigits($('stStart').value).split('/').map(Number),termName='ترم '+['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'][p[1]-1]+' '+p[0];const exists=await db().from('student_terms').select('id').eq('student_id',S.studentId).ilike('term_name',termName).limit(1);if(exists.error)throw exists.error;if(exists.data?.length)throw Error('این ترم برای این هنرجو قبلاً ثبت شده است؛ از فهرست ترم‌ها انتخابش کن.');
      say('در حال ثبت ترم…');
      const {data,error}=await db().rpc('create_student_term',{p_student_id:S.studentId,p_term_name:termName,p_start_date:startDate,p_end_date:endDate,p_total_sessions:count,p_duration_minutes:duration,p_default_venue:null,p_schedule_mode:'manual',p_enrollment_ids:ids});
      if(error)throw error;const x=Array.isArray(data)?data[0]:data;if(!x?.term_id)throw Error('ترم ساخته شد اما شناسه دریافت نشد.');
      await loadStudent(S.studentId);$('stTerm').value=x.term_id;await loadTerm(x.term_id);$('stName').value='';say('ترم «'+termName+'» با '+fa(count)+' جلسه ساخته شد. حالا جلسه‌ها را دستی اضافه کن یا الگوی روزهای زوج و فرد را بساز.');
    }catch(e){say(e.message||'ساخت ترم ناموفق بود.',true);}
  }

  async function loadTerm(id){
    S.manualDates=[];S.termId=id;S.term=S.terms.find(x=>x.id===id)||null;
    setTimeout(()=>enhanceAllSelects($('studentTermsTab')),0);S.draftId='';S.rows=[];S.publishedId=null;$('stSchedule').classList.toggle('st-hide',!id);if(!id)return;
    try{
      const {data,error}=await db().from('term_schedule_versions').select('id,status').eq('term_id',id).order('created_at',{ascending:false});if(error)throw error;
      const vs=data||[],draft=vs.find(v=>v.status==='draft'),pub=vs.find(v=>v.status==='published');S.draftId=draft?.id||'';S.publishedId=pub?.id||S.term.published_version_id||null;
      if(S.draftId){await loadDraftRows();await renderBuilder();}else if(S.publishedId){$('stDraftTable').innerHTML='<button class="st-btn" id="stNewDraft">ساخت پیش‌نویس از نسخه منتشرشده</button>';$('stNewDraft').onclick=createDraft;$('stWeekly').classList.add('st-hide');$('stManual').classList.add('st-hide');}else{say('پیش‌نویس این ترم موجود نیست.',true);}
    }catch(e){say(e.message||'دریافت ترم ناموفق بود.',true);}
  }

  async function loadDraftRows(){
    if(!S.draftId)return;const {data,error}=await db().from('class_sessions').select('id,enrollment_id,session_number,starts_at,ends_at,venue,coach_name,notes,courses(name)').eq('schedule_version_id',S.draftId).order('starts_at');if(error)throw error;S.rows=(data||[]).map(x=>({...x,enrollment_ids:x.enrollment_id?[x.enrollment_id]:[]}));if(S.rows.length){const rr=await db().from('class_session_styles').select('session_id,enrollment_id').in('session_id',S.rows.map(x=>x.id));if(rr.error)throw rr.error;rr.data.forEach(z=>{const row=S.rows.find(x=>x.id===z.session_id);if(row)row.enrollment_ids.push(z.enrollment_id);});}
  }
  async function renderBuilder(){
    const {data:links,error}=await db().from('term_enrollments').select('enrollment_id').eq('term_id',S.termId);if(error)throw error;
    const ids=(links||[]).map(x=>x.enrollment_id);S.termEnrollmentIds=ids;
    $('stWeekly').classList.add('st-hide');$('stManual').classList.add('st-hide');
    $('stStart').value=jalaliInput(S.term.start_date||'');$('stEnd').value=jalaliInput(S.term.end_date||'');syncTermName();$('stCount').value=String(S.term.total_sessions||8);
    drawDraft();
  }
  function sessionState(r){
    const now=Date.now(),start=new Date(r.starts_at).getTime(),end=new Date(r.ends_at).getTime();
    if(end<=now)return {label:'برگزار شده',cls:'done'};
    if(start<=now&&now<end)return {label:'در حال برگزاری',cls:'live'};
    return {label:'جلسه آینده',cls:'upcoming'};
  }
  function drawDraft(){
    const sorted=S.rows.slice().sort((a,b)=>Number(a.session_number)-Number(b.session_number));
    if(!sorted.length){$('stDraftTable').innerHTML='<p class="st-muted">هنوز تاریخی انتخاب نشده است. از حالت دستی، چند تاریخ را در تقویم انتخاب کن.</p>';return;}
    const styleOptions=S.enrollments.filter(e=>(S.termEnrollmentIds||[]).includes(e.id));
    const weekdays=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
    $('stDraftTable').innerHTML=sorted.map((r,i)=>{
      const state=sessionState(r),d=new Date(r.starts_at),weekday=weekdays[d.getDay()];
      return '<article class="st-session-card"><header class="st-session-head"><b>جلسه '+fa(r.session_number)+' · '+weekday+'</b><span class="st-session-state '+state.cls+'">'+state.label+'</span></header><div class="st-session-fields"><label>تاریخ شمسی<input data-date="'+r.session_number+'" value="'+jalaliInput(localDate(r.starts_at))+'" data-jalali-date></label><label>ساعت کلاس<input type="time" data-time="'+r.session_number+'" value="'+localTime(r.starts_at)+'"></label><label>نام مربی<input type="text" maxlength="120" data-coach="'+r.session_number+'" value="'+esc(r.coach_name||'')+'" placeholder="نام مربی"></label><footer><button class="st-btn danger" type="button" data-del="'+i+'">حذف</button></footer></div></article>';
    }).join('');
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
      const mins=rowMinutes(r);
      const coachInput=$('stDraftTable').querySelector('[data-coach="'+n+'"]');
      if(!d||!t)throw Error('تاریخ یا ساعت یکی از جلسات معتبر نیست.');
      const start=localISO(d,t);
      return {enrollment_ids:r.enrollment_ids||[],session_number:n,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:r.venue||null,coach_name:coachInput?coachInput.value.trim():(r.coach_name||''),notes:r.notes||null};
    });
  }
  function makeWeekly(pattern){
    try{const startDate=gregorianInput($('stStart').value),endDate=gregorianInput($('stEnd').value),t=$('stWeeklyTime').value,n=Number($('stCount').value||S.term.total_sessions),mins=Number(S.term.duration_minutes)||60;if(!startDate||!endDate||!t)throw Error('تاریخ شروع، پایان ترم و ساعت کلاس را بررسی کن.');
      const id=pattern==='even'?'stEvenDays':'stOddDays',allowed=Array.from($(id).querySelectorAll('input:checked')).map(x=>Number(x.value));if(!allowed.length)throw Error('حداقل یک روز را انتخاب کن.');
      const selected=[];let cursor=new Date(startDate+'T12:00:00'),last=new Date(endDate+'T12:00:00');while(cursor<=last&&selected.length<n){const d=cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0')+'-'+String(cursor.getDate()).padStart(2,'0'),weekday=(cursor.getDay()+1)%7;if(allowed.includes(weekday))selected.push(d);cursor.setDate(cursor.getDate()+1);}
      if(selected.length<n)throw Error('در بازه ترم فقط '+selected.length+' جلسه پیدا شد؛ پایان ترم را افزایش بده یا روزهای بیشتری انتخاب کن.');
      S.rows=selected.map((d,i)=>{const start=localISO(d,t);return {enrollment_ids:[],session_number:i+1,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:null,coach_name:null,notes:null};});drawDraft();say(fa(n)+' جلسه ساخته شد؛ ساعت و مربی هر جلسه را می‌توانی جداگانه تنظیم کنی.');
    }catch(e){say(e.message,true);}
  }
  function initManualMultiCalendar(root){
    const trigger=$('stManualCalendar');if(!trigger)return;
    trigger.addEventListener('click',()=>{
      document.querySelectorAll('.st-jcal').forEach(x=>x.remove());
      const pop=document.createElement('div');pop.className='st-jcal';document.body.appendChild(pop);
      const today=enDigits(jalaliInput(localDate(new Date()))).split('/').map(Number);
      let jy=today[0],jm=today[1];const chosen=new Set(S.manualDates);
      const draw=()=>{
        const g=jalaliToGregorian(jy,jm,1),next=jm===12?jalaliToGregorian(jy+1,1,1):jalaliToGregorian(jy,jm+1,1),first=new Date(g+'T12:00:00'),days=Math.round((new Date(next+'T12:00:00')-first)/86400000),offset=(first.getDay()+1)%7;
        pop.innerHTML='<div class="st-jcal-head"><button type="button" data-prev>‹</button><b>'+['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'][jm-1]+' '+fa(jy)+'</b><button type="button" data-next>›</button></div><div class="st-jcal-grid">'+['ش','ی','د','س','چ','پ','ج'].map(x=>'<span>'+x+'</span>').join('')+Array(offset).fill('<i></i>').join('')+Array.from({length:days},(_,i)=>{const d=jy+'/'+String(jm).padStart(2,'0')+'/'+String(i+1).padStart(2,'0'),iso=gregorianInput(d);return '<button type="button" class="st-jcal-day '+(chosen.has(iso)?'selected':'')+'" data-day="'+(i+1)+'">'+fa(i+1)+'</button>';}).join('')+'</div><div class="st-actions"><button type="button" class="st-btn primary" data-confirm>تأیید تاریخ‌ها ('+fa(chosen.size)+')</button></div>';
        pop.querySelector('[data-prev]').onclick=()=>{if(--jm<1){jm=12;jy--;}draw();};pop.querySelector('[data-next]').onclick=()=>{if(++jm>12){jm=1;jy++;}draw();};
        pop.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const d=jy+'/'+String(jm).padStart(2,'0')+'/'+String(Number(b.dataset.day)).padStart(2,'0'),iso=gregorianInput(d);chosen.has(iso)?chosen.delete(iso):chosen.add(iso);draw();});
        pop.querySelector('[data-confirm]').onclick=()=>{S.manualDates=Array.from(chosen).sort();const mins=Number(S.term.duration_minutes)||60,t='18:00';const existing=new Set(S.rows.map(x=>localDate(x.starts_at)));let nextNo=Math.max(0,...S.rows.map(x=>Number(x.session_number)||0))+1;S.manualDates.filter(d=>!existing.has(d)).forEach(d=>{const start=localISO(d,t);S.rows.push({enrollment_ids:[],session_number:nextNo++,starts_at:start,ends_at:new Date(new Date(start).getTime()+mins*60000).toISOString(),venue:null,coach_name:null,notes:null});});$('stManualCount').textContent=fa(S.manualDates.length)+' تاریخ انتخاب شده';$('stManualSelected').textContent=S.manualDates.map(d=>jalaliInput(d)).join('، ');drawDraft();pop.remove();say(fa(S.manualDates.length)+' تاریخ انتخاب شد؛ ساعت و مربی هر جلسه را در جدول تنظیم کن.');};
      };
      const rect=trigger.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-260,rect.left+rect.width/2-126))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-350,rect.bottom+5))+'px';draw();
      const close=e=>{if(!pop.contains(e.target)&&e.target!==trigger){pop.remove();document.removeEventListener('pointerdown',close);}};setTimeout(()=>document.addEventListener('pointerdown',close),0);
    });
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