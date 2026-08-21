(()=>{
'use strict';
if(window.__denisfitClientProgramDeleteV200)return;
window.__denisfitClientProgramDeleteV200=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let activeClientId='';
let queued=false;
let busy=false;
let observer=null;

function rememberClient(id){
  if(!id)return;
  activeClientId=String(id);
  try{
    for(const key of ['df_v200_client','df_v192_client','df_v191_client','df_v190_client','df_v188_client'])sessionStorage.setItem(key,activeClientId);
  }catch{}
}

function currentClientId(){
  if(activeClientId)return activeClientId;
  try{
    return sessionStorage.getItem('df_v200_client')||sessionStorage.getItem('df_v192_client')||sessionStorage.getItem('df_v191_client')||sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v188_client')||'';
  }catch{return ''}
}

function toast(text,error=false){
  let el=$('#dfv200Toast');
  if(!el){el=document.createElement('div');el.id='dfv200Toast';document.body.append(el)}
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100001;max-width:calc(100vw - 32px);padding:12px 16px;border-radius:14px;font:700 13px/1.3 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:#fff;background:'+(error?'#351818':'#1b211b')+';border:1px solid '+(error?'#7e3c3c':'#3b4935')+';box-shadow:0 12px 30px rgba(0,0,0,.35)';
  clearTimeout(el._timer);el._timer=setTimeout(()=>el.remove(),2600);
}

function section(label){return $$('.section-title').find(x=>(x.textContent||'').trim()===label)||null}
function isClientCard(){return Boolean($('#saveClientPlan')&&$('#assignFromClient')&&section('Программы'))}

async function sessionUser(){
  const res=await db.auth.getSession();
  return res?.data?.session?.user||null;
}

async function loadPrograms(trainerId,clientId){
  const q=await db.from('training_programs').select('id,name,description,created_at,active').eq('trainer_id',trainerId).eq('client_id',clientId).eq('active',true).order('created_at',{ascending:false});
  if(q.error)throw q.error;
  return q.data||[];
}

async function removeProgram(trainerId,clientId,programId){
  const off=await db.from('training_programs').update({active:false,updated_at:new Date().toISOString()}).eq('id',programId).eq('trainer_id',trainerId).eq('client_id',clientId).select('id').maybeSingle();
  if(off.error)throw off.error;
  if(!off.data?.id)throw new Error('Программа клиента не найдена');

  const cancel=await db.from('assigned_workouts').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).eq('program_id',programId).eq('status','scheduled');
  if(cancel.error){
    await db.from('training_programs').update({active:true,updated_at:new Date().toISOString()}).eq('id',programId).eq('trainer_id',trainerId).eq('client_id',clientId);
    throw cancel.error;
  }
}

function render(rows,trainerId,clientId){
  const title=section('Программы');
  if(!title)return;
  let box=$('#dfv192ClientPrograms');
  if(!box){
    box=document.createElement('div');
    box.id='dfv192ClientPrograms';
    title.insertAdjacentElement('afterend',box);
  }
  box.dataset.v200='1';
  box.className='card dfv191-programs-card';
  box.innerHTML=`<div class="list-row"><div><b>Назначенные программы</b><div class="small muted">Можно удалить программу только у этого клиента.</div></div><span class="pill">${rows.length}</span></div>${rows.length?rows.map(x=>`<div class="dfv191-program-row" data-v200-program="${x.id}"><div><b>${esc(x.name)}</b><small>${esc(x.description||'Активная программа')}</small></div><button type="button" class="btn inline danger" data-v200-remove="${x.id}" data-name="${esc(x.name)}">Удалить у клиента</button></div>`).join(''):'<div class="empty">Активной программы нет.</div>'}`;

  $$('[data-v200-remove]',box).forEach(btn=>btn.onclick=async()=>{
    const name=btn.dataset.name||'программу';
    if(!confirm(`Удалить «${name}» у этого клиента? Будущие назначения отменятся. Выполненные тренировки и общий шаблон останутся.`))return;
    btn.disabled=true;
    const old=btn.textContent;
    btn.textContent='Удаляю…';
    try{
      await removeProgram(trainerId,clientId,btn.dataset.v200Remove);
      const fresh=await loadPrograms(trainerId,clientId);
      render(fresh,trainerId,clientId);
      toast('Программа удалена у клиента');
    }catch(e){
      console.error('client-program-delete-v200',e);
      btn.disabled=false;
      btn.textContent=old;
      toast(e.message||'Не удалось удалить программу',true);
    }
  });
}

async function enhance(){
  if(!isClientCard()||busy)return;
  const clientId=currentClientId();
  if(!clientId)return;
  const existing=$('#dfv192ClientPrograms');
  if(existing?.dataset.v200==='1')return;
  busy=true;
  try{
    const u=await sessionUser();
    if(!u||u.is_anonymous)return;
    const rows=await loadPrograms(u.id,clientId);
    if(!isClientCard()||currentClientId()!==clientId)return;
    render(rows,u.id,clientId);
  }catch(e){
    console.error('client-program-delete-v200 enhance',e);
    toast('Не удалось загрузить программы клиента',true);
  }finally{busy=false}
}

function schedule(){
  if(queued)return;
  queued=true;
  setTimeout(()=>{queued=false;enhance()},30);
}

function attach(){
  const main=$('#main');
  if(!main||observer)return;
  observer=new MutationObserver(schedule);
  observer.observe(main,{childList:true});
  schedule();
}

document.addEventListener('click',e=>{
  const client=e.target.closest?.('[data-client]');
  if(client?.dataset.client){
    rememberClient(client.dataset.client);
    setTimeout(schedule,20);
  }
  if(e.target.closest?.('[data-client-template]')||e.target.closest?.('#addTemplateFromClient'))setTimeout(schedule,160);
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.addEventListener('pageshow',()=>{attach();schedule()});
schedule();
})();
