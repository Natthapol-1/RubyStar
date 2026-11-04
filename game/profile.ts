import type { BossType } from './constants';
import type { GameState } from './engine';
export interface Profile {
  keyBindings?:Record<string,string[]>;
  version: 1; tutorialCompleted: boolean;
  defeated: BossType[]; completed: BossType[]; encountered: string[]; constellations: string[]; skills: string[];
  highestEndless: number;
  highestAscension?: number;
  settings: { music: number; attack: number; effects: number };
  resumes: Record<string, { version: 1; mode: string; trialId?: string; savedAt: string; state: GameState }>;
}
interface DesktopBridge {
  load(): Promise<{data:unknown;error:string|null}>; save(data:Profile):Promise<boolean>;
  fullscreen():Promise<boolean>;quit():Promise<void>;onClosing(callback:()=>void):()=>void;closeReady(saved?:boolean):void;
}
interface ProfileSession {profile:Profile;pending?:ReturnType<typeof setTimeout>;writing:Promise<boolean>;error:string;protectedSave:boolean}
declare global { interface Window { rubyDesktop?: DesktopBridge; rubyProfileSession?:ProfileSession } }
export const emptyProfile = ():Profile => ({version:1,tutorialCompleted:false,defeated:[],completed:[],encountered:[],constellations:[],skills:[],highestEndless:0,settings:{music:1,attack:1,effects:1},resumes:{}});
const createSession=():ProfileSession=>({profile:emptyProfile(),writing:Promise.resolve(true),error:'',protectedSave:false});
// Keep a single session across development module replacement and lazy route bundles.
const session=typeof window==='undefined'?createSession():(window.rubyProfileSession??=createSession());
const profile=session.profile;
export function isDesktop(){return typeof window!=='undefined'&&!!window.rubyDesktop;}
export function getProfile(){return profile;}
export function saveError(){return session.error;}
function signal(){if(typeof window!=='undefined')window.dispatchEvent(new Event('ruby-profile'));}
export function updateProfile(change:(data:Profile)=>void){if(!isDesktop()||session.protectedSave)return;change(profile);signal();clearTimeout(session.pending);session.pending=setTimeout(()=>{void flushProfile();},400);}
export async function flushProfile(){
  clearTimeout(session.pending);if(!isDesktop()||session.protectedSave)return true;
  const snapshot=JSON.parse(JSON.stringify(profile));
  session.writing=session.writing.catch(()=>false).then(async()=>{
    try{await window.rubyDesktop!.save(snapshot);if(session.error){session.error='';signal();}return true;}
    catch{session.error='Save failed. Check available disk space and folder access. Your previous save is retained.';signal();return false;}
  });
  return await session.writing;
}
export async function loadProfile(){
  try{const result=await window.rubyDesktop!.load();session.error=result.error??'';
    if(result.data){const data=result.data as Profile;
      if(data.version!==1||!Array.isArray(data.defeated)||!Array.isArray(data.completed)||!Array.isArray(data.encountered)||!Array.isArray(data.constellations)||!Array.isArray(data.skills)||[data.defeated,data.completed,data.encountered,data.constellations,data.skills].some(list=>list.some(value=>typeof value!=='string'))||typeof data.tutorialCompleted!=='boolean'||!Number.isFinite(data.highestEndless)||(data.highestAscension!==undefined&&(!Number.isFinite(data.highestAscension)||data.highestAscension<0))||!data.settings||['music','attack','effects'].some(key=>typeof data.settings[key as keyof Profile['settings']]!=='number')||!data.resumes||typeof data.resumes!=='object'||Array.isArray(data.resumes)) {session.protectedSave=true;session.error='Unrecognized save data. Saving is disabled to preserve the file.';}
      else {
        Object.assign(profile,{...emptyProfile(),...data,settings:{...emptyProfile().settings,...data.settings}});
        const run=profile.resumes.endless?.state;
        const savedStage=run&&(run.mode==='endless'||run.mode==='ascension')&&Number.isFinite(run.bossesKilled)?run.bossesKilled:0;
        const highest=Math.max(profile.highestEndless,profile.highestAscension??0,savedStage);
        const migrated=highest!==profile.highestEndless||profile.highestAscension!==undefined;
        profile.highestEndless=highest;delete profile.highestAscension;
        if(migrated)session.pending=setTimeout(()=>void flushProfile(),400);
      }
    }else if(session.error.includes('newer'))session.protectedSave=true;
    else {try{if(localStorage.getItem('rubyStar.music')==='off')profile.settings.music=0;}catch{}}
  }catch{session.protectedSave=true;session.error='Unable to load the save. Saving is disabled to protect existing data.';}
  signal();
}
export function recordBoss(boss:BossType,state:GameState){
  if(state.mode==='tutorial')return;
  updateProfile(p=>{
    if(state.mode==='endless'&&!p.defeated.includes(boss))p.defeated.push(boss);
    if(state.mode==='endless'||state.mode==='ascension')p.highestEndless=Math.max(p.highestEndless,state.bossesKilled);
    if(state.trial&&!state.trial.mapOnly&&!p.completed.includes(boss)){p.completed.push(boss);state.gemstoneReward=boss;}
  });
}
export function canEnter(mode:string,boss?:BossType){return !isDesktop()||(mode==='tutorial'?true:!profile.tutorialCompleted?false:mode==='ascension'?profile.highestEndless>=10:mode==='trial'?!!boss&&profile.defeated.includes(boss):true);}
export function resumeKey(mode:string,trialId?:string){return mode==='endless'||mode==='ascension'?'endless':trialId??mode;}
export function saveRun(state:GameState,trialId?:string){
  if(state.trial?.mapOnly)return;
  if(state.mode==='tutorial'&&profile.tutorialCompleted){updateProfile(p=>{delete p.resumes.tutorial;});return;}
  const copy=JSON.parse(JSON.stringify(state)) as GameState;
  copy.playerQueuedDirX=copy.playerQueuedDirY=0;
  if(copy.sun)copy.sun.charging=false;
  updateProfile(p=>{const key=resumeKey(state.mode,trialId);if(state.gamePhase==='lost'||state.gamePhase==='won')delete p.resumes[key];else p.resumes[key]={version:1,mode:state.mode,trialId,savedAt:new Date().toISOString(),state:copy};});
}
export function restoreRun(mode:string,trialId?:string):GameState|null{
  const entry=profile.resumes[resumeKey(mode,trialId)];if(!entry||entry.version!==1)return null;
  const s=entry.state;
  if(trialId==='saturn'&&!s?.saturn)return null;
  if(!s||!Array.isArray(s.map)||s.map.length!==51||!s.map.every(row=>Array.isArray(row)&&row.length===51)||!Array.isArray(s.enemies)||!s.build||!s.ambientEvents||!Number.isFinite(s.playerHP)||!Number.isFinite(s.gameTick)||!['playing','teleporting','laserTarget','constellation','blessing','skillChoice'].includes(s.gamePhase))return null;
  const arrays=['resources','frostIceTiles','laserBeams','laserBullets','waveEffects','bombBlasts','lightningArcs','slashEffects','deathParticles','rewardEffects','prayerWaves','thornPatches','encounterEffects','seaSongWaves','seaSongBursts','specialEffects','venusReflects','teleportDestOptions','constellations','constellationChoices','bossPool'];
  const buildArrays=['blessings','blessingChoices','zones','echoes','impacts'];
  if(arrays.some(key=>!Array.isArray((s as unknown as Record<string,unknown>)[key]))||buildArrays.some(key=>!Array.isArray((s.build as unknown as Record<string,unknown>)[key])))return null;
  if(s.enemies.some(enemy=>!enemy||!Array.isArray(enemy.path)||!Number.isFinite(enemy.hp)||!Number.isFinite(enemy.x)||!Number.isFinite(enemy.y)||typeof enemy.type!=='string'))return null;
  if(!['endless','ascension','tutorial','trial'].includes(entry.mode)||s.mode!==entry.mode)return null;
  if((trialId??null)!==(entry.trialId??null))return null;
  if(s.sapphireHitEffects!==undefined&&!Array.isArray(s.sapphireHitEffects))return null;
  const restored=JSON.parse(JSON.stringify(s)) as GameState;restored.sapphireHitEffects??=[];
  if(restored.saturn){restored.saturn.charging=false;restored.saturn.charge=0;}
  return restored;
}
export function loadWebSettings(){
 if(typeof window==='undefined')return;
 try{const keys=JSON.parse(localStorage.getItem('rubyStar.keys.v1')??'null');if(keys?.version===1&&keys.bindings&&Object.values(keys.bindings).every(value=>Array.isArray(value)&&value.every(code=>typeof code==='string')))profile.keyBindings=keys.bindings;}catch{}
 try{const raw=localStorage.getItem('rubyStar.audio.v1');if(raw){const data=JSON.parse(raw);if(data.version===1)for(const key of ['music','attack','effects'] as const)if(Number.isFinite(data[key]))profile.settings[key]=Math.max(0,Math.min(1,data[key]));}else if(localStorage.getItem('rubyStar.music')==='off')profile.settings.music=0;}catch{}
}
export function setAudioPreference(channel:keyof Profile['settings'],volume:number){
 const value=Math.max(0,Math.min(1,volume));
 if(isDesktop())updateProfile(p=>{p.settings[channel]=value;});
 else{profile.settings[channel]=value;try{localStorage.setItem('rubyStar.audio.v1',JSON.stringify({version:1,...profile.settings}));localStorage.setItem('rubyStar.music',profile.settings.music>0?'on':'off');}catch{}}
 if(typeof window!=='undefined')window.dispatchEvent(new Event('ruby-audio'));
}

export function highestStage(mode:string){return mode==='endless'||mode==='ascension'?profile.highestEndless:0;}
export function recordStage(state:GameState){if((state.mode==='endless'||state.mode==='ascension')&&state.bossesKilled>highestStage(state.mode))updateProfile(p=>{p.highestEndless=state.bossesKilled;});}
