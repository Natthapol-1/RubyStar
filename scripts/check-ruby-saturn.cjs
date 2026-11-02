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
  for(const title of ['SNOWBOWL','FROSTICLE','ICE CUB'])assert.equal(await page.getByText(title,{exact:true}).count(),1);
  await page.screenshot({path:path.join(out,'saturn-rules.png')});
  await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
  await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas:not([aria-hidden])');if(!canvas)return false;let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
   for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.gamePhase){window.__saturn=hook.memoizedState.current;return true;}return false;
  });
  await page.getByRole('button',{name:'Phase 1',exact:true}).click();
  await page.evaluate(()=>{const s=window.__saturn;Object.assign(s,{noMobs:true,godMode:true,meteoriteTimer:1e6,playerDirX:1,playerDirY:0});s.saturn.iceTimer=1e6;s.saturn.nextIce=[];s.frostIceTiles=[];s.saturn.iceWarning=0;const b=s.enemies.find(e=>e.id===s.saturn.bossId);Object.assign(b,{tileX:39,targetTileX:39,tileY:39,targetTileY:39,x:39.5*48,y:39.5*48});document.activeElement?.blur();});
  const health=page.getByRole('meter',{name:'Frost Warden health',exact:true});await health.waitFor();
  const snow=page.getByRole('img',{name:'Blizzard level 1 of 3',exact:true});await snow.waitFor();
  assert.equal(await snow.locator('svg').count(),1);assert.equal(await snow.locator('[data-active=true]').count(),1);
  const hb=await health.boundingBox(),sb=await snow.boundingBox();assert.ok(sb.x>hb.x+hb.width,'single snowflake is right of guardian HP');
  const skill=await page.getByRole('button',{name:'Skill Ready',exact:true}).boundingBox(),ready=await page.getByRole('button',{name:'Snowball Ready',exact:true}).boundingBox();assert.ok(Math.abs(skill.y-ready.y)<2);
  await page.getByRole('button',{name:'Blizzard +1',exact:true}).click();await page.getByRole('img',{name:'Blizzard level 2 of 3'}).waitFor();
  await page.getByRole('button',{name:'Blizzard +1',exact:true}).click();await page.getByRole('img',{name:'Blizzard level 3 of 3'}).waitFor();
  assert.equal(await page.getByRole('img',{name:'Blizzard level 3 of 3'}).locator('[data-active=true]').count(),3);
  await page.screenshot({path:path.join(out,'saturn-blizzard-3-hud.png')});
  await page.getByRole('button',{name:'Blizzard −1',exact:true}).click();await page.getByRole('img',{name:'Blizzard level 2 of 3'}).waitFor();
  await page.getByRole('button',{name:'Remove Shield',exact:true}).click();assert.deepEqual(await page.evaluate(()=>[window.__saturn.playerShieldHP,window.__saturn.rubyShieldHP]),[0,0]);
  await page.getByRole('button',{name:'Perma Shield',exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.permaShield),true);
  await page.getByRole('button',{name:'Remove Shield',exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.permaShield),false);
  await page.getByRole('button',{name:'Shield +40',exact:true}).click();await page.getByRole('img',{name:'Your shield: 40',exact:true}).waitFor();await page.getByRole('img',{name:'Ruby shield: 40',exact:true}).waitFor();
  await page.evaluate(()=>document.activeElement?.blur());
  const x=await page.evaluate(()=>window.__saturn.playerX);await page.keyboard.down('c');await page.waitForFunction(()=>window.__saturn.saturn.charge>=24);assert.equal(await page.evaluate(()=>window.__saturn.playerX),x);
  await page.screenshot({path:path.join(out,'saturn-charge-hud.png')});await page.keyboard.up('c');await page.waitForFunction(x=>window.__saturn.playerX>x,x);
  await page.getByRole('button',{name:'Snowball Ready',exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.cooldown),0);
  await page.waitForFunction(()=>!window.__saturn.saturn.roll);await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.down('c');await page.waitForFunction(()=>window.__saturn.saturn.charging);await page.keyboard.press('k');assert.equal(await page.evaluate(()=>window.__saturn.saturn.charging),false);await page.keyboard.up('c');
  await page.getByRole('button',{name:'Snowball Ready',exact:true}).click();await page.mouse.move(650,550);await page.mouse.down({button:'middle'});await page.waitForFunction(()=>window.__saturn.saturn.charge>8);await page.mouse.up({button:'middle'});assert.equal(await page.evaluate(()=>window.__saturn.saturn.charging),false);
  await page.getByRole('button',{name:'Expose',exact:true}).click();await page.getByRole('img',{name:'Blizzard stopped'}).waitFor();
  await page.screenshot({path:path.join(out,'saturn-weak-hud.png')});
  for(const phase of [2,3]){await page.getByRole('button',{name:`Phase ${phase}`,exact:true}).click();assert.equal(await page.evaluate(()=>window.__saturn.saturn.phase),phase);}
  // Verify the normal desktop layout at the smaller supported viewport as well.
  await page.setViewportSize({width:1024,height:768});await page.screenshot({path:path.join(out,'saturn-1024-hud.png')});
  assert.ok(await page.getByRole('button',{name:'Snowball Ready',exact:true}).isVisible());
  const vitals=await page.locator('.rs-hud-vitals > div').evaluateAll(els=>Math.max(...els.map(el=>el.getBoundingClientRect().right))),guardian=await health.boundingBox();assert.ok(vitals<guardian.x,'vitals and shields do not overlap guardian at 1024px');
  assert.deepEqual(errors,[]);console.log('Saturn desktop rules, controls, shield counters, three-branch indicator, charge/cancel, weak window and phases passed.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
