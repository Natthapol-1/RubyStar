const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
 await page.addInitScript(()=>{
  const profile={version:1,tutorialCompleted:true,highestEndless:22,highestAscension:35,defeated:[],completed:[],encountered:[],constellations:[],skills:[],settings:{music:0,attack:0,effects:0},resumes:{}};
  window.rubyDesktop={load:async()=>({data:profile,error:null}),save:async()=>true,fullscreen:async()=>false,quit:async()=>{},onClosing:()=>()=>{},closeReady:()=>{}};
  HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
 });
 await page.goto('http://127.0.0.1:3001',{waitUntil:'domcontentloaded',timeout:180000});
 await page.getByLabel('Highest run',{exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.rs-run-record').count(),0);assert.match(await page.getByLabel('Highest run',{exact:true}).innerText(),/ENDLESS.*STAGE 35/);assert.doesNotMatch(await page.getByLabel('Highest run',{exact:true}).innerText(),/ASCENSION/);
 await page.screenshot({path:path.resolve('docs/ruby-star/visual-reference/desktop-highest-run.png')});
 await page.getByRole('button',{name:'Show ENDLESS SPACE ASCENSION',exact:true}).click();
 assert.equal(await page.locator('.rs-run-record').count(),0);
 await page.setViewportSize({width:1024,height:600});await page.waitForTimeout(350);assert.equal(await page.getByLabel('Highest run',{exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true);
 assert.equal(await page.locator('.rs-run-record').count(),0);
 await page.goto('http://127.0.0.1:3001/endless',{waitUntil:'domcontentloaded',timeout:180000});await page.locator('.rs-hud').waitFor();
 await page.evaluate(()=>{const canvas=document.querySelector('.rs-hud').parentElement.querySelector('canvas');let fiber=canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];for(;fiber;fiber=fiber.return)for(let h=fiber.memoizedState;h;h=h.next){const s=h.memoizedState?.current;if(s?.gamePhase&&s?.map){s.gamePhase='lost';s.playerHP=0;return;}}throw Error('Missing state');});
 await page.getByRole('dialog',{name:'RUBY STAR',exact:true}).waitFor();assert.equal(await page.locator('.rs-end-panel h2').evaluate(e=>getComputedStyle(e).textAlign),'center');assert.match(await page.locator('.rs-end-record').innerText(),/HIGHEST RUN\s+STAGE 35/);assert.equal(await page.locator('.rs-end-record').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(),h=e.parentElement.querySelector('h2').getBoundingClientRect();return r.right<=p.right&&r.right>p.left+p.width/2&&r.top>=p.top&&Math.abs(r.top-h.top)<=2&&r.bottom<h.bottom+22;}),true);assert.equal(await page.locator('.rs-end-record > strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),16);assert.equal(await page.locator('.rs-end-record > span').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),8);await page.screenshot({path:path.resolve('docs/ruby-star/visual-reference/desktop-highest-game-over.png')});
 console.log('Highest run UI passed: shared record in lobby and game over, compact viewport fit and no card duplicates.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
