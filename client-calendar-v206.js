(()=>{
'use strict';
if(window.__denisfitClientCalendarV206)return;
window.__denisfitClientCalendarV206=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const hm=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDay=d=>d.toLocaleDateString('ru-RU',{weekday:'short'}).replace('.','');
const fmtDate=d=>d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'}).replace('.','');
const typeLabel=t=>({personal:'Персональная',split:'Сплит',boxing_personal:'Бокс · ПТ',boxing_split:'Бокс · сплит'}[t]||t||'Тренировка');

let calendarOpen=false;
let weekStart=startOfWeek(new Date());
let selectedDate=ymd(new Date());
let busyRows=[];
let programs=[];
let link=null;
let packages=[];
let userId='';
let loadingCalendar=false;
let navQueued=false;
let mainObserver=null;
let navObserver=null;

function startOfWeek(value){
  const d=new Date(value);d.setHours(0,0,0,0);
  const shift=(d.getDay()+6)%7;d.setDate(d.getDate()-shift);return d;
}
function addDays(value,n){const d=new Date(value);d.setDate(d.getDate()+n);return d}
function isClientUi(){return ($('#roleBadge')?.textContent||'').trim().startsWith('КЛИЕНТ')}
function toast(text,error=false){
  let el=$('#dfcToast');
  if(!el){el=document.createElement('div');el.id='dfcToast';document.body.append(el)}
  el.textContent=text;el.className='dfc-toast show'+(error?' error':'');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600);
}
function styleOnce(){
  if($('#dfcStyle'))return;
  const s=document.createElement('style');s.id='dfcStyle';s.textContent=`
  .dfc-wrap{padding-bottom:96px}.dfc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.dfc-head h1{margin-bottom:4px}.dfc-sub{margin:0;color:#92999f}.dfc-week-nav{display:grid;grid-template-columns:44px 1fr 44px;gap:8px;align-items:center;margin:18px 0 10px}.dfc-week-nav button{height:42px;border:1px solid #34393f;background:#17191d;color:#fff;border-radius:13px;font-size:20px}.dfc-week-title{text-align:center;font-weight:800;font-size:14px}.dfc-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.dfc-day{border:1px solid #30353a;background:#15171a;color:#b7bdc2;border-radius:14px;min-height:60px;padding:7px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:700 11px/1.1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.dfc-day strong{font-size:16px;color:#fff}.dfc-day.active{border-color:#b7ff32;background:#1d241b;box-shadow:0 0 0 1px rgba(183,255,50,.15) inset}.dfc-day.today strong{color:#b7ff32}.dfc-day.has-own:after{content:'';width:5px;height:5px;border-radius:50%;background:#b7ff32}.dfc-section-title{margin:22px 0 10px;font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#d5d9dc}.dfc-own-list{display:grid;gap:9px}.dfc-own{width:100%;text-align:left;border:1px solid #343a3e;background:#171a1d;color:#fff;border-radius:16px;padding:13px 14px}.dfc-own.done{border-color:#35482e;background:#182018}.dfc-own-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.dfc-own b{font-size:14px}.dfc-own small{display:block;color:#949ca2;margin-top:4px}.dfc-pill{flex:none;padding:5px 8px;border-radius:999px;background:#252a2f;color:#cfd4d8;font-size:10px;font-weight:800}.dfc-own.done .dfc-pill{background:#2a3b23;color:#b7ff32}.dfc-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dfc-slot{height:46px;border-radius:13px;border:1px solid #343a3f;background:#17191d;color:#fff;font-weight:800}.dfc-slot.free{border-color:#46523f}.dfc-slot.free:active{transform:scale(.98);background:#20281e}.dfc-slot.busy,.dfc-slot.past{color:#676e74;background:#101214;border-color:#24282b}.dfc-slot.mine{border-color:#b7ff32;color:#b7ff32;background:#1b2219}.dfc-empty{padding:16px;border:1px dashed #343a3f;border-radius:15px;color:#8e969c;text-align:center}.dfc-help{margin:10px 0 0;color:#777f85;font-size:12px;line-height:1.4}.dfc-modal{position:fixed;inset:0;z-index:100100;display:none}.dfc-modal.open{display:block}.dfc-back{position:absolute;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center}.dfc-sheet{width:min(560px,100%);max-height:88vh;overflow:auto;background:#111417;border:1px solid #353b40;border-radius:24px 24px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -20px 50px rgba(0,0,0,.35)}.dfc-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.dfc-modal-head h2{margin:4px 0 0}.dfc-modal-head span{font-size:11px;font-weight:800;letter-spacing:.12em;color:#b7ff32}.dfc-close{border:0;background:#272c31;color:#fff;width:36px;height:36px;border-radius:50%;font-size:22px}.dfc-field{margin:12px 0}.dfc-field label{display:block;color:#a1a8ad;font-size:12px;font-weight:700;margin-bottom:6px}.dfc-field select{width:100%;min-height:48px;border-radius:13px;border:1px solid #343a3f;background:#17191d;color:#fff;padding:0 12px;font-size:15px}.dfc-book{width:100%;min-height:50px;border:0;border-radius:15px;background:#b7ff32;color:#10140d;font-weight:900;font-size:15px;margin-top:8px}.dfc-book[disabled]{opacity:.45}.dfc-diary{padding-bottom:110px}.dfc-diary-head{display:flex;gap:10px;align-items:flex-start;margin-bottom:16px}.dfc-back-btn{flex:none;width:42px;height:42px;border-radius:13px;border:1px solid #343a3f;background:#17191d;color:#fff;font-size:20px}.dfc-diary-head h1{margin:0 0 4px}.dfc-diary-head p{margin:0;color:#92999f}.dfc-ex{border:1px solid #30353a;background:#15181b;border-radius:17px;padding:12px;margin:10px 0}.dfc-ex-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.dfc-ex-head b{font-size:15px}.dfc-ex-head small{display:block;color:#8f979d;margin-top:4px}.dfc-add{width:34px;height:34px;flex:none;border-radius:11px;border:1px solid #3e474d;background:#202429;color:#fff;font-size:20px}.dfc-set-head,.dfc-set{display:grid;grid-template-columns:36px 1fr 34px;gap:8px;align-items:center}.dfc-set-head{margin-top:10px;color:#737b81;font-size:10px;font-weight:800;letter-spacing:.08em}.dfc-set{margin-top:6px}.dfc-set span{text-align:center;color:#a4abb0;font-size:12px;font-weight:800}.dfc-set input{height:38px;min-width:0;border:1px solid #343a3f;background:#0f1113;color:#fff;border-radius:10px;text-align:center;font-size:16px;font-weight:800}.dfc-rm{height:34px;border:1px solid #443233;background:#241617;color:#ff8c8c;border-radius:10px;font-size:17px}.dfc-actions{position:fixed;left:0;right:0;bottom:calc(66px + env(safe-area-inset-bottom));z-index:30;padding:10px max(14px,env(safe-area-inset-left)) 10px max(14px,env(safe-area-inset-right));background:linear-gradient(180deg,rgba(9,11,10,0),rgba(9,11,10,.94) 28%,#090b0a);display:grid;grid-template-columns:1fr 1fr;gap:8px}.dfc-actions button{min-height:48px;border-radius:14px;font-weight:900;font-size:13px}.dfc-save{border:1px solid #3b4248;background:#202429;color:#fff}.dfc-done{border:0;background:#b7ff32;color:#10140d}.dfc-readonly{padding:12px 14px;border:1px solid #38502f;background:#182117;color:#b7ff32;border-radius:14px;font-weight:800;margin:10px 0}.dfc-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:100200;max-width:calc(100vw - 30px);padding:12px 16px;border-radius:14px;color:#fff;background:#1b211b;border:1px solid #3b4935;font:700 13px/1.3 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;opacity:0;pointer-events:none;transition:.18s}.dfc-toast.show{opacity:1}.dfc-toast.error{background:#351818;border-color:#7e3c3c}.dfc-loading{display:grid;place-items:center;min-height:220px}.dfc-spinner{width:34px;height:34px;border-radius:50%;border:4px solid #283028;border-top-color:#b7ff32;animation:dfcs .75s linear infinite}@keyframes dfcs{to{transform:rotate(360deg)}}
  @media(max-width:370px){.dfc-week{gap:4px}.dfc-day{min-height:56px;font-size:10px}.dfc-day strong{font-size:14px}}
  `;document.head.append(s);
}

async function sessionUser(){const s=await db.auth.getSession();return s?.data?.session?.user||null}
async function loadContext(){
  const u=await sessionUser();if(!u)throw new Error('Сессия клиента не найдена');userId=u.id;
  const [linkQ,packQ,programQ]=await Promise.all([
    db.from('trainer_clients').select('trainer_id,fitness_enabled,boxing_enabled,status,created_at').eq('client_id',u.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle(),
    db.from('client_packages').select('id,training_type,package_name,total_sessions,used_sessions,status,expires_at').eq('client_id',u.id).neq('status','archived').order('created_at',{ascending:false}),
    db.rpc('client_calendar_programs')
  ]);
  if(linkQ.error)throw linkQ.error;if(packQ.error)throw packQ.error;if(programQ.error)throw programQ.error;
  link=linkQ.data||null;packages=packQ.data||[];programs=programQ.data||[];
  if(!link)throw new Error('Клиент не привязан к активному тренеру');
}
function allowedTypes(){
  const out=[];
  if(link?.fitness_enabled){out.push('personal','split')}
  if(link?.boxing_enabled){out.push('boxing_personal','boxing_split')}
  return out;
}
function remaining(type){
  const today=ymd(new Date());
  return packages.filter(p=>p.training_type===type&&p.status==='active'&&Number(p.used_sessions)<Number(p.total_sessions)&&(!p.expires_at||p.expires_at>=today)).reduce((s,p)=>s+Math.max(0,Number(p.total_sessions||0)-Number(p.used_sessions||0)),0);
}
function ensureNav(){
  const nav=$('#nav');if(!nav)return;
  if(!isClientUi()){nav.querySelector('[data-page="client-calendar"]')?.remove();return}
  let btn=nav.querySelector('[data-page="client-calendar"]');
  if(!btn){
    btn=document.createElement('button');btn.dataset.page='client-calendar';btn.innerHTML='<b>▦</b>Календарь';
    const home=nav.querySelector('[data-page="home"]');home?.insertAdjacentElement('afterend',btn)||nav.prepend(btn);
  }
  if(calendarOpen){nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn))}
}
function scheduleNav(){if(navQueued)return;navQueued=true;requestAnimationFrame(()=>{navQueued=false;ensureNav()})}
function localWeekRange(){const from=new Date(weekStart);from.setHours(0,0,0,0);const to=addDays(from,7);return{from,to}}
async function loadBusy(){const {from,to}=localWeekRange();const q=await db.rpc('client_calendar_busy',{p_from:from.toISOString(),p_to:to.toISOString()});if(q.error)throw q.error;busyRows=q.data||[]}
function ownForDate(date){return busyRows.filter(x=>x.is_mine&&ymd(new Date(x.starts_at))===date).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at))}
function overlapForSlot(start,end){return busyRows.find(x=>new Date(x.starts_at)<end&&new Date(x.ends_at)>start)||null}
function weekOwnDates(){return new Set(busyRows.filter(x=>x.is_mine).map(x=>ymd(new Date(x.starts_at))))}

function renderCalendarShell(){
  styleOnce();const main=$('#main');if(!main)return;
  main.innerHTML='<div class="dfc-wrap"><div class="dfc-head"><div><h1>Календарь</h1><p class="dfc-sub">Выбери день и свободное время для тренировки.</p></div></div><div id="dfcCalendarBody" class="dfc-loading"><div class="dfc-spinner"></div></div></div>';
}
async function openCalendar({keepContext=false}={}){
  if(loadingCalendar)return;calendarOpen=true;ensureNav();renderCalendarShell();loadingCalendar=true;
  try{if(!keepContext||!link)await loadContext();await loadBusy();renderCalendar()}
  catch(e){console.error('client-calendar-v206',e);const body=$('#dfcCalendarBody');if(body)body.innerHTML=`<div class="dfc-empty">${esc(e.message||'Не удалось загрузить календарь')}</div>`}
  finally{loadingCalendar=false}
}
function weekLabel(){const a=new Date(weekStart),b=addDays(a,6);return `${fmtDate(a)} — ${fmtDate(b)}`}
function renderCalendar(){
  const body=$('#dfcCalendarBody');if(!body)return;body.className='';
  const ownDates=weekOwnDates(),today=ymd(new Date());
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  if(!days.some(d=>ymd(d)===selectedDate))selectedDate=ymd(days[0]);
  const own=ownForDate(selectedDate);
  body.innerHTML=`<div class="dfc-week-nav"><button id="dfcPrevWeek" type="button">‹</button><div class="dfc-week-title">${esc(weekLabel())}</div><button id="dfcNextWeek" type="button">›</button></div>
    <div class="dfc-week">${days.map(d=>{const key=ymd(d);return `<button type="button" class="dfc-day ${key===selectedDate?'active':''} ${key===today?'today':''} ${ownDates.has(key)?'has-own':''}" data-dfc-day="${key}"><span>${esc(fmtDay(d))}</span><strong>${d.getDate()}</strong></button>`}).join('')}</div>
    <div class="dfc-section-title">${esc(new Date(selectedDate+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'}))}</div>
    ${own.length?`<div class="dfc-own-list">${own.map(x=>`<button type="button" class="dfc-own ${x.status==='completed'?'done':''}" data-dfc-own="${x.assignment_id||''}"><div class="dfc-own-top"><div><b>${esc(hm(new Date(x.starts_at)))} · ${esc(x.program_name||'Моя тренировка')}</b><small>${esc(x.day_label||'Тренировка')} · ${esc(typeLabel(x.training_type))}</small></div><span class="dfc-pill">${x.status==='completed'?'✓ выполнена':'моя запись'}</span></div></button>`).join('')}</div>`:''}
    <div class="dfc-section-title">Свободное время</div><div id="dfcSlots" class="dfc-slots"></div><p class="dfc-help">Занятые слоты показываются без данных других клиентов. Тренировка длится 55 минут.</p>`;
  $('#dfcPrevWeek').onclick=async()=>{weekStart=addDays(weekStart,-7);selectedDate=ymd(weekStart);await refreshWeek()};
  $('#dfcNextWeek').onclick=async()=>{weekStart=addDays(weekStart,7);selectedDate=ymd(weekStart);await refreshWeek()};
  $$('[data-dfc-day]').forEach(btn=>btn.onclick=()=>{selectedDate=btn.dataset.dfcDay;renderCalendar()});
  $$('[data-dfc-own]').forEach(btn=>btn.onclick=()=>{if(btn.dataset.dfcOwn)openDiary(btn.dataset.dfcOwn)});
  renderSlots();
}
async function refreshWeek(){const body=$('#dfcCalendarBody');if(body){body.className='dfc-loading';body.innerHTML='<div class="dfc-spinner"></div>'}try{await loadBusy();renderCalendar()}catch(e){console.error(e);if(body)body.innerHTML=`<div class="dfc-empty">${esc(e.message||'Не удалось обновить календарь')}</div>`}}
function renderSlots(){
  const box=$('#dfcSlots');if(!box)return;const now=new Date(),rows=[];
  for(let h=7;h<=22;h++)for(const m of [0,30]){if(h===22&&m===30)continue;const time=`${pad(h)}:${pad(m)}`;const start=new Date(`${selectedDate}T${time}:00`),end=new Date(start.getTime()+55*60000),hit=overlapForSlot(start,end);const exactMine=busyRows.find(x=>x.is_mine&&Math.abs(new Date(x.starts_at)-start)<60000);let cls='free',label=time,disabled='';let action=`data-dfc-slot="${time}"`;
    if(start<now&&!exactMine){cls='past';disabled='disabled';action=''}
    else if(exactMine){cls='mine';label=`${time} · моя`;action=exactMine.assignment_id?`data-dfc-open="${exactMine.assignment_id}"`:''}
    else if(hit){cls='busy';label=`${time} · занято`;disabled='disabled';action=''}
    rows.push(`<button type="button" class="dfc-slot ${cls}" ${disabled} ${action}>${esc(label)}</button>`)}
  box.innerHTML=rows.join('');
  $$('[data-dfc-slot]',box).forEach(btn=>btn.onclick=()=>openBooking(selectedDate,btn.dataset.dfcSlot));
  $$('[data-dfc-open]',box).forEach(btn=>btn.onclick=()=>openDiary(btn.dataset.dfcOpen));
}
function modal(html){let root=$('#dfcModal');if(!root){root=document.createElement('div');root.id='dfcModal';root.className='dfc-modal';document.body.append(root)}root.innerHTML=`<div class="dfc-back"><div class="dfc-sheet">${html}</div></div>`;root.classList.add('open');$('.dfc-back',root).onclick=e=>{if(e.target===e.currentTarget)closeModal()}}
function closeModal(){const root=$('#dfcModal');if(root){root.classList.remove('open');root.innerHTML=''}}
function uniquePrograms(){const map=new Map();for(const p of programs){const key=`${p.program_id}|${p.day_label}`;if(!map.has(key))map.set(key,p)}return [...map.values()]}
function openBooking(date,time){
  const choices=uniquePrograms(),types=allowedTypes();const when=new Date(`${date}T${time}:00`);
  modal(`<div class="dfc-modal-head"><div><span>САМОЗАПИСЬ</span><h2>${esc(when.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}))} · ${esc(time)}</h2></div><button id="dfcClose" class="dfc-close" type="button">×</button></div>
    ${choices.length?`<div class="dfc-field"><label>Шаблон тренировки</label><select id="dfcProgramPick">${choices.map((p,i)=>`<option value="${i}">${esc(p.program_name)} · ${esc(p.day_label||'Тренировка')}</option>`).join('')}</select></div>`:'<div class="dfc-empty">Тренер ещё не назначил тебе шаблон тренировки.</div>'}
    ${types.length?`<div class="dfc-field"><label>Тип тренировки</label><select id="dfcTypePick">${types.map(t=>{const left=remaining(t);return `<option value="${t}" ${left>0?'data-has-pack="1"':''}>${esc(typeLabel(t))} · ${left>0?`осталось ${left}`:'разовая'}</option>`}).join('')}</select></div>`:'<div class="dfc-empty">Для клиента не выбрано направление тренировок.</div>'}
    <button id="dfcBook" class="dfc-book" type="button" ${!choices.length||!types.length?'disabled':''}>Записаться</button><p class="dfc-help">Если подходящего блока нет, запись создастся как разовая. Оплату подтверждает тренер.</p>`);
  $('#dfcClose').onclick=closeModal;
  const typeSelect=$('#dfcTypePick');if(typeSelect){const best=[...typeSelect.options].find(o=>o.dataset.hasPack==='1');if(best)typeSelect.value=best.value}
  if($('#dfcBook'))$('#dfcBook').onclick=async()=>{
    const btn=$('#dfcBook'),choice=choices[Number($('#dfcProgramPick')?.value||0)],type=$('#dfcTypePick')?.value;if(!choice||!type)return;
    btn.disabled=true;btn.textContent='Записываю…';
    try{
      const q=await db.rpc('client_self_book_workout',{p_program_id:choice.program_id,p_day_label:choice.day_label||'Тренировка',p_starts_at:when.toISOString(),p_scheduled_date:date,p_training_type:type});
      if(q.error)throw q.error;closeModal();toast('Тренировка добавлена в календарь');await loadBusy();renderCalendar();
    }catch(e){console.error('client-calendar-v206 booking',e);btn.disabled=false;btn.textContent='Записаться';toast(e.message||'Не удалось записаться',true)}
  };
}

function setLine(index,value='',disabled=false){return `<div class="dfc-set"><span>${index}</span><input inputmode="decimal" autocomplete="off" placeholder="кг" value="${value===''?'':esc(value)}" ${disabled?'disabled':''}><button type="button" class="dfc-rm" ${disabled?'disabled':''}>×</button></div>`}
function bindExercise(card,disabled=false){
  const renumber=()=>$$('.dfc-set',card).forEach((row,i)=>{const n=row.querySelector('span');if(n)n.textContent=String(i+1)});
  $$('.dfc-rm',card).forEach(btn=>btn.onclick=()=>{const rows=$$('.dfc-set',card);if(disabled||rows.length<=1)return;btn.closest('.dfc-set')?.remove();renumber()});
  const add=$('.dfc-add',card);if(add)add.onclick=()=>{if(disabled)return;const rows=$$('.dfc-set',card),last=rows.at(-1)?.querySelector('input')?.value||'';const holder=$('.dfc-sets',card);holder?.insertAdjacentHTML('beforeend',setLine(rows.length+1,last,false));bindExercise(card,false);$$('.dfc-set input',card).at(-1)?.focus()};
}
async function openDiary(assignmentId){
  if(!assignmentId)return;calendarOpen=true;ensureNav();styleOnce();const main=$('#main');if(!main)return;main.innerHTML='<div class="dfc-loading"><div class="dfc-spinner"></div></div>';
  try{
    const q=await db.rpc('client_calendar_workout',{p_assignment_id:assignmentId});if(q.error)throw q.error;const d=q.data;if(!d)throw new Error('Дневник не найден');const done=Boolean(d.completed),items=Array.isArray(d.exercises)?d.exercises:[];
    const dateText=d.starts_at?new Date(d.starts_at).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}):String(d.scheduled_date||'');
    main.innerHTML=`<div class="dfc-diary"><div class="dfc-diary-head"><button id="dfcDiaryBack" class="dfc-back-btn" type="button">←</button><div><h1>${esc(d.program_name||'Тренировка')}</h1><p>${esc(d.day_label||'Тренировка')} · ${esc(dateText)}</p></div></div>${done?'<div class="dfc-readonly">✓ Тренировка завершена. Дневник сохранён в истории.</div>':''}${items.map((x,idx)=>{let weights=Array.isArray(x.weights)&&x.weights.length?x.weights:Array.from({length:Math.max(1,Number(x.target_sets)||3)},()=>x.target_weight??'');return `<section class="dfc-ex" data-dfc-ex="${x.exercise_id}"><div class="dfc-ex-head"><div><b>${idx+1}. ${esc(x.name||'Упражнение')}</b><small>${Number(x.target_sets)||weights.length} подхода${x.target_weight!=null?` · ориентир ${esc(x.target_weight)} кг`:''}${x.notes?` · ${esc(x.notes)}`:''}</small></div>${done?'':`<button type="button" class="dfc-add">＋</button>`}</div><div class="dfc-set-head"><span>№</span><span>ВЕС, КГ</span><span></span></div><div class="dfc-sets">${weights.map((w,i)=>setLine(i+1,w??'',done)).join('')}</div></section>`}).join('')||'<div class="dfc-empty">В этой тренировке нет упражнений.</div>'}${done?'':`<div class="dfc-actions"><button id="dfcSaveDiary" class="dfc-save" type="button">Сохранить</button><button id="dfcCompleteDiary" class="dfc-done" type="button">✓ Завершить</button></div>`}</div>`;
    $$('.dfc-ex',main).forEach(card=>bindExercise(card,done));$('#dfcDiaryBack').onclick=()=>openCalendar({keepContext:true});
    const collect=()=>{const payload=[];for(const card of $$('.dfc-ex',main)){const weights=[];for(const input of $$('.dfc-set input',card)){const raw=String(input.value||'').trim().replace(',','.');const value=Number(raw);if(raw===''||!Number.isFinite(value)||value<0){input.focus();throw new Error('Заполни вес во всех подходах. Для собственного веса поставь 0.')}weights.push(value)}payload.push({exercise_id:card.dataset.dfcEx,weights})}if(!payload.length)throw new Error('В тренировке нет упражнений');return payload};
    const save=async complete=>{let payload;try{payload=collect()}catch(e){return toast(e.message,true)}const b=complete?$('#dfcCompleteDiary'):$('#dfcSaveDiary');if(b){b.disabled=true;b.textContent=complete?'Завершаю…':'Сохраняю…'}try{const r=await db.rpc('client_save_calendar_workout',{p_assignment_id:assignmentId,p_sets:payload,p_complete:complete});if(r.error)throw r.error;toast(complete?'Тренировка завершена':'Дневник сохранён');if(complete){await loadBusy();return openDiary(assignmentId)}if(b){b.disabled=false;b.textContent='Сохранить'}}catch(e){console.error('client-calendar-v206 diary',e);if(b){b.disabled=false;b.textContent=complete?'✓ Завершить':'Сохранить'}toast(e.message||'Не удалось сохранить дневник',true)}};
    if($('#dfcSaveDiary'))$('#dfcSaveDiary').onclick=()=>save(false);if($('#dfcCompleteDiary'))$('#dfcCompleteDiary').onclick=()=>{if(confirm('Завершить тренировку? После этого дневник станет только для просмотра.'))save(true)};
  }catch(e){console.error('client-calendar-v206 diary open',e);main.innerHTML=`<div class="dfc-wrap"><button id="dfcDiaryBack" class="dfc-back-btn" type="button">←</button><div class="dfc-empty" style="margin-top:14px">${esc(e.message||'Не удалось открыть дневник')}</div></div>`;$('#dfcDiaryBack').onclick=()=>openCalendar({keepContext:true})}
}

document.addEventListener('click',e=>{
  const cal=e.target.closest?.('#nav [data-page="client-calendar"]');
  if(cal){e.preventDefault();e.stopImmediatePropagation();openCalendar();return}
  const other=e.target.closest?.('#nav [data-page]');if(other&&other.dataset.page!=='client-calendar')calendarOpen=false;
},true);

function attach(){
  styleOnce();ensureNav();
  const nav=$('#nav');if(nav&&!navObserver){navObserver=new MutationObserver(scheduleNav);navObserver.observe(nav,{childList:true,subtree:true})}
  const main=$('#main');if(main&&!mainObserver){mainObserver=new MutationObserver(scheduleNav);mainObserver.observe(main,{childList:true})}
  scheduleNav();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.addEventListener('pageshow',()=>{attach();scheduleNav()});
})();