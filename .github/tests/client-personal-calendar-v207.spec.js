const fs=require('fs');
const {chromium}=require('playwright-core');
(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent('<!doctype html><html><head></head><body style="margin:0;background:#090b0a;color:#fff"><div id="app"><header><div id="roleBadge">КЛИЕНТ</div></header><main id="main"><h1>Главная</h1></main></div><nav id="nav"><button data-page="home">Главная</button><button data-page="progress">Прогресс</button><button data-page="profile">Профиль</button></nav><div id="toast"></div></body></html>');
  await page.evaluate(()=>{
    window.__mock={entries:[],saved:[],calls:[],completed:false};
    const rpc=async(name,args={})=>{
      window.__mock.calls.push(name);
      if(['client_calendar_busy','client_self_book_workout','client_calendar_programs','client_calendar_workout','client_save_calendar_workout'].includes(name))return {data:null,error:{message:'OLD_RPC_CALLED'}};
      if(name==='client_self_calendar_templates')return {data:[{program_id:'p1',program_name:'Ягодицы + плечи',description:'',day_label:'День A',trainer_id:'t1'}],error:null};
      if(name==='client_self_calendar_entries')return {data:window.__mock.entries,error:null};
      if(name==='client_create_self_workout'){window.__mock.entries=[{id:'self1',planned_at:args.p_planned_at,status:'planned',program_name:'Ягодицы + плечи',day_label:args.p_day_label,workout_session_id:null}];return {data:'self1',error:null};}
      if(name==='client_self_workout_detail')return {data:{id:'self1',planned_at:window.__mock.entries[0]?.planned_at||new Date(Date.now()+86400000).toISOString(),status:window.__mock.completed?'completed':'planned',program_id:'p1',program_name:'Ягодицы + плечи',day_label:'День A',completed:window.__mock.completed,exercises:[{exercise_id:'e1',name:'Ягодичный мост',category:'Ягодицы',target_sets:3,target_reps:'10',target_weight:null,notes:'',sets:window.__mock.saved.length?[{set_number:1,weight:20,reps:10},{set_number:2,weight:22.5,reps:10},{set_number:3,weight:25,reps:8}]:[]},{exercise_id:'e2',name:'Махи в стороны',category:'Плечи',target_sets:2,target_reps:'12',target_weight:null,notes:'',sets:[]}]},error:null};
      if(name==='client_save_self_workout'){window.__mock.saved.push(args.p_sets);if(args.p_complete){window.__mock.completed=true;window.__mock.entries[0].status='completed'}return {data:{session_id:'s1',completed:args.p_complete},error:null};}
      if(name==='client_cancel_self_workout')return {data:true,error:null};
      return {data:null,error:{message:'UNKNOWN_RPC_'+name}};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'client1'}}}})},rpc};
    window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('client-personal-calendar-v207.js','utf8')});
  await page.waitForSelector('#nav [data-page="client-calendar"]');
  if(await page.locator('#nav [data-page="client-calendar"]').count()!==1)throw new Error('Calendar nav duplicated');
  await page.locator('#nav [data-page="client-calendar"]').click();
  await page.waitForSelector('.dpc-days');
  if(!/личный календарь/i.test(await page.locator('.dpc-note').innerText()))throw new Error('Personal calendar notice missing');
  if(!/не занимает время тренера/i.test(await page.locator('.dpc-note').innerText()))throw new Error('Trainer schedule separation missing');
  let chosen=false;const days=page.locator('[data-dpc-day]');
  for(let i=0;i<await days.count();i++){await days.nth(i).click();const slot=page.locator('[data-dpc-slot]:not([disabled])');if(await slot.count()){await slot.first().click();chosen=true;break}}
  if(!chosen){await page.locator('#dpcNext').click();await page.waitForSelector('.dpc-days');const ds=page.locator('[data-dpc-day]');for(let i=0;i<await ds.count();i++){await ds.nth(i).click();const slot=page.locator('[data-dpc-slot]:not([disabled])');if(await slot.count()){await slot.first().click();chosen=true;break}}}
  if(!chosen)throw new Error('No future personal slot found');
  await page.waitForSelector('#dpcModal.open');
  if(!/Ягодицы \+ плечи/.test(await page.locator('#dpcProgram').innerText()))throw new Error('Trainer template missing');
  await page.locator('#dpcAdd').click();await page.waitForSelector('[data-dpc-entry="self1"]');
  const calls=await page.evaluate(()=>window.__mock.calls);if(calls.some(x=>x.startsWith('client_calendar_')||x==='client_self_book_workout'||x==='client_save_calendar_workout'))throw new Error('Old trainer-booking RPC was called');
  await page.locator('[data-dpc-entry="self1"]').click();await page.waitForSelector('.dpc-diary .dpc-ex');
  if(await page.locator('.dpc-ex').count()!==2)throw new Error('Diary exercises missing');
  const first=page.locator('.dpc-ex').first();if(await first.locator('.dpc-set').count()!==3)throw new Error('Planned sets not rendered');
  await first.locator('.dpc-w').nth(0).fill('20');await first.locator('.dpc-r').nth(0).fill('10');
  await first.locator('.dpc-w').nth(1).fill('22,5');await first.locator('.dpc-r').nth(1).fill('10');
  await first.locator('.dpc-w').nth(2).fill('25');await first.locator('.dpc-r').nth(2).fill('8');
  await page.locator('#dpcSave').click();await page.waitForFunction(()=>window.__mock.saved.length>=1);
  const payload=await page.evaluate(()=>window.__mock.saved[0]);if(payload[0].sets.length!==3||payload[0].sets[1].weight!=='22,5'||payload[0].sets[2].reps!=='8')throw new Error('Diary payload wrong');
  await page.locator('#dpcFinish').click();await page.waitForFunction(()=>window.__mock.completed===true);await page.waitForSelector('.dpc-readonly');
  if(await page.locator('#dpcSave').count())throw new Error('Completed diary still editable');
  const size=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(size.scroll>size.inner+2)throw new Error('Horizontal overflow '+JSON.stringify(size));
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit client personal calendar v207: PASS');
})().catch(e=>{console.error(e);process.exit(1)});