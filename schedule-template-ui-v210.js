(()=>{
'use strict';
if(window.__denisfitScheduleTemplateUiV210)return;
window.__denisfitScheduleTemplateUiV210=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
let scheduleCtx=null;
let diaryCtx=null;
let queued=false;

function styleOnce(){
  if($('#dfv210Style'))return;
  const s=document.createElement('style');
  s.id='dfv210Style';
  s.textContent=`
    #dfv208Modal .dfv210-hidden{display:none!important}
    #dfv208Modal .dfv208-actions{grid-template-columns:1fr!important;margin-top:10px!important}
    #dfv208Modal [data-v208-open]{width:100%;min-height:50px;font-size:14px}
    #dfv208Modal [data-v208-picker]{margin-top:10px;margin-bottom:8px}
    .dfv210-delete-zone{margin:20px 0 calc(18px + env(safe-area-inset-bottom));padding-top:18px;border-top:1px solid #2d322d}
    .dfv210-delete-zone small{display:block;color:#858d86;font-size:11px;line-height:1.4;margin:0 2px 10px}
    .dfv210-delete-template{width:100%;min-height:50px;border:1px solid #743a3d;border-radius:15px;background:#2a1719;color:#ff999d;font-weight:900;font-size:14px}
    .dfv210-delete-template:disabled{opacity:.5}
  `;
  document.head.append(s);
}

function toast(text,error=false){
  let el=$('#dfv210Toast');
  if(!el){el=document.createElement('div');el.id='dfv210Toast';document.body.append(el)}
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:130200;padding:12px 16px;border-radius:14px;color:#fff;font:800 13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;background:'+(error?'#421b1b':'#202720')+';border:1px solid '+(error?'#7f3b3b':'#3e4a3e')+';max-width:calc(100vw - 30px);text-align:center';
  clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600);
}

function rememberScheduleContext(e){
  const button=e.target?.closest?.('[data-open-schedule-client]');
  if(!button)return;
  const [eventId,clientId]=String(button.dataset.openScheduleClient||'').split('|');
  if(!eventId||!clientId)return;
  scheduleCtx={eventId,clientId};
}

function simplifySchedulePanel(){
  const modal=$('#dfv208Modal');
  if(!modal)return;
  styleOnce();

  const picker=$('[data-v208-picker]',modal);
  if(picker)picker.textContent='Добавить шаблон тренировки';

  const rows=$('#dfv208Rows',modal);
  if(rows){
    rows.classList.add('dfv210-hidden');
    const title=rows.previousElementSibling;
    if(title?.classList.contains('list-row'))title.classList.add('dfv210-hidden');
  }

  const oldRemove=$('#dfv209RemoveCurrentTemplate',modal);
  oldRemove?.remove();

  const closeBottom=$('[data-v208-close]',modal);
  closeBottom?.classList.add('dfv210-hidden');

  const open=$('[data-v208-open]',modal);
  if(open){
    open.textContent='Открыть тренировку';
    if(!open.dataset.v210Bound){
      open.dataset.v210Bound='1';
      open.addEventListener('click',()=>{
        if(open.disabled||!scheduleCtx)return;
        diaryCtx={...scheduleCtx};
      },true);
    }
  }
}

function clearDiaryContext(){diaryCtx=null;$('#dfv210DeleteZone')?.remove()}

function injectDiaryDelete(){
  const diary=$('.dfd-diary');
  if(!diary||!diaryCtx)return;
  styleOnce();
  if($('#dfv210DeleteZone',diary))return;
  const footer=$('.dfd-diary-footer',diary);
  if(!footer)return;

  const zone=document.createElement('section');
  zone.id='dfv210DeleteZone';
  zone.className='dfv210-delete-zone';
  zone.innerHTML='<small>Удаление снимет шаблон только с этой записи. Сам шаблон в разделе «Программы» и история клиента останутся.</small><button type="button" id="dfv210DeleteTemplate" class="dfv210-delete-template">Удалить шаблон</button>';
  diary.append(zone);

  $('#dfv210DeleteTemplate',zone).onclick=async()=>{
    const btn=$('#dfv210DeleteTemplate',zone);
    if(!btn||btn.disabled||!diaryCtx)return;
    if(!confirm('Удалить шаблон с этой тренировки? Запись клиента в расписании останется.'))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{
      const q=await db.rpc('trainer_remove_template_from_schedule_event',{p_event_id:diaryCtx.eventId,p_client_id:diaryCtx.clientId});
      if(q.error)throw q.error;
      toast('Шаблон удалён с этой тренировки');
      const back=$('#dfdBack');
      diaryCtx=null;
      setTimeout(()=>back?.click(),180);
    }catch(e){
      console.error('schedule-template-ui-v210 remove',e);
      btn.disabled=false;btn.textContent='Удалить шаблон';
      toast(e.message||'Не удалось удалить шаблон',true);
    }
  };

  const back=$('#dfdBack');
  if(back&&!back.dataset.v210Bound){
    back.dataset.v210Bound='1';
    back.addEventListener('click',()=>{diaryCtx=null},true);
  }
}

function enhance(){
  queued=false;
  simplifySchedulePanel();
  injectDiaryDelete();
}
function scheduleEnhance(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(enhance);
}

document.addEventListener('pointerdown',rememberScheduleContext,true);
document.addEventListener('mousedown',rememberScheduleContext,true);
document.addEventListener('click',rememberScheduleContext,true);
document.addEventListener('click',e=>{
  if(e.target?.closest?.('[data-page]')&&!e.target.closest('[data-page="schedule"]'))clearDiaryContext();
},true);
new MutationObserver(scheduleEnhance).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',scheduleEnhance);
scheduleEnhance();
})();