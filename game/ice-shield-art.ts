export function drawSaturnShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  const extent=Math.ceil(radius/4)*4,pulse=.75+.25*Math.abs(Math.sin(tick*.055));
  // A faceted turquoise ward, with sharp steps and a dim translucent interior.
  for(let py=-extent;py<=extent;py+=4)for(let px=-extent;px<=extent;px+=4){
    const ax=Math.abs(px),ay=Math.abs(py),edge=Math.max(ax,ay)+Math.min(ax,ay)*.4;
    if(edge>extent)continue;
    const rim=edge>extent-4;
    ctx.globalAlpha=rim?pulse*(py<0?.5:.8):.035;
    ctx.fillStyle=rim?(py<0?'#67b8aa':'#b6f8e4'):'#76cbbb';ctx.fillRect(px-2,py-2,4,4);
  }
  // Moving orbit lights carry the Saturn identity without blurring the shell.
  for(let i=0;i<4;i++){
    const angle=tick*.025+i*Math.PI/2;
    const px=Math.round(Math.cos(angle)*(extent+6)/3)*3,py=Math.round(Math.sin(angle)*(extent+6)*.55/3)*3;
    ctx.globalAlpha=.55+.25*Math.sin(angle)**2;ctx.shadowColor='#76cbbb';ctx.shadowBlur=6;
    ctx.fillStyle='#dbfff2';ctx.fillRect(px-2,py-2,4,4);
  }
  ctx.restore();
}

export function drawMobIceShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tick: number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const alpha=ctx.globalAlpha,pulse=.75+.25*Math.abs(Math.sin(tick*.15)),r=Math.round(radius);
  const hex=(reach:number)=>{ctx.beginPath();for(let i=0;i<6;i++){const angle=-Math.PI/2+i*Math.PI/3,px=Math.cos(angle)*reach,py=Math.sin(angle)*reach;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();};
  hex(r);ctx.globalAlpha=alpha*.07*pulse;ctx.fillStyle='#a6eaff';ctx.fill();
  // One broad white band, edged in cyan on both sides, as in the alien reference.
  ctx.globalAlpha=alpha*pulse;ctx.strokeStyle='#9de7ff';ctx.shadowColor='#aaeeff';ctx.shadowBlur=8;ctx.lineWidth=7;ctx.lineJoin='miter';ctx.stroke();
  ctx.strokeStyle='#efffff';ctx.shadowBlur=2;ctx.lineWidth=4;ctx.stroke();
  ctx.shadowBlur=3;ctx.fillStyle='#eaffff';
  for(let i=0;i<4;i++){const angle=tick*.018+i*Math.PI/2;ctx.globalAlpha=alpha*(.45+.2*Math.sin(angle)**2);const px=Math.round(Math.cos(angle)*(r+4)),py=Math.round(Math.sin(angle)*(r+4));ctx.fillRect(px-1,py-1,3,3);}
  ctx.restore();
}
