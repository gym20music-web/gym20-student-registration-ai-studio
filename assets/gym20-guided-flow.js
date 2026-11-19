/* GYM20 guided public registration flow — additive, no form/layout replacement */
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
    .gym20-flow-done{opacity:.82;transition:opacity .25s ease}
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

  let active = null;
  const steps = [
    {id:'ageGroup', hint:'مرحله ۱ از ۶ · رده سنی را انتخاب کنید'},
    {id:'classType', hint:'مرحله ۲ از ۶ · نوع برگزاری کلاس را انتخاب کنید'},
    {id:'sessionsCount', hint:'مرحله ۳ از ۶ · تعداد جلسات ترم را انتخاب کنید'},
    {id:'stylesList', hint:'مرحله ۴ از ۶ · سبک یا سبک‌های موردنظر را انتخاب کنید'},
    {id:'publicRegistrationCard', hint:'مرحله ۵ از ۶ · اطلاعات هنرجو را وارد کنید'},
    {id:'dynamicRulesBox', hint:'مرحله ۶ از ۶ · شرایط را مطالعه و تأیید کنید'}
  ];
  function clear(){
    document.querySelectorAll('.gym20-flow-current').forEach(el=>el.classList.remove('gym20-flow-current'));
    document.querySelectorAll('.gym20-flow-hint').forEach(el=>el.remove());
  }
  function focusStep(id, hint, scroll=true){
    const el=document.getElementById(id);
    if(!el || el.offsetParent===null) return;
    clear(); active=id; el.classList.add('gym20-flow-current');
    const note=document.createElement('div');
    note.className='gym20-flow-hint'; note.textContent=hint;
    el.insertAdjacentElement('beforebegin',note);
    if(scroll) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80);
  }
  function focusByIndex(i){const s=steps[i];if(s)focusStep(s.id,s.hint);}
  const originalSelect=window.gym20SelectRegion;
  if(typeof originalSelect==='function'){
    window.gym20SelectRegion=function(){
      const result=originalSelect.apply(this,arguments);
      setTimeout(()=>focusByIndex(0),180);
      return result;
    };
  }
  document.addEventListener('click',function(e){
    const pill=e.target.closest('.pill-btn');
    if(pill){
      const group=pill.closest('#ageGroup,#classType,#sessionsCount');
      if(!group)return;
      setTimeout(()=>{
        if(group.id==='ageGroup') focusByIndex(1);
        else if(group.id==='classType') focusByIndex(2);
        else if(group.id==='sessionsCount') focusByIndex(3);
      },60);
      return;
    }
    const chosenStyle=e.target.closest('#stylesList .style-item');
    if(chosenStyle){setTimeout(()=>focusByIndex(4),80);return;}
    if(e.target.closest('#acceptRules')){
      setTimeout(()=>{
        const payment=document.getElementById('paymentSection');
        if(document.getElementById('acceptRules')?.checked && payment){
          focusStep('paymentSection','پرداخت شهریه و تأیید نهایی',true);
        }
      },80);
    }
    if(e.target.closest('#regPaymentConfirmed')){
      setTimeout(()=>{
        const submit=document.getElementById('regSubmitBtn');
        if(document.getElementById('regPaymentConfirmed')?.checked && submit){
          focusStep('regSubmitBtn','همه مراحل تکمیل شد · درخواست ثبت‌نام را ارسال کنید',true);
        }
      },80);
    }
  });
  document.addEventListener('change',function(e){
    if(e.target.id==='acceptRules' && !e.target.checked) clear();
    if(e.target.id==='regPaymentConfirmed' && !e.target.checked) clear();
  });
  // Initial state: wait until a region is chosen; never auto-select anything.
  console.info('[GYM20] Guided registration flow ready');
})();