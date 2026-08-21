(() => {
'use strict';

// v19.8 bootstrap: this file is already present in older DenisFit shells,
// so it can force-load the new workflow even when index.html is stale.
window.__denisfitClientWorkflowV191=true;
function loadV192(){
  if(!document.querySelector('link[data-dfv192]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/client-workflow-v192.css?v=19.2.0';l.dataset.dfv192='1';document.head.append(l);
  }
  if(!document.querySelector('script[data-dfv192]')&&!window.__denisfitClientWorkflowV192){
    const s=document.createElement('script');s.src='/client-workflow-v192.js?v=19.2.0';s.dataset.dfv192='1';document.head.append(s);
  }
}

function restoreExerciseBaseMenu(){
  const button=document.querySelector('#nav [data-page="library"]');
  if(!button)return;
  button.style.removeProperty('display');
  button.removeAttribute('aria-hidden');
  button.removeAttribute('tabindex');
  const label=Array.from(button.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
  if(label!=='База'){
    const icon=button.querySelector('b')?.textContent||'▤';
    button.innerHTML=`<b>${icon}</b>База`;
  }
}
function removeOldManualShortcut(){document.getElementById('manualExerciseEntry')?.remove()}
function renameTrainerLibraryScreen(){
  const trainer=document.getElementById('roleBadge')?.textContent?.trim()==='ТРЕНЕР';if(!trainer)return;
  const title=document.getElementById('main')?.querySelector('h1');if(title?.textContent.trim()==='Библиотека')title.textContent='База упражнений';
}
function sync(){restoreExerciseBaseMenu();removeOldManualShortcut();renameTrainerLibraryScreen();loadV192()}
let queued=false;
function scheduleSync(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
function start(){
  sync();
  const nav=document.getElementById('nav'),main=document.getElementById('main');
  if(nav)new MutationObserver(scheduleSync).observe(nav,{childList:true,subtree:true});
  if(main)new MutationObserver(scheduleSync).observe(main,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('pageshow',scheduleSync);
})();
