(()=>{
'use strict';
if(window.__denisfitClientWorkflowV191)return;
window.__denisfitClientWorkflowV191=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('ru-RU').format(Number(v||0))+' ₽';
const fmtDate=v=>v?new Date(String(v).length===10?`${v}T12:00:00`:v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'}):'—';
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const localTime=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
let lastClientId='';
let scheduled=false;
let busyClient='';
let busyPrograms=false;
let nextBusy=false;

function toast(text,error=false){
  let el=$('#dfv191Toast');
  if(!el){el=document.createElement('div');el.id='dfv191Toast';document.body.append(el)}
  el.textContent=text;el.className=`dfv191-toast show${error?' error':''}`;
  clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),2600);
}
function rememberClient(id){
  if(!id)return;lastClientId=id;
  try{sessionStorage.setItem('df_v191_client',id);sessionStorage.setItem('df_v190_client',id);sessionStorage.setItem('df_v188_client',id)}catch{}
}
function currentClientId(){
  if(lastClientId)return lastClientId;
  try{return sessionStorage.getItem('df_v191_client')||sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v188_client')||''}catch{return ''}
}
async function currentTrainer(){
  const s=await db.auth.getSession(),u=s.data.session?.user;
  if(!u||u.is_anonymous)return null;
  const r=await db.from('user_roles').select('role').eq('user_id',u.id).maybeSingle();
  return r.error||r.data?.role!=='trainer'?null:u;
}
function sectionTitle(text){return $$('.section-title').find(x=>(x.textContent||'').trim()===text)||null}
function isClientCard(){return Boolean($('#saveClientPlan')&&$('#assignFromClient')&&sectionTitle('Абонементы')&&sectionTitle('Программы'))}
function isProgramsPage(){return Boolean($('#programCreateTemplate')&&$('h1')?.textContent.trim()==='Программы')}

async function loadClientPrograms(uid,cid){
  const q=await db.from('training_programs').select('id,name,description,created_at,active,source_kind,source_template_id').eq('trainer_id',uid).eq('client_id',cid).eq('active',true).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
async function loadClientPurchases(uid,cid){
  const q=await db.from('client_packages').select('id,package_name,total_sessions,used_sessions,purchased_at,status,entry_mode,amount_paid,paid_at,training_type,created_at').eq('trainer_id',uid).eq('client_id',cid).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
async function removeProgramForClient(uid,cid,programId){
  const off=await db.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('id',programId).eq('trainer_id',uid).eq('client_id',cid).select('id').maybeSingle();
  if(off.error)throw off.error;if(!off.data?.id)throw new Error('Шаблон у клиента не найден');
  const cancel=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',uid).eq('client_id',cid).eq('program_id',programId).eq('status','scheduled');
  if(cancel.error){await db.from('training_programs').update({active:true,updated_at:new Date().toISOString()}).eq('id',programId).eq('trainer_id',uid).eq('client_id',cid);throw cancel.error}
}
function clearLegacyPrograms(title){
  let node=title?.nextElementSibling;
  while(node&&node.id!=='deleteClient'){
    const next=node.nextElementSibling;
    if(node.id!=='dfv191ClientPrograms')node.remove();
    node=next;
  }
}
function renderClientPrograms(title,rows,uid,cid){
  clearLegacyPrograms(title);
  let box=$('#dfv191ClientPrograms');if(!box){box=document.createElement('div');box.id='dfv191ClientPrograms';title.insertAdjacentElement('afterend',box)}
  box.className='card dfv191-programs-card';
  box.innerHTML=rows.length?rows.map(x=>`<div class="dfv191-program-row" data-client-program="${x.id}"><div><b>${esc(x.name)}</b><small>${esc(x.description||'Шаблон тренировки')}</small></div><button type="button" class="btn inline danger" data-remove-client-program="${x.id}" data-name="${esc(x.name)}">Удалить у клиента</button></div>`).join(''):'<div class="empty">Шаблоны клиенту не назначены.</div>';
  $$('[data-remove-client-program]',box).forEach(btn=>btn.onclick=async()=>{
    const name=btn.dataset.name||'шаблон';
    if(!confirm(`Удалить «${name}» у этого клиента? Выполненная история останется.`))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{await removeProgramForClient(uid,cid,btn.dataset.removeClientProgram);toast('Шаблон удалён у клиента');renderClientPrograms(title,await loadClientPrograms(uid,cid),uid,cid)}
    catch(e){console.error('v191 remove client program',e);btn.disabled=false;btn.textContent='Удалить у клиента';toast(e.message||'Не удалось удалить шаблон',true)}
  });
}
function purchaseStatsHtml(rows){
  const blocks=rows.filter(x=>x.entry_mode==='purchase'&&Number(x.total_sessions)>1);
  const singles=rows.filter(x=>x.entry_mode==='purchase'&&Number(x.total_sessions)===1);
  const totalSessions=blocks.reduce((a,x)=>a+Number(x.total_sessions||0),0);
  const totalPaid=blocks.reduce((a,x)=>a+Number(x.amount_paid||0),0);
  return `<div class="dfv191-stats-grid"><div><span>Куплено блоков</span><strong>${blocks.length}</strong></div><div><span>Тренировок в блоках</span><strong>${totalSessions}</strong></div><div><span>Оплачено за блоки</span><strong>${money(totalPaid)}</strong></div></div>
    <div class="dfv191-history-title">История покупок</div>
    ${blocks.length?blocks.map((x,i)=>`<div class="dfv191-purchase-row"><span class="dfv191-purchase-num">${blocks.length-i}</span><div><b>${esc(x.package_name||`Блок ${x.total_sessions}`)}</b><small>${fmtDate(x.paid_at||x.purchased_at||x.created_at)} · ${Number(x.total_sessions)} трен.${Number(x.amount_paid||0)>0?` · ${money(x.amount_paid)}`:''}</small></div></div>`).join(''):'<div class="empty">Покупок блоков пока нет.</div>'}
    ${singles.length?`<div class="small muted dfv191-singles-note">Разовые тренировки: ${singles.length}. В счётчик блоков они не входят.</div>`:''}`;
}
function renderPurchaseStats(rows){
  const title=sectionTitle('Абонементы');if(!title)return;
  let node=$('#dfv191PackageStats');if(!node){node=document.createElement('div');node.id='dfv191PackageStats';node.className='card dfv191-package-stats';const card=title.nextElementSibling;card?.insertAdjacentElement('afterend',node)}
  if(node)node.innerHTML=`<div class="list-row"><div><b>Покупки блоков</b><div class="small muted">Считаются только новые покупки, не внесённый вручную остаток.</div></div><span class="pill">история</span></div>${purchaseStatsHtml(rows)}`;
}
async function enhanceClientCard(){
  if(!isClientCard())return;
  const cid=currentClientId();if(!cid||busyClient===cid)return;
  if($('#dfv191ClientPrograms')&&$('#dfv191PackageStats'))return;
  busyClient=cid;
  try{
    const u=await currentTrainer();if(!u)return;
    const [programs,purchases]=await Promise.all([loadClientPrograms(u.id,cid),loadClientPurchases(u.id,cid)]);
    if(!isClientCard()||currentClientId()!==cid)return;
    const title=sectionTitle('Программы');if(title)renderClientPrograms(title,programs,u.id,cid);
    renderPurchaseStats(purchases);
  }catch(e){console.error('v191 client card',e)}finally{busyClient=''}
}

async function loadTemplates(uid){const q=await db.from('program_templates').select('id,name,description,created_at,template_exercises(id)').eq('trainer_id',uid).order('created_at',{ascending:false});if(q.error)throw q.error;return q.data||[]}
function renderTemplateManager(rows,uid){
  let box=$('#dfv191TemplateManager');if(!box){box=document.createElement('div');box.id='dfv191TemplateManager';box.className='card dfv191-template-manager';$('#programCreateTemplate')?.closest('.client-actions-grid')?.insertAdjacentElement('afterend',box)}
  if(!box)return;
  box.innerHTML=`<div class="list-row"><div><b>Мои шаблоны</b><div class="small muted">Открыть или удалить прямо отсюда.</div></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(x=>`<div class="dfv191-template-row" data-template-row="${x.id}"><div><b>${esc(x.name)}</b><small>${x.template_exercises?.length||0} упр. · ${esc(x.description||'Без описания')}</small></div><div class="dfv191-template-actions"><button type="button" class="btn inline secondary" data-open-template="${x.id}">Открыть</button><button type="button" class="btn inline danger" data-delete-template-v191="${x.id}" data-name="${esc(x.name)}">Удалить</button></div></div>`).join(''):'<div class="empty">Шаблонов пока нет.</div>'}`;
  $$('[data-open-template]',box).forEach(btn=>btn.onclick=()=>{$('#programShowTemplates')?.click();setTimeout(()=>$(`[data-edit-template="${btn.dataset.openTemplate}"]`)?.click(),80)});
  $$('[data-delete-template-v191]',box).forEach(btn=>btn.onclick=async()=>{
    const name=btn.dataset.name||'шаблон';if(!confirm(`Удалить шаблон «${name}» из «Программ»? Уже скопированные клиентам программы и выполненная история останутся.`))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{const q=await db.from('program_templates').delete().eq('id',btn.dataset.deleteTemplateV191).eq('trainer_id',uid);if(q.error)throw q.error;toast('Шаблон удалён из «Программ»');renderTemplateManager(await loadTemplates(uid),uid)}catch(e){console.error('v191 delete template',e);btn.disabled=false;btn.textContent='Удалить';toast(e.message||'Не удалось удалить шаблон',true)}
  });
}
async function enhancePrograms(){
  if(!isProgramsPage()||busyPrograms||$('#dfv191TemplateManager'))return;busyPrograms=true;
  try{const u=await currentTrainer();if(!u)return;renderTemplateManager(await loadTemplates(u.id),u.id)}catch(e){console.error('v191 templates',e)}finally{busyPrograms=false}
}

function modal(html){
  let root=$('#dfv191Modal');if(!root){root=document.createElement('div');root.id='dfv191Modal';document.body.append(root)}
  root.innerHTML=`<div class="dfv191-modal-back"><div class="dfv191-modal-sheet">${html}</div></div>`;root.classList.add('open');
  $('.dfv191-modal-back',root).onclick=e=>{if(e.target===e.currentTarget)closeModal()};
}
function closeModal(){const root=$('#dfv191Modal');if(root){root.classList.remove('open');root.innerHTML=''}}
async function eventContext(eventId,uid){
  const [evQ,partQ,assignQ]=await Promise.all([
    db.from('schedule_events').select('id,trainer_id,starts_at,ends_at,training_type,status,notes').eq('id',eventId).eq('trainer_id',uid).single(),
    db.from('schedule_event_clients').select('id,event_id,client_id,package_id,payment_mode').eq('event_id',eventId),
    db.from('assigned_workouts').select('id,client_id,program_id,program_name,day_label,status').eq('trainer_id',uid).eq('schedule_event_id',eventId)
  ]);
  if(evQ.error)throw evQ.error;if(partQ.error)throw partQ.error;if(assignQ.error)throw assignQ.error;
  return {event:evQ.data,participants:partQ.data||[],assignments:assignQ.data||[]};
}
async function validPackageId(uid,cid,packageId){
  if(!packageId)return null;
  const q=await db.from('client_packages').select('id,total_sessions,used_sessions,status').eq('id',packageId).eq('trainer_id',uid).eq('client_id',cid).maybeSingle();
  if(q.error)throw q.error;const p=q.data;return p&&p.status==='active'&&(Number(p.total_sessions)-Number(p.used_sessions))>0?p.id:null;
}
async function createNextBooking(ctx,date,time,uid){
  const old=ctx.event,start=new Date(`${date}T${time}:00`);if(Number.isNaN(start.getTime()))throw new Error('Проверь дату и время');
  const duration=Math.max(15,Math.round((new Date(old.ends_at)-new Date(old.starts_at))/60000)||55),end=new Date(start.getTime()+duration*60000);
  const overlap=await db.from('schedule_events').select('id').eq('trainer_id',uid).neq('status','cancelled').lt('starts_at',end.toISOString()).gt('ends_at',start.toISOString()).limit(1);if(overlap.error)throw overlap.error;
  if(overlap.data?.length&&!confirm('На это время уже есть тренировка. Всё равно записать?'))return null;
  const ev=await db.from('schedule_events').insert({trainer_id:uid,starts_at:start.toISOString(),ends_at:end.toISOString(),training_type:old.training_type,status:'scheduled',notes:old.notes||''}).select('id').single();if(ev.error)throw ev.error;
  try{
    const partRows=[];
    for(const p of ctx.participants){
      const packageId=p.payment_mode==='package'?await validPackageId(uid,p.client_id,p.package_id):null;
      partRows.push({event_id:ev.data.id,client_id:p.client_id,package_id:packageId,payment_mode:packageId?'package':'single',single_paid:false,paid_amount:null,paid_at:null});
    }
    if(partRows.length){const pq=await db.from('schedule_event_clients').insert(partRows);if(pq.error)throw pq.error}
    const rows=ctx.assignments.filter(a=>a.status!=='cancelled').map(a=>({trainer_id:uid,client_id:a.client_id,program_id:a.program_id||null,program_name:a.program_name||'Тренировка',day_label:a.day_label||null,scheduled_date:date,status:'scheduled',schedule_event_id:ev.data.id}));
    if(rows.length){const aq=await db.from('assigned_workouts').insert(rows);if(aq.error)throw aq.error}
    return ev.data.id;
  }catch(e){await db.from('schedule_events').delete().eq('id',ev.data.id).eq('trainer_id',uid);throw e}
}
async function offerNextBooking(eventId){
  if(nextBusy||$('#dfv191Modal.open'))return;nextBusy=true;
  try{
    const u=await currentTrainer();if(!u)return;const ctx=await eventContext(eventId,u.id);if(ctx.event.status!=='completed')return;
    const oldStart=new Date(ctx.event.starts_at),next=new Date(oldStart);next.setDate(next.getDate()+7);
    let names=[];if(ctx.participants.length){const nq=await db.from('profiles').select('id,full_name').in('id',ctx.participants.map(x=>x.client_id));if(!nq.error)names=(nq.data||[]).map(x=>x.full_name||'Клиент')}
    modal(`<div class="dfv191-modal-head"><div><span>СЛЕДУЮЩАЯ ТРЕНИРОВКА</span><h2>Записать сразу?</h2><p>${esc(names.join(' + ')||`${ctx.participants.length} клиент(а)`)}</p></div><button id="dfv191Close" type="button">×</button></div><div class="dfv191-next-grid"><label>Дата<input id="dfv191NextDate" type="date" value="${localDate(next)}"></label><label>Время<input id="dfv191NextTime" type="time" value="${localTime(oldStart)}"></label></div><div class="small muted dfv191-next-note">По умолчанию — через неделю в то же время. Если старый блок закончился, новая запись создастся без списания из старого блока.</div><div class="dfv191-modal-actions"><button id="dfv191Later" type="button" class="btn secondary">Не сейчас</button><button id="dfv191Book" type="button" class="btn primary">Записать</button></div>`);
    $('#dfv191Close').onclick=closeModal;$('#dfv191Later').onclick=closeModal;$('#dfv191Book').onclick=async()=>{
      const b=$('#dfv191Book');b.disabled=true;b.textContent='Записываю…';
      try{const date=$('#dfv191NextDate').value,time=$('#dfv191NextTime').value;if(!date||!time)throw new Error('Укажи дату и время');const id=await createNextBooking(ctx,date,time,u.id);if(!id){b.disabled=false;b.textContent='Записать';return}closeModal();toast('Следующая тренировка записана');$('[data-page="schedule"]')?.click();setTimeout(()=>{const d=$('#scheduleDate');if(d){d.value=date;d.dispatchEvent(new Event('change',{bubbles:true}))}},200)}catch(e){console.error('v191 next booking',e);b.disabled=false;b.textContent='Записать';toast(e.message||'Не удалось записать',true)}
    };
  }catch(e){console.error('v191 offer next',e)}finally{nextBusy=false}
}

function scheduleEnhance(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;enhanceClientCard();enhancePrograms()},45)}
document.addEventListener('click',e=>{
  const client=e.target.closest?.('[data-client]');if(client?.dataset.client)rememberClient(client.dataset.client);
  const status=e.target.closest?.('[data-event-status]');if(status){const [id,value]=String(status.dataset.eventStatus||'').split('|');if(id&&value==='completed')setTimeout(()=>offerNextBooking(id),450)}
  if(e.target.closest?.('[data-page="clients"]')||e.target.closest?.('[data-page="programs"]')||e.target.closest?.('#addPackage')||e.target.closest?.('[data-client-template]'))setTimeout(scheduleEnhance,120);
},true);
window.addEventListener('load',()=>{const main=$('#main');if(main)new MutationObserver(scheduleEnhance).observe(main,{childList:true});scheduleEnhance()});
window.addEventListener('pageshow',scheduleEnhance);
scheduleEnhance();
})();