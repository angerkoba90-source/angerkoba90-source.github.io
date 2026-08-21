(()=>{
'use strict';

const escTpl=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const style=document.createElement('style');
style.textContent=`
.tpl-edit-back{position:fixed;inset:0;z-index:180;background:#090a0c;display:flex;justify-content:center;align-items:stretch}
.tpl-edit-sheet{width:min(430px,100%);height:100dvh;max-height:none;background:#0f1114;padding:calc(6px + env(safe-area-inset-top)) 8px calc(7px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
.tpl-edit-head{display:grid;grid-template-columns:36px 1fr 36px;gap:6px;align-items:center;height:42px;flex:0 0 42px;border-bottom:1px solid #272b31}
.tpl-edit-close{width:34px;height:34px;border:0;border-radius:10px;background:#25292f;color:#fff;font-size:19px}.tpl-edit-title{text-align:center;min-width:0}.tpl-edit-title b{display:block;font-size:15px}.tpl-edit-title span{display:block;font-size:9px;color:#7f848c;margin-top:2px}
.tpl-name-wrap{flex:0 0 auto;padding:7px 0 5px}.tpl-name-wrap .label{margin:0 0 4px;font-size:9px}.tpl-name{height:38px!important;border-radius:10px!important;font-size:13px!important}
.tpl-ex-list{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;padding:2px 0}.tpl-ex-list::-webkit-scrollbar{display:none}
.tpl-ex-row{display:grid;grid-template-columns:minmax(0,1fr) auto 32px;gap:6px;align-items:center;min-height:44px;padding:5px 6px;margin:5px 0;background:#1a1d22;border:1px solid #30343b;border-radius:12px}.tpl-ex-name{min-width:0}.tpl-ex-name b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tpl-ex-name span{display:block;font-size:8px;color:#777c84;margin-top:2px}
.tpl-set-control{display:grid;grid-template-columns:28px 34px 28px;align-items:center;gap:3px}.tpl-set-control button{width:28px;height:28px;border:0;border-radius:8px;background:#292d33;color:#fff;font-size:16px}.tpl-set-control input{width:34px;height:28px;border:1px solid #343941;border-radius:8px;background:#0d0f12;color:#fff;text-align:center;font-size:12px;padding:0}.tpl-remove{width:30px;height:30px;border:0;border-radius:8px;background:#34201f;color:#ff8d83;font-size:16px}
.tpl-edit-empty{padding:14px 8px;text-align:center;color:#777c84;font-size:10px;border:1px dashed #343941;border-radius:12px;margin-top:5px}.tpl-edit-footer{flex:0 0 auto;border-top:1px solid #292d33;padding-top:6px}.tpl-add-ex{height:34px!important;margin:0 0 5px!important;border-radius:10px!important;font-size:10px!important}.tpl-save-row{display:grid;grid-template-columns:1fr 1.35fr;gap:6px}.tpl-save-row .btn{height:36px!important;margin:0!important;border-radius:10px!important;font-size:10px!important}.tpl-delete-mini{background:#34201f!important;color:#ff8d83!important}
@media(max-height:700px){.tpl-edit-head{height:38px;flex-basis:38px}.tpl-name-wrap{padding:5px 0 3px}.tpl-name{height:34px!important}.tpl-ex-row{min-height:39px;margin:3px 0;padding:4px 5px}.tpl-set-control button,.tpl-set-control input{height:25px}.tpl-set-control button{width:25px}.tpl-set-control{grid-template-columns:25px 32px 25px}.tpl-set-control input{width:32px}.tpl-add-ex{height:31px!important}.tpl-save-row .btn{height:33px!important}}
`;
document.head.appendChild(style);

function ensureDraftCounts(old){
  if(!templateDraft)setTimeout(()=>{},0);
  if(!templateDraft.setCounts)templateDraft.setCounts={...(old?.setCounts||{})};
  (templateDraft.exercises||[]).forEach(name=>{if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3});
}

window.renderTemplateSheet=function(id){
  const old=templates.find(x=>x.id===id);
  ensureDraftCounts(old);
  const list=(templateDraft.exercises||[]).map((name,i)=>`<div class="tpl-ex-row" data-tpl-index="${i}"><div class="tpl-ex-name"><b>${escTpl(name)}</b><span>рабочие подходы</span></div><div class="tpl-set-control"><button type="button" data-set-minus="${i}">−</button><input data-set-count="${i}" inputmode="numeric" value="${Math.max(1,+templateDraft.setCounts[name]||3)}"><button type="button" data-set-plus="${i}">＋</button></div><button class="tpl-remove" type="button" data-tpl-remove="${i}">×</button></div>`).join('');
  q('#modal').innerHTML=`<div class="tpl-edit-back"><div class="tpl-edit-sheet"><div class="tpl-edit-head"><button id="cancelTpl" class="tpl-edit-close">←</button><div class="tpl-edit-title"><b>${old?'Редактировать шаблон':'Новый шаблон'}</b><span>всё на одном экране</span></div><div></div></div><div class="tpl-name-wrap"><label class="label">Название шаблона</label><input id="tplName" class="input tpl-name" value="${escTpl(templateDraft.name||'')}" placeholder="Например: Ноги + ягодицы"></div><div id="tplCompactList" class="tpl-ex-list">${list||'<div class="tpl-edit-empty">Добавь упражнения. Для каждого сразу укажи количество подходов.</div>'}</div><div class="tpl-edit-footer"><button id="pickExercise" class="btn secondary tpl-add-ex">＋ Добавить упражнение</button><div class="tpl-save-row">${old?'<button id="deleteTpl" class="btn tpl-delete-mini">Удалить</button>':'<button id="cancelTpl2" class="btn secondary">Отмена</button>'}<button id="saveTpl" class="btn">Сохранить шаблон</button></div></div></div></div>`;
  const syncName=()=>{templateDraft.name=q('#tplName')?.value||''};
  q('#tplName').oninput=syncName;
  q('#pickExercise').onclick=()=>{syncName();openDbPicker(name=>{if(!templateDraft.exercises.includes(name))templateDraft.exercises.push(name);if(!templateDraft.setCounts[name])templateDraft.setCounts[name]=3;renderTemplateSheet(id)})};
  qa('[data-set-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.setMinus,name=templateDraft.exercises[i],inp=q(`[data-set-count="${i}"]`);const v=Math.max(1,(+inp.value||1)-1);inp.value=v;templateDraft.setCounts[name]=v});
  qa('[data-set-plus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.setPlus,name=templateDraft.exercises[i],inp=q(`[data-set-count="${i}"]`);const v=Math.min(20,(+inp.value||1)+1);inp.value=v;templateDraft.setCounts[name]=v});
  qa('[data-set-count]').forEach(inp=>inp.oninput=()=>{const i=+inp.dataset.setCount,name=templateDraft.exercises[i],v=Math.max(1,Math.min(20,+inp.value||1));templateDraft.setCounts[name]=v});
  qa('[data-tpl-remove]').forEach(b=>b.onclick=()=>{const i=+b.dataset.tplRemove,name=templateDraft.exercises[i];templateDraft.exercises.splice(i,1);delete templateDraft.setCounts[name];renderTemplateSheet(id)});
  q('#saveTpl').onclick=()=>{syncName();const name=(templateDraft.name||'').trim();if(!name){q('#tplName').focus();return}qa('[data-set-count]').forEach(inp=>{const i=+inp.dataset.setCount,ex=templateDraft.exercises[i];if(ex)templateDraft.setCounts[ex]=Math.max(1,Math.min(20,+inp.value||1))});if(old){old.name=name;old.exercises=[...templateDraft.exercises];old.setCounts={...templateDraft.setCounts}}else templates.push({id:'t'+Date.now(),name,exercises:[...templateDraft.exercises],setCounts:{...templateDraft.setCounts}});saveTpl();templateDraft=null;closeModal();renderTemplates()};
  const cancel=()=>{templateDraft=null;closeModal()};q('#cancelTpl').onclick=cancel;if(q('#cancelTpl2'))q('#cancelTpl2').onclick=cancel;
  if(q('#deleteTpl'))q('#deleteTpl').onclick=()=>{templates=templates.filter(x=>x.id!==id);saveTpl();templateDraft=null;closeModal();renderTemplates()};
};

window.openSlot=function(date,hour){
  q('#modal').innerHTML=`<div class="modal-back"><div class="sheet"><div class="grab"></div><h2>Добавить тренировку</h2><div class="when">${new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})} · ${String(hour).padStart(2,'0')}:00</div>${templates.map(t=>`<button class="template-pick" data-tpl="${t.id}"><b>${escTpl(t.name)}</b><span>${(t.exercises||[]).map(x=>`${escTpl(x)} · ${Math.max(1,+t.setCounts?.[x]||3)} подх.`).join(' · ')}</span></button>`).join('')}<button id="blankWorkout" class="btn secondary">+ Создать тренировку</button><button id="closeSheet" class="btn secondary">Закрыть</button></div></div>`;
  qa('[data-tpl]').forEach(b=>b.onclick=()=>{const t=templates.find(x=>x.id===b.dataset.tpl);schedule.push({id:'e'+Date.now(),date,hour,name:t.name,exercises:[...(t.exercises||[])],plannedSets:{...(t.setCounts||{})},done:false});saveSchedule();closeModal();renderCalendar()});
  q('#blankWorkout').onclick=()=>openWorkoutForm({date,hour});q('#closeSheet').onclick=closeModal;
};

const previousWorkoutEditor=window.openWorkoutEditor;
if(previousWorkoutEditor){
  window.openWorkoutEditor=function(event){
    previousWorkoutEditor(event);
    const plan=event?.plannedSets||{};
    document.querySelectorAll('.exercise-card.exedit').forEach(card=>{
      const name=card.dataset.name||'';const target=Math.max(1,Math.min(20,+plan[name]||3));const sets=card.querySelector('.compact-sets');if(!sets)return;
      let rows=[...sets.querySelectorAll('.compact-set')];
      while(rows.length>target){rows.pop()?.remove()}
      while(rows.length<target){const n=rows.length+1;sets.insertAdjacentHTML('beforeend',`<div class="compact-set"><span class="set-num">${n}</span><input inputmode="decimal" placeholder="кг"><span class="x">×</span><input inputmode="numeric" placeholder="повт"><button class="rmset">×</button></div>`);rows=[...sets.querySelectorAll('.compact-set')]}
      if(window.bindRmCompact)window.bindRmCompact(card);
    });
  };
}
})();
