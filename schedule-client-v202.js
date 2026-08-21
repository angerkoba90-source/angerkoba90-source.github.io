(()=>{
'use strict';
if(window.__denisfitScheduleClientV202)return;
window.__denisfitScheduleClientV202=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=null;

function injectStyle(){
  if($('#dfv202Style'))return;
  const s=document.createElement('style');s.id='dfv202Style';s.textContent=`
  .dfv202-backdrop{position:fixed;inset:0;z-index:120000;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
  .dfv202-sheet{width:min(560px,100%);max-height:min(78vh,760px);overflow:auto;background:#111411;border:1px solid #303630;border-radius:24px;padding:18px;box-sizing:border-box;box-shadow:0 28px 80px rgba(0,0,0,.6);overscroll-behavior:contain}
  .dfv202-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.dfv202-head h2{font-size:24px;line-height:1.05;margin:3px 0 0}.dfv202-kicker{font-size:10px;letter-spacing:.14em;font-weight:900;color:#b7ff32}.dfv202-close{border:0;background:#242824;color:#fff;width:38px;height:38px;border-radius:50%;font-size:24px;line-height:1;flex:0 0 auto}
  .dfv202-current{padding:12px 13px;background:#171b17;border:1px solid #2d342d;border-radius:16px;margin-bottom:12px}.dfv202-current b{display:block;font-size:14px}.dfv202-current small{display:block;color:#9ca39d;margin-top:4px}
  .dfv202-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-top:1px solid #282d28}.dfv202-row:first-child{border-top:0}.dfv202-info{min-width:0}.dfv202-info b{display:block;font-size:15px;white-space:normal}.dfv202-info small{display:block;color:#969e97;font-size:12px;line-height:1.35;margin-top:4px}.dfv202-delete{border:1px solid #703636;background:#2a1717;color:#ff9a9a;border-radius:12px;min-height:40px;padding:0 12px;font-weight:800;font-size:12px}.dfv202-delete:disabled{opacity:.5}
  .dfv202-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.dfv202-btn{min-height:46px;border-radius:14px;border:1px solid #333a33;background:#1c211c;color:#fff;font-weight:850}.dfv202-btn.primary{background:#b7ff32;color:#10130d;border-color:#b7ff32}.dfv202-empty{padding:18px 10px;text-align:center;color:#929a93}.dfv202-count{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:#252b25;color:#c7cec8;font-size:11px;font-weight:800}
  @media(max-width:430px){.dfv202-backdrop{padding-left:8px;padding-right:8px}.dfv202-sheet{border-radius:22px;padding:15px}.dfv202-row{grid-template-columns:1fr}.dfv202-delete{width:100%}.dfv202-actions{grid-template-columns:1fr}.dfv202-head h2{font-size:22px}}
  `;document.head.append(s);
}
function close(){current=null;$('#dfv202Modal')?.remove();document.removeEventListener('keydown',escClose)}
function escClose(e){if(e.key==='Escape')close()}
function fmtDate(v){if(!v)return'';const d=new Date(String(v).length===10?v+'T12:00:00':v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})}
function toast(text,error=false){let el=$('#dfv202Toast');if(!el){el=document.createElement('div');el.id='dfv202Toast';document.body.append(el)}el.textContent=text;el.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:130000;padding:12px 16px;border-radius:14px;color:#fff;font:800 13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;background:'+(error?'#421b1b':'#202720')+';border:1px solid '+(error?'#7f3b3b':'#3e4a3e')+';max-width:calc(100vw - 30px);text-align:center';clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600)}

async function getUser(){const s=await db.auth.getSession();return s?.data?.session?.user||null}
async function loadData(trainerId,eventId,clientId){
  const [profileQ,eventQ,programQ,scheduledQ,currentQ]=await Promise.all([
    db.from('profiles').select('full_name').eq('id',clientId).maybeSingle(),
    db.from('schedule_events').select('id,starts_at,training_type,status').eq('id',eventId).eq('trainer_id',trainerId).maybeSingle(),
    db.from('training_programs').select('id,name,description,active,created_at').eq('trainer_id',trainerId).eq('client_id',clientId).order('created_at',{ascending:false}),
    db.from('assigned_workouts').select('id,program_id,program_name,day_label,status,scheduled_date,schedule_event_id,created_at').eq('trainer_id',trainerId).eq('client_id',clientId).eq('status','scheduled').order('created_at',{ascending:false}),
    db.from('assigned_workouts').select('id,program_id,program_name,day_label,status,scheduled_date,schedule_event_id,created_at').eq('trainer_id',trainerId).eq('client_id',clientId).eq('schedule_event_id',eventId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1)
  ]);
  for(const q of [profileQ,eventQ,programQ,scheduledQ,currentQ])if(q.error)throw q.error;
  const programs=programQ.data||[],scheduled=scheduledQ.data||[],currentAssignment=currentQ.data?.[0]||null,programMap=new Map(programs.map(x=>[x.id,x])),rows=new Map();
  for(const p of programs){if(p.active)rows.set('p:'+p.id,{key:'p:'+p.id,programId:p.id,name:p.name||'Программа',description:p.description||'',active:true,assignmentIds:[],dates:[],current:false})}
  for(const a of scheduled){
    if(a.program_id){const p=programMap.get(a.program_id),key='p:'+a.program_id,row=rows.get(key)||{key,programId:a.program_id,name:p?.name||a.program_name||'Программа',description:p?.description||'',active:Boolean(p?.active),assignmentIds:[],dates:[],current:false};row.assignmentIds.push(a.id);if(a.scheduled_date)row.dates.push(a.scheduled_date);if(a.schedule_event_id===eventId)row.current=true;rows.set(key,row)}
    else{const key='a:'+a.id;rows.set(key,{key,programId:null,name:a.program_name||'Тренировка',description:'Назначено из расписания',active:false,assignmentIds:[a.id],dates:a.scheduled_date?[a.scheduled_date]:[],current:a.schedule_event_id===eventId})}
  }
  if(currentAssignment){
    const key=currentAssignment.program_id?'p:'+currentAssignment.program_id:'a:'+currentAssignment.id;
    if(!rows.has(key)){const p=currentAssignment.program_id?programMap.get(currentAssignment.program_id):null;rows.set(key,{key,programId:currentAssignment.program_id||null,name:p?.name||currentAssignment.program_name||'Тренировка',description:p?.description||'',active:Boolean(p?.active),assignmentIds:[currentAssignment.id],dates:currentAssignment.scheduled_date?[currentAssignment.scheduled_date]:[],current:true})}else rows.get(key).current=true;
  }
  return {name:profileQ.data?.full_name||'Клиент',event:eventQ.data||null,currentAssignment,rows:[...rows.values()]};
}
async function removeRow(trainerId,clientId,row){
  if(row.programId){const p=await db.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('id',row.programId).eq('trainer_id',trainerId).eq('client_id',clientId);if(p.error)throw p.error;const a=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).eq('program_id',row.programId).eq('status','scheduled');if(a.error)throw a.error;return}
  if(row.assignmentIds.length){const a=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).in('id',row.assignmentIds).eq('status','scheduled');if(a.error)throw a.error}
}
function openOriginal(button){if(!button)return;close();button.dataset.v202Bypass='1';button.click();queueMicrotask(()=>delete button.dataset.v202Bypass)}
function updateUnderlying(button){const l=$('.schedule-program-label',button);if(l){l.textContent='Программа не выбрана';l.classList.add('muted')}}
function render(data,ctx){
  injectStyle();$('#dfv202Modal')?.remove();
  const modal=document.createElement('div');modal.id='dfv202Modal';modal.className='dfv202-backdrop';
  const eventDate=data.event?.starts_at?fmtDate(data.event.starts_at):'';
  const currentText=data.currentAssignment?`${data.currentAssignment.program_name||'Программа'}${data.currentAssignment.day_label?' · '+data.currentAssignment.day_label:''}`:'Программа на эту запись не выбрана';
  modal.innerHTML=`<section class="dfv202-sheet" role="dialog" aria-modal="true" aria-label="Программы клиента"><div class="dfv202-head"><div><div class="dfv202-kicker">РАСПИСАНИЕ · КЛИЕНТ</div><h2>${esc(data.name)}</h2></div><button class="dfv202-close" type="button" aria-label="Закрыть">×</button></div><div class="dfv202-current"><b>Эта тренировка${eventDate?' · '+esc(eventDate):''}</b><small>${esc(currentText)}</small></div><div class="list-row" style="margin:4px 0 6px"><b>Программы клиента</b><span class="dfv202-count">${data.rows.length}</span></div><div id="dfv202Rows">${data.rows.length?data.rows.map(r=>{const meta=[];if(r.current)meta.push('На этой записи');if(r.active)meta.push('Активная');if(r.assignmentIds.length)meta.push(`Будущих: ${r.assignmentIds.length}`);const dates=[...new Set(r.dates)].slice(0,2).map(fmtDate).filter(Boolean);if(dates.length)meta.push(dates.join(', '));return `<div class="dfv202-row" data-v202-row="${esc(r.key)}"><div class="dfv202-info"><b>${esc(r.name)}</b><small>${esc(meta.join(' · ')||r.description||'Программа клиента')}</small></div><button class="dfv202-delete" type="button" data-v202-delete="${esc(r.key)}">Удалить у клиента</button></div>`}).join(''):'<div class="dfv202-empty">У клиента сейчас нет активных или будущих программ.</div>'}</div><div class="dfv202-actions"><button class="dfv202-btn" type="button" data-v202-close>Закрыть</button><button class="dfv202-btn primary" type="button" data-v202-open>Открыть тренировку</button></div></section>`;
  document.body.append(modal);current={...ctx,data};
  $('.dfv202-close',modal).onclick=close;$('[data-v202-close]',modal).onclick=close;modal.onclick=e=>{if(e.target===modal)close()};document.addEventListener('keydown',escClose);
  $('[data-v202-open]',modal).onclick=()=>openOriginal(ctx.sourceButton);
  const map=new Map(data.rows.map(r=>[r.key,r]));$$('[data-v202-delete]',modal).forEach(btn=>btn.onclick=async()=>{const row=map.get(btn.dataset.v202Delete);if(!row)return;if(!confirm(`Удалить «${row.name}» у клиента? Будущие назначения отменятся, выполненная история сохранится.`))return;btn.disabled=true;btn.textContent='Удаляю…';try{await removeRow(ctx.trainerId,ctx.clientId,row);if(row.current||(data.currentAssignment&&row.programId&&data.currentAssignment.program_id===row.programId)){updateUnderlying(ctx.sourceButton)}const fresh=await loadData(ctx.trainerId,ctx.eventId,ctx.clientId);render(fresh,ctx);toast('Программа удалена у клиента')}catch(e){console.error('schedule-client-v202',e);btn.disabled=false;btn.textContent='Удалить у клиента';toast(e.message||'Не удалось удалить программу',true)}})
}
async function openPanel(button,eventId,clientId){
  injectStyle();
  try{const u=await getUser();if(!u||u.is_anonymous)return openOriginal(button);const data=await loadData(u.id,eventId,clientId);render(data,{trainerId:u.id,eventId,clientId,sourceButton:button})}
  catch(e){console.error('schedule-client-v202 open',e);toast('Не удалось открыть программы клиента',true)}
}
document.addEventListener('click',e=>{const button=e.target.closest?.('[data-open-schedule-client]');if(!button||button.dataset.v202Bypass==='1')return;const raw=button.dataset.openScheduleClient||'',parts=raw.split('|');if(parts.length!==2||!parts[0]||!parts[1])return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPanel(button,parts[0],parts[1])},true);
})();