(()=>{
'use strict';
const KEY='workout-journal-v1',TPLKEY='workout-journal-templates-v2',SCHEDKEY='workout-journal-schedule-v3',CUSTOM_KEY='workout-journal-custom-exercises-v1',MIGRATION_KEY='workout-journal-manual-only-v12';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');
const iso=d=>{const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
const load=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
let data=load(KEY,{workouts:[]});if(!Array.isArray(data.workouts))data.workouts=[];
let templates=load(TPLKEY,[]);if(!Array.isArray(templates))templates=[];
let schedule=load(SCHEDKEY,[]);if(!Array.isArray(schedule))schedule=[];
let custom=load(CUSTOM_KEY,[]);if(!Array.isArray(custom))custom=[];
const saveData=()=>localStorage.setItem(KEY,JSON.stringify(data));
const saveTpl=()=>localStorage.setItem(TPLKEY,JSON.stringify(templates));
const saveSchedule=()=>localStorage.setItem(SCHEDKEY,JSON.stringify(schedule));
const saveCustom=()=>{const seen=new Set();custom=custom.filter(x=>x&&String(x.name||'').trim()).map(x=>({name:String(x.name).trim(),group:String(x.group||'').trim()})).filter(x=>{const k=norm(x.name);if(seen.has(k))return false;seen.add(k);return true});localStorage.setItem(CUSTOM_KEY,JSON.stringify(custom))};
if(localStorage.getItem(MIGRATION_KEY)!=='1'){
  templates=templates.filter(t=>!((t?.id==='t1'&&t?.name==='Грудь + трицепс')||(t?.id==='t2'&&t?.name==='Ноги')));
  saveTpl();localStorage.setItem(MIGRATION_KEY,'1');
}
let weekOffset=0,detailName='',detailPeriod='3m',detailMetric='weight',templateDraft=null;
const HOURS=Array.from({length:16},(_,i)=>i+7),DAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function weekStart(){const n=new Date(),day=(n.getDay()+6)%7,d=new Date(n);d.setHours(0,0,0,0);d.setDate(n.getDate()-day+weekOffset*7);return d}
function weekDates(){const s=weekStart();return Array.from({length:7},(_,i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return d})}
const fmtDate=d=>d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
function renderCalendar(){
  const dates=weekDates(),today=iso(new Date());
  q('#weekLabel').textContent=weekOffset===0?'Эта неделя':weekOffset===1?'Следующая неделя':weekOffset===-1?'Прошлая неделя':`Неделя ${weekOffset>0?'+':''}${weekOffset}`;
  q('#weekRange').textContent=`${fmtDate(dates[0])} — ${fmtDate(dates[6])}`;
  q('#calHead').innerHTML='<div></div>'+dates.map((d,i)=>`<div class="${iso(d)===today?'today':''}"><span>${DAYS[i]}</span><b>${d.getDate()}</b></div>`).join('');
  const byKey=new Map(schedule.map(e=>[`${e.date}|${+e.hour}`,e]));
  q('#calBody').innerHTML=HOURS.map(h=>`<div class="cal-row"><div class="cal-time">${String(h).padStart(2,'0')}</div>${dates.map(d=>{const e=byKey.get(`${iso(d)}|${h}`);return `<div class="slot" data-date="${iso(d)}" data-hour="${h}">${e?`<div class="event ${e.done?'done':''}" data-event="${esc(e.id)}">${esc(e.name)}</div>`:''}</div>`}).join('')}</div>`).join('');
}
q('#calBody').addEventListener('click',e=>{const event=e.target.closest('.event');if(event)return openScheduled(event.dataset.event);const slot=e.target.closest('.slot');if(slot)openSlot(slot.dataset.date,+slot.dataset.hour)});

function openSlot(date,hour){
  q('#modal').innerHTML=`<div class="modal-back"><div class="sheet"><div class="grab"></div><h2>Добавить тренировку</h2><div class="when">${new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})} · ${String(hour).padStart(2,'0')}:00</div>${templates.map(t=>`<button class="template-pick" data-tpl="${esc(t.id)}"><b>${esc(t.name)}</b><span>${(t.exercises||[]).map(x=>`${esc(x)} · ${Math.max(1,+t.setCounts?.[x]||3)} подх.`).join(' · ')}</span></button>`).join('')}<button id="blankWorkout" class="btn secondary" style="margin-top:7px">+ Создать тренировку</button><button id="closeSheet" class="btn secondary" style="margin-top:7px">Закрыть</button></div></div>`;
  qa('[data-tpl]').forEach(b=>b.onclick=()=>{const t=templates.find(x=>x.id===b.dataset.tpl);if(!t)return;schedule.push({id:'e'+Date.now(),date,hour,name:t.name,exercises:[...(t.exercises||[])],plannedSets:{...(t.setCounts||{})},done:false});saveSchedule();closeModal();renderCalendar()});
  q('#blankWorkout').onclick=()=>openPlanner({date,hour});q('#closeSheet').onclick=closeModal;
}
function openScheduled(id){
  const e=schedule.find(x=>x.id===id);if(!e)return;
  q('#modal').innerHTML=`<div class="modal-back"><div class="sheet"><div class="grab"></div><h2>${esc(e.name)}</h2><div class="when">${new Date(e.date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})} · ${String(e.hour).padStart(2,'0')}:00</div><div class="tpl-summary">${(e.exercises||[]).map(x=>`${esc(x)} · ${Math.max(1,+e.plannedSets?.[x]||3)} подх.`).join('<br>')||'Без упражнений'}</div>${e.done?'<div class="panel"><b>Тренировка выполнена ✓</b></div>':'<button id="startWorkout" class="btn" style="margin-top:10px">Начать тренировку</button>'}<button id="deleteEvent" class="btn danger" style="margin-top:7px">Удалить</button><button id="closeSheet" class="btn secondary" style="margin-top:7px">Закрыть</button></div></div>`;
  if(q('#startWorkout'))q('#startWorkout').onclick=()=>openWorkoutEditor(e);
  q('#deleteEvent').onclick=()=>{schedule=schedule.filter(x=>x.id!==id);saveSchedule();closeModal();renderCalendar()};q('#closeSheet').onclick=closeModal;
}
function closeModal(){q('#modal').innerHTML=''}

function rememberExercise(name){if(!custom.some(x=>norm(x.name)===norm(name))){custom.push({name,group:''});saveCustom()}}
function createDraft(old){return{name:old?.name||'',exercises:[...(old?.exercises||[])],setCounts:{...(old?.setCounts||{})}}}
function openTemplateEditor(id){const old=templates.find(x=>x.id===id);templateDraft=createDraft(old);(templateDraft.exercises||[]).forEach(x=>{if(!templateDraft.setCounts[x])templateDraft.setCounts[x]=3});renderTemplateEditor(id)}
function renderTemplateEditor(id){
  const old=templates.find(x=>x.id===id),rows=(templateDraft.exercises||[]).map((name,i)=>`<div class="plan-row"><div class="plan-name">${esc(name)}</div><div class="set-count"><button data-minus="${i}">−</button><span>${Math.max(1,+templateDraft.setCounts[name]||3)} подх.</span><button data-plus="${i}">＋</button></div><button class="remove-mini" data-remove="${i}">×</button></div>`).join('');
  q('#modal').innerHTML=`<div class="fullscreen"><div class="fullsheet"><div class="fullhead"><button id="tplBack" class="iconbtn">←</button><div class="fulltitle"><b>${old?'Редактировать шаблон':'Новый шаблон'}</b><span>всё на одном экране</span></div><div></div></div><div class="plan-top"><input id="tplName" class="input" value="${esc(templateDraft.name)}" placeholder="Название шаблона"><div class="plan-add"><input id="tplExercise" class="input" placeholder="Впиши упражнение"><button id="tplAdd">＋ Добавить</button></div></div><div class="plan-list">${rows||'<div class="plan-empty">Впиши упражнение выше. Рядом сразу появится количество подходов.</div>'}</div><div class="fullfooter">${old?'<button id="deleteTpl" class="btn danger">Удалить</button>':'<button id="tplCancel" class="btn secondary">Отмена</button>'}<button id="saveTpl" class="btn">Сохранить</button></div></div></div>`;
  const syncName=()=>templateDraft.name=q('#tplName').value;
  q('#tplName').oninput=syncName;
  const add=()=>{syncName();const name=q('#tplExercise').value.trim();if(!name)return q('#tplExercise').focus();if(!templateDraft.exercises.some(x=>norm(x)===norm(name)))templateDraft.exercises.push(name);if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3;rememberExercise(name);renderTemplateEditor(id);setTimeout(()=>q('#tplExercise')?.focus(),0)};
  q('#tplAdd').onclick=add;q('#tplExercise').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};
  qa('[data-minus]').forEach(b=>b.onclick=()=>{const n=templateDraft.exercises[+b.dataset.minus];templateDraft.setCounts[n]=Math.max(1,(+templateDraft.setCounts[n]||3)-1);renderTemplateEditor(id)});
  qa('[data-plus]').forEach(b=>b.onclick=()=>{const n=templateDraft.exercises[+b.dataset.plus];templateDraft.setCounts[n]=Math.min(20,(+templateDraft.setCounts[n]||3)+1);renderTemplateEditor(id)});
  qa('[data-remove]').forEach(b=>b.onclick=()=>{const i=+b.dataset.remove,n=templateDraft.exercises[i];templateDraft.exercises.splice(i,1);delete templateDraft.setCounts[n];renderTemplateEditor(id)});
  const cancel=()=>{templateDraft=null;closeModal()};q('#tplBack').onclick=cancel;if(q('#tplCancel'))q('#tplCancel').onclick=cancel;
  q('#saveTpl').onclick=()=>{syncName();const name=templateDraft.name.trim();if(!name)return q('#tplName').focus();if(old){old.name=name;old.exercises=[...templateDraft.exercises];old.setCounts={...templateDraft.setCounts}}else templates.push({id:'t'+Date.now(),name,exercises:[...templateDraft.exercises],setCounts:{...templateDraft.setCounts}});saveTpl();templateDraft=null;closeModal();renderTemplates()};
  if(q('#deleteTpl'))q('#deleteTpl').onclick=()=>{templates=templates.filter(x=>x.id!==id);saveTpl();templateDraft=null;closeModal();renderTemplates()};
}
function renderTemplates(){
  q('#templateList').innerHTML=templates.length?templates.map(t=>`<div class="template-card"><h3>${esc(t.name)}</h3><div class="tpl-summary">${(t.exercises||[]).map(x=>`${esc(x)} — ${Math.max(1,+t.setCounts?.[x]||3)} подх.`).join('<br>')||'Упражнений нет'}</div><div class="row-actions"><button data-edit-tpl="${esc(t.id)}">Изменить</button><button class="primary" data-use-tpl="${esc(t.id)}">В календарь</button></div></div>`).join(''):'<div class="panel">Шаблонов пока нет.</div>';
}
q('#templateList').addEventListener('click',e=>{const edit=e.target.closest('[data-edit-tpl]');if(edit)return openTemplateEditor(edit.dataset.editTpl);const use=e.target.closest('[data-use-tpl]');if(use){go('calendar');setTimeout(()=>{const t=templates.find(x=>x.id===use.dataset.useTpl);if(!t)return;const d=iso(new Date());schedule.push({id:'e'+Date.now(),date:d,hour:12,name:t.name,exercises:[...(t.exercises||[])],plannedSets:{...(t.setCounts||{})},done:false});saveSchedule();renderCalendar()},0)}});

function openPlanner(ctx){templateDraft={name:'',exercises:[],setCounts:{}};renderPlanner(ctx)}
function renderPlanner(ctx){
  const rows=templateDraft.exercises.map((name,i)=>`<div class="plan-row"><div class="plan-name">${esc(name)}</div><div class="set-count"><button data-pminus="${i}">−</button><span>${Math.max(1,+templateDraft.setCounts[name]||3)} подх.</span><button data-pplus="${i}">＋</button></div><button class="remove-mini" data-premove="${i}">×</button></div>`).join('');
  q('#modal').innerHTML=`<div class="fullscreen"><div class="fullsheet"><div class="fullhead"><button id="planBack" class="iconbtn">←</button><div class="fulltitle"><b>Новая тренировка</b><span>${ctx.date} · ${String(ctx.hour).padStart(2,'0')}:00</span></div><div></div></div><div class="plan-top"><input id="planName" class="input" value="${esc(templateDraft.name)}" placeholder="Название тренировки"><div class="plan-add"><input id="planExercise" class="input" placeholder="Впиши упражнение"><button id="planAdd">＋ Добавить</button></div></div><div class="plan-list">${rows||'<div class="plan-empty">Добавь упражнения и укажи количество подходов.</div>'}</div><div class="fullfooter"><button id="planCancel" class="btn secondary">Отмена</button><button id="planSave" class="btn">В календарь</button></div></div></div>`;
  const sync=()=>templateDraft.name=q('#planName').value;q('#planName').oninput=sync;
  const add=()=>{sync();const name=q('#planExercise').value.trim();if(!name)return q('#planExercise').focus();if(!templateDraft.exercises.some(x=>norm(x)===norm(name)))templateDraft.exercises.push(name);if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3;rememberExercise(name);renderPlanner(ctx)};q('#planAdd').onclick=add;q('#planExercise').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};
  qa('[data-pminus]').forEach(b=>b.onclick=()=>{const n=templateDraft.exercises[+b.dataset.pminus];templateDraft.setCounts[n]=Math.max(1,(+templateDraft.setCounts[n]||3)-1);renderPlanner(ctx)});qa('[data-pplus]').forEach(b=>b.onclick=()=>{const n=templateDraft.exercises[+b.dataset.pplus];templateDraft.setCounts[n]=Math.min(20,(+templateDraft.setCounts[n]||3)+1);renderPlanner(ctx)});qa('[data-premove]').forEach(b=>b.onclick=()=>{const i=+b.dataset.premove,n=templateDraft.exercises[i];templateDraft.exercises.splice(i,1);delete templateDraft.setCounts[n];renderPlanner(ctx)});
  const cancel=()=>{templateDraft=null;closeModal()};q('#planBack').onclick=cancel;q('#planCancel').onclick=cancel;q('#planSave').onclick=()=>{sync();const name=templateDraft.name.trim();if(!name)return q('#planName').focus();schedule.push({id:'e'+Date.now(),date:ctx.date,hour:ctx.hour,name,exercises:[...templateDraft.exercises],plannedSets:{...templateDraft.setCounts},done:false});saveSchedule();templateDraft=null;closeModal();renderCalendar()};
}

function setLine(n){return `<div class="setline"><span class="n">${n}</span><input inputmode="decimal" aria-label="Вес подход ${n}" placeholder="кг"><span class="x">×</span><input inputmode="numeric" aria-label="Повторы подход ${n}" placeholder="повт"><button class="rmset" aria-label="Удалить подход">×</button></div>`}
function fitWorkout(){
  const sheet=q('.fullsheet.workout-sheet-v12');if(!sheet)return;const cards=qa('.work-ex'),rows=qa('.setline').length;const h=(window.visualViewport?.height||window.innerHeight||800);const fixed=100+cards.length*24;const available=Math.max(200,h-fixed);const rh=Math.max(18,Math.min(27,Math.floor(available/Math.max(1,rows))-2));document.documentElement.style.setProperty('--seth',rh+'px');
}
function openWorkoutEditor(event){
  const names=event.exercises||[],plan=event.plannedSets||{};
  const cards=names.map((name,i)=>{const count=Math.max(1,Math.min(20,+plan[name]||3));return `<section class="work-ex exedit" data-name="${esc(name)}"><div class="work-ex-head"><span class="work-num">${i+1}</span><b>${esc(name)}</b><span>кг × повт.</span><button class="exadd" type="button" aria-label="Добавить подход">＋</button></div><div class="compact-sets">${Array.from({length:count},(_,j)=>setLine(j+1)).join('')}</div></section>`}).join('');
  q('#modal').innerHTML=`<div class="fullscreen"><div class="fullsheet workout-sheet-v12"><div class="fullhead"><button id="workBack" class="iconbtn">←</button><div class="fulltitle"><b>${esc(event.name)}</b><span>${new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'})} · ${String(event.hour).padStart(2,'0')}:00</span></div><div></div></div><div class="workout-list">${cards||'<div class="plan-empty">В тренировке нет упражнений.</div>'}</div><div class="finish-footer"><label class="finish-check"><input id="finishCheck" type="checkbox"><span>Закончить</span></label><button id="saveWorkout" class="btn" disabled>Сохранить</button></div></div></div>`;
  const renumber=card=>[...card.querySelectorAll('.setline .n')].forEach((n,i)=>n.textContent=i+1);
  q('.workout-list').onclick=e=>{const add=e.target.closest('.exadd');if(add){const card=add.closest('.work-ex'),sets=card.querySelector('.compact-sets'),n=sets.querySelectorAll('.setline').length+1;sets.insertAdjacentHTML('beforeend',setLine(n));fitWorkout();return}const rm=e.target.closest('.rmset');if(rm){const card=rm.closest('.work-ex'),sets=card.querySelector('.compact-sets');if(sets.querySelectorAll('.setline').length>1)rm.closest('.setline').remove();renumber(card);fitWorkout()}};
  const check=q('#finishCheck'),save=q('#saveWorkout');check.onchange=()=>save.disabled=!check.checked;
  save.onclick=()=>{if(!check.checked)return;const exercises=qa('.exedit').map(el=>({name:el.dataset.name,sets:[...el.querySelectorAll('.setline')].map(r=>{const ins=r.querySelectorAll('input');return{w:+ins[0].value||0,r:+ins[1].value||0}}).filter(s=>s.w||s.r)}));data.workouts.push({id:'w'+Date.now(),date:event.date,name:event.name,note:'',exercises});event.done=true;saveData();saveSchedule();closeModal();renderCalendar();renderHistory()};q('#workBack').onclick=()=>openScheduled(event.id);
  fitWorkout();setTimeout(fitWorkout,0);
}
window.addEventListener('resize',fitWorkout);window.visualViewport?.addEventListener('resize',fitWorkout);

function histories(){const map={};data.workouts.forEach(w=>(w.exercises||[]).forEach(e=>(map[e.name]??=[]).push({date:w.date,sets:e.sets||[]})));Object.values(map).forEach(a=>a.sort((x,y)=>x.date.localeCompare(y.date)));return map}
const maxW=x=>Math.max(0,...(x?.sets||[]).map(s=>+s.w||0));
const histVol=x=>(x?.sets||[]).reduce((a,s)=>a+(+s.w||0)*(+s.r||0),0);
function bestSet(h){let b={w:0,r:0,date:''};h.forEach(x=>(x.sets||[]).forEach(s=>{if((+s.w||0)>b.w||((+s.w||0)===b.w&&(+s.r||0)>b.r))b={w:+s.w||0,r:+s.r||0,date:x.date}}));return b}
function renderProgress(){const map=histories();q('#exerciseList').innerHTML=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([name,h])=>{const first=maxW(h[0]),last=maxW(h.at(-1)),pct=first?Math.round((last-first)/first*100):0,bs=bestSet(h);return `<div class="exercise-tile" data-ex="${encodeURIComponent(name)}"><div class="exercise-main"><h3>${esc(name)}</h3><span>${h.length} тренировок · лучший ${bs.w}×${bs.r}</span></div><div class="exercise-side"><b>${last} кг</b><div class="delta ${pct<0?'down':''}">${pct>0?'+':''}${pct}%</div></div></div>`}).join('')||'<div class="panel">Добавь тренировку, чтобы увидеть прогресс.</div>'}
q('#exerciseList').addEventListener('click',e=>{const tile=e.target.closest('[data-ex]');if(tile)openExercise(decodeURIComponent(tile.dataset.ex))});
function openExercise(name){detailName=name;detailPeriod='3m';detailMetric='weight';go('exerciseDetail');renderDetail()}
function filteredHist(h){if(detailPeriod==='all')return h;const days={m:31,'3m':93,y:366}[detailPeriod]||93,cut=Date.now()-days*86400000;return h.filter(x=>new Date(x.date+'T12:00:00').getTime()>=cut)}
function points(h){return h.map(x=>({date:x.date,val:detailMetric==='volume'?histVol(x):detailMetric==='best'?Math.max(0,...x.sets.map(s=>(+s.w||0)*(+s.r||0))):maxW(x)}))}
function svgLine(p){if(!p.length)return '<div class="chart-empty">Нет данных за период</div>';const W=360,H=230,pad=26,max=Math.max(1,...p.map(x=>x.val)),min=Math.min(...p.map(x=>x.val)),span=Math.max(1,max-min),xs=p.map((_,i)=>pad+i*((W-pad*2)/Math.max(1,p.length-1))),ys=p.map(x=>H-pad-((x.val-min)/span)*(H-pad*2)),path=xs.map((x,i)=>`${i?'L':'M'}${x},${ys[i]}`).join(' ');return `<svg viewBox="0 0 ${W} ${H}"><line x1="${pad}" x2="${W-pad}" y1="${H-pad}" y2="${H-pad}" stroke="#2d3137"/><path d="${path}" fill="none" stroke="#ff4b16" stroke-width="3" stroke-linecap="round"/>${p.map((x,i)=>`<circle cx="${xs[i]}" cy="${ys[i]}" r="4" fill="#d9dce0"/><text x="${xs[i]}" y="${H-5}" fill="#73777e" font-size="8" text-anchor="middle">${x.date.slice(5).split('-').reverse().join('.')}</text>`).join('')}</svg>`}
function renderDetail(){const h=histories()[detailName]||[],fh=filteredHist(h),bs=bestSet(h),first=maxW(h[0]),last=maxW(h.at(-1)),pct=first?Math.round((last-first)/first*100):0;q('#detailBody').innerHTML=`<h1 class="detail-title">${esc(detailName)}</h1><div class="detail-hero"><strong>${pct>0?'+':''}${pct}%</strong><span>Изменение максимального рабочего веса от первой записи к последней.</span></div><div class="detail-metrics"><div class="metric-big"><b>${Math.max(0,...h.map(maxW))} кг</b><span>Максимальный рабочий вес</span></div><div class="metric-big"><b>${bs.w}×${bs.r}</b><span>Лучший результат<br>${bs.date?new Date(bs.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'—'}</span></div></div><h2 class="section-title">ПРОГРЕСС ПО УПРАЖНЕНИЮ</h2><div class="period-tabs"><button data-period="m">Месяц</button><button data-period="3m">3 месяца</button><button data-period="y">Год</button><button data-period="all">Все</button></div><div class="metric-tabs"><button data-metric="weight">Вес</button><button data-metric="volume">Объём</button><button data-metric="best">Лучший подход</button></div><div class="chart-label">${detailMetric==='weight'?'Максимальный рабочий вес, кг':detailMetric==='volume'?'Объём, кг × повторы':'Лучший подход, кг × повторы'}</div><div class="big-chart">${svgLine(points(fh))}</div>`;qa('[data-period]').forEach(b=>{b.classList.toggle('active',b.dataset.period===detailPeriod);b.onclick=()=>{detailPeriod=b.dataset.period;renderDetail()}});qa('[data-metric]').forEach(b=>{b.classList.toggle('active',b.dataset.metric===detailMetric);b.onclick=()=>{detailMetric=b.dataset.metric;renderDetail()}})}
function renderHistory(){q('#historyList').innerHTML=[...data.workouts].sort((a,b)=>b.date.localeCompare(a.date)).map(w=>`<div class="history-card"><div class="date">${new Date(w.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</div><h3>${esc(w.name)}</h3><p>${(w.exercises||[]).map(e=>esc(e.name)).join(' · ')}</p></div>`).join('')||'<div class="panel">История пока пустая.</div>'}

function go(id){qa('.screen').forEach(s=>s.classList.toggle('active',s.id===id));qa('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));q('.nav').classList.toggle('hidden',id==='exerciseDetail');if(id==='calendar')renderCalendar();if(id==='templates')renderTemplates();if(id==='progress')renderProgress();if(id==='history')renderHistory()}
q('.nav').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});q('#prevWeek').onclick=()=>{weekOffset--;renderCalendar()};q('#nextWeek').onclick=()=>{weekOffset++;renderCalendar()};q('#newTemplate').onclick=()=>openTemplateEditor();q('#backProgress').onclick=()=>go('progress');renderCalendar();
})();
