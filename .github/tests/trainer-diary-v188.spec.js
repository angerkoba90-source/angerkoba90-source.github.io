const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;
  if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',msg=>{if(msg.type()==='error')pageErrors.push(msg.text())});
  await page.setContent(`<!doctype html><html><body><main id="main"></main><nav><button data-page="schedule">Расписание</button></nav></body></html>`);
  await page.evaluate(()=>{
    window.__calls=[];
    window.__scheduleClicks=0;
    window.__state={assignmentMode:'exists'};
    document.querySelector('[data-page="schedule"]').addEventListener('click',()=>window.__scheduleClicks++);
    const resultFor=(table,filters,mode)=>{
      if(table==='profiles')return {data:{full_name:'Тест Клиент'},error:null};
      if(table==='program_templates')return {data:[{id:'tpl-1',name:'Спина',description:'Тест',template_exercises:[
        {id:'te1',exercise_id:'ex-1',day_label:'Тренировка',sort_order:1,target_sets:3,target_reps:'10',target_rpe:8,notes:null},
        {id:'te2',exercise_id:'ex-2',day_label:'Тренировка',sort_order:2,target_sets:2,target_reps:'12',target_rpe:8,notes:null}
      ]}],error:null};
      if(table==='schedule_events'){
        if(filters.id==='event-1')return {data:{id:'event-1',starts_at:'2026-08-22T15:00:00.000Z',training_type:'personal'},error:null};
        return {data:[],error:null};
      }
      if(table==='assigned_workouts'){
        if(mode==='single')return {data:{id:'assign-1',client_id:'client-1',program_id:'prog-1',program_name:'Спина',day_label:'Тренировка',scheduled_date:'2026-08-22',workout_session_id:null,schedule_event_id:'event-1'},error:null};
        if(window.__state.assignmentMode==='exists')return {data:[{id:'assign-1',program_id:'prog-1'}],error:null};
        return {data:[],error:null};
      }
      if(table==='program_exercises')return {data:[
        {exercise_id:'ex-1',target_sets:3,target_weight:null,sort_order:1,exercises:{name:'Тяга верхнего блока'}},
        {exercise_id:'ex-2',target_sets:2,target_weight:null,sort_order:2,exercises:{name:'Жим гантелей'}}
      ],error:null};
      if(table==='workout_sessions')return {data:null,error:null};
      if(table==='workout_sets')return {data:[],error:null};
      return {data:[],error:null};
    };
    class Query{
      constructor(table){this.table=table;this.filters={};this.mode='list'}
      select(){return this} eq(k,v){this.filters[k]=v;return this} neq(){return this} order(){return this} limit(){return this} lt(){return this} gt(){return this}
      single(){this.mode='single';return Promise.resolve(resultFor(this.table,this.filters,'single'))}
      maybeSingle(){this.mode='single';return Promise.resolve(resultFor(this.table,this.filters,'single'))}
      then(resolve,reject){return Promise.resolve(resultFor(this.table,this.filters,this.mode)).then(resolve,reject)}
    }
    const db={
      auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}},error:null})},
      from:table=>new Query(table),
      rpc:async(name,args)=>{
        window.__calls.push({name,args});
        if(name==='trainer_client_exercise_progress')return {data:[
          {exercise_id:'ex-1',exercise_name:'Тяга верхнего блока',first_avg:40,last_avg:50,progress_pct:25,session_count:2,last_performed_at:'2026-08-20T10:00:00Z'},
          {exercise_id:'ex-2',exercise_name:'Жим гантелей',first_avg:20,last_avg:25,progress_pct:25,session_count:2,last_performed_at:'2026-08-20T10:00:00Z'}
        ],error:null};
        if(name==='trainer_latest_exercise_sets')return {data:[
          {exercise_id:'ex-1',session_id:'old-1',set_number:1,weight:45,performed_at:'2026-08-20T10:00:00Z'},
          {exercise_id:'ex-1',session_id:'old-1',set_number:2,weight:50,performed_at:'2026-08-20T10:00:00Z'},
          {exercise_id:'ex-1',session_id:'old-1',set_number:3,weight:50,performed_at:'2026-08-20T10:00:00Z'},
          {exercise_id:'ex-2',session_id:'old-1',set_number:1,weight:22.5,performed_at:'2026-08-20T10:00:00Z'},
          {exercise_id:'ex-2',session_id:'old-1',set_number:2,weight:25,performed_at:'2026-08-20T10:00:00Z'}
        ],error:null};
        if(name==='assign_trainer_workout_from_template')return {data:[{schedule_event_id:'event-new',assignment_id:'assign-new',program_id:'prog-new'}],error:null};
        if(name==='attach_trainer_template_to_schedule_event')return {data:[{assignment_id:'assign-1',program_id:'prog-1'}],error:null};
        if(name==='save_trainer_workout_diary')return {data:[{workout_session_id:'session-new',saved_sets:5}],error:null};
        return {data:[],error:null};
      }
    };
    window.supabase={createClient:()=>db};
  });

  const source=fs.readFileSync('trainer-diary-v188.js','utf8');
  await page.addScriptTag({content:source});
  await page.evaluate(()=>window.dispatchEvent(new Event('load')));

  // Client card -> progress + assignment modal.
  await page.evaluate(()=>{document.querySelector('#main').innerHTML='<button data-client="client-1">Открыть клиента</button>'});
  await page.click('[data-client="client-1"]');
  await page.evaluate(()=>{document.querySelector('#main').innerHTML='<div class="client-actions-grid"><button id="assignFromClient">Назначить тренировку</button></div>'});
  await page.waitForSelector('#dfdClientProgress .dfd-progress-row');
  const progressCount=await page.locator('#dfdClientProgress .dfd-progress-row').count();
  if(progressCount!==2)throw new Error(`Expected 2 progress rows, got ${progressCount}`);
  if(!(await page.locator('#dfdClientProgress').innerText()).includes('+25%'))throw new Error('Progress percentage not rendered');

  await page.click('#assignFromClient');
  await page.waitForSelector('#dfdModal.open');
  await page.fill('#dfdDate','2026-08-23');
  await page.fill('#dfdTime','19:00');
  await page.click('#dfdAssign');
  await page.waitForTimeout(150);
  const assignCall=await page.evaluate(()=>window.__calls.find(x=>x.name==='assign_trainer_workout_from_template'));
  if(!assignCall)throw new Error('Assign RPC was not called');
  if(assignCall.args.p_scheduled_date!=='2026-08-23')throw new Error('Assignment date mismatch');
  if(!String(assignCall.args.p_starts_at).includes('2026-08-23'))throw new Error('Assignment start mismatch');

  // Schedule -> existing assignment -> diary with previous per-set weights.
  await page.evaluate(()=>{window.__state.assignmentMode='exists';document.querySelector('#main').innerHTML='<div class="schedule-event">ПТ<button data-open-schedule-client="event-1|client-1">Клиент</button></div>'});
  await page.click('[data-open-schedule-client]');
  await page.waitForSelector('.dfd-diary');
  const exercises=await page.locator('.dfd-exercise').count();
  if(exercises!==2)throw new Error(`Expected 2 diary exercises, got ${exercises}`);
  const firstValues=await page.locator('.dfd-exercise').first().locator('input').evaluateAll(nodes=>nodes.map(n=>n.value));
  if(firstValues.join(',')!=='45,50,50')throw new Error(`Previous weights not prefilled: ${firstValues.join(',')}`);
  const widthOk=await page.evaluate(()=>document.documentElement.scrollWidth<=390);
  if(!widthOk)throw new Error(`Mobile layout overflow: ${await page.evaluate(()=>document.documentElement.scrollWidth)}px`);

  await page.locator('.dfd-exercise').first().locator('input').nth(0).fill('50');
  await page.locator('.dfd-exercise').first().locator('input').nth(1).fill('55');
  await page.locator('.dfd-exercise').first().locator('input').nth(2).fill('60');
  await page.locator('.dfd-exercise').nth(1).locator('input').nth(0).fill('30');
  await page.locator('.dfd-exercise').nth(1).locator('input').nth(1).fill('35');
  await page.click('#dfdSave');
  await page.waitForTimeout(100);
  const saveCall=await page.evaluate(()=>window.__calls.filter(x=>x.name==='save_trainer_workout_diary').at(-1));
  if(!saveCall)throw new Error('Save RPC was not called');
  if(saveCall.args.p_sets.length!==5)throw new Error(`Expected 5 saved sets, got ${saveCall.args.p_sets.length}`);
  if(saveCall.args.p_sets[0].weight!==50||saveCall.args.p_sets[4].weight!==35)throw new Error('Saved weights mismatch');

  // Schedule without assignment -> template picker -> attach -> diary.
  await page.evaluate(()=>{window.__state.assignmentMode='missing';document.querySelector('#main').innerHTML='<div class="schedule-event">ПТ<button data-open-schedule-client="event-1|client-1">Клиент</button></div>'});
  await page.click('[data-open-schedule-client]');
  await page.waitForSelector('.dfd-picker [data-template]');
  await page.click('.dfd-picker [data-template]');
  await page.waitForSelector('.dfd-diary');
  const attachCall=await page.evaluate(()=>window.__calls.find(x=>x.name==='attach_trainer_template_to_schedule_event'));
  if(!attachCall)throw new Error('Attach-template RPC was not called');

  if(pageErrors.length)throw new Error(`Browser errors: ${pageErrors.join(' | ')}`);
  await page.screenshot({path:'denisfit-v188-mobile.png',fullPage:true});
  await browser.close();
  console.log('DenisFit v188 mobile integration test: PASS');
})().catch(err=>{console.error(err);process.exit(1)});
