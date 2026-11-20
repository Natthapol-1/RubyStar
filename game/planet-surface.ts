import { type Ctx, hash } from './cutscene-art';

type Planet = 'venus' | 'gaia' | 'moon' | 'jupiter' | 'saturn' | 'neptune';

function polygon(ctx: Ctx, points: readonly (readonly [number, number])[], color: string) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// An angular cloud belt bows across the facing hemisphere and tapers at the limbs.
function cloudBelt(ctx: Ctx, latitude: number, width: number, color: string, drift: number) {
  const edge = (side: number) => Array.from({ length: 19 }, (_, i) => {
    const x = (i - 9) / 9;
    const depth = Math.sqrt(1 - x * x);
    const ripple = Math.sin(x * 11 + drift) * .014 + Math.sin(x * 24 - drift * .6) * .008;
    return [x, latitude + depth * (.105 + ripple + side * width)] as const;
  });
  polygon(ctx, [...edge(-1), ...edge(1).reverse()], color);
}

function facet(ctx: Ctx, x: number, y: number, width: number, height: number, color: string) {
  polygon(ctx, [
    [x-width*.66,y-height], [x+width*.66,y-height], [x+width,y-height*.52],
    [x+width,y+height*.52], [x+width*.66,y+height], [x-width*.66,y+height],
    [x-width,y+height*.52], [x-width,y-height*.52],
  ], color);
}

function crater(ctx: Ctx, x: number, y: number, size: number) {
  const width = size * Math.sqrt(1 - x * x);
  facet(ctx, x, y, width, size * .72, '#e4c7f955');
  facet(ctx, x, y - size * .10, width * .79, size * .54, '#60477a');
  facet(ctx, x + width * .06, y + size * .06, width * .62, size * .35, '#8870aa');
}

/** Surface details use radius units. The caller clips them to the stepped globe. */
export function drawPlanetSurface(ctx: Ctx, id: Planet, r: number, t: number, rim: string, shade: string, accent: string) {
  ctx.save(); ctx.scale(r, r);
  ctx.fillStyle = rim; ctx.fillRect(-1.03, -1.03, 2.06, 2.06);
  if (id === 'moon') {
    facet(ctx, -.36, -.22, .30, .43, '#9479b555');
    facet(ctx, .42, .16, .41, .26, '#9b81bc88');
    crater(ctx, -.46, -.31, .17);
    crater(ctx, -.24, .35, .15);
    crater(ctx, -.72, .16, .10);
    crater(ctx, .12, -.56, .10);
    crater(ctx, .48, .13, .13);
    for (let i = 0; i < 20; i++) {
      const x = hash(i, 31) * 1.7 - .85, y = hash(i, 32) * 1.7 - .85;
      if (x*x + y*y < .88) crater(ctx, x, y, .014 + hash(i, 33) * .029);
    }
  } else if (id === 'gaia') {
    polygon(ctx, [[-.82,-.47],[-.57,-.61],[-.26,-.56],[-.16,-.39],[-.04,-.34],[-.17,-.22],[-.22,-.07],[-.47,-.13],[-.50,-.24],[-.72,-.28]], '#78b95e');
    polygon(ctx, [[-.46,-.12],[-.26,-.11],[-.21,.04],[-.04,.12],[-.07,.32],[-.24,.59],[-.36,.68],[-.37,.44],[-.50,.28]], '#69a74f');
    polygon(ctx, [[.13,-.43],[.39,-.55],[.70,-.43],[.84,-.28],[.70,-.18],[.73,.04],[.53,.01],[.39,-.14],[.27,-.09],[.21,-.24],[.06,-.24]], '#98c86a');
    polygon(ctx, [[.25,-.04],[.42,.04],[.47,.23],[.34,.43],[.18,.34],[.12,.14]], '#83b555');
    facet(ctx, .66, .48, .16, .09, '#8bbd60');
    facet(ctx, -.12, -.87, .45, .095, '#e6f4ec');
    facet(ctx, .06, .91, .48, .075, '#c9e7e4');
    cloudBelt(ctx, -.38, .027, '#e3f8fa7a', t * .65);
    cloudBelt(ctx, .17, .018, '#e6fbff55', t * .5 + 2);
    cloudBelt(ctx, .55, .030, '#d7f7ff65', t * .52 + 5);
  } else if (id === 'neptune') {
    // Low-contrast atmospheric currents sit beneath a few bright cloud wisps.
    cloudBelt(ctx, -.50, .055, '#b1def32a', t * .4);
    cloudBelt(ctx, .07, .10, '#244c8d35', t * .55);
    cloudBelt(ctx, .54, .067, '#83c3e329', t * .45 + 2);
    const drift = Math.sin(t * .7) * .045;
    ctx.save();
    ctx.translate(-.23 + drift, -.08);
    ctx.rotate(-.20);
    facet(ctx, 0, 0, .24, .116, '#396da9');
    facet(ctx, -.012, -.006, .193, .087, '#21467e');
    facet(ctx, -.038, .006, .113, .051, '#294f8a');
    polygon(ctx, [[-.10,.093],[-.01,.105],[.087,.074],[.17,.049],[.129,.112],[.049,.143],[-.043,.139]], '#e1f6ff');
    ctx.restore();
    ctx.translate(drift * 1.7, 0);
    polygon(ctx, [[-.59,-.41],[-.48,-.45],[-.28,-.47],[-.36,-.428],[-.49,-.397]], '#e2f6ffd6');
    polygon(ctx, [[.12,.33],[.26,.305],[.47,.265],[.42,.312],[.24,.35]], '#daf2ffc4');
    polygon(ctx, [[-.47,.47],[-.35,.45],[-.23,.405],[-.27,.451],[-.37,.485]], '#bde7fca0');
  } else {
    const palettes = {
      venus: ['#fff0bd', '#c9926f', '#efba8f', '#fff2ce'],
      jupiter: ['#f6d2a4', '#9e5943', '#f4b888', '#b97655'],
      saturn: ['#cef3e2', '#629e9b', '#a9dcd0', '#d8f8e5'],
    };
    const colors = palettes[id];
    for (let i = 0; i < 10; i++) {
      const latitude = -.86 + i * .181;
      cloudBelt(ctx, latitude, .023 + hash(i, 18) * .047, colors[i % colors.length], t * .65 + i * .8);
      cloudBelt(ctx, latitude + .047, .009, colors[(i + 2) % colors.length], t * .48 + i);
    }
    if (id === 'jupiter') {
      const x = .22 + Math.sin(t * .75) * .065, y = .28;
      facet(ctx, x, y, .30, .125, '#f6c29b');
      facet(ctx, x, y, .265, .094, '#a64c43');
      facet(ctx, x-.023, y-.011, .185, .062, '#d37759');
      facet(ctx, x-.062, y-.022, .098, .028, '#f2a880');
    }
  }

  // The off-center light and curved falloff make the day side read as a sphere.
  const light = ctx.createRadialGradient(-.45, -.40, .07, -.19, -.20, 1.26);
  light.addColorStop(0, (id === 'gaia' ? '#e5f8ff' : accent) + '75');
  light.addColorStop(.39, '#ffffff00');
  light.addColorStop(.65, shade + '30');
  light.addColorStop(.84, '#100c258a');
  light.addColorStop(1, '#07091bdf');
  ctx.fillStyle = light; ctx.fillRect(-1.03, -1.03, 2.06, 2.06);
  ctx.restore();
}
