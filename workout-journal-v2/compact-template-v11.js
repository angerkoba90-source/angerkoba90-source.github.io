(()=>{
'use strict';

const CUSTOM_KEY='workout-journal-custom-exercises-v1';
const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');

const style=document.createElement('style');
style.id='templateOneScreenV11';
style.textContent=`
.tpl11-back{position:fixed;inset:0;z-index:190;background:#090a0c;display:flex;justify-content:center;align-items:stretch}
.tpl11-sheet{width:min(430px,100%);height:100dvh;background:#0f1114;padding:calc(4px + env(safe-area-inset-top)) 7px calc(5px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
.tpl11-head{height:36px;flex:0 0 36px;display:grid;grid-template-columns:32px 1fr 32px;align-items:center;gap:5px;border-bottom:1px solid #262a30}.tpl11-backbtn{width:30px;height:30px;border:0;border-radius:9px;background:#25292f;color:#fff;font-size:17px}.tpl11-title{text-align:center;min-width:0}.tpl11-title b{display:block;font-size:13px;line-height:1}.tpl11-title span{display:block;font-size:8px;color:#747981;margin-top:2px}
.tpl11-top{flex:0 0 auto;display:grid;grid-template-columns:1fr;gap:5px;padding:5px 0}.tpl11-input{height:33px!important;border-radius:9px!important;font-size:12px!important;padding:0 10px!important}
.tpl11-addrow{display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:5px}.tpl11-add{height:33px;border:0;border-radius:9px;background:#ff4b16;color:#fff;font-size:10px;font-weight:800}.tpl11-add:active{transform:scale(.98)}
.tpl11-list{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;padding:0 0 3px}.tpl11-list::-webkit-scrollbar{display:none}.tpl11-empty{height:100%;min-height:92px;display:grid;place-items:center;text-align:center;color:#777c84;font-size:10px;border:1px dashed #343941;border-radius:11px;padding:10px}
.tpl11-row{display:grid;grid-template-columns:minmax(0,1fr) 105px 28px;gap:5px;align-items:center;height:38px;margin:3px 0;padding:3px 5px;background:#1a1d22;border:1px solid #30343b;border-radius:10px}.tpl11-name{min-width:0}.tpl11-name b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tpl11-name span{display:block;font-size:7px;color:#747981;margin-top:1px}.tpl11-sets{display:grid;grid-template-columns:27px 45px 27px;gap:2px;align-items:center}.tpl11-sets button{width:27px;height:27px;border:0;border-radius:7px;background:#292d33;color:#fff;font-size:15px}.tpl11-count{height:27px;border:1px solid #343941;border-radius:7px;background:#0d0f12;color:#fff;text-align:center;font-size:10px;display:grid;place-items:center;white-space:nowrap}.tpl11-remove{width:27px;height:27px;border:0;border-radius:7px;background:#34201f;color:#ff8d83;font-size:15px}
.tpl11-footer{flex:0 0 38px;height:38px;border-top:1px solid #292d33;padding-top:4px;display:grid;grid-template-columns:1fr 1.35fr;gap:5px}.tpl11-footer .btn{height:34px!important;margin:0!important;border-radius:9px!important;font-size:10px!important}.tpl11-delete{background:#34201f!important;color:#ff8d83!important}
@media(max-height:700px){.tpl11-head{height:33px;flex-basis:33px}.tpl11-top{padding:3px 0;gap:3px}.tpl11-input,.tpl11-add{height:30px!important}.tpl11-row{height:34px;margin:2px 0}.tpl11-sets button,.tpl11-count,.tpl11-remove{height:24px}.tpl11-sets button,.tpl11-remove{width:24px}.tpl11-sets{grid-template-columns:24px 43px 24px}.tpl11-footer{height:35px;flex-basis:35px;padding-top:3px}.tpl11-footer .btn{height:31px!important}}
`;
document.head.appendChild(style);

function loadCustom(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]')||[]}catch{return[]}}
function saveCustom(list){
  const out=[],seen=new Set();
  list.forEach(x=>{const name=String(x?.name||'').trim();if(!name)return;const k=norm(name);if(seen.has(k))return;seen.add(k);out.push({name,group:String(x?.group||'').trim()})});
  localStorage.setItem(CUSTOM_KEY,JSON.stringify(out));
  try{if(typeof EXDB!=='undefined'&&Array.isArray(EXDB))EXDB.splice(0,EXDB.length,...out.map(x=>({name:x.name,type:'Своё',brand:'',group:x.group||'Без группы'})))}catch{}
  return out;
}
function ensureCounts(old){
  if(!templateDraft.setCounts)templateDraft.setCounts={...(old?.setCounts||{})};
  (templateDraft.exercises||[]).forEach(name=>{if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3});
}
function addExerciseInline(id){
  const input=q('#tpl11Exercise');
  const name=(input?.value||'').trim();
  if(!name){input?.focus();return}
  if(!(templateDraft.exercises||[]).some(x=>norm(x)===norm(name)))templateDraft.exercises.push(name);
  if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3;
  const custom=loadCustom();
  if(!custom.some(x=>norm(x.name)===norm(name)))custom.push({name,group:''});
  saveCustom(custom);
  renderTemplateSheet(id);
  setTimeout(()=>q('#tpl11Exercise')?.focus(),0);
}

window.renderTemplateSheet=function(id){
  const old=templates.find(x=>x.id===id);
  ensureCounts(old);
  const rows=(templateDraft.exercises||[]).map((name,i)=>{
    const sets=Math.max(1,Math.min(20,+templateDraft.setCounts[name]||3));
    return `<div class="tpl11-row"><div class="tpl11-name"><b>${esc(name)}</b><span>подходы</span></div><div class="tpl11-sets"><button type="button" data-minus="${i}">−</button><div class="tpl11-count" data-count="${i}">${sets} подх.</div><button type="button" data-plus="${i}">＋</button></div><button type="button" class="tpl11-remove" data-remove="${i}">×</button></div>`;
  }).join('');
  q('#modal').innerHTML=`<div class="tpl11-back"><div class="tpl11-sheet"><div class="tpl11-head"><button id="tpl11Back" class="tpl11-backbtn">←</button><div class="tpl11-title"><b>${old?'Редактировать шаблон':'Новый шаблон'}</b><span>упражнения и подходы на одном экране</span></div><div></div></div><div class="tpl11-top"><input id="tplName" class="input tpl11-input" value="${esc(templateDraft.name||'')}" placeholder="Название шаблона"><div class="tpl11-addrow"><input id="tpl11Exercise" class="input tpl11-input" placeholder="Впиши упражнение"><button id="tpl11Add" class="tpl11-add">＋ Добавить</button></div></div><div class="tpl11-list">${rows||'<div class="tpl11-empty">Впиши упражнение выше. Оно сразу появится здесь, рядом будет количество подходов.</div>'}</div><div class="tpl11-footer">${old?'<button id="deleteTpl" class="btn tpl11-delete">Удалить</button>':'<button id="tpl11Cancel" class="btn secondary">Отмена</button>'}<button id="saveTpl" class="btn">Сохранить</button></div></div></div>`;

  const syncName=()=>{templateDraft.name=q('#tplName')?.value||''};
  q('#tplName').oninput=syncName;
  q('#tpl11Add').onclick=()=>{syncName();addExerciseInline(id)};
  q('#tpl11Exercise').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();syncName();addExerciseInline(id)}};
  qa('[data-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.minus,name=templateDraft.exercises[i];templateDraft.setCounts[name]=Math.max(1,(+templateDraft.setCounts[name]||3)-1);renderTemplateSheet(id)});
  qa('[data-plus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.plus,name=templateDraft.exercises[i];templateDraft.setCounts[name]=Math.min(20,(+templateDraft.setCounts[name]||3)+1);renderTemplateSheet(id)});
  qa('[data-remove]').forEach(b=>b.onclick=()=>{const i=+b.dataset.remove,name=templateDraft.exercises[i];templateDraft.exercises.splice(i,1);delete templateDraft.setCounts[name];renderTemplateSheet(id)});

  const cancel=()=>{templateDraft=null;closeModal()};
  q('#tpl11Back').onclick=cancel;if(q('#tpl11Cancel'))q('#tpl11Cancel').onclick=cancel;
  q('#saveTpl').onclick=()=>{
    syncName();const name=(templateDraft.name||'').trim();if(!name){q('#tplName')?.focus();return}
    if(old){old.name=name;old.exercises=[...(templateDraft.exercises||[])];old.setCounts={...templateDraft.setCounts}}
    else templates.push({id:'t'+Date.now(),name,exercises:[...(templateDraft.exercises||[])],setCounts:{...templateDraft.setCounts}});
    saveTpl();templateDraft=null;closeModal();renderTemplates();
  };
  if(q('#deleteTpl'))q('#deleteTpl').onclick=()=>{templates=templates.filter(x=>x.id!==id);saveTpl();templateDraft=null;closeModal();renderTemplates()};
};

window.openSlot=function(date,hour){
  q('#modal').innerHTML=`<div class="modal-back"><div class="sheet"><div class="grab"></div><h2>Добавить тренировку</h2><div class="when">${new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})} · ${String(hour).padStart(2,'0')}:00</div>${templates.map(t=>`<button class="template-pick" data-tpl="${t.id}"><b>${esc(t.name)}</b><span>${(t.exercises||[]).map(x=>`${esc(x)} · ${Math.max(1,+t.setCounts?.[x]||3)} подх.`).join(' · ')}</span></button>`).join('')}<button id="blankWorkout" class="btn secondary">+ Создать тренировку</button><button id="closeSheet" class="btn secondary">Закрыть</button></div></div>`;
  qa('[data-tpl]').forEach(b=>b.onclick=()=>{const t=templates.find(x=>x.id===b.dataset.tpl);schedule.push({id:'e'+Date.now(),date,hour,name:t.name,exercises:[...(t.exercises||[])],plannedSets:{...(t.setCounts||{})},done:false});saveSchedule();closeModal();renderCalendar()});
  q('#blankWorkout').onclick=()=>openWorkoutForm({date,hour});q('#closeSheet').onclick=closeModal;
};

const baseWorkoutEditor=window.openWorkoutEditor;
if(baseWorkoutEditor){
  window.openWorkoutEditor=function(event){
    baseWorkoutEditor(event);
    const plan=event?.plannedSets||{};
    document.querySelectorAll('.exercise-card.exedit').forEach(card=>{
      const name=card.dataset.name||'',target=Math.max(1,Math.min(20,+plan[name]||3)),sets=card.querySelector('.compact-sets');if(!sets)return;
      let rows=[...sets.querySelectorAll('.compact-set')];
      while(rows.length>target){rows.pop()?.remove()}
      while(rows.length<target){const n=rows.length+1;sets.insertAdjacentHTML('beforeend',`<div class="compact-set"><span class="set-num">${n}</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div>`);rows=[...sets.querySelectorAll('.compact-set')]}
      if(window.bindRmCompact)window.bindRmCompact(card);
    });
  };
}
})();
