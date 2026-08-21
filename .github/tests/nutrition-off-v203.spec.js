const fs=require('fs');
const {chromium}=require('playwright-core');
(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent(`<!doctype html><html><body>
    <div id="auth"><div class="invite-benefits"><span>Тренировки</span><span>Питание</span><span>Прогресс</span></div></div>
    <nav id="nav"><button data-page="home">Главная</button><button data-page="meals">Питание</button></nav>
    <main id="main">
      <select id="clientCoachingMode"><option value="mixed" selected>mixed</option></select>
      <input id="clientWeeklySessions" value="3"><input id="clientCardioWeek" value="2"><input id="clientCardioMinutes" value="30">
      <div class="section-title">Питание</div><div class="card" id="nutritionCard">БЖУ</div>
      <button id="saveClientPlan">Сохранить ведение, кардио и питание</button>
      <p>Шесть недель программы, шаблоны упражнений и БЖУ клиентов.</p>
      <section class="o181-macro-card">Питание · БЖУ</section>
    </main><div id="toast" class="toast hidden"></div>
  </body></html>`);
  await page.evaluate(()=>{
    const store=new Map([['df_v201_client','client-1']]);Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))}});
    window.__updates=[];
    class Q{constructor(t){this.t=t;this.patch=null;this.f={}}update(p){this.patch=p;return this}eq(k,v){this.f[k]=v;return this}then(r,j){window.__updates.push({table:this.t,patch:this.patch,filters:this.f});return Promise.resolve({data:null,error:null}).then(r,j)}}
    window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{id:'trainer-1'}}}})},from:t=>new Q(t)})};
  });
  await page.addScriptTag({content:fs.readFileSync('nutrition-off-v203.js','utf8')});
  await page.waitForTimeout(100);
  if(await page.locator('[data-page="meals"]').count())throw new Error('Meals nav still visible');
  if(await page.locator('#nutritionCard').count())throw new Error('Nutrition card still visible');
  if(await page.locator('.o181-macro-card').count())throw new Error('Online macro card still visible');
  if(await page.locator('.invite-benefits span', {hasText:'Питание'}).count())throw new Error('Invite still mentions nutrition');
  const text=await page.locator('#main').innerText();if(/БЖУ|Питание/.test(text))throw new Error('Nutrition copy still visible: '+text);
  if((await page.locator('#saveClientPlan').innerText()).trim()!=='Сохранить ведение и кардио')throw new Error('Save button label not updated');
  await page.locator('#saveClientPlan').click();await page.waitForTimeout(50);
  const updates=await page.evaluate(()=>window.__updates);
  if(updates.length!==1||updates[0].table!=='trainer_clients')throw new Error('Wrong save target');
  if('protein_g' in updates[0].patch||'fat_g' in updates[0].patch||'carbs_g' in updates[0].patch)throw new Error('Nutrition fields were written');
  if(errors.length)throw new Error(errors.join(' | '));
  await browser.close();console.log('Nutrition removal v203: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
