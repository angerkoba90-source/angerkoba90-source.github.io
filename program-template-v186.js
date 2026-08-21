(()=>{
'use strict';
const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;
const KEY='denisfit_template_editor_v186_id';
let currentTemplateId='';
let busy=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const remember=id=>{currentTemplateId=id||'';try{currentTemplateId?sessionStorage.setItem(KEY,currentTemplateId):sessionStorage.removeItem(KEY)}catch{}};
try{currentTemplateId=sessionStorage.getItem(KEY)||''}catch{}

async function sessionUser(){const s=await db.auth.getSession();return s.data.session?.user||null}
async function resolveTemplateId(card){
  if(currentTemplateId)return currentTemplateId;
  const user=await sessionUser();if(!user)return '';
  const name=qs('.list-row b',card)?.textContent.trim()||qs('b',card)?.textContent.trim()||'';
  if(!name)return '';
  const q=await db.from('program_templates').select('id,name,created_at').eq('trainer_id',user.id).eq('name',name).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(q.error||!q.data?.id)return '';
  remember(q.data.id);return q.data.id;
}
async function loadEditorData(templateId){
  const user=await sessionUser();if(!user)throw new Error('Сессия тренера не найдена');
  const [tQ,iQ,eQ]=await Promise.all([
    db.from('program_templates').select('id,name,description').eq('id',templateId).eq('trainer_id',user.id).single(),
    db.from('template_exercises').select('id,exercise_id,day_label,sort_order,target_sets,target_reps,target_rpe,notes,exercises(id,name,category,equipment,muscle_group)').eq('template_id',templateId).order('sort_order'),
    db.from('exercises').select('id,name,category,equipment,muscle_group').eq('trainer_id',user.id).eq('archived',false).order('name')
  ]);
  if(tQ.error)throw tQ.error;if(iQ.error)throw iQ.error;if(eQ.error)throw eQ.error;
  return {template:tQ.data,items:iQ.data||[],exercises:eQ.data||[]};
}
function categories(exercises){return ['Все',...new Set(exercises.map(x=>x.category||'Силовые'))]}
function editorHtml(data){
  const {template,items,exercises}=data;
  return `<div class="tplx" data-template-id="${template.id}">
    <div class="tplx-head">
      <button type="button" class="tplx-back" id="tplxBack">←</button>
      <div class="tplx-title"><span>ШАБЛОН ТРЕНИРОВКИ</span><b>${esc(template.name)}</b><small>${items.length} упражнений</small></div>
      <button type="button" class="tplx-done" id="tplxDone">Готово</button>
    </div>
    <section class="tplx-section tplx-current-section">
      <div class="tplx-section-head"><div><b>В тренировке</b><small>Подходы и повторы меняются здесь</small></div><span id="tplxCount">${items.length}</span></div>
      <div id="tplxCurrent"></div>
    </section>
    <section class="tplx-section tplx-library-section">
      <div class="tplx-section-head"><div><b>Добавить упражнения</b><small>Нажимай ＋ подряд — окно не закрывается</small></div></div>
      <div class="tplx-filters"><select id="tplxCategory">${categories(exercises).map(x=>`<option>${esc(x)}</option>`).join('')}</select><input id="tplxSearch" placeholder="Поиск упражнения"></div>
      <div id="tplxLibrary" class="tplx-library"></div>
    </section>
  </div>`;
}
function currentRows(items){
  if(!items.length)return '<div class="tplx-empty">Пока пусто. Добавь упражнения ниже.</div>';
  return items.map((it,idx)=>`<div class="tplx-current-row" data-item="${it.id}" data-exercise="${it.exercise_id}">
    <div class="tplx-num">${idx+1}</div>
    <div class="tplx-current-main"><b>${esc(it.exercises?.name||'Упражнение')}</b><small>${esc(it.exercises?.muscle_group||it.exercises?.category||'')}</small></div>
    <div class="tplx-sets"><button type="button" data-set-delta="-1">−</button><span>${Math.max(1,Number(it.target_sets||1))}</span><button type="button" data-set-delta="1">＋</button></div>
    <input class="tplx-reps" data-field="target_reps" value="${esc(it.target_reps||'10–12')}" aria-label="Повторы">
    <button type="button" class="tplx-more" data-more>•••</button>
    <button type="button" class="tplx-remove" data-remove>×</button>
    <div class="tplx-advanced hidden">
      <label>Блок<input data-field="day_label" value="${esc(it.day_label||'Тренировка')}"></label>
      <label>RPE<input data-field="target_rpe" inputmode="decimal" value="${it.target_rpe??''}" placeholder="—"></label>
      <label class="tplx-note">Комментарий<input data-field="notes" value="${esc(it.notes||'')}" placeholder="Техника, темп, амплитуда"></label>
    </div>
  </div>`).join('');
}
function libraryRows(data){
  const cat=qs('#tplxCategory')?.value||'Все',text=(qs('#tplxSearch')?.value||'').trim().toLowerCase();
  const added=new Set(data.items.map(x=>x.exercise_id));
  const rows=data.exercises.filter(x=>(cat==='Все'||(x.category||'Силовые')===cat)&&(!text||`${x.name} ${x.muscle_group||''} ${x.equipment||''}`.toLowerCase().includes(text))).slice(0,140);
  if(!rows.length)return '<div class="tplx-empty">Ничего не найдено.</div>';
  return rows.map(x=>{const isAdded=added.has(x.id);return `<button type="button" class="tplx-exercise ${isAdded?'is-added':''}" data-add-exercise="${x.id}" ${isAdded?'disabled':''}><div><b>${esc(x.name)}</b><small>${esc(x.muscle_group||x.category||'')} · ${esc(x.equipment||'без оборудования')}</small></div><span>${isAdded?'✓':'＋'}</span></button>`}).join('');
}
function bindEditor(card,data){
  const renderCurrent=()=>{qs('#tplxCurrent',card).innerHTML=currentRows(data.items);qs('#tplxCount',card).textContent=data.items.length;qs('.tplx-title small',card).textContent=`${data.items.length} упражнений`;bindCurrentActions(card,data,renderCurrent,renderLibrary)};
  const renderLibrary=()=>{qs('#tplxLibrary',card).innerHTML=libraryRows(data);bindLibraryActions(card,data,renderCurrent,renderLibrary)};
  qs('#tplxCategory',card).onchange=renderLibrary;
  qs('#tplxSearch',card).oninput=renderLibrary;
  const leave=()=>{remember('');qs('#nav [data-page="programs"]')?.click()};
  qs('#tplxDone',card).onclick=leave;qs('#tplxBack',card).onclick=leave;
  renderCurrent();renderLibrary();
}
function bindLibraryActions(card,data,renderCurrent,renderLibrary){
  qsa('[data-add-exercise]',card).forEach(btn=>btn.onclick=async()=>{
    if(btn.disabled)return;btn.disabled=true;const old=btn.querySelector('span').textContent;btn.querySelector('span').textContent='…';
    try{
      const id=btn.dataset.addExercise;if(data.items.some(x=>x.exercise_id===id)){renderLibrary();return}
      const ex=data.exercises.find(x=>x.id===id);if(!ex)return;
      const sort=(data.items.reduce((m,x)=>Math.max(m,Number(x.sort_order||0)),0)||0)+1;
      const q=await db.from('template_exercises').insert({template_id:data.template.id,exercise_id:id,day_label:'Тренировка',sort_order:sort,target_sets:3,target_reps:'10–12',target_rpe:null,notes:null}).select('id,exercise_id,day_label,sort_order,target_sets,target_reps,target_rpe,notes').single();
      if(q.error)throw q.error;
      data.items.push({...q.data,exercises:ex});renderCurrent();renderLibrary();
    }catch(e){console.error(e);btn.disabled=false;btn.querySelector('span').textContent=old;alert(e.message||'Не удалось добавить упражнение')}
  });
}
function bindCurrentActions(card,data,renderCurrent,renderLibrary){
  qsa('.tplx-current-row',card).forEach(row=>{
    const item=data.items.find(x=>x.id===row.dataset.item);if(!item)return;
    qsa('[data-set-delta]',row).forEach(btn=>btn.onclick=async()=>{const next=Math.max(1,Number(item.target_sets||1)+Number(btn.dataset.setDelta));btn.disabled=true;const q=await db.from('template_exercises').update({target_sets:next}).eq('id',item.id);btn.disabled=false;if(q.error)return alert(q.error.message);item.target_sets=next;row.querySelector('.tplx-sets span').textContent=next});
    qsa('[data-field]',row).forEach(inp=>inp.onchange=async()=>{const field=inp.dataset.field;let value=inp.value.trim();if(field==='target_rpe')value=value===''?null:Number(value);const q=await db.from('template_exercises').update({[field]:value}).eq('id',item.id);if(q.error)return alert(q.error.message);item[field]=value});
    qs('[data-more]',row).onclick=()=>qs('.tplx-advanced',row).classList.toggle('hidden');
    qs('[data-remove]',row).onclick=async()=>{const q=await db.from('template_exercises').delete().eq('id',item.id);if(q.error)return alert(q.error.message);data.items=data.items.filter(x=>x.id!==item.id);renderCurrent();renderLibrary()};
  });
}
async function enhance(){
  if(busy)return;const card=qs('#templateEditor .template-editor-card');if(!card||card.classList.contains('tplx-ready'))return;
  busy=true;
  try{const id=await resolveTemplateId(card);if(!id)return;const data=await loadEditorData(id);card.classList.add('tplx-ready');card.innerHTML=editorHtml(data);bindEditor(card,data)}
  catch(e){console.error('Template editor v186',e)}finally{busy=false}
}
function scheduleEnhance(){let n=0;const tick=()=>{enhance();if(++n<12&&!qs('#templateEditor .tplx-ready'))setTimeout(tick,120)};setTimeout(tick,30)}
document.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-template]');if(edit)remember(edit.dataset.editTemplate||'');
  if(e.target.closest('#programCreateTemplate'))remember('');
  if(e.target.closest('#createTemplate'))remember('');
  if(edit||e.target.closest('[data-page="programs"]')||e.target.closest('#programCreateTemplate')||e.target.closest('#createTemplate'))scheduleEnhance();
},true);
window.addEventListener('pageshow',scheduleEnhance);window.addEventListener('load',scheduleEnhance);
})();