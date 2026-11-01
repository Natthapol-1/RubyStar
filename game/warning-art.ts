// Canvas counterpart of the shared meteor countdown: one pixel-font line, name then seconds.
export function drawChamberCountdown(ctx:CanvasRenderingContext2D,cx:number,cy:number,label:string,ticks:number,color:string,compact=false) {
  ctx.save();ctx.globalAlpha=1;ctx.font=(compact?'5.5px':'13.6px')+' "Press Start 2P", monospace';
  ctx.textAlign='left';ctx.textBaseline='middle';
  const seconds=Math.max(0,Math.ceil(ticks/60))+'s',gap=compact?5:12,padding=compact?6:20;
  const labelWidth=ctx.measureText(label).width,timeWidth=ctx.measureText(seconds).width;
  const content=labelWidth+gap+timeWidth,w=content+padding*2,h=compact?18:42,x=Math.round(cx-w/2),y=Math.round(cy-h/2);
  ctx.fillStyle='rgba(5,0,0,.9)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=color;ctx.lineWidth=compact?1:2;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle=color;ctx.fillText(label,cx-content/2,cy);
  ctx.fillStyle='#fff0ce';ctx.fillText(seconds,cx-content/2+labelWidth+gap,cy);ctx.restore();
}

// Matching icon-only minimap badges. Countdown text belongs to the arena/HUD warnings.
export function drawMinimapHazard(ctx:CanvasRenderingContext2D,cx:number,cy:number,kind:'sunburst'|'discharge'|'storm',color:string) {
  ctx.save();ctx.translate(Math.round(cx),Math.round(cy));ctx.globalAlpha=1;ctx.shadowBlur=0;
  const width=kind==='storm'?30:20;
  ctx.fillStyle='#080d18';ctx.fillRect(-width/2,-10,width,20);
  ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(-width/2+.5,-9.5,width-1,19);
  ctx.fillStyle=color;
  if(kind==='sunburst') {
    ctx.fillRect(-4,-4,8,8);
    for(const side of [-1,1]){ctx.fillRect(-1,side<0?-8:6,2,2);ctx.fillRect(side<0?-8:6,-1,2,2);}
    for(const x of [-6,4])for(const y of [-6,4])ctx.fillRect(x,y,2,2);
    ctx.fillStyle='#fff8cf';ctx.fillRect(-2,-2,4,4);
  } else if(kind==='discharge') {
    ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5,1);ctx.lineTo(-1,1);ctx.lineTo(-3,8);ctx.lineTo(6,-2);ctx.lineTo(2,-2);ctx.lineTo(4,-8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e9fffa';ctx.fillRect(0,-6,2,3);
    ctx.fillStyle=color;ctx.fillRect(-8,-5,2,2);ctx.fillRect(6,5,2,2);
  } else {
    // Preserve the original storm symbol inside the shared square badge.
    ctx.font='6px "Press Start 2P", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('///',0,0);
  }
  ctx.restore();
}
