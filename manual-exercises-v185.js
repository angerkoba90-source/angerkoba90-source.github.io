(() => {
'use strict';

const $=id=>document.getElementById(id);

function hideExerciseLibraryFromMenu(){
  const button=document.querySelector('#nav [data-page="library"]');
  if(!button)return;
  button.style.display='none';
  button.setAttribute('aria-hidden','true');
  button.setAttribute('tabindex','-1');
}

function addManualExerciseEntryToPrograms(){
  const main=$('main');
  if(!main)return;
  const title=main.querySelector('h1');
  if(!title||title.textContent.trim()!=='Программы')return;
  if($('manualExerciseEntry'))return;
  const actions=main.querySelector('.client-actions-grid');
  if(!actions)return;

  const button=document.createElement('button');
  button.id='manualExerciseEntry';
  button.type='button';
  button.className='btn secondary big-action';
  button.textContent='＋ Добавить упражнение';
  button.onclick=()=>{
    const libraryButton=document.querySelector('#nav [data-page="library"]');
    if(libraryButton)libraryButton.click();
  };
  actions.appendChild(button);
}

function sync(){
  hideExerciseLibraryFromMenu();
  addManualExerciseEntryToPrograms();
}

const observer=new MutationObserver(sync);
window.addEventListener('load',()=>{
  sync();
  observer.observe(document.body,{childList:true,subtree:true});
});
})();
