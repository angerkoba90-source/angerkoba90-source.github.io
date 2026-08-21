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
  const shortcut=document.getElementById('manualExerciseEntry');
  if(shortcut)shortcut.remove();
}

function renameTrainerLibraryScreen(){
  const trainer=document.getElementById('roleBadge')?.textContent?.trim()==='ТРЕНЕР';
  if(!trainer)return;
  const main=document.getElementById('main');
  const title=main?.querySelector('h1');
  if(title&&title.textContent.trim()==='Библиотека')title.textContent='База упражнений';
}

function sync(){
  restoreExerciseBaseMenu();
  removeOldManualShortcut();
  renameTrainerLibraryScreen();
}

const observer=new MutationObserver(sync);
window.addEventListener('load',()=>{
  sync();
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','aria-hidden','tabindex']});
});
})();
