(()=>{
'use strict';
if(window.__denisfitScheduleTemplateRemoveV209)return;
window.__denisfitScheduleTemplateRemoveV209=true;

const SUPABASE_URL='https://dlaiacatpcgbzmumtggw.supabase.co';
const SUPABASE_KEY='sb_publishable_1_IEt89WvEBEhykAfS7rvw_jF7WwD6l';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
if(!db)return;

const $=(s,r=document)=>r.querySelector(s);
let ctx=null;
let queued=false;

function rememberScheduleContext(e){
  const button=e.target?.closest?.('[data-open-schedule-client]');
  if(!button)return;
  const raw=button.dataset.openScheduleClient||'';
  const [eventId,clientId]=raw.split('|');
  if(!eventId||!clientId)return;
  ctx={eventId,clientId,sourceButton:button};
}

function styleOnce(){
  if($('#dfv209Style'))return;
  const s=document.createElement('style');
  s.id='dfv209Style';
  s.textContent=`
    .dfv209-remove-current{width:100%;min-height:46px;border:1px solid #743a3d;border-radius:14px;background:#2a1719;color:#ff999d;font-weight:900;font-size:13px;margin:2px 0 8px}
    .dfv209-remove-current:disabled{opacity:.5}
  `;
  document.head.append(s);
}

function toast(text,error=false){
  let el=$('#dfv209Toast');
  if(!el){el=document.createElement('div');el.id='dfv209Toast';document.body.append(el)}
  el.textContent=text;
  el.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:130100;padding:12px 16px;border-radius:14px;color:#fff;font:800 13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;background:'+(error?'#421b1b':'#202720')+';border:1px solid '+(error?'#7f3b3b':'#3e4a3e')+';max-width:calc(100vw - 30px);text-align:center';
  clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600);
}

function updateUnderlying(){
  const label=ctx?.sourceButton?.querySelector?.('.schedule-program-label');
  if(label){label.textContent='Программа не выбрана';label.classList.add('muted')}
}

function reopenFresh(){
  const source=ctx?.sourceButton;
  $('#dfv208Modal .dfv208-close')?.click();
  if(source&&document.contains(source))setTimeout(()=>source.click(),60);
}

function hasSelectedTemplate(modal){
  const openBtn=$('[data-v208-open]',modal);
  if(!openBtn||openBtn.disabled)return false;
  const text=$('.dfv208-current small',modal)?.textContent||'';
  return !/не выбран/i.test(text);
}

function inject(){
  queued=false;
  const modal=$('#dfv208Modal');
  if(!modal)return;
  const old=$('#dfv209RemoveCurrentTemplate',modal);
  if(!hasSelectedTemplate(modal)){
    old?.remove();
    return;
  }
  if(old)return;
  const picker=$('[data-v208-picker]',modal);
  if(!picker||!ctx)return;
  styleOnce();
  const btn=document.createElement('button');
  btn.id='dfv209RemoveCurrentTemplate';
  btn.type='button';
  btn.className='dfv209-remove-current';
  btn.textContent='Удалить шаблон';
  picker.insertAdjacentElement('afterend',btn);
  btn.onclick=async()=>{
    if(!ctx||btn.disabled)return;
    if(!confirm('Удалить шаблон только с этой тренировки? Сам шаблон в разделе «Программы», другие тренировки клиента и выполненная история останутся.'))return;
    btn.disabled=true;btn.textContent='Удаляю…';
    try{
      const q=await db.rpc('trainer_remove_template_from_schedule_event',{p_event_id:ctx.eventId,p_client_id:ctx.clientId});
      if(q.error)throw q.error;
      updateUnderlying();
      toast('Шаблон удалён с этой тренировки');
      reopenFresh();
    }catch(e){
      console.error('schedule-template-remove-v209',e);
      btn.disabled=false;btn.textContent='Удалить шаблон';
      toast(e.message||'Не удалось удалить шаблон',true);
    }
  };
}

function scheduleInject(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(inject);
}

window.addEventListener('click',rememberScheduleContext,true);
new MutationObserver(scheduleInject).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',scheduleInject);
scheduleInject();
})();