// Player and Ruby silhouettes used by the challenge rule illustrations.
export function drawGuidePlayer(ctx:CanvasRenderingContext2D,x:number,y:number,size=20) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.shadowColor='#ffe14a';ctx.shadowBlur=4;ctx.fillStyle='#fff07a';ctx.fillRect(-size/2,-size/2,size,size);ctx.shadowBlur=0;
  ctx.fillStyle='#e8c93a';ctx.fillRect(-size/2+4,-size/2+4,size-8,size-8);
  ctx.fillStyle='#48c8ff';ctx.fillRect(-size/4,0,size/2,Math.round(size*.2));ctx.restore();
}
export function drawGuideRuby(ctx:CanvasRenderingContext2D,x:number,y:number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowColor='#ff4d7a';ctx.shadowBlur=5;
  ctx.fillStyle='#e8326a';ctx.fillRect(-11,-11,22,22);ctx.shadowBlur=0;
  ctx.fillStyle='#a8183f';ctx.fillRect(-7,-7,14,14);ctx.fillStyle='#ff6a8f';ctx.fillRect(-4,-4,8,8);
  ctx.fillStyle='#ffd0dc';ctx.fillRect(-9,-9,5,5);ctx.restore();
}
