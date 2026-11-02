const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
function freshModule(){delete require.cache[require.resolve('../game/profile.ts')];return require('../game/profile.ts');}
test('development module replacement retains loaded unlocks and never saves an empty replacement profile',async()=>{
 let disk={version:1,tutorialCompleted:true,highestEndless:20,defeated:['fiery_king'],completed:['fiery_king'],encountered:[],constellations:[],skills:[],settings:{music:1,attack:1,effects:1},resumes:{}};
 global.window={dispatchEvent(){},rubyDesktop:{load:async()=>({data:disk,error:null}),save:async data=>{disk=data;return true;}}};
 try{const first=freshModule();await first.loadProfile();first.updateProfile(p=>p.defeated.push('devourer'));
  const replaced=freshModule();assert.equal(replaced.canEnter('endless'),true);assert.equal(replaced.canEnter('ascension'),true);assert.equal(replaced.canEnter('trial','devourer'),true);
  replaced.setAudioPreference('music',.5);await replaced.flushProfile();await first.flushProfile();assert.equal(disk.tutorialCompleted,true);assert.equal(disk.highestEndless,20);assert.deepEqual(disk.defeated,['fiery_king','devourer']);assert.equal(first.getProfile(),replaced.getProfile());
 }finally{delete global.window;}
});
test('protected-save state also survives module replacement',async()=>{
 let writes=0;global.window={dispatchEvent(){},rubyDesktop:{load:async()=>({data:{version:2},error:null}),save:async()=>{writes++;return true;}}};
 try{const first=freshModule();await first.loadProfile();const replaced=freshModule();replaced.updateProfile(p=>p.tutorialCompleted=true);await replaced.flushProfile();assert.equal(writes,0);assert.match(replaced.saveError(),/Unrecognized/);}finally{delete global.window;}
});
test('older profiles merge separate mode records and saved Ascension progress into one highest run',async()=>{
 const disk={version:1,tutorialCompleted:true,highestEndless:9,highestAscension:30,defeated:[],completed:[],encountered:[],constellations:[],skills:[],settings:{music:1,attack:1,effects:1},resumes:{endless:{mode:'ascension',state:{mode:'ascension',bossesKilled:44}}}};
 global.window={dispatchEvent(){},rubyDesktop:{load:async()=>({data:disk,error:null}),save:async()=>true}};
 try{const p=freshModule();await p.loadProfile();assert.equal(p.highestStage('ascension'),44);assert.equal(p.highestStage('endless'),44);assert.equal(p.getProfile().highestAscension,undefined);assert.equal(p.canEnter('ascension'),true);await p.flushProfile();}finally{delete global.window;}
});
