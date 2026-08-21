const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent(`<!doctype html><html><head></head><body style="margin:0;background:#090b0a;color:white"><div id="app"><header><div id="roleBadge">КЛИЕНТ</div></header><main id="main"><h1>Главная</h1></main></div><nav id="nav"><button data-page="home" class="active"><b>⌂</b>Главная</button><button data-page="progress"><b>↗</b>Прогресс</button><button data-page="profile"><b>●</b>Профиль</button></nav><div id="toast" class="hidden"></div></body></html>`);
  await page.evaluate(()=>{
    window.__mock={busy:[],bookArgs:null,saves:[],completed:false};
    class Query{
      constructor(table){this.table=table;this.filters={}}
      select(){return this} eq(k,v){this.filters[k]=v;return this} neq(){return this} order(){return this} limit(){return this}
      maybeSingle(){if(this.table==='trainer_clients')return Promise.resolve({data:{trainer_id:'trainer-1',fitness_enabled:true,boxing_enabled:false,status:'active',created_at:new Date().toISOString()},error:null});return Promise.resolve({data:null,error:null})}
      then(resolve,reject){let data=[];if(this.table==='client_packages')data=[{id:'pack-1',training_type:'personal',package_name:'Блок 10',total_sessions:10,used_sessions:3,status:'active',expires_at:null}];return Promise.resolve({data,error:null}).then(resolve,reject)}
    }
    const rpc=async(name,args={})=>{
      if(name==='client_calendar_programs')return {data:[{program_id:'program-1',program_name:'Ягодицы + плечи',description:'Тест',day_label:'День A',trainer_id:'trainer-1'}],error:null};
      if(name==='client_calendar_busy'){
        const from=new Date(args.p_from);const busy=new Date(from);busy.setDate(busy.getDate()+2);busy.setHours(10,0,0,0);const other={event_id:null,starts_at:busy.toISOString(),ends_at:new Date(busy.getTime()+55*60000).toISOString(),is_mine:false,assignment_id:null,program_name:null,day_label:null,training_type:null,status:'busy'};
        return {data:[other,...window.__mock.busy],error:null};
      }
      if(name==='client_self_book_workout'){
        window.__mock.bookArgs=args;const start=new Date(args.p_starts_at);window.__mock.busy=[{event_id:'event-1',starts_at:start.toISOString(),ends_at:new Date(start.getTime()+55*60000).toISOString(),is_mine:true,assignment_id:'assignment-1',program_name:'Ягодицы + плечи',day_label:'День A',training_type:args.p_training_type,status:'scheduled'}];return {data:[{event_id:'event-1',assignment_id:'assignment-1',payment_mode:'package',package_id:'pack-1'}],error:null};
      }
      if(name==='client_calendar_workout')return {data:{assignment_id:'assignment-1',program_id:'program-1',program_name:'Ягодицы + плечи',day_label:'День A',scheduled_date:'2026-08-25',starts_at:window.__mock.busy[0]?.starts_at||new Date().toISOString(),completed:window.__mock.completed,exercises:[{exercise_id:'ex-1',name:'Ягодичный мост',category:'Ягодицы',target_sets:3,target_weight:null,notes:'',weights:window.__mock.saves.length?[20,20,20]:[]},{exercise_id:'ex-2',name:'Махи в стороны',category:'Плечи',target_sets:2,target_weight:null,notes:'',weights:window.__mock.saves.length?[8,8]:[]}]},error:null};
      if(name==='client_save_calendar_workout'){window.__mock.saves.push(args);if(args.p_complete){window.__mock.completed=true;if(window.__mock.busy[0])window.__mock.busy[0].status='completed'}return {data:{session_id:'session-1',completed:Boolean(args.p_complete)},error:null};}
      return {data:null,error:{message:'Unknown rpc '+name}};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'client-1'}}}})},from:t=>new Query(t),rpc};
    window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('client-calendar-v206.js','utf8')});
  await page.waitForSelector('#nav [data-page="client-calendar"]');
  if(await page.locator('#nav [data-page="client-calendar"]').count()!==1)throw new Error('Calendar nav duplicated');
  await page.locator('#nav [data-page="client-calendar"]').click();
  await page.waitForSelector('#dfcCalendarBody .dfc-week');
  if((await page.locator('#main h1').innerText()).trim()!=='Календарь')throw new Error('Calendar page did not open');

  const days=page.locator('[data-dfc-day]');let chosen=false;
  for(let i=0;i<await days.count();i++){
    await days.nth(i).click();
    const free=page.locator('.dfc-slot.free:not([disabled]');
    if(await free.count()){await free.first().click();chosen=true;break}
  }
  if(!chosen)throw new Error('No future free slot found in test week');
  await page.waitForSelector('#dfcModal.open');
  if(!/Ягодицы \+ плечи/.test(await page.locator('#dfcProgramPick').innerText()))throw new Error('Assigned trainer template missing');
  const typeText=await page.locator('#dfcTypePick').innerText();if(!typeText.includes('Персональная')||typeText.includes('Бокс'))throw new Error('Training directions were not respected');
  await page.locator('#dfcBook').click();
  await page.waitForSelector('[data-dfc-own="assignment-1"]');
  const book=await page.evaluate(()=>window.__mock.bookArgs);if(!book||book.p_program_id!=='program-1'||book.p_training_type!=='personal')throw new Error('Self booking RPC payload is wrong');

  await page.locator('[data-dfc-own="assignment-1"]').click();
  await page.waitForSelector('.dfc-diary .dfc-ex');
  if(await page.locator('.dfc-ex').count()!==2)throw new Error('Diary exercises missing');
  const inputs=page.locator('.dfc-set input');for(let i=0;i<await inputs.count();i++)await inputs.nth(i).fill(i<3?'20':'8');
  await page.locator('#dfcSaveDiary').click();
  await page.waitForFunction(()=>window.__mock.saves.length>=1);
  let first=await page.evaluate(()=>window.__mock.saves[0]);if(first.p_complete!==false||first.p_sets.length!==2||first.p_sets[0].weights.length!==3)throw new Error('Diary draft payload is wrong');
  await page.locator('#dfcCompleteDiary').click();
  await page.waitForFunction(()=>window.__mock.completed===true);
  await page.waitForSelector('.dfc-readonly');
  const complete=await page.evaluate(()=>window.__mock.saves.at(-1));if(complete.p_complete!==true)throw new Error('Diary completion was not saved');
  if(await page.locator('#dfcCompleteDiary').count())throw new Error('Completed diary is still editable');
  const width=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(width.scroll>width.inner+2)throw new Error(`Horizontal overflow: ${JSON.stringify(width)}`);
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit client calendar v206 mobile integration test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
