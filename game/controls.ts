import {getProfile,isDesktop,updateProfile} from './profile';
export const DEFAULT_BINDINGS={
 moveUp:['KeyW','ArrowUp'],moveDown:['KeyS','ArrowDown'],moveLeft:['KeyA','ArrowLeft'],moveRight:['KeyD','ArrowRight'],
 laser:['Mouse0'],bullet:['Mouse2'],boost:['KeyR','ShiftLeft'],bomb:['KeyQ'],ruby:['KeyE'],heal:['Space'],teleport:['KeyX'],celestial:['KeyF'],mapSkill:['Mouse1'],
} as const;
export type ControlAction=keyof typeof DEFAULT_BINDINGS;
export const CONTROL_LABELS:Record<ControlAction,string>={moveUp:'MOVE UP',moveDown:'MOVE DOWN',moveLeft:'MOVE LEFT',moveRight:'MOVE RIGHT',laser:'LASER / CHARGE WAVE',bullet:'BULLETS',boost:'SPEED BOOST',bomb:'BOMB',ruby:'CARRY / PLACE RUBY',heal:'HEAL / STATION',teleport:'TELEPORT',celestial:'CELESTIAL SKILL',mapSkill:'MAP SPECIAL SKILL'};
const canonical:Record<ControlAction,string>={moveUp:'w',moveDown:'s',moveLeft:'a',moveRight:'d',laser:'k',bullet:'l',boost:'r',bomb:'q',ruby:'e',heal:' ',teleport:'x',celestial:'f',mapSkill:'c'};
export function bindings():Record<ControlAction,string[]>{const saved=getProfile().keyBindings;return Object.fromEntries(Object.entries(DEFAULT_BINDINGS).map(([action,codes])=>[action,(Array.isArray(saved?.[action])&&saved![action].every(code=>typeof code==='string')?saved![action]:[...codes])])) as Record<ControlAction,string[]>;}
export function controlForCode(code:string):ControlAction|undefined{return (Object.keys(DEFAULT_BINDINGS) as ControlAction[]).find(action=>bindings()[action].includes(code));}
export function gameKey(event:Pick<KeyboardEvent,'code'|'key'>){const action=controlForCode(event.code);return action?canonical[action]:event.key==='Escape'||/^[1-4]$/.test(event.key)?event.key:'';}
export function mouseControl(button:number){return controlForCode('Mouse'+button);}
export function keyLabel(code:string){return ({Mouse0:'LEFT CLICK',Mouse1:'MIDDLE CLICK',Mouse2:'RIGHT CLICK',ShiftLeft:'LEFT SHIFT',ShiftRight:'RIGHT SHIFT',Space:'SPACE',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'})[code]??code.replace(/^Key/,'').replace(/^Digit/,'');}
export function bindingLabel(action:ControlAction){const codes=bindings()[action];const shown=action.startsWith('move')&&codes.some(code=>!code.startsWith('Arrow'))?codes.filter(code=>!code.startsWith('Arrow')):codes;return shown.map(keyLabel).join(' / ')||'UNBOUND';}
export function setBinding(action:ControlAction,slot:number,code:string|null):string|null{
 const current=bindings();
 if(code){
  if(code.startsWith('Mouse')&&!/^Mouse[012]$/.test(code))return 'Use the left, middle or right mouse button.';
  if(['Escape','F3','F11','Tab','Enter','MetaLeft','MetaRight','AltLeft','AltRight'].includes(code))return 'That key is reserved.';
  if(code.startsWith('Mouse')&&action.startsWith('move'))return 'Movement needs a keyboard key.';
  for(const [other,codes]of Object.entries(current))if(codes.some((value,index)=>value===code&&(other!==action||index!==slot)))return `${keyLabel(code)} IS ALREADY USED BY ${CONTROL_LABELS[other as ControlAction]}.`;
 }
 const codes=[...current[action]];if(code)codes[slot]=code;else codes.splice(slot,1);current[action]=codes.filter(Boolean);
 if(isDesktop())updateProfile(p=>{p.keyBindings=current;});else{getProfile().keyBindings=current;try{localStorage.setItem('rubyStar.keys.v1',JSON.stringify({version:1,bindings:current}));}catch{}}
 if(typeof window!=='undefined')window.dispatchEvent(new Event('ruby-controls'));return null;
}
export function resetBindings(){if(isDesktop())updateProfile(p=>{delete p.keyBindings;});else{delete getProfile().keyBindings;try{localStorage.removeItem('rubyStar.keys.v1');}catch{}}if(typeof window!=='undefined')window.dispatchEvent(new Event('ruby-controls'));}

export function tutorialInstruction(id:string,fallback:string){
 const text:Record<string,string>={
 move:`Move with ${bindingLabel('moveUp')}, ${bindingLabel('moveLeft')}, ${bindingLabel('moveDown')} and ${bindingLabel('moveRight')}.`,
 laser:`${bindingLabel('laser')} fires lasers in four directions. Defeat the aliens.`,
 bullet:`${bindingLabel('bullet')} fires bullets. Hold to keep firing. Defeat the aliens.`,
 wave:`Hold ${bindingLabel('laser')} to charge a Wave that damages and pushes aliens back.`,
 speed:`Use ${bindingLabel('boost')} for a quick speed burst.`,
 bomb:`Use ${bindingLabel('bomb')} to drop a bomb, move away, then use it again to detonate.`,
 carry:`Near Ruby, use ${bindingLabel('ruby')} to carry or place it.`,
 heal:`Near Ruby or while carrying it, use ${bindingLabel('heal')} to heal you both. No aliens may be close.`,
 teleport:`Near a glowing pad, use ${bindingLabel('teleport')}, then select a room.`,
 celestial:`Bosses grant celestial skills. Use ${bindingLabel('celestial')} to cast Solar Flare.`,
 };return text[id]??fallback;
}
