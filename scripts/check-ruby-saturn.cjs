const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const out=process.argv[2]||'.tmp/saturn-browser';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({...(process.env.RUBYSTAR_BROWSER?{executablePath:process.env.RUBYSTAR_BROWSER}:{channel:'msedge'}),headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve();};window.AudioContext=undefined;window.webkitAudioContext=undefined;localStorage.setItem('rubyStar.music','off');localStorage.setItem('rubyStar.keys.v1',JSON.stringify({version:1,bindings:{mapSkill:['Mouse1','KeyC'],laser:['Mouse0','KeyK']}}));});
  const page=await context.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/challenge/saturn?god=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).waitFor();
  for(const title of ['FROSTBITER','HAILER','GLACIER HULK','RECALL'])assert.equal(await page.getByText(title,{exact:true}).count(),1);
  await page.screenshot({path:path.join(out,'saturn-rules.png')});
  await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
  await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas:not([aria-hidden])');if(!canvas)return false;let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
   for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.gamePhase){window.__saturn=hook.memoizedState.current;return true;}return false;
  });
  await page.getByRole('button',{name:'Phase 1',exact:true}).click();
  await page.evaluate(()=>{const s=window.__saturn;Object.assign(s,{godMode:true,meteoriteTimer:1e6});s.saturn.iceTimer=1e6;s.frostIceTiles=[];document.activeElement?.blur();});
  const health=page.getByRole('meter',{name:'Frost Warden health',exact:true});await health.waitFor();
  await page.getByRole('meter',{name:'Next grant',exact:true}).waitFor();await page.getByRole('meter',{name:'Next recall',exact:true}).waitFor();
  assert.equal(await page.getByRole('img',{name:/^Ruby shield/}).count(),0,'no Ruby shield count in Saturn');
  const skill=await page.getByRole('button',{name:'Skill Ready',exact:true}).boundingBox(),ready=await page.getByRole('button',{name:'Zero Ready',exact:true}).boundingBox();assert.ok(Math.abs(skill.y-ready.y)<2);
  // C: Absolute Zero opens, the hourglass flips, and the skill goes on cooldown.
  await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('c');
  await page.waitForFunction(()=>!!window.__saturn.saturn.field);assert.ok(await page.evaluate(()=>window.__saturn.saturn.cooldown>0));
  await page.screenshot({path:path.join(out,'saturn-field.png')});
  await page.getByRole('button',{name:'Zero Ready',exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.cooldown),0);
  await page.getByRole('button',{name:'Recall Now',exact:true}).click();await page.waitForFunction(()=>window.__saturn.saturn.recallTimer<=90);
  await page.screenshot({path:path.join(out,'saturn-recall-hud.png')});
  await page.getByRole('button',{name:'Grant Now',exact:true}).click();await page.waitForFunction(()=>window.__saturn.saturn.grantTimer<=60);
  for(const phase of [2,3]){await page.getByRole('button',{name:`Phase ${phase}`,exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.phase),phase);}
  await page.setViewportSize({width:1024,height:768});await page.screenshot({path:path.join(out,'saturn-1024-hud.png')});
  const vitals=await page.locator('.rs-hud-vitals > div').evaluateAll(els=>Math.max(...els.map(el=>el.getBoundingClientRect().right))),guardian=await health.boundingBox();assert.ok(vitals<guardian.x,'vitals do not overlap guardian at 1024px');
  assert.deepEqual(errors,[]);console.log('Saturn rules, grant/recall HUD, Absolute Zero (C), God controls and phases passed.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
