const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setContent('<!doctype html><html><body><main id="main"><button id="client" data-client="client-1">Клиент</button></main></body></html>');
  await page.evaluate(()=>{
    const store=new Map();
    Object.defineProperty(window,'sessionStorage',{configurable:true,value:{setItem:(k,v)=>store.set(k,String(v)),getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k)}});
    window.confirm=()=>true;
    window.__programs=[
      {id:'p-inactive',trainer_id:'trainer-1',client_id:'client-1',name:'Ягодицы + плечи',description:'Из расписания',active:false,created_at:'2026-08-21T17:57:18Z'},
      {id:'p-active',trainer_id:'trainer-1',client_id:'client-1',name:'Верх тела',description:'Постоянная программа',active:true,created_at:'2026-08-20T10:00:00Z'}
    ];
    window.__assignments=[
      {id:'a1',trainer_id:'trainer-1',client_id:'client-1',program_id:'p-inactive',program_name:'Ягодицы + плечи',status:'scheduled',scheduled_date:'2026-08-22',created_at:'2026-08-21T18:00:00Z'},
      {id:'a2',trainer_id:'trainer-1',client_id:'client-1',program_id:'p-inactive',program_name:'Ягодицы + плечи',status:'completed',scheduled_date:'2026-08-20',created_at:'2026-08-20T18:00:00Z'}
    ];
    const matches=(r,f)=>Object.entries(f).every(([k,v])=>r[k]===v);
    class Query{
      constructor(table){this.table=table;this.filters={};this.op='select';this.patch=null;this.ids=null}
      select(){return this} eq(k,v){this.filters[k]=v;return this} order(){return this} update(p){this.op='update';this.patch=p;return this} in(k,v){if(k==='id')this.ids=v;return this}
      then(resolve,reject){let src=this.table==='training_programs'?window.__programs:window.__assignments;if(this.op==='update')src.forEach(r=>{if(matches(r,this.filters)&&(!this.ids||this.ids.includes(r.id)))Object.assign(r,this.patch)});let data=src.filter(r=>matches(r,this.filters)&&(!this.ids||this.ids.includes(r.id)));return Promise.resolve({data,error:null}).then(resolve,reject)}
    }
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t)};
    window.supabase={createClient:()=>db};
    document.getElementById('client').onclick=()=>{
      document.getElementById('main').innerHTML=`
        <button id="assignFromClient">Назначить тренировку</button>
        <button id="saveClientPlan">Сохранить</button>
        <div class="section-title">Формат ведения</div>
        <label class="online-toggle"><input id="clientOnlineAccess" type="checkbox" checked><span><b>🌐 Онлайн ведение</b></span></label>
        <label class="online-toggle"><input type="checkbox"><span><b>🌐 Онлайн ведение</b></span></label>
        <div class="section-title">Программы</div><div class="card legacy-program">Старая карточка</div>
        <button id="deleteClient">Удалить клиента</button>`;
    };
  });
  await page.addScriptTag({content:fs.readFileSync('client-card-v201.js','utf8')});
  await page.locator('#client').click();
  await page.waitForSelector('#dfv192ClientPrograms [data-v201-marker]');
  const toggles=await page.locator('#main label.online-toggle').filter({hasText:'Онлайн ведение'}).count();if(toggles!==1)throw new Error(`Expected exactly 1 online toggle, got ${toggles}`);
  if(!(await page.locator('#main label.online-toggle input').isChecked()))throw new Error('Online toggle checked state was lost');
  if(await page.locator('.legacy-program').count())throw new Error('Legacy program card was not removed');
  const rows=await page.locator('[data-v201-row]').count();if(rows!==2)throw new Error(`Expected inactive scheduled + active program, got ${rows}`);
  const inactiveRow=page.locator('[data-v201-row="p:p-inactive"]');if(await inactiveRow.count()!==1)throw new Error('Inactive program with scheduled assignment is missing');
  const deleteText=await inactiveRow.locator('[data-v201-remove]').innerText();if(deleteText.trim()!=='Удалить у клиента')throw new Error(`Wrong delete label: ${deleteText}`);
  await inactiveRow.locator('[data-v201-remove]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-v201-row]').length===1);
  const state=await page.evaluate(()=>({program:window.__programs.find(x=>x.id==='p-inactive'),scheduled:window.__assignments.find(x=>x.id==='a1'),completed:window.__assignments.find(x=>x.id==='a2'),active:window.__programs.find(x=>x.id==='p-active')}));
  if(state.program.active!==false)throw new Error('Inactive program state changed unexpectedly');
  if(state.scheduled.status!=='cancelled')throw new Error('Scheduled assignment was not cancelled');
  if(state.completed.status!=='completed')throw new Error('Completed history was modified');
  if(state.active.active!==true)throw new Error('Other active program was modified');
  if(errors.length)throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await browser.close();console.log('DenisFit client card v201 real-data regression test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
