/* Legacy compatibility: six-dot tab handles are intentionally removed. */
(function(){
 'use strict';
 const remove=()=>document.querySelectorAll('#adminModal .admin-tabs .gym20-tab-grip').forEach(el=>el.remove());
 remove();
 if(document.documentElement){new MutationObserver(remove).observe(document.documentElement,{childList:true,subtree:true});}
})();
