(()=>{
'use strict';

const CUSTOM_KEY='workout-journal-custom-exercises-v1';
const MIGRATION_KEY='workout-journal-manual-only-v9';
const loadCustom=()=>{try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]')||[]}catch{return[]}};
let customExercises=loadCustom();

const escManual=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const normal=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');

function syncLegacyCatalog(){
  try{
    if(typeof EXDB!=='undefined'&&Array.isArray(EXDB)){
      EXDB.splice(0,EXDB.length,...customExercises.map(x=>({name:x.name,type:'Своё',brand:'',group:x.group||'Без группы'})));
    }
  }catch(e){console.warn('manual catalog sync',e)}
}
function saveCustom(){
  customExercises=customExercises.filter(x=>x&&String(x.name||'').trim()).map(x=>({name:String(x.name).trim(),group:String(x.group||'').trim()}));
  const seen=new Set();customExercises=customExercises.filter(x=>{const k=normal(x.name);if(seen.has(k))return false;seen.add(k);return true});
  localStorage.setItem(CUSTOM_KEY,JSON.stringify(customExercises));
  syncLegacyCatalog();
}

function removeSeededDefaults(){
  try{
    if(localStorage.getItem(MIGRATION_KEY)==='1')return;
    if(typeof templates!=='undefined'&&Array.isArray(templates)){
      const seeded=t=>(t?.id==='t1'&&t?.name==='Грудь + трицепс')||(t?.id==='t2'&&t?.name==='Ноги');
      const before=templates.length;
      templates=templates.filter(t=>!seeded(t));
      if(templates.length!==before&&typeof saveTpl==='function')saveTpl();
    }
    localStorage.setItem(MIGRATION_KEY,'1');
  }catch(e){console.warn('manual migration',e)}
}

function pickerStyles(){
  if(document.getElementById('manualExerciseStyles'))return;
  const style=document.createElement('style');style.id='manualExerciseStyles';style.textContent=`
  .nav{grid-template-columns:repeat(4,1fr)!important}
  .manual-ex-overlay{position:fixed;inset:0;z-index:140;background:#000c;display:flex;align-items:flex-end;justify-content:center}
  .manual-ex-sheet{width:min(430px,100%);max-height:88dvh;overflow:auto;background:#17191d;border-radius:28px 28px 0 0;padding:12px 16px calc(22px + env(safe-area-inset-bottom));border-top:1px solid #343941}
  .manual-ex-sheet h2{margin:4px 0 4px}.manual-ex-sheet .manual-sub{font-size:11px;color:#8d929a;margin-bottom:14px}
  .manual-ex-list{display:grid;gap:7px;margin:12px 0}.manual-ex-row{display:grid;grid-template-columns:1fr 40px;gap:8px;align-items:center;background:#22252b;border:1px solid #343941;border-radius:14px;padding:10px 10px 10px 12px}
  .manual-ex-pick{border:0;background:none;color:#fff;text-align:left;padding:0}.manual-ex-pick b{display:block;font-size:14px}.manual-ex-pick span{display:block;color:#858a92;font-size:10px;margin-top:3px}.manual-ex-delete{width:36px;height:36px;border:0;border-radius:11px;background:#34201f;color:#ff8d83;font-size:18px}
  .manual-empty{padding:18px 10px;text-align:center;color:#777c84;font-size:12px;border:1px dashed #343941;border-radius:14px}
  `;document.head.appendChild(style);
}

function hideBaseUi(){
  pickerStyles();
  const baseBtn=document.querySelector('.nav [data-go="library"]');
  if(baseBtn){baseBtn.style.display='none';baseBtn.setAttribute('aria-hidden','true');baseBtn.tabIndex=-1}
  const library=document.getElementById('library');if(library)library.classList.add('hidden');
  const tplSub=document.querySelector('#templates .top .sub');if(tplSub)tplSub.textContent='Создавай свои упражнения и собирай тренировки';
  const pick=document.getElementById('pickExercise');if(pick)pick.textContent='+ Добавить упражнение';
  const add=document.getElementById('addFromDb');if(add)add.textContent='+ Добавить упражнение';
  const tplSelected=document.querySelector('#tplSelected .sub');if(tplSelected&&/баз/i.test(tplSelected.textContent))tplSelected.textContent='Добавь упражнения вручную';
  document.querySelectorAll('.sheet h2').forEach(h=>{if(/База упражнений/i.test(h.textContent))h.textContent='Мои упражнения'});
}

function openManualPicker(onPick){
  document.querySelector('.manual-ex-overlay')?.remove();
  const overlay=document.createElement('div');overlay.className='manual-ex-overlay';
  overlay.innerHTML=`<div class="manual-ex-sheet"><div class="grab"></div><h2>Мои упражнения</h2><div class="manual-sub">Здесь только упражнения, которые ты добавил сам.</div><label class="label">Название упражнения</label><input id="manualExName" class="input" placeholder="Например: Болгарские выпады"><label class="label">Группа — необязательно</label><input id="manualExGroup" class="input" placeholder="Например: Ягодицы"><button id="manualExSave" class="btn">+ Добавить и выбрать</button><div id="manualExList" class="manual-ex-list"></div><button id="manualExClose" class="btn secondary">Назад</button></div>`;
  document.body.appendChild(overlay);
  const draw=()=>{
    const list=overlay.querySelector('#manualExList');
    list.innerHTML=customExercises.length?customExercises.map((x,i)=>`<div class="manual-ex-row"><button class="manual-ex-pick" data-manual-pick="${i}"><b>${escManual(x.name)}</b><span>${escManual(x.group||'Без группы')}</span></button><button class="manual-ex-delete" data-manual-delete="${i}" aria-label="Удалить">×</button></div>`).join(''):'<div class="manual-empty">Список пуст. Добавь первое упражнение выше.</div>';
    list.querySelectorAll('[data-manual-pick]').forEach(b=>b.onclick=()=>{const x=customExercises[+b.dataset.manualPick];overlay.remove();if(x)onPick(x.name)});
    list.querySelectorAll('[data-manual-delete]').forEach(b=>b.onclick=()=>{customExercises.splice(+b.dataset.manualDelete,1);saveCustom();draw()});
  };
  overlay.querySelector('#manualExSave').onclick=()=>{
    const name=overlay.querySelector('#manualExName').value.trim(),group=overlay.querySelector('#manualExGroup').value.trim();
    if(!name){overlay.querySelector('#manualExName').focus();return}
    const existing=customExercises.find(x=>normal(x.name)===normal(name));
    if(existing){if(group)existing.group=group}else customExercises.push({name,group});
    saveCustom();overlay.remove();onPick(existing?.name||name);
  };
  overlay.querySelector('#manualExClose').onclick=()=>overlay.remove();
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
  draw();setTimeout(()=>overlay.querySelector('#manualExName')?.focus(),60);
}

function installManualPicker(){
  try{openDbPicker=openManualPicker}catch(e){console.warn('manual picker override',e)}
}

removeSeededDefaults();
syncLegacyCatalog();
installManualPicker();
hideBaseUi();
try{if(typeof renderTemplates==='function')renderTemplates()}catch{}

const observer=new MutationObserver(()=>hideBaseUi());
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>{removeSeededDefaults();syncLegacyCatalog();installManualPicker();hideBaseUi()});
})();
