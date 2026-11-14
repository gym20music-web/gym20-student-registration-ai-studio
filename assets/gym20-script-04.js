/* Smooth, continuous simulated spectrum for the mini player; visual only. */
(function(){
  const bars=Array.from(document.querySelectorAll('#musicCardLink .music-mini-eq i'));
  if(!bars.length)return;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion)return;
  const phases=bars.map((_,i)=>i*.47);
  function draw(ms){
    const t=ms/1000;
    bars.forEach((bar,i)=>{
      const p=phases[i];
      const slow=(Math.sin(t*1.65+p)+1)/2;
      const mid=(Math.sin(t*2.35-p*.72)+1)/2;
      const fine=(Math.sin(t*3.1+p*1.31)+1)/2;
      const level=.52*slow+.31*mid+.17*fine;
      bar.style.height=(2.2+level*6.2).toFixed(1)+'px';
      bar.style.opacity=(.68+level*.30).toFixed(2);
    });
  }
  let raf=0;
  function animate(now){if(document.hidden)return;draw(now);raf=requestAnimationFrame(animate);}
  function stop(){cancelAnimationFrame(raf);}
  function start(){if(!document.hidden){stop();raf=requestAnimationFrame(animate);}}
  draw(0);start();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
})();