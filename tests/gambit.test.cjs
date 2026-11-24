const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const src=fs.readFileSync(f,'utf8');m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;s.playerKnockback=null;s.playerChamber=c.chamberOfTile(x,y);};

test('Star Gambit teleport offers every Bazaar chamber and lands on its pad', () => {
  const s=e.createModeState('gambit');
  assert.equal(c.CHAMBER_BOUNDS.length,7);
  for(let from=0;from<7;from++)for(let to=0;to<7;to++){
    if(from===to)continue;
    const [px,py]=c.TELEPORT_PADS[from];player(s,px,py+1);s.teleportCooldown=0;s.gamePhase='playing';
    assert.ok(e.tryActivateTeleport(s));
    assert.deepEqual(s.teleportDestOptions,[0,1,2,3,4,5,6].filter(ch=>ch!==from));
    e.doTeleport(s,to);
    assert.deepEqual([s.playerTileX,s.playerTileY],c.TELEPORT_PADS[to]);
    assert.equal(s.playerChamber,to);
  }
});

test('the standard station keeps four chambers and its own pads after a Star Gambit run', () => {
  e.createModeState('gambit');
  const s=e.createModeState('endless');
  assert.equal(c.CHAMBER_BOUNDS.length,4);
  const [px,py]=c.TELEPORT_PADS[0];player(s,px,py+1);s.teleportCooldown=0;s.gamePhase='playing';
  assert.ok(e.tryActivateTeleport(s));
  assert.deepEqual(s.teleportDestOptions,[1,2,3]);
  e.doTeleport(s,3);
  assert.deepEqual([s.playerTileX,s.playerTileY],[39,39]);
});

test('the Star Gambit wave clock drains and then moves to the next wave', () => {
  const g=require('../game/gambit.ts'),s=e.createModeState('gambit');s.gamePhase='playing';
  assert.equal(s.gambit.wave,1);assert.equal(s.gambit.glint,0);
  for(let i=0;i<g.GAMBIT_WAVE_TICKS-1;i++)g.updateGambit(s);
  assert.equal(s.gambit.wave,1);assert.equal(s.gambit.waveTicks,1);
  g.updateGambit(s);
  assert.equal(s.gambit.wave,2);assert.equal(s.gambit.waveTicks,g.GAMBIT_WAVE_TICKS);
});

test('every floor tile of the Bazaar can be reached', () => {
  e.createModeState('gambit');const map=c.generateBazaarMap(),[sx,sy]=c.TELEPORT_PADS[0],seen=new Set([sx+','+sy]),q=[[sx,sy]];
  while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&map[ny]?.[nx]!==undefined&&map[ny][nx]!==c.T_WALL){seen.add(k);q.push([nx,ny]);}}}
  map.forEach((row,y)=>row.forEach((t,x)=>{if(t!==c.T_WALL)assert.ok(seen.has(x+','+y),'unreachable '+x+','+y);}));
});

test('Star Gambit has one weapon, fired from the Primal Skill control, and the default is Orbital Strike', () => {
  const g=require('../game/gambit.ts'),s=e.createModeState('gambit');s.gamePhase='playing';
  assert.equal(s.gambit.weapon,'orbital');assert.ok(!g.WEAPON_IDS.includes('laser')&&!g.WEAPON_IDS.includes('blaster'));
  g.pressWeapon(s);assert.equal(s.gambit.strikes.length,1);assert.equal(s.gambit.cd,g.GAMBIT.orbital.cooldown);
  g.pressWeapon(s);assert.equal(s.gambit.strikes.length,1,'on cooldown');
  g.setWeapon(s,'dash');assert.equal(s.gambit.weapon,'dash');assert.equal(s.gambit.cd,0);
  g.pressWeapon(s);for(let i=0;i<10;i++)g.holdWeapon(s);assert.ok(s.gambit.charge>1);
});

test('Comet Dash goes the way you face, short on a tap and further when held; Arc Blade knocks back 2 tiles', () => {
  const g=require('../game/gambit.ts'),s=e.createModeState('gambit');s.gamePhase='playing';g.setWeapon(s,'dash');
  const [px,py]=c.TELEPORT_PADS[6];player(s,px,py);s.playerDirX=0;s.playerDirY=1;
  g.pressWeapon(s);g.releaseWeapon(s);
  assert.ok(s.playerKnockback);assert.equal(s.playerKnockback.dirX,0);assert.equal(s.playerKnockback.dirY,1);assert.equal(s.playerKnockback.tilesLeft,g.GAMBIT.dash.minTiles);
  player(s,px,py);s.gambit.cd=0;g.pressWeapon(s);for(let i=0;i<g.GAMBIT.dash.charge;i++)g.holdWeapon(s);g.releaseWeapon(s);
  assert.equal(s.playerKnockback.tilesLeft,g.GAMBIT.dash.maxTiles);
  assert.equal(g.GAMBIT.blade.push,2);
});

const foe=(s,x,y,hp=100)=>{const m=e.createEncounterEnemy(s,'normal',x,y,hp);s.enemies.push(m);return m;};
const fresh=()=>{const g=require('../game/gambit.ts'),s=e.createModeState('gambit');s.gamePhase='playing';s.enemies=[];const [px,py]=c.TELEPORT_PADS[6];player(s,px,py);return {g,s,px,py};};

test('Ruby Sling tows Ruby, then flings it the way you face; the landing hurts and stuns', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'sling');s.playerCarryingRuby=false;s.rubyTileX=px-3;s.rubyTileY=py;s.playerDirX=1;s.playerDirY=0;
  const target=foe(s,px+4,py);
  g.pressWeapon(s);assert.ok(s.gambit.sling);for(let i=0;i<g.GAMBIT.sling.towEvery;i++)g.holdWeapon(s);assert.equal(s.rubyTileX,px-2,'towed one tile');
  g.releaseWeapon(s);assert.equal(s.rubyTileX,-1,'in the air');for(let i=0;i<g.GAMBIT.sling.flight;i++)g.updateGambit(s);
  assert.deepEqual([s.rubyTileX,s.rubyTileY],[px+4,py]);assert.equal(target.hp,100-g.GAMBIT.sling.damage);assert.ok(target.buildStopUntil>s.gameTick);
  assert.equal(s.gambit.cd,g.GAMBIT.sling.cooldown-g.GAMBIT.sling.flight);
});

test('Gravity Well waits briefly, then pulls enemies toward its centre and hurts them a little', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'well');s.gambit.aimX=0;s.gambit.aimY=0;const m=foe(s,px+2,py);
  g.pressWeapon(s);assert.equal(s.gambit.wells.length,1);
  for(let i=0;i<=g.GAMBIT.well.delay;i++)g.updateGambit(s);
  assert.equal(m.hp,100-g.GAMBIT.well.damage);assert.equal(m.pushDirX,-1);
});

test('Ruby Leap jumps beside Ruby in range, hurting and pushing enemies there; out of range it does nothing', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'leap');s.playerCarryingRuby=false;s.rubyTileX=px;s.rubyTileY=py+6;const m=foe(s,px+1,py+6);
  g.pressWeapon(s);assert.equal(m.hp,100,'not landed yet');const total=s.gambit.leapFlight.total;assert.equal(total,Math.max(g.GAMBIT.leap.minFlight,Math.round(Math.hypot(s.gambit.leapFlight.tx-px,s.gambit.leapFlight.ty-py)/g.GAMBIT.leap.speed)));for(let i=0;i<total;i++)g.updateGambit(s);
  assert.ok(Math.max(Math.abs(s.playerTileX-px),Math.abs(s.playerTileY-(py+6)))<=1,'beside Ruby');
  assert.equal(m.hp,100-g.GAMBIT.leap.damage);assert.ok(m.pushTiles>0);
  s.gambit.cd=0;s.rubyTileX=px;s.rubyTileY=py-30;const at=[s.playerTileX,s.playerTileY];g.pressWeapon(s);assert.deepEqual([s.playerTileX,s.playerTileY],at);assert.equal(s.gambit.cd,0);
});

test('Storm Mark marks the enemy nearest the cursor; hitting it arcs lightning to enemies around it', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'mark');const a=foe(s,px+5,py),b=foe(s,px+7,py),far=foe(s,px+20,py);
  s.gambit.aimX=5*c.TILE_SIZE;s.gambit.aimY=0;g.pressWeapon(s);assert.equal(s.gambit.mark.id,a.id);
  g.gambitMarkHit(s,a);assert.equal(b.hp,100-g.GAMBIT.mark.damage);assert.equal(far.hp,100);
  g.gambitMarkHit(s,a);assert.equal(b.hp,100-g.GAMBIT.mark.damage,'arc cooldown');
  s.gambit.mark=null;s.gambit.cd=0;s.gambit.aimX=-10*c.TILE_SIZE;g.pressWeapon(s);assert.equal(s.gambit.mark,null,'nothing near the cursor');
});

test('Star Cannon fires one slow orb the way you face that hits each enemy it passes once, then bursts at a wall', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'cannon');s.playerDirX=1;s.playerDirY=0;s.gambit.aimX=-10*c.TILE_SIZE;const a=foe(s,px+3,py),b=foe(s,px+5,py);
  g.pressWeapon(s);assert.equal(s.gambit.orbs.length,1);
  for(let i=0;i<3000&&s.gambit.orbs.length;i++)g.updateGambit(s);
  assert.equal(a.hp,100-g.GAMBIT.cannon.damage);assert.equal(b.hp,100-g.GAMBIT.cannon.damage);assert.equal(s.gambit.orbs.length,0);
});

test('Siphon Nova grows while held (you move slower), then slows and hurts enemies in range and heals you per enemy', () => {
  const {g,s,px,py}=fresh();g.setWeapon(s,'nova');s.playerHP=50;const near=foe(s,px+1,py),mid=foe(s,px+4,py),far=foe(s,px+9,py);
  g.pressWeapon(s);g.releaseWeapon(s);
  assert.equal(near.hp,100-g.GAMBIT.nova.minDamage,'a tap reaches only nearby');assert.equal(mid.hp,100);assert.ok(near.weaponSlowUntil>s.gameTick);assert.ok(s.playerHP>50);
  s.gambit.cd=0;const hp=s.playerHP;g.pressWeapon(s);for(let i=0;i<g.GAMBIT.nova.charge;i++)g.holdWeapon(s);g.releaseWeapon(s);
  assert.equal(mid.hp,100-g.GAMBIT.nova.maxDamage,'a full hold reaches further and hits harder');assert.equal(far.hp,100);
  assert.ok(s.playerHP-hp>=2*g.GAMBIT.nova.maxHeal-0.01||s.playerHP===s.maxHP,'heals for each enemy');
});

test('a run opens on the slot machine; a pull gives three different weapons and favours the lucky one', () => {
  const g=require('../game/gambit.ts'),s=e.createModeState('gambit');
  assert.equal(s.gamePhase,'loadout');assert.equal(s.gambit.picked,false);
  for(let i=0;i<50;i++){const r=g.rollWeapons('cannon');assert.equal(r.length,3);assert.equal(new Set(r).size,3);}
  let n=0;for(let i=0;i<4000;i++)if(g.rollWeapons('cannon').includes('cannon'))n++;
  assert.ok(Math.abs(n/4000-g.luckyOdds())<.04,'lucky odds match');assert.ok(g.luckyOdds()>3/9+.2,'clearly better than an even draw');
  g.setWeapon(s,'nova');assert.equal(s.gambit.picked,true);
});

test('Glint: an alien drops a chip worth about 20x its HP (more in later waves); it flies to you from up to 2 tiles and is counted', () => {
  const {g,s,px,py}=fresh();const weak=foe(s,px+2,py+2,5),tough=foe(s,px+6,py,22);weak.maxHp=5;tough.maxHp=22;
  g.dropGlint(s,weak);g.dropGlint(s,tough);assert.deepEqual(s.gambit.drops.map(d=>d.value),[100,440]);
  s.gambit.wave=10;g.dropGlint(s,tough);assert.equal(s.gambit.drops[2].value,836,'wave 10 pays more');s.gambit.drops.pop();s.gambit.wave=1;
  for(let i=0;i<40;i++)g.updateGambit(s);
  assert.equal(s.gambit.glint,100,'the chip 2 tiles away is collected');assert.equal(s.gambit.drops.length,1,'the far chip stays');
  for(let i=0;i<g.GLINT.life;i++)g.updateGambit(s);assert.equal(s.gambit.drops.length,0,'it fades');
});

test('killing an alien in Star Gambit drops Glint, but a meteor kill does not', () => {
  const {g,s,px,py}=fresh();const a=foe(s,px+8,py),b=foe(s,px+9,py);
  e.killEnemy(s,s.enemies.indexOf(a));assert.equal(s.gambit.drops.length,1);
  e.killEnemy(s,s.enemies.indexOf(b),true);assert.equal(s.gambit.drops.length,1);
});

test('oxygen: the end of every third wave bills Glint (rising), a shortfall becomes debt that drains HP until paid', () => {
  const {g,s}=fresh();s.gambit.glint=1200;s.playerHP=100;
  const endWave=()=>{s.gambit.waveTicks=1;g.updateGambit(s);};
  endWave();endWave();assert.equal(s.gambit.glint,1200,'no bill after waves 1-2');
  endWave();assert.equal(s.gambit.wave,4);assert.equal(s.gambit.glint,200,'wave 3 bill: 1000');assert.equal(s.gambit.debt,0);
  assert.equal(g.oxygenBill(s),1500);endWave();endWave();endWave();assert.equal(s.gambit.glint,0);assert.equal(s.gambit.debt,1300,'1500 owed, 200 paid');
  assert.equal(g.oxygenDrain(1300),3);assert.equal(g.oxygenDrain(300),1);assert.equal(g.oxygenDrain(0),0);
  const hp=s.playerHP;for(let i=0;i<g.OXYGEN.drainEvery;i++){s.gameTick++;g.updateGambit(s);}assert.equal(hp-s.playerHP,3,'1300 owed drains 3 HP a second');
  s.gambit.glint=2000;g.updateGambit(s);assert.equal(s.gambit.debt,0);assert.equal(s.gambit.glint,700,'new Glint pays the debt first');
});

test('God Wave +1 ends the wave (with any due oxygen bill); Wave -1 steps back without a refund', () => {
  const {g,s}=fresh();s.gambit.glint=5000;
  g.godShiftWave(s,1);g.godShiftWave(s,1);assert.equal(s.gambit.wave,3);assert.equal(s.gambit.glint,5000);
  g.godShiftWave(s,1);assert.equal(s.gambit.wave,4);assert.equal(s.gambit.glint,4000,'the wave-3 bill');
  g.godShiftWave(s,-1);assert.equal(s.gambit.wave,3);assert.equal(s.gambit.glint,4000,'no refund');assert.equal(s.gambit.waveTicks,g.GAMBIT_WAVE_TICKS);
  s.gambit.wave=1;g.godShiftWave(s,-1);assert.equal(s.gambit.wave,1);
});
