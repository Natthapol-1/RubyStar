import type { GameState } from './engine';
import { getProfile,isDesktop,updateProfile,recordStage } from './profile';
export function observeDiscoveries(state:GameState){
 if(!isDesktop()||state.mode==='tutorial')return;
 recordStage(state);
 const p=getProfile(),enemies=state.enemies.map(e=>e.type),skills=state.specialSkill?[state.specialSkill]:[];
 if(enemies.some(e=>!p.encountered.includes(e))||state.constellations.some(c=>!p.constellations.includes(c))||skills.some(s=>!p.skills.includes(s))){updateProfile(p=>{p.encountered=Array.from(new Set([...p.encountered,...enemies]));p.constellations=Array.from(new Set([...p.constellations,...state.constellations]));p.skills=Array.from(new Set([...p.skills,...skills]));});}
}
export class FrameMeter {
 samples:{time:number;delta:number}[]=[];last=0;
 draw(ctx:CanvasRenderingContext2D,time:number,enabled:boolean){
  const delta=this.last?time-this.last:0;this.last=time;if(delta>0&&delta<1000)this.samples.push({time,delta});
  while(this.samples.length&&this.samples[0].time<time-5000)this.samples.shift();
  if(!enabled||!delta)return;
  const average=this.samples.reduce((sum,s)=>sum+s.delta,0)/this.samples.length;
  ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.lineWidth=1;ctx.fillStyle='#080d1aee';ctx.fillRect(8,ctx.canvas.height-60,250,52);ctx.strokeStyle='#7fd7ff';ctx.strokeRect(8,ctx.canvas.height-60,250,52);ctx.font='12px monospace';ctx.fillStyle='#b9eaff';ctx.fillText(`FPS ${(1000/delta).toFixed(0)} · 5s ${(1000/average).toFixed(0)}`,18,ctx.canvas.height-38);ctx.fillText(`Frame ${delta.toFixed(2)} ms · F3`,18,ctx.canvas.height-19);ctx.restore();
 }
}
