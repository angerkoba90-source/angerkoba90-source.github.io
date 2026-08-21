(()=>{
'use strict';
if(window.__denisfitScheduleTrainerV211)return;
window.__denisfitScheduleTrainerV211=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate=value=>new Date(String(value).length===10?`${value}T12:00:00`:value).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
let diaryCtx=null;
let injectQueued=false;

function styleOnce(){
  if($('#dfv211Style'))return;
  const s=document.createElement('style');
  s.id='dfv211Style';
  s.textContent=`
    .dfv211-menu-note{margin:10px 0 16px;padding:12px 13px;border:1px solid #303630;border-radius:14px;background:#151915;color:#9ca49d;font-size:12px;line-height:1.4}
    .dfv211-menu-note b{display:block;color:#fff;font-size:14px;margin-bottom:3px}
    .dfv211-action{width:100%;min-height:54px;margin:8px 0;border:1px solid #394039;border-radius:15px;background:#1a1f1a;color:#fff;font-weight:900;font-size:14px;text-align:left;padding:0 16px}
    .dfv211-action.primary{background:#b7ff32;color:#11140e;border-color:#b7ff32}
    .dfv211-action:disabled{opacity:.38}
    .dfv211-delete-zone{margin:22px 0 calc(18px + env(safe-area-inset-bottom));padding-top:18px;border-top:1px solid #303530}
    .dfv211-delete-zone small{display:block;color:#8d958e;font-size:11px;line-height:1.45;margin:0 2px 10px}
    .dfv211-delete{width:100%;min-height:52px;border:1px solid #79383c;border-radius:15px;background:#2b1719;color:#ff9a9f;font-weight:900;font-size:14px}
    .dfv211-delete:disabled{opacity:.5}
  `;
  document.head.append(s);
}

function toast(text,error=false){
  let el=$('#dfv211Toast');
  if(!el){el=document.createElement('div');el.id='dfv211Toast';document.body.append(el)}
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:140000;max-width:calc(100vw - 30px);padding:12px 16px;border-radius:14px;color:#fff;text-align:center;font:800 13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;background:'+(error?'#421b1b':'#202720')+';border:1px solid '+(error?'#7f3b3b':'#3e4a3e');
  clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600);
}

async function trainerUser(){
  const s=await db.auth.getSession();
  const u=s?.data?.session?.user;
  return !u||u.is_anonymous?null:u;
}
function templateDays(rows){
  const days=[...new Set((rows||[]).map(x=>x.day_label||'Тренировка'))];
  return days.length?days:['Тренировка'];
}
function backToSchedule(date=''){
  diaryCtx=null;
  $('[data-page="schedule"]')?.click();
  if(!date)return;
  setTimeout(()=>{
    const input=$('#scheduleDate');
    if(input&&input.value!==date){input.value=date;input.dispatchEvent(new Event('change',{bubbles:true}))}
  },180);
}

async function loadContext(eventId,clientId){
  const user=await trainerUser();
  if(!user)throw new Error('Сессия тренера не найдена');
  const [eventQ,profileQ,assignmentQ]=await Promise.all([
    db.from('schedule_events').select('id,starts_at,training_type,status').eq('id',eventId).eq('trainer_id',user.id).single(),
    db.from('profiles').select('full_name').eq('id',clientId).maybeSingle(),
    db.from('assigned_workouts').select('id,program_id,program_name,day_label,status,schedule_event_id').eq('trainer_id',user.id).eq('client_id',clientId).eq('schedule_event_id',eventId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1)
  ]);
  if(eventQ.error)throw eventQ.error;if(profileQ.error)throw profileQ.error;if(assignmentQ.error)throw assignmentQ.error;
  const event=eventQ.data;
  if(!event)throw new Error('Запись расписания не найдена');
  return {trainerId:user.id,eventId,clientId,event,name:profileQ.data?.full_name||'Клиент',assignment:assignmentQ.data?.[0]||null,date:localDate(new Date(event.starts_at))};
}

function renderMenu(ctx){
  styleOnce();
  const main=$('#main');
  if(!main)return;
  const current=ctx.assignment?.program_id?`${ctx.assignment.program_name||'Шаблон'}${ctx.assignment.day_label?' · '+ctx.assignment.day_label:''}`:'Шаблон пока не выбран';
  main.innerHTML=`<div class="dfd-picker" data-v211-menu>
    <button id="dfv211Back" class="dfd-back" type="button">← Расписание</button>
    <span class="dfd-kicker">${esc(fmtDate(ctx.date))}</span>
    <h1>${esc(ctx.name)}</h1>
    <div class="dfv211-menu-note"><b>${esc(current)}</b>${ctx.assignment?.program_id?'Шаблон назначен на эту тренировку.':'Сначала добавь шаблон тренировки.'}</div>
    <button id="dfv211AddTemplate" class="dfv211-action primary" type="button">＋ Добавить шаблон тренировки</button>
    <button id="dfv211OpenWorkout" class="dfv211-action" type="button" ${ctx.assignment?.program_id?'':'disabled'}>Открыть тренировку →</button>
  </div>`;
  $('#dfv211Back').onclick=()=>backToSchedule(ctx.date);
  $('#dfv211AddTemplate').onclick=()=>renderTemplatePicker(ctx);
  const open=$('#dfv211OpenWorkout');
  if(open&&!open.disabled)open.onclick=()=>openLegacyDiary(ctx);
}

async function renderTemplatePicker(ctx){
  const main=$('#main');
  if(!main)return;
  main.innerHTML='<div class="spinner"></div>';
  try{
    const q=await db.from('program_templates').select('id,name,description,online_only,updated_at,template_exercises(day_label,sort_order)').eq('trainer_id',ctx.trainerId).order('updated_at',{ascending:false});
    if(q.error)throw q.error;
    const templates=(q.data||[]).filter(t=>(t.template_exercises||[]).length>0);
    main.innerHTML=`<div class="dfd-picker" data-v211-picker>
      <button id="dfv211PickerBack" class="dfd-back" type="button">← Назад</button>
      <span class="dfd-kicker">ВСЕ ШАБЛОНЫ DENISFIT</span>
      <h1>Добавить шаблон тренировки</h1>
      <p>${templates.length?'Выбери любой доступный шаблон из базы.':'В базе пока нет шаблонов с упражнениями.'}</p>
      ${templates.flatMap(t=>templateDays(t.template_exercises).map(day=>`<button class="dfd-pick" type="button" data-v211-template="${esc(t.id)}" data-v211-day="${esc(day)}"><span><b>${esc(t.name)}</b><small>${esc(day)}${t.description?' · '+esc(t.description):''}</small></span><i>＋</i></button>`)).join('')}
    </div>`;
    $('#dfv211PickerBack').onclick=()=>renderMenu(ctx);
    $$('[data-v211-template]',main).forEach(btn=>btn.onclick=async()=>{
      if(btn.disabled)return;
      btn.disabled=true;
      try{
        const r=await db.rpc('trainer_apply_template_to_schedule_event',{p_event_id:ctx.eventId,p_client_id:ctx.clientId,p_template_id:btn.dataset.v211Template,p_day_label:btn.dataset.v211Day});
        if(r.error)throw r.error;
        const fresh=await loadContext(ctx.eventId,ctx.clientId);
        toast('Шаблон добавлен');
        renderMenu(fresh);
      }catch(e){console.error('schedule-trainer-v211 apply',e);btn.disabled=false;toast(e.message||'Не удалось добавить шаблон',true)}
    });
  }catch(e){console.error('schedule-trainer-v211 templates',e);toast(e.message||'Не удалось загрузить шаблоны',true);renderMenu(ctx)}
}

function openLegacyDiary(ctx){
  if(!ctx.assignment?.program_id)return;
  diaryCtx={eventId:ctx.eventId,clientId:ctx.clientId,date:ctx.date};
  const ghost=document.createElement('button');
  ghost.type='button';
  ghost.hidden=true;
  ghost.dataset.openScheduleClient=`${ctx.eventId}|${ctx.clientId}`;
  ghost.dataset.v211Bypass='1';
  document.body.append(ghost);
  ghost.click();
  queueMicrotask(()=>ghost.remove());
}

function injectDeleteButton(){
  injectQueued=false;
  const diary=$('.dfd-diary');
  if(!diary||!diaryCtx)return;
  styleOnce();
  if($('#dfv211DeleteZone',diary))return;
  const footer=$('.dfd-diary-footer',diary);
  if(!footer)return;
  const zone=document.createElement('section');
  zone.id='dfv211DeleteZone';
  zone.className='dfv211-delete-zone';
  zone.innerHTML='<small>Удаление снимет шаблон только с этой записи в расписании. Сама запись клиента, глобальный шаблон и выполненная история останутся.</small><button id="dfv211DeleteTemplate" class="dfv211-delete" type="button">Удалить шаблон</button>';
  diary.append(zone);
  $('#dfv211DeleteTemplate',zone).onclick=async()=>{
    const btn=$('#dfv211DeleteTemplate',zone);
    if(!btn||btn.disabled||!diaryCtx)return;
    if(!confirm('Удалить шаблон с этой тренировки? Запись клиента в расписании останется.'))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    const ctx={...diaryCtx};
    try{
      const q=await db.rpc('trainer_remove_template_from_schedule_event',{p_event_id:ctx.eventId,p_client_id:ctx.clientId});
      if(q.error)throw q.error;
      toast('Шаблон удалён с этой тренировки');
      backToSchedule(ctx.date);
    }catch(e){console.error('schedule-trainer-v211 remove',e);btn.disabled=false;btn.textContent='Удалить шаблон';toast(e.message||'Не удалось удалить шаблон',true)}
  };
}
function queueInject(){
  if(injectQueued)return;
  injectQueued=true;
  requestAnimationFrame(injectDeleteButton);
}

document.addEventListener('click',e=>{
  const button=e.target?.closest?.('[data-open-schedule-client]');
  if(!button||button.dataset.v211Bypass==='1')return;
  if(/БОКС/i.test(button.closest('.schedule-event')?.textContent||''))return;
  const [eventId,clientId]=String(button.dataset.openScheduleClient||'').split('|');
  if(!eventId||!clientId)return;
  e.preventDefault();e.stopImmediatePropagation();
  $('#main').innerHTML='<div class="spinner"></div>';
  loadContext(eventId,clientId).then(renderMenu).catch(err=>{console.error('schedule-trainer-v211 open',err);toast(err.message||'Не удалось открыть тренировку',true);backToSchedule()});
},true);

document.addEventListener('click',e=>{
  if(e.target?.closest?.('#dfdBack'))diaryCtx=null;
  if(e.target?.closest?.('[data-page]')&&!e.target.closest('[data-page="schedule"]'))diaryCtx=null;
},true);
new MutationObserver(queueInject).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',queueInject);
queueInject();
})();