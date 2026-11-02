const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{_electron}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(root,'.tmp/desktop-dev-'));
let server;
let app;
(async()=>{try{
 try{await fetch('http://127.0.0.1:3001',{signal:AbortSignal.timeout(15000)});}catch{server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port','3001'],{stdio:'ignore',windowsHide:true,env:{...process.env,RUBY_DESKTOP_DEV:'1'}});}
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:3001');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert.equal(ready,true);
 app=await _electron.launch({timeout:120000,args:[path.join(root,'desktop/main.cjs'),'--dev'],env:{...process.env,RUBY_STAR_TEST_DATA:dir}});
 const page=await app.firstWindow({timeout:120000}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));await page.locator('.rs-card[data-slot="0"]').waitFor();await page.locator('.rs-card[data-slot="0"]').click();await page.locator('.rs-hud').waitFor();
 await page.evaluate(()=>{window.__state=()=>{const canvas=document.querySelector('.rs-hud').parentElement.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];for(;fiber;fiber=fiber.return)for(let h=fiber.memoizedState;h;h=h.next){const s=h.memoizedState?.current;if(s?.gamePhase&&s?.map)return s;}throw Error('State missing');};window.__state().tutorial.step=12;});
 await page.getByRole('button',{name:'PLAY ENDLESS SPACE',exact:false}).click();await page.locator('.rs-stage').waitFor();
 await page.evaluate(()=>{const s=window.__state();s.noMobs=s.noBossSpawns=s.godMode=true;s.meteoriteTimer=s.ambientEvents.timer=1e8;s.constellations.push('chargeField');window.__fps=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(String(text).startsWith('FPS '))window.__fps.push(text);return original.call(this,text,...args);};});
 await page.keyboard.press('F3');await page.waitForFunction(()=>window.__fps.length>5);await page.mouse.move(620,450);await page.mouse.down();await page.waitForFunction(()=>window.__state().build.zones.some(z=>z.kind==='nebula'));await page.mouse.up();
 await page.screenshot({path:path.join(root,'.tmp/desktop-development-fps.png')});console.log('Overlay measured:',await page.evaluate(()=>window.__fps.at(-1)));await page.keyboard.press('F3');const count=await page.evaluate(()=>window.__fps.length);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__fps.length),count);
 // Visit all four chambers with the real teleport menu and room buttons.
 for(let room=0;room<4;room++){
   await page.evaluate(room=>{const s=window.__state(),x=room===0?39:10;Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:10,playerTargetY:10,playerX:(x+.5)*48,playerY:504,playerChamber:room===0?1:0,playerStepProgress:0,teleportCooldown:0,playerQueuedDirX:0,playerQueuedDirY:0});},room);
   await page.keyboard.press('x');await page.waitForTimeout(420);await page.locator('.rs-teleport-room').nth(room).click();await page.waitForFunction(()=>window.__state().gamePhase==='playing');
   const position=await page.evaluate(()=>[window.__state().playerTileX,window.__state().playerTileY]);assert.ok(room===0?position[0]<25&&position[1]<25:room===1?position[0]>25&&position[1]<25:room===2?position[0]<25&&position[1]>25:position[0]>25&&position[1]>25);
 }
 assert.deepEqual(errors,[]);console.log('Development Electron checks passed: F3 on/off, real charging field, and all four teleport rooms.');
 }finally{if(app)await app.close();if(server&&process.platform==='win32')spawn('taskkill',['/pid',String(server.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});else server?.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
