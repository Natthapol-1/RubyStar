const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
 await page.addInitScript(()=>{
  const profile={version:1,tutorialCompleted:true,highestEndless:20,defeated:['fiery_king','splitter_queen','storm_reaper','thorn_weaver','sea_chanter','frost_warden','devourer'],completed:['fiery_king','splitter_queen'],encountered:[],constellations:[],skills:[],settings:{music:0,attack:0,effects:0},resumes:{}};
  window.rubyDesktop={load:async()=>({data:profile,error:null}),save:async()=>true,fullscreen:async()=>false,quit:async()=>{},onClosing:()=>()=>{},closeReady:()=>{}};
  HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
 });
 await page.goto('http://127.0.0.1:3001/challenge',{waitUntil:'domcontentloaded',timeout:180000});
 await page.locator('.sm-node').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.sm-cleared').count(),2);assert.equal(await page.locator('.sm-clear-badge').count(),2);assert.equal(await page.locator('.sm-completion-aura').count(),2);assert.equal(await page.locator('.sm-cleared-frame').count(),0);
 await page.getByRole('button',{name:'Challenge: GAIA',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/challenge','first click only selects a different world');
 assert.equal(await page.locator('.sm-node[aria-pressed="true"]').evaluate(e=>e.classList.contains('sm-cleared')),false);assert.equal(await page.locator('.sm-gem-reward [data-gemstone="thorn_weaver"]').count(),1);
 await page.screenshot({path:path.resolve('docs/ruby-star/visual-reference/star-map-completed-worlds.png')});
 await page.getByRole('button',{name:'Challenge: THE SUN (cleared)',exact:true}).click();
 assert.equal(await page.locator('.sm-node[aria-pressed="true"] .sm-clear-badge').count(),1);assert.equal(await page.locator('.sm-gem-reward [data-gemstone="fiery_king"]').count(),1);
 await page.setViewportSize({width:1024,height:600});
 for(const rect of await page.locator('.sm-clear-badge,.sm-gem-reward,.sm-begin').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}))){assert.ok(rect.left>=0&&rect.top>=0&&rect.right<=1024&&rect.bottom<=600);}
 await page.getByRole('button',{name:'Challenge: THE MOON (cleared)',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/challenge');
 await page.getByRole('button',{name:'Challenge: THE MOON (cleared)',exact:true}).click();await page.waitForURL('**/challenge/moon',{waitUntil:'domcontentloaded'});
 console.log('Star-map completion passed: permanent markers on cleared worlds, independent selection, accessible labels and compact viewport fit.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
