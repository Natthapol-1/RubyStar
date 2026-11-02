import {playUiSfx} from './ui-sfx';
import {BULLET_SPEED,TILE_SIZE,isBossType} from './constants';
import {damageEnemy,healPlayer,isFloorTile,skillAlienScale,type GameState,type Enemy} from './engine';
import {hasBlessing,type CelestialBlessing,type BuildZone} from './endless-builds';
export const RUBY_SAFE_TICKS = 180;
export const RUBY_DAMAGE_MULTIPLIER = 1.3;
export const RUBY_SPEED_MULTIPLIER = 1.15;
export const AMETHYST_SHOT_INTERVAL = 22.5;
export const AMETHYST_SHOT_DAMAGE = .275;
export type QueenBlessingDecoy={id:number;x:number;y:number;tileX:number;tileY:number;hp:number;shotAt:number};
export function playBlessingPassive(s:GameState,kind:CelestialBlessing,cooldown=30){
 const b=s.build,ready=b.gemPassiveReadyAt??={};
 if(s.gameTick<(ready[kind]??0))return;ready[kind]=s.gameTick+cooldown;
 if(b.gemPassiveLastTick===s.gameTick)return;b.gemPassiveLastTick=s.gameTick;playUiSfx('gemPassive');
}
export function playGemFieldHit(s:GameState){
 if(s.gameTick<(s.build.gemFieldSoundReadyAt??0))return;s.build.gemFieldSoundReadyAt=s.gameTick+30;playUiSfx('gemFieldHit');
}
export function solarBlessingReady(s:GameState){return hasBlessing(s,'fiery_king')&&(s.build.sunUntouchedTicks??0)>=RUBY_SAFE_TICKS;}
export function emeraldBlessingFull(s:GameState){return hasBlessing(s,'storm_reaper')&&(s.build.reaperHaste??[]).filter(until=>until>s.gameTick).length>=10;}
export function playerAttackTint(s:GameState,opal=false,powered=false):'opal'|'emerald'|'solar'|'amber'|undefined{return opal?'opal':emeraldBlessingFull(s)?'emerald':solarBlessingReady(s)?'solar':!powered&&hasBlessing(s,'blind_prayer')?'amber':undefined;}
export function blessingDamageMultiplier(s:GameState){return solarBlessingReady(s)?RUBY_DAMAGE_MULTIPLIER:1;}
export function blessingSpeedMultiplier(s:GameState){return (solarBlessingReady(s)?RUBY_SPEED_MULTIPLIER:1)*(1+(hasBlessing(s,'storm_reaper')?Math.min(10,(s.build.reaperHaste??[]).filter(t=>t>s.gameTick).length)*.04:0));}
export function blessingAttack(s:GameState,kind:'laser'|'bullet'|'wave'|'bomb'|'special'){
 const b=s.build;
 if(hasBlessing(s,'storm_reaper')){const active=(b.reaperHaste??[]).filter(t=>t>s.gameTick);b.reaperHaste=[...active,s.gameTick+180].slice(-10);if(active.length<10&&b.reaperHaste.length===10)playBlessingPassive(s,'storm_reaper');}
}
export function blessingLandedAttack(s:GameState,healing:number){
 if(!hasBlessing(s,'sea_chanter')||healing<=0)return;const b=s.build;
 if(s.gameTick>=(b.sapphireWindowAt??0)){b.sapphireWindowAt=s.gameTick+60;b.sapphireHealing=0;}
 const amount=Math.min(healing,4-(b.sapphireHealing??0));
 if(amount>0){b.sapphireHealing=(b.sapphireHealing??0)+amount;const before=s.playerHP;healPlayer(s,amount,false);if(s.playerHP>before){b.sapphireRegenUntil=s.gameTick+24;playBlessingPassive(s,'sea_chanter',60);}}
}

export function blessingHit(s:GameState,e:Enemy){
 if(!hasBlessing(s,'storm_reaper'))return;
 e.blessingReaperStacks=(e.blessingReaperUntil??0)>s.gameTick?Math.min(10,(e.blessingReaperStacks??0)+1):1;
 e.blessingReaperUntil=s.gameTick+180;
}
export function blessingEnemySlow(s:GameState,e:Enemy){return hasBlessing(s,'storm_reaper')&&(e.blessingReaperUntil??0)>s.gameTick?1-Math.min(isBossType(e.type)?.25:.5,(e.blessingReaperStacks??0)*(isBossType(e.type)?.025:.05)):1;}
function wardenShield(s:GameState,amount:number){
 if(!hasBlessing(s,'frost_warden')||s.gameTick<(s.build.wardenReadyAt??0))return;
 s.build.wardenReadyAt=s.gameTick+60;
 const before=s.playerShieldHP;s.playerShieldHP=Math.max(s.playerShieldHP,s.saturn ? s.playerShieldHP+amount : Math.min(60,s.playerShieldHP+amount));if(s.playerShieldHP>before){s.build.diamondShieldUntil=s.gameTick+30;playBlessingPassive(s,'frost_warden');}
 s.rewardEffects.push({target:'player',kind:'shield',ticks:45});
}
export function blessingHealed(s:GameState,actual:number){if(actual>0)wardenShield(s,4);}
export function blessingIncoming(s:GameState,amount:number,attacker?:Enemy){
 if(amount<=0)return;s.build.sunUntouchedTicks=0;blessingReflectIncoming(s,amount,attacker);
}
export function blessingReflectIncoming(s:GameState,amount:number,attacker?:Enemy){
 if(amount<=0||!hasBlessing(s,'aegis_sentinel')||s.venusVeilTicks>0||!attacker||attacker.hp<=0)return;
 const reflected=isBossType(attacker.type)?Math.min(amount,attacker.maxHp*.03):amount;
 damageEnemy(s,attacker,reflected,'reflection');playBlessingPassive(s,'aegis_sentinel');s.build.pearlReflectUntil=s.gameTick+42;s.build.pearlReflectTarget={x:attacker.x,y:attacker.y,until:s.gameTick+42};
 s.venusReflects.push({fromX:s.playerX,fromY:s.playerY,toX:attacker.x,toY:attacker.y,ticks:18});if(s.venusReflects.length>24)s.venusReflects.shift();
}
export function blessingAfterHit(s:GameState,amount:number){if(amount>0&&s.playerHP>0)wardenShield(s,Math.max(2,Math.min(12,amount*.3)));}
export function leaveQueenBlessingDecoy(s:GameState,x=s.playerX,y=s.playerY){
 if(!hasBlessing(s,'splitter_queen'))return;
 const decoys=s.build.queenDecoys??=[];const tileX=Math.floor(x/TILE_SIZE),tileY=Math.floor(y/TILE_SIZE);
 if(!isFloorTile(s.map,tileX,tileY))return;
 // A burst can come from energy and the same bomb/cast on one tick: leave one echo at that spot.
 if(decoys.some(d=>d.tileX===tileX&&d.tileY===tileY&&d.shotAt===s.gameTick))return;
 decoys.push({id:s.build.nextQueenId=(s.build.nextQueenId??0)+1,x:(tileX+.5)*TILE_SIZE,y:(tileY+.5)*TILE_SIZE,tileX,tileY,hp:18,shotAt:s.gameTick});
 
 playBlessingPassive(s,'splitter_queen');
 if(decoys.length>3)decoys.shift();s.enemies.forEach(e=>e.pathTimer=0);
}
export function growthContainsTile(z:BuildZone,tx:number,ty:number){return Math.abs(tx-Math.floor(z.x/TILE_SIZE))<=1&&Math.abs(ty-Math.floor(z.y/TILE_SIZE))<=1;}
export function updateBlessingEffects(s:GameState){
 const b=s.build;

 const rubyWasReady=solarBlessingReady(s);
 b.sunUntouchedTicks=hasBlessing(s,'fiery_king')?Math.min(RUBY_SAFE_TICKS,(b.sunUntouchedTicks??0)+1):0;
 if(!rubyWasReady&&solarBlessingReady(s))playBlessingPassive(s,'fiery_king');
 if(b.reaperHaste)b.reaperHaste=hasBlessing(s,'storm_reaper')?b.reaperHaste.filter(t=>t>s.gameTick):[];
 if(!hasBlessing(s,'splitter_queen'))b.queenDecoys=[];
 let decoySoundPlayed=false;
 for(const d of b.queenDecoys??[]){
   if(d.hp<=0||s.gameTick<d.shotAt)continue;
   const target=s.enemies.filter(e=>e.hp>0&&!e.twin?.downedTicks&&Math.hypot(e.x-d.x,e.y-d.y)<=8*TILE_SIZE).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];
   if(target){const dx=target.x-d.x,dy=target.y-d.y,len=Math.hypot(dx,dy)||1;s.laserBullets.push({x:d.x/TILE_SIZE,y:d.y/TILE_SIZE,dx:dx/len*BULLET_SPEED,dy:dy/len*BULLET_SPEED,powered:false,ticks:0,blessingDecoy:true,blessingDamage:AMETHYST_SHOT_DAMAGE*skillAlienScale(s)});d.shotAt=Math.max(d.shotAt,s.gameTick-.5)+AMETHYST_SHOT_INTERVAL;if(!decoySoundPlayed&&s.gameTick>=(b.gemDecoySoundReadyAt??0)&&b.gemPassiveLastTick!==s.gameTick){playUiSfx('gemDecoyShot');b.gemDecoySoundReadyAt=s.gameTick+30;decoySoundPlayed=true;}}
 }
 if(hasBlessing(s,'thorn_weaver')){
   const tile=`${s.playerTileX},${s.playerTileY}`;
   if(b.weaverTile!==undefined&&b.weaverTile!==tile&&isFloorTile(s.map,s.playerTileX,s.playerTileY)){
     const x=(s.playerTileX+.5)*TILE_SIZE,y=(s.playerTileY+.5)*TILE_SIZE;
     const existing=b.zones.find(z=>z.kind==='growth'&&z.x===x&&z.y===y);
     
     if(existing)existing.ticks=240;else{const zones=b.zones.filter(z=>z.kind==='growth');if(zones.length>=12)b.zones.splice(b.zones.indexOf(zones[0]),1);b.zones.push({x,y,radius:1.5,ticks:240,damage:5,kind:'growth'});}
   }
   b.weaverTile=tile;
 }else b.weaverTile=undefined;
 for(const enemy of [...s.enemies])if(enemy.hp>0&&isFloorTile(s.map,enemy.tileX,enemy.tileY)&&b.zones.some(z=>z.kind==='growth'&&z.ticks>0&&growthContainsTile(z,enemy.tileX,enemy.tileY))){
   const slow=isBossType(enemy.type)?.85:.7;enemy.buildSlow=(enemy.buildSlowUntil??0)>s.gameTick?Math.min(enemy.buildSlow??1,slow):slow;enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,s.gameTick+2);
   if(s.gameTick%30===0){const hp=enemy.hp,shield=enemy.icyShieldHP;damageEnemy(s,enemy,2.5,'special');if(enemy.hp<hp||enemy.icyShieldHP<shield)playGemFieldHit(s);}
 }
}
export function addStarEnergy(s:GameState,amount:number,accelerate=true){
 const previous=s.starEnergy;s.starEnergy=Math.min(100,s.starEnergy+Math.max(0,amount)*(accelerate&&hasBlessing(s,'blind_prayer')?1.35:1));
 if(hasBlessing(s,'blind_prayer')&&s.starEnergy>previous){s.build.amberRefreshUntil=s.gameTick+36;playBlessingPassive(s,'blind_prayer');}
 if(hasBlessing(s,'blind_prayer')&&previous<100&&s.starEnergy>=100){s.laserCooldown=s.bulletCooldown=s.waveCooldown=s.speedCooldown=s.bombCooldown=s.rubyHealCooldown=0;s.build.siriusRefreshSerial=(s.build.siriusRefreshSerial??0)+1;s.build.amberRefreshUntil=s.gameTick+48;playBlessingPassive(s,'blind_prayer');s.rewardEffects.push({target:'player',kind:'restore',ticks:45});}
}
export function blessingDeath(s:GameState,e:Enemy){
 if(!hasBlessing(s,'devourer')||Math.random()>=.5)return;
 createObsidianWell(s,e);
}
function createObsidianWell(s:GameState,e:Enemy){
 const fields=s.build.zones.filter(z=>z.kind==='void');if(fields.length>=4)s.build.zones.splice(s.build.zones.indexOf(fields[0]),1);
 
 playBlessingPassive(s,'devourer');
 s.build.zones.push({x:(e.tileX+.5)*TILE_SIZE,y:(e.tileY+.5)*TILE_SIZE,radius:4,ticks:240,damage:6,kind:'void'});
}
export function rubyBlessingCopy(s:GameState){
 if(!hasBlessing(s,'astral_twins')||Math.random()>=.45)return null;
 const tileX=s.rubyTileX>=0?s.rubyTileX:s.playerTileX,tileY=s.rubyTileY>=0?s.rubyTileY:s.playerTileY;
 
 playBlessingPassive(s,'astral_twins');
 s.build.opalFlash={x:(tileX+.5)*TILE_SIZE,y:(tileY+.5)*TILE_SIZE,until:s.gameTick+18};
 return {tileX,tileY,mult:1};
}

export function obsidianBossHit(s:GameState,e:Enemy){
 if(!hasBlessing(s,'devourer')||!isBossType(e.type)||e.hp<=0||s.gameTick<(s.build.obsidianBossReadyAt??0))return;
 const b=s.build;
 b.obsidianBossHits=(b.obsidianBossHits??[]).filter(hit=>hit.enemyId===e.id&&hit.tick>s.gameTick-180);
 b.obsidianBossHits.push({enemyId:e.id,tick:s.gameTick});
 if(b.obsidianBossHits.length>=10){b.obsidianBossHits=[];b.obsidianBossReadyAt=s.gameTick+360;createObsidianWell(s,e);}
}
