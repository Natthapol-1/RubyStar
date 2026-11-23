// Gravity Hook uses flat cyan light sheets over the Maw world's violet shadows.
export function drawGravityHookMark(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,held:boolean,white=false,tick=0){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;ctx.lineJoin='miter';ctx.lineCap='butt';
  // Four flat square rails form a crisp gravity seal, leaving the body clear.
  const band=(radius:number,angle:number,alpha:number,color:string,width:number)=>{
    ctx.save();ctx.rotate(angle);ctx.beginPath();
    const points=held?[[-.22,-1],[1,-1],[1,.22]]:[[-.65,-1],[-1,-1],[-1,-.65]];
    for(let q=0;q<4;q++){
      for(let i=0;i<points.length;i++){
        let [px,py]=points[i];for(let k=0;k<q;k++){const old=px;px=-py;py=old;}
        if(i===0)ctx.moveTo(px*radius,py*radius);else ctx.lineTo(px*radius,py*radius);
      }
    }
    ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();
  };
  const turn=0,radius=r*(held?1.12:1.08);
  const col=white?'#f2fdff':'#6adbec';
  for(let sheet=7;sheet>=0;sheet--){const u=sheet/7;band(radius-u*12,turn,(held?.12:.07)*Math.pow(1-u,1.4),col,3);}
  band(radius,turn,.1,col,11);band(radius,turn,held?.7:.5,col,6);
  band(radius,turn,.95,white?'#ffffff':'#e0fbff',2.2);
  // A smaller aligned violet square closes in only while the body is held.
  if(held){band(radius*.8,0,.15,'#b39ce9',9);band(radius*.8,0,.65,white?'#ffffff':'#c8b2ef',3);}
  // Two restrained glints travel along the held rails, without extra symbols.
  if(held)for(let i=0;i<2;i++){
    const travel=(tick*.008+i*.5)%1,side=Math.floor(travel*4),along=(travel*4-side)*2-1;
    ctx.save();ctx.rotate(side*Math.PI/2);ctx.globalAlpha=.55*Math.pow(Math.sin((travel*4-side)*Math.PI),2);
    ctx.fillStyle='#effdff';ctx.fillRect(along*radius-4,-radius-1,8,2);ctx.restore();
  }
  ctx.restore();
}

// A sharp leading line and a continuous feathered sheet, following Sacred Halo's light material.
function drawHookSquareFront(ctx:CanvasRenderingContext2D,r:number,trail:number,alpha:number,inward:boolean,violet=false){
  const color=violet?'#b69de5':'#70dce9',step=trail/24;
  for(let i=23;i>=0;i--){
    const u=(i+.5)/24,extent=r+(inward?1:-1)*u*trail;
    ctx.globalAlpha=alpha*.3*Math.pow(1-u,1.5);ctx.strokeStyle=color;ctx.lineWidth=step+.15;
    ctx.strokeRect(-extent,-extent,extent*2,extent*2);
  }
  ctx.globalAlpha=alpha*.16;ctx.strokeStyle=color;ctx.lineWidth=14;ctx.strokeRect(-r,-r,r*2,r*2);
  ctx.globalAlpha=alpha*.85;ctx.strokeStyle=color;ctx.lineWidth=6;ctx.strokeRect(-r,-r,r*2,r*2);
  ctx.globalAlpha=alpha;ctx.strokeStyle='#ecfdff';ctx.lineWidth=2;ctx.strokeRect(-r,-r,r*2,r*2);
}

export function drawGravityHookCatch(ctx:CanvasRenderingContext2D,x:number,y:number,p:number,targetRadius:number){
  if(p<0||p>=1)return;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;ctx.lineJoin='miter';
  // Three light sheets collapse onto the same live held-frame radius.
  for(let layer=2;layer>=0;layer--){
    const q=Math.max(0,Math.min(1,(p-layer*.09)/(1-layer*.09))),remaining=Math.pow(1-q,2.5);
    const r=targetRadius+(28+layer*9)*remaining,fade=Math.min(1,(1-p)*5)*(1-layer*.2);
    drawHookSquareFront(ctx,r,Math.max(3,18*remaining),fade,true,layer===1);
  }
  // Small flat splinters are drawn into the seal, then dissolve as it settles.
  for(let i=0;i<24;i++){
    const side=i%4,along=-.8+Math.floor(i/4)*.32,remaining=Math.pow(1-p,2.5),distance=targetRadius+7+(20+i%5*8)*remaining;
    ctx.save();ctx.rotate(side*Math.PI/2);ctx.translate(along*targetRadius,-distance);
    ctx.globalAlpha=Math.sin(p*Math.PI)*.65;ctx.fillStyle=i%3?'#a7eff5':'#c5ade9';ctx.fillRect(-4,-1,8,2);
    if(i%3===0){ctx.globalAlpha=Math.sin(p*Math.PI)*.85;ctx.fillStyle='#ecfdff';ctx.fillRect(-3,0,7,1);ctx.fillRect(0,-3,1,7);}ctx.restore();
  }
  ctx.restore();
}

export function drawGravityHookPulse(ctx:CanvasRenderingContext2D,x:number,y:number,p:number,reach=75){
  if(p<0||p>=1)return;
  const fade=Math.pow(1-p,1.3),r=14+reach*(1-Math.pow(1-p,2));
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;ctx.lineJoin='miter';
  for(let layer=2;layer>=0;layer--){
    const q=p-layer*.085;if(q<0)continue;
    const front=14+reach*(1-(1-q)*(1-q));
    drawHookSquareFront(ctx,front,Math.min(32,front*.45),fade*(1-layer*.3),false,layer===1);
  }
  for(let i=0;i<36;i++){
    const a=i*2.39996,d=18+reach*(.5+i%4*.12)*p,size=i%3?3:5;
    ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d);ctx.rotate(a);ctx.globalAlpha=fade*.65;ctx.fillStyle=i%3?'#77dfed':'#c6a1ed';ctx.fillRect(-size,-1,size*2,2);
    if(i%4===0){ctx.globalAlpha=fade*.9;ctx.fillStyle='#edfeff';ctx.fillRect(-3,0,7,1);ctx.fillRect(0,-3,1,7);}ctx.restore();
  }
  ctx.restore();
}

export function drawGravityTether(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,tick:number,strain:number){
  const len=Math.hypot(x2-x1,y2-y1);if(len<1)return;
  ctx.save();ctx.translate(x1,y1);ctx.rotate(Math.atan2(y2-y1,x2-x1));ctx.shadowBlur=0;
  const sheet=ctx.createLinearGradient(0,-11,0,11);
  sheet.addColorStop(0,'#9a80de00');sheet.addColorStop(.22,'#8c9ddd18');sheet.addColorStop(.5,'#72e4ed66');sheet.addColorStop(.78,'#8c9ddd18');sheet.addColorStop(1,'#9a80de00');
  ctx.globalAlpha=1;ctx.fillStyle=sheet;ctx.fillRect(0,-11,len,22);
  ctx.globalAlpha=.7;ctx.fillStyle='#9ae8f6';ctx.fillRect(0,-1.5,len,3);
  ctx.globalAlpha=.95;ctx.fillStyle='#edfeff';ctx.fillRect(0,-.5,len,1);
  const count=Math.max(2,Math.floor(len/28));
  for(let i=0;i<count;i++){
    const u=((i/count+tick*.013*(1+strain))%1),px=len*u,fade=Math.sin(u*Math.PI);
    const wake=ctx.createLinearGradient(px-19,0,px,0);wake.addColorStop(0,'#68e4ff00');wake.addColorStop(1,'#c5faff');
    ctx.globalAlpha=fade*.65;ctx.fillStyle=wake;ctx.fillRect(Math.max(0,px-19),-4,Math.min(19,px),8);
    ctx.globalAlpha=fade*.9;ctx.fillStyle='#e6fbff';ctx.fillRect(px-1,-4,2,8);
  }
  // Small lights peel away from the current while the body is held.
  const motes=Math.min(18,Math.max(6,Math.floor(len/18)));
  for(let i=0;i<motes;i++){
    const life=(tick*.018+i/motes)%1,px=len*((i*.618+tick*.002)%1),py=(i%2?1:-1)*(5+life*17);
    ctx.globalAlpha=Math.sin(life*Math.PI)*.6;ctx.fillStyle=i%3?'#a5eaf3':'#c1a4eb';
    ctx.fillRect(Math.round(px)-1,Math.round(py)-1,3,3);
    if(i%4===0){ctx.globalAlpha=Math.sin(life*Math.PI)*.8;ctx.fillStyle='#edfeff';ctx.fillRect(px-3,py,7,1);ctx.fillRect(px,py-3,1,7);}
  }
  ctx.restore();
}
