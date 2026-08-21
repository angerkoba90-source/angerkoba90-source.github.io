(()=>{
'use strict';
if(window.__denisfitClientCardV189)return;
window.__denisfitClientCardV189=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
let lastClientId='';
let scheduled=false;
let loadingKey='';

function toast(text,error=false){
  let el=$('#dfccToast');
  if(!el){el=document.createElement('div');el.id='dfccToast';el.className='toast hidden';document.body.append(el)}
  el.textContent=text;el.className='toast'+(error?' err':'');el.classList.remove('hidden');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),2600);
}
function remember(id){
  if(!id)return;lastClientId=id;
  try{sessionStorage.setItem('df_v189_client',id)}catch{}
}
function currentClientId(){
  if(lastClientId)return lastClientId;
  try{return sessionStorage.getItem('df_v189_client')||sessionStorage.getItem('df_v188_client')||''}catch{return ''}
}
function dedupeOnlineToggle(){
  const save=$('#saveClientPlan');if(!save)return;
  const toggles=$$('label.online-toggle').filter(x=>/Онлайн ведение/i.test(x.textContent||''));
  if(toggles.length<=1)return;
  const checked=toggles.some(x=>$('input[type="checkbox"]',x)?.checked);
  const keep=toggles[0];const input=$('input[type="checkbox"]',keep);if(input&&checked)input.checked=true;
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
  let n=title.nextElementSibling;
  while(n&&n.id!=='deleteClient'){
    const next=n.nextElementSibling;
    if(n.id!=='dfClientTemplatesManager')n.remove();
    n=next;
  }
}
async function trainer(){
  const s=await db.auth.getSession();const u=s.data.session?.user;
  if(!u||u.is_anonymous)return null;
  const r=await db.from('user_roles').select('role').eq('user_id',u.id).maybeSingle();
  return r.data?.role==='trainer'?u:null;
}
async function loadPrograms(uid,cid){
  const q=await db.from('training_programs').select('id,name,description,created_at,source_kind,source_template_id').eq('trainer_id',uid).eq('client_id',cid).eq('active',true).order('created_at',{ascending:false});
  if(q.error)throw q.error;return q.data||[];
}
function renderManager(title,rows,uid,cid){
  clearLegacyProgramCards(title);
  let box=$('#dfClientTemplatesManager');
  if(!box){box=document.createElement('div');box.id='dfClientTemplatesManager';title.insertAdjacentElement('afterend',box)}
  box.className='card';
  box.innerHTML=rows.length?rows.map(x=>`<div class="template-exercise-row" data-client-program-row="${x.id}"><div><b>${esc(x.name)}</b><div class="small muted">${esc(x.description||'Шаблон тренировки')}</div></div><button type="button" class="btn inline danger" data-remove-client-program="${x.id}" data-program-name="${esc(x.name)}">Удалить</button></div>`).join(''):'<div class="empty">Шаблоны тренировок клиенту не назначены.</div>';
  $$('[data-remove-client-program]',box).forEach(btn=>btn.onclick=async()=>{
    const name=btn.dataset.programName||'шаблон';
    if(!confirm(`Удалить «${name}» у клиента? История уже выполненных тренировок останется.`))return;
    btn.disabled=true;
    const q=await db.from('training_programs').delete().eq('id',btn.dataset.removeClientProgram).eq('trainer_id',uid).eq('client_id',cid);
    if(q.error){btn.disabled=false;toast(q.error.message||'Не удалось удалить шаблон',true);return}
    toast('Шаблон удалён у клиента');
    const fresh=await loadPrograms(uid,cid);renderManager(title,fresh,uid,cid);
  });
}
async function enhanceClientCard(){
  if(!$('#saveClientPlan')||!$('#assignFromClient'))return;
  dedupeOnlineToggle();renameAddButton();
  const title=programsSection(),cid=currentClientId();if(!title||!cid)return;
  const key=cid+'|'+document.body.dataset.dfccVersion;if(loadingKey===key&&$('#dfClientTemplatesManager'))return;
  loadingKey=key;
  try{
    const u=await trainer();if(!u)return;
    const rows=await loadPrograms(u.id,cid);
    if(!document.contains(title)||currentClientId()!==cid)return;
    renderManager(title,rows,u.id,cid);
  }catch(e){console.error('client-card-v189',e)}
}
function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;enhanceClientCard()});
}
document.addEventListener('click',e=>{
  const c=e.target.closest?.('[data-client]');if(c?.dataset.client)remember(c.dataset.client);
  if(e.target.closest?.('#addTemplateFromClient')||e.target.closest?.('[data-client-template]'))setTimeout(schedule,120);
},true);
const obs=new MutationObserver(schedule);
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);window.addEventListener('load',schedule);
schedule();
})();
