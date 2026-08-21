(()=>{
'use strict';
if(window.__denisfitDiaryV188)return;
window.__denisfitDiaryV188=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const CLIENT_KEY='df_v188_client';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate=value=>new Date(String(value).length===10?`${value}T12:00:00`:value).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const formatWeight=value=>`${(Math.round(Number(value)*10)/10).toLocaleString('ru-RU')} кг`;
const formatPct=value=>`${Number(value)>0?'+':''}${(Math.round(Number(value)*10)/10).toLocaleString('ru-RU')}%`;

function rememberClient(id){try{if(id)sessionStorage.setItem(CLIENT_KEY,id)}catch{}}
function rememberedClient(){try{return sessionStorage.getItem(CLIENT_KEY)||''}catch{return''}}
function parseWeight(value){if(value===''||value==null)return null;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:null}
function toast(text,isError=false){
  let node=$('#dfdToast');
  if(!node){node=document.createElement('div');node.id='dfdToast';document.body.append(node)}
  node.textContent=text;node.className=`dfd-toast show${isError?' error':''}`;
  clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),2400);
}
async function trainerUser(){
  const session=await db.auth.getSession();
  const user=session.data.session?.user;
  return !user||user.is_anonymous?null:user;
}
async function clientName(clientId){
  const q=await db.from('profiles').select('full_name').eq('id',clientId).maybeSingle();
  if(q.error)throw q.error;
  return q.data?.full_name||'Клиент';
}
async function getTemplates(trainerId){
  const q=await db.from('program_templates')
    .select('id,name,description,template_exercises(id,exercise_id,day_label,sort_order,target_sets,target_reps,target_rpe,notes)')
    .eq('trainer_id',trainerId)
    .order('created_at',{ascending:false});
  if(q.error)throw q.error;
  return (q.data||[]).filter(t=>(t.template_exercises||[]).length>0);
}
function templateDays(rows){
  const values=[...new Set((rows||[]).map(x=>x.day_label||'Тренировка'))];
  return values.length?values:['Тренировка'];
}
function nextHalfHour(now=new Date()){
  const slot=new Date(now);
  slot.setSeconds(0,0);
  const minute=slot.getMinutes();
  if(minute%30!==0)slot.setMinutes(minute+(30-minute%30));
  return slot;
}
function modal(html){
  let root=$('#dfdModal');
  if(!root){root=document.createElement('div');root.id='dfdModal';document.body.append(root)}
  root.innerHTML=`<div class="dfd-modal-back"><div class="dfd-modal-sheet">${html}</div></div>`;
  root.classList.add('open');
  $('.dfd-modal-back',root).onclick=e=>{if(e.target===e.currentTarget)closeModal()};
}
function closeModal(){const root=$('#dfdModal');if(root){root.classList.remove('open');root.innerHTML=''}}
function backToSchedule(date=''){
  $('[data-page="schedule"]')?.click();
  if(!date)return;
  setTimeout(()=>{
    const input=$('#scheduleDate');
    if(input&&input.value!==date){input.value=date;input.dispatchEvent(new Event('change',{bubbles:true}))}
  },180);
}

async function fetchProgress(clientId){
  const q=await db.rpc('trainer_client_exercise_progress',{p_client_id:clientId});
  if(q.error)throw q.error;
  return q.data||[];
}
async function fetchLatest(clientId,exerciseIds,excludeSessionId=null){
  if(!exerciseIds.length)return new Map();
  const q=await db.rpc('trainer_latest_exercise_sets',{
    p_client_id:clientId,
    p_exercise_ids:exerciseIds,
    p_exclude_session_id:excludeSessionId||null
  });
  if(q.error)throw q.error;
  const map=new Map();
  for(const row of q.data||[]){
    if(!map.has(row.exercise_id))map.set(row.exercise_id,[]);
    map.get(row.exercise_id).push(row);
  }
  for(const rows of map.values())rows.sort((a,b)=>Number(a.set_number)-Number(b.set_number));
  return map;
}
async function addClientProgress(){
  const assignButton=$('#assignFromClient');
  const clientId=rememberedClient();
  if(!assignButton||!clientId||$('#dfdClientProgress'))return;
  const section=document.createElement('section');
  section.id='dfdClientProgress';
  section.innerHTML='<div class="section-title">Прогресс упражнений</div><div class="dfd-progress-shell"><div class="spinner"></div></div>';
  assignButton.closest('.client-actions-grid')?.insertAdjacentElement('afterend',section);
  try{
    const rows=await fetchProgress(clientId);
    const shell=$('.dfd-progress-shell',section);
    if(!shell)return;
    shell.innerHTML=rows.length?rows.map(row=>{
      const pct=Number(row.progress_pct||0);
      return `<div class="dfd-progress-row"><div><b>${esc(row.exercise_name||'Упражнение')}</b><span>${formatWeight(row.first_avg)} → ${formatWeight(row.last_avg)} · ср. рабочий вес · ${Number(row.session_count||0)} трен.</span></div><strong class="${pct>0?'up':pct<0?'down':''}">${formatPct(pct)}</strong></div>`;
    }).join(''):'<div class="empty">После сохранения рабочих весов здесь появится прогресс.</div>';
  }catch(error){console.error(error);const shell=$('.dfd-progress-shell',section);if(shell)shell.innerHTML='<div class="empty">Не удалось загрузить прогрессию.</div>'}
}

async function hasOverlap(trainerId,start,end){
  const q=await db.from('schedule_events').select('id').eq('trainer_id',trainerId).neq('status','cancelled').lt('starts_at',end.toISOString()).gt('ends_at',start.toISOString()).limit(1);
  if(q.error)throw q.error;
  return Boolean(q.data?.length);
}
async function assignFromClientCard(clientId){
  rememberClient(clientId);
  const user=await trainerUser();if(!user)return;
  try{
    const [name,templates]=await Promise.all([clientName(clientId),getTemplates(user.id)]);
    if(!templates.length)return toast('Сначала создай шаблон с упражнениями в «Программах»',true);
    const slot=nextHalfHour();
    modal(`<div class="dfd-modal-head"><div><span>НАЗНАЧЕНИЕ</span><h2>${esc(name)}</h2></div><button id="dfdClose">×</button></div>
      <div class="dfd-field"><label>Шаблон тренировки</label><select id="dfdTpl">${templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
      <div class="dfd-field"><label>Тренировка / блок</label><select id="dfdDay"></select></div>
      <div class="dfd-grid"><div class="dfd-field"><label>Дата</label><input id="dfdDate" type="date" value="${localDate(slot)}"></div><div class="dfd-field"><label>Время</label><input id="dfdTime" type="time" value="${String(slot.getHours()).padStart(2,'0')}:${String(slot.getMinutes()).padStart(2,'0')}"></div></div>
      <button id="dfdAssign" class="dfd-primary">Назначить тренировку</button>`);
    const selectedTemplate=()=>templates.find(t=>t.id===$('#dfdTpl').value);
    const syncDays=()=>{const t=selectedTemplate();$('#dfdDay').innerHTML=templateDays(t?.template_exercises).map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')};
    $('#dfdTpl').onchange=syncDays;syncDays();$('#dfdClose').onclick=closeModal;
    $('#dfdAssign').onclick=async()=>{
      const button=$('#dfdAssign');button.disabled=true;
      try{
        const template=selectedTemplate(),date=$('#dfdDate').value,time=$('#dfdTime').value,dayLabel=$('#dfdDay').value;
        if(!template||!date||!time||!dayLabel)throw new Error('Проверь шаблон, дату и время');
        const start=new Date(`${date}T${time}:00`);if(Number.isNaN(start.getTime()))throw new Error('Некорректная дата или время');
        const end=new Date(start.getTime()+55*60000);
        if(await hasOverlap(user.id,start,end)){
          const proceed=confirm('На это время уже есть тренировка. Всё равно назначить?');
          if(!proceed){button.disabled=false;return}
        }
        const q=await db.rpc('assign_trainer_workout_from_template',{
          p_client_id:clientId,p_template_id:template.id,p_day_label:dayLabel,
          p_scheduled_date:date,p_starts_at:start.toISOString(),p_duration_minutes:55
        });
        if(q.error)throw q.error;
        closeModal();toast('Тренировка назначена');backToSchedule(date);
      }catch(error){console.error(error);toast(error.message||'Не удалось назначить тренировку',true);button.disabled=false}
    };
  }catch(error){console.error(error);toast(error.message||'Не удалось открыть назначение',true)}
}

function setRow(number,value=''){
  return `<div class="dfd-set" data-dfd-set><span>${number}</span><input inputmode="decimal" autocomplete="off" placeholder="кг" value="${esc(value)}"><button type="button" data-rm>×</button></div>`;
}
function bindExerciseCard(card){
  $$('[data-rm]',card).forEach(button=>button.onclick=()=>{
    const rows=$$('[data-dfd-set]',card);
    if(rows.length<=1)return;
    button.parentElement.remove();
    $$('[data-dfd-set]',card).forEach((row,index)=>$('span',row).textContent=String(index+1));
  });
  $('[data-add]',card).onclick=()=>{
    const box=$('.dfd-sets',card),rows=$$('[data-dfd-set]',card),number=rows.length+1;
    const previous=rows.at(-1)?.querySelector('input')?.value||'';
    box.insertAdjacentHTML('beforeend',setRow(number,previous));
    bindExerciseCard(card);
    $$('[data-dfd-set] input',card).at(-1)?.focus();
  };
}
async function openDiary(assignmentId,backDate=''){
  const main=$('#main');main.innerHTML='<div class="spinner"></div>';
  try{
    const user=await trainerUser();if(!user)throw new Error('Сессия тренера не найдена');
    const aq=await db.from('assigned_workouts').select('id,client_id,program_id,program_name,day_label,scheduled_date,workout_session_id,schedule_event_id').eq('id',assignmentId).eq('trainer_id',user.id).single();
    if(aq.error)throw aq.error;const assignment=aq.data;if(!assignment.program_id)throw new Error('К тренировке не привязан шаблон');
    rememberClient(assignment.client_id);
    let itemsQuery=db.from('program_exercises').select('exercise_id,target_sets,target_weight,sort_order,exercises(name)').eq('program_id',assignment.program_id).order('sort_order');
    if(assignment.day_label)itemsQuery=itemsQuery.eq('day_label',assignment.day_label);
    const [name,itemsResult]=await Promise.all([clientName(assignment.client_id),itemsQuery]);
    if(itemsResult.error)throw itemsResult.error;const items=itemsResult.data||[];
    let session=null,saved=[];
    if(assignment.workout_session_id){
      const sq=await db.from('workout_sessions').select('id').eq('id',assignment.workout_session_id).maybeSingle();
      if(sq.error)throw sq.error;session=sq.data;
      if(session){const wq=await db.from('workout_sets').select('exercise_id,set_number,weight').eq('session_id',session.id).order('set_number');if(wq.error)throw wq.error;saved=wq.data||[]}
    }
    const exerciseIds=[...new Set(items.map(x=>x.exercise_id))];
    const [latest,progressRows]=await Promise.all([fetchLatest(assignment.client_id,exerciseIds,session?.id||null),fetchProgress(assignment.client_id)]);
    const progressMap=new Map(progressRows.map(x=>[x.exercise_id,x]));
    main.innerHTML=`<div class="dfd-diary"><div class="dfd-diary-head"><button id="dfdBack" type="button">←</button><div><span>ДНЕВНИК ТРЕНИРОВКИ</span><h1>${esc(name)}</h1><p>${esc(assignment.program_name)} · ${fmtDate(assignment.scheduled_date)}</p></div></div>
      ${items.length?items.map((item,index)=>{
        const current=saved.filter(x=>x.exercise_id===item.exercise_id).sort((a,b)=>a.set_number-b.set_number);
        const previous=latest.get(item.exercise_id)||[];
        const count=Math.max(1,current.length||Number(item.target_sets)||previous.length||3);
        const p=progressMap.get(item.exercise_id),pct=Number(p?.progress_pct||0);
        return `<section class="dfd-exercise" data-ex="${item.exercise_id}"><div class="dfd-ex-head"><div><span>${index+1}</span><div><b>${esc(item.exercises?.name||'Упражнение')}</b><small>${previous.length?`Прошлая тренировка: ${previous.map(x=>x.weight).join(' · ')} кг`:'Первое заполнение'}</small></div></div>${p?`<strong class="dfd-mini-pct ${pct>0?'up':pct<0?'down':''}">${formatPct(pct)}</strong>`:''}</div><div class="dfd-sets"><div class="dfd-set-label"><span>ПОДХОД</span><b>ВЕС</b><i></i></div>${Array.from({length:count},(_,i)=>setRow(i+1,current[i]?.weight??previous[i]?.weight??previous.at(-1)?.weight??item.target_weight??'')).join('')}</div><button class="dfd-add-set" type="button" data-add>＋ подход</button></section>`;
      }).join(''):'<div class="empty">В этом шаблоне нет упражнений.</div>'}
      <div class="dfd-diary-footer"><button id="dfdSave" class="dfd-primary" ${items.length?'':'disabled'}>Сохранить дневник</button><small>Следующая тренировка автоматически возьмёт сохранённые веса.</small></div></div>`;
    $$('[data-ex]',main).forEach(bindExerciseCard);
    $('#dfdBack').onclick=()=>backToSchedule(backDate||assignment.scheduled_date);
    $('#dfdSave').onclick=async()=>{
      const button=$('#dfdSave'),payload=[];
      for(const card of $$('[data-ex]',main)){
        const exerciseId=card.dataset.ex;
        const inputs=$$('[data-dfd-set] input',card);
        for(let i=0;i<inputs.length;i++){
          const weight=parseWeight(inputs[i].value);
          if(weight==null||weight<0){inputs[i].focus();return toast('Заполни вес во всех подходах. Для собственного веса поставь 0.',true)}
          payload.push({exercise_id:exerciseId,set_number:i+1,weight});
        }
      }
      if(!payload.length)return toast('Нет подходов для сохранения',true);
      button.disabled=true;button.textContent='Сохраняю…';
      try{
        const q=await db.rpc('save_trainer_workout_diary',{p_assignment_id:assignment.id,p_sets:payload});
        if(q.error)throw q.error;
        button.textContent='✓ Сохранено';toast('Дневник сохранён');
        setTimeout(()=>{if(document.body.contains(button)){button.disabled=false;button.textContent='Сохранить дневник'}},900);
      }catch(error){console.error(error);button.disabled=false;button.textContent='Сохранить дневник';toast(error.message||'Не удалось сохранить дневник',true)}
    };
  }catch(error){
    console.error(error);
    main.innerHTML=`<div class="card"><b>Не удалось открыть дневник</b><p class="muted">${esc(error.message||error)}</p><button id="dfdBackError" class="btn secondary">Назад в расписание</button></div>`;
    $('#dfdBackError').onclick=()=>backToSchedule(backDate);
  }
}

async function openScheduleDiary(eventId,clientId){
  rememberClient(clientId);
  const main=$('#main');main.innerHTML='<div class="spinner"></div>';
  try{
    const user=await trainerUser();if(!user)throw new Error('Сессия тренера не найдена');
    const [eventResult,assignmentResult]=await Promise.all([
      db.from('schedule_events').select('id,starts_at,training_type').eq('id',eventId).eq('trainer_id',user.id).single(),
      db.from('assigned_workouts').select('id,program_id').eq('trainer_id',user.id).eq('client_id',clientId).eq('schedule_event_id',eventId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1)
    ]);
    if(eventResult.error)throw eventResult.error;if(assignmentResult.error)throw assignmentResult.error;
    const event=eventResult.data,date=localDate(new Date(event.starts_at));
    if(assignmentResult.data?.[0]?.program_id)return openDiary(assignmentResult.data[0].id,date);
    const [name,templates]=await Promise.all([clientName(clientId),getTemplates(user.id)]);
    main.innerHTML=`<div class="dfd-picker"><button id="dfdPickBack" class="dfd-back" type="button">← Расписание</button><span class="dfd-kicker">${fmtDate(date)}</span><h1>${esc(name)}</h1><p>${templates.length?'Выбери шаблон — после этого сразу откроется дневник тренировки.':'Сначала создай шаблон с упражнениями во вкладке «Программы».'}</p>${templates.flatMap(t=>templateDays(t.template_exercises).map(d=>`<button class="dfd-pick" type="button" data-template="${t.id}" data-day="${esc(d)}"><span><b>${esc(t.name)}</b><small>${esc(d)}</small></span><i>＋</i></button>`)).join('')}</div>`;
    $('#dfdPickBack').onclick=()=>backToSchedule(date);
    $$('[data-template]',main).forEach(button=>button.onclick=async()=>{
      button.disabled=true;
      try{
        const q=await db.rpc('attach_trainer_template_to_schedule_event',{
          p_event_id:eventId,p_client_id:clientId,p_template_id:button.dataset.template,p_day_label:button.dataset.day,p_scheduled_date:date
        });
        if(q.error)throw q.error;
        const assignmentId=q.data?.[0]?.assignment_id;if(!assignmentId)throw new Error('Назначение не создано');
        openDiary(assignmentId,date);
      }catch(error){console.error(error);button.disabled=false;toast(error.message||'Не удалось применить шаблон',true)}
    });
  }catch(error){console.error(error);toast(error.message||'Не удалось открыть дневник',true);backToSchedule()}
}

document.addEventListener('click',event=>{
  const clientButton=event.target.closest?.('[data-client]');
  if(clientButton?.dataset.client)rememberClient(clientButton.dataset.client);

  const scheduleClient=event.target.closest?.('[data-open-schedule-client]');
  if(scheduleClient&&!/БОКС/i.test(scheduleClient.closest('.schedule-event')?.textContent||'')){
    const [eventId,clientId]=String(scheduleClient.dataset.openScheduleClient||'').split('|');
    if(eventId&&clientId){event.preventDefault();event.stopImmediatePropagation();openScheduleDiary(eventId,clientId)}
    return;
  }
  const assignButton=event.target.closest?.('#assignFromClient');
  if(assignButton){
    const clientId=rememberedClient();
    if(clientId){event.preventDefault();event.stopImmediatePropagation();assignFromClientCard(clientId)}
  }
},true);

let progressTimer=null;
window.addEventListener('load',()=>{
  const main=$('#main');if(!main)return;
  const observer=new MutationObserver(()=>{clearTimeout(progressTimer);progressTimer=setTimeout(addClientProgress,90)});
  observer.observe(main,{childList:true});
  setTimeout(addClientProgress,250);
});
})();
