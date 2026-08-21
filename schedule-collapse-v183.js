(() => {
'use strict';

const STORAGE_KEY='denisfit_schedule_create_collapsed_v1';

function savedCollapsed(){
  try{
    const value=localStorage.getItem(STORAGE_KEY);
    return value===null ? true : value==='1';
  }catch{return true}
}

function saveCollapsed(value){
  try{localStorage.setItem(STORAGE_KEY,value?'1':'0')}catch{}
}

function setCollapsed(card,value,{persist=true}={}){
  const head=card.querySelector('.schedule-collapse-head');
  const arrow=card.querySelector('.schedule-collapse-arrow');
  card.classList.toggle('is-collapsed',value);
  if(head)head.setAttribute('aria-expanded',String(!value));
  if(arrow)arrow.textContent=value?'⌄':'⌃';
  if(persist)saveCollapsed(value);
}

function enhanceScheduleCreateCard(){
  const card=document.getElementById('scheduleCreateCard');
  if(!card||card.dataset.collapseReady==='1')return;

  const title=Array.from(card.children).find(el=>el.tagName==='B'&&el.textContent.trim()==='Новая запись');
  if(!title)return;

  card.dataset.collapseReady='1';
  card.classList.add('schedule-collapsible');

  const contentNodes=Array.from(card.childNodes).filter(node=>node!==title);
  title.remove();

  const head=document.createElement('button');
  head.type='button';
  head.className='schedule-collapse-head';
  head.innerHTML='<span class="schedule-collapse-copy"><strong>Новая запись</strong><small>Добавить тренировку в расписание</small></span><span class="schedule-collapse-arrow" aria-hidden="true">⌄</span>';

  const body=document.createElement('div');
  body.className='schedule-collapse-body';
  const inner=document.createElement('div');
  inner.className='schedule-collapse-inner';
  contentNodes.forEach(node=>inner.appendChild(node));
  body.appendChild(inner);

  card.append(head,body);

  setCollapsed(card,savedCollapsed(),{persist:false});
  head.onclick=()=>setCollapsed(card,!card.classList.contains('is-collapsed'));
}

const observer=new MutationObserver(enhanceScheduleCreateCard);
window.addEventListener('load',()=>{
  const main=document.getElementById('main');
  if(main)observer.observe(main,{childList:true,subtree:true});
  enhanceScheduleCreateCard();
});
})();
