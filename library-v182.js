(() => {
'use strict';

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,role='client',libraryBusy=false;

function toast(msg,err=false){const el=$('toast');if(!el)return;el.textContent=msg;el.className='toast'+(err?' err':'');clearTimeout(el._libTimer);el._libTimer=setTimeout(()=>el.classList.add('hidden'),3200)}
async function identity(){const s=await db.auth.getSession();user=s.data.session?.user||null;if(!user)return null;const r=await db.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();role=r.data?.role||'client';return user}
async function getExercises(){const q=await db.from('exercises').select('*').eq('archived',false).order('category').order('name');if(q.error)throw q.error;return q.data||[]}
function setLibraryNav(){document.querySelectorAll('#nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page==='library'))}
function iconForCategory(cat){const s=String(cat||'').toLowerCase();if(s.includes('свобод'))return'🏋️';if(s.includes('тренаж'))return'⚙️';if(s.includes('блок')||s.includes('крос'))return'🔗';if(s.includes('собствен'))return'🤸';if(s.includes('mfr'))return'🧘';if(s.includes('mobility'))return'🌀';if(s.includes('бокс'))return'🥊';return'⚡'}
function iconForMuscle(group){const s=String(group||'').toLowerCase();if(s.includes('ягод')||s.includes('ног')||s.includes('бедр')||s.includes('икр'))return'🦵';if(s.includes('спин'))return'🔙';if(s.includes('груд'))return'💥';if(s.includes('плеч'))return'🏹';if(s.includes('биц')||s.includes('триц')||s.includes('рук'))return'💪';if(s.includes('кор')||s.includes('пресс'))return'🔥';return'◉'}
function uniq(arr){return Array.from(new Set(arr))}
function libraryHeader(title,sub,back){return `${back?`<button class="df-back" id="libraryBack">←</button>`:''}<div class="df-screen-head"><div class="df-eyebrow">DENISFIT LIBRARY</div><h1>${esc(title)}</h1><p>${esc(sub||'')}</p></div>`}

async function renderLibraryHome(){
  if(libraryBusy)return;libraryBusy=true;setLibraryNav();const main=$('main');if(!main){libraryBusy=false;return}main.innerHTML='<div class="spinner"></div>';
  try{
    await identity();const ex=await getExercises();const cats=uniq(ex.map(x=>x.category||'Другое')).sort((a,b)=>a.localeCompare(b,'ru'));
    main.classList.add('df-library-root');
    main.innerHTML=`${libraryHeader('Библиотека','Упражнения, техника и видео — по понятной структуре.')}${role==='trainer'?`<button id="libraryAddExercise" class="df-feature-card df-feature-action"><span class="df-feature-icon">＋</span><span><b>Добавить упражнение</b><small>Название, категория, мышечная группа, техника и видео</small></span><i>→</i></button>`:''}<div class="df-section-label">Категории · ${cats.length}</div><div class="df-library-grid">${cats.length?cats.map(cat=>{const rows=ex.filter(x=>(x.category||'Другое')===cat),groups=uniq(rows.map(x=>x.muscle_group||'Без группы'));return `<button class="df-feature-card df-category-card" data-lib-category="${esc(cat)}"><span class="df-feature-icon">${iconForCategory(cat)}</span><span><b>${esc(cat)}</b><small>${rows.length} упражнений · ${groups.length} групп</small></span><i>→</i></button>`}).join(''):'<div class="empty">Библиотека пока пустая.</div>'}</div>`;
    if($('libraryAddExercise'))$('libraryAddExercise').onclick=renderAddExercise;
    document.querySelectorAll('[data-lib-category]').forEach(b=>b.onclick=()=>renderLibraryCategory(b.dataset.libCategory));
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка библиотеки</b><p class="muted">${esc(e.message||e)}</p></div>`}
  finally{libraryBusy=false}
}

async function renderLibraryCategory(category){
  const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{
    const ex=(await getExercises()).filter(x=>(x.category||'Другое')===category);const groups=uniq(ex.map(x=>x.muscle_group||'Без группы')).sort((a,b)=>a.localeCompare(b,'ru'));
    main.innerHTML=`${libraryHeader(category,`${ex.length} упражнений`,true)}<div class="df-library-search"><span>⌕</span><input id="librarySearch" placeholder="Найти упражнение"></div><div id="libraryCategoryBody"><div class="df-section-label">Мышечные группы</div><div class="df-library-grid">${groups.map(g=>{const rows=ex.filter(x=>(x.muscle_group||'Без группы')===g);return `<button class="df-feature-card" data-lib-muscle="${esc(g)}"><span class="df-feature-icon">${iconForMuscle(g)}</span><span><b>${esc(g)}</b><small>${rows.length} упражнений</small></span><i>→</i></button>`}).join('')}</div></div>`;
    $('libraryBack').onclick=renderLibraryHome;
    document.querySelectorAll('[data-lib-muscle]').forEach(b=>b.onclick=()=>renderLibraryMuscle(category,b.dataset.libMuscle));
    $('librarySearch').oninput=()=>{const q=$('librarySearch').value.trim().toLowerCase();if(!q){renderLibraryCategory(category);return}const rows=ex.filter(x=>`${x.name} ${x.muscle_group||''} ${x.equipment||''}`.toLowerCase().includes(q));$('libraryCategoryBody').innerHTML=`<div class="df-section-label">Результаты · ${rows.length}</div><div class="df-exercise-list">${exerciseRows(rows,category,null)}</div>`;bindExerciseRows(category,null)};
  }catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
function exerciseRows(rows,category,muscle){return rows.length?rows.map((x,i)=>`<button class="df-exercise-row" data-lib-exercise="${x.id}"><span class="df-ex-index">${String(i+1).padStart(2,'0')}</span><span class="df-ex-copy"><b>${esc(x.name)}</b><small>${esc(x.equipment||x.muscle_group||'Упражнение')}</small></span>${x.video_path?'<em>▶</em>':'<em>→</em>'}</button>`).join(''):'<div class="empty">Ничего не найдено.</div>'}
function bindExerciseRows(category,muscle){document.querySelectorAll('[data-lib-exercise]').forEach(b=>b.onclick=()=>renderExerciseDetail(b.dataset.libExercise,category,muscle))}
async function renderLibraryMuscle(category,muscle){
  const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{const rows=(await getExercises()).filter(x=>(x.category||'Другое')===category&&(x.muscle_group||'Без группы')===muscle);main.innerHTML=`${libraryHeader(muscle,`${category} · ${rows.length} упражнений`,true)}<div class="df-exercise-list">${exerciseRows(rows,category,muscle)}</div>`;$('libraryBack').onclick=()=>renderLibraryCategory(category);bindExerciseRows(category,muscle)}catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
async function renderExerciseDetail(id,category,muscle){
  const main=$('main');main.innerHTML='<div class="spinner"></div>';
  try{const q=await db.from('exercises').select('*').eq('id',id).single();if(q.error)throw q.error;const x=q.data;const canDelete=role==='trainer'&&x.trainer_id===user?.id&&!x.is_system;main.innerHTML=`${libraryHeader(x.name,x.muscle_group||x.category||'Упражнение',true)}<div class="df-exercise-detail"><div class="df-exercise-meta"><span>${iconForCategory(x.category)} ${esc(x.category||'Упражнение')}</span>${x.equipment?`<span>⚙ ${esc(x.equipment)}</span>`:''}${x.video_path?'<span class="df-video-ready">● Видео</span>':''}</div>${x.technique_tips?`<div class="df-technique"><div class="df-section-label">Техника</div><p>${esc(x.technique_tips)}</p></div>`:'<div class="df-technique muted"><p>Подсказки по технике пока не добавлены.</p></div>'}${x.video_path?`<button id="libraryPlayVideo" class="btn primary df-wide-action">▶ Смотреть технику</button>`:''}${canDelete?'<button id="libraryDeleteExercise" class="btn danger df-wide-action">Удалить упражнение</button>':''}</div>`;$('libraryBack').onclick=()=>muscle?renderLibraryMuscle(category,muscle):renderLibraryCategory(category);if($('libraryPlayVideo'))$('libraryPlayVideo').onclick=()=>playVideo(x.video_path,x.name);if($('libraryDeleteExercise'))$('libraryDeleteExercise').onclick=async()=>{if(!confirm('Удалить это упражнение?'))return;if(x.video_path)await db.storage.from('exercise-videos').remove([x.video_path]);const d=await db.from('exercises').update({archived:true}).eq('id',x.id).eq('trainer_id',user.id);if(d.error)return toast(d.error.message,true);toast('Упражнение удалено');renderLibraryMuscle(category,muscle||x.muscle_group||'Без группы')}}catch(e){main.innerHTML=`<div class="card"><b>Ошибка</b><p class="muted">${esc(e.message||e)}</p></div>`}
}
async function playVideo(path,title){
  try{const q=await db.storage.from('exercise-videos').createSignedUrl(path,3600);if(q.error)throw q.error;const modal=document.createElement('div');modal.className='df-video-modal';modal.innerHTML=`<div class="df-video-sheet"><button class="df-video-close">×</button><div class="df-eyebrow">ТЕХНИКА</div><h2>${esc(title)}</h2><video src="${esc(q.data.signedUrl)}" controls playsinline autoplay></video></div>`;document.body.appendChild(modal);modal.querySelector('.df-video-close').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()}}catch(e){toast(e.message||'Не удалось открыть видео',true)}
}
async function renderAddExercise(){
  await identity();const main=$('main');const categories=['Тренажёры','Свободные веса','Блоки / кроссовер','Собственный вес','MFR','Mobility','Бокс','Другое'];main.innerHTML=`${libraryHeader('Новое упражнение','Добавь его один раз — дальше оно будет доступно в программах и онлайн-ведении.',true)}<div class="df-form-shell"><div class="field"><label class="label">Название</label><input id="libExName" class="input" placeholder="Например: Болгарские выпады"></div><div class="row"><div class="field"><label class="label">Категория</label><select id="libExCategory" class="input">${categories.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label class="label">Оборудование</label><input id="libExEquipment" class="input" placeholder="Гантели / тренажёр"></div></div><div class="field"><label class="label">Мышечная группа</label><input id="libExMuscle" class="input" placeholder="Спина / грудь / ягодицы..."></div><div class="field"><label class="label">Подсказки по технике</label><textarea id="libExTips" class="input" rows="4" placeholder="Темп, амплитуда, ключевые ошибки..."></textarea></div><div class="field"><label class="label">Видео</label><input id="libExVideo" class="input" type="file" accept="video/*"></div><button id="libSaveExercise" class="btn primary df-wide-action">Добавить в библиотеку</button></div>`;$('libraryBack').onclick=renderLibraryHome;$('libSaveExercise').onclick=saveExercise;
}
async function saveExercise(){
  const name=$('libExName').value.trim();if(!name)return toast('Введите название упражнения',true);const btn=$('libSaveExercise');btn.disabled=true;btn.textContent='Сохраняю...';let path=null;
  try{const f=$('libExVideo').files[0];if(f){const ext=(f.name.split('.').pop()||'mp4').toLowerCase();path=`${user.id}/${crypto.randomUUID()}.${ext}`;const u=await db.storage.from('exercise-videos').upload(path,f,{contentType:f.type||'video/mp4'});if(u.error)throw u.error}const q=await db.from('exercises').insert({trainer_id:user.id,name,muscle_group:$('libExMuscle').value.trim()||null,technique_tips:$('libExTips').value.trim()||null,video_path:path,archived:false,category:$('libExCategory').value,equipment:$('libExEquipment').value.trim()||null,is_system:false});if(q.error)throw q.error;toast('Упражнение добавлено');renderLibraryHome()}catch(e){if(path)await db.storage.from('exercise-videos').remove([path]).catch(()=>{});toast(e.message||'Не удалось добавить упражнение',true);btn.disabled=false;btn.textContent='Добавить в библиотеку'}
}

function isOldLibraryScreen(){const h=$('main')?.querySelector('h1');return h&&['Библиотека упражнений','Видеотека'].includes(h.textContent.trim())&&!$('main').classList.contains('df-library-root')}
document.addEventListener('click',e=>{const b=e.target.closest?.('#nav [data-page="library"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();renderLibraryHome()},true);
const obs=new MutationObserver(()=>{if(isOldLibraryScreen())renderLibraryHome()});
window.addEventListener('load',async()=>{await identity();const main=$('main');if(main)obs.observe(main,{childList:true,subtree:true});setTimeout(()=>{if(isOldLibraryScreen())renderLibraryHome()},250)});
db.auth.onAuthStateChange(()=>setTimeout(identity,120));
})();
