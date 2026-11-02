const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {_electron:electron}=require('playwright');
const output=path.resolve('.tmp/desktop-smoke');fs.mkdirSync(output,{recursive:true});
const userData=fs.mkdtempSync(path.join(output,'profile-'));let app,page;const errors=[];
async function launch(){app=await electron.launch({timeout:120000,...(process.argv[2]?{executablePath:path.resolve(process.argv[2]),args:['--user-data-dir='+userData]}:{args:[path.resolve('desktop/main.cjs')]}),env:{...process.env,RUBY_STAR_TEST_DATA:userData}});page=await app.firstWindow({timeout:120000});page.setDefaultTimeout(60000);page.on('pageerror',error=>errors.push(error.message));await page.getByRole('heading',{name:'RUBY STAR',exact:true}).waitFor();}
async function stateSetup(){await page.evaluate(()=>{window.__state=()=>{const canvas=document.querySelector('.rs-hud')?.parentElement?.querySelector('canvas');if(!canvas)throw Error('Canvas missing');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];for(;fiber;fiber=fiber.return)for(let hook=fiber.memoizedState;hook;hook=hook.next){const s=hook.memoizedState?.current;if(s?.gamePhase&&s?.map)return s;}throw Error('State missing');};});}
async function close(){if(app){await app.close();app=null;}}
(async()=>{try{
 await launch();assert.equal(await page.locator('.rs-card[data-slot="0"]').getAttribute('aria-label'),'FIRST ORBIT TUTORIAL');
 assert.equal(await page.locator('.rs-card').filter({hasText:'ENDLESS SPACE'}).first().getAttribute('aria-disabled'),'true');
 await page.locator('.rs-card[data-slot="0"]').click();await page.locator('.rs-hud').waitFor();assert.equal(await page.getByRole('button',{name:'GOD',exact:true}).count(),0);await stateSetup();
 // Exercise the tutorial completion transition, rather than fabricating its saved flag.
 await page.evaluate(()=>{const s=window.__state();s.tutorial.step=12;});
 await page.getByText('TUTORIAL COMPLETE',{exact:false}).waitFor();await page.getByRole('button',{name:'LOBBY',exact:true}).click();
 await page.getByRole('heading',{name:'RUBY STAR',exact:true}).waitFor();assert.match(await page.locator('.rs-card[data-slot="0"]').innerText(),/ENDLESS SPACE/);
 await page.locator('.rs-card[data-slot="0"]').click();await page.locator('.rs-hud').waitFor();assert.equal(await page.getByRole('button',{name:'GOD',exact:true}).count(),0);await stateSetup();
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
 assert.match(await page.evaluate(async()=>(await fetch('/')).headers.get('content-security-policy')),/object-src 'none'/);
 assert.equal(await page.evaluate(async()=>{try{await fetch('https://example.com');return false;}catch{return true;}}),true);
 assert.equal(await page.evaluate(async()=>(await fetch('/sounds/rubyStarBGM.mp3',{headers:{Range:'bytes=0-63'}})).status),206);assert.equal(await page.evaluate(()=>typeof window.rubyDesktop.save),'function');
 await page.mouse.click(620,450);assert.ok(await page.evaluate(()=>window.__state().laserCooldown>0));
 await page.mouse.click(620,450,{button:'right'});
 await page.keyboard.down('d');await page.waitForTimeout(180);await page.keyboard.up('d');
 await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Paused',exact:true}).waitFor();
 const tick=await page.evaluate(()=>window.__state().gameTick);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__state().gameTick),tick);
 await page.getByRole('slider',{name:'attack volume'}).fill('0.35');
 await page.getByRole('button',{name:'SAVE & RETURN TO LOBBY',exact:true}).click();await page.getByRole('heading',{name:'RUBY STAR',exact:true}).waitFor();
 await close();await launch();await page.locator('.rs-card[data-slot="0"]').click();await page.getByRole('dialog',{name:'Resume saved run'}).waitFor();await page.getByRole('button',{name:'RESUME SAVED RUN',exact:true}).click();await stateSetup();assert.ok(await page.evaluate(()=>window.__state().gameTick)>=tick);
 assert.equal(await page.evaluate(async()=>(await window.rubyDesktop.load()).data.settings.attack),.35);
 await page.keyboard.press('F11');await page.waitForTimeout(300);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isFullScreen()),true);await page.keyboard.press('F11');await page.waitForTimeout(300);
 for(const [width,height]of [[1024,600],[1280,720],[1920,1080]]){await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setSize(width,height),{width,height});await page.waitForTimeout(100);assert.ok(await page.locator('canvas').first().evaluate(c=>c.width>0&&c.height>0));}
 await page.getByRole('button',{name:'Rules',exact:true}).click();await page.getByRole('button',{name:'ALIENS & BOSSES',exact:true}).click();assert.ok(await page.locator('.rs-guide-entry canvas').count()>10);
 await page.screenshot({path:path.join(output,'desktop-enemy-guide.png')});assert.deepEqual(errors,[]);
 console.log('Desktop smoke passed: tutorial gate and default, input, pause, save/relaunch/resume, audio preference, fullscreen, three resolutions, portraits and renderer isolation.');
 }finally{await close();}})().catch(error=>{console.error(error);process.exitCode=1;});
