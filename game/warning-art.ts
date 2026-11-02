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
    // Same axis-aligned bolt as the energy HUD and charged floor tiles.
    const points=[[11,2],[20,2],[20,6],[17,6],[17,9],[14,9],[14,12],[19,12],[19,15],[15,15],[15,18],[11,18],[11,22],[5,22],[5,15],[8,15],[8,11],[5,11],[5,8],[8,8],[8,5],[11,5]];
    ctx.save();ctx.translate(-8,-8);ctx.scale(2/3,2/3);ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
    ctx.fillStyle='#e9fffa';ctx.fillRect(12,3,5,2);ctx.restore();
  } else {
    // Preserve the original storm symbol inside the shared square badge.
    ctx.font='6px "Press Start 2P", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('///',0,0);
  }
  ctx.restore();
}
