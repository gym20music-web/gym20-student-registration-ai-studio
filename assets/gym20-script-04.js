
/* Smooth simulated spectrum on the miniature seek bar; visual only. */
(function(){
  const bars=Array.from(document.querySelectorAll('#musicCardLink .music-mini-eq i'));
  if(!bars.length)return;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion)return;
  let anchors=Array.from({length:11},()=>.12+Math.random()*.88);
  const tick=()=>{
    if(document.hidden)return;
    anchors=anchors.map(v=>Math.max(.06,Math.min(1,v+(Math.random()-.5)*.62)));
    bars.forEach((bar,i)=>{
      const p=i/(bars.length-1)*(anchors.length-1),a=Math.floor(p),t=p-a;
      const sm=t*t*(3-2*t),wave=anchors[a]*(1-sm)+anchors[Math.min(a+1,anchors.length-1)]*sm;
      bar.style.height=(2+8*Math.max(.05,Math.min(1,wave+(Math.random()-.5)*.22))).toFixed(1)+'px';
    });
  };
  tick();window.setInterval(tick,120);
})();
