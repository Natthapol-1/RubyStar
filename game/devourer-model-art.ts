// Shared approved Devourer silhouette, used by normal bodies and the convergence attack.
export function drawDevourerModel(ctx:CanvasRenderingContext2D,sx:number,sy:number,vSz:number,attacking=false,openMouth=false,vFlash=false,vHealFlash=false) {
    // Approved square pufferfish model. Ambient spores/aura/pool above stay unchanged.
    ctx.save(); ctx.translate(sx, sy);
    const modelScale = vSz / 50;
    ctx.scale(modelScale, modelScale);
    const part = (color: string, x: number, y: number, width: number, height: number) => {
      ctx.fillStyle = vFlash ? '#ffffff' : vHealFlash && color === '#7134a2' ? '#c8a0ff' : color;
      ctx.fillRect(x, y, width, height);
    };


 // Dark purple extensions inherit the body's violet glow, like King's shoulders and Queen's ornaments.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=9;
 part('#50206a',-31,-13,10,21);part('#50206a',21,-20,10,15);
 part('#50206a',-20,24,14,8);part('#50206a',8,24,17,5);ctx.restore();
 // Short rectangular side antennae give the silhouette a pufferfish rhythm.
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=7;
 for(const side of [-1,1]){
  ctx.save();ctx.scale(side,1);
  part('#7134a2',24,-20,12,5);part('#7134a2',24,-3,16,5);part('#7134a2',24,15,12,5);
  ctx.restore();
 }
 ctx.restore();
 ctx.shadowColor='#8e45c0';ctx.shadowBlur=9;part('#7134a2',-25,-25,50,50);ctx.shadowBlur=0;
 part('#32153e',-21,-21,42,42);part('#482153',-17,-16,34,32);
 // One large flat eye and a simple hungry mouth: no reflections, plates, or intricate shading.
 part('#9dd959',-8,-14,16,14);part('#18311b',attacking ? -1 : -3,-12,attacking ? 3 : 6,10);
 part('#19211b',-15,openMouth || vHealFlash ? 4 : 7,30,openMouth || vHealFlash ? 19 : attacking ? 15 : 11);
 for(const[x,h]of [[-12,7],[-5,5],[2,7],[9,5]])part('#c4ee8b',x,openMouth || vHealFlash ? 4 : 7,4,h);
 if(openMouth || vHealFlash)for(const x of [-10,-1,8])part('#c4ee8b',x,19,4,4);
 part('#78a647',-17,-3,3,3);part('#78a647',14,-6,3,2);part('#78a647',15,0,2,2);
 // Small swallowed-creature eyes sit inside the lopsided side chunk.
 part('#28402b',-29,-7,6,8);part('#b9d97c',-28,-5,2,2);part('#b9d97c',-25,-2,2,2);
 part('#432149',23,-16,6,6);part('#96be60',25,-15,2,2);
 ctx.save();ctx.shadowColor='#9945c7';ctx.shadowBlur=8;
 part('#7134a2',-18,-29,5,6);part('#7134a2',12,-31,6,7);ctx.restore();

    ctx.restore();

}
