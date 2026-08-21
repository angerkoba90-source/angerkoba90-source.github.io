(()=>{
'use strict';
if(window.__denisfitNutritionOffV203)return;
window.__denisfitNutritionOffV203=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let queued=false;
let saving=false;

function currentClientId(){
  try{
    return sessionStorage.getItem('df_v201_client')||sessionStorage.getItem('df_v200_client')||sessionStorage.getItem('df_v192_client')||sessionStorage.getItem('df_v191_client')||sessionStorage.getItem('df_v190_client')||sessionStorage.getItem('df_v188_client')||'';
  }catch{return ''}
}

function toast(text,error=false){
  const el=$('#toast');
  if(!el)return;
  el.textContent=text;
  el.className='toast'+(error?' err':'');
  el.classList.remove('hidden');
  clearTimeout(el._nutritionOffTimer);
  el._nutritionOffTimer=setTimeout(()=>el.classList.add('hidden'),2800);
}

function removeSection(title){
  if(!title?.isConnected)return;
  const next=title.nextElementSibling;
  if(next&&(next.classList.contains('card')||next.classList.contains('o181-macro-card')))next.remove();
  title.remove();
}

function normalizeCopy(){
  const copyRules=[
    ['Открывает клиенту отдельный раздел: 1–6 недели программы и БЖУ.','Открывает клиенту отдельный раздел с программой на 1–6 недель.'],
    ['Шесть недель программы, шаблоны упражнений и БЖУ клиентов.','Шесть недель программы и шаблоны упражнений.'],
    ['Шаблоны по неделям, программы клиентов и БЖУ.','Шаблоны по неделям и программы клиентов.'],
    ['Настроить недели и БЖУ','Настроить недели'],
    ['Недели и БЖУ','Недели'],
    ['Программа на 6 недель и БЖУ.','Программа на 6 недель.']
  ];
  $$('small,p').forEach(el=>{
    const text=(el.textContent||'').trim();
    const hit=copyRules.find(([from])=>text===from);
    if(hit)el.textContent=hit[1];
  });
}

function clean(){
  $$('#nav [data-page="meals"]').forEach(x=>x.remove());
  $$('.invite-benefits span').filter(x=>(x.textContent||'').trim()==='Питание').forEach(x=>x.remove());

  $$('.section-title').forEach(title=>{
    const text=(title.textContent||'').trim();
    if(text==='Питание'||text==='Питание · БЖУ')removeSection(title);
  });
  $$('.o181-macro-card').forEach(x=>x.remove());

  const save=$('#saveClientPlan');
  if(save)save.textContent='Сохранить ведение и кардио';

  normalizeCopy();

  const h1=$('#main h1');
  if(h1&&(h1.textContent||'').trim()==='Питание'){
    const home=$('#nav [data-page="home"]');
    if(home&&!home.dataset.nutritionRedirect){
      home.dataset.nutritionRedirect='1';
      setTimeout(()=>{delete home.dataset.nutritionRedirect;home.click()},0);
    }
  }
}

function scheduleClean(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;clean()});
}

async function saveClientPlanWithoutNutrition(){
  if(saving||!db)return;
  const clientId=currentClientId();
  if(!clientId)return toast('Не удалось определить клиента',true);
  const coaching=$('#clientCoachingMode'),weekly=$('#clientWeeklySessions'),cardioWeek=$('#clientCardioWeek'),cardioMinutes=$('#clientCardioMinutes');
  if(!coaching||!weekly||!cardioWeek||!cardioMinutes)return;
  const weeklySessions=Number(weekly.value||0),cardioSessions=Number(cardioWeek.value||0),minutes=Number(cardioMinutes.value||0);
  if(!Number.isInteger(weeklySessions)||weeklySessions<0||weeklySessions>14)return toast('Проверь количество тренировок в неделю',true);
  if(!Number.isInteger(cardioSessions)||cardioSessions<0||cardioSessions>14||!Number.isInteger(minutes)||minutes<0||minutes>300)return toast('Проверь кардио',true);
  saving=true;
  const btn=$('#saveClientPlan');if(btn){btn.disabled=true;btn.textContent='Сохраняю…'}
  try{
    const s=await db.auth.getSession();const trainerId=s?.data?.session?.user?.id;
    if(!trainerId)throw new Error('Сессия тренера истекла');
    const q=await db.from('trainer_clients').update({coaching_mode:coaching.value,weekly_sessions:weeklySessions,cardio_sessions_per_week:cardioSessions,cardio_minutes:minutes}).eq('trainer_id',trainerId).eq('client_id',clientId);
    if(q.error)throw q.error;
    toast('Настройки клиента сохранены');
  }catch(e){console.error('nutrition-off-v203 save',e);toast(e.message||'Не удалось сохранить настройки',true)}
  finally{saving=false;if(btn){btn.disabled=false;btn.textContent='Сохранить ведение и кардио'}}
}

document.addEventListener('click',e=>{
  const meals=e.target.closest?.('[data-page="meals"]');
  if(meals){e.preventDefault();e.stopImmediatePropagation();$('#nav [data-page="home"]')?.click();return}
  if(e.target.closest?.('#saveClientPlan')){
    e.preventDefault();e.stopImmediatePropagation();saveClientPlanWithoutNutrition();
  }
},true);

function attach(){
  clean();
  const targets=[$('#main'),$('#nav'),$('#auth')].filter(Boolean);
  targets.forEach(target=>new MutationObserver(scheduleClean).observe(target,{childList:true,subtree:true}));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.addEventListener('pageshow',scheduleClean);
})();