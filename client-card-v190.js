(()=>{
'use strict';
if(window.__denisfitClientCardV190)return;
window.__denisfitClientCardV190=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lastClientId='';
let scheduled=false;
let loadingClient='';

function toast(text,error=false){
  let el=$('#dfccToast');
  if(!el){el=document.createElement('div');el.id='dfccToast';el.className='toast hidden';document.body.append(el)}
  el.textContent=text;el.className='toast'+(error?' err':'');el.classList.remove('hidden');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2600);
}
function remember(id){
  if(!id)return;lastClientId=id;
  try{sessionStorage.setItem('df_v190_client',id)}catch{}
}
function currentClientId(){
  if(lastClientId)return lastClientId;
  try{return sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v189_client')||sessionStorage.getItem('df_v188_client')||''}catch{return ''}
}
function dedupeOnlineToggle(){
  if(!$('#saveClientPlan'))return;
  const toggles=$$('label.online-toggle').filter(x=>/Онлайн ведение/i.test(x.textContent||''));
  if(toggles.length<=1)return;
  const checked=toggles.some(x=>$('input[type="checkbox"]',x)?.checked);
  const keep=toggles[0],input=$('input[type="checkbox"]',keep);
  if(input&&checked)input.checked=true;
  toggles.slice(1).forEach(x=>x.remove());
}
function renameAddButton(){
  const b=$('#addTemplateFromClient');if(b)b.textContent='＋ Добавить шаблон тренировки';
}
function programsSection(){
  return $$('.section-title').find(x=>x.textContent.trim()==='Программы')||null;
}
function clearLegacyProgramCards(title){
  if(!title)return;
  let node=title.nextElementSibling;
  while(node&&node.id!=='deleteClient'){
    const next=node.nextElementSibling;
    if(node.id!=='dfClientTemplatesManager')node.remove();
    node=next;
  }
}
async function trainer(){
  const s=await db.auth.getSession(),u=s.data.session?.user;
  if(!u||u.is_anonymous)return null;
  const r=await db.from('user_roles').select('role').eq('user_id',u.id).maybeSingle();
  return r.data?.role==='trainer'?u:null;
}
async function loadPrograms(uid,cid){
  const q=await db.from('training_programs').select('id,name,description,created_at,source_kind,source_template_id').eq('trainer_id',uid).eq('client_id',cid).eq('active',true).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
async function removeProgramForClient(uid,cid,programId){
  const off=await db.from('training_programs').update({active:false}).eq('id',programId).eq('trainer_id',uid).eq('client_id',cid).select('id').maybeSingle();
  if(off.error)throw off.error;
  if(!off.data?.id)throw new Error('Шаблон у клиента не найден');
  const cancel=await db.from('assigned_workouts').update({status:'cancelled'}).eq('trainer_id',uid).eq('client_id',cid).eq('program_id',programId).eq('status','scheduled');
  if(cancel.error){
    await db.from('training_programs').update({active:true}).eq('id',programId).eq('trainer_id',uid).eq('client_id',cid);
    throw cancel.error;
  }
}
function renderManager(title,rows,uid,cid){
  clearLegacyProgramCards(title);
  let box=$('#dfClientTemplatesManager');
  if(!box){box=document.createElement('div');box.id='dfClientTemplatesManager';title.insertAdjacentElement('afterend',box)}
  box.className='card';
  box.innerHTML=rows.length?rows.map(x=>`<div class="template-exercise-row" data-client-program-row="${x.id}"><div><b>${esc(x.name)}</b><div class="small muted">${esc(x.description||'Шаблон тренировки')}</div></div><button type="button" class="btn inline danger" data-remove-client-program="${x.id}" data-program-name="${esc(x.name)}">Удалить у клиента</button></div>`).join(''):'<div class="empty">Шаблоны тренировок клиенту не назначены.</div>';
  $$('[data-remove-client-program]',box).forEach(btn=>btn.onclick=async()=>{
    const name=btn.dataset.programName||'шаблон';
    if(!confirm(`Удалить «${name}» у клиента? Будущие назначения этого шаблона отменятся. Выполненные тренировки и общий шаблон останутся.`))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{
      await removeProgramForClient(uid,cid,btn.dataset.removeClientProgram);
      toast('Шаблон удалён у клиента');
      const fresh=await loadPrograms(uid,cid);renderManager(title,fresh,uid,cid);
    }catch(error){
      console.error('client-card-v190 remove',error);
      btn.disabled=false;btn.textContent='Удалить у клиента';
      toast(error.message||'Не удалось удалить шаблон',true);
    }
  });
}
async function enhanceClientCard(){
  if(!$('#saveClientPlan')||!$('#assignFromClient'))return;
  dedupeOnlineToggle();renameAddButton();
  const title=programsSection(),cid=currentClientId();if(!title||!cid)return;
  if(loadingClient===cid&&!$('#dfClientTemplatesManager'))return;
  if($('#dfClientTemplatesManager'))return;
  loadingClient=cid;
  try{
    const u=await trainer();if(!u)return;
    const rows=await loadPrograms(u.id,cid);
    if(!document.contains(title)||currentClientId()!==cid)return;
    renderManager(title,rows,u.id,cid);
  }catch(e){console.error('client-card-v190',e)}finally{loadingClient=''}
}
function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;enhanceClientCard()});
}
document.addEventListener('click',e=>{
  const c=e.target.closest?.('[data-client]');if(c?.dataset.client)remember(c.dataset.client);
  if(e.target.closest?.('#addTemplateFromClient')||e.target.closest?.('[data-client-template]'))setTimeout(schedule,160);
},true);
window.addEventListener('load',()=>{
  const main=document.getElementById('main');
  if(main)new MutationObserver(schedule).observe(main,{childList:true});
  schedule();
});
window.addEventListener('pageshow',schedule);
schedule();
})();
