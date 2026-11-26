/* GYM20 circular spectrum — restored from the Nov 9, 2026 approved version. */
(function(){
  const ring=document.querySelector('#musicCardLink .music-avatar-ring');
  if(!ring)return;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total=72;
  ring.replaceChildren();
  const bars=[];
  for(let i=0;i<total;i++){
    const bar=document.createElement('i');
    const angle=i*360/total;
    bar.style.setProperty('--angle',angle+'deg');
    ring.appendChild(bar);
    bars.push({el:bar,angle:angle*Math.PI/180});
  }
  function draw(time){
    const t=time/1000;
    bars.forEach(({el,angle})=>{
      /* G profile: stronger layered wave on the right, short transient peaks on the left. */
      const side=Math.sin(angle);
      const right=Math.max(0,side);
      const left=Math.max(0,-side);
      const broad=(Math.sin(t*1.35+angle*1.8)+1)/2;
      const rolling=(Math.sin(t*2.05-angle*3.1)+1)/2;
      const ripple=(Math.sin(t*3.0+angle*5.2)+1)/2;
      const rightWave=broad*.42+rolling*.36+ripple*.22;
      const leftWave=.10;
      const leftPeaks=Math.pow(Math.max(0,Math.sin(t*.72+angle*4.6)),18)*4.8;
      const height=2.1
        +right*(1.4+rightWave*5.2)
        +left*(.65+leftWave*2.0+leftPeaks);
      const activity=right*rightWave+left*(leftWave*.45+(leftPeaks/4.8)*.08);
      el.style.height=height.toFixed(1)+'px';
      el.style.opacity=(.58+activity*.3).toFixed(2);
    });
  }
  draw(0);
  if(reduceMotion)return;
  let raf=0;
  function animate(now){draw(now);raf=requestAnimationFrame(animate);}
  raf=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);}
    else{raf=requestAnimationFrame(animate);}
  });
})();