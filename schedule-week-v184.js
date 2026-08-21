(() => {
'use strict';
const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const DAY=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const monthFmt=new Intl.DateTimeFormat('ru-RU',{month:'long'});
let renderToken=0;

function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mondayOf(key){const d=new Date(`${key}T12:00:00`);const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return d}
function sameDay(a,b){return dateKey(a)===dateKey(b)}
function weekLabel(start){const end=new Date(start);end.setDate(end.getDate()+6);const m1=monthFmt.format(start),m2=monthFmt.format(end);return start.getMonth()===end.getMonth()?`${start.getDate()}–${end.getDate()} ${m1}`:`${start.getDate()} ${m1} – ${end.getDate()} ${m2}`}

async function countsForWeek(start){
  const s=await db.auth.getSession();const uid=s.data.session?.user?.id;if(!uid)return new Map();
  const end=new Date(start);end.setDate(end.getDate()+7);
  const q=await db.from('schedule_events').select('starts_at,status').eq('trainer_id',uid).gte('starts_at',new Date(`${dateKey(start)}T00:00:00`).toISOString()).lt('starts_at',new Date(`${dateKey(end)}T00:00:00`).toISOString());
  if(q.error)return new Map();
  const map=new Map();for(const e of q.data||[]){if(e.status==='cancelled')continue;const k=dateKey(new Date(e.starts_at));map.set(k,(map.get(k)||0)+1)}return map;
}

async function injectWeek(){
  const input=document.getElementById('scheduleDate'),bar=document.querySelector('.schedule-datebar');
  if(!input||!bar)return;
  const key=input.value;if(!key)return;
  const token=++renderToken;
  let shell=document.getElementById('scheduleWeekOverview');
  if(!shell){shell=document.createElement('section');shell.id='scheduleWeekOverview';shell.className='schedule-week-overview';bar.insertAdjacentElement('afterend',shell)}
  shell.innerHTML='<div class="schedule-week-loading">Неделя…</div>';
  const start=mondayOf(key),counts=await countsForWeek(start);if(token!==renderToken||!document.getElementById('scheduleDate'))return;
  const today=new Date();
  const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const k=dateKey(d),selected=k===key,isToday=sameDay(d,today),count=counts.get(k)||0;return `<button class="schedule-week-day${selected?' selected':''}${isToday?' today':''}" data-week-date="${k}" aria-label="${DAY[i]}, ${d.getDate()}"><span class="schedule-week-name">${DAY[i]}</span><strong>${d.getDate()}</strong>${count?`<span class="schedule-week-count">${count}</span>`:'<span class="schedule-week-count empty">·</span>'}</button>`}).join('');
  shell.innerHTML=`<div class="schedule-week-head"><span>Неделя</span><b>${weekLabel(start)}</b></div><div class="schedule-week-grid">${days}</div>`;
  shell.querySelectorAll('[data-week-date]').forEach(btn=>btn.onclick=()=>{const current=document.getElementById('scheduleDate');if(!current||current.value===btn.dataset.weekDate)return;current.value=btn.dataset.weekDate;current.dispatchEvent(new Event('change',{bubbles:true}))});
}

const observer=new MutationObserver(()=>{if(document.getElementById('scheduleDate'))queueMicrotask(injectWeek)});
window.addEventListener('load',()=>{const main=document.getElementById('main');if(main)observer.observe(main,{childList:true,subtree:true});setTimeout(injectWeek,200)});
document.addEventListener('change',e=>{if(e.target?.id==='scheduleDate')setTimeout(injectWeek,40)});
})();
