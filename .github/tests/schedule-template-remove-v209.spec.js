const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent('<!doctype html><html><body><main id="main"><button id="scheduleClient" data-open-schedule-client="event-1|client-1"><b>Дарья</b><span class="schedule-program-label">Верх тела · День B</span><span>Открыть тренировку →</span></button></main></body></html>');
  await page.evaluate(()=>{
    window.__opened=0;window.__removeCalls=[];document.getElementById('scheduleClient').onclick=()=>window.__opened++;
    window.__profiles=[{id:'client-1',full_name:'Дарья'}];
    window.__events=[{id:'event-1',trainer_id:'trainer-1',starts_at:'2026-08-22T10:00:00+03:00',training_type:'personal',status:'scheduled'}];
    window.__programs=[{id:'program-1',trainer_id:'trainer-1',client_id:'client-1',name:'Верх тела',description:'Шаблон',active:false,created_at:'2026-08-21T20:00:00Z'}];
    window.__assignments=[
      {id:'a-current',trainer_id:'trainer-1',client_id:'client-1',program_id:'program-1',program_name:'Верх тела',day_label:'День B',status:'scheduled',scheduled_date:'2026-08-22',schedule_event_id:'event-1',created_at:'2026-08-21T21:00:00Z'},
      {id:'a-sibling',trainer_id:'trainer-1',client_id:'client-1',program_id:'program-1',program_name:'Верх тела',day_label:'День A',status:'scheduled',scheduled_date:'2026-08-29',schedule_event_id:'event-2',created_at:'2026-08-21T20:30:00Z'},
      {id:'a-history',trainer_id:'trainer-1',client_id:'client-1',program_id:'program-1',program_name:'Верх тела',day_label:'День A',status:'completed',scheduled_date:'2026-08-15',schedule_event_id:'event-old',created_at:'2026-08-15T10:00:00Z'}
    ];
    window.__templates=[{id:'tpl-1',trainer_id:'trainer-1',name:'Верх тела'},{id:'tpl-2',trainer_id:'trainer-1',name:'Ягодицы + плечи'}];
    const rows=t=>t==='profiles'?window.__profiles:t==='schedule_events'?window.__events:t==='training_programs'?window.__programs:t==='assigned_workouts'?window.__assignments:window.__templates;
    class Query{
      constructor(table){this.table=table;this.filters={};this.neqs={};this.max=null;this.op='select';this.patch=null;this.ids=null}
      select(){return this}eq(k,v){this.filters[k]=v;return this}neq(k,v){this.neqs[k]=v;return this}order(){return this}limit(n){this.max=n;return this}in(k,v){if(k==='id')this.ids=v;return this}update(p){this.op='update';this.patch=p;return this}maybeSingle(){return this._run(true)}
      then(resolve,reject){return this._run(false).then(resolve,reject)}
      async _run(single){const src=rows(this.table),match=r=>Object.entries(this.filters).every(([k,v])=>r[k]===v)&&Object.entries(this.neqs).every(([k,v])=>r[k]!==v)&&(!this.ids||this.ids.includes(r.id));if(this.op==='update')src.filter(match).forEach(r=>Object.assign(r,this.patch));let data=src.filter(match);if(this.max!=null)data=data.slice(0,this.max);return {data:single?(data[0]||null):data,error:null}}
    }
    const rpc=async(name,args)=>{
      if(name!=='trainer_remove_template_from_schedule_event')return {data:null,error:{message:'Unexpected RPC '+name}};
      window.__removeCalls.push(args);
      const removed=[];
      for(const a of window.__assignments){if(a.trainer_id==='trainer-1'&&a.client_id===args.p_client_id&&a.schedule_event_id===args.p_event_id&&a.status==='scheduled'&&a.program_id){a.status='cancelled';removed.push(a.id)}}
      return {data:[{removed_assignment_ids:removed,removed_program_ids:[]}],error:null};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t),rpc};window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('schedule-client-v208.js','utf8')});
  await page.addScriptTag({content:fs.readFileSync('schedule-template-remove-v209.js','utf8')});

  await page.locator('#scheduleClient').click();
  await page.waitForSelector('#dfv208Modal');
  await page.waitForSelector('#dfv209RemoveCurrentTemplate');
  if(await page.locator('#dfv209RemoveCurrentTemplate').count()!==1)throw new Error('Remove template button duplicated or missing');
  if((await page.locator('#dfv209RemoveCurrentTemplate').innerText()).trim()!=='Удалить шаблон')throw new Error('Wrong remove template label');
  const currentBefore=await page.locator('.dfv208-current small').innerText();if(!currentBefore.includes('Верх тела')||!currentBefore.includes('День B'))throw new Error('Current template summary missing');

  await page.locator('#dfv209RemoveCurrentTemplate').click();
  await page.waitForFunction(()=>window.__removeCalls.length===1);
  await page.waitForSelector('#dfv208Modal');
  await page.waitForFunction(()=>document.querySelector('#dfv208Modal [data-v208-open]')?.disabled===true);
  const call=await page.evaluate(()=>window.__removeCalls[0]);if(call.p_event_id!=='event-1'||call.p_client_id!=='client-1')throw new Error('Wrong remove RPC payload '+JSON.stringify(call));
  if(await page.locator('#dfv209RemoveCurrentTemplate').count()!==0)throw new Error('Remove template button still visible after removal');
  const currentAfter=await page.locator('.dfv208-current small').innerText();if(!/не выбран/i.test(currentAfter))throw new Error('Current workout still shows a template');
  const label=await page.locator('#scheduleClient .schedule-program-label').innerText();if(label.trim()!=='Программа не выбрана')throw new Error('Schedule label was not reset');
  if(await page.locator('[data-v208-picker]').count()!==1)throw new Error('Choose template button disappeared after removal');

  const state=await page.evaluate(()=>({
    current:window.__assignments.find(x=>x.id==='a-current').status,
    sibling:window.__assignments.find(x=>x.id==='a-sibling').status,
    history:window.__assignments.find(x=>x.id==='a-history').status,
    programs:window.__programs.length,
    templates:window.__templates.length,
    opened:window.__opened
  }));
  if(state.current!=='cancelled')throw new Error('Current assignment was not cancelled');
  if(state.sibling!=='scheduled')throw new Error('Another scheduled workout was changed');
  if(state.history!=='completed')throw new Error('Completed history was changed');
  if(state.programs!==1)throw new Error('Shared client program was removed in UI mock');
  if(state.templates!==2)throw new Error('Global templates were changed');
  if(state.opened!==0)throw new Error('Original workout navigation fired unexpectedly');

  await page.locator('.dfv208-close').click();
  await page.locator('#scheduleClient').click();await page.waitForSelector('#dfv208Modal');
  await page.waitForTimeout(120);
  if(await page.locator('#dfv209RemoveCurrentTemplate').count()!==0)throw new Error('Remove button reappeared without selected template');
  const width=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(width.scroll>width.inner+2)throw new Error('Horizontal overflow');
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit schedule template removal v209: PASS');
})().catch(e=>{console.error(e);process.exit(1)});