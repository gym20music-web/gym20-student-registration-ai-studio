/* GYM20 guided public registration flow — additive, preserves the existing form and layout */
(function(){
  'use strict';
  if(window.__gym20GuidedFlowInstalled) return;
  window.__gym20GuidedFlowInstalled = true;

  const style = document.createElement('style');
  style.id = 'gym20-guided-flow-style';
  style.textContent = `
    .gym20-flow-current{
      position:relative!important;
      border-radius:12px!important;
      outline:1px solid rgba(214,179,90,.72)!important;
      outline-offset:3px!important;
      box-shadow:0 0 0 3px rgba(214,179,90,.09),0 8px 22px rgba(0,0,0,.16)!important;
      transition:outline-color .25s ease,box-shadow .25s ease!important;
      animation:gym20FlowBreath 2.8s ease-in-out infinite;
    }
    .gym20-flow-hint{
      display:flex;align-items:center;gap:6px;margin:5px 2px 7px;
      color:#e3c77e;font:600 11px/1.7 Vazirmatn,sans-serif;
    }
    .gym20-flow-hint::before{content:'●';font-size:8px;color:#d6b35a}
    @keyframes gym20FlowBreath{
      0%,100%{box-shadow:0 0 0 2px rgba(214,179,90,.06),0 5px 16px rgba(0,0,0,.12)}
      50%{box-shadow:0 0 0 4px rgba(214,179,90,.12),0 7px 20px rgba(0,0,0,.17)}
    }
    @media(prefers-reduced-motion:reduce){.gym20-flow-current{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const steps = [
    {id:'ageGroup', hint:'مرحله ۱ · رده سنی را انتخاب کنید'},
    {id:'classType', hint:'مرحله ۲ · نوع برگزاری کلاس را انتخاب کنید'},
    {id:'sessionsCount', hint:'مرحله ۳ · تعداد جلسات ترم را انتخاب کنید'},
    {id:'stylesList', hint:'مرحله ۴ · سبک یا سبک‌های موردنظر را انتخاب کنید'},
    {id:'publicRegistrationCard', hint:'مرحله ۵ · اطلاعات هنرجو را وارد کنید'}
  ];

  function clear(){
    document.querySelectorAll('.gym20-flow-current').forEach(el=>el.classList.remove('gym20-flow-current'));
    document.querySelectorAll('.gym20-flow-hint').forEach(el=>el.remove());
  }
  function isVisible(el){
    if(!el || el.hidden || el.getAttribute('aria-hidden')==='true') return false;
    const css=window.getComputedStyle(el);
    return css.display!=='none' && css.visibility!=='hidden' && el.getClientRects().length>0;
  }
  function focusStep(id,hint,scroll=true){
    const el=document.getElementById(id);
    if(!isVisible(el)) return false;
    clear();
    el.classList.add('gym20-flow-current');
    const note=document.createElement('div');
    note.className='gym20-flow-hint';
    note.textContent=hint;
    el.insertAdjacentElement('beforebegin',note);
    if(scroll) requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'center'}));
    return true;
  }
  function focusFrom(index){
    for(let i=index;i<steps.length;i++){
      const step=steps[i];
      if(focusStep(step.id,step.hint,true)) return;
    }
  }

  const originalSelect=window.gym20SelectRegion;
  if(typeof originalSelect==='function'){
    window.gym20SelectRegion=function(){
      const result=originalSelect.apply(this,arguments);
      setTimeout(()=>focusFrom(0),180);
      return result;
    };
  }

  document.addEventListener('click',function(e){
    const target=e.target instanceof Element ? e.target : e.target.parentElement;
    if(!target) return;

    const pill=target.closest('.pill-btn');
    if(pill){
      const group=pill.closest('#ageGroup,#classType,#sessionsCount');
      if(!group) return;
      const nextIndex={ageGroup:1,classType:2,sessionsCount:3}[group.id];
      if(nextIndex!==undefined) setTimeout(()=>focusFrom(nextIndex),100);
      return;
    }

    if(target.closest('#stylesList .style-item')){
      setTimeout(()=>focusFrom(4),100);
      return;
    }

    if(target.closest('#acceptRules')){
      setTimeout(()=>{
        if(document.getElementById('acceptRules')?.checked){
          focusStep('paymentSection','پرداخت شهریه و تأیید نهایی',true);
        }
      },100);
    }

    if(target.closest('#regPaymentConfirmed')){
      setTimeout(()=>{
        if(document.getElementById('regPaymentConfirmed')?.checked){
          focusStep('regSubmitBtn','همه مراحل تکمیل شد · درخواست ثبت‌نام را ارسال کنید',true);
        }
      },100);
    }
  });

  document.addEventListener('change',function(e){
    if((e.target.id==='acceptRules' || e.target.id==='regPaymentConfirmed') && !e.target.checked) clear();
  });

  console.info('[GYM20] Guided registration flow ready');
})();