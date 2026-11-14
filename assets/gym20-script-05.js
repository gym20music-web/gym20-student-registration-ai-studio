/* GYM20 circular spectrum — restrained premium motion. */
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
    bars.push({
      el,
      angle:angle*Math.PI/180,
      height:4.6
    });
  }

  function draw(ms,blend=1){
    const t=ms/1000;
    /* One quiet crest glides along the left semicircle and gently reverses. */
    const crest=.5+.29*Math.sin(t*.62);
    bars.forEach(bar=>{
      const side=Math.sin(bar.angle);
      const right=Math.max(0,side);
      const left=Math.max(0,-side);
      let target;

      if(right){
        /* The right arc is almost still, with only a barely visible breath. */
        target=4.65+.10*Math.sin(t*.48+bar.angle*.35);
      }else{
        const u=(bar.angle-Math.PI)/Math.PI;
        const distance=(u-crest)/.205;
        const peak=Math.exp(-.5*distance*distance);
        const softRipple=.10*Math.sin(t*.58+u*2.4);
        target=3.65+2.05*peak+softRipple;
      }

      bar.height+=(target-bar.height)*blend;
      bar.el.style.height=bar.height.toFixed(2)+'px';
      bar.el.style.opacity=right?'.76':(.72+.07*Math.min(1,(target-3.6)/2.1)).toFixed(2);
    });
  }

  draw(0);
  if(reduceMotion)return;

  let raf=0,last=0;
  function animate(now){
    if(document.hidden)return;
    const delta=last?Math.min(50,now-last):16;
    last=now;
    const blend=1-Math.exp(-delta/115);
    draw(now,blend);
    raf=requestAnimationFrame(animate);
  }
  function stop(){cancelAnimationFrame(raf);last=0;}
  function start(){if(!document.hidden){stop();raf=requestAnimationFrame(animate);}}
  start();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
})();