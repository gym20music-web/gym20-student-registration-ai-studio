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
      content:'';position:absolute;left:50%;bottom:-6px;width:10px;height:10px;
      background:rgba(29,31,33,.96);border-right:1px solid rgba(218,190,126,.68);
      border-bottom:1px solid rgba(218,190,126,.68);transform:translateX(-50%) rotate(45deg);
    }
    @media(prefers-reduced-motion:reduce){.gym20-flow-pop{transition:none}.gym20-flow-current{transition:none!important}}
  `;
  document.head.appendChild(style);

  let pop=null,activeTarget=null;
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
  function visible(el){
    if(!el||el.hidden||el.getAttribute('aria-hidden')==='true')return false;
    const c=getComputedStyle(el);
    return c.display!=='none'&&c.visibility!=='hidden'&&el.getClientRects().length>0;
  }
  function place(){
    if(!activeTarget||!visible(activeTarget)||!pop)return;
    const r=activeTarget.getBoundingClientRect(),w=pop.offsetWidth||76,h=pop.offsetHeight||27;
    let left=r.left+r.width/2-w/2,top=r.top-h-11;
    left=Math.max(8,Math.min(innerWidth-w-8,left));
    if(top<8)top=Math.min(innerHeight-h-10,r.bottom+11);
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
      rulesSection:'#txt_rulesSection',
      acceptRules:'.rule-agreement',
      paymentSection:'#regPaymentConfirmed',
      regSubmitBtn:'#regSubmitBtn'
    };
    const el=document.querySelector(selectors[id]||('#'+id));
    return visible(el)?el:null;
  }
  function focusStep(id,scroll=true){
    const anchor=targetFor(id);
    if(!anchor)return false;
    clear();activeTarget=anchor;anchor.classList.add('gym20-flow-current');
    ensurePop();place();
    requestAnimationFrame(()=>{place();pop.classList.add('is-visible');});
    if(scroll)requestAnimationFrame(()=>anchor.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}));
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
    if(target.closest('#stylesList .style-item')){
      setTimeout(()=>{
        if(focusStep('tuition',true)){
          const priceTarget=activeTarget;
          setTimeout(()=>{if(activeTarget===priceTarget)focusStep('publicRegistrationCard',true);},1700);
        }else focusStep('publicRegistrationCard',true);
      },100);return;
    }
    if(target.closest('#txt_rulesSection')||target.closest('#dynamicRulesBox')){
      if(!document.getElementById('acceptRules')?.checked){
        focusStep('rulesSection',false);
        const rulesTarget=activeTarget;
        setTimeout(()=>{if(activeTarget===rulesTarget&&!document.getElementById('acceptRules')?.checked)focusStep('acceptRules',true);},2200);
      }
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
    registrationForm.addEventListener('focusout',function(e){
      const next=e.relatedTarget;
      if(next&&(registrationForm.contains(next)||next.closest?.('.rule-agreement')))return;
      setTimeout(()=>{
        if(!registrationForm.contains(document.activeElement)&&!document.getElementById('acceptRules')?.checked){
          focusStep('rulesSection',true);
          const rulesTarget=activeTarget;
          setTimeout(()=>{if(activeTarget===rulesTarget&&!document.getElementById('acceptRules')?.checked)focusStep('acceptRules',true);},2200);
        }
      },120);
    });
  }
  document.addEventListener('change',function(e){
    if((e.target.id==='acceptRules'||e.target.id==='regPaymentConfirmed')&&!e.target.checked)clear();
  });
  addEventListener('scroll',place,{passive:true});
  addEventListener('resize',place);
  console.info('[GYM20] Compact guided popover ready');
})();