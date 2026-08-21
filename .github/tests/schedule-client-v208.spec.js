const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent('<!doctype html><html><body><main id="main"><button id="scheduleClient" data-open-schedule-client="event-1|client-1"><b>Дарья</b><span class="schedule-program-label muted">Программа не выбрана</span><span>Открыть тренировку →</span></button></main></body></html>');
  await page.evaluate(()=>{
    window.__opened=0;window.__rpcCalls=[];document.getElementById('scheduleClient').onclick=()=>window.__opened++;
    window.__profiles=[{id:'client-1',full_name:'Дарья'}];
    window.__events=[{id:'event-1',trainer_id:'trainer-1',starts_at:'2026-08-22T10:00:00+03:00',training_type:'personal',status:'scheduled'}];
    window.__programs=[];window.__assignments=[];
    window.__templates=[
      {id:'tpl-1',trainer_id:'trainer-1',name:'Ягодицы + плечи',description:'Низ + плечи',online_only:false,updated_at:'2026-08-22T00:00:00Z',template_exercises:[{day_label:'Тренировка',sort_order:1},{day_label:'Тренировка',sort_order:2}]},
      {id:'tpl-2',trainer_id:'trainer-1',name:'Верх тела',description:'Спина и грудь',online_only:false,updated_at:'2026-08-21T00:00:00Z',template_exercises:[{day_label:'День A',sort_order:1},{day_label:'День B',sort_order:2}]}
    ];
    const rows=t=>t==='profiles'?window.__profiles:t==='schedule_events'?window.__events:t==='training_programs'?window.__programs:t==='assigned_workouts'?window.__assignments:window.__templates;
    class Query{
      constructor(table){this.table=table;this.filters={};this.neqs={};this.max=null;this.op='select';this.patch=null;this.ids=null}
      select(){return this}eq(k,v){this.filters[k]=v;return this}neq(k,v){this.neqs[k]=v;return this}order(){return this}limit(n){this.max=n;return this}in(k,v){if(k==='id')this.ids=v;return this}update(p){this.op='update';this.patch=p;return this}maybeSingle(){return this._run(true)}
      then(resolve,reject){return this._run(false).then(resolve,reject)}
      async _run(single){const src=rows(this.table),match=r=>Object.entries(this.filters).every(([k,v])=>r[k]===v)&&Object.entries(this.neqs).every(([k,v])=>r[k]!==v)&&(!this.ids||this.ids.includes(r.id));if(this.op==='update')src.filter(match).forEach(r=>Object.assign(r,this.patch));let data=src.filter(match);if(this.max!=null)data=data.slice(0,this.max);return {data:single?(data[0]||null):data,error:null}}
    }
    const rpc=async(name,args)=>{
      if(name!=='trainer_apply_template_to_schedule_event')return {data:null,error:{message:'Unexpected RPC '+name}};
      window.__rpcCalls.push(args);const tpl=window.__templates.find(x=>x.id===args.p_template_id);const p={id:'program-new',trainer_id:'trainer-1',client_id:'client-1',name:tpl.name,description:tpl.description,active:false,created_at:new Date().toISOString()};window.__programs=[p];window.__assignments=[{id:'a-new',trainer_id:'trainer-1',client_id:'client-1',program_id:p.id,program_name:p.name,day_label:args.p_day_label,status:'scheduled',scheduled_date:'2026-08-22',schedule_event_id:'event-1',created_at:new Date().toISOString()}];return {data:[{assignment_id:'a-new',program_id:p.id,program_name:p.name,day_label:args.p_day_label}],error:null};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t),rpc};window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('schedule-client-v208.js','utf8')});
  await page.locator('#scheduleClient').click();await page.waitForSelector('#dfv208Modal');
  if(await page.evaluate(()=>window.__opened)!==0)throw new Error('Original navigation fired');
  if(await page.locator('[data-v208-picker]').count()!==1)throw new Error('Choose template button missing');
  await page.locator('[data-v208-picker]').click();await page.waitForSelector('#dfv208TemplateList');
  if(await page.locator('[data-v208-template]').count()!==2)throw new Error('Not all templates are shown');
  if(!/Ягодицы \+ плечи/.test(await page.locator('#dfv208TemplateList').innerText())||!/Верх тела/.test(await page.locator('#dfv208TemplateList').innerText()))throw new Error('Template names missing');
  const multi=page.locator('[data-v208-template="tpl-2"]');if(await multi.locator('select option').count()!==2)throw new Error('Multi-day template selector missing');
  await multi.locator('select').selectOption('День B');await multi.locator('[data-v208-choose]').click();
  await page.waitForFunction(()=>window.__rpcCalls.length===1);await page.waitForSelector('[data-v208-open]:not([disabled])');
  const call=await page.evaluate(()=>window.__rpcCalls[0]);if(call.p_event_id!=='event-1'||call.p_client_id!=='client-1'||call.p_template_id!=='tpl-2'||call.p_day_label!=='День B')throw new Error('Wrong template RPC payload '+JSON.stringify(call));
  const current=await page.locator('.dfv208-current small').innerText();if(!current.includes('Верх тела')||!current.includes('День B'))throw new Error('Current assignment not refreshed');
  const label=await page.locator('#scheduleClient .schedule-program-label').innerText();if(!label.includes('Верх тела')||!label.includes('День B'))throw new Error('Schedule card label not updated');
  await page.locator('[data-v208-open]').click();await page.waitForFunction(()=>window.__opened===1);
  const width=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(width.scroll>width.inner+2)throw new Error('Horizontal overflow');
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit schedule client v208 template picker: PASS');
})().catch(e=>{console.error(e);process.exit(1)});