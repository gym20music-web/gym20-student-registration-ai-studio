/* GYM20 compact guided registration popover — additive, preserves form and selections */
(function(){
  'use strict';
  if(window.__gym20GuidedFlowInstalled) return;
  window.__gym20GuidedFlowInstalled = true;

  const style=document.createElement('style');
  style.id='gym20-guided-flow-style';
  style.textContent=`
    .gym20-flow-current{
      position:relative!important;border-radius:12px!important;
      outline:1px solid rgba(214,179,90,.68)!important;outline-offset:2px!important;
      box-shadow:0 0 0 3px rgba(214,179,90,.08),0 6px 18px rgba(0,0,0,.14)!important;
      transition:outline-color .22s ease,box-shadow .22s ease!important;
    }
    #regPhone.gym20-phone-invalid{border:1.5px solid #e05252!important;outline:2px solid rgba(224,82,82,.18)!important;outline-offset:1px!important;box-shadow:0 0 0 3px rgba(224,82,82,.12)!important;}
    .gym20-flow-pop{
      position:fixed;z-index:2147483000;display:flex;align-items:center;justify-content:center;
      min-width:66px;height:27px;padding:0 11px;box-sizing:border-box;
      border:1px solid rgba(218,190,126,.68);border-radius:9px;
      background:rgba(29,31,33,.96);color:#e8d19a;
      box-shadow:0 5px 18px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.045);
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      font:600 10px/1 Vazirmatn,sans-serif;white-space:nowrap;
      opacity:0;transform:translateY(4px) scale(.97);pointer-events:none;
      transition:opacity .18s ease,transform .18s ease;
    }
    .gym20-flow-pop.is-visible{opacity:1;transform:translateY(0) scale(1)}
    .gym20-flow-pop::after{
      content:'';position:absolute;left:50%;top:-6px;width:10px;height:10px;
      background:rgba(29,31,33,.96);border-right:1px solid rgba(218,190,126,.68);
      border-bottom:1px solid rgba(218,190,126,.68);transform:translateX(-50%) rotate(225deg);
    }
    @media(prefers-reduced-motion:reduce){.gym20-flow-pop{transition:none}.gym20-flow-current{transition:none!important}}
    body.region-sheet-open .gym20-flow-current{outline:0!important;outline-offset:0!important;box-shadow:none!important;}
    body.region-sheet-open .gym20-flow-pop{display:none!important;}
  `;
  document.head.appendChild(style);

  let pop=null,activeTarget=null,styleAdvanceTimer=null,formGuideStage=0;
  document.addEventListener('DOMContentLoaded',watchAdminModal,{once:true});
  if(document.readyState!=='loading')watchAdminModal();
  function ensurePop(){
    if(pop&&pop.isConnected)return pop;
    pop=document.createElement('div');pop.className='gym20-flow-pop';pop.textContent='انتخاب کن';
    pop.setAttribute('role','note');pop.setAttribute('aria-label','انتخاب کن');
    document.body.appendChild(pop);return pop;
  }
  function clear(){
    document.querySelectorAll('.gym20-flow-current').forEach(el=>el.classList.remove('gym20-flow-current'));
    if(pop){pop.classList.remove('is-visible');}
    activeTarget=null;
  }
  function adminIsOpen(){
    const modal=document.getElementById('adminModal');
    if(!modal||modal.hidden||modal.getAttribute('aria-hidden')==='true')return false;
    const display=getComputedStyle(modal).display;
    return modal.style.display!=='none'&&display!=='none';
  }
  function syncAdminVisibility(){
    if(!adminIsOpen()){if(pop)pop.style.display='';return;}
    document.querySelectorAll('.gym20-flow-current').forEach(el=>el.classList.remove('gym20-flow-current'));
    if(pop){pop.classList.remove('is-visible');pop.style.display='none';}
    activeTarget=null;
  }
  const adminObserver=new MutationObserver(()=>syncAdminVisibility());
  function watchAdminModal(){
    const modal=document.getElementById('adminModal');
    if(modal)adminObserver.observe(modal,{attributes:true,attributeFilter:['class','style','aria-hidden']});
    adminObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
    syncAdminVisibility();
  }
  function visible(el){
    if(!el||el.hidden||el.getAttribute('aria-hidden')==='true')return false;
    const c=getComputedStyle(el);
    return c.display!=='none'&&c.visibility!=='hidden'&&el.getClientRects().length>0;
  }
  function place(){
    if(adminIsOpen()){syncAdminVisibility();return;}
    if(!activeTarget||!visible(activeTarget)||!pop)return;
    const r=activeTarget.getBoundingClientRect(),w=pop.offsetWidth||76,h=pop.offsetHeight||27;
    // Always keep the hint in its own space BELOW the focused control/heading.
    // This prevents it from covering labels, titles, or text inside the target.
    let left=r.right-w;
    let top=r.bottom+9;
    left=Math.max(8,Math.min(innerWidth-w-8,left));
    if(top+h>innerHeight-8)top=Math.max(8,r.top-h-9);
    pop.style.left=left+'px';pop.style.top=top+'px';
  }
  function targetFor(id){
    const selectors={
      ageGroup:'#pill_adult',
      classType:'#classType .pill-btn',
      sessionsCount:'#sessionsCount .pill-btn',
      stylesList:'#stylesList .style-item',
      tuition:'#finalPrice',
      publicRegistrationCard:'#regFullName',
      regFullName:'#regFullName',
      regPhone:'#regPhone',
      regBirthDateShamsi:'#regBirthDateShamsi',
      rulesSection:'.rule-agreement',
      acceptRules:'.rule-agreement',
      paymentSection:'#regPaymentConfirmed',
      regSubmitBtn:'#regSubmitBtn'
    };
    const selector=selectors[id]||('#'+id);
    // Several legacy form fragments share IDs. Always target the rendered copy,
    // not the first (possibly hidden) duplicate returned by querySelector.
    return Array.from(document.querySelectorAll(selector)).find(visible)||null;
  }
  function focusStep(id,scroll=true,message='انتخاب کن'){
    if(adminIsOpen()){syncAdminVisibility();return false;}
    const anchor=targetFor(id);
    if(!anchor)return false;
    clear();activeTarget=anchor;anchor.classList.add('gym20-flow-current');
    ensurePop();pop.textContent=message;place();
    requestAnimationFrame(()=>{place();pop.classList.add('is-visible');});
    if(scroll)requestAnimationFrame(()=>anchor.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}));
    // Highlighting the styles step must not start the timer: preselected styles are not user confirmation.
    return true;
  }
  const stepIds=['ageGroup','classType','sessionsCount','stylesList','publicRegistrationCard'];
  function focusFrom(index){
    for(let i=index;i<stepIds.length;i++)if(focusStep(stepIds[i],true))return;
  }
  const originalSelect=window.gym20SelectRegion;
  if(typeof originalSelect==='function'){
    window.gym20SelectRegion=function(){
      const result=originalSelect.apply(this,arguments);
      setTimeout(()=>focusFrom(0),180);return result;
    };
  }
  // Start one 6-second grace period on the first selected style.
  // Further selections do not restart it; selecting every available style advances immediately.
  window.gym20GuidedFlowStyleSelected=function(){
    const items=Array.from(document.querySelectorAll('#stylesList .style-item'));
    const selected=items.filter(item=>item.classList.contains('selected')).length;
    if(!selected){
      if(styleAdvanceTimer)clearTimeout(styleAdvanceTimer);
      styleAdvanceTimer=null;
      return;
    }
    const advance=()=>{
      if(styleAdvanceTimer)clearTimeout(styleAdvanceTimer);
      styleAdvanceTimer=null;
      formGuideStage=0;
      focusStep('regFullName',true,'بنویس');
    };
    if(items.length&&selected===items.length){
      advance();
      return;
    }
    if(styleAdvanceTimer)return;
    styleAdvanceTimer=setTimeout(advance,6000);
  };

  document.addEventListener('click',function(e){
    const target=e.target instanceof Element?e.target:e.target?.parentElement;
    if(!target)return;
    const pill=target.closest('.pill-btn');
    if(pill){
      const group=pill.closest('#ageGroup,#classType,#sessionsCount');
      if(!group)return;
      const next={ageGroup:1,classType:2,sessionsCount:3}[group.id];
      if(next!==undefined)setTimeout(()=>focusFrom(next),100);
      return;
    }
    if(target.closest('#txt_rulesSection')||target.closest('#dynamicRulesBox')){
      if(!document.getElementById('acceptRules')?.checked)focusStep('acceptRules',true,'انتخاب کن');
    }
    if(target.closest('#acceptRules')){
      setTimeout(()=>{if(document.getElementById('acceptRules')?.checked)focusStep('paymentSection',true);},100);
    }
    if(target.closest('#regPaymentConfirmed')){
      setTimeout(()=>{if(document.getElementById('regPaymentConfirmed')?.checked)focusStep('regSubmitBtn',true);},100);
    }
  });
  const registrationForm=document.getElementById('publicRegistrationForm');
  if(registrationForm){
    // Advance only when the student actually starts typing in each field.
    registrationForm.addEventListener('input',function(e){
      const field=e.target;
      if(!(field instanceof HTMLInputElement))return;
      if(field.id==='regPhone')field.classList.remove('gym20-phone-invalid');
      if(field.id==='regFullName'&&field.value.trim()&&formGuideStage<1){
        formGuideStage=1;focusStep('regPhone',true,'بنویس');
      }else if(field.id==='regPhone'&&field.value.trim()&&formGuideStage<2){
        formGuideStage=2;focusStep('regBirthDateShamsi',true,'بنویس');
      }else if(field.id==='regBirthDateShamsi'&&field.value.trim()&&formGuideStage<3){
        formGuideStage=3;focusStep('acceptRules',true,'انتخاب کن');
      }
    });
  }
  document.addEventListener('change',function(e){
    if((e.target.id==='acceptRules'||e.target.id==='regPaymentConfirmed')&&!e.target.checked)clear();
  });
  addEventListener('scroll',place,{passive:true});
  addEventListener('resize',place);
  console.info('[GYM20] Compact guided popover ready');
})();