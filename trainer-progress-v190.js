(()=>{
'use strict';
if(window.__denisfitProgressV190)return;
window.__denisfitProgressV190=true;

let queued=false;
function normalizeProgressRows(){
  document.querySelectorAll('#dfdClientProgress .dfd-progress-row').forEach(row=>{
    const text=row.querySelector('span');
    const badge=row.querySelector('strong');
    if(!text||!badge||row.dataset.progressV190==='1')return;
    const raw=(text.textContent||'').trim();
    const match=raw.match(/^(.*?)\s*→\s*(.*?)\s*·\s*ср\.\s*рабочий вес\s*·\s*(\d+)\s*трен\.$/i);
    if(!match)return;
    const count=Number(match[3]||0);
    if(count===1){
      const current=match[2].trim();
      text.textContent=`${current} · стартовый рабочий вес · после 2-й тренировки появится прогресс`;
      badge.textContent='СТАРТ';
      badge.classList.remove('up','down');
      badge.setAttribute('aria-label','Стартовая точка. Для расчёта прогресса нужна вторая тренировка.');
    }
    row.dataset.progressV190='1';
  });
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;normalizeProgressRows()});
}
window.addEventListener('load',()=>{
  const main=document.getElementById('main');
  if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
  schedule();
});
window.addEventListener('pageshow',schedule);
})();
