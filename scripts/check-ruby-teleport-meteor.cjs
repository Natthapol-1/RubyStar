// Check shared meteor warnings in every playable world's teleport picker, with all audio muted.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve();};window.AudioContext=undefined;window.webkitAudioContext=undefined;localStorage.setItem('rubyStar.music','off');});
  fs.mkdirSync('.tmp/teleport-meteor',{recursive:true});
  for(const world of (process.argv.length>2?process.argv.slice(2):['endless','sun','moon','gaia','neptune','jupiter'])) {
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/'+(world==='endless'?'endless':'challenge/'+world)+'?god=1',{waitUntil:'domcontentloaded',timeout:60000});
   await page.bringToFront();
   await page.waitForFunction(()=>{
    const canvas=document.querySelector('canvas:not([aria-hidden])');if(!canvas)return false;
    let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
    for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.gamePhase){window.__teleport=hook.memoizedState.current;return true;}return false;
   });
   if(world!=='endless')await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
   await page.waitForFunction(()=>window.__teleport.gameTick>2,null,{timeout:5000}).catch(async error=>{console.error(world,errors,await page.evaluate(()=>({phase:window.__teleport.gamePhase,tick:window.__teleport.gameTick,modals:document.querySelectorAll('.modal-overlay').length})));throw error;});
   await page.evaluate(()=>{
    const s=window.__teleport;Object.assign(s,{noMobs:true,noBossSpawns:true,godMode:true,bossTimer:1e6,
      playerTileX:10,playerTileY:10,playerTargetX:10,playerTargetY:10,playerX:504,playerY:504,playerStepProgress:0,
      playerQueuedDirX:0,playerQueuedDirY:0,playerChamber:0,teleportCooldown:0,meteoriteWarning:-1,meteoriteTimer:180,meteoriteChamberSeq:0});document.activeElement?.blur();
   });
   await page.keyboard.press('x');await page.waitForFunction(()=>window.__teleport.gamePhase==='teleporting');
   await page.getByText(/NEXT: ALPHA/).waitFor();const timer=await page.evaluate(()=>window.__teleport.meteoriteTimer);
   await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__teleport.meteoriteTimer),timer);
   await page.screenshot({path:'.tmp/teleport-meteor/'+world+'-next.png'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__teleport.gamePhase==='playing');
   await page.evaluate(()=>{window.__teleport.meteoriteWarning=1;window.__teleport.meteoriteStrikeIn=120;});
   await page.keyboard.press('x');await page.waitForFunction(()=>window.__teleport.gamePhase==='teleporting');
   await page.getByText(/METEORITE.*BETA CHAMBER/).waitFor();const strike=await page.evaluate(()=>window.__teleport.meteoriteStrikeIn);
   await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__teleport.meteoriteStrikeIn),strike);
   await page.screenshot({path:'.tmp/teleport-meteor/'+world+'-incoming.png'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__teleport.gamePhase==='playing');
   await page.getByRole('button',{name:'RULES',exact:true}).click();
   assert.equal(await page.getByText(/NEXT:|METEORITE.*CHAMBER/).count(),0,'Meteor banners are hidden by rules');
   await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
   if(world==='neptune'||world==='gaia') {
    await page.getByRole('button',{name:world==='neptune'?'Full Trident':'Full Sunfire',exact:true}).click();
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('c');await page.waitForFunction(()=>window.__teleport.gamePhase==='laserTarget',null,{timeout:3000}).catch(async error=>{console.error(world,await page.evaluate(()=>({phase:window.__teleport.gamePhase,charge:window.__teleport.neptune?.healCharge,sun:window.__teleport.gaia?.sunCharge,laser:window.__teleport.neptune?.laser,rules:document.querySelectorAll('.modal-overlay').length})));throw error;});
    await page.getByText(/METEORITE.*BETA CHAMBER/).waitFor();
    await page.getByRole('button',{name:'RULES',exact:true}).click();
    assert.equal(await page.getByText(/NEXT:|METEORITE.*CHAMBER/).count(),0,'C selector does not lift meteor above rules');
    await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
    await page.getByText(/METEORITE.*BETA CHAMBER/).waitFor();
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{window.__teleport.meteoriteWarning=-1;window.__teleport.meteoriteTimer=180;window.__teleport.meteoriteChamberSeq=0;});
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('c');await page.waitForFunction(()=>window.__teleport.gamePhase==='laserTarget',null,{timeout:3000}).catch(async error=>{console.error(world,await page.evaluate(()=>({phase:window.__teleport.gamePhase,charge:window.__teleport.neptune?.healCharge,sun:window.__teleport.gaia?.sunCharge,laser:window.__teleport.neptune?.laser,rules:document.querySelectorAll('.modal-overlay').length})));throw error;});
    await page.getByText(/NEXT: ALPHA/).waitFor();
   }
   assert.deepEqual(errors,[]);await page.close();console.log(world+': next and active meteor warnings visible; teleport/C selection timers paused; rules hide meteor banners.');
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
