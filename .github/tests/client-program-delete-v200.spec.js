const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.setContent('<!doctype html><html><body><main id="main"><button id="clientBtn" data-client="client-1">Дарья</button></main></body></html>');
  await page.evaluate(()=>{
    window.confirm=()=>true;
    window.__programs=[
      {id:'p1',trainer_id:'trainer-1',client_id:'client-1',name:'Ноги',description:'Шаблон ног',active:true,created_at:'2026-08-20T10:00:00Z'},
      {id:'p2',trainer_id:'trainer-1',client_id:'client-1',name:'Спина',description:'Шаблон спины',active:true,created_at:'2026-08-19T10:00:00Z'}
    ];
    window.__assignments=[
      {id:'a1',trainer_id:'trainer-1',client_id:'client-1',program_id:'p1',status:'scheduled'},
      {id:'a2',trainer_id:'trainer-1',client_id:'client-1',program_id:'p1',status:'completed'},
      {id:'a3',trainer_id:'trainer-1',client_id:'client-1',program_id:'p2',status:'scheduled'}
    ];

    const matches=(row,filters)=>Object.entries(filters).every(([k,v])=>row[k]===v);
    class Query{
      constructor(table){this.table=table;this.filters={};this.op='select';this.patch=null}
      select(){return this}
      eq(k,v){this.filters[k]=v;return this}
      order(){return this}
      update(patch){this.op='update';this.patch=patch;return this}
      maybeSingle(){return this._run(true)}
      then(resolve,reject){return this._run(false).then(resolve,reject)}
      async _run(single){
        let data=[];
        if(this.table==='training_programs'){
          if(this.op==='update')window.__programs.filter(x=>matches(x,this.filters)).forEach(x=>Object.assign(x,this.patch));
          data=window.__programs.filter(x=>matches(x,this.filters));
        }
        if(this.table==='assigned_workouts'){
          if(this.op==='update')window.__assignments.filter(x=>matches(x,this.filters)).forEach(x=>Object.assign(x,this.patch));
          data=window.__assignments.filter(x=>matches(x,this.filters));
        }
        return {data:single?(data[0]||null):data,error:null};
      }
    }
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t)};
    window.supabase={createClient:()=>db};

    document.getElementById('clientBtn').onclick=()=>{
      document.getElementById('main').innerHTML=`
        <button id="assignFromClient">Назначить тренировку</button>
        <button id="saveClientPlan">Сохранить</button>
        <div class="section-title">Абонементы</div><div class="card">Абонементы</div>
        <div class="section-title">Программы</div>
        <div class="card legacy">Старое отображение</div>
        <button id="deleteClient">Удалить клиента</button>`;
    };
  });

  await page.addScriptTag({content:fs.readFileSync('client-program-delete-v200.js','utf8')});

  // Critical real-world path: ID is absent before the click and must be captured by v200.
  const beforeId=await page.evaluate(()=>sessionStorage.getItem('df_v200_client'));
  if(beforeId)throw new Error('Test precondition failed: client id already exists');
  await page.locator('#clientBtn').click();

  await page.waitForSelector('#dfv192ClientPrograms [data-v200-remove]');
  const remembered=await page.evaluate(()=>sessionStorage.getItem('df_v200_client'));
  if(remembered!=='client-1')throw new Error('Client ID was not captured during navigation');

  const rows=await page.locator('#dfv192ClientPrograms [data-v200-program]').count();
  if(rows!==2)throw new Error(`Expected 2 active programs, got ${rows}`);
  const label=await page.locator('[data-v200-remove]').first().innerText();
  if(label.trim()!=='Удалить у клиента')throw new Error(`Unexpected delete label: ${label}`);

  await page.locator('[data-v200-remove="p1"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#dfv192ClientPrograms [data-v200-program]').length===1);

  const state=await page.evaluate(()=>({
    program:window.__programs.find(x=>x.id==='p1'),
    scheduled:window.__assignments.find(x=>x.id==='a1'),
    completed:window.__assignments.find(x=>x.id==='a2'),
    other:window.__assignments.find(x=>x.id==='a3')
  }));
  if(state.program.active!==false)throw new Error('Program was not deactivated');
  if(state.scheduled.status!=='cancelled')throw new Error('Future scheduled workout was not cancelled');
  if(state.completed.status!=='completed')throw new Error('Completed workout history was changed');
  if(state.other.status!=='scheduled')throw new Error('Another program assignment was changed');

  if(errors.length)throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await browser.close();
  console.log('DenisFit client program delete v200 real-navigation test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
