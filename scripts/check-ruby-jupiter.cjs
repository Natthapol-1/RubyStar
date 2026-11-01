// Desktop browser smoke check. All media and synthesized audio are muted before page load.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const out=process.argv[2]||'.tmp/jupiter-browser';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve();};window.AudioContext=undefined;window.webkitAudioContext=undefined;localStorage.setItem('rubyStar.music','off');});
  const page=await context.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/challenge/jupiter?god=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).waitFor();
  assert.ok(await page.getByText('SPECIAL SKILL (PRESS MIDDLE CLICK OR C)',{exact:true}).count());
  assert.ok(await page.getByText('CELESTIAL SKILL (PRESS F)',{exact:true}).count());
  await page.screenshot({path:path.join(out,'jupiter-rules.png')});
  await page.getByRole('button',{name:'UNDERSTOOD',exact:true}).click();
  await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas:not([aria-hidden])');if(!canvas)return false;
   let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
   for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.current?.gamePhase){window.__jupiter=hook.memoizedState.current;return true;}return false;
  });
  await page.evaluate(()=>Object.assign(window.__jupiter,{noMobs:true,godMode:true,meteoriteTimer:1e6,bossTimer:1}));
  await page.getByRole('button',{name:'Phase 1',exact:true}).click();
  await page.waitForFunction(()=>window.__jupiter.jupiter.bossId!==-1,{},{timeout:20000});
  await page.getByRole('meter',{name:'Reaper energy',exact:true}).waitFor();
  await page.evaluate(()=>{const s=window.__jupiter,b=s.enemies.find(e=>e.id===s.jupiter.bossId);Object.assign(b,{tileX:39,tileY:39,targetTileX:39,targetTileY:39,x:39.5*48,y:39.5*48,stepProgress:0});document.activeElement?.blur();});
  const skillReady=await page.getByRole('button',{name:'Skill Ready',exact:true}).boundingBox(),fenceReady=await page.getByRole('button',{name:'Fence Ready',exact:true}).boundingBox();
  assert.ok(Math.abs(skillReady.y-fenceReady.y)<2,'Fence Ready sits beside Skill Ready');
  await page.locator('canvas:not([aria-hidden])').click({button:'middle',position:{x:720,y:450}});await page.waitForFunction(()=>window.__jupiter.jupiter.walls.length===1);
  assert.ok(await page.evaluate(()=>window.__jupiter.jupiter.playerBoost>0));
  assert.equal(await page.evaluate(()=>window.__jupiter.laserCooldown),0);assert.equal(await page.evaluate(()=>window.__jupiter.bulletCooldown),0);
  await page.keyboard.press('c');assert.equal(await page.evaluate(()=>window.__jupiter.jupiter.walls.length),1);
  await page.screenshot({path:path.join(out,'jupiter-charge-hud.png')});
  await page.getByRole('button',{name:'Pursuit',exact:true}).click();await page.waitForFunction(()=>window.__jupiter.jupiter.stage==='pursuit');
  await page.screenshot({path:path.join(out,'jupiter-pursuit-hud.png')});
  await page.evaluate(()=>window.__jupiter.jupiter.energy=0);
  await page.waitForFunction(()=>window.__jupiter.jupiter.round===2&&window.__jupiter.jupiter.stage==='charging');
  await page.getByRole('button',{name:'Pursuit',exact:true}).click();
  await page.waitForFunction(()=>window.__jupiter.jupiter.stage==='pursuit'&&window.__jupiter.jupiter.energy>110);
  const energyMeter=page.getByRole('meter',{name:'Reaper energy',exact:true});assert.equal(await energyMeter.getAttribute('aria-valuemax'),'120');
  assert.ok(await energyMeter.evaluate(el=>parseFloat(el.querySelector('div').firstElementChild.style.width)<=100));
  await page.screenshot({path:path.join(out,'jupiter-violet-hud.png')});
  await page.evaluate(()=>window.__jupiter.jupiter.energy=0);await page.waitForFunction(()=>window.__jupiter.jupiter.stage==='escape');
  await page.screenshot({path:path.join(out,'jupiter-exposed-hud.png')});
  assert.ok(await page.evaluate(()=>window.__jupiter.jupiter.shards.length>20));
  const shardHP=await page.evaluate(()=>{
   const s=window.__jupiter,b=s.enemies.find(e=>e.id===s.jupiter.bossId);
   Object.assign(b,{tileX:39,targetTileX:39,tileY:39,targetTileY:39,x:39.5*48,y:39.5*48,stepProgress:0});
   s.jupiter.shardBossX=b.x;s.jupiter.shardBossY=b.y;s.jupiter.shards=[{id:1,x:s.playerTileX,y:s.playerTileY},{id:99,x:10,y:39}];return b.hp;
  });
  await page.waitForFunction(hp=>{const s=window.__jupiter,b=s.enemies.find(e=>e.id===s.jupiter.bossId);return s.jupiter.shards.length===1&&b.hp===hp-18;},shardHP);
  assert.equal(await page.evaluate(()=>window.__jupiter.jupiter.shardEffects.at(-1).heal),false);
  const healHP=await page.evaluate(()=>{
   const s=window.__jupiter,b=s.enemies.find(e=>e.id===s.jupiter.bossId);b.hp-=100;
   s.jupiter.shards=[{id:2,x:b.tileX,y:b.tileY}];return b.hp;
  });
  await page.waitForFunction(hp=>{const s=window.__jupiter,b=s.enemies.find(e=>e.id===s.jupiter.bossId);return s.jupiter.shards.length===0&&b.hp===hp+18&&s.jupiter.stage==='charging';},healHP);
  assert.equal(await page.evaluate(()=>window.__jupiter.jupiter.shardEffects.at(-1).heal),true);

  await page.evaluate(()=>{const s=window.__jupiter,t=s.jupiter.shockTiles[0];t.x=s.playerTileX;t.y=s.playerTileY;t.cooldown=0;s.jupiter.stage='pursuit';s.jupiter.energy=40;});
  await page.waitForFunction(()=>window.__jupiter.jupiter.slowTicks>0&&window.__jupiter.jupiter.energy>50);
  await page.locator('[data-status="static"]').waitFor();
  await page.screenshot({path:path.join(out,'jupiter-charged-tile.png')});
  await page.getByRole('button',{name:'RULES',exact:true}).click();
  const timer=await page.evaluate(()=>window.__jupiter.jupiter.stageTicks);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__jupiter.jupiter.stageTicks),timer);
  const thunder=await page.request.get((process.env.RUBYSTAR_TEST_URL||'http://localhost:3000')+'/sounds/jupiter-pursuit-thunder.mp3');assert.equal(thunder.status(),200);assert.equal((await thunder.body()).length,fs.statSync('public/sounds/jupiter-pursuit-thunder.mp3').size);
  assert.deepEqual(errors,[]);console.log('Jupiter desktop route, rules, HUD, middle-click/C shared cooldown, two pursuit rounds, player/Reaper shard collections and pause passed. Browser muted and closed.');
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
