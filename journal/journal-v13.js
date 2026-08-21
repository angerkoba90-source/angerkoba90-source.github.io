(()=>{
'use strict';
if(window.__workoutJournalV13)return;
window.__workoutJournalV13=true;

const KEY='workout-journal-v1';
const SCHEDKEY='workout-journal-schedule-v3';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m));
const norm=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');
const load=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let currentEventId='';

function fmtDate(value){
  return new Date(value+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
}
function fmtShort(value){
  return new Date(value+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
}
function num(value){
  if(value===''||value==null)return null;
  const n=Number(String(value).replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function pretty(value){
  const n=Number(value||0);
  return Number.isInteger(n)?String(n):String(Math.round(n*10)/10).replace('.',',');
}
function previousExercise(name,beforeDate){
  const data=load(KEY,{workouts:[]});
  const workouts=Array.isArray(data.workouts)?data.workouts:[];
  let best=null;
  workouts.forEach((w,wi)=>{
    if(!w?.date||w.date>beforeDate)return;
    (w.exercises||[]).forEach(ex=>{
      if(norm(ex?.name)!==norm(name))return;
      const candidate={date:w.date,order:wi,sets:(ex.sets||[]).filter(s=>s&&((+s.w||0)||(+s.r||0)))};
      if(!candidate.sets.length)return;
      if(!best||candidate.date>best.date||(candidate.date===best.date&&candidate.order>best.order))best=candidate;
    });
  });
  return best;
}
function setLine(index,set={w:'',r:''}){
  const w=set?.w??'',r=set?.r??'';
  return `<div class="jw13-set" data-jw13-set>
    <div class="jw13-set-no">${index}</div>
    <label><span>Вес</span><div class="jw13-input-wrap"><input class="jw13-weight" inputmode="decimal" autocomplete="off" aria-label="Вес подход ${index}" value="${esc(w)}"><b>кг</b></div></label>
    <label><span>Повторы</span><div class="jw13-input-wrap"><input class="jw13-reps" inputmode="numeric" autocomplete="off" aria-label="Повторы подход ${index}" value="${esc(r)}"><b>×</b></div></label>
    <button class="jw13-rm" type="button" aria-label="Удалить подход">×</button>
  </div>`;
}
function previousStrip(prev){
  if(!prev?.sets?.length)return '<div class="jw13-prev empty"><span>Первое выполнение</span><b>Вес появится здесь после тренировки</b></div>';
  const chips=prev.sets.map((s,i)=>`<span><i>${i+1}</i>&nbsp;${pretty(s.w)} × ${pretty(s.r)}</span>`).join('');
  return `<div class="jw13-prev"><div><span>Прошлая · ${fmtShort(prev.date)}</span><b>Подставлено автоматически</b></div><div class="jw13-prev-chips">${chips}</div></div>`;
}
function renumber(card){
  qa('[data-jw13-set]',card).forEach((row,i)=>{
    q('.jw13-set-no',row).textContent=String(i+1);
    q('.jw13-weight',row).setAttribute('aria-label',`Вес подход ${i+1}`);
    q('.jw13-reps',row).setAttribute('aria-label',`Повторы подход ${i+1}`);
  });
  q('[data-jw13-count]',card).textContent=`${qa('[data-jw13-set]',card).length} подх.`;
}
function syncFilled(row){
  const w=q('.jw13-weight',row)?.value.trim()??'';
  const r=q('.jw13-reps',row)?.value.trim()??'';
  row.classList.toggle('filled',w!==''&&r!=='');
}
function bindCard(card){
  qa('[data-jw13-set]',card).forEach(syncFilled);
}
function closeEditor(eventId){
  const modal=q('#modal');if(modal)modal.innerHTML='';
  const event=document.querySelector(`.event[data-event="${CSS.escape(eventId)}"]`);
  if(event)setTimeout(()=>event.click(),0);
}
function successAndReload(){
  const root=q('.jw13-workout');
  if(root)root.innerHTML='<div class="jw13-success"><div>✓</div><h2>Тренировка сохранена</h2><p>Рабочие веса перенесутся в следующее выполнение.</p></div>';
  setTimeout(()=>location.reload(),700);
}
function saveWorkout(event){
  const cards=qa('.jw13-exercise');
  const exercises=[];
  for(const card of cards){
    const sets=[];
    for(const row of qa('[data-jw13-set]',card)){
      const wInput=q('.jw13-weight',row),rInput=q('.jw13-reps',row);
      const w=num(wInput.value),r=num(rInput.value);
      if(w===null||w<0){row.classList.add('error');wInput.focus();wInput.select();return}
      if(r===null||r<=0){row.classList.add('error');rInput.focus();rInput.select();return}
      row.classList.remove('error');sets.push({w,r});
    }
    exercises.push({name:card.dataset.name,sets});
  }
  const data=load(KEY,{workouts:[]});if(!Array.isArray(data.workouts))data.workouts=[];
  data.workouts.push({id:'w'+Date.now(),date:event.date,name:event.name,note:'',exercises});
  save(KEY,data);
  const schedule=load(SCHEDKEY,[]);
  const target=Array.isArray(schedule)?schedule.find(x=>x.id===event.id):null;
  if(target)target.done=true;
  save(SCHEDKEY,Array.isArray(schedule)?schedule:[]);
  successAndReload();
}
function openEditor(eventId){
  const schedule=load(SCHEDKEY,[]);
  const event=Array.isArray(schedule)?schedule.find(x=>x.id===eventId):null;
  if(!event)return;
  const names=event.exercises||[],plan=event.plannedSets||{};
  const cards=names.map((name,i)=>{
    const prev=previousExercise(name,event.date);
    const planned=Math.max(1,Math.min(20,+plan[name]||prev?.sets?.length||3));
    const rows=Array.from({length:planned},(_,j)=>{
      const source=prev?.sets?.[j]||prev?.sets?.at(-1)||{w:'',r:''};
      return setLine(j+1,source);
    }).join('');
    return `<section class="jw13-exercise" data-name="${esc(name)}" style="--delay:${i*45}ms">
      <div class="jw13-ex-head"><div class="jw13-index">${i+1}</div><div><h2>${esc(name)}</h2><span data-jw13-count>${planned} подх.</span></div><button class="jw13-add" type="button" aria-label="Добавить подход">＋</button></div>
      ${previousStrip(prev)}
      <div class="jw13-set-list">${rows}</div>
    </section>`;
  }).join('');
  q('#modal').innerHTML=`<div class="fullscreen jw13-fullscreen"><div class="jw13-workout">
    <header class="jw13-top"><button id="jw13Back" class="jw13-back" type="button">‹</button><div><span>ТРЕНИРОВКА</span><h1>${esc(event.name)}</h1><p>${fmtDate(event.date)} · ${String(event.hour).padStart(2,'0')}:00</p></div><div class="jw13-live"><i></i>LIVE</div></header>
    <main class="jw13-list">${cards||'<div class="jw13-empty">В тренировке нет упражнений.</div>'}</main>
    <footer class="jw13-footer"><button id="jw13Finish" type="button" ${cards?'':'disabled'}><span>✓</span>Завершить тренировку</button><small>После сохранения эти веса будут стартовыми в следующий раз.</small></footer>
  </div></div>`;
  qa('.jw13-exercise').forEach(bindCard);
  q('#jw13Back').onclick=()=>closeEditor(event.id);
  q('.jw13-list').addEventListener('click',e=>{
    const add=e.target.closest('.jw13-add');
    if(add){
      const card=add.closest('.jw13-exercise'),list=q('.jw13-set-list',card),rows=qa('[data-jw13-set]',card);
      const last=rows.at(-1),source={w:q('.jw13-weight',last)?.value||'',r:q('.jw13-reps',last)?.value||''};
      list.insertAdjacentHTML('beforeend',setLine(rows.length+1,source));
      const row=qa('[data-jw13-set]',card).at(-1);syncFilled(row);renumber(card);row.animate?.([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});q('.jw13-weight',row)?.focus();return;
    }
    const rm=e.target.closest('.jw13-rm');
    if(rm){
      const card=rm.closest('.jw13-exercise'),rows=qa('[data-jw13-set]',card);
      if(rows.length<=1)return;
      const row=rm.closest('[data-jw13-set]');
      row.animate?.([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96)'}],{duration:120}).finished?.then(()=>{row.remove();renumber(card)}).catch(()=>{row.remove();renumber(card)});
    }
  });
  q('.jw13-list').addEventListener('input',e=>{const row=e.target.closest('[data-jw13-set]');if(row){row.classList.remove('error');syncFilled(row)}});
  q('.jw13-list').addEventListener('focusin',e=>{if(e.target.matches('.jw13-weight,.jw13-reps'))setTimeout(()=>e.target.select(),0)});
  q('.jw13-list').addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    if(e.target.matches('.jw13-weight')){e.preventDefault();q('.jw13-reps',e.target.closest('[data-jw13-set]'))?.focus();return}
    if(e.target.matches('.jw13-reps')){e.preventDefault();const rows=qa('[data-jw13-set]'),i=rows.indexOf(e.target.closest('[data-jw13-set]'));q('.jw13-weight',rows[i+1])?.focus()}
  });
  q('#jw13Finish').onclick=()=>saveWorkout(event);
}

document.addEventListener('pointerdown',e=>{
  const event=e.target.closest?.('.event[data-event]');
  if(event)currentEventId=event.dataset.event||'';
},true);
document.addEventListener('click',e=>{
  const start=e.target.closest?.('#startWorkout');
  if(!start||!currentEventId)return;
  e.preventDefault();e.stopImmediatePropagation();openEditor(currentEventId);
},true);
})();
