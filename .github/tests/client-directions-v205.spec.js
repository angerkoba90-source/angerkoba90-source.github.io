const fs=require('fs');
const {chromium}=require('playwright-core');

function mockScript(role,relation,packages=[]){return `
window.__relation=${JSON.stringify(relation)};
window.__packages=${JSON.stringify(packages)};
window.__role=${JSON.stringify(role)};
class Q{
  constructor(t){this.t=t;this.f={};this.op='select';this.patch=null;}
  select(){return this} eq(k,v){this.f[k]=v;return this} neq(k,v){this.f['!'+k]=v;return this} order(){return this} limit(){return this}
  update(p){this.op='update';this.patch=p;return this}
  maybeSingle(){return this}
  then(resolve,reject){let data=null,error=null;
    if(this.t==='user_roles') data={role:window.__role};
    else if(this.t==='trainer_clients'){
      if(this.op==='update'){Object.assign(window.__relation,this.patch);data=[window.__relation]}
      else data=window.__relation;
    } else if(this.t==='client_packages') data=window.__packages.filter(x=>this.f.status===undefined||x.status===this.f.status);
    return Promise.resolve({data,error}).then(resolve,reject)
  }
}
const db={auth:{getSession:async()=>({data:{session:{user:{id:window.__role==='trainer'?'trainer-1':'client-1',is_anonymous:false}}}})},from:t=>new Q(t)};
window.supabase={createClient:()=>db};
`}

(async()=>{
 const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 const code=fs.readFileSync('client-directions-v205.js','utf8');

 // Trainer card: fitness only -> then boxing only.
 const p=await browser.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.setContent('<!doctype html><html><head></head><body><main id="main"><button id="client" data-client="client-1">Дарья</button></main></body></html>');
 await p.addScriptTag({content:mockScript('trainer',{trainer_id:'trainer-1',client_id:'client-1',status:'active',fitness_enabled:true,boxing_enabled:false})});
 await p.evaluate(()=>{document.getElementById('client').onclick=()=>{document.getElementById('main').innerHTML=`<button id="assignFromClient">Назначить</button><div class="section-title">Формат ведения</div><div class="card">Формат</div><div class="section-title">Остаток тренировок</div><div class="card client-balance-card"><div class="grid2"><div class="metric balance-metric"><span>Персональные</span><strong>5</strong></div><div class="metric balance-metric"><span>Сплит</span><strong>2</strong></div><div class="metric balance-metric"><span>Бокс · ПТ</span><strong>7</strong></div><div class="metric balance-metric"><span>Бокс · сплит</span><strong>3</strong></div></div></div><select id="packageType"><option value="personal">Персональная</option><option value="split">Сплит</option><option value="boxing_personal">Бокс ПТ</option><option value="boxing_split">Бокс сплит</option></select><button id="addPackage">Добавить</button>`}});
 await p.addScriptTag({content:code});await p.locator('#client').click();await p.waitForSelector('#dfv205DirectionsSection');
 if(!(await p.locator('#dfv205Fitness').isChecked()))throw new Error('Fitness should be checked');
 if(await p.locator('#dfv205Boxing').isChecked())throw new Error('Boxing should be unchecked');
 const vis1=await p.locator('.balance-metric').evaluateAll(rows=>rows.map(r=>({t:r.innerText,d:getComputedStyle(r).display})));if(vis1.filter(x=>/Бокс/.test(x.t)&&x.d!=='none').length)throw new Error('Boxing balances visible for fitness-only client');
 const disabled=await p.locator('#packageType option').evaluateAll(o=>o.filter(x=>x.value.startsWith('boxing')).every(x=>x.disabled));if(!disabled)throw new Error('Boxing package types should be disabled');
 await p.locator('#dfv205Fitness').uncheck();await p.locator('#dfv205Boxing').check();await p.locator('#dfv205Save').click();await p.waitForTimeout(100);
 const rel=await p.evaluate(()=>window.__relation);if(rel.fitness_enabled!==false||rel.boxing_enabled!==true)throw new Error('Directions were not saved');
 const vis2=await p.locator('.balance-metric').evaluateAll(rows=>rows.map(r=>({t:r.innerText,d:getComputedStyle(r).display})));if(vis2.filter(x=>!/Бокс/.test(x.t)&&x.d!=='none').length)throw new Error('Fitness balances visible for boxing-only client');

 // Client front screen: only boxing balances and packages remain.
 const c=await browser.newPage({viewport:{width:390,height:844}});const cErrors=[];c.on('pageerror',e=>cErrors.push(String(e)));
 await c.setContent('<!doctype html><html><head></head><body><main id="main"><h1>Привет, Дарья</h1><div class="section-title">Остаток тренировок</div><div class="card client-balance-card"><div class="grid2"><div class="metric balance-metric"><span>Персональные</span><strong>5</strong></div><div class="metric balance-metric"><span>Сплит</span><strong>2</strong></div><div class="metric balance-metric"><span>Бокс · ПТ</span><strong>7</strong></div><div class="metric balance-metric"><span>Бокс · сплит</span><strong>3</strong></div></div></div></main></body></html>');
 await c.addScriptTag({content:mockScript('client',{trainer_id:'trainer-1',client_id:'client-1',status:'active',fitness_enabled:false,boxing_enabled:true},[
 {training_type:'personal',package_name:'Блок 5 · Персональная',total_sessions:5,used_sessions:1,status:'active'},
 {training_type:'boxing_personal',package_name:'Блок 10 · Бокс ПТ',total_sessions:10,used_sessions:3,status:'active'},
 {training_type:'boxing_split',package_name:'Блок 5 · Бокс сплит',total_sessions:5,used_sessions:2,status:'active'}
 ])});
 await c.addScriptTag({content:code});await c.waitForFunction(()=>document.querySelector('.client-balance-card')?.dataset.v205==='01');
 const labels=await c.locator('.client-balance-card .balance-metric span').allTextContents();if(labels.join('|')!=='Бокс · ПТ|Бокс · сплит')throw new Error('Client front screen has wrong balance metrics: '+labels.join('|'));
 const text=await c.locator('.client-balance-card').innerText();if(text.includes('Персональная'))throw new Error('Fitness package leaked into boxing-only client screen');if(!text.includes('Блок 10 · Бокс ПТ'))throw new Error('Boxing package missing');
 if(errors.length||cErrors.length)throw new Error('Browser errors: '+errors.concat(cErrors).join(' | '));
 await browser.close();console.log('DenisFit client directions v205 integration test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
