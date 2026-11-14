/* GYM20 circular spectrum — 32 fine radial bars, gentle left/right asymmetry; no ring rotation. */
(function(){
  const ring=document.querySelector('#musicCardLink .music-avatar-ring');
  if(!ring)return;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total=32;
  ring.replaceChildren();
  const bars=[];
  for(let i=0;i<total;i++){
    const angle=i*360/total;
    const el=document.createElement('i');
    el.style.setProperty('--angle',angle+'deg');
    ring.appendChild(el);
    bars.push({el,angle:angle*Math.PI/180});
  }
  function draw(ms){
    const t=ms/1000;
    bars.forEach(({el,angle})=>{
      /* 0° is top; positive sine is the right half. */
      const side=Math.sin(angle);
      const right=Math.max(0,side), left=Math.max(0,-side);
      const slow=(Math.sin(t*1.05+angle*1.7)+1)/2;
      const soft=(Math.sin(t*1.55-angle*2.1)+1)/2;
      const fine=(Math.sin(t*2.0+angle*3.0)+1)/2;
      const rightWave=.52*slow+.31*soft+.17*fine;
      const leftWave=.58+((Math.sin(t*1.2+angle*2.4)+1)/2)*.24;
      const h=2.0+right*(1.0+rightWave*2.4)+left*(.35+leftWave*1.0);
      const opacity=.58+right*rightWave*.30+left*leftWave*.12;
      el.style.height=h.toFixed(2)+'px';
      el.style.opacity=opacity.toFixed(2);
    });
  }
  draw(0);
  if(reduceMotion)return;
  let raf=0, paused=false;
  function animate(now){if(paused||document.hidden)return;draw(now);raf=requestAnimationFrame(animate);}
  function start(){if(paused||document.hidden)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(animate);}
  function stop(){cancelAnimationFrame(raf);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  start();
})();