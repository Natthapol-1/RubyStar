import { drawFieryKingModel } from './fiery-king-art';
import { drawSuitHelmet, drawSuitShell } from './player-suit-art';
import { drawSunBackdrop, drawSunFloorTile } from './sun-art';
import { ENEMY_CONFIGS, TILE_SIZE } from './constants';
import { ship } from './cutscene-art';
import { AREAS, PASSAGES, STRUCTURES, WORLD_SCALE, contains, isDocument, tileCenter, type Point, type Site } from './sun-explore-map';
import { COOLING, DISMISSED, TESTED, type SunExploreProgress } from './sun-explore-story';

const surfaces = [...AREAS, ...PASSAGES];
const noise = (x: number, y: number) => ((Math.imul(x + 273, 4387) ^ Math.imul(y + 311, 19391)) >>> 0) % 97;
const kingSize = Math.floor(TILE_SIZE * ENEMY_CONFIGS.fiery_king.bodyFraction);
const suits = {
  mara: ['#e28249', '#643336'], pell: ['#d8ae64', '#624736'],
  tavi: ['#73c5cb', '#24545e'], lyra: ['#e39ab8', '#733952'],
  cook: ['#c9a876', '#6b4850'], lunchGuest: ['#c99070', '#4d3d46'],
  scarlet: ['#ed6d64', '#782c40'], crimson: ['#b7597a', '#68294d'],
} as const;

export function drawSunExplore(
  ctx: CanvasRenderingContext2D, player: Point, facing: Point, sites: Site[], near: Site | undefined,
  progress: SunExploreProgress, tick: number, width: number, height: number, event?: 'test' | 'cool' | 'ring',
) {
  const cooling = progress.stage >= COOLING || event === 'cool';
  const heat = progress.stage >= TESTED || event === 'test';
  const dismissed = progress.stage >= DISMISSED || event === 'ring';
  const camX = Math.round(player.x - width / 2);
  const camY = Math.round(player.y - height / 2);
  drawSunBackdrop(ctx, { sun: null }, width, height, camX, camY, tick * .7);
  ctx.save();
  ctx.translate(-camX, -camY);
  ctx.scale(WORLD_SCALE, WORLD_SCALE);
  const box = (x: number, y: number, w: number, h: number, color: string) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const glow = (x: number, y: number, w: number, h: number, color: string, blur = 9) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    box(x, y, w, h, color);
    ctx.shadowBlur = 0;
  };
  const casing = (x: number, y: number, w: number, h: number, rim: string, inset: string) => {
    box(x + 2, y + 4, w, h, '#100b16');
    box(x, y, w, h, rim);
    box(x + 2, y + 2, w - 4, h - 4, inset);
    box(x + 3, y + 2, w - 6, 1, '#ffe0a55c');
    box(x + 3, y + h - 3, w - 6, 1, '#140c196f');
  };
  const left = camX / WORLD_SCALE, top = camY / WORLD_SCALE;
  const right = (camX + width) / WORLD_SCALE, bottom = (camY + height) / WORLD_SCALE;
  const visible = (x: number, y: number, w: number, h: number) =>
    x + w >= left - 35 && x <= right + 35 && y + h >= top - 35 && y <= bottom + 35;
  const plate = TILE_SIZE / WORLD_SCALE;
  const floorAt = (x: number, y: number) => surfaces.some(r => contains(r, x, y));

  // Service decks below the promenade are scenery and do not join its walking surface.
  const lowerDecks = [
    { x: -175, y: 510, w: 265, h: 345, color: '#6e4350' },
    { x: 1081, y: -150, w: 396, h: 225, color: '#35545d' },
    { x: 3040, y: 642, w: 315, h: 348, color: '#664454' },
    { x: 876, y: 1855, w: 454, h: 208, color: '#63434b' },
  ];
  for (const deck of lowerDecks) {
    const { x, y, w, h, color } = deck;
    if (!visible(x, y, w, h)) continue;
    box(x + 12, y + 18, w, h, '#110b17');
    box(x, y, w, h, '#231724');
    box(x + 3, y + 3, w - 6, 5, color);
    for (let dy = 21; dy < h - 15; dy += 39) {
      for (let dx = 13; dx < w - 15; dx += 51) {
        box(x + dx, y + dy, 47, 35, '#2d202c');
        box(x + dx + 3, y + dy + 2, 40, 1, '#765354');
        box(x + dx + 5, y + dy + 6, 2, 2, '#795753');
      }
    }
    for (let dx = 27; dx < w - 32; dx += 64) {
      box(x + dx, y + 36, 35, h - 68, '#170f1d');
      box(x + dx + 4, y + 40, 26, h - 78, color);
      box(x + dx + 8, y + 43, 2, h - 86, '#ae746267');
      for (let dy = 52; dy < h - 46; dy += 44) {
        box(x + dx + 5, y + dy, 25, 5, '#352532');
        box(x + dx + 8, y + dy + 6, 4, 3, '#db8e6766');
      }
    }
  }
  // Recessed station hull and support ribs beyond the walkable rail.
  for (const r of surfaces) {
    const overhang = 32;
    if (!visible(r.x - overhang, r.y - overhang, r.w + overhang * 2, r.h + overhang * 2)) continue;
    box(r.x - overhang, r.y - 16, r.w + overhang * 2, r.h + 48, '#16101b');
    box(r.x - 24, r.y - 10, r.w + 48, r.h + 34, '#2b1c27');
    box(r.x - 24, r.y + r.h + 18, r.w + 48, 3, '#482a31');
    for (let dx = 16; dx < r.w - 12; dx += 47) {
      const x = r.x + dx, y = r.y + r.h;
      if (!floorAt(x, y + 7)) {
        box(x, y + 1, 13, 47, '#100c17');
        box(x + 2, y + 7, 9, 32, '#39252e');
        box(x + 3, y + 11, 2, 25, '#71443c');
      }
    }
    for (let dy = 20; dy < r.h - 12; dy += 44) {
      const y = r.y + dy;
      for (const x of [r.x - 22, r.x + r.w + 13]) {
        if (floorAt(x, y)) continue;
        box(x, y, 9, 10, '#0e0b14');
        box(x + 2, y + 2, 5, 2, '#9b614a');
      }
    }
  }

  // Clip the original Sun plates across the entire station, including roads and catwalks.
  ctx.save();
  ctx.beginPath();
  for (const r of surfaces) if (visible(r.x, r.y, r.w, r.h)) ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.save();
  ctx.scale(1 / WORLD_SCALE, 1 / WORLD_SCALE);
  for (let y = Math.floor(top / plate); y <= bottom / plate; y++) {
    for (let x = Math.floor(left / plate); x <= right / plate; x++) {
      drawSunFloorTile(ctx, { sun: null }, x, y, x * TILE_SIZE, y * TILE_SIZE, tick);
    }
  }
  ctx.restore();

  for (const area of AREAS) if (visible(area.x, area.y, area.w, area.h)) {
    const { x, y, w, h, surface, color } = area;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, w - 4, h - 4);
    ctx.clip();
    box(x, y, w, h, color + '18');
    const xStart = Math.max(Math.floor(x / plate), Math.floor(left / plate));
    const yStart = Math.max(Math.floor(y / plate), Math.floor(top / plate));
    const xEnd = Math.min(x + w, right);
    const yEnd = Math.min(y + h, bottom);
    for (let ty = yStart; ty * plate < yEnd; ty++) {
      for (let tx = xStart; tx * plate < xEnd; tx++) {
        const px = tx * plate, py = ty * plate;
        const detail = noise(tx, ty);
        if (surface === 'forge') {
          if (ty % 6 === 3) {
            box(px + 2, py + 3, 20, 18, '#432825bb');
            for (let i = 0; i < 5; i++) box(px + 4 + i * 4, py + 6, 1, 11, '#c883515e');
          } else if (detail < 25) {
            box(px + 7, py + 13, 11, 2, '#160f14a0');
            box(px + 12, py + 15, 7, 1, '#a1593c77');
          }
        } else if (surface === 'reservoir') {
          box(px + 2, py + 2, 20, 20, detail < 38 ? '#3866755f' : '#2c485b52');
          if (tx % 5 === 2) box(px + 3, py, 2, 24, '#78d8cd71');
          if ((ty + tx) % 7 === 0) box(px + 9, py + 13, 12, 2, '#8bcac450');
        } else if (surface === 'bridge') {
          box(px + 2, py + 2, 20, 20, (tx + ty) % 2 ? '#82634345' : '#5e454255');
          if (ty % 5 === 0) box(px + 1, py + 5, 23, 2, '#b887555e');
          if (detail < 15) box(px + 10, py + 10, 4, 4, '#cea36a66');
        } else if (surface === 'ward') {
          for (let i = 0; i < 2; i++) {
            const stagger = (tx + ty + i) % 2 ? 3 : 9;
            box(px + 2, py + 3 + i * 11, 20, 8, detail > 48 ? '#6e465055' : '#8a5f5955');
            box(px + stagger, py + 3 + i * 11, 1, 8, '#261a2d88');
          }
        } else {
          box(px + 2, py + 2, 20, 20, detail < 55 ? '#1b1719a6' : '#3f2d2e82');
          box(px + (detail % 13), py + 10, 6, 2, '#a6795266');
          if (detail < 18 && !cooling) box(px + 10, py + 16, 3, 2, '#e38e507a');
        }
      }
    }
    ctx.restore();
  }
  for (const r of surfaces) {
    if (!visible(r.x, r.y, r.w, r.h)) continue;
    for (let dx = 0; dx < r.w; dx += 12) {
      const run = Math.min(12, r.w - dx);
      for (const edge of [-1, 1]) {
        const y = edge < 0 ? r.y : r.y + r.h;
        if (floorAt(r.x + dx + run / 2, y + edge * 2)) continue;
        box(r.x + dx, y + (edge < 0 ? 0 : -6), run, 6, '#100c14');
        box(r.x + dx, y + (edge < 0 ? 2 : -4), run, 2, '#ac704c');
      }
    }
    for (let dy = 0; dy < r.h; dy += 12) {
      const run = Math.min(12, r.h - dy);
      for (const edge of [-1, 1]) {
        const x = edge < 0 ? r.x : r.x + r.w;
        if (floorAt(x + edge * 2, r.y + dy + run / 2)) continue;
        box(x + (edge < 0 ? 0 : -6), r.y + dy, 6, run, '#100c14');
        box(x + (edge < 0 ? 2 : -4), r.y + dy, 2, run, '#ac704c');
      }
    }
  }
  ctx.restore();

  const pipe = (points: Point[], color: string, phase = false) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (a.y === b.y) {
        const x = Math.min(a.x, b.x), w = Math.abs(a.x - b.x);
        if (!visible(x, a.y - 7, w, 14)) continue;
        box(x - 5, a.y - 5, w + 10, 12, '#100d16');
        box(x - 2, a.y - 3, w + 4, 6, color);
        box(x, a.y - 3, w, 1, '#ffc1a166');
        for (let v = 20; v < w; v += 42) box(x + v, a.y - 6, 4, 12, '#554550');
        if (phase) glow(x + tick * 1.9 % w, a.y - 2, 8, 3, '#ffdc94');
      } else {
        const y = Math.min(a.y, b.y), h = Math.abs(a.y - b.y);
        if (!visible(a.x - 7, y, 14, h)) continue;
        box(a.x - 6, y - 4, 12, h + 8, '#100d16');
        box(a.x - 3, y - 2, 6, h + 4, color);
        box(a.x - 3, y, 1, h, '#ffc1a177');
        for (let v = 20; v < h; v += 42) box(a.x - 6, y + v, 12, 4, '#554550');
      }
    }
  };
  const path = (...coordinates: number[]): Point[] =>
    coordinates.filter((_, i) => i % 2 === 0).map((x, i) => ({
      x: tileCenter(x), y: tileCenter(coordinates[i * 2 + 1]),
    }));
  pipe(path(413,785,413,1187,799,1187,799,1217,1106,1217,1106,1250), '#8a5443');
  pipe(path(1106,1250,1167,1250,1167,835,1345,835,1345,755,1737,755,1737,820,2115,820,2115,1001,2227,1001),
    heat ? '#e37f48' : '#78564b', heat);
  pipe(path(1004,269,1004,292,1413,292,1413,279), '#427981');
  pipe(path(1204,292,1204,378,1396,378), '#427981');

  // Walk lanes, maintenance markings and vents are part of the playing surface.
  for (const area of AREAS) {
    for (let y = area.y + 36; y < area.y + area.h - 22; y += 64) {
      for (let x = area.x + 27; x < area.x + area.w - 35; x += 62) {
        if (!visible(x, y, 24, 12) || STRUCTURES.some(r => contains(r, x, y))) continue;
        const n = noise(x, y);
        if (n < 19) {
          box(x, y, 24, 10, '#17121b');
          box(x, y, 24, 2, '#715148');
          for (let i = 0; i < 5; i++) box(x + 3 + i * 4, y + 3, 2, 5, '#805e53');
        } else if (n < 46) {
          box(x, y, 11, 1, '#ac805c63');
          box(x, y, 1, 6, '#ac805c63');
          box(x + 12, y + 4, 2, 2, '#ad8b6c78');
        }
      }
    }
  }

  for (const r of STRUCTURES) {
    const {x,y,w,h,kind} = r;
    if (!visible(x, y, w, h)) continue;
    box(x + 5, y + 7, w + 4, h + 4, '#100913ad');
    box(x, y, w, h, '#14111b');
    box(x + 2, y + 2, w - 4, h - 7, '#332833');
    box(x + 4, y + 3, w - 8, 3, '#ac7b58');
    box(x + 4, y + h - 11, w - 8, 3, '#5d3b34');
    if (kind === 'forge') {
      for (let i = 0; i < 5; i++) {
        const bx = x + 14 + i * 54;
        box(bx, y + 20, 45, h - 42, '#5b393b');
        box(bx + 5, y + 24, 35, h - 50, '#21151d');
        box(bx + 10, y + 35, 25, h - 71, cooling ? '#4a2831' : '#92372b');
        glow(bx + 13, y + 43, 19, h - 87, cooling ? '#60343a' : Math.sin(tick * .07 + i) > 0 ? '#ffb355' : '#f8803d', 15);
        for (let j = 0; j < 4; j++) box(bx + 6, y + 43 + j * 22, 33, 4, '#473039');
      }
    } else if (kind === 'tank') {
      box(x + 12, y + 16, w - 24, h - 34, '#1d424d');
      box(x + 16, y + 21, w - 32, h - 44, '#2b656f');
      const waterline = y + 37 + Math.sin(tick * .045 + x) * 4;
      box(x + 17, waterline, w - 34, y + h - 20 - waterline, '#388996');
      glow(x + 17, waterline, w - 34, 2, '#8cdbd8', 7);
      for (let i = 0; i < 8; i++) {
        const age = (tick * .4 + i * 19) % (h - 61);
        box(x + 21 + (i * 31) % (w - 45), y + h - 24 - age, 3, 4, '#b9f5ea88');
      }
      for (let i = 0; i < 4; i++) box(x + 14 + i * (w - 28) / 3, y + 12, 4, h - 25, '#223441');
    } else if (kind === 'house') {
      box(x + 7, y + 11, w - 14, h - 33, noise(x,y) > 48 ? '#513447' : '#493341');
      for (let row = 17; row < h - 26; row += 11) box(x + 7, y + row, w - 14, 1, '#9d685d5c');
      box(x + 7, y + h - 29, w - 14, 8, '#8d544e');
      box(x + 14, y + h - 21, w - 28, 14, '#32232d');
      box(x + w / 2 - 10, y + h - 27, 20, 20, '#1c1720');
      for (const side of [24, w - 43]) {
        box(x + side - 3, y + h - 32, 22, 14, '#271a24');
        glow(x + side, y + h - 29, 16, 8, heat ? '#e9a46a' : '#ad6c54', 7);
        box(x + side + 7, y + h - 30, 2, 10, '#513a41');
      }
      box(x + 17, y + 14, 20, 12, '#706069');
      box(x + 18, y + 15, 18, 2, '#b18975');
    } else if (kind === 'counter') {
      box(x + 5, y + 6, w - 10, 12, '#9d684e');
      for (let i = 0; i < 4; i++) {
        const px = x + 12 + i * 25;
        box(px, y + 7, 16, 8, '#d8b89b');
        box(px + 4, y + 8, 8, 5, '#604039');
        box(px + 5, y + 9, 6, 2, '#bd804b');
      }
      for (let i = 0; i < 5; i++) box(x + 11 + i * 23, y + 20, 11, 2, '#d5906a');
    } else if (kind === 'dock') {
      for (let i = 0; i < 6; i++) {
        box(x + 8 + i * 18, y + 8, 7, 3, '#d78d53');
        box(x + 8 + i * 18, y + h - 12, 7, 3, '#d78d53');
      }
      ship(ctx, x + w / 2, y + h / 2, tick / 60, 0, -Math.PI / 2, .75);
    } else if (kind === 'garden') {
      box(x + 5, y + 7, w - 10, h - 19, '#261c28');
      for (let i = 14; i < w - 8; i += 15) {
        const z = 6 + noise(x + i, y) % 12;
        box(x + i, y + 16, 4, z + 9, '#9c5453');
        box(x + i - 4, y + 20, 6, 9, '#69344a');
        box(x + i + 3, y + 15, 6, 7, '#be7159');
        box(x + i + 4, y + 13, 3, 3, '#edaa68');
      }
    } else {
      for (let i = 9; i < w - 10; i += 18) {
        box(x + i, y + 12, 13, h - 27, '#1d1924');
        box(x + i + 2, y + 13, 3, h - 30, '#6b5252');
      }
      box(x + 9, y + h - 29, w - 18, 6, '#7a5b53');
      for (let i = 11; i < w - 11; i += 31) {
        box(x + i, y + h - 20, 3, 3, '#dba470');
      }
      if (kind === 'stack' || kind === 'exchanger') {
        for (let i = 0; i < (cooling ? 2 : 5); i++) {
          const age = (tick * .35 + i * 8 + x) % 43;
          ctx.globalAlpha = (1 - age / 43) * .22;
          box(x + w * .4 + Math.sin(age * .13) * 8, y - age, 9 + age * .4, 3 + age / 6, cooling ? '#a3c6c8' : '#f3a17e');
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const dx of [7, w - 10]) for (const dy of [8, h - 7]) box(x + dx, y + dy, 2, 2, '#c29776');
  }

  const suit = (x: number, y: number, dir: Point, colors: readonly [string, string], main = false) => {
    box(x - 10, y + 8, 20, 4, '#090711a5');
    const idle = tick + x * .13 + y * .089;
    const bob = main ? 0 : Math.round(Math.sin(idle * .071));
    const blink = !main && idle % 173 < 6;
    ctx.save();
    ctx.translate(Math.round(x * 2) / 2, Math.round(y * 2) / 2 + bob);
    ctx.scale(.5, .5);
    const size = main ? Math.floor(TILE_SIZE * .74) : 30;
    const [rim, panel] = colors;
    drawSuitShell(ctx, 0, 0, size, rim, panel, main ? '#eeee44' : rim, main ? 14 : 6);
    if (!main) {
      box(-11, -12, 6, 4, rim);
      box(6, -12, 5, 4, Math.sin(idle * .15) > .45 ? '#ffe5ac' : '#ae8566');
      box(-13, 9, 26, 2, '#ffdca06b');
    }
    drawSuitHelmet(ctx, 0, 0, size, dir.x, dir.y, rim, blink ? '#327788' : '#44ccff', main ? '#eeee44' : rim);
    ctx.restore();
  };
  if (!dismissed) {
    for (let i = 0; i < 7; i++) {
      const x = tileCenter(258 + i * 46), y = tileCenter(i % 2 ? 804 : 828);
      if (visible(x, y, 24, 28)) suit(x,y,{ x:0, y:1 }, ['#aa7f58','#52404a']);
    }
  }
  for (const site of sites) {
    const { x, y, kind, id } = site;
    if (!visible(x - 60, y - 40, 120, 80)) continue;
    if (kind === 'king' || kind === 'statue') {
      if (kind === 'statue') {
        casing(x - 29, y + 6, 58, 21, '#9e7350', '#443038');
        casing(x - 22, y + 4, 44, 9, '#ad8052', '#61443f');
        if (dismissed) box(x - 9, y + 16, 18, 5, '#ffe3a5');
      }
      ctx.save();
      ctx.translate(x, y - (kind === 'statue' ? 12 : 5));
      ctx.scale(1 / WORLD_SCALE, 1 / WORLD_SCALE);
      drawFieryKingModel(ctx, 0, 0, kingSize, kind === 'king' ? tick : 0, false, false, kind === 'statue');
      ctx.restore();
    } else if (kind === 'person') {
      suit(x, y, {x:0,y:1}, suits[id as keyof typeof suits]);
    } else if (kind === 'bell') {
      const shift = event === 'ring' ? Math.sin(tick * .3) * 4 : 0;
      casing(x - 24, y - 23, 48, 8, '#9e7350', '#41303b');
      casing(x - 24, y - 18, 7, 37, '#886049', '#302633');
      casing(x + 17, y - 18, 7, 37, '#886049', '#302633');
      const bellX = x + shift;
      casing(bellX - 9, y - 15, 18, 21, '#c59259', '#765041');
      box(bellX - 7, y - 11, 3, 17, '#e8b676');
      casing(bellX - 13, y + 2, 26, 7, '#dba575', '#8e5841');
      box(bellX - 2, y + 8, 4, 5, '#f1cc91');
    } else if (kind === 'wisp' || kind === 'spoon') {
      if (kind === 'spoon') {
        casing(x - 27, y + 10, 56, 8, '#805746', '#3b2b33');
        // Blackened steel, with worn metal showing at the raised lip and handle.
        box(x - 26, y - 5, 19, 21, '#17131d');
        box(x - 23, y - 9, 19, 24, '#17131d');
        box(x - 6, y + 1, 34, 9, '#17131d');
        box(x - 24, y - 4, 21, 15, '#86685b');
        box(x - 21, y - 7, 15, 21, '#86685b');
        box(x - 21, y - 3, 15, 12, '#2d242b');
        box(x - 19, y - 2, 11, 8, '#443139');
        box(x - 20, y - 6, 12, 2, '#c4a28b');
        box(x - 22, y - 3, 2, 9, '#b28c72');
        box(x - 3, y + 3, 28, 5, '#8c7065');
        box(x + 1, y + 3, 21, 1, '#be9c88');
        box(x + 21, y + 2, 5, 6, '#9d7e6d');
      } else {
        casing(x - 22, y - 2, 44, 17, '#755040', '#332129');
        box(x - 16, y + 6, 32, 4, '#544040');
      }
      const count = kind === 'wisp' ? (cooling ? 1 : 3) : dismissed ? 1 : 0;
      for (let i = 0; i < count; i++) {
        const wx = kind === 'spoon' ? x - 14 : x - 7 + i * 9;
        const wy = kind === 'spoon' ? y + Math.round(Math.sin(tick * .04)) : y - 5 + Math.sin(tick * .11 + i * 2) * 2;
        glow(wx - 3, wy - 2, 8, 9, '#ffb34f');
        box(wx - 1, wy, 4, 6, '#792a21');
        box(wx, wy - 1, 2, 4, '#fff4be');
      }
    } else if (isDocument(site)) {
      const ink = id === 'blueprint' ? '#28566b' : '#75523a';
      casing(x - 12, y - 13, 24, 28, '#8f6750', '#3e2932');
      box(x - 7, y - 9, 14, 19, id === 'blueprint' ? '#8dc9ca' : '#dcb787');
      box(x - 7, y - 9, 2, 19, '#f3d7a4aa');
      box(x - 4, y - 6, 8, 2, ink);
      for (let i = 0; i < 3; i++) box(x - 4, y - 1 + i * 3, 8 - (i % 2) * 2, 1, ink);
      box(x - 3, y - 12, 6, 4, '#b99973');
    } else {
      casing(x - 13, y - 10, 26, 21, '#987153', '#372633');
      if (kind === 'crown') {
        box(x - 9, y - 4, 18, 8, '#ebbe79');
        for (let i = 0; i < 3; i++) box(x - 9 + i * 7, y - 7, 4, 4, '#ffe0a0');
      } else if (kind === 'pipe' || kind === 'tube' || kind === 'lever') {
        box(x - 9, y - 4, 18, 6, '#a27358');
        box(x + 3, y - 9, 5, 9, cooling ? '#83cbc5' : '#d49766');
      } else {
        box(x - 8, y - 6, 16, 8, '#85605c');
        box(x - 6, y - 4, 11, 1, '#4d3540');
        box(x - 6, y - 1, 8, 1, '#4d3540');
        if (kind === 'socket') glow(x - 4, y - 6, 8, 8, heat ? '#ff6380' : '#a44860');
        if (kind === 'gauge') glow(x + 4, y - 5, 4, 4, cooling ? '#94dac4' : '#ff8766');
        if (kind === 'disc') glow(x - 3, y - 6, 6, 7, '#e9a9a8');
        if (kind === 'glove') box(x + 2, y - 5, 7, 5, '#b34e46');
      }
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const label = ctx.measureText(site.name).width;
    box(x - label / 2 - 3, y + 20, label + 6, 10, '#170e19dd');
    ctx.fillStyle = near?.id === id || isDocument(site) ? '#ffe6a7' : '#e9c4ab';
    ctx.fillText(site.name, x, y + 27);
  }
  suit(player.x / WORLD_SCALE, player.y / WORLD_SCALE, facing, ['#d8d870','#a0a040'], true);
  ctx.restore();
}
