(()=>{
'use strict';
if(window.__denisfitClientCardV201)return;
window.__denisfitClientCardV201=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let clientIdNow='';
let queued=false;
let busy=false;
let observer=null;

function rememberClient(id){
  if(!id)return;
  clientIdNow=String(id);
  try{
    for(const key of ['df_v201_client','df_v200_client','df_v192_client','df_v191_client','df_v190_client','df_v188_client'])sessionStorage.setItem(key,clientIdNow);
  }catch{}
}

function currentClientId(){
  if(clientIdNow)return clientIdNow;
  try{
    return sessionStorage.getItem('df_v201_client')||sessionStorage.getItem('df_v200_client')||sessionStorage.getItem('df_v192_client')||sessionStorage.getItem('df_v191_client')||sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v188_client')||'';
  }catch{return ''}
}

function toast(text,error=false){
  let el=$('#dfv201Toast');
  if(!el){el=document.createElement('div');el.id='dfv201Toast';document.body.append(el)}
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100001;max-width:calc(100vw - 32px);padding:12px 16px;border-radius:14px;font:700 13px/1.3 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:#fff;background:'+(error?'#351818':'#1b211b')+';border:1px solid '+(error?'#7e3c3c':'#3b4935')+';box-shadow:0 12px 30px rgba(0,0,0,.35)';
  clearTimeout(el._timer);el._timer=setTimeout(()=>el.remove(),2600);
}

function section(label){return $$('.section-title').find(x=>(x.textContent||'').trim()===label)||null}
function isClientCard(){return Boolean($('#saveClientPlan')&&$('#assignFromClient')&&section('Программы'))}

function dedupeOnline(){
  if(!isClientCard())return;
  const toggles=$$('#main label.online-toggle').filter(x=>/Онлайн\s*ведение/i.test(x.textContent||''));
  if(toggles.length<=1)return;
  const checked=toggles.some(x=>$('input[type="checkbox"]',x)?.checked);
  const keep=toggles.find(x=>$('#clientOnlineAccess',x))||toggles.find(x=>$('input[type="checkbox"]:checked',x))||toggles[0];
  const input=$('input[type="checkbox"]',keep);if(input&&checked)input.checked=true;
  toggles.forEach(x=>{if(x!==keep)x.remove()});
}

async function user(){const s=await db.auth.getSession();return s?.data?.session?.user||null}

async function loadRows(trainerId,clientId){
  const [pQ,aQ]=await Promise.all([
    db.from('training_programs').select('id,name,description,active,created_at').eq('trainer_id',trainerId).eq('client_id',clientId).order('created_at',{ascending:false}),
    db.from('assigned_workouts').select('id,program_id,program_name,status,scheduled_date,created_at').eq('trainer_id',trainerId).eq('client_id',clientId).eq('status','scheduled').order('created_at',{ascending:false})
  ]);
  if(pQ.error)throw pQ.error;if(aQ.error)throw aQ.error;
  const programs=pQ.data||[],assignments=aQ.data||[],programMap=new Map(programs.map(x=>[x.id,x])),rows=new Map();

  for(const p of programs){
    if(!p.active)continue;
    rows.set('p:'+p.id,{key:'p:'+p.id,programId:p.id,name:p.name||'Программа',description:p.description||'',active:true,assignmentIds:[],dates:[]});
  }

  for(const a of assignments){
    if(a.program_id){
      const p=programMap.get(a.program_id),key='p:'+a.program_id;
      const row=rows.get(key)||{key,programId:a.program_id,name:p?.name||a.program_name||'Программа',description:p?.description||'',active:Boolean(p?.active),assignmentIds:[],dates:[]};
      row.assignmentIds.push(a.id);if(a.scheduled_date)row.dates.push(a.scheduled_date);rows.set(key,row);
    }else{
      const key='a:'+a.id;
      rows.set(key,{key,programId:null,name:a.program_name||'Запланированная тренировка',description:'Назначено из расписания',active:false,assignmentIds:[a.id],dates:a.scheduled_date?[a.scheduled_date]:[]});
    }
  }

  return [...rows.values()];
}

async function removeRow(trainerId,clientId,row){
  if(row.programId){
    const q=await db.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('id',row.programId).eq('trainer_id',trainerId).eq('client_id',clientId);
    if(q.error)throw q.error;
    const c=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).eq('program_id',row.programId).eq('status','scheduled');
    if(c.error)throw c.error;
    return;
  }
  if(row.assignmentIds.length){
    const c=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).in('id',row.assignmentIds).eq('status','scheduled');
    if(c.error)throw c.error;
  }
}

function clearLegacy(title,box){
  let node=title.nextElementSibling;
  while(node&&node.id!=='deleteClient'){
    const next=node.nextElementSibling;
    if(node!==box&&node.id!=='dfv192PackageStats')node.remove();
    node=next;
  }
}

function render(rows,trainerId,clientId){
  const title=section('Программы');if(!title)return;
  let box=$('#dfv192ClientPrograms');
  if(!box){box=document.createElement('div');box.id='dfv192ClientPrograms';title.insertAdjacentElement('afterend',box)}
  clearLegacy(title,box);
  box.className='card dfv191-programs-card';box.dataset.v201='1';
  const fmtDate=v=>{if(!v)return'';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})};
  box.innerHTML=`<div data-v201-marker="1" class="list-row"><div><b>Назначенные программы</b><div class="small muted">Активные программы и будущие тренировки клиента.</div></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(r=>{const meta=[];if(r.active)meta.push('Активна у клиента');if(r.assignmentIds.length)meta.push(`Будущих: ${r.assignmentIds.length}`);if(r.dates.length)meta.push([...new Set(r.dates)].slice(0,2).map(fmtDate).filter(Boolean).join(', '));return `<div class="dfv191-program-row" data-v201-row="${esc(r.key)}"><div><b>${esc(r.name)}</b><small>${esc(meta.filter(Boolean).join(' · ')||r.description||'Назначенная программа')}</small></div><button type="button" class="btn inline danger" data-v201-remove="${esc(r.key)}">Удалить у клиента</button></div>`}).join(''):'<div class="empty">У клиента нет активных или будущих программ.</div>'}`;
  const map=new Map(rows.map(r=>[r.key,r]));
  $$('[data-v201-remove]',box).forEach(btn=>btn.onclick=async()=>{
    const row=map.get(btn.dataset.v201Remove);if(!row)return;
    if(!confirm(`Удалить «${row.name}» у клиента? Будущие назначения отменятся, выполненная история сохранится.`))return;
    btn.disabled=true;const old=btn.textContent;btn.textContent='Удаляю…';
    try{await removeRow(trainerId,clientId,row);render(await loadRows(trainerId,clientId),trainerId,clientId);toast('Программа удалена у клиента')}
    catch(e){console.error('client-card-v201 remove',e);btn.disabled=false;btn.textContent=old;toast(e.message||'Не удалось удалить программу',true)}
  });
}

async function enhance(){
  if(!isClientCard()||busy)return;
  dedupeOnline();
  const clientId=currentClientId();if(!clientId)return;
  const existing=$('#dfv192ClientPrograms');if(existing?.querySelector('[data-v201-marker]'))return;
  busy=true;
  try{const u=await user();if(!u||u.is_anonymous)return;const rows=await loadRows(u.id,clientId);if(isClientCard()&&currentClientId()===clientId)render(rows,u.id,clientId)}
  catch(e){console.error('client-card-v201 enhance',e);toast('Не удалось загрузить программы клиента',true)}finally{busy=false}
}

function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;dedupeOnline();enhance()},40)}
function attach(){const main=$('#main');if(!main||observer)return;observer=new MutationObserver(schedule);observer.observe(main,{childList:true,subtree:true});schedule()}

document.addEventListener('click',e=>{const c=e.target.closest?.('[data-client]');if(c?.dataset.client){rememberClient(c.dataset.client);setTimeout(schedule,20)}if(e.target.closest?.('#addTemplateFromClient')||e.target.closest?.('[data-client-template]'))setTimeout(schedule,180)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.addEventListener('pageshow',()=>{attach();schedule()});
schedule();
})();