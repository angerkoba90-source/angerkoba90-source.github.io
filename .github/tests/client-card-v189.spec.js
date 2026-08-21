const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setContent(`<!doctype html><html><body><main id="main"><button id="assignFromClient">Назначить</button><button id="addTemplateFromClient">Добавить шаблон</button><button id="saveClientPlan">Сохранить</button><label class="online-toggle"><input type="checkbox"><span><b>🌐 Онлайн ведение</b></span></label><label class="online-toggle"><input type="checkbox" checked><span><b>🌐 Онлайн ведение</b></span></label><div class="section-title">Программы</div><div class="card legacy-program">Старое отображение</div><button id="deleteClient">Удалить клиента</button></main></body></html>`);
  await page.evaluate(()=>{
    const store=new Map([['df_v188_client','client-1']]);
    Object.defineProperty(window,'sessionStorage',{configurable:true,value:{setItem:(k,v)=>store.set(k,String(v)),getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k)}});
    window.confirm=()=>true;window.__deleted=[];
    window.__programs=[{id:'p1',name:'Ноги',description:'Шаблон 1',active:true,client_id:'client-1',trainer_id:'trainer-1'},{id:'p2',name:'Спина',description:'Шаблон 2',active:true,client_id:'client-1',trainer_id:'trainer-1'}];
    class Query{
      constructor(table){this.table=table;this.filters={};this.op='select'}
      select(){this.op='select';return this} delete(){this.op='delete';return this} eq(k,v){this.filters[k]=v;return this} order(){return this}
      maybeSingle(){if(this.table==='user_roles')return Promise.resolve({data:{role:'trainer'},error:null});return Promise.resolve({data:null,error:null})}
      then(resolve,reject){let out={data:[],error:null};if(this.table==='training_programs'){
        if(this.op==='delete'){const before=window.__programs.length;window.__programs=window.__programs.filter(p=>Object.entries(this.filters).some(([k,v])=>p[k]!==v));if(window.__programs.length<before)window.__deleted.push(this.filters.id);out={data:null,error:null}}
        else out={data:window.__programs.filter(p=>Object.entries(this.filters).every(([k,v])=>p[k]===v)),error:null};
      }return Promise.resolve(out).then(resolve,reject)}
    }
    const db={auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1',is_anonymous:false}}}})},from:t=>new Query(t)};
    window.supabase={createClient:()=>db};
  });
  await page.addScriptTag({content:fs.readFileSync('client-card-v189.js','utf8')});
  await page.waitForSelector('#dfClientTemplatesManager [data-client-program-row]');
  const onlineCount=await page.locator('label.online-toggle').filter({hasText:'Онлайн ведение'}).count();if(onlineCount!==1)throw new Error(`Expected 1 online toggle, got ${onlineCount}`);
  if(!(await page.locator('label.online-toggle input').isChecked()))throw new Error('Online toggle state was not preserved');
  const addText=await page.locator('#addTemplateFromClient').innerText();if(!addText.includes('Добавить шаблон тренировки'))throw new Error(`Add button not renamed: ${addText}`);
  if(await page.locator('.legacy-program').count())throw new Error('Legacy program card was not replaced');
  const before=await page.locator('[data-client-program-row]').count();if(before!==2)throw new Error(`Expected 2 programs, got ${before}`);
  await page.locator('[data-remove-client-program]').first().click();await page.waitForTimeout(100);
  const after=await page.locator('[data-client-program-row]').count();if(after!==1)throw new Error(`Expected 1 program after delete, got ${after}`);
  const deleted=await page.evaluate(()=>window.__deleted.length);if(deleted!==1)throw new Error(`Expected one delete call, got ${deleted}`);
  if(errors.length)throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await browser.close();console.log('DenisFit client-card v189 test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
