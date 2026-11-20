const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const src=fs.readFileSync(f,'utf8');m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const steps={fiery_king:c.SUN.phaseHP,storm_reaper:c.JUPITER.phaseHP,frost_warden:require('../game/saturn.ts').SATURN.phaseHP,blind_prayer:require('../game/sirius.ts').SIRIUS.phaseHP,splitter_queen:c.MOON_PHASE_HP};

for(const [boss,step] of Object.entries(steps)){
  test(`${boss}: one hit stops at the phase boundary; the next hit carries on`,()=>{
    const s=e.createModeState('trial',boss);s.noMobs=true;s.meteoriteTimer=1e6;
    e.godSpawnBoss(s,boss);const b=s.enemies.find(x=>x.type===boss);assert.ok(b,'boss spawned');
    assert.equal(b.maxHp,step*3);
    b.hp=step*3-1;e.damageEnemy(s,b,1e9,'enemy');
    assert.equal(b.hp,step*2,'stopped at the end of phase 1');
    e.damageEnemy(s,b,1e9,'enemy');
    assert.equal(b.hp,step,'the next hit took phase 2, and stopped again');
    e.damageEnemy(s,b,1e9,'enemy');
    assert.ok(b.hp<=0,'the final phase can be finished');
  });
}
