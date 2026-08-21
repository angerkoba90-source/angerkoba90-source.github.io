(() => {
'use strict';

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(v===''||v==null)return null;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)?x:null};
let session=null,user=null,role=null,onlineAccess=false,lastClientId=null,busy=false;

function toast(msg,err=false){
  const el=$('toast');if(!el)return;
  el.textContent=msg;el.className='toast'+(err?' err':'');
  clearTimeout(el._onlineTimer);el._onlineTimer=setTimeout(()=>el.classList.add('hidden'),3200);
}
async function refreshIdentity(){
  const s=await db.auth.getSession();session=s.data.session||null;user=session?.user||null;role=null;onlineAccess=false;
  if(!user)return;
  const r=await db.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();
  role=r.data?.role||'client';
  if(role==='client'){
    const q=await db.from('trainer_clients').select('online_access').eq('client_id',user.id).eq('status','active').limit(1).maybeSingle();
    onlineAccess=Boolean(q.data?.online_access);
  }
}
function setNavActive(page){document.querySelectorAll('#nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page))}
function ensureOnlineNav(){
  const nav=$('nav');if(!nav||nav.classList.contains('hidden')||!role)return;
  const allowed=role==='trainer'||(role==='client'&&onlineAccess);
  const old=nav.querySelector('[data-page="online"]');
  if(!allowed){old?.remove();return}
  if(old)return;
  const b=document.createElement('button');b.dataset.page='online';b.innerHTML='<b>🌐</b>Онлайн';
  b.onclick=()=>{setNavActive('online');role==='trainer'?renderTrainerOnline():renderClientOnline()};
  const before=nav.querySelector('[data-page="library"]')||nav.querySelector('[data-page="progress"]')||nav.querySelector('[data-page="profile"]');
  before?nav.insertBefore(b,before):nav.appendChild(b);
}
function refreshCorePage(page){const b=document.querySelector(`#nav button[data-page="${page}"]`);if(b)b.click()}

async function createManualClient(){
  if(busy)return;
  const name=$('manualClientName')?.value.trim()||'',weekly=Number($('manualClientWeekly')?.value||0),online=Boolean($('manualClientOnline')?.checked);
  if(!name)return toast('Укажи имя клиента',true);
  if(!Number.isInteger(weekly)||weekly<0||weekly>14)return toast('Проверь количество тренировок в неделю',true);
  busy=true;const btn=$('saveManualClient');if(btn){btn.disabled=true;btn.textContent='Добавляю...'}
  try{
    const {data,error}=await db.functions.invoke('create-manual-client',{body:{name,weekly_sessions:weekly,online_access:online}});
    if(error)throw error;if(data?.error)throw new Error(data.error);
    toast('Клиент добавлен — уже можно записывать на тренировку');
    setTimeout(()=>refreshCorePage('clients'),150);
  }catch(e){toast(e?.message||'Не удалось добавить клиента',true);if(btn){btn.disabled=false;btn.textContent='Добавить клиента'}}
  finally{busy=false}
}
function decorateClientsPage(){
  if(role!=='trainer'||!$('main'))return;
  const h=$('main').querySelector('h1');if(!h||h.textContent.trim()!=='Клиенты'||$('manualClientForm'))return;
  const old=$('newDenisFitPass');if(!old)return;
  old.textContent='＋ Добавить клиента';old.id='newManualClient';
  if($('passCreator'))$('passCreator').remove();
  const form=document.createElement('div');form.id='manualClientForm';form.className='card manual-client-form hidden';
  form.innerHTML='<div class="invite-kicker">НОВЫЙ КЛИЕНТ</div><b>Добавить в базу</b><p class="small muted">Клиент сразу появится в расписании. Ссылку доступа отправишь позже из его карточки.</p><div class="field"><label class="label">Имя</label><input id="manualClientName" class="input" placeholder="Например: Марина" autocomplete="off"></div><div class="field"><label class="label">Тренировок в неделю</label><input id="manualClientWeekly" class="input" type="number" min="0" max="14" value="0"></div><label class="online-toggle"><input id="manualClientOnline" type="checkbox"><span><b>Онлайн ведение</b><small>Можно включить сейчас или позже в карточке клиента.</small></span></label><button id="saveManualClient" class="btn primary">Добавить клиента</button>';
  old.insertAdjacentElement('afterend',form);
  old.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();form.classList.toggle('hidden');setTimeout(()=>$('manualClientName')?.focus(),60)};
  $('saveManualClient').onclick=createManualClient;
  document.querySelectorAll('[data-client]').forEach(b=>{b.addEventListener('click',()=>{lastClientId=b.dataset.client},{capture:true})});
}

async function getCurrentClientRelation(clientId){
  if(!user||!clientId)return null;
  const q=await db.from('trainer_clients').select('online_access').eq('trainer_id',user.id).eq('client_id',clientId).maybeSingle();
  return q.data||null;
}
async function setClientOnlineAccess(clientId,enabled){
  const q=await db.from('trainer_clients').update({online_access:enabled}).eq('trainer_id',user.id).eq('client_id',clientId);
  if(q.error)throw q.error;
}
async function decorateClientDetail(){
  if(role!=='trainer'||!lastClientId||!$('saveClientPlan')||$('clientOnlineAccess'))return;
  const rel=await getCurrentClientRelation(lastClientId);if(!rel)return;
  const help=$('coachingModeHelp');if(!help)return;
  const label=document.createElement('label');label.className='online-toggle';
  label.innerHTML=`<input id="clientOnlineAccess" type="checkbox" ${rel.online_access?'checked':''}><span><b>🌐 Онлайн ведение</b><small>Открывает клиенту отдельный раздел: 1–6 недели программы и БЖУ.</small></span>`;
  help.before(label);
  $('clientOnlineAccess').onchange=async()=>{const input=$('clientOnlineAccess');input.disabled=true;try{await setClientOnlineAccess(lastClientId,input.checked);toast(input.checked?'Онлайн ведение включено':'Онлайн ведение выключено')}catch(e){input.checked=!input.checked;toast(e.message||'Не удалось изменить доступ',true)}finally{input.disabled=false}};
  const accessCode=$('clientAccessCode');if(accessCode)accessCode.classList.add('hidden');
  const hint=$('clientAccessHint');if(hint)hint.textContent='Ссылку можно отправить клиенту тогда, когда ты будешь готов открыть ему приложение.';
}
async function issueClientAccess(clientId,action='issue'){
  const s=await db.auth.getSession();const token=s.data.session?.access_token;if(!token)throw new Error('Сессия тренера истекла');
  const res=await fetch(`${SUPABASE_URL}/functions/v1/manage-client-access`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify({action,client_id:clientId})});
  const data=await res.json().catch(()=>({}));if(!res.ok||data.error)throw new Error(data.error||'Не удалось создать ссылку');return data;
}
async function shareOnlyLink(clientId){
  const access=await issueClientAccess(clientId,'issue');const text=`Твой личный кабинет DenisFit готов. Нажми на ссылку:\n${access.access_url}`;
  if(navigator.share)await navigator.share({title:'DenisFit',text});else{await navigator.clipboard.writeText(access.access_url);toast('Ссылка скопирована')}
}
document.addEventListener('click',async e=>{
  const clientBtn=e.target.closest?.('[data-client]');if(clientBtn?.dataset.client)lastClientId=clientBtn.dataset.client;
  if(role==='trainer'&&lastClientId&&e.target.closest?.('#shareClientAccess')){e.preventDefault();e.stopImmediatePropagation();try{await shareOnlyLink(lastClientId)}catch(err){if(err?.name!=='AbortError')toast(err.message||'Не удалось отправить ссылку',true)}}
  if(role==='trainer'&&lastClientId&&e.target.closest?.('#copyClientAccess')){e.preventDefault();e.stopImmediatePropagation();try{const a=await issueClientAccess(lastClientId,'issue');await navigator.clipboard.writeText(a.access_url);toast('Ссылка клиента скопирована')}catch(err){toast(err.message||'Не удалось скопировать ссылку',true)}}
},true);

async function listOnlineTemplates(){const q=await db.from('program_templates').select('id,name,description,online_week_number,created_at,template_exercises(id)').eq('trainer_id',user.id).eq('online_only',true).order('online_week_number').order('created_at',{ascending:false});if(q.error)throw q.error;return q.data||[]}
async function listExercises(){const q=await db.from('exercises').select('id,name,category,equipment,muscle_group').eq('trainer_id',user.id).eq('archived',false).order('name');if(q.error)throw q.error;return q.data||[]}
async function getTrainerClientsOnline(){const l=await db.from('trainer_clients').select('client_id,online_access,status').eq('trainer_id',user.id).eq('status','active');if(l.error)throw l.error;if(!l.data?.length)return[];const ids=l.data.map(x=>x.client_id),p=await db.from('profiles').select('id,full_name').in('id',ids);if(p.error)throw p.error;const lm=new Map(l.data.map(x=>[x.client_id,x]));return (p.data||[]).map(x=>({...x,...lm.get(x.id)})).sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'','ru'))}

async function renderTrainerOnline(){
  setNavActive('online');const main=$('main');if(!main)return;main.innerHTML='<div class="spinner"></div>';
  try{
    const [clients,templates]=await Promise.all([getTrainerClientsOnline(),listOnlineTemplates()]);const onlineClients=clients.filter(x=>x.online_access);
    main.innerHTML=`<h1>Онлайн ведение</h1><p class="sub">Шесть недель программы, шаблоны упражнений и БЖУ клиентов.</p><div class="card online-hero"><div class="list-row"><div><b>🏋️ Шаблоны по неделям</b><div class="small muted">Создавай программу отдельно для каждой недели.</div></div><span class="pill">6 недель</span></div><button id="newOnlineTemplate" class="btn primary">＋ Создать шаблон недели</button></div><div id="onlineTemplateEditor"></div>${Array.from({length:6},(_,i)=>{const w=i+1,rows=templates.filter(t=>Number(t.online_week_number)===w);return `<div class="online-template-week"><div class="online-template-week-head"><h3>${w} неделя</h3><button class="btn inline secondary" data-new-online-week="${w}">＋ Шаблон</button></div><div class="online-template-list">${rows.length?rows.map(t=>`<div class="card"><div class="list-row"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.description||'Онлайн-шаблон')} · ${t.template_exercises?.length||0} упр.</div></div><span class="pill">Неделя ${w}</span></div><button class="btn secondary" data-edit-online-template="${t.id}">Редактировать упражнения</button><button class="btn danger" data-delete-online-template="${t.id}">Удалить</button></div>`).join(''):'<div class="online-empty-week">Шаблонов пока нет.</div>'}</div></div>`}).join('')}<div class="section-title">Клиенты онлайн</div><div class="client-simple-list">${onlineClients.length?onlineClients.map(c=>`<button class="client-btn" data-online-client="${c.id}"><div class="online-client-row"><div><b>🌐 ${esc(c.full_name||'Клиент')}</b><div class="small muted">Настроить недели и БЖУ</div></div><span>→</span></div></button>`).join(''):'<div class="empty">Включи «Онлайн ведение» в карточке нужного клиента.</div>'}</div>`;
    $('newOnlineTemplate').onclick=()=>renderOnlineTemplateCreate(1);document.querySelectorAll('[data-new-online-week]').forEach(b=>b.onclick=()=>renderOnlineTemplateCreate(Number(b.dataset.newOnlineWeek)));document.querySelectorAll('[data-edit-online-template]').forEach(b=>b.onclick=()=>renderOnlineTemplateEditor(b.dataset.editOnlineTemplate));document.querySelectorAll('[data-delete-online-template]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить шаблон? Уже назначенные клиентам программы останутся.'))return;const id=b.dataset.deleteOnlineTemplate;const d=await db.from('template_exercises').delete().eq('template_id',id);if(d.error)return toast(d.error.message,true);const q=await db.from('program_templates').delete().eq('id',id).eq('trainer_id',user.id);if(q.error)return toast(q.error.message,true);toast('Шаблон удалён');renderTrainerOnline()});document.querySelectorAll('[data-online-client]').forEach(b=>b.onclick=()=>renderTrainerOnlineClient(b.dataset.onlineClient));
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
function renderOnlineTemplateCreate(week){const target=$('onlineTemplateEditor');if(!target)return;target.innerHTML=`<div class="card template-create-card"><div class="invite-kicker">ОНЛАЙН · НЕДЕЛЯ ${week}</div><b>Новый шаблон</b><div class="field"><label class="label">Неделя</label><select id="onlineTemplateWeek" class="input">${Array.from({length:6},(_,i)=>`<option value="${i+1}" ${i+1===week?'selected':''}>${i+1} неделя</option>`).join('')}</select></div><div class="field"><label class="label">Название</label><input id="onlineTemplateName" class="input" placeholder="Например: Неделя 1 · База"></div><div class="field"><label class="label">Описание</label><input id="onlineTemplateDesc" class="input" placeholder="Цель недели"></div><button id="createOnlineTemplate" class="btn primary">Создать и добавить упражнения</button></div>`;target.scrollIntoView({behavior:'smooth',block:'start'});$('createOnlineTemplate').onclick=async()=>{const name=$('onlineTemplateName').value.trim(),w=Number($('onlineTemplateWeek').value);if(!name)return toast('Введите название',true);const q=await db.from('program_templates').insert({trainer_id:user.id,name,description:$('onlineTemplateDesc').value.trim(),online_only:true,online_week_number:w}).select('id').single();if(q.error)return toast(q.error.message,true);renderOnlineTemplateEditor(q.data.id)}}
async function renderOnlineTemplateEditor(templateId){
  const target=$('onlineTemplateEditor');if(!target)return;target.innerHTML='<div class="spinner"></div>';
  try{
    const [tQ,iQ,ex]=await Promise.all([db.from('program_templates').select('id,name,description,online_week_number').eq('id',templateId).eq('trainer_id',user.id).single(),db.from('template_exercises').select('id,exercise_id,sort_order,target_sets,target_reps,target_rpe,notes,exercises(name,category,equipment)').eq('template_id',templateId).order('sort_order'),listExercises()]);if(tQ.error)throw tQ.error;if(iQ.error)throw iQ.error;const t=tQ.data,items=iQ.data||[];
    target.innerHTML=`<div class="card"><div class="list-row"><div><b>${esc(t.name)}</b><div class="small muted">Неделя ${t.online_week_number}</div></div><span class="pill">${items.length} упр.</span></div><div class="field"><label class="label">Упражнение</label><select id="onlineExercise" class="input">${ex.map(x=>`<option value="${x.id}">${esc(x.name)}${x.muscle_group?` · ${esc(x.muscle_group)}`:''}</option>`).join('')}</select></div><div class="row"><div class="field"><label class="label">Подходы</label><input id="onlineSets" class="input" type="number" min="1" value="3"></div><div class="field"><label class="label">Повторы</label><input id="onlineReps" class="input" value="10–12"></div></div><div class="field"><label class="label">Комментарий</label><input id="onlineNotes" class="input" placeholder="Техника / темп / диапазон"></div><button id="addOnlineExercise" class="btn primary">＋ Добавить упражнение</button><div class="section-title">Упражнения недели</div>${items.length?items.map((it,idx)=>`<div class="template-exercise-row"><div><b>${idx+1}. ${esc(it.exercises?.name||'Упражнение')}</b><div class="small muted">${it.target_sets||1} подх. · ${esc(it.target_reps||'—')}</div></div><button class="btn inline danger" data-remove-online-ex="${it.id}">Удалить</button></div>`).join(''):'<div class="empty">Добавь первое упражнение.</div>'}<button id="finishOnlineTemplate" class="btn secondary">Готово</button></div>`;
    $('addOnlineExercise').onclick=async()=>{const sets=Number($('onlineSets').value),exercise=$('onlineExercise').value;if(!exercise||!Number.isInteger(sets)||sets<1)return toast('Проверь упражнение и подходы',true);const q=await db.from('template_exercises').insert({template_id:templateId,exercise_id:exercise,sort_order:items.length+1,target_sets:sets,target_reps:$('onlineReps').value.trim()||'10–12',notes:$('onlineNotes').value.trim()||null});if(q.error)return toast(q.error.message,true);renderOnlineTemplateEditor(templateId)};document.querySelectorAll('[data-remove-online-ex]').forEach(b=>b.onclick=async()=>{const q=await db.from('template_exercises').delete().eq('id',b.dataset.removeOnlineEx);if(q.error)return toast(q.error.message,true);renderOnlineTemplateEditor(templateId)});$('finishOnlineTemplate').onclick=renderTrainerOnline;
  }catch(e){target.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
async function renderTrainerOnlineClient(clientId){
  const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{
    const clients=await getTrainerClientsOnline(),c=clients.find(x=>x.id===clientId);if(!c)return renderTrainerOnline();const [templates,pQ,nQ]=await Promise.all([listOnlineTemplates(),db.from('training_programs').select('id,name,online_week_number').eq('trainer_id',user.id).eq('client_id',clientId).eq('online_only',true).eq('active',true).order('created_at',{ascending:false}),db.from('client_nutrition_targets').select('protein_g,fat_g,carbs_g').eq('trainer_id',user.id).eq('client_id',clientId).maybeSingle()]);if(pQ.error)throw pQ.error;if(nQ.error)throw nQ.error;const programs=pQ.data||[],macro=nQ.data||{};
    main.innerHTML=`<button id="backOnlineTrainer" class="btn inline ghost">← Онлайн ведение</button><h1>${esc(c.full_name||'Клиент')}</h1><p class="sub">Онлайн-программа на 6 недель.</p><div class="section-title">Питание · БЖУ</div><div class="card"><div class="online-macro-grid edit"><label>Белки, г<input id="onlineProtein" class="input" inputmode="decimal" value="${macro.protein_g??''}"></label><label>Жиры, г<input id="onlineFat" class="input" inputmode="decimal" value="${macro.fat_g??''}"></label><label>Углеводы, г<input id="onlineCarbs" class="input" inputmode="decimal" value="${macro.carbs_g??''}"></label></div><button id="saveOnlineMacros" class="btn primary">Сохранить БЖУ</button></div><div class="section-title">Моя программа тренировки</div>${Array.from({length:6},(_,i)=>{const w=i+1,p=programs.find(x=>Number(x.online_week_number)===w),rows=templates.filter(x=>Number(x.online_week_number)===w);return `<div class="card"><div class="list-row"><div><b>${w} неделя</b><div class="small muted">${p?`Назначено: ${esc(p.name)}`:'Программа ещё не назначена'}</div></div><span class="online-status ${p?'ready':''}">${p?'готово':'не задано'}</span></div><div class="field"><label class="label">Шаблон недели</label><select id="onlineAssignTemplate${w}" class="input"><option value="">Выбери шаблон</option>${rows.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div><button class="btn ${p?'secondary':'primary'}" data-assign-online-week="${w}">${p?'Заменить шаблон':'Добавить шаблон'}</button></div>`}).join('')}`;
    $('backOnlineTrainer').onclick=renderTrainerOnline;$('saveOnlineMacros').onclick=async()=>{const vals={protein_g:num($('onlineProtein').value)||0,fat_g:num($('onlineFat').value)||0,carbs_g:num($('onlineCarbs').value)||0};if(Object.values(vals).some(v=>v<0))return toast('БЖУ не могут быть отрицательными',true);const q=await db.from('client_nutrition_targets').upsert({trainer_id:user.id,client_id:clientId,...vals,updated_at:new Date().toISOString()},{onConflict:'trainer_id,client_id'});if(q.error)return toast(q.error.message,true);toast('БЖУ сохранены')};document.querySelectorAll('[data-assign-online-week]').forEach(b=>b.onclick=async()=>{const w=Number(b.dataset.assignOnlineWeek),tid=$(`onlineAssignTemplate${w}`).value;if(!tid)return toast('Выбери шаблон недели',true);const q=await db.rpc('assign_online_template',{p_template_id:tid,p_client_id:clientId});if(q.error)return toast(q.error.message,true);toast(`Неделя ${w} назначена`);renderTrainerOnlineClient(clientId)});
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}

async function renderClientOnline(){
  setNavActive('online');const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{
    await refreshIdentity();if(!onlineAccess){ensureOnlineNav();main.innerHTML='<h1>Онлайн ведение</h1><div class="empty">Онлайн-доступ не включён тренером.</div>';return}
    const [pQ,nQ]=await Promise.all([db.from('training_programs').select('id,name,description,online_week_number,created_at').eq('client_id',user.id).eq('online_only',true).eq('active',true).order('created_at',{ascending:false}),db.from('client_nutrition_targets').select('protein_g,fat_g,carbs_g').eq('client_id',user.id).limit(1).maybeSingle()]);if(pQ.error)throw pQ.error;if(nQ.error)throw nQ.error;const programs=pQ.data||[],macro=nQ.data||{};
    main.innerHTML=`<h1>Онлайн ведение</h1><p class="sub">Твоя программа и питание от тренера.</p><div class="card online-hero"><b>🏋️ Моя программа тренировки</b><p class="small muted">Открывай неделю и заноси фактический вес и количество подходов.</p></div><div class="online-week-grid">${Array.from({length:6},(_,i)=>{const w=i+1,p=programs.find(x=>Number(x.online_week_number)===w);return `<button class="online-week-card ${p?'ready':''}" data-client-online-week="${w}"><b>${w} неделя</b><small>${p?esc(p.name):'Тренер пока не добавил программу'}</small><span class="pill">${p?'Открыть':'Ожидает'}</span></button>`}).join('')}</div><div class="section-title">Питание</div><div class="card"><div class="online-macro-grid"><div class="online-macro"><span>Белки</span><strong>${Number(macro.protein_g||0)}</strong><small>г</small></div><div class="online-macro"><span>Жиры</span><strong>${Number(macro.fat_g||0)}</strong><small>г</small></div><div class="online-macro"><span>Углеводы</span><strong>${Number(macro.carbs_g||0)}</strong><small>г</small></div></div></div>`;document.querySelectorAll('[data-client-online-week]').forEach(b=>b.onclick=()=>renderClientOnlineWeek(Number(b.dataset.clientOnlineWeek)));
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
async function renderClientOnlineWeek(week){
  const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{
    const pQ=await db.from('training_programs').select('id,name,description,online_week_number').eq('client_id',user.id).eq('online_only',true).eq('active',true).eq('online_week_number',week).order('created_at',{ascending:false}).limit(1).maybeSingle();if(pQ.error)throw pQ.error;const program=pQ.data;if(!program){main.innerHTML=`<button id="backOnlineClient" class="btn inline ghost">← Онлайн ведение</button><h1>${week} неделя</h1><div class="empty">Тренер пока не добавил программу на эту неделю.</div>`;$('backOnlineClient').onclick=renderClientOnline;return}
    const note=`Онлайн · Неделя ${week}`;const [eQ,sQ]=await Promise.all([db.from('program_exercises').select('id,exercise_id,sort_order,target_sets,target_reps,target_rpe,notes,exercises(name,category,equipment)').eq('program_id',program.id).order('sort_order'),db.from('workout_sessions').select('id').eq('client_id',user.id).eq('program_id',program.id).eq('notes',note).order('created_at',{ascending:false}).limit(1).maybeSingle()]);if(eQ.error)throw eQ.error;if(sQ.error)throw sQ.error;let workout=sQ.data||null,sets=[];if(workout){const q=await db.from('workout_sets').select('exercise_id,set_number,weight').eq('session_id',workout.id).order('set_number');if(q.error)throw q.error;sets=q.data||[]}const items=eQ.data||[];
    main.innerHTML=`<button id="backOnlineClient" class="btn inline ghost">← Онлайн ведение</button><h1>${week} неделя</h1><p class="sub">${esc(program.name)}${program.description?` · ${esc(program.description)}`:''}</p>${items.length?items.map((it,idx)=>{const old=sets.filter(x=>x.exercise_id===it.exercise_id),weight=old.length?Math.max(...old.map(x=>Number(x.weight||0))):'';return `<div class="card online-plan-exercise" data-online-log data-exercise="${it.exercise_id}"><div class="list-row"><div><b>${idx+1}. ${esc(it.exercises?.name||'Упражнение')}</b><div class="small muted">План: ${it.target_sets||'—'} подх. · ${esc(it.target_reps||'—')}${it.target_rpe?` · RPE ${it.target_rpe}`:''}</div></div><span class="pill">${esc(it.exercises?.category||'')}</span></div>${it.notes?`<p class="small muted">${esc(it.notes)}</p>`:''}<div class="row online-actual"><div class="field"><label class="label">Мой вес, кг</label><input class="input online-weight" inputmode="decimal" value="${weight}" placeholder="0"></div><div class="field"><label class="label">Подходы</label><input class="input online-sets" inputmode="numeric" value="${old.length||it.target_sets||3}" placeholder="3"></div></div></div>`}).join(''):'<div class="empty">В этой неделе пока нет упражнений.</div>'}<button id="saveOnlineWeek" class="btn primary">Сохранить веса и подходы</button>`;$('backOnlineClient').onclick=renderClientOnline;$('saveOnlineWeek').onclick=async()=>{const rows=Array.from(document.querySelectorAll('[data-online-log]')).map(el=>({exercise_id:el.dataset.exercise,weight:num(el.querySelector('.online-weight').value),sets:num(el.querySelector('.online-sets').value)}));if(!rows.length)return toast('В неделе пока нет упражнений',true);for(const r of rows){if(r.weight==null||r.weight<0)return toast('Проверь вес',true);if(r.sets==null||!Number.isInteger(r.sets)||r.sets<=0)return toast('Проверь подходы',true)}if(!workout){const q=await db.from('workout_sessions').insert({client_id:user.id,program_id:program.id,performed_at:new Date().toISOString(),notes:note}).select('id').single();if(q.error)return toast(q.error.message,true);workout=q.data}else{const d=await db.from('workout_sets').delete().eq('session_id',workout.id);if(d.error)return toast(d.error.message,true)}const ins=[];for(const r of rows)for(let i=1;i<=r.sets;i++)ins.push({session_id:workout.id,exercise_id:r.exercise_id,set_number:i,weight:r.weight,reps:null,rpe:null});if(ins.length){const q=await db.from('workout_sets').insert(ins);if(q.error)return toast(q.error.message,true)}toast('Неделя сохранена')};
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}

const obs=new MutationObserver(()=>{ensureOnlineNav();decorateClientsPage();decorateClientDetail()});
async function boot(){await refreshIdentity();ensureOnlineNav();decorateClientsPage();decorateClientDetail();const app=$('app'),nav=$('nav'),main=$('main');if(app)obs.observe(app,{childList:true,subtree:true});if(nav)obs.observe(nav,{childList:true,subtree:true});if(main)obs.observe(main,{childList:true,subtree:true})}
window.addEventListener('load',()=>setTimeout(boot,120));db.auth.onAuthStateChange(()=>setTimeout(async()=>{await refreshIdentity();ensureOnlineNav()},120));
})();
