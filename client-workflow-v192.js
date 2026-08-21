(()=>{
'use strict';
if(window.__denisfitClientWorkflowV192)return;
window.__denisfitClientWorkflowV192=true;
document.documentElement.dataset.denisfitRelease='19.8.0';

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('ru-RU').format(Number(v||0))+' ₽';
const dateText=v=>v?new Date(v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'}):'—';
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const localTime=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let lastClientId='';
let observerAttached=false;
let enhanceQueued=false;
let clientBusy=false;
let programsBusy=false;
let nextBusy=false;

function toast(text,error=false){
  let el=$('#dfv192Toast');
  if(!el){el=document.createElement('div');el.id='dfv192Toast';el.className='dfv191-toast';document.body.append(el)}
  el.textContent=text;el.className=`dfv191-toast show${error?' error':''}`;
  clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),2600);
}
function rememberClient(id){
  if(!id)return;lastClientId=id;
  try{sessionStorage.setItem('df_v192_client',id);sessionStorage.setItem('df_v191_client',id);sessionStorage.setItem('df_v190_client',id);sessionStorage.setItem('df_v188_client',id)}catch{}
}
function currentClientId(){
  if(lastClientId)return lastClientId;
  try{return sessionStorage.getItem('df_v192_client')||sessionStorage.getItem('df_v191_client')||sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v188_client')||''}catch{return ''}
}
async function trainer(){
  const s=await db.auth.getSession(),u=s.data.session?.user;
  if(!u||u.is_anonymous)return null;
  const r=await db.from('user_roles').select('role').eq('user_id',u.id).maybeSingle();
  if(r.error||r.data?.role!=='trainer')return null;
  return u;
}
function titleNode(label){return $$('.section-title').find(x=>(x.textContent||'').trim()===label)||null}
function onClientCard(){return Boolean($('#saveClientPlan')&&$('#assignFromClient')&&titleNode('Абонементы')&&titleNode('Программы'))}
function onPrograms(){return Boolean($('#programCreateTemplate')&&$('h1')?.textContent.trim()==='Программы')}

async function loadClientPrograms(uid,cid){
  const q=await db.from('training_programs').select('id,name,description,active,created_at').eq('trainer_id',uid).eq('client_id',cid).eq('active',true).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
async function removeClientProgram(uid,cid,pid){
  const off=await db.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('id',pid).eq('trainer_id',uid).eq('client_id',cid).select('id').maybeSingle();
  if(off.error)throw off.error;if(!off.data?.id)throw new Error('Шаблон у клиента не найден');
  const cancel=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',uid).eq('client_id',cid).eq('program_id',pid).eq('status','scheduled');
  if(cancel.error)throw cancel.error;
}
function renderClientPrograms(rows,uid,cid){
  const title=titleNode('Программы');if(!title)return;
  let box=$('#dfv192ClientPrograms');
  if(!box){box=document.createElement('div');box.id='dfv192ClientPrograms';box.className='card dfv191-programs-card';title.insertAdjacentElement('afterend',box)}
  box.innerHTML=`<div class="list-row"><div><b>Назначенные шаблоны</b><div class="small muted">Удаление здесь касается только этого клиента.</div></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(x=>`<div class="dfv191-program-row" data-client-program="${x.id}"><div><b>${esc(x.name)}</b><small>${esc(x.description||'Программа клиента')}</small></div><button type="button" class="btn inline danger" data-v192-remove-client="${x.id}" data-name="${esc(x.name)}">Удалить у клиента</button></div>`).join(''):'<div class="empty">Назначенных шаблонов нет.</div>'}`;
  $$('[data-v192-remove-client]',box).forEach(btn=>btn.onclick=async()=>{
    if(!confirm(`Удалить «${btn.dataset.name||'шаблон'}» у клиента? Выполненная история сохранится.`))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{await removeClientProgram(uid,cid,btn.dataset.v192RemoveClient);renderClientPrograms(await loadClientPrograms(uid,cid),uid,cid);toast('Шаблон удалён у клиента')}
    catch(e){console.error('v192 client template delete',e);btn.disabled=false;btn.textContent='Удалить у клиента';toast(e.message||'Не удалось удалить шаблон',true)}
  });
}

async function loadPackages(uid,cid){
  const q=await db.from('client_packages').select('id,package_name,total_sessions,used_sessions,entry_mode,amount_paid,paid_at,purchased_at,created_at,status').eq('trainer_id',uid).eq('client_id',cid).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
function renderPackageStats(rows){
  const title=titleNode('Абонементы');if(!title)return;
  const blocks=rows.filter(x=>x.entry_mode==='purchase'&&Number(x.total_sessions)>1);
  const singles=rows.filter(x=>x.entry_mode==='purchase'&&Number(x.total_sessions)===1);
  const sessions=blocks.reduce((s,x)=>s+Number(x.total_sessions||0),0);
  const paid=blocks.reduce((s,x)=>s+Number(x.amount_paid||0),0);
  let box=$('#dfv192PackageStats');
  if(!box){box=document.createElement('div');box.id='dfv192PackageStats';box.className='card dfv191-package-stats';const card=title.nextElementSibling;card?.insertAdjacentElement('afterend',box)}
  if(!box)return;
  box.innerHTML=`<div class="list-row"><div><b>История покупки блоков</b><div class="small muted">Текущий остаток не считается новой покупкой.</div></div><span class="pill">${blocks.length} блок.</span></div><div class="dfv191-stats-grid"><div><span>Куплено блоков</span><strong>${blocks.length}</strong></div><div><span>Тренировок куплено</span><strong>${sessions}</strong></div><div><span>Оплачено</span><strong>${money(paid)}</strong></div></div><div class="dfv191-history-title">Покупки</div>${blocks.length?blocks.map((x,i)=>`<div class="dfv191-purchase-row"><span class="dfv191-purchase-num">${blocks.length-i}</span><div><b>${esc(x.package_name||`Блок ${x.total_sessions}`)}</b><small>${dateText(x.paid_at||x.purchased_at||x.created_at)} · ${Number(x.total_sessions||0)} трен.${Number(x.amount_paid||0)>0?` · ${money(x.amount_paid)}`:''}</small></div></div>`).join(''):'<div class="empty">Новых покупок блоков пока нет.</div>'}${singles.length?`<div class="small muted dfv191-singles-note">Разовых покупок: ${singles.length}</div>`:''}`;
}
async function enhanceClient(){
  if(!onClientCard()||clientBusy)return;
  const cid=currentClientId();if(!cid)return;
  if($('#dfv192ClientPrograms')&&$('#dfv192PackageStats'))return;
  clientBusy=true;
  try{const u=await trainer();if(!u)return;const [p,pk]=await Promise.all([loadClientPrograms(u.id,cid),loadPackages(u.id,cid)]);if(onClientCard()&&currentClientId()===cid){renderClientPrograms(p,u.id,cid);renderPackageStats(pk)}}
  catch(e){console.error('v192 client card',e);toast('Не удалось загрузить управление клиентом',true)}finally{clientBusy=false}
}

async function loadTemplates(uid){
  const q=await db.from('program_templates').select('id,name,description,created_at,template_exercises(id)').eq('trainer_id',uid).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
function renderTemplates(rows,uid){
  let box=$('#dfv192TemplateManager');
  if(!box){box=document.createElement('div');box.id='dfv192TemplateManager';box.className='card dfv191-template-manager';$('#programCreateTemplate')?.closest('.client-actions-grid')?.insertAdjacentElement('afterend',box)}
  if(!box)return;
  box.innerHTML=`<div class="list-row"><div><b>Мои шаблоны</b><div class="small muted">Открыть или удалить шаблон.</div></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(x=>`<div class="dfv191-template-row" data-v192-template="${x.id}"><div><b>${esc(x.name)}</b><small>${x.template_exercises?.length||0} упр. · ${esc(x.description||'Без описания')}</small></div><div class="dfv191-template-actions"><button type="button" class="btn inline secondary" data-v192-open="${x.id}">Открыть</button><button type="button" class="btn inline danger" data-v192-delete="${x.id}" data-name="${esc(x.name)}">Удалить</button></div></div>`).join(''):'<div class="empty">Шаблонов пока нет.</div>'}`;
  $$('[data-v192-open]',box).forEach(btn=>btn.onclick=()=>{$('#programShowTemplates')?.click();setTimeout(()=>$(`[data-edit-template="${btn.dataset.v192Open}"]`)?.click(),120)});
  $$('[data-v192-delete]',box).forEach(btn=>btn.onclick=async()=>{
    if(!confirm(`Удалить шаблон «${btn.dataset.name||''}» из «Программ»? Уже назначенные клиентам программы останутся.`))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{const q=await db.from('program_templates').delete().eq('id',btn.dataset.v192Delete).eq('trainer_id',uid);if(q.error)throw q.error;renderTemplates(await loadTemplates(uid),uid);toast('Шаблон удалён из «Программ»')}
    catch(e){console.error('v192 template delete',e);btn.disabled=false;btn.textContent='Удалить';toast(e.message||'Не удалось удалить шаблон',true)}
  });
}
async function enhancePrograms(){
  if(!onPrograms()||programsBusy||$('#dfv192TemplateManager'))return;
  programsBusy=true;try{const u=await trainer();if(u)renderTemplates(await loadTemplates(u.id),u.id)}catch(e){console.error('v192 programs',e)}finally{programsBusy=false}
}

function modal(html){
  let root=$('#dfv192Modal');if(!root){root=document.createElement('div');root.id='dfv192Modal';document.body.append(root)}
  root.innerHTML=`<div class="dfv191-modal-back"><div class="dfv191-modal-sheet">${html}</div></div>`;root.classList.add('open');
  $('.dfv191-modal-back',root).onclick=e=>{if(e.target===e.currentTarget)closeModal()};
}
function closeModal(){const x=$('#dfv192Modal');if(x){x.classList.remove('open');x.innerHTML=''}}
async function eventContext(eventId,uid){
  const [e,p,a]=await Promise.all([
    db.from('schedule_events').select('id,starts_at,ends_at,training_type,status,notes').eq('id',eventId).eq('trainer_id',uid).single(),
    db.from('schedule_event_clients').select('client_id,package_id,payment_mode').eq('event_id',eventId),
    db.from('assigned_workouts').select('client_id,program_id,program_name,day_label,status').eq('trainer_id',uid).eq('schedule_event_id',eventId)
  ]);
  if(e.error)throw e.error;if(p.error)throw p.error;if(a.error)throw a.error;return {event:e.data,participants:p.data||[],assignments:a.data||[]};
}
async function waitCompleted(eventId,uid){let c=null;for(let i=0;i<10;i++){c=await eventContext(eventId,uid);if(c.event?.status==='completed')return c;await sleep(250+i*70)}return c}
async function activePackage(uid,cid,id){
  if(!id)return null;const q=await db.from('client_packages').select('id,total_sessions,used_sessions,status').eq('id',id).eq('trainer_id',uid).eq('client_id',cid).maybeSingle();if(q.error)throw q.error;const p=q.data;return p&&p.status==='active'&&Number(p.total_sessions)-Number(p.used_sessions)>0?p.id:null;
}
async function createNext(ctx,date,time,uid){
  const start=new Date(`${date}T${time}:00`);if(Number.isNaN(start.getTime()))throw new Error('Проверь дату и время');
  const duration=Math.max(15,Math.round((new Date(ctx.event.ends_at)-new Date(ctx.event.starts_at))/60000)||55),end=new Date(start.getTime()+duration*60000);
  const overlap=await db.from('schedule_events').select('id').eq('trainer_id',uid).neq('status','cancelled').lt('starts_at',end.toISOString()).gt('ends_at',start.toISOString()).limit(1);if(overlap.error)throw overlap.error;if(overlap.data?.length&&!confirm('На это время уже есть тренировка. Всё равно записать?'))return null;
  const ev=await db.from('schedule_events').insert({trainer_id:uid,starts_at:start.toISOString(),ends_at:end.toISOString(),training_type:ctx.event.training_type,status:'scheduled',notes:ctx.event.notes||''}).select('id').single();if(ev.error)throw ev.error;
  try{
    const parts=[];for(const p of ctx.participants){const pid=p.payment_mode==='package'?await activePackage(uid,p.client_id,p.package_id):null;parts.push({event_id:ev.data.id,client_id:p.client_id,package_id:pid,payment_mode:pid?'package':'single',single_paid:false,paid_amount:null,paid_at:null})}
    if(parts.length){const q=await db.from('schedule_event_clients').insert(parts);if(q.error)throw q.error}
    const assigns=ctx.assignments.filter(x=>x.status!=='cancelled').map(x=>({trainer_id:uid,client_id:x.client_id,program_id:x.program_id||null,program_name:x.program_name||'Тренировка',day_label:x.day_label||null,scheduled_date:date,status:'scheduled',schedule_event_id:ev.data.id}));
    if(assigns.length){const q=await db.from('assigned_workouts').insert(assigns);if(q.error)throw q.error}
    return ev.data.id;
  }catch(e){await db.from('schedule_events').delete().eq('id',ev.data.id).eq('trainer_id',uid);throw e}
}
async function offerNext(eventId){
  if(nextBusy||$('#dfv192Modal.open'))return;nextBusy=true;
  try{
    const u=await trainer();if(!u)return;const ctx=await waitCompleted(eventId,u.id);if(ctx?.event?.status!=='completed')return;
    const old=new Date(ctx.event.starts_at),next=new Date(old);next.setDate(next.getDate()+7);
    let names=[];if(ctx.participants.length){const q=await db.from('profiles').select('id,full_name').in('id',ctx.participants.map(x=>x.client_id));if(!q.error)names=(q.data||[]).map(x=>x.full_name||'Клиент')}
    modal(`<div class="dfv191-modal-head"><div><span>СЛЕДУЮЩАЯ ТРЕНИРОВКА</span><h2>Записать сразу?</h2><p>${esc(names.join(' + ')||'Клиент')}</p></div><button id="dfv192Close">×</button></div><div class="dfv191-next-grid"><label>Дата<input id="dfv192Date" type="date" value="${localDate(next)}"></label><label>Время<input id="dfv192Time" type="time" value="${localTime(old)}"></label></div><div class="small muted dfv191-next-note">По умолчанию — через неделю в то же время.</div><div class="dfv191-modal-actions"><button id="dfv192Later" class="btn secondary">Не сейчас</button><button id="dfv192Book" class="btn primary">Записать</button></div>`);
    $('#dfv192Close').onclick=closeModal;$('#dfv192Later').onclick=closeModal;$('#dfv192Book').onclick=async()=>{const b=$('#dfv192Book');b.disabled=true;b.textContent='Записываю…';try{const date=$('#dfv192Date').value,time=$('#dfv192Time').value,id=await createNext(ctx,date,time,u.id);if(!id){b.disabled=false;b.textContent='Записать';return}closeModal();toast('Следующая тренировка записана');$('[data-page="schedule"]')?.click()}catch(e){console.error('v192 next booking',e);b.disabled=false;b.textContent='Записать';toast(e.message||'Не удалось записать',true)}};
  }catch(e){console.error('v192 offer next',e)}finally{nextBusy=false}
}

function queueEnhance(){if(enhanceQueued)return;enhanceQueued=true;setTimeout(()=>{enhanceQueued=false;enhanceClient();enhancePrograms()},60)}
function attach(){if(observerAttached)return;const main=$('#main');if(!main)return;new MutationObserver(queueEnhance).observe(main,{childList:true});observerAttached=true;queueEnhance()}
document.addEventListener('click',e=>{
  const c=e.target.closest?.('[data-client]');if(c?.dataset.client)rememberClient(c.dataset.client);
  const status=e.target.closest?.('[data-event-status]');if(status){const [id,s]=String(status.dataset.eventStatus||'').split('|');if(id&&s==='completed')setTimeout(()=>offerNext(id),250)}
  if(e.target.closest?.('[data-page="clients"]')||e.target.closest?.('[data-page="programs"]')||e.target.closest?.('#addPackage')||e.target.closest?.('[data-client-template]'))setTimeout(queueEnhance,100);
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.addEventListener('pageshow',()=>{attach();queueEnhance()});
setTimeout(async()=>{try{const u=await trainer();if(!u)return;const k='denisfit_seen_19_8_0';if(localStorage.getItem(k))return;localStorage.setItem(k,'1');toast('DenisFit обновлён · v19.8')}catch{}},900);
})();