const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('dialog',d=>d.accept());
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="main"><div class="schedule-event">ПТ<button id="scheduleClient" data-open-schedule-client="event-1|client-1">Дарья</button></div></main><nav><button data-page="schedule">Расписание</button></nav></body></html>');
  await page.addStyleTag({content:fs.readFileSync('trainer-diary-v187.css','utf8')});
  await page.evaluate(()=>{
    window.__calls=[];window.__scheduleClicks=0;
    document.querySelector('[data-page="schedule"]').addEventListener('click',()=>window.__scheduleClicks++);
    window.__assignment={id:'assign-1',trainer_id:'trainer-1',client_id:'client-1',program_id:'prog-1',program_name:'Спина',day_label:'Тренировка',status:'scheduled',scheduled_date:'2026-08-22',workout_session_id:null,schedule_event_id:'event-1',created_at:'2026-08-22T00:00:00Z'};
    window.__templates=[
      {id:'tpl-1',trainer_id:'trainer-1',name:'Ягодицы + плечи',description:'Низ + плечи',online_only:false,updated_at:'2026-08-22T00:00:00Z',template_exercises:[{day_label:'Тренировка',sort_order:1}]},
      {id:'tpl-2',trainer_id:'trainer-1',name:'Верх тела',description:'Спина и грудь',online_only:false,updated_at:'2026-08-21T00:00:00Z',template_exercises:[{day_label:'День A',sort_order:1},{day_label:'День B',sort_order:2}]}
    ];
    const resultFor=(table,filters,mode)=>{
      if(table==='profiles')return {data:{full_name:'Дарья'},error:null};
      if(table==='schedule_events')return {data:{id:'event-1',trainer_id:'trainer-1',starts_at:'2026-08-22T15:00:00.000Z',training_type:'personal',status:'scheduled'},error:null};
      if(table==='program_templates')return {data:window.__templates,error:null};
      if(table==='assigned_workouts'){
        if(mode==='single')return {data:{...window.__assignment},error:null};
        return {data:window.__assignment.status==='cancelled'?[]:[{...window.__assignment}],error:null};
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
      select(){return this}eq(k,v){this.filters[k]=v;return this}neq(){return this}order(){return this}limit(){return this}lt(){return this}gt(){return this}
      single(){this.mode='single';return Promise.resolve(resultFor(this.table,this.filters,'single'))}
      maybeSingle(){this.mode='single';return Promise.resolve(resultFor(this.table,this.filters,'single'))}
      then(resolve,reject){return Promise.resolve(resultFor(this.table,this.filters,this.mode)).then(resolve,reject)}
    }
    const rpc=async(name,args)=>{
      window.__calls.push({name,args});
      if(name==='trainer_apply_template_to_schedule_event'){
        const tpl=window.__templates.find(t=>t.id===args.p_template_id);window.__assignment.program_id='prog-2';window.__assignment.program_name=tpl.name;window.__assignment.day_label=args.p_day_label;return {data:[{assignment_id:'assign-1',program_id:'prog-2',program_name:tpl.name,day_label:args.p_day_label}],error:null};
      }
      if(name==='trainer_remove_template_from_schedule_event'){window.__assignment.status='cancelled';return {data:[{removed:true}],error:null};
      }
      if(name==='trainer_client_exercise_progress')return {data:[],error:null};
      if(name==='trainer_latest_exercise_sets')return {data:[
        {exercise_id:'ex-1',session_id:'old',set_number:1,weight:45,performed_at:'2026-08-20T10:00:00Z'},
        {exercise_id:'ex-1',session_id:'old',set_number:2,weight:50,performed_at:'2026-08-20T10:00:00Z'},
        {exercise_id:'ex-1',session_id:'old',set_number:3,weight:50,performed_at:'2026-08-20T10:00:00Z'},
        {exercise_id:'ex-2',session_id:'old',set_number:1,weight:20,performed_at:'2026-08-20T10:00:00Z'},
        {exercise_id:'ex-2',session_id:'old',set_number:2,weight:22.5,performed_at:'2026-08-20T10:00:00Z'}
      ],error:null};
      if(name==='save_trainer_workout_diary')return {data:[{workout_session_id:'session-1',saved_sets:5}],error:null};
      return {data:[],error:null};
    };
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t),rpc};window.supabase={createClient:()=>db};
  });

  // Production order is critical: v211 must register before the legacy diary capture handler.
  await page.addScriptTag({content:fs.readFileSync('schedule-trainer-v211.js','utf8')});
  await page.addScriptTag({content:fs.readFileSync('trainer-diary-v188.js','utf8')});
  await page.evaluate(()=>window.dispatchEvent(new Event('load')));

  await page.locator('#scheduleClient').click();
  await page.waitForSelector('[data-v211-menu]');
  if(await page.locator('.dfd-diary').count())throw new Error('Legacy handler bypassed v211 menu and opened diary directly');
  if((await page.locator('#dfv211AddTemplate').innerText()).trim()!=='＋ Добавить шаблон тренировки')throw new Error('Add-template action missing');
  if((await page.locator('#dfv211OpenWorkout').innerText()).trim()!=='Открыть тренировку →')throw new Error('Open-workout action missing');
  if(await page.locator('#dfv211OpenWorkout').isDisabled())throw new Error('Open workout must be enabled for existing template');

  await page.locator('#dfv211AddTemplate').click();await page.waitForSelector('[data-v211-picker]');
  const pickerText=await page.locator('[data-v211-picker]').innerText();
  if(!pickerText.includes('Ягодицы + плечи')||!pickerText.includes('Верх тела'))throw new Error('Not all templates are shown');
  await page.locator('[data-v211-template="tpl-2"][data-v211-day="День B"]').click();
  await page.waitForSelector('[data-v211-menu]');
  const apply=await page.evaluate(()=>window.__calls.find(x=>x.name==='trainer_apply_template_to_schedule_event'));
  if(!apply||apply.args.p_template_id!=='tpl-2'||apply.args.p_day_label!=='День B')throw new Error('Template apply RPC payload is wrong');
  if(!(await page.locator('.dfv211-menu-note').innerText()).includes('Верх тела'))throw new Error('Menu did not refresh selected template');

  await page.locator('#dfv211OpenWorkout').click();
  await page.waitForSelector('.dfd-diary');
  await page.waitForSelector('#dfv211DeleteTemplate');
  const isLast=await page.evaluate(()=>document.querySelector('.dfd-diary')?.lastElementChild?.id==='dfv211DeleteZone');
  if(!isLast)throw new Error('Delete-template control is not the last diary block');
  const bottomText=(await page.locator('#dfv211DeleteTemplate').innerText()).trim();if(bottomText!=='Удалить шаблон')throw new Error('Wrong bottom delete label');
  const width=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));if(width.scroll>width.inner+2)throw new Error('Horizontal overflow');

  await page.locator('#dfv211DeleteTemplate').click();
  await page.waitForFunction(()=>window.__calls.some(x=>x.name==='trainer_remove_template_from_schedule_event'));
  const remove=await page.evaluate(()=>window.__calls.find(x=>x.name==='trainer_remove_template_from_schedule_event'));
  if(remove.args.p_event_id!=='event-1'||remove.args.p_client_id!=='client-1')throw new Error('Wrong remove RPC payload');
  await page.waitForFunction(()=>window.__scheduleClicks>0);
  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  await browser.close();console.log('DenisFit production-order schedule trainer v211: PASS');
})().catch(e=>{console.error(e);process.exit(1)});