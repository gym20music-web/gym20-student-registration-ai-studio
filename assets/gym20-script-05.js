/* GYM20 circular spectrum — calm right arc, gently traveling left wave. */
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
      /* Right arc stays visually steady: only a tiny, slow breathing motion. */
      const rightBreath=Math.sin(t*1.05+angle*1.15);
      /* Left arc carries a smooth wave that travels back and forth around the ring. */
      const leftTravel=Math.sin(t*1.18+angle*2.25);
      const leftDrift=Math.sin(t*1.72-angle*1.35);
      const leftFine=Math.sin(t*2.15+angle*3.1);
      const rightHeight=5.0+rightBreath*.22;
      const leftHeight=4.1
        +(leftTravel+1)*1.85
        +(leftDrift+1)*.58
        +leftFine*.22;
      const height=right*rightHeight+left*leftHeight;
      const activity=right*(.52+rightBreath*.05)
        +left*(.58+((leftTravel+1)/2)*.30+((leftDrift+1)/2)*.12);
      el.style.height=height.toFixed(2)+'px';
      el.style.opacity=(.68+activity*.16).toFixed(2);
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