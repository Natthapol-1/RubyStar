const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const out=process.argv[2]||'.tmp/build-browser';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve();};window.AudioContext=undefined;window.webkitAudioContext=undefined;localStorage.setItem('rubyStar.music','off');});
  const page=await context.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
  async function attach(){await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas:not([aria-hidden])');if(!canvas)return false;
   let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
   for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.gamePhase){window.__run=hook.memoizedState.current;return true;}return false;
  });}
  await page.goto((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/endless?god=1',{waitUntil:'domcontentloaded',timeout:60000});
  await attach();
  await page.evaluate(()=>Object.assign(window.__run,{noMobs:true,noBossSpawns:true,godMode:true,meteoriteTimer:1e7,bossesKilled:2}));
  await page.getByRole('button',{name:'Stage +1',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'CONSTELLATIONS',exact:true});await dialog.waitFor();
  assert.equal(await dialog.locator('[data-constellation]').count(),3);
  await page.screenshot({path:path.join(out,'three-constellations.png')});
  await page.keyboard.press('3');await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__run.constellations.length),1);
  await page.evaluate(()=>window.__run.bossesKilled=19);await page.getByRole('button',{name:'Stage +1',exact:true}).click();
  const blessing=page.getByRole('dialog',{name:'CELESTIAL BLESSING',exact:true});await blessing.waitFor();assert.equal(await blessing.locator('[data-blessing]').count(),10);
  assert.equal(await blessing.locator('[data-gemstone]').count(),10);
  const paused=await page.evaluate(()=>window.__run.gameTick);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__run.gameTick),paused);
  await page.screenshot({path:path.join(out,'celestial-blessings.png')});
  await page.keyboard.press('0');await blessing.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__run.build.blessings.length),1);assert.equal(await page.evaluate(()=>window.__run.build.blessings[0]),'aegis_sentinel');
  await page.getByLabel('Active celestial blessings').waitFor();
  // Render the real runtime zones and marks with a quiet, paused-free scene.
  await page.evaluate(()=>{const s=window.__run;s.build.zones=[{x:s.playerX+100,y:s.playerY,radius:2,ticks:300,damage:5,kind:'fire'},{x:s.playerX-100,y:s.playerY,radius:2,ticks:300,damage:5,kind:'gravity'}];});
  await page.screenshot({path:path.join(out,'endless-build-zones.png')});
  await page.goto((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/challenge/jupiter?god=1',{waitUntil:'domcontentloaded',timeout:60000});
  await attach();await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).waitFor({state:'hidden'});
  await page.evaluate(()=>Object.assign(window.__run,{godMode:true,meteoriteTimer:1e7}));
  await page.getByRole('button',{name:'Phase 2',exact:true}).click();await page.getByRole('button',{name:'Pursuit',exact:true}).click();
  await page.waitForFunction(()=>window.__run.jupiter.fragments.length===3);
  await page.evaluate(()=>{for(const f of window.__run.jupiter.fragments)f.charge=1;});await page.waitForFunction(()=>window.__run.jupiter.fragmentOverdrive);
  await page.screenshot({path:path.join(out,'jupiter-phase-2-overdrive.png')});
  await page.evaluate(()=>{const s=window.__run,f=s.jupiter.fragments[0];s.playerTileX=s.playerTargetX=f.x;s.playerTileY=s.playerTargetY=f.y;s.playerX=(f.x+.5)*48;s.playerY=(f.y+.5)*48;s.playerStepProgress=0;});
  await page.waitForFunction(()=>!window.__run.jupiter.fragmentOverdrive&&window.__run.jupiter.fragments.length===2);
  await page.getByRole('button',{name:'Phase 3',exact:true}).click();await page.getByRole('button',{name:'Pursuit',exact:true}).click();await page.waitForFunction(()=>window.__run.jupiter.miniStorms.length===8);
  await page.getByRole('button',{name:'Shard Race',exact:true}).click();await page.waitForFunction(()=>window.__run.jupiter.stage==='escape'&&window.__run.jupiter.miniStorms.length===8);
  await page.screenshot({path:path.join(out,'jupiter-phase-3-race.png')});
  await page.getByRole('button',{name:'Charge',exact:true}).click();assert.equal(await page.evaluate(()=>window.__run.jupiter.miniStorms.length),0);
  assert.deepEqual(errors,[]);console.log('Desktop checks passed: three choices, keyboard 3, paused blessings, owned HUD, phase 2 overdrive/pickup, phase 3 storms/race/cleanup. Browser muted and closed.');
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
