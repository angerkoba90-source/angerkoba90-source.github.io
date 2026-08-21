const fs=require('fs');
const {chromium}=require('playwright-core');

(async()=>{
  const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('CHROME_PATH is required');
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setContent(`<!doctype html><html><body><main id="main"><section id="dfdClientProgress"><div class="dfd-progress-row"><div><b>Высокая тяга каната к груди</b><span>12 кг → 12 кг · ср. рабочий вес · 1 трен.</span></div><strong>0%</strong></div><div class="dfd-progress-row"><div><b>Жим лёжа</b><span>40 кг → 50 кг · ср. рабочий вес · 3 трен.</span></div><strong class="up">+25%</strong></div></section></main></body></html>`);
  await page.addScriptTag({content:fs.readFileSync('trainer-progress-v190.js','utf8')});
  await page.waitForTimeout(60);
  const rows=page.locator('.dfd-progress-row');
  const firstText=await rows.nth(0).locator('span').innerText();
  const firstBadge=await rows.nth(0).locator('strong').innerText();
  if(!firstText.includes('стартовый рабочий вес'))throw new Error(`One-session row is not a start state: ${firstText}`);
  if(firstBadge!=='СТАРТ')throw new Error(`Expected СТАРТ, got ${firstBadge}`);
  const secondText=await rows.nth(1).locator('span').innerText();
  const secondBadge=await rows.nth(1).locator('strong').innerText();
  if(!secondText.includes('40 кг → 50 кг'))throw new Error('Multi-session progress text was changed');
  if(secondBadge!=='+25%')throw new Error('Multi-session percentage was changed');
  if(errors.length)throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await browser.close();console.log('DenisFit trainer-progress v190 test: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
