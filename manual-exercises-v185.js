(() => {
'use strict';

function restoreExerciseBaseMenu(){
  const button=document.querySelector('#nav [data-page="library"]');
  if(!button)return;
  if(button.style.display==='none')button.style.removeProperty('display');
  if(button.hasAttribute('aria-hidden'))button.removeAttribute('aria-hidden');
  if(button.hasAttribute('tabindex'))button.removeAttribute('tabindex');
  const label=Array.from(button.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
  if(label!=='База'){
    const icon=button.querySelector('b')?.textContent||'▤';
    button.innerHTML=`<b>${icon}</b>База`;
  }
}

function removeOldManualShortcut(){
  document.getElementById('manualExerciseEntry')?.remove();
}

function renameTrainerLibraryScreen(){
  const trainer=document.getElementById('roleBadge')?.textContent?.trim()==='ТРЕНЕР';
  if(!trainer)return;
  const title=document.getElementById('main')?.querySelector('h1');
  if(title?.textContent.trim()==='Библиотека')title.textContent='База упражнений';
}

function sync(){
  restoreExerciseBaseMenu();
  removeOldManualShortcut();
  renameTrainerLibraryScreen();
}

let queued=false;
function scheduleSync(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync()});
}

window.addEventListener('load',()=>{
  sync();
  const nav=document.getElementById('nav');
  const main=document.getElementById('main');
  if(nav)new MutationObserver(scheduleSync).observe(nav,{childList:true,subtree:true});
  if(main)new MutationObserver(scheduleSync).observe(main,{childList:true,subtree:true});
});
window.addEventListener('pageshow',scheduleSync);
})();
