/* GYM20 circular spectrum — restore fuller original wave with 32 fine radial bars. */
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
      /* 0° points up; positive sine is the right half of the ring. */
      const side=Math.sin(angle);
      const right=Math.max(0,side), left=Math.max(0,-side);
      const broad=(Math.sin(t*1.35+angle*1.8)+1)/2;
      const rolling=(Math.sin(t*2.05-angle*3.1)+1)/2;
      const ripple=(Math.sin(t*3.0+angle*5.2)+1)/2;
      const rightWave=broad*.42+rolling*.36+ripple*.22;
      /* Keep a visible, delicate ripple on the left instead of nearly bare stubs. */
      const leftWave=.10+((Math.sin(t*1.35+angle*2.7)+1)/2)*.13;
      const leftPeaks=Math.pow(Math.max(0,Math.sin(t*.9+angle*3.7)),12);
      const height=2.1
        +right*(1.4+rightWave*5.2)
        +left*(.75+leftWave*2.0+leftPeaks*3.1);
      const activity=right*rightWave+left*(leftWave*.55+leftPeaks*.3);
      el.style.height=height.toFixed(1)+'px';
      el.style.opacity=(.6+activity*.28).toFixed(2);
    });
  }
  draw(0);
  if(reduceMotion)return;
  let raf=0;
  function animate(now){if(document.hidden)return;draw(now);raf=requestAnimationFrame(animate);}
  function stop(){cancelAnimationFrame(raf);}
  function start(){if(!document.hidden){stop();raf=requestAnimationFrame(animate);}}
  start();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
})();