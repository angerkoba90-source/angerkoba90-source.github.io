const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent('<!doctype html><html><body><main id="main"><button id="scheduleClient" data-open-schedule-client="event-1|client-1"><b>Дарья</b><span class="schedule-program-label">Верх тела · День B</span><span>Открыть тренировку →</span></button></main></body></html>');
  await page.evaluate(()=>{
    window.__back=0;window.__removeCalls=[];
    window.__profiles=[{id:'client-1',full_name:'Дарья'}];
    window.__events=[{id:'event-1',trainer_id:'trainer-1',starts_at:'2026-08-22T10:00:00+03:00',training_type:'personal',status:'scheduled'}];
    window.__programs=[{id:'program-1',trainer_id:'trainer-1',client_id:'client-1',name:'Верх тела',description:'Спина и грудь',active:false,created_at:'2026-08-21T10:00:00Z'}];
    window.__assignments=[{id:'a-1',trainer_id:'trainer-1',client_id:'client-1',program_id:'program-1',program_name:'Верх тела',day_label:'День B',status:'scheduled',scheduled_date:'2026-08-22',schedule_event_id:'event-1',created_at:'2026-08-21T18:00:00Z'}];
    window.__templates=[{id:'tpl-1',trainer_id:'trainer-1',name:'Верх тела',description:'Спина и грудь',online_only:false,updated_at:'2026-08-21T00:00:00Z',template_exercises:[{day_label:'День A',sort_order:1},{day_label:'День B',sort_order:2}]}];
    const rows=t=>t==='profiles'?window.__profiles:t==='schedule_events'?window.__events:t==='training_programs'?window.__programs:t==='assigned_workouts'?window.__assignments:window.__templates;
    class Query{
      constructor(table){this.table=table;this.filters={};this.neqs={};this.max=null;this.op='select';this.patch=null;this.ids=null}
      select(){return this}eq(k,v){this.filters[k]=v;return this}neq(k,v){this.neqs[k]=v;return this}order(){return this}limit(n){this.max=n;return this}in(k,v){if(k==='id')this.ids=v;return this}update(p){this.op='update';this.patch=p;return this}maybeSingle(){return this._run(true)}
      then(resolve,reject){return this._run(false).then(resolve,reject)}
      async _run(single){const src=rows(this.table),match=r=>Object.entries(this.filters).every(([k,v])=>r[k]===v)&&Object.entries(this.neqs).every(([k,v])=>r[k]!==v)&&(!this.ids||this.ids.includes(r.id));if(this.op==='update')src.filter(match).forEach(r=>Object.assign(r,this.patch));let data=src.filter(match);if(this.max!=null)data=data.slice(0,this.max);return {data:single?(data[0]||null):data,error:null}}
    }
    const rpc=async(name,args)=>{
      if(name==='trainer_remove_template_from_schedule_event'){
        window.__removeCalls.push(args);
        const a=window.__assignments.find(x=>x.schedule_event_id===args.p_event_id&&x.client_id===args.p_client_id&&x.status==='scheduled');
        if(a)a.status='cancelled';
        return {data:[{removed_assignment_id:a?.id||null}],error:null};
      }
      if(name==='trainer_apply_template_to_schedule_event')return {data:[],error:null};
      return {data:null,error:{message:'Unexpected RPC '+name}};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t),rpc};window.supabase={createClient:()=>db};
    document.getElementById('scheduleClient').onclick=()=>{
      const main=document.getElementById('main');
      main.innerHTML=`<div class="dfd-diary"><div class="dfd-diary-head"><button id="dfdBack">←</button><div><h1>Дарья</h1><p>Верх тела</p></div></div>${Array.from({length:8},(_,i)=>`<section class="dfd-exercise" style="height:120px">Упражнение ${i+1}</section>`).join('')}<div class="dfd-diary-footer"><button id="dfdSave">Сохранить дневник</button><small>Следующая тренировка возьмёт веса.</small></div></div>`;
      document.getElementById('dfdBack').onclick=()=>{window.__back++;main.innerHTML='<div id="scheduleReturned">Расписание</div>'};
    };
  });

  await page.addScriptTag({content:fs.readFileSync('schedule-client-v208.js','utf8')});
  await page.addScriptTag({content:fs.readFileSync('schedule-template-ui-v210.js','utf8')});

  await page.locator('#scheduleClient').click();await page.waitForSelector('#dfv208Modal');
  const pickerText=(await page.locator('[data-v208-picker]').innerText()).trim();if(pickerText!=='Добавить шаблон тренировки')throw new Error('Wrong add-template label: '+pickerText);
  if(await page.locator('#dfv208Rows').evaluate(el=>getComputedStyle(el).display)!=='none')throw new Error('Client program manager rows are still visible');
  const bottomCloseVisible=await page.locator('[data-v208-close]').evaluate(el=>getComputedStyle(el).display!=='none');if(bottomCloseVisible)throw new Error('Bottom close button is still shown as a menu item');
  if(await page.locator('#dfv209RemoveCurrentTemplate').count())throw new Error('Old remove-template button is still in intermediate panel');
  if((await page.locator('[data-v208-open]').innerText()).trim()!=='Открыть тренировку')throw new Error('Open-workout menu item missing');

  await page.locator('[data-v208-open]').click();await page.waitForSelector('.dfd-diary');
  await page.waitForSelector('#dfv210DeleteZone');
  const diary=page.locator('.dfd-diary');
  const lastChildId=await diary.locator(':scope > *').last().getAttribute('id');if(lastChildId!=='dfv210DeleteZone')throw new Error('Delete-template zone is not at the very bottom of the diary');
  if((await page.locator('#dfv210DeleteTemplate').innerText()).trim()!=='Удалить шаблон')throw new Error('Delete-template button label is wrong');
  await page.locator('#dfv210DeleteTemplate').scrollIntoViewIfNeeded();
  await page.locator('#dfv210DeleteTemplate').click();
  await page.waitForFunction(()=>window.__removeCalls.length===1&&window.__back===1);
  const call=await page.evaluate(()=>window.__removeCalls[0]);if(call.p_event_id!=='event-1'||call.p_client_id!=='client-1')throw new Error('Wrong remove RPC payload '+JSON.stringify(call));
  if(await page.locator('#scheduleReturned').count()!==1)throw new Error('Did not return to schedule after removing template');
  const width=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(width.scroll>width.inner+2)throw new Error('Horizontal overflow');
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit schedule template UI v210: PASS');
})().catch(e=>{console.error(e);process.exit(1)});