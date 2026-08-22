(()=>{
'use strict';
if(window.__workoutJournalV14)return;
window.__workoutJournalV14=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m));

function setRow(index,w='',r=''){
  return `<div class="jw13-set${w!==''&&r!==''?' filled':''}" data-jw13-set>
    <div class="jw13-set-no">${index}</div>
    <label><span>Вес</span><div class="jw13-input-wrap"><input class="jw13-weight" inputmode="decimal" autocomplete="off" aria-label="Вес подход ${index}" value="${esc(w)}"><b>кг</b></div></label>
    <label><span>Повторы</span><div class="jw13-input-wrap"><input class="jw13-reps" inputmode="numeric" autocomplete="off" aria-label="Повторы подход ${index}" value="${esc(r)}"><b>×</b></div></label>
    <button class="jw13-rm" type="button" aria-label="Удалить подход">×</button>
  </div>`;
}

function refresh(card){
  const count=qa('[data-jw13-set]',card).length;
  const label=q('[data-jw13-count]',card);
  if(label)label.textContent=`${count} подх.`;
  const countNode=q('[data-jw14-count]',card);
  if(countNode)countNode.textContent=String(count);
}

function enhanceCard(card){
  if(!card||q('.jw14-add-set',card))return;
  const list=q('.jw13-set-list',card);
  if(!list)return;
  const button=document.createElement('button');
  button.type='button';
  button.className='jw14-add-set';
  button.innerHTML='<span>＋</span><b>Добавить подход</b><i data-jw14-count></i>';
  list.insertAdjacentElement('afterend',button);
  refresh(card);
}

function enhance(){
  qa('.jw13-exercise').forEach(enhanceCard);
}

function addSet(card){
  const list=q('.jw13-set-list',card);
  const rows=qa('[data-jw13-set]',card);
  if(!list||!rows.length)return;
  const last=rows.at(-1);
  const w=q('.jw13-weight',last)?.value??'';
  const r=q('.jw13-reps',last)?.value??'';
  const index=rows.length+1;
  list.insertAdjacentHTML('beforeend',setRow(index,w,r));
  const row=qa('[data-jw13-set]',card).at(-1);
  refresh(card);
  row?.animate?.(
    [{opacity:0,transform:'translateY(-10px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],
    {duration:190,easing:'cubic-bezier(.2,.8,.2,1)'}
  );
  row?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
  const button=q('.jw14-add-set',card);
  button?.animate?.([{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:150,easing:'ease-out'});
}

document.addEventListener('click',e=>{
  const button=e.target.closest?.('.jw14-add-set');
  if(!button)return;
  e.preventDefault();
  const card=button.closest('.jw13-exercise');
  if(card)addSet(card);
},true);

const modal=q('#modal');
if(modal)new MutationObserver(()=>requestAnimationFrame(enhance)).observe(modal,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  if(e.target.closest?.('.jw13-rm'))setTimeout(()=>{const card=e.target.closest?.('.jw13-exercise');if(card)refresh(card)},160);
},true);
window.addEventListener('pageshow',enhance);
enhance();
})();
