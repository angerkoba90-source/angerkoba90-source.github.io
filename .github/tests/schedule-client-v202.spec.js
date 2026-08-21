const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setContent('<!doctype html><html><body><main id="main"><button id="scheduleClient" class="schedule-client-link" data-open-schedule-client="event-1|client-1"><b>Дарья</b><span class="schedule-program-label">Ягодицы + плечи</span><span>Открыть тренировку →</span></button></main></body></html>');
  await page.evaluate(()=>{
    window.confirm=()=>true;window.__opened=0;document.getElementById('scheduleClient').onclick=()=>window.__opened++;
    window.__profiles=[{id:'client-1',full_name:'Дарья'}];
    window.__events=[{id:'event-1',trainer_id:'trainer-1',starts_at:'2026-08-22T10:00:00+03:00',training_type:'personal',status:'scheduled'}];
    window.__programs=[
      {id:'p-inactive',trainer_id:'trainer-1',client_id:'client-1',name:'Ягодицы + плечи',description:'Из расписания',active:false,created_at:'2026-08-21T17:00:00Z'},
      {id:'p-active',trainer_id:'trainer-1',client_id:'client-1',name:'Верх тела',description:'Постоянная',active:true,created_at:'2026-08-20T10:00:00Z'}
    ];
    window.__assignments=[
      {id:'a-current',trainer_id:'trainer-1',client_id:'client-1',program_id:'p-inactive',program_name:'Ягодицы + плечи',day_label:'Ноги',status:'scheduled',scheduled_date:'2026-08-22',schedule_event_id:'event-1',created_at:'2026-08-21T18:00:00Z'},
      {id:'a-completed',trainer_id:'trainer-1',client_id:'client-1',program_id:'p-inactive',program_name:'Ягодицы + плечи',day_label:'Ноги',status:'completed',scheduled_date:'2026-08-20',schedule_event_id:'event-old',created_at:'2026-08-20T18:00:00Z'}
    ];
    const tableRows=t=>t==='profiles'?window.__profiles:t==='schedule_events'?window.__events:t==='training_programs'?window.__programs:window.__assignments;
    class Query{
      constructor(table){this.table=table;this.filters={};this.neqs={};this.ids=null;this.op='select';this.patch=null;this.max=null}
      select(){return this} eq(k,v){this.filters[k]=v;return this} neq(k,v){this.neqs[k]=v;return this} order(){return this} limit(n){this.max=n;return this} in(k,v){if(k==='id')this.ids=v;return this} update(p){this.op='update';this.patch=p;return this}
      maybeSingle(){return this._run(true)}
      then(resolve,reject){return this._run(false).then(resolve,reject)}
      async _run(single){let src=tableRows(this.table);const match=r=>Object.entries(this.filters).every(([k,v])=>r[k]===v)&&Object.entries(this.neqs).every(([k,v])=>r[k]!==v)&&(!this.ids||this.ids.includes(r.id));if(this.op==='update')src.filter(match).forEach(r=>Object.assign(r,this.patch));let data=src.filter(match);if(this.max!=null)data=data.slice(0,this.max);return {data:single?(data[0]||null):data,error:null}}
    }
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t)};
    window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('schedule-client-v202.js','utf8')});

  await page.locator('#scheduleClient').click();
  await page.waitForSelector('#dfv202Modal');
  if(await page.evaluate(()=>window.__opened)!==0)throw new Error('Original workout navigation fired instead of panel');
  const rows=await page.locator('[data-v202-row]').count();if(rows!==2)throw new Error(`Expected 2 programs in schedule panel, got ${rows}`);
  if(await page.locator('[data-v202-row="p:p-inactive"]').count()!==1)throw new Error('Inactive scheduled program is missing from schedule panel');
  const current=await page.locator('.dfv202-current small').innerText();if(!current.includes('Ягодицы + плечи')||!current.includes('Ноги'))throw new Error(`Wrong current workout summary: ${current}`);

  await page.locator('[data-v202-open]').click();
  await page.waitForFunction(()=>window.__opened===1);
  if(await page.locator('#dfv202Modal').count())throw new Error('Panel did not close before opening workout');

  await page.locator('#scheduleClient').click();await page.waitForSelector('#dfv202Modal');
  await page.locator('[data-v202-row="p:p-inactive"] [data-v202-delete]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-v202-row]').length===1);
  const state=await page.evaluate(()=>({scheduled:window.__assignments.find(x=>x.id==='a-current'),completed:window.__assignments.find(x=>x.id==='a-completed'),other:window.__programs.find(x=>x.id==='p-active'),label:document.querySelector('#scheduleClient .schedule-program-label')?.textContent}));
  if(state.scheduled.status!=='cancelled')throw new Error('Current scheduled assignment was not cancelled');
  if(state.completed.status!=='completed')throw new Error('Completed history was changed');
  if(state.other.active!==true)throw new Error('Other active client program was changed');
  if(state.label!=='Программа не выбрана')throw new Error(`Schedule card was not updated: ${state.label}`);
  if(errors.length)throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await browser.close();console.log('DenisFit schedule client v202 integration test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
