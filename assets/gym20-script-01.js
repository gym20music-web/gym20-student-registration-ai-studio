
let appData = {}, selectedThemeKey = "stealth", currentRegionId = "", currentAge = "adult", currentClassType = "normal", currentSessions = "8", selectedStyles = [], currentEditingRuleKey = "online", adminActiveEditingClassType = "normal", adminActiveRegionId = "", adminTgRecipients = [];

const regionDependentContentEl = document.getElementById('regionDependentContent'), stylesListEl = document.getElementById('stylesList'), finalPriceEl = document.getElementById('finalPrice'), priceBreakdownEl = document.getElementById('priceBreakdown'), acceptRulesEl = document.getElementById('acceptRules'), paymentSectionEl = document.getElementById('paymentSection'), toastEl = document.getElementById('toast'), classStatusNoticeBoxEl = document.getElementById('classStatusNoticeBox'), classNormalFlowContainerEl = document.getElementById('classNormalFlowContainer'), classRegistrationFlowEl = document.getElementById('classRegistrationFlow');
const customRegionDropdownEl = document.getElementById('customRegionDropdown'), customRegionTriggerEl = document.getElementById('customRegionTrigger'), customRegionMenuEl = document.getElementById('customRegionMenu'), customRegionSelectedTextEl = document.getElementById('customRegionSelectedText');

function safeSetText(id, val){const el=document.getElementById(id);if(el&&val!==undefined&&val!==null)el.innerText=val;}
function safeSetValue(id, val){const el=document.getElementById(id);if(el&&val!==undefined&&val!==null)el.value=val;}

function toEnglishDigits(s){return (s||'').toString().replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));}
function formatTomanPersian(n){if(!n)return "۰ تومان";return Number(n).toLocaleString('en-US').replace(/\d/g,d=>['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][d])+' تومان';}
function formatNumberEn(n){return n?Number(n.toString().replace(/\D/g,"")).toLocaleString('en-US'):"";}
function parsePureNumber(s){return Number(toEnglishDigits(s).replace(/\D/g,""))||0;}
function formatRegionDisplayName(r){if(!r)return {title:'',desc:''};const m=r.match(/^(.*?)\((.*?)\)$/);return m?{title:m[1].trim(),desc:m[2].trim()}:{title:r.trim(),desc:''};}

function cleanTelegramUsername(input) {
    if (!input) return '';
    return input.trim()
        .replace(/https?:\/\/t\.me\//i, '')
        .replace(/https?:\/\/telegram\.me\//i, '')
        .replace(/^@+/, '')
        .split('/')[0]
        .split('?')[0]
        .trim();
}

// تابع کپی امن با پشتیبانی از وب‌ویوهای تلگرام و ایتا
function safeCopyToClipboard(text, onSuccess) {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else {
        fallbackCopy(text, onSuccess);
    }
}

function fallbackCopy(text, onSuccess) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        if (onSuccess) onSuccess();
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
}

function selectTheme(t){selectedThemeKey=t;document.body.setAttribute('data-color-theme',t);document.querySelectorAll('.theme-card-option').forEach(e=>e.classList.remove('selected'));const c=document.getElementById('themeOpt_'+t);if(c)c.classList.add('selected');}
function switchSubTextTab(id){document.querySelectorAll('#textsTab .sub-text-panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('#textsTab .sub-tab-btn').forEach(b=>b.classList.remove('active'));const p=document.getElementById(id);if(p)p.classList.add('active');if(window.event)window.event.target.classList.add('active');}
function switchStylesSubTab(id){document.querySelectorAll('#stylesTab .sub-text-panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('#stylesTab > .sub-tab-group > .sub-tab-btn').forEach(b=>b.classList.remove('active'));const p=document.getElementById(id);if(p)p.classList.add('active');if(window.event)window.event.target.classList.add('active');}
function jalaliToGregorian(jy,jm,jd){jy=Number(jy);jm=Number(jm);jd=Number(jd);if(!jy||!jm||!jd||jm<1||jm>12||jd<1||jd>31)return null;var gy=(jy<=979)?621:1600;jy-=(jy<=979)?0:979;var days=(365*jy)+(Math.floor(jy/33)*8)+(Math.floor(((jy%33)+3)/4))+78+jd+((jm<7)?(jm-1)*31:((jm-7)*30)+186);gy+=400*Math.floor(days/146097);days%=146097;if(days>36524){gy+=100*Math.floor(--days/36524);days%=36524;if(days>=365)days++;}gy+=4*Math.floor(days/1461);days%=1461;gy+=Math.floor((days-1)/365);if(days>365)days=(days-1)%365;var gd=days+1;var sal_a=[0,31,((gy%4===0&&gy%100!==0)||(gy%400===0))?29:28,31,30,31,30,31,31,30,31,30,31];var gm;for(gm=0;gm<13;gm++){var v=sal_a[gm];if(gd<=v)break;gd -= v;}return gy+'-'+String(gm).padStart(2,'0')+'-'+String(gd).padStart(2,'0');}

const birthInput = document.getElementById('regBirthDateShamsi');
if(birthInput){birthInput.addEventListener('input',e=>{let v=toEnglishDigits(e.target.value).replace(/[^\d]/g,'');if(v.length>4&&v.length<=6)v=v.slice(0,4)+'/'+v.slice(4);else if(v.length>6)v=v.slice(0,4)+'/'+v.slice(4,6)+'/'+v.slice(6,8);e.target.value=v;});}

function renderCustomRegionDropdown(){
    if(!customRegionMenuEl||!customRegionSelectedTextEl)return;
    customRegionMenuEl.innerHTML="";
    const regions=appData.regions||[];
    const act=regions.find(r=>r.id===currentRegionId);
    if(act){const p=formatRegionDisplayName(act.name);customRegionSelectedTextEl.innerHTML=`<span style="color:var(--neon-blue);font-weight:800;font-size:.75rem;">📍 ${p.title}</span>${p.desc?`<span style="font-size:.62rem;color:var(--text-secondary);margin-right:4px;">(${p.desc.split(':')[0]||p.desc})</span>`:''}`;}
    else customRegionSelectedTextEl.innerHTML=`<span>📍</span><span>${(appData.titles&&appData.titles.regionSection)||'انتخاب منطقه در تهران...'}</span>`;
    const wheel=document.createElement('div');
    wheel.id='customRegionWheelList';
    wheel.className='region-wheel-list';
    wheel.setAttribute('role','listbox');
    wheel.setAttribute('aria-label','انتخاب منطقه');
    // Three identical cycles create a seamless, practically endless wheel.
    // The middle cycle is the resting zone; edge cycles are silently recycled.
    wheel.dataset.regionCount=String(regions.length);
    [0,1,2].forEach(copyIndex=>regions.forEach(reg=>{
        const isSel=reg.id===currentRegionId;
        const p=formatRegionDisplayName(reg.name);
        const item=document.createElement('div');
        item.className=`custom-dropdown-item region-wheel-item ${isSel?'selected':''}`;
        item.dataset.regionId=reg.id;
        item.dataset.regionCopy=String(copyIndex);
        item.setAttribute('role','option');
        item.setAttribute('aria-selected',String(isSel));
        item.innerHTML=`<div class="region-item-text"><div class="region-item-title">${p.title}</div>${p.desc?`<div class="region-item-sub">${p.desc}</div>`:''}</div><span class="region-item-check">✓</span>`;
        wheel.appendChild(item);
    }));
    customRegionMenuEl.appendChild(wheel);
    updateRegionDependentVisibility();
}

function selectRegion(id){currentRegionId=id;document.body.classList.remove('region-sheet-open');customRegionMenuEl.classList.remove('open');customRegionMenuEl.style.display='none';customRegionMenuEl.style.visibility='hidden';customRegionMenuEl.style.pointerEvents='none';customRegionTriggerEl.classList.remove('open');customRegionTriggerEl.setAttribute('aria-expanded','false');renderCustomRegionDropdown();updateRegionDependentVisibility();if(currentRegionId){updateClassStatusAndStylesFlow();calculatePrice();regionDependentContentEl.scrollIntoView({behavior:'smooth'});}}
function toggleCustomRegionMenu(e){if(e){e.preventDefault();e.stopPropagation();}if(!customRegionMenuEl||!customRegionTriggerEl)return;const o=!customRegionMenuEl.classList.contains('open');customRegionMenuEl.classList.toggle('open',o);customRegionTriggerEl.classList.toggle('open',o);}
window.gym20SelectRegion=selectRegion;
// Region dropdown interaction is handled by the independent fallback script below.
document.addEventListener('click',e=>{if(customRegionDropdownEl&&!customRegionDropdownEl.contains(e.target)){customRegionMenuEl.classList.remove('open');customRegionTriggerEl.classList.remove('open');}});
function updateRegionDependentVisibility(){regionDependentContentEl.style.display=currentRegionId?'block':'none';}

function updateClassStatusAndStylesFlow(){
    if(!appData.classTypesConfig)appData.classTypesConfig={};const cfg=appData.classTypesConfig[currentClassType]||{enabled:true,statusText:"",allowedStyles:[]};
    if(cfg.enabled===false){classStatusNoticeBoxEl.style.display='block';classStatusNoticeBoxEl.textContent=cfg.statusText||'ظرفیت ثبت‌نام تکمیل شده است.';classNormalFlowContainerEl.style.display='none';classRegistrationFlowEl.style.display='none';}
    else{classStatusNoticeBoxEl.style.display='none';classNormalFlowContainerEl.style.display='block';classRegistrationFlowEl.style.display='block';renderStyles();calculatePrice();}
}

function renderStyles(){
    stylesListEl.innerHTML="";const cfg=(appData.classTypesConfig&&appData.classTypesConfig[currentClassType])||{};const allowed=cfg.allowedStyles&&cfg.allowedStyles.length>0?cfg.allowedStyles:null;
    const avail=(appData.styles||[]).filter(s=>!allowed||allowed.includes(s.id));
    selectedStyles=selectedStyles.filter(id=>avail.some(s=>s.id===id));
    if(!selectedStyles.length&&avail.length)selectedStyles=[avail[0].id];
    if(!avail.length){stylesListEl.innerHTML='<div style="font-size:.68rem;color:var(--text-secondary);grid-column:1/-1;">سبکی برای این کلاس تعریف نشده است.</div>';return;}
    avail.forEach(st=>{
        const isSel=selectedStyles.includes(st.id);const item=document.createElement('div');item.className=`style-item ${isSel?'selected':''}`;
        item.innerHTML=`<span>${st.name||''}</span><span class="check-dot">${isSel?'✓':''}</span>`;
        item.onclick=()=>toggleStyle(st.id);stylesListEl.appendChild(item);
    });
}
function toggleStyle(id){if(selectedStyles.includes(id)){if(selectedStyles.length>1)selectedStyles=selectedStyles.filter(s=>s!==id);}else selectedStyles.push(id);renderStyles();calculatePrice();}

function switchAdminClassType(t){adminActiveEditingClassType=t;document.querySelectorAll('#sub_class_status .sub-tab-btn').forEach(b=>b.classList.remove('active'));if(window.event)window.event.target.classList.add('active');loadAdminClassTypeConfig();}
function loadAdminClassTypeConfig(){
    if(!appData.classTypesConfig)appData.classTypesConfig={};if(!appData.classTypesConfig[adminActiveEditingClassType])appData.classTypesConfig[adminActiveEditingClassType]={enabled:true,statusText:"",allowedStyles:(appData.styles||[]).map(s=>s.id)};
    const cfg=appData.classTypesConfig[adminActiveEditingClassType];
    const chk=document.getElementById('adminClassEnabledCheckbox'),txtWrap=document.getElementById('adminClassStatusTextWrapper'),txtInput=document.getElementById('adminClassStatusTextInput'),lbl=document.getElementById('adminClassEnabledLabel');
    if(chk)chk.checked=cfg.enabled!==false;if(txtInput)txtInput.value=cfg.statusText||'';if(txtWrap)txtWrap.style.display=chk&&chk.checked?'none':'block';if(lbl)lbl.textContent=chk&&chk.checked?'ثبت‌نام این کلاس باز و فعال است':'ثبت‌نام متوقف است (تکمیل ظرفیت / پیام سفارشی)';
    renderClassStylesChips();
}
function renderClassStylesChips(){
    const c=document.getElementById('adminClassStylesChips');if(!c)return;c.innerHTML="";
    const cfg=(appData.classTypesConfig&&appData.classTypesConfig[adminActiveEditingClassType])||{};const allowed=cfg.allowedStyles||(appData.styles||[]).map(s=>s.id);
    (appData.styles||[]).forEach(st=>{
        const isA=allowed.includes(st.id);const chip=document.createElement('div');chip.className=`style-item ${isA?'selected':''}`;chip.style.cssText="padding:4px 6px;font-size:.67rem;cursor:pointer;";
        chip.innerHTML=`<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${st.name}</span><span class="check-dot">${isA?'✓':''}</span>`;
        chip.onclick=()=>toggleStyleForAdminClass(st.id,!isA);c.appendChild(chip);
    });
}
function toggleAdminClassEnabled(en){if(!appData.classTypesConfig[adminActiveEditingClassType])appData.classTypesConfig[adminActiveEditingClassType]={};appData.classTypesConfig[adminActiveEditingClassType].enabled=en;document.getElementById('adminClassStatusTextWrapper').style.display=en?'none':'block';document.getElementById('adminClassEnabledLabel').textContent=en?'ثبت‌نام این کلاس باز و فعال است':'ثبت‌نام متوقف است (تکمیل ظرفیت / پیام سفارشی)';updateClassStatusAndStylesFlow();}
function updateAdminClassStatusText(v){if(!appData.classTypesConfig[adminActiveEditingClassType])appData.classTypesConfig[adminActiveEditingClassType]={};appData.classTypesConfig[adminActiveEditingClassType].statusText=v.trim();updateClassStatusAndStylesFlow();}
function toggleStyleForAdminClass(id,chk){
    if(!appData.classTypesConfig[adminActiveEditingClassType])appData.classTypesConfig[adminActiveEditingClassType]={};
    let list=appData.classTypesConfig[adminActiveEditingClassType].allowedStyles||(appData.styles||[]).map(s=>s.id);
    if(chk){if(!list.includes(id))list.push(id);}else list=list.filter(i=>i!==id);
    appData.classTypesConfig[adminActiveEditingClassType].allowedStyles=list;renderClassStylesChips();updateClassStatusAndStylesFlow();
}

function renderAdminRegionsNav(){
    if(!Array.isArray(appData.regions))appData.regions=[];
    if(!adminActiveRegionId||(!appData.regions.some(r=>r.id===adminActiveRegionId)&&adminActiveRegionId!=='new'))adminActiveRegionId=appData.regions.length?appData.regions[0].id:'new';
    const menu=document.getElementById('adminRegionWheelMenu');
    if(menu){
        menu.innerHTML='';
        const options=appData.regions.map((r,index)=>({id:String(r.id),name:r.name||'منطقه بدون نام',number:String(index+1).replace(/\\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])}));
        const wheel=document.createElement('div');
        wheel.id='adminRegionWheelList';
        wheel.setAttribute('role','listbox');
        wheel.setAttribute('aria-label','انتخاب منطقه برای مدیریت');
        wheel.dataset.regionCount=String(options.length);
        [0,1,2].forEach(copyIndex=>options.forEach(reg=>{
            const item=document.createElement('div');
            item.className='admin-region-wheel-item';
            item.dataset.regionId=reg.id;
            item.dataset.regionCopy=String(copyIndex);
            item.setAttribute('role','option');
            item.setAttribute('aria-selected',String(reg.id===adminActiveRegionId));
            const title=document.createElement('span');
            title.textContent=reg.number+' ـ '+reg.name;
            item.append(title);
            wheel.appendChild(item);
        }));
        menu.appendChild(wheel);
        bindAdminRegionWheel(wheel);
    }
    updateAdminRegionWheelLabel();
    loadActiveRegionDataIntoForm();
}
function updateAdminRegionWheelLabel(){
    const label=document.getElementById('adminRegionWheelSelectedText');
    if(!label)return;
    const active=appData.regions&&appData.regions.find(r=>String(r.id)===String(adminActiveRegionId));
    const activeIndex=active?(appData.regions||[]).findIndex(r=>String(r.id)===String(adminActiveRegionId)):-1;
    const activeNumber=activeIndex>=0?String(activeIndex+1).replace(/\\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])+' ـ ':'';
    label.textContent=adminActiveRegionId==='new'?'تعریف منطقه جدید':active?activeNumber+(active.name||'منطقه بدون نام'):'انتخاب منطقه';
}
function switchAdminRegion(id){
    adminActiveRegionId=id;
    const menu=document.getElementById('adminRegionWheelMenu'),trigger=document.getElementById('adminRegionWheelTrigger');
    if(menu){menu.classList.remove('open');menu.style.display='none';}
    if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false');}
    renderAdminRegionsNav();
}
function adminRegionWheel(){return document.getElementById('adminRegionWheelList');}
function updateAdminRegionWheelFocus(){
    const w=adminRegionWheel();if(!w)return null;
    const items=Array.from(w.querySelectorAll('.admin-region-wheel-item'));if(!items.length)return null;
    const center=w.getBoundingClientRect().top+w.clientHeight/2;
    let best=null,bestDistance=Infinity;
    for(const item of items){const r=item.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-center);if(d<bestDistance){best=item;bestDistance=d;}}
    items.forEach(item=>item.classList.toggle('wheel-focus',item===best));
    if(best)w._gym20PendingRegionId=best.dataset.regionId||'';
    return best;
}
function adminRegionCycleSize(w){
    const items=w.querySelectorAll('.admin-region-wheel-item'),count=Number(w.dataset.regionCount)||Math.floor(items.length/3);
    if(!count||items.length<count*3)return 0;
    return items[count].offsetTop-items[0].offsetTop;
}
function recycleAdminRegionWheel(w){
    const cycle=adminRegionCycleSize(w);if(!cycle)return;
    const y=w.scrollTop;
    if(y<cycle*.35)w.scrollTop=y+cycle;
    else if(y>cycle*1.65)w.scrollTop=y-cycle;
}
function centerAdminRegionWheel(id){
    const w=adminRegionWheel();if(!w)return;
    const item=Array.from(w.querySelectorAll('.admin-region-wheel-item')).find(x=>x.dataset.regionId===String(id)&&x.dataset.regionCopy==='1')||Array.from(w.querySelectorAll('.admin-region-wheel-item')).find(x=>x.dataset.regionId===String(id));
    if(!item)return;
    const top=item.offsetTop-(w.clientHeight-item.offsetHeight)/2;
    w.scrollTop=top;
    requestAnimationFrame(updateAdminRegionWheelFocus);
}
function bindAdminRegionWheel(w){
    if(w._gym20AdminRegionBound)return;
    w._gym20AdminRegionBound=true;
    w._gym20AdminRegionPointerDown=false;
    w._gym20AdminRegionGestureMoved=false;
    w._gym20AdminRegionDragged=false;
    w._gym20AdminRegionLastScrollTop=w.scrollTop;

    const settle=()=>{
        clearTimeout(w._gym20AdminRegionSettleTimer);
        if(!w._gym20AdminRegionGestureMoved||w._gym20AdminRegionPointerDown)return;
        w._gym20AdminRegionSettleTimer=setTimeout(()=>{
            if(w._gym20AdminRegionPointerDown||!w._gym20AdminRegionGestureMoved)return;
            const best=updateAdminRegionWheelFocus();
            if(best){
                const id=best.dataset.regionId;
                w._gym20AdminRegionGestureMoved=false;
                switchAdminRegion(id);
            }
        },760);
    };

    w.addEventListener('pointerdown',e=>{
        w._gym20AdminRegionPointerDown=true;
        w._gym20AdminRegionDragged=false;
        w._gym20AdminRegionGestureMoved=false;
        w._gym20AdminRegionStartX=e.clientX;
        w._gym20AdminRegionStartY=e.clientY;
        clearTimeout(w._gym20AdminRegionSettleTimer);
    },{passive:true});

    w.addEventListener('pointermove',e=>{
        if(!w._gym20AdminRegionPointerDown)return;
        const dx=Math.abs(e.clientX-w._gym20AdminRegionStartX);
        const dy=Math.abs(e.clientY-w._gym20AdminRegionStartY);
        if(dx>7||dy>7)w._gym20AdminRegionDragged=true;
        if(dy>7&&dy>dx*1.15)w._gym20AdminRegionGestureMoved=true;
    },{passive:true});

    const pointerEnd=()=>{
        if(!w._gym20AdminRegionPointerDown)return;
        w._gym20AdminRegionPointerDown=false;
        w._gym20AdminRegionStartX=null;
        w._gym20AdminRegionStartY=null;
        if(w._gym20AdminRegionGestureMoved)settle();
    };
    w.addEventListener('pointerup',pointerEnd,{passive:true});
    w.addEventListener('pointercancel',pointerEnd,{passive:true});

    w.addEventListener('wheel',()=>{
        w._gym20AdminRegionGestureMoved=true;
        settle();
    },{passive:true});

    w.addEventListener('scroll',()=>{
        const now=w.scrollTop,delta=Math.abs(now-w._gym20AdminRegionLastScrollTop);
        w._gym20AdminRegionLastScrollTop=now;
        if(delta>2&&w._gym20AdminRegionPointerDown)w._gym20AdminRegionGestureMoved=true;
        if(!w._gym20AdminRegionFrame){
            w._gym20AdminRegionFrame=requestAnimationFrame(()=>{
                w._gym20AdminRegionFrame=0;
                recycleAdminRegionWheel(w);
                updateAdminRegionWheelFocus();
            });
        }
        if(w._gym20AdminRegionGestureMoved&&!w._gym20AdminRegionPointerDown)settle();
    },{passive:true});
}
function toggleAdminRegionWheel(e){
    if(e){e.preventDefault();e.stopPropagation();}
    const menu=document.getElementById('adminRegionWheelMenu'),trigger=document.getElementById('adminRegionWheelTrigger'),w=adminRegionWheel();
    if(!menu||!trigger||!w)return;
    const open=!menu.classList.contains('open');
    menu.classList.toggle('open',open);trigger.classList.toggle('open',open);
    menu.style.display=open?'flex':'none';menu.style.visibility=open?'visible':'hidden';menu.style.pointerEvents=open?'auto':'none';
    trigger.setAttribute('aria-expanded',String(open));
    if(open){
        clearTimeout(w._gym20AdminRegionSettleTimer);
        w._gym20AdminRegionPointerDown=false;w._gym20AdminRegionGestureMoved=false;w._gym20AdminRegionDragged=false;
        w._gym20AdminRegionLastScrollTop=w.scrollTop;
        requestAnimationFrame(()=>{
            centerAdminRegionWheel(adminActiveRegionId);
            w._gym20AdminRegionLastScrollTop=w.scrollTop;
        });
    }
}
document.addEventListener('click',e=>{
    const wrap=document.getElementById('adminRegionWheelDropdown');
    if(!wrap||wrap.contains(e.target))return;
    const menu=document.getElementById('adminRegionWheelMenu'),trigger=document.getElementById('adminRegionWheelTrigger');
    const w=adminRegionWheel();if(w)clearTimeout(w._gym20AdminRegionSettleTimer);
    if(menu){menu.classList.remove('open');menu.style.display='none';menu.style.visibility='hidden';menu.style.pointerEvents='none';}
    if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false');}
},true);
document.addEventListener('click',e=>{
    const item=e.target&&e.target.closest?e.target.closest('.admin-region-wheel-item'):null;
    const menu=document.getElementById('adminRegionWheelMenu');
    if(!item||!menu||!menu.contains(item))return;
    e.preventDefault();e.stopPropagation();
    const w=adminRegionWheel();if(!w)return;
    if(w._gym20AdminRegionDragged){w._gym20AdminRegionDragged=false;w._gym20AdminRegionGestureMoved=true;return;}
    clearTimeout(w._gym20AdminRegionSettleTimer);
    w._gym20AdminRegionGestureMoved=false;
    switchAdminRegion(item.dataset.regionId);
},true);
function loadActiveRegionDataIntoForm(){
    const eC=document.getElementById('adminRegionEditCard'),nC=document.getElementById('adminRegionNewCard');if(!eC||!nC)return;
    if(adminActiveRegionId==='new'){eC.style.display='none';nC.style.display='block';}
    else{
        eC.style.display='block';nC.style.display='none';const r=appData.regions.find(x=>x.id===adminActiveRegionId);
        if(r){safeSetValue('activeRegionNameInput',r.name||'');safeSetValue('activeRegionKidsInput',formatNumberEn(r.kidsBase));safeSetValue('activeRegionAdultInput',formatNumberEn(r.adultBase));safeSetValue('activeRegionExtraInput',formatNumberEn(r.extraStylePrice));}
    }
}
function onActiveRegionFieldInput(){
    if(adminActiveRegionId==='new')return;const r=appData.regions.find(x=>x.id===adminActiveRegionId);if(!r)return;
    r.name=document.getElementById('activeRegionNameInput').value.trim();updateAdminRegionWheelLabel();r.kidsBase=parsePureNumber(document.getElementById('activeRegionKidsInput').value);r.adultBase=parsePureNumber(document.getElementById('activeRegionAdultInput').value);r.extraStylePrice=parsePureNumber(document.getElementById('activeRegionExtraInput').value);
    renderCustomRegionDropdown();calculatePrice();
}
function deleteActiveRegion(){
    if(!appData.regions||appData.regions.length<=1){alert('حداقل ۱ منطقه باید فعال بماند!');return;}
    const r=appData.regions.find(x=>x.id===adminActiveRegionId);if(!r)return;
    if(confirm(`حذف «${r.name}»؟`)){appData.regions=appData.regions.filter(x=>x.id!==adminActiveRegionId);if(currentRegionId===adminActiveRegionId)currentRegionId="";adminActiveRegionId=appData.regions[0].id;renderAdminRegionsNav();renderCustomRegionDropdown();calculatePrice();}
}
function saveNewRegionFromCard(){
    const n=document.getElementById('newRegNameInput').value.trim(),k=parsePureNumber(document.getElementById('newRegKidsInput').value),a=parsePureNumber(document.getElementById('newRegAdultInput').value),e=parsePureNumber(document.getElementById('newRegExtraInput').value);
    if(!n||!k||!a){alert('مشخصات و قیمت‌های پایه را کامل وارد کنید.');return;}
    const id="reg_"+Date.now();if(!Array.isArray(appData.regions))appData.regions=[];appData.regions.push({id,name:n,kidsBase:k,adultBase:a,extraStylePrice:e||500000});
    document.getElementById('newRegNameInput').value="";document.getElementById('newRegKidsInput').value="";document.getElementById('newRegAdultInput').value="";document.getElementById('newRegExtraInput').value="";
    adminActiveRegionId=id;renderAdminRegionsNav();renderCustomRegionDropdown();calculatePrice();
}

function renderAdminStylesList(){
    const c=document.getElementById('adminStylesListContainer');c.innerHTML="";
    (appData.styles||[]).forEach(st=>{
        const row=document.createElement('div');row.className='admin-style-row';
        row.innerHTML=`<input type="text" value="${st.name||''}" oninput="updateStyleName('${st.id}',this.value)"><button type="button" class="delete-style-btn" onclick="deleteStyle('${st.id}')">🗑️</button>`;
        c.appendChild(row);
    });
}
function addNewStyle(){
    const inp=document.getElementById('newStyleNameInput');const n=inp.value.trim();if(!n)return;
    const id="style_"+Date.now();if(!Array.isArray(appData.styles))appData.styles=[];appData.styles.push({id,name:n});
    inp.value="";renderAdminStylesList();renderClassStylesChips();updateClassStatusAndStylesFlow();
}
function updateStyleName(id,n){const t=appData.styles.find(s=>s.id===id);if(t){t.name=n;renderStyles();renderClassStylesChips();}}
function deleteStyle(id){
    if(appData.styles.length<=1){alert('حداقل ۱ سبک باید باقی بماند!');return;}
    if(confirm('حذف سبک؟')){appData.styles=appData.styles.filter(s=>s!==id);renderAdminStylesList();renderClassStylesChips();updateClassStatusAndStylesFlow();}
}

function updateDynamicRules(){
    const cN={normal:'عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP 👑',online:'آنلاین 🌐'};
    safeSetText('activeRuleBadge',`شرایط انتخابی: کلاس ${cN[currentClassType]||''} - ترم ${currentSessions} جلسه`);
    safeSetText('classTypeRuleText',(appData.rules&&appData.rules[currentClassType])||'');
    safeSetText('sessionRuleText',(appData.rules&&appData.rules['s'+currentSessions])||'');
    safeSetText('generalRuleText',(appData.rules&&appData.rules.general)||'');
}

function calculatePrice(){
    let act=appData.regions&&appData.regions.find(r=>r.id===currentRegionId);
    let kb=act?act.kidsBase:1500000, ab=act?act.adultBase:2000000, ep=act?act.extraStylePrice:500000;
    let base=(currentAge==="adult")?ab:kb, addon=(selectedStyles.length-1)*ep, sub=base+addon;
    let cf=(appData.multipliers&&appData.multipliers[currentClassType])||1.0, sf=(appData.sessionRates&&appData.sessionRates[currentSessions])||1.0;
    let tot=Math.round(sub*cf*sf);safeSetText('finalPrice',formatTomanPersian(tot));
    const cN={normal:'عمومی',semi:'نیمه‌خصوصی',private:'خصوصی',vip:'VIP',online:'آنلاین'}, aN={adult:'بزرگسال',kids:'کودک'}, rp=act?(act.name.split('(')[0].trim()+' | '):'';
    safeSetText('priceBreakdown',`${rp}${selectedStyles.length} سبک (${aN[currentAge]} - ${cN[currentClassType]} - ${currentSessions} جلسه)`);
    updateDynamicRules();
}

function setupPills(id,cb){const c=document.getElementById(id);c.querySelectorAll('.pill-btn').forEach(b=>{b.onclick=()=>{c.querySelectorAll('.pill-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');cb(b.getAttribute('data-val'));};});}
setupPills('ageGroup',v=>{currentAge=v;calculatePrice();});
setupPills('classType',v=>{currentClassType=v;updateClassStatusAndStylesFlow();});
setupPills('sessionsCount',v=>{currentSessions=v;calculatePrice();});

document.querySelectorAll('.accordion-header').forEach(h=>{h.onclick=()=>h.parentElement.classList.toggle('open');});
acceptRulesEl.onchange=e=>{paymentSectionEl.style.display=e.target.checked?'block':'none';if(!e.target.checked)document.getElementById('regPaymentConfirmed').checked=false;updateRegistrationSubmitState();if(e.target.checked)paymentSectionEl.scrollIntoView({behavior:'smooth'});};

if(toastEl){
    const hideCardCopyToast=()=>{
        window.clearTimeout(window.__gym20CardToastTimer);
        toastEl.classList.remove('show');
        toastEl.hidden=true;
        toastEl.setAttribute('aria-hidden','true');
    };
    hideCardCopyToast();
    window.addEventListener('pageshow',hideCardCopyToast);
    window.addEventListener('pagehide',hideCardCopyToast);
}
const copyCardButton=document.getElementById('copyCardBtn');
if(copyCardButton)copyCardButton.onclick=(event)=>{
    if(!event || !event.isTrusted) return;
    const cardNumber=appData.card&&appData.card.cleanNumber;
    if(!cardNumber) return;
    safeCopyToClipboard(cardNumber, ()=>{
        if(!toastEl) return;
        window.clearTimeout(window.__gym20CardToastTimer);
        toastEl.hidden=false;
        toastEl.setAttribute('aria-hidden','false');
        requestAnimationFrame(()=>toastEl.classList.add('show'));
        window.__gym20CardToastTimer=window.setTimeout(()=>{
            toastEl.classList.remove('show');
            toastEl.hidden=true;
            toastEl.setAttribute('aria-hidden','true');
        },2200);
    });
};

const themeBtnEl=document.getElementById('themeBtn');if(themeBtnEl){const applyGym20Theme=(light)=>{[document.documentElement,document.body,document.getElementById('adminModal')].filter(Boolean).forEach(el=>{if(light)el.setAttribute('data-theme','light');else el.removeAttribute('data-theme');});themeBtnEl.textContent=light?'☀️':'🌙';};themeBtnEl.addEventListener('click',()=>applyGym20Theme(document.body.getAttribute('data-theme')!=='light'));}
function switchAdminTab(tId){
  if(tId==='requestsTab'&&!gym20OwnerAuthorized){alert('برای مشاهده درخواست‌ها ابتدا با حساب مدیر وارد شوید.');return;}
  document.querySelectorAll('.admin-panel-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(b=>b.classList.remove('active'));
  const tab=document.getElementById(tId);if(tab)tab.classList.add('active');
  const btn=Array.from(document.querySelectorAll('.admin-tab-btn')).find(b=>b.getAttribute('onclick')===`switchAdminTab('${tId}')`);
  if(btn)btn.classList.add('active');
  const saveButton=document.getElementById('autoCommitBtn');
  if(saveButton)saveButton.style.display=tId==='requestsTab'?'none':'block';
  if(tId==='requestsTab')loadRegistrationRequests();
}

/* Owner-only registration request management */
let registrationRequestsCache=[];
const selectedRegistrationRequestIds=new Set();
const requestStatusLabels={pending:'در انتظار بررسی',approved:'تأییدشده',rejected:'ردشده',converted:'تبدیل‌شده به هنرجو'};
function escapeRequestHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function formatRequestDate(value){
  if(!value)return '—';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'—':d.toLocaleString('fa-IR',{dateStyle:'short',timeStyle:'short'});
}
function setRequestsFeedback(message,isError=false){
  const el=document.getElementById('requestsFeedback');
  if(el){el.textContent=message||'';el.style.color=isError?'#fb7185':'var(--text-secondary)';}
}
function renderRegistrationRequests(){
  const container=document.getElementById('requestsTableContainer');
  const search=toEnglishDigits((document.getElementById('requestsSearch')?.value||'').trim()).toLowerCase();
  const status=document.getElementById('requestsStatusFilter')?.value||'all';
  const filtered=registrationRequestsCache.filter(r=>{
    const matchesStatus=status==='all'||r.status===status;
    const haystack=[r.full_name,r.phone].join(' ').toLowerCase();
    return matchesStatus&&(!search||haystack.includes(search));
  });
  const pending=registrationRequestsCache.filter(r=>r.status==='pending').length;
  const converted=registrationRequestsCache.filter(r=>r.status==='converted'||r.converted_student_id).length;
  document.getElementById('requestsSummary').textContent=
    'کل درخواست‌ها: '+registrationRequestsCache.length+' | در انتظار بررسی: '+pending+' | تبدیل‌شده به هنرجو: '+converted+' | نمایش فعلی: '+filtered.length;
  const bulkBtn=document.getElementById('bulkDeleteRequestsBtn');
  const deletableSelected=[...selectedRegistrationRequestIds].filter(id=>{
    const r=registrationRequestsCache.find(x=>x.id===id);return r&&!r.converted_student_id&&r.status!=='converted';
  });
  bulkBtn.disabled=!deletableSelected.length;
  if(!filtered.length){
    container.innerHTML='<div class="requests-empty">درخواستی با این فیلتر پیدا نشد.</div>';
    return;
  }
  const cards=filtered.map(r=>{
    const isConverted=!!r.converted_student_id||r.status==='converted';
    const displayStatus=isConverted?'converted':r.status;
    const styles=(r.selected_styles||[]).join('، ');
    const statusClass=['pending','approved','rejected','converted'].includes(displayStatus)?displayStatus:'';
    const canReview=!isConverted&&r.status!=='rejected';
    return `<article class="request-card">
      <div class="request-card-top">
        <input type="checkbox" data-request-select="${escapeRequestHtml(r.id)}" ${selectedRegistrationRequestIds.has(r.id)?'checked':''} ${isConverted?'disabled':''} aria-label="انتخاب درخواست">
        <span class="request-status ${statusClass}">${escapeRequestHtml(requestStatusLabels[displayStatus]||displayStatus)}</span>
        <time>${escapeRequestHtml(formatRequestDate(r.created_at))}</time>
      </div>
      <div class="request-card-name">${escapeRequestHtml(r.full_name)}</div>
      <a class="request-card-phone" href="tel:${escapeRequestHtml(r.phone)}">${escapeRequestHtml(r.phone)}</a>
      <div class="request-card-info"><span>سبک‌ها</span><b>${escapeRequestHtml(styles||'—')}</b></div>
      <div class="request-card-meta"><span>تعداد جلسات: <b>${escapeRequestHtml(r.total_sessions)} جلسه</b></span><span>نوع کلاس: <b>${escapeRequestHtml(r.class_type||'—')}</b></span></div>
      <div class="request-card-actions">
        <button type="button" class="request-action-btn" data-request-action="details" data-request-id="${escapeRequestHtml(r.id)}">جزئیات</button>
        ${canReview?'<button type="button" class="request-action-btn approve" data-request-action="approve" data-request-id="'+escapeRequestHtml(r.id)+'">تأیید</button>':''}
        ${canReview?'<button type="button" class="request-action-btn reject" data-request-action="reject" data-request-id="'+escapeRequestHtml(r.id)+'">رد</button>':''}
        <button type="button" class="request-action-btn primary" data-request-action="convert" data-request-id="${escapeRequestHtml(r.id)}" ${isConverted?'disabled':''}>تبدیل به هنرجو</button>
        <button type="button" class="request-action-btn danger" data-request-action="delete" data-request-id="${escapeRequestHtml(r.id)}" ${isConverted?'disabled':''}>حذف</button>
      </div>
    </article>`;
  }).join('');
  container.innerHTML='<div class="requests-select-all"><label><input type="checkbox" id="selectAllVisibleRequests"> انتخاب همه درخواست‌های قابل حذف</label></div><div class="requests-cards-grid">'+cards+'</div>';
}
async function loadRegistrationRequests(){
  if(!gym20OwnerAuthorized||!gym20AdminClient){setRequestsFeedback('دسترسی مدیر تأیید نشده است.',true);return;}
  const container=document.getElementById('requestsTableContainer');
  container.innerHTML='<div style="padding:16px;text-align:center;color:var(--text-secondary);">در حال دریافت درخواست‌ها…</div>';
  setRequestsFeedback('');
  try{
    const {data,error}=await gym20AdminClient.schema('gym20').from('public_registration_requests')
      .select('id,full_name,phone,birth_date,notes,course_id,class_type,total_sessions,package_type,status,created_at,selected_styles,age_group,payment_confirmed,converted_student_id,converted_at,converted_by')
      .order('created_at',{ascending:false});
    if(error)throw error;
    registrationRequestsCache=data||[];
    selectedRegistrationRequestIds.clear();
    renderRegistrationRequests();
    setRequestsFeedback('اطلاعات درخواست‌ها با موفقیت دریافت شد.');
  }catch(err){
    container.innerHTML='<div style="padding:16px;text-align:center;color:#fb7185;">بارگذاری درخواست‌ها ناموفق بود.</div>';
    setRequestsFeedback(err.message||'خطا در دریافت درخواست‌ها.',true);
  }
}
function showRegistrationRequestDetails(id){
  const r=registrationRequestsCache.find(x=>x.id===id);if(!r)return;
  const panel=document.getElementById('requestDetailsPanel');
  const styles=(r.selected_styles||[]).join('، ')||'—';
  panel.innerHTML=`<div class="request-detail-head"><span>جزئیات درخواست · ${escapeRequestHtml(r.full_name)}</span><button type="button" class="request-action-btn" id="closeRequestDetailsBtn">بستن</button></div>
    <div class="request-detail-grid">
      <div><b>شماره تماس:</b> ${escapeRequestHtml(r.phone)}</div>
      <div><b>تاریخ درخواست:</b> ${escapeRequestHtml(formatRequestDate(r.created_at))}</div>
      <div><b>تاریخ تولد:</b> ${escapeRequestHtml(r.birth_date||'ثبت نشده')}</div>
      <div><b>رده سنی:</b> ${r.age_group==='kids'?'کودک':'بزرگسال'}</div>
      <div><b>نوع کلاس:</b> ${escapeRequestHtml(r.class_type)}</div>
      <div><b>تعداد جلسات:</b> ${escapeRequestHtml(r.total_sessions)}</div>
      <div><b>نوع بسته:</b> ${escapeRequestHtml(r.package_type)}</div>
      <div><b>تأیید پرداخت:</b> ${r.payment_confirmed?'بله':'خیر'}</div>
      <div><b>سبک‌ها:</b> ${escapeRequestHtml(styles)}</div>
      <div><b>وضعیت:</b> ${escapeRequestHtml(requestStatusLabels[r.status]||r.status)}</div>
      <div style="grid-column:1/-1"><b>توضیحات:</b><br>${escapeRequestHtml(r.notes||'بدون توضیح').replace(/\n/g,'<br>')}</div>
      ${r.converted_student_id?`<div style="grid-column:1/-1"><b>شناسه هنرجوی ایجادشده:</b> ${escapeRequestHtml(r.converted_student_id)}</div>`:''}
    </div>`;
  panel.hidden=false;
  document.getElementById('closeRequestDetailsBtn').onclick=()=>{panel.hidden=true;};
}
async function deleteRegistrationRequest(id){
  const r=registrationRequestsCache.find(x=>x.id===id);if(!r||r.converted_student_id)return;
  if(!confirm('این درخواست ثبت‌نام حذف شود؟ این کار قابل بازگشت نیست.'))return;
  try{
    const {error}=await gym20AdminClient.schema('gym20').from('public_registration_requests')
      .delete().eq('id',id).is('converted_student_id',null);
    if(error)throw error;
    selectedRegistrationRequestIds.delete(id);
    await loadRegistrationRequests();
    setRequestsFeedback('درخواست حذف شد.');
  }catch(err){setRequestsFeedback(err.message||'حذف درخواست ناموفق بود.',true);}
}
async function bulkDeleteRegistrationRequests(){
  const ids=[...selectedRegistrationRequestIds].filter(id=>{
    const r=registrationRequestsCache.find(x=>x.id===id);return r&&!r.converted_student_id;
  });
  if(!ids.length)return;
  if(!confirm('تعداد '+ids.length+' درخواست انتخاب‌شده حذف شوند؟ این کار قابل بازگشت نیست.'))return;
  try{
    const {error}=await gym20AdminClient.schema('gym20').from('public_registration_requests')
      .delete().in('id',ids).is('converted_student_id',null);
    if(error)throw error;
    selectedRegistrationRequestIds.clear();
    await loadRegistrationRequests();
    setRequestsFeedback(ids.length+' درخواست حذف شد.');
  }catch(err){setRequestsFeedback(err.message||'حذف گروهی ناموفق بود.',true);}
}
async function updateRegistrationRequestStatus(id,status){
  try{
    const {error}=await gym20AdminClient.schema('gym20').rpc('update_registration_request_status',{p_request_id:id,p_status:status});
    if(error)throw error;
    await loadRegistrationRequests();
    setRequestsFeedback('وضعیت درخواست بروزرسانی شد.');
  }catch(err){setRequestsFeedback(err.message||'تغییر وضعیت ناموفق بود.',true);await loadRegistrationRequests();}
}
async function convertRegistrationRequest(id){
  const r=registrationRequestsCache.find(x=>x.id===id);if(!r||r.converted_student_id)return;
  if(!confirm('درخواست «'+r.full_name+'» به هنرجوی فعال تبدیل شود؟ برای هر سبک انتخابی یک ثبت‌نام فعال ایجاد می‌شود.'))return;
  try{
    const {data,error}=await gym20AdminClient.schema('gym20').rpc('convert_registration_request',{p_request_id:id});
    if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;
    await loadRegistrationRequests();
    setRequestsFeedback('درخواست با موفقیت تبدیل شد؛ '+(result?.enrollment_count??'')+' ثبت‌نام برای هنرجو ایجاد شد.');
  }catch(err){setRequestsFeedback(err.message||'تبدیل درخواست ناموفق بود.',true);}
}
document.getElementById('requestsSearch').addEventListener('input',renderRegistrationRequests);
document.getElementById('requestsStatusFilter').addEventListener('change',renderRegistrationRequests);
document.getElementById('refreshRequestsBtn').addEventListener('click',loadRegistrationRequests);
document.getElementById('bulkDeleteRequestsBtn').addEventListener('click',bulkDeleteRegistrationRequests);
document.getElementById('requestsTableContainer').addEventListener('click',e=>{
  const btn=e.target.closest('button[data-request-action]');if(!btn)return;
  const id=btn.getAttribute('data-request-id'),action=btn.getAttribute('data-request-action');
  if(action==='details')showRegistrationRequestDetails(id);
  if(action==='delete')deleteRegistrationRequest(id);
  if(action==='convert')convertRegistrationRequest(id);
  if(action==='approve')updateRegistrationRequestStatus(id,'approved');
  if(action==='reject')updateRegistrationRequestStatus(id,'rejected');
});
document.getElementById('requestsTableContainer').addEventListener('change',e=>{
  const target=e.target;
  if(target.matches('[data-request-select]')){
    const id=target.getAttribute('data-request-select');
    if(target.checked)selectedRegistrationRequestIds.add(id);else selectedRegistrationRequestIds.delete(id);
    renderRegistrationRequests();
  }else if(target.id==='selectAllVisibleRequests'){
    const search=toEnglishDigits((document.getElementById('requestsSearch').value||'').trim()).toLowerCase();
    const status=document.getElementById('requestsStatusFilter').value;
    const visible=registrationRequestsCache.filter(r=>(status==='all'||r.status===status)&&(!search||[r.full_name,r.phone].join(' ').toLowerCase().includes(search))&&!r.converted_student_id);
    if(target.checked)visible.forEach(r=>selectedRegistrationRequestIds.add(r.id));
    else visible.forEach(r=>selectedRegistrationRequestIds.delete(r.id));
    renderRegistrationRequests();
  }
});

function normalizeRuleText(value){return String(value==null?'':value).replace(/\r\n?/g,'\n').replace(/\\+r\\+n/g,'\n').replace(/\\+n/g,'\n').replace(/\\+r/g,'\n');}
function onRuleSelectorChange(){const t=document.getElementById('activeRuleTextarea'),s=window.gym20RuleSelector||document.getElementById('ruleSelector');if(!t||!s)return;if(!appData.rules)appData.rules={};if(currentEditingRuleKey)appData.rules[currentEditingRuleKey]=normalizeRuleText(t.value);currentEditingRuleKey=s.value;t.value=normalizeRuleText(appData.rules[currentEditingRuleKey]||'');}

const adminBtn=document.getElementById('adminBtn');
const adminModal=document.getElementById('adminModal');
const closeAdmin=document.getElementById('closeAdmin');
const adminLoginModal=document.getElementById('adminLoginModal');
const adminLoginForm=document.getElementById('adminLoginForm');
const adminLoginEmail=document.getElementById('adminLoginEmail');
const adminLoginPassword=document.getElementById('adminLoginPassword');
const adminLoginError=document.getElementById('adminLoginError');
let gym20AdminAuth=null,gym20AdminClient=null,gym20OwnerAuthorized=false,gym20AppDataLoaded=false;
let gym20SupabaseSdkPromise=null,gym20AdminModulesPromise=null,gym20UserInteracted=false;
document.addEventListener('input',e=>{if(e.target&&e.target.closest&&e.target.closest('#publicRegistrationForm,#adminModal'))gym20UserInteracted=true;},true);
document.addEventListener('change',e=>{if(e.target&&e.target.closest&&e.target.closest('#publicRegistrationForm,#adminModal'))gym20UserInteracted=true;},true);
document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#publicRegistrationForm,#adminModal'))gym20UserInteracted=true;},true);
function loadGym20SupabaseSdk(){
  if(window.supabase&&typeof window.supabase.createClient==='function')return Promise.resolve();
  if(gym20SupabaseSdkPromise)return gym20SupabaseSdkPromise;
  gym20SupabaseSdkPromise=(async()=>{
    const sources=[
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js',
      'https://unpkg.com/@supabase/supabase-js@2.118.0/dist/umd/supabase.js'
    ];
    let lastError=null;
    for(const src of sources){
      try{
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src=src;script.async=true;
          const timer=setTimeout(()=>{
            script.onload=script.onerror=null;script.remove();
            reject(new Error('مهلت بارگذاری پایان یافت: '+src));
          },6500);
          script.onload=()=>{
            clearTimeout(timer);
            if(window.supabase&&typeof window.supabase.createClient==='function')resolve();
            else{script.remove();reject(new Error('فایل دریافتی کتابخانه معتبر نیست: '+src));}
          };
          script.onerror=()=>{
            clearTimeout(timer);script.remove();
            reject(new Error('این منبع در دسترس نیست: '+src));
          };
          document.head.appendChild(script);
        });
        return;
      }catch(err){lastError=err;console.warn('GYM20 SDK source failed:',src,err);}
    }
    gym20SupabaseSdkPromise=null;
    throw new Error('کتابخانه ورود مدیر از هیچ‌یک از دو منبع بارگذاری نشد. احتمالاً دسترسی اینترنت به CDNها محدود است. صفحه را دوباره بارگذاری کنید یا اتصال را تغییر دهید.');
  })().catch(err=>{gym20SupabaseSdkPromise=null;throw err;});
  return gym20SupabaseSdkPromise;
}
function loadGym20Module(src){
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-gym20-lazy-src="'+src+'"]');
    if(existing){
      if(existing.dataset.loaded==='1'){resolve();return;}
      existing.addEventListener('load',resolve,{once:true});
      existing.addEventListener('error',()=>reject(new Error('بارگذاری بخش مدیریتی ناموفق بود: '+src)),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=src;script.dataset.gym20LazySrc=src;
    script.onload=()=>{script.dataset.loaded='1';resolve();};
    script.onerror=()=>{script.remove();reject(new Error('بارگذاری بخش مدیریتی ناموفق بود: '+src));};
    document.body.appendChild(script);
  });
}
function loadGym20AdminModules(){
  if(!gym20AdminModulesPromise){
    gym20AdminModulesPromise=loadGym20Module('student-terms.js?v=20261112-term-wheel-fix-v95')
      .then(()=>loadGym20Module('./student-push-admin.js?v=20261112-active-count-v16'))
      .then(()=>loadGym20Module('./student-exercises.js?v=20261110-light-exercises-v3'))
      .catch(err=>{gym20AdminModulesPromise=null;throw err;});
  }
  return gym20AdminModulesPromise;
}
function openAuthorizedAdminPanel(){
  if(!gym20OwnerAuthorized)return;
  const modal=document.getElementById('adminModal');
  if(modal)modal.style.display='flex';
  const status=document.getElementById('adminModulesStatus');
  if(status){status.textContent='در حال آماده‌سازی پنل مدیریت…';status.style.color='#d6b35a';}
  loadGym20AdminModules().then(()=>{
    if(!gym20OwnerAuthorized)return;
    loadAdminForm();
    if(status)status.textContent='';
  }).catch(err=>{
    console.error('GYM20 admin modules failed:',err);
    if(status){status.textContent=err.message||'بارگذاری بعضی بخش‌های پنل ناموفق بود؛ اتصال را بررسی و دوباره تلاش کنید.';status.style.color='#fb7185';}
    setAdminLoginStatus(err.message||'بارگذاری پنل مدیریت ناموفق بود.',true);
  });
}
function setAdminLoginStatus(message,isError=false){
  adminLoginError.textContent=message||'';
  adminLoginError.style.color=isError?'#fb7185':'#34d399';
}
async function ensureGym20AdminAuth(){
  await loadGym20SupabaseSdk();
  if(!gym20AdminAuth){
    if(!window.GYM20AdminAuth)throw new Error('ماژول ورود مدیر بارگذاری نشده است.');
    gym20AdminAuth=window.GYM20AdminAuth.init({
      url:GYM20_SUPABASE_URL,
      publishableKey:GYM20_SUPABASE_ANON_KEY,
      onStatus:setAdminLoginStatus,
      onAuthorized:()=>{
        gym20OwnerAuthorized=true;
        closeAdminLogin();
        if(gym20AppDataLoaded)openAuthorizedAdminPanel();
      }
    });
    gym20AdminClient=gym20AdminAuth.getClient();
  }
  return gym20AdminAuth;
}
async function openAdminLogin(){
  setAdminLoginStatus('');
  adminLoginEmail.value='';
  adminLoginModal.classList.add('open');
  adminLoginModal.setAttribute('aria-hidden','false');
  setTimeout(()=>adminLoginEmail.focus(),80);
  try{const auth=await ensureGym20AdminAuth();await auth.verifyOwner().catch(()=>{});}
  catch(e){setAdminLoginStatus(e.message,true);}
}
function closeAdminLogin(){adminLoginModal.classList.remove('open');adminLoginModal.setAttribute('aria-hidden','true');}
adminBtn.onclick=openAdminLogin;
document.getElementById('closeAdminLogin').onclick=closeAdminLogin;
adminLoginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const submit=document.getElementById('adminLoginSubmit');
  const old=submit.textContent;
  submit.disabled=true;submit.textContent='در حال بررسی…';
  try{
    const auth=await ensureGym20AdminAuth();
    await auth.signInWithPassword(adminLoginEmail.value.trim(),adminLoginPassword.value);
    adminLoginPassword.value='';
    await auth.verifyOwner();
  }catch(err){setAdminLoginStatus(err.message||'ایمیل یا رمز عبور صحیح نیست.',true);}
  finally{submit.disabled=false;submit.textContent=old;}
});
adminLoginModal.addEventListener('click',e=>{if(e.target===adminLoginModal)closeAdminLogin();});
document.getElementById('adminLogoutBtn').addEventListener('click',async()=>{
  try{if(gym20AdminAuth)await gym20AdminAuth.signOut();}
  catch(e){alert(e.message||'خروج ناموفق بود.');return;}
  gym20OwnerAuthorized=false;
  document.getElementById('adminModal').style.display='none';
  switchAdminTab('pricesTab');
});
closeAdmin.onclick=()=>{adminModal.style.display='none';};
function cleanLegacy(s){return (s||'').replace(/مرحله اول:\s*/g,'').replace(/برای مشاهده شرایط دوره، سبک‌ها و محاسبه شهریه،\s*/g,'').trim();}

// مدیریت لیست دریافت‌کنندگان تلگرام در پنل مدیریت
function renderTgRecipientsList(){
    const c=document.getElementById('adminTgRecipientsContainer');if(!c)return;c.innerHTML="";
    if(!Array.isArray(adminTgRecipients))adminTgRecipients=[];
    if(!adminTgRecipients.length){
        c.innerHTML='<div style="font-size:.62rem;color:var(--text-secondary);text-align:center;padding:5px;">هنوز دریافت‌کننده دیگری افزوده نشده است.</div>';
        return;
    }
    adminTgRecipients.forEach((rc,idx)=>{
        const row=document.createElement('div');row.className='admin-style-row';
        row.innerHTML=`<input type="text" dir="ltr" spellcheck="false" placeholder="آیدی یا چت‌آیدی (مثلاً 123456789 یا @username)" value="${rc||''}" oninput="updateTgRecipient(${idx},this.value)"><button type="button" class="delete-style-btn" onclick="deleteTgRecipient(${idx})">🗑️</button>`;
        c.appendChild(row);
    });
}
function addNewTgRecipientInput(){
    if(!Array.isArray(adminTgRecipients))adminTgRecipients=[];
    adminTgRecipients.push("");
    renderTgRecipientsList();
}
function updateTgRecipient(idx,val){
    if(adminTgRecipients[idx]!==undefined)adminTgRecipients[idx]=val.trim();
}
function deleteTgRecipient(idx){
    adminTgRecipients.splice(idx,1);
    renderTgRecipientsList();
}

async function dispatchTelegramNotification(info, isTest = false) {
    const tg = appData.telegramConfig || {};
    if (!isTest && tg.enabled === false) throw new Error('ارسال تلگرام در تنظیمات پنل غیرفعال است.');
    const endpoint = GYM20_SUPABASE_URL + '/functions/v1/telegram-notify';
    const payload = isTest ? { isTest: true } : info;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'apikey': GYM20_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + GYM20_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
        throw new Error(result.detail || result.error || 'ارسال پیام تلگرام ناموفق بود');
    }
    return [{ ok: true, recipient: 'تنظیم‌شده در سرور' }];
}

async function testSendTelegramNotification() {
    const btn = document.getElementById('testTgNotificationBtn');
    const statusEl = document.getElementById('tgTestResultBox');
    if (!btn || !statusEl) return;
    const oldText = btn.innerText;

    btn.disabled = true;
    btn.innerText = '⏳ در حال ارسال پیام تست...';
    statusEl.textContent = 'در حال ارتباط با تابع امن تلگرام...';

    try {
        await dispatchTelegramNotification({}, true);
        statusEl.innerHTML = '<span style="color:#10b981;">🎉 پیام آزمایشی با موفقیت ارسال شد.</span>';
    } catch (e) {
        statusEl.innerHTML = '<span style="color:#f87171;">❌ ' + String(e.message || e) + '</span>';
    } finally {
        btn.disabled = false;
        btn.innerText = oldText;
    }
}

function loadAdminForm(){
    selectTheme(appData.theme||'stealth');
    currentEditingRuleKey=(window.gym20RuleSelector||document.getElementById('ruleSelector')).value;safeSetValue('activeRuleTextarea',normalizeRuleText((appData.rules&&appData.rules[currentEditingRuleKey])||''));
    if(appData.multipliers){safeSetValue('editOnlineFactor',appData.multipliers.online||0.8);safeSetValue('editSemiFactor',appData.multipliers.semi||1.4);safeSetValue('editPrivateFactor',appData.multipliers.private||2.0);safeSetValue('editVipFactor',appData.multipliers.vip||3.0);}
    if(appData.sessionRates){safeSetValue('editRate8',appData.sessionRates["8"]||1.0);safeSetValue('editRate10',appData.sessionRates["10"]||1.25);safeSetValue('editRate12',appData.sessionRates["12"]||1.5);}
    const bO=appData.buttons||{};
    const tO=appData.titles||{};
    const formVals = {
        editBtnOnlinePay: bO.onlinePay || '💳 پرداخت آنلاین', editBtnCopyCard: bO.copyCard || '📋 کپی کارت', editBtnSendReceipt: bO.sendReceipt || '📩 ارسال فیش', editBtnSubmitReg: bO.submitReg || 'ارسال درخواست ثبت‌نام', editBtnMusicJoin: bO.musicJoin || 'عضویت 🎵', editBtnInsta: bO.instaBtn || '📸 اینستاگرام', editBtnTele: bO.teleBtn || '✈️ تلگرام / ایتا', editBtnPhone: bO.phoneBtn || '📞 تماس تلفنی',
        editTitleRegionSection: cleanLegacy(tO.regionSection) || '📍 انتخاب منطقه در تهران', editTitleRegionIntro: cleanLegacy(tO.regionIntro) || 'لطفاً ابتدا منطقه مورد نظر خود را در تهران انتخاب کنید:', editTitleStylesSection: tO.stylesSection || '🥋 ۱. نوع کلاس، سبک‌ها و جلسات', editTitleReg: tO.regTitle || '📝 فرم ثبت‌نام هنرجو', editTitleRulesSection: tO.rulesSection || '📌 ۲. شرایط برگزاری و قوانین دوره', editTitleGeneralRulesTitle: tO.generalRulesTitle || 'قوانین عمومی و انضباطی آکادمی', editTitleBankInfo: tO.bankInfoTitle || 'اطلاعات واریز شهریه', editTitleContactsSection: tO.contactsSection || '💬 ۳. راه‌های ارتباطی با مربی',
        editTitleFullNameLabel: tO.fullNameLabel || 'نام و نام خانوادگی *', editTitlePhoneLabel: tO.phoneLabel || 'شماره موبایل *', editTitleBirthDateLabel: tO.birthDateLabel || 'تولد شمسی (اختیاری)', editTitleNotesLabel: tO.notesLabel || 'توضیحات (اختیاری)', editTitleRulesAgreement: tO.rulesAgreement || 'قوانین و شرایط کلاس را با دقت مطالعه کردم و می‌پذیرم.', editTitlePaymentConfirmed: tO.paymentConfirmed || 'پرداخت شهریه را انجام داده‌ام و تأیید می‌کنم.',
        editLabelAdult: tO.labelAdult || 'بزرگسالان', editLabelKids: tO.labelKids || 'کودکان', editTitleClassTypeLabel: tO.classTypeLabel || 'نوع برگزاری کلاس:', editTitleSessionCountLabel: tO.sessionCountLabel || 'تعداد جلسات هر ترم:', editTitleStylesChoiceLabel: tO.stylesChoiceLabel || 'سبک‌های مجاز این کلاس:', editTitleTuitionLabel: tO.tuitionLabel || 'شهریه نهایی ترم:', editTitleClassRulesLabel: tO.classRulesLabel || 'شرایط نوع کلاس:', editTitleSessionRulesLabel: tO.sessionRulesLabel || 'شرایط تعداد جلسات ترم:'
    };
    Object.entries(formVals).forEach(([k,v])=>safeSetValue(k,v));
    const cO=appData.card||{};safeSetValue('editCardNum',cO.cleanNumber||'');safeSetValue('editCardOwner',cO.owner||'');safeSetValue('editGatewayLink',cO.gatewayLink||'');
    const ctO=appData.contact||{};safeSetValue('editPhone',ctO.phone||'');safeSetValue('editInsta',ctO.instagram||'');safeSetValue('editTele',ctO.telegram||'');
    safeSetValue('editBrandTag',appData.brandTag||'');safeSetValue('editBannerTitle',appData.bannerTitle||'');safeSetValue('editBannerSubtitle',appData.bannerSubtitle||'');safeSetValue('editBannerBg',appData.bannerBg||'');
    const mO=appData.musicChannel||{};safeSetValue('editMusicName',mO.name||'');safeSetValue('editMusicId',mO.id||'');safeSetValue('editMusicLink',mO.link||'');
    const pO=appData.promoPopup||{};const pChk=document.getElementById('editPromoEnabled');if(pChk)pChk.checked=pO.enabled!==false;const pDescChk=document.getElementById('editPromoShowDescription');if(pDescChk)pDescChk.checked=pO.showChannelDescription===true;safeSetValue('editPromoTitle',pO.title||'');safeSetValue('editPromoText',pO.text||'');safeSetValue('editPromoCode',pO.code||'');safeSetValue('editPromoLink',pO.link||'');safeSetValue('editPromoImg',pO.img||'');safeSetValue('editPromoBtn',pO.btnText||'');safeSetValue('editPromoChannelTitle',pO.channelTitle||'');safeSetValue('editPromoChannelDescription',pO.channelDescription||'');renderPromoChannelPreview(pO.channelTitle||'',pO.channelDescription||'',!!(pO.channelTitle||pO.channelDescription));
    
    // لود تنظیمات تلگرام
    const tgO=appData.telegramConfig||{};
    const tgChk=document.getElementById('editTgEnabled');if(tgChk)tgChk.checked=tgO.enabled===true;
    safeSetValue('editTgBotToken',tgO.botToken||'');
    safeSetValue('editTgChannelId',tgO.channelId||'');
    safeSetValue('editTgAdminChatId',tgO.adminChatId||'');
    adminTgRecipients=Array.isArray(tgO.extraRecipients)?[...tgO.extraRecipients]:[];
    renderTgRecipientsList();

    renderAdminRegionsNav();renderAdminStylesList();loadAdminClassTypeConfig();
}

function collectFormData(){
    appData.theme=selectedThemeKey||'stealth';if(!appData.rules)appData.rules={};appData.rules[currentEditingRuleKey]=normalizeRuleText(document.getElementById('activeRuleTextarea').value);
    appData.multipliers={normal:1.0,online:Number(document.getElementById('editOnlineFactor').value)||0.8,semi:Number(document.getElementById('editSemiFactor').value)||1.4,private:Number(document.getElementById('editPrivateFactor').value)||2.0,vip:Number(document.getElementById('editVipFactor').value)||3.0};
    appData.sessionRates={"8":Number(document.getElementById('editRate8').value)||1.0,"10":Number(document.getElementById('editRate10').value)||1.25,"12":Number(document.getElementById('editRate12').value)||1.5};
    const getVal=id=>(document.getElementById(id)?document.getElementById(id).value.trim():'');
    appData.buttons={onlinePay:getVal('editBtnOnlinePay'),copyCard:getVal('editBtnCopyCard'),sendReceipt:getVal('editBtnSendReceipt'),submitReg:getVal('editBtnSubmitReg'),musicJoin:getVal('editBtnMusicJoin'),instaBtn:getVal('editBtnInsta'),teleBtn:getVal('editBtnTele'),phoneBtn:getVal('editBtnPhone')};
    if(!appData.titles)appData.titles={};
    const tFields={
        regionSection:cleanLegacy(getVal('editTitleRegionSection'))||'📍 انتخاب منطقه در تهران',regionIntro:cleanLegacy(getVal('editTitleRegionIntro'))||'لطفاً ابتدا منطقه مورد نظر خود را در تهران انتخاب کنید:',stylesSection:getVal('editTitleStylesSection'),regTitle:getVal('editTitleReg'),rulesSection:getVal('editTitleRulesSection'),generalRulesTitle:getVal('editTitleGeneralRulesTitle'),bankInfoTitle:getVal('editTitleBankInfo'),contactsSection:getVal('editTitleContactsSection'),
        fullNameLabel:getVal('editTitleFullNameLabel'),phoneLabel:getVal('editTitlePhoneLabel'),birthDateLabel:getVal('editTitleBirthDateLabel'),notesLabel:getVal('editTitleNotesLabel'),rulesAgreement:getVal('editTitleRulesAgreement'),paymentConfirmed:getVal('editTitlePaymentConfirmed'),
        labelAdult:getVal('editLabelAdult'),labelKids:getVal('editLabelKids'),classTypeLabel:getVal('editTitleClassTypeLabel'),sessionCountLabel:getVal('editTitleSessionCountLabel'),stylesChoiceLabel:getVal('editTitleStylesChoiceLabel'),tuitionLabel:getVal('editTitleTuitionLabel'),classRulesLabel:getVal('editTitleClassRulesLabel'),sessionRulesLabel:getVal('editTitleSessionRulesLabel')
    };
    Object.assign(appData.titles,tFields);
    appData.brandTag=getVal('editBrandTag');appData.bannerTitle=getVal('editBannerTitle');appData.bannerSubtitle=getVal('editBannerSubtitle');appData.bannerBg=getVal('editBannerBg');
    
    // تبدیل ارقام فارسی به انگلیسی برای شماره کارت
    const raw=toEnglishDigits(document.getElementById('editCardNum').value).replace(/\D/g,'');
    appData.card={bank:"بانک سامان",number:raw.replace(/(\d{4})/g,'$1-').slice(0,19),cleanNumber:raw,owner:getVal('editCardOwner'),gatewayLink:getVal('editGatewayLink')};
    appData.contact={phone:toEnglishDigits(getVal('editPhone')),instagram:getVal('editInsta'),telegram:getVal('editTele')};
    appData.musicChannel={name:getVal('editMusicName')||'کانال موزیک GYM20MUSIC',id:getVal('editMusicId')||'@GYM20MUSIC',link:getVal('editMusicLink')||'https://t.me/GYM20MUSIC',avatar:"music.webp"};
    appData.promoPopup={enabled:document.getElementById('editPromoEnabled').checked,showChannelDescription:document.getElementById('editPromoShowDescription').checked,title:getVal('editPromoTitle'),text:getVal('editPromoText'),code:getVal('editPromoCode'),link:getVal('editPromoLink'),img:getVal('editPromoImg'),btnText:getVal('editPromoBtn'),channelTitle:getVal('editPromoChannelTitle'),channelDescription:getVal('editPromoChannelDescription')};

    // ذخیره تنظیمات تلگرام
    appData.telegramConfig={
        enabled:document.getElementById('editTgEnabled')?document.getElementById('editTgEnabled').checked:false,
        botToken:(document.getElementById('editTgBotToken')?.value||'').trim(),
        channelId:(document.getElementById('editTgChannelId')?.value||'').trim(),
        adminChatId:(document.getElementById('editTgAdminChatId')?.value||'').trim(),
        extraRecipients:(adminTgRecipients||[]).map(x=>(x||'').trim()).filter(Boolean)
    };
}


document.getElementById('autoCommitBtn').onclick=async()=>{
    const btn=document.getElementById('autoCommitBtn'),oldText=btn.innerText;
    btn.innerText='⏳ در حال ذخیره در سرور و گیت‌هاب...';btn.disabled=true;
    try{
        collectFormData();
        localStorage.setItem('sports_reg_data',JSON.stringify(appData));
        applyDataToUI();updateClassStatusAndStylesFlow();
        
        let dbSynced=false;
        
        // ۱. ذخیره لحظه‌ای در دیتابیس Supabase (برای اعمال بلادرنگ روی گوشی همه هنرجوها)
        try {
            // تلاش از طریق تابع اختصاصی امن با پین
            const dbRpcRes = await fetch(GYM20_SUPABASE_URL + '/rest/v1/rpc/save_site_config', {
                method: 'POST',
                headers: {
                    'apikey': GYM20_SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + GYM20_SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Content-Profile': 'gym20',
                    'Accept-Profile': 'gym20'
                },
                body: JSON.stringify({ p_config: appData, p_pin: '1234' })
            });
            if (dbRpcRes.ok) {
                const rpcResult = await dbRpcRes.json().catch(() => false);
                dbSynced = rpcResult === true;
            }
            if (!dbSynced) {
                // تلاش پشتیبان: آپدیت مستقیم ردیف تنظیمات در جدول site_settings
                const dbPatchRes = await fetch(GYM20_SUPABASE_URL + '/rest/v1/site_settings?key=eq.public_site_config', {
                    method: 'PATCH',
                    headers: {
                        'apikey': GYM20_SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + GYM20_SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json',
                        'Content-Profile': 'gym20',
                        'Accept-Profile': 'gym20',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ value: appData })
                });
                if (dbPatchRes.ok) {
                    const patchedRows = await dbPatchRes.json().catch(() => []);
                    dbSynced = Array.isArray(patchedRows) && patchedRows.length > 0;
                }
            }
        } catch(e) {
            console.warn('Supabase DB save error:', e);
        }

        if(dbSynced){
            adminModal.style.display='none';
            alert('✅ تنظیمات در دیتابیس آنلاین ذخیره و تأیید شد؛ برای همه کاربران اعمال می‌شود.');
        } else {
            alert('⚠️ ذخیره آنلاین تأیید نشد. تغییرات فعلاً فقط در همین مرورگر هستند؛ پنل باز می‌ماند تا دوباره تلاش کنید.');
        }
    }catch(err){
        console.error(err);
        alert('❌ ذخیره تنظیمات کامل نشد: ' + String(err.message || err) + '؛ پنل باز می‌ماند.');
    }finally{
        btn.innerText=oldText;btn.disabled=false;
    }
};

function applyDataToUI(){
    const aT=appData.theme||'stealth';selectedThemeKey=aT;document.body.setAttribute('data-color-theme',aT);
    safeSetText('brandTag',appData.brandTag||'آکادمی تخصصی ورزش GYM20🤸');safeSetText('bannerTitle',appData.bannerTitle||'سلام، وقتتون بخیر 🌱');safeSetText('bannerSubtitle',appData.bannerSubtitle||'شرایط برگزاری کلاس‌های ورزشی تخصصی | انتخاب سبک‌ها و محاسبه هوشمند شهریه');
    const hero=document.getElementById('heroBanner');if(hero&&appData.bannerBg)hero.style.backgroundImage=`linear-gradient(135deg,rgba(0,0,0,0.65),rgba(0,0,0,0.65)),url('${appData.bannerBg}')`;
    const bO=appData.buttons||{};
    safeSetText('btn_onlinePay',bO.onlinePay||'💳 پرداخت آنلاین');safeSetText('btn_copyCard',bO.copyCard||'📋 کپی کارت');safeSetText('btn_sendReceipt',bO.sendReceipt||'📩 ارسال فیش');safeSetText('btn_submitReg',bO.submitReg||'ارسال درخواست ثبت‌نام');safeSetText('btn_musicJoin',bO.musicJoin||'عضویت 🎵');safeSetText('instaLink',bO.instaBtn||'📸 اینستاگرام');safeSetText('teleLink',bO.teleBtn||'✈️ تلگرام / ایتا');safeSetText('phoneLink',bO.phoneBtn||'📞 تماس تلفنی');
    const tO=appData.titles||{};
    safeSetText('pill_adult',tO.labelAdult||'بزرگسالان');safeSetText('pill_kids',tO.labelKids||'کودکان');
    safeSetText('txt_regionSection',cleanLegacy(tO.regionSection)||'📍 انتخاب منطقه در تهران');safeSetText('txt_regionIntro',cleanLegacy(tO.regionIntro)||'لطفاً ابتدا منطقه مورد نظر خود را در تهران انتخاب کنید:');
    safeSetText('txt_stylesSection',tO.stylesSection||'🥋 ۱. نوع کلاس، سبک‌ها و جلسات');safeSetText('txt_classTypeLabel',tO.classTypeLabel||'نوع برگزاری کلاس:');safeSetText('txt_sessionCountLabel',tO.sessionCountLabel||'تعداد جلسات هر ترم:');safeSetText('txt_stylesChoiceLabel',tO.stylesChoiceLabel||'سبک‌های مجاز این کلاس:');safeSetText('txt_tuitionLabel',tO.tuitionLabel||'شهریه نهایی ترم:');
    safeSetText('txt_regTitle',tO.regTitle||'📝 فرم ثبت‌نام هنرجو');safeSetText('txt_fullNameLabel',tO.fullNameLabel||'نام و نام خانوادگی *');safeSetText('txt_phoneLabel',tO.phoneLabel||'شماره موبایل *');safeSetText('txt_birthDateLabel',tO.birthDateLabel||'تولد شمسی (اختیاری)');safeSetText('txt_notesLabel',tO.notesLabel||'توضیحات (اختیاری)');
    safeSetText('txt_rulesSection',tO.rulesSection||'📌 ۲. شرایط برگزاری و قوانین دوره');safeSetText('txt_classRulesLabel',tO.classRulesLabel||'شرایط نوع کلاس:');safeSetText('txt_sessionRulesLabel',tO.sessionRulesLabel||'شرایط تعداد جلسات ترم:');safeSetText('txt_generalRulesTitle',tO.generalRulesTitle||'قوانین عمومی و انضباطی آکادمی');safeSetText('txt_rulesAgreement',tO.rulesAgreement||'قوانین و شرایط کلاس را با دقت مطالعه کردم و می‌پذیرم.');
    safeSetText('txt_bankInfoTitle',tO.bankInfoTitle||'اطلاعات واریز شهریه');safeSetText('txt_paymentConfirmed',tO.paymentConfirmed||'پرداخت شهریه را انجام داده‌ام و تأیید می‌کنم.');safeSetText('txt_contactsSection',tO.contactsSection||'💬 ۳. راه‌های ارتباطی با مربی');
    const cO=appData.card||{};safeSetText('cardNumberText',cO.number||'');safeSetText('cardOwnerText',cO.owner||'');
    const gw=document.getElementById('onlineGatewayBtn');if(gw){if(cO.gatewayLink&&cO.gatewayLink.length>5){gw.href=cO.gatewayLink;gw.style.display='flex';}else gw.style.display='none';}
    const ctO=appData.contact||{};const inL=document.getElementById('instaLink');if(inL)inL.href=ctO.instagram||'#';const teL=document.getElementById('teleLink');if(teL)teL.href=ctO.telegram||'#';const phL=document.getElementById('phoneLink');if(phL)phL.href='tel:'+(ctO.phone||'');const sR=document.getElementById('sendReceiptBtn');if(sR)sR.href='sms:'+(ctO.phone||'')+'?body=سلام استاد، فیش واریزی ارسال شد.';
    const mO=appData.musicChannel||{};safeSetText('musicTitleText',mO.name||'✈️ کانال موزیک GYM20MUSIC 🎧');const mcL=document.getElementById('musicCardLink');if(mcL)mcL.href=mO.link||'#';const mAv=document.getElementById('musicAvatarImg');const desiredMusicAvatar='https://raw.githubusercontent.com/gym20music-web/gym20-student-registration-ai-studio/main/music.webp';if(mAv&&mAv.dataset.source!==desiredMusicAvatar){mAv.dataset.source=desiredMusicAvatar;mAv.src=desiredMusicAvatar;}
    applyPromoPopupData();updateDynamicRules();renderCustomRegionDropdown();
}

function loadTelegramAvatarSafely(imgElement, cleanUser) {
    if (!cleanUser) {
        imgElement.onerror = null;
        imgElement.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';
        return;
    }
    const cdns = [
        `https://wsrv.nl/?url=https://t.me/i/userpic/320/${cleanUser}.jpg`,
        `https://images.weserv.nl/?url=t.me/i/userpic/320/${cleanUser}.jpg`,
        `https://t.me/i/userpic/320/${cleanUser}.jpg`
    ];
    let step = 0;
    function tryNext() {
        if (step < cdns.length) {
            imgElement.src = cdns[step++];
        } else {
            imgElement.onerror = null;
            imgElement.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';
        }
    }
    imgElement.onerror = tryNext;
    tryNext();
}

function applyPromoPopupData(){
    const pO=appData.promoPopup||{};
    safeSetText('meoxPromoTitle',pO.title||'✨ عنوان بنر تبلیغاتی');
    safeSetText('meoxPromoText',pO.text||'');
    safeSetText('meoxDiscountCode',pO.code||'');
    safeSetText('meoxPromoBtn',pO.btnText||'ورود به کانال و مشاهده محصولات 🛍️');
    const codeWrap=document.getElementById('meoxPromoCodeContainer');
    if(codeWrap)codeWrap.style.display=pO.code?'flex':'none';
    const channelName=document.getElementById('meoxPromoChannelName');
    if(channelName){channelName.textContent=pO.channelTitle||'';channelName.hidden=!pO.channelTitle;}
    const channelDescription=document.getElementById('meoxPromoChannelDescription');
    if(channelDescription){
        if(pO.showChannelDescription&&pO.channelDescription){renderClickablePromoBio(channelDescription,pO.channelDescription);channelDescription.hidden=false;}
        else{channelDescription.replaceChildren();channelDescription.hidden=true;}
    }
    let link=(pO.link||'').trim();
    const cleanUser=cleanTelegramUsername(link);
    if(link&&!/^https?:\/\//i.test(link))link='https://t.me/'+cleanUser;
    const pBtn=document.getElementById('meoxPromoBtn');if(pBtn)pBtn.href=link||'https://t.me/';
    const pImg=document.getElementById('meoxPromoImg');
    if(pImg){
        if(pO.img&&pO.img.trim().length>5){pImg.onerror=null;pImg.src=pO.img.trim();}
        else if(cleanUser){loadTelegramAvatarSafely(pImg,cleanUser);}
        else{pImg.onerror=null;pImg.src='https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';}
    }
}

function renderClickablePromoBio(container,rawText){
    container.replaceChildren();
    const source=String(rawText||'');
    const pattern=/(https?:\/\/[^\s<>"']+|(?:t\.me|telegram\.me)\/[A-Za-z0-9_+/?=.%#-]+|@[A-Za-z0-9_]{4,}|(?:اینستاگرام|instagram)\s*[:：]\s*([A-Za-z0-9._]{2,}))/gi;
    let cursor=0,match;
    while((match=pattern.exec(source))!==null){
        if(match.index>cursor)container.appendChild(document.createTextNode(source.slice(cursor,match.index)));
        let visible=match[0],href='';
        if(match[2])href='https://www.instagram.com/'+match[2].replace(/^@/,'')+'/';
        else if(/^@/.test(visible))href='https://t.me/'+visible.slice(1);
        else{
            const trailing=visible.match(/[),.!؟،؛]+$/);
            if(trailing)visible=visible.slice(0,-trailing[0].length);
            href=/^https?:\/\//i.test(visible)?visible:'https://'+visible;
        }
        const a=document.createElement('a');
        a.className='promo-bio-link';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=visible;
        container.appendChild(a);
        cursor=pattern.lastIndex;
    }
    if(cursor<source.length)container.appendChild(document.createTextNode(source.slice(cursor)));
}
function renderPromoChannelPreview(title,description,visible=true){
    const wrap=document.getElementById('promoChannelPreview');
    const titleEl=document.getElementById('promoChannelPreviewTitle');
    const descEl=document.getElementById('promoChannelPreviewDescription');
    if(titleEl)titleEl.textContent=title||'';
    if(descEl)descEl.textContent=description||'توضیحی برای این کانال ثبت نشده است.';
    if(wrap)wrap.hidden=!visible||(!title&&!description);
}
function setPromoChannelStatus(message,type=''){
    const el=document.getElementById('promoChannelFetchStatus');
    if(!el)return;
    el.textContent=message;el.className='promo-channel-status'+(type?' '+type:'');
}
let promoFetchInFlight=false;
let promoFetchedForLink='';
async function fetchPromoChannelInfo(){
    const input=document.getElementById('editPromoLink');
    const btn=document.getElementById('fetchPromoChannelBtn');
    const link=(input?.value||'').trim();
    const username=cleanTelegramUsername(link);
    if(!username){setPromoChannelStatus('ابتدا لینک یا آیدی عمومی کانال را وارد کنید.','error');return;}
    if(promoFetchInFlight)return;
    promoFetchInFlight=true;
    if(btn){btn.disabled=true;btn.textContent='در حال دریافت…';}
    setPromoChannelStatus('در حال دریافت عنوان و توضیحات کانال از تلگرام…');
    try{
        let result={},lastFetchError=null;
        // اگر تلگرام پاسخ ناقص بدهد، دو بار دیگر با فاصله کوتاه تلاش می‌کنیم.
        for(let attempt=0;attempt<3;attempt++){
            try{
                const response=await fetch(GYM20_SUPABASE_URL+'/functions/v1/telegram-channel-info',{
                    method:'POST',
                    headers:{'apikey':GYM20_SUPABASE_ANON_KEY,'Authorization':'Bearer '+GYM20_SUPABASE_ANON_KEY,'Content-Type':'application/json'},
                    body:JSON.stringify({channel:link})
                });
                result=await response.json().catch(()=>({}));
                if(!response.ok||result.error)throw new Error(result.error||'دریافت اطلاعات کانال ناموفق بود.');
                lastFetchError=null;
                if(String(result.description||result.bio||'').trim()||attempt===2)break;
            }catch(fetchError){
                lastFetchError=fetchError;
                if(attempt===2)throw fetchError;
            }
            await new Promise(resolve=>setTimeout(resolve,450*(attempt+1)));
        }
        if(lastFetchError)throw lastFetchError;
        const fetchedTitle=String(result.title||'').trim();
        const fetchedDescription=String(result.description||result.bio||'').trim();
        const previousTitle=(document.getElementById('editPromoChannelTitle')?.value||'').trim();
        const previousDescription=(document.getElementById('editPromoChannelDescription')?.value||'').trim();
        // اگر تلگرام موقتاً بیو را خالی برگرداند، متن قبلی را پاک نکن.
        if(fetchedTitle)safeSetValue('editPromoChannelTitle',fetchedTitle);
        if(fetchedDescription)safeSetValue('editPromoChannelDescription',fetchedDescription);
        promoFetchedForLink=username;
        const displayTitle=fetchedTitle||previousTitle;
        const displayDescription=fetchedDescription||previousDescription;
        renderPromoChannelPreview(displayTitle,displayDescription,!!(displayTitle||displayDescription));
        if(fetchedDescription)setPromoChannelStatus('عنوان و بیوی کانال با موفقیت دریافت شد.','success');
        else if(previousDescription)setPromoChannelStatus('تلگرام این بار بیو را برنگرداند؛ متن ذخیره‌شده قبلی حفظ شد.','success');
        else setPromoChannelStatus('عنوان کانال دریافت شد؛ تلگرام پس از ۳ تلاش بیویی برنگرداند.','error');
    }catch(error){
        setPromoChannelStatus(error.message||'ارتباط با سرویس تلگرام برقرار نشد.','error');
    }finally{
        promoFetchInFlight=false;
        if(btn){btn.disabled=false;btn.textContent='دریافت اطلاعات کانال';}
    }
}
const promoFetchBtn=document.getElementById('fetchPromoChannelBtn');
if(promoFetchBtn)promoFetchBtn.addEventListener('click',fetchPromoChannelInfo);
const promoLinkInput=document.getElementById('editPromoLink');
if(promoLinkInput)promoLinkInput.addEventListener('input',()=>{
    const username=cleanTelegramUsername(promoLinkInput.value);
    if(username!==promoFetchedForLink){
        safeSetValue('editPromoChannelTitle','');safeSetValue('editPromoChannelDescription','');
        renderPromoChannelPreview('','',false);
        setPromoChannelStatus('آیدی کانال تغییر کرد؛ برای دریافت اطلاعات جدید، دکمه بالا را بزنید.');
    }
});


const meoxPromoModal=document.getElementById('meoxPromoModal');
const closeMeoxPromo=document.getElementById('closeMeoxPromo');
if(closeMeoxPromo)closeMeoxPromo.onclick=()=>{meoxPromoModal.style.display='none';};
const copyMeoxBtn=document.getElementById('copyMeoxCodeBtn');
if(copyMeoxBtn)copyMeoxBtn.onclick=()=>{
    const code=document.getElementById('meoxDiscountCode').innerText;
    safeCopyToClipboard(code, ()=>{
        copyMeoxBtn.innerText='کپی شد! ✓';
        setTimeout(()=>copyMeoxBtn.innerText='📋 کپی کد',2000);
    });
};

function triggerPromoPopupIfEnabled(){
    const pO=appData.promoPopup;
    if(pO&&pO.enabled!==false){
        setTimeout(()=>{if(meoxPromoModal)meoxPromoModal.style.display='flex';},1500);
    }
}

const GYM20_SUPABASE_URL = "https://iqjujumhoawlugrmjvyj.supabase.co", GYM20_SUPABASE_ANON_KEY = "sb_publishable_L8uWywK_73syAaq_wvr72Q_WlvD-IcZ";
function resumeGym20AdminSession(){
  // هنگام بازدید عادی هیچ CDN خارجی برای بررسی نشست مدیر بارگذاری نمی‌کنیم.
  // نشست ذخیره‌شده با کلیک مدیر و در همان لحظهٔ نیاز بررسی می‌شود.
  if(!window.supabase||typeof window.supabase.createClient!=='function')return;
  setTimeout(async()=>{
    try{const auth=await ensureGym20AdminAuth();await auth.verifyOwner();}
    catch(err){console.warn('Admin session check failed:',err);}
  },700);
}
const registrationForm = document.getElementById('publicRegistrationForm'), registrationStatus = document.getElementById('regStatus'), registrationSubmit = document.getElementById('regSubmitBtn'), paymentConfirmedEl = document.getElementById('regPaymentConfirmed');
function setRegistrationStatus(m,t=''){registrationStatus.textContent=m;registrationStatus.className='registration-status'+(t?' '+t:'');}
function updateRegistrationSubmitState(){registrationSubmit.disabled=!(acceptRulesEl.checked&&paymentConfirmedEl.checked&&currentRegionId);}
paymentConfirmedEl.addEventListener('change',updateRegistrationSubmitState);
let gym20StudentScheduleRealtimeClient=null;
let gym20StudentScheduleRealtimeChannel=null;
let gym20StudentScheduleRealtimeConnected=false;
let gym20StudentScheduleLastHiddenRefresh=0;
let gym20StudentScheduleRefreshTimer=null;
let gym20StudentScheduleStateTimer=null;
document.getElementById('viewMySessionsBtn')?.addEventListener('click',async()=>{
    const entered=prompt('شماره موبایلی را که هنگام ثبت‌نام وارد کرده‌اید بنویسید:');
    if(!entered)return;
    const phone=toEnglishDigits(entered).replace(/[^0-9]/g,'');
    if(phone.length<10||phone.length>15){setRegistrationStatus('شماره موبایل معتبر نیست.','error');return;}
    setRegistrationStatus('در حال دریافت برنامه کلاس‌ها…');
    const requestSchedule=async()=>{
        const response=await fetch(GYM20_SUPABASE_URL+'/rest/v1/rpc/get_student_public_schedule_by_phone',{
            method:'POST',
            cache:'no-store',
            headers:{'apikey':GYM20_SUPABASE_ANON_KEY,'Authorization':'Bearer '+GYM20_SUPABASE_ANON_KEY,'Content-Type':'application/json','Content-Profile':'gym20','Accept-Profile':'gym20','Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'},
            body:JSON.stringify({p_phone:phone})
        });
        if(!response.ok){const detail=await response.text().catch(()=> '');throw new Error('خطا در دریافت اطلاعات ('+response.status+') '+detail.slice(0,180));}
        const freshData=await response.json();
        if(!freshData||!Array.isArray(freshData.terms))throw new Error('پاسخ برنامه کلاس‌ها معتبر نیست');
        return freshData;
    };
    const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const faDate=v=>v?new Date(v).toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}):'—';
    const faTime=v=>v?new Date(v).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',hour12:false}):'—';
    const sessionState=s=>{
        if(s.status==='cancelled')return {label:'لغوشده',cls:'cancelled'};
        const start=Date.parse(s.starts_at),end=Date.parse(s.ends_at),now=Date.now();
        if(Number.isFinite(start)&&Number.isFinite(end)&&start<=now&&now<end)return {label:'در حال برگزاری',cls:'live'};
        if(Number.isFinite(end)&&end<=now)return {label:s.status==='completed'?'برگزارشده':'جلسه گذشته',cls:s.status==='completed'?'completed':'past'};
        if(s.status==='completed')return {label:'برگزارشده',cls:'completed'};
        return {label:'برنامه‌ریزی‌شده',cls:'scheduled'};
    };
    const renderTerms=data=>{
        const terms=Array.isArray(data.terms)?data.terms:[];
        const termHtml=terms.length?terms.map(term=>{
            const sessions=(Array.isArray(term.sessions)?term.sessions:[]).slice().sort((a,b)=>Date.parse(a.starts_at||'')-Date.parse(b.starts_at||'')||Number(a.session_number||0)-Number(b.session_number||0));
            const styles=Array.isArray(term.styles)?term.styles.join('، '):'';
            return '<section style="margin:12px 0;padding:12px;border:1px solid rgba(232,196,107,.28);border-radius:12px;background:rgba(255,255,255,.025)">'+
                '<div style="font-weight:800;color:#f0cf7a;font-size:15px">'+esc(term.term_name||'برنامه کلاس‌ها')+'</div>'+
                '<div style="font-size:11px;color:#aab2c1;margin:5px 0 10px">شروع: '+faDate(term.start_date)+'　 پایان: '+faDate(term.end_date)+'　 جلسات: '+esc(term.total_sessions||sessions.length)+'</div>'+
                (styles?'<div style="font-size:11px;margin-bottom:9px;color:#cbd5e1">سبک‌ها: '+esc(styles)+'</div>':'')+
                (sessions.length?'<div style="display:grid;gap:7px">'+sessions.map((s,i)=>{
                    const start=s.starts_at?new Date(s.starts_at):null;
                    const day=start?start.toLocaleDateString('fa-IR',{weekday:'long'}):'—';
                    const date=start?faDate(s.starts_at):'—';
                    const time=start?faTime(s.starts_at)+(s.ends_at?' تا '+faTime(s.ends_at):''):'—';
                    const state=sessionState(s);
                    return '<div class="gym20-student-session '+state.cls+'" style="display:grid;grid-template-columns:42px minmax(0,1fr);gap:8px;align-items:center;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035)">'+
                        '<div style="text-align:center;color:#f0cf7a;font-weight:800">جلسه '+esc(i+1)+'</div>'+
                        '<div style="min-width:0;font-size:11px;line-height:1.9;color:#e5e7eb">'+
                        '<div>'+esc(day)+' · '+esc(date)+' · '+esc(time)+'</div>'+
                        '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:#aab2c1"><span>مربی: '+esc(s.coach_name||'—')+'</span><span class="gym20-student-session-status '+state.cls+'">'+state.label+'</span>'+(s.attendance?'<span>حضور: '+esc(s.attendance)+'</span>':'')+'</div>'+
                        '</div></div>';
                }).join('')+'</div>':'<div style="font-size:12px;color:#aab2c1">جلسه‌ای برای این ترم ثبت نشده است.</div>')+
                '</section>';
        }).join(''):'<div style="padding:20px;text-align:center;color:#aab2c1">هنوز برنامه منتشرشده‌ای برای شما وجود ندارد.</div>';
        const target=document.getElementById('gym20StudentScheduleTerms');
        if(target)target.innerHTML=termHtml;
    };
    const stopLiveUpdates=()=>{
        if(gym20StudentScheduleRefreshTimer)clearInterval(gym20StudentScheduleRefreshTimer);
        if(gym20StudentScheduleStateTimer)clearInterval(gym20StudentScheduleStateTimer);
        gym20StudentScheduleRefreshTimer=null;gym20StudentScheduleStateTimer=null;
        gym20StudentScheduleRealtimeConnected=false;
        if(gym20StudentScheduleRealtimeClient&&gym20StudentScheduleRealtimeChannel){
            gym20StudentScheduleRealtimeClient.removeChannel(gym20StudentScheduleRealtimeChannel).catch(()=>{});
        }
        gym20StudentScheduleRealtimeChannel=null;
    };
    try{
        let data=await requestSchedule();
        if(!data){setRegistrationStatus('هنرجویی با این شماره پیدا نشد یا هنوز برنامه‌ای برای نمایش منتشر نشده است.','error');return;}
        document.getElementById('gym20StudentScheduleModal')?.remove();
        stopLiveUpdates();
        const modal=document.createElement('div');
        modal.id='gym20StudentScheduleModal';
        modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl';
        modal.innerHTML='<style>'+
            '#gym20StudentScheduleModal .gym20-student-session.live{background:linear-gradient(110deg,rgba(133,77,14,.32),rgba(250,204,21,.10))!important;border:1px solid #eab308!important;box-shadow:inset 4px 0 0 #facc15,0 0 14px rgba(250,204,21,.16)!important}'+
            '#gym20StudentScheduleModal .gym20-student-session-status{display:inline-flex;align-items:center;padding:1px 8px;border-radius:20px;font-size:10px;font-weight:900;background:rgba(255,255,255,.08);color:#cbd5e1}'+
            '#gym20StudentScheduleModal .gym20-student-session-status.live{background:#facc15!important;color:#17130a!important;border:1px solid #fde047!important;box-shadow:0 0 12px rgba(250,204,21,.4)!important}'+
            '#gym20StudentScheduleModal .gym20-student-session.live .gym20-student-session-status.live:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#17130a;margin-left:5px;animation:gym20StudentLivePulse 1.2s ease-in-out infinite}'+
            '@keyframes gym20StudentLivePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}'+
            '.gym20-student-session.past{opacity:.78}.gym20-student-session-status.cancelled{color:#fda4af;background:rgba(244,63,94,.13)}'+
            '.gym20-student-session-status.completed{color:#86efac;background:rgba(34,197,94,.13)}'+
            '#gym20StudentScheduleModal{color-scheme:dark!important}#gym20StudentScheduleModal>div{background:#101722!important;color:#f8fafc!important}#gym20StudentScheduleModal section{background:rgba(255,255,255,.025)!important;border-color:rgba(232,196,107,.28)!important}#gym20StudentScheduleModal .gym20-student-session{background:rgba(255,255,255,.035)!important;border-color:rgba(255,255,255,.07)!important;color:#e5e7eb!important}#gym20StudentScheduleModal .gym20-student-session>div:first-child{color:#f0cf7a!important}#gym20StudentScheduleModal .gym20-student-session>div:nth-child(2){color:#e5e7eb!important}'+
            '</style><div style="width:min(620px,100%);max-height:88vh;overflow:auto;background:#101722;color:#f8fafc;border:1px solid rgba(232,196,107,.35);border-radius:16px;padding:15px;box-shadow:0 18px 60px #0009">'+
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #ffffff18;padding-bottom:10px"><div><div style="font-weight:900;color:#f0cf7a;font-size:16px">📅 برنامه کلاس‌های من</div><div style="font-size:12px;color:#aab2c1;margin-top:4px">'+esc(data.student?.full_name||'هنرجو')+'</div></div><button type="button" id="closeGym20StudentSchedule" style="border:0;border-radius:8px;padding:7px 11px;background:#263244;color:white">بستن ✕</button></div>'+
            '<div id="gym20StudentScheduleTerms"></div></div>';
        document.body.appendChild(modal);
        renderTerms(data);
        const closeModal=()=>{stopLiveUpdates();modal.remove();};
        document.getElementById('closeGym20StudentSchedule')?.addEventListener('click',closeModal);
        modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
        let scheduleRefreshInFlight=false;
        const refreshSchedule=async()=>{
            if(scheduleRefreshInFlight)return;
            scheduleRefreshInFlight=true;
            try{const fresh=await requestSchedule();if(fresh){data=fresh;renderTerms(data);}}
            catch(err){console.warn('GYM20 live schedule refresh failed:',err);}
            finally{scheduleRefreshInFlight=false;}
        };
        // Keep schedule data fresh even if Broadcast is connected but a device misses an event.
        // Foreground: every 2 seconds; background: every 15 seconds.
        gym20StudentScheduleStateTimer=setInterval(()=>renderTerms(data),3000);
        gym20StudentScheduleRefreshTimer=setInterval(()=>{
            if(document.hidden){
                if(!gym20StudentScheduleLastHiddenRefresh || Date.now()-gym20StudentScheduleLastHiddenRefresh>=15000){
                    gym20StudentScheduleLastHiddenRefresh=Date.now();
                    refreshSchedule();
                }
            }else{
                refreshSchedule();
            }
        },2000);
        document.addEventListener('visibilitychange',()=>{
            if(!document.hidden)refreshSchedule();
        });
        if(data.realtime_topic){
            try{
                await loadGym20SupabaseSdk();
                if(!gym20StudentScheduleRealtimeClient){
                    gym20StudentScheduleRealtimeClient=window.supabase.createClient(GYM20_SUPABASE_URL,GYM20_SUPABASE_ANON_KEY,{
                        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
                    });
                }
                gym20StudentScheduleRealtimeChannel=gym20StudentScheduleRealtimeClient
                    .channel('student-schedule:'+data.realtime_topic)
                    .on('broadcast',{event:'schedule_updated'},()=>{refreshSchedule();})
                    .subscribe(status=>{
                        gym20StudentScheduleRealtimeConnected=status==='SUBSCRIBED';
                        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')console.warn('GYM20 schedule realtime status:',status);
                    });
            }catch(realtimeError){console.warn('GYM20 realtime unavailable; polling fallback is active.',realtimeError);}
        }
        setRegistrationStatus('');
    }catch(err){console.error('Student schedule lookup failed:',err);setRegistrationStatus('دریافت برنامه با خطا مواجه شد. لطفاً دوباره تلاش کنید.','error');}
});

registrationForm.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!currentRegionId){setRegistrationStatus('لطفاً منطقه را انتخاب کنید.','error');return;}
    if(!acceptRulesEl.checked){setRegistrationStatus('قوانین را بپذیرید.','error');return;}
    if(!paymentConfirmedEl.checked){setRegistrationStatus('تیک پرداخت را بزنید.','error');return;}
    
    const fn=document.getElementById('regFullName').value.trim();
    const ph=toEnglishDigits(document.getElementById('regPhone').value.trim());
    const rB=toEnglishDigits((document.getElementById('regBirthDateShamsi').value||'').trim());
    const notes=document.getElementById('regNotes').value.trim()||null;
    const styles=(appData.styles||[]).filter(s=>selectedStyles.includes(s.id)).map(s=>s.name.trim()).filter(Boolean);
    
    if(fn.length<2||!ph||!styles.length){setRegistrationStatus('نام، موبایل و حداقل یک سبک لازم است.','error');return;}
    
    let gB=null,sTag='';if(rB){const p=rB.split(/[\/\-\.]/);if(p.length===3)gB=jalaliToGregorian(p[0],p[1],p[2]);sTag=`[تولد شمسی: ${rB}]\n`;}
    const act=(appData.regions||[]).find(r=>r.id===currentRegionId),rTag=act?`[منطقه: ${act.name}]\n`:'',cNotes=(rTag+sTag+(notes||'')).trim()||null;
    
    registrationSubmit.disabled=true;registrationSubmit.textContent='در حال ارسال…';setRegistrationStatus('');
    try{
        const res=await fetch(GYM20_SUPABASE_URL+'/rest/v1/rpc/submit_public_registration',{
            method:'POST',
            headers:{
                'apikey':GYM20_SUPABASE_ANON_KEY,
                'Authorization':'Bearer '+GYM20_SUPABASE_ANON_KEY,
                'Content-Type':'application/json',
                'Content-Profile':'gym20',
                'Accept-Profile':'gym20'
            },
            body:JSON.stringify({p_full_name:fn,p_phone:ph,p_birth_date:gB,p_notes:cNotes,p_selected_styles:styles,p_age_group:currentAge,p_class_type:currentClassType,p_total_sessions:Number(currentSessions),p_payment_confirmed:true})
        });
        const resData=await res.json().catch(()=>null);
        if (!res.ok || !resData) {
            const serverMessage = typeof resData === 'string' ? resData : (resData?.message || resData?.hint || '');
            throw new Error(serverMessage || 'ثبت درخواست در پایگاه داده ناموفق بود.');
        }
        registrationForm.reset();acceptRulesEl.checked=false;paymentConfirmedEl.checked=false;paymentSectionEl.style.display='none';updateRegistrationSubmitState();setRegistrationStatus('ثبت‌نام با موفقیت انجام شد.','success');
        
        // ارسال گزارش ثبت‌نام به تلگرام (کانال، مدیر و همکاران)
        const cNMap = { normal: 'عمومی', semi: 'نیمه‌خصوصی', private: 'خصوصی', vip: 'VIP 👑', online: 'آنلاین 🌐' };
        const priceText = document.getElementById('finalPrice')?.innerText || '';
        const regInfo = {
            fullName: fn,
            phone: ph,
            birthDate: rB,
            regionName: act ? act.name : '',
            styles: styles.join('، '),
            ageGroup: currentAge,
            classTypeName: cNMap[currentClassType] || currentClassType,
            sessions: currentSessions,
            price: priceText,
            notes: notes
        };
        dispatchTelegramNotification(regInfo).catch(err => { console.warn('Telegram notification error:', err); setRegistrationStatus('ثبت‌نام انجام شد؛ اما پیام تلگرام ارسال نشد: ' + (err.message || 'خطای نامشخص'), 'error'); });
    }catch(err){setRegistrationStatus(err.message||'خطا در ارسال.','error');}finally{registrationSubmit.textContent=(appData.buttons&&appData.buttons.submitReg)||'ارسال درخواست ثبت‌نام';updateRegistrationSubmitState();}
});

function isValidGym20SiteConfig(data){
  return !!data&&typeof data==='object'&&Array.isArray(data.regions)&&data.regions.length>0;
}
function normalizeGym20SiteConfig(data){
  appData=data&&typeof data==='object'?data:{};
  if(!Array.isArray(appData.regions))appData.regions=[];
  if(!Array.isArray(appData.styles))appData.styles=[];
  if(!appData.rules)appData.rules={};
  Object.keys(appData.rules).forEach(key=>{appData.rules[key]=normalizeRuleText(appData.rules[key]);});
  if(!appData.rules.online)appData.rules.online="• برگزاری کلاس‌ها به‌صورت زنده (Live) با ارتباط تصویری دوطرفه.\n• نظارت مستقیم مربی بر اجرای صحیح تکنیک‌ها.";
  if(!appData.classTypesConfig)appData.classTypesConfig={normal:{enabled:true,statusText:"",allowedStyles:[]},semi:{enabled:true,statusText:"",allowedStyles:[]},private:{enabled:true,statusText:"",allowedStyles:[]},vip:{enabled:true,statusText:"",allowedStyles:[]},online:{enabled:true,statusText:"",allowedStyles:[]}};
  if(!appData.promoPopup)appData.promoPopup={enabled:true,title:"✨ گالری اکسسوری و استایل میوکس",text:"خاص‌ترین دستبندها، گردنبندهای استیل و اکسسوری‌های ورزشی با تخفیف ویژه همراهان آکادمی GYM20!",code:"MEOX20",link:"https://t.me/MEOWX_ACCS",img:"",btnText:"ورود به کانال و مشاهده محصولات 🛍️"};
}
function renderGym20SiteConfig(showPromo){
  renderCustomRegionDropdown();
  applyDataToUI();
  updateClassStatusAndStylesFlow();
  if(showPromo)triggerPromoPopupIfEnabled();
}
async function gym20FetchWithTimeout(url,options,timeoutMs){
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  const requestOptions=Object.assign({},options||{});
  if(controller)requestOptions.signal=controller.signal;
  try{return await fetch(url,requestOptions);}
  finally{if(timer)clearTimeout(timer);}
}
async function fetchLiveGym20SiteConfig(){
  const headers={
    'apikey':GYM20_SUPABASE_ANON_KEY,
    'Authorization':'Bearer '+GYM20_SUPABASE_ANON_KEY,
    'Content-Type':'application/json',
    'Content-Profile':'gym20',
    'Accept-Profile':'gym20'
  };
  try{
    const response=await gym20FetchWithTimeout(GYM20_SUPABASE_URL+'/rest/v1/rpc/get_site_config',{
      method:'POST',headers,body:'{}',cache:'no-store'
    },4000);
    if(response.ok){
      const data=await response.json();
      if(isValidGym20SiteConfig(data))return data;
    }
  }catch(e){}
  try{
    const response=await gym20FetchWithTimeout(GYM20_SUPABASE_URL+'/rest/v1/site_settings?key=eq.public_site_config&select=value',{
      headers:{
        'apikey':GYM20_SUPABASE_ANON_KEY,
        'Authorization':'Bearer '+GYM20_SUPABASE_ANON_KEY,
        'Accept-Profile':'gym20'
      },
      cache:'no-store'
    },3000);
    if(response.ok){
      const rows=await response.json();
      const data=rows&&rows[0]&&rows[0].value;
      if(isValidGym20SiteConfig(data))return data;
    }
  }catch(e){}
  return null;
}
async function loadDataAndInit(){
  let initialRendered=false,promoTriggered=false;
  function acceptConfig(data){
    if(!isValidGym20SiteConfig(data))return false;
    try{localStorage.setItem('sports_reg_data',JSON.stringify(data));}catch(e){}
    if(initialRendered&&gym20UserInteracted&&Array.isArray(appData.regions)&&appData.regions.length>0)return true;
    normalizeGym20SiteConfig(data);
    const shouldShowPromo=!promoTriggered;
    renderGym20SiteConfig(shouldShowPromo);
    if(shouldShowPromo&&appData.promoPopup?.enabled!==false)promoTriggered=true;
    if(!initialRendered){
      initialRendered=true;
    }else if(gym20OwnerAuthorized&&document.getElementById('adminModal').style.display==='flex'){
      loadAdminForm();
    }
    return true;
  }

  // نمایش فوری نسخه ذخیره‌شده؛ منتظر پاسخ شبکه نمی‌مانیم.
  try{
    const cached=JSON.parse(localStorage.getItem('sports_reg_data')||'null');
    if(isValidGym20SiteConfig(cached))acceptConfig(cached);
  }catch(e){}

  // دریافت تنظیمات زنده از Supabase کاملاً در پس‌زمینه انجام می‌شود.
  // کندی یا قطعی دیتابیس نباید نمایش صفحه اصلی یا آماده‌شدن رابط را متوقف کند.
  fetchLiveGym20SiteConfig().then(data=>{if(data)acceptConfig(data);}).catch(()=>{});

  // فایل محلی نیز در پس‌زمینه دریافت می‌شود؛ محتوای اولیه HTML از قبل قابل نمایش است.
  // استفاده از کش عادی مرورگر، درخواست شبکه غیرضروری در هر بار بازدید را کاهش می‌دهد.
  gym20FetchWithTimeout('./data.json',{cache:'default'},5000).then(async response=>{
    if(!response.ok)throw new Error('data.json HTTP '+response.status);
    const data=await response.json();
    // data.json is only a last-resort bootstrap fallback. Never let it replace
    // a valid cached or live Supabase configuration (it may be older).
    if(!initialRendered)acceptConfig(data);
  }).catch(error=>console.warn('GYM20 local config load failed:',error));
}
loadDataAndInit().then(()=>{
  gym20AppDataLoaded=true;
  if(gym20OwnerAuthorized)openAuthorizedAdminPanel();
}).catch(err=>console.error('GYM20 initial configuration failed:',err));
resumeGym20AdminSession();
